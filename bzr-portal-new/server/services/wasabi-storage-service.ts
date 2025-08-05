import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { supabase } from '../lib/supabase';

// Tipovi za objekte i rezultate
interface WasabiFile {
  Key: string;
  LastModified?: Date;
  Size?: number;
  ETag?: string;
  IsKnowledgeBase?: boolean;
}

interface StorageInfo {
  used: number;
  base: number;
  additional: number;
  total: number;
  percentage: number;
}

// Konfiguracija Wasabi servisa
// Prema dokumentaciji: https://docs.wasabi.com/v1/docs/service-urls-for-wasabis-storage-regions
const WASABI_USER_DOCUMENTS_BUCKET = process.env.WASABI_USER_DOCUMENTS_BUCKET || 'bzr-user-documents-bucket';
const WASABI_KNOWLEDGE_BASE_BUCKET = process.env.WASABI_KNOWLEDGE_BASE_BUCKET || 'bzr-knowledge-base-bucket';
const WASABI_ADMIN_DOCUMENTS_BUCKET = process.env.WASABI_ADMIN_DOCUMENTS_BUCKET || 'bzr-admin-documents-bucket';
const WASABI_REGION = 'eu-west-2';

// Za Path-Style URL (preporučeno za SDK integracije)
const WASABI_ENDPOINT = 'https://s3.eu-west-2.wasabisys.com';

// Alternativna opcija za Virtual-Host-Style URL:
// const WASABI_ENDPOINT = undefined; // Koristi default S3 protokol za formiranje URL-a

class WasabiStorageService {
  private s3Client: S3Client;
  private cache: Map<string, {
    buffer: Buffer,
    timestamp: number,
    hits: number
  }>;
  private readonly CACHE_TTL = 1000 * 60 * 30; // 30 minutes
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached items
  private readonly MIN_HITS_FOR_CACHE = 3; // Minimum hits to keep in cache

  constructor() {
    this.cache = new Map();
    
    // Clean cache periodically
    setInterval(() => this.cleanCache(), 1000 * 60 * 5); // Every 5 minutes
    // Pravimo Wasabi klijenta koristeći AWS SDK za S3
    this.s3Client = new S3Client({
      region: WASABI_REGION,
      endpoint: WASABI_ENDPOINT,
      credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || ''
      },
      forcePathStyle: true // Za Path-Style URL treba biti true
    });

    // Provera da li su postavljeni potrebni enviroment parametri
    if (!process.env.WASABI_ACCESS_KEY_ID || !process.env.WASABI_SECRET_ACCESS_KEY) {
      console.warn('UPOZORENJE: Wasabi kredencijali nisu konfigurisani! Servis za skladištenje dokumenata neće raditi.');
    }
  }

  /**
   * Upload fajla na Wasabi
   * @param key Ključ/putanja za fajl
   * @param fileBuffer Buffer sa sadržajem fajla
   * @param contentType MIME tip fajla
   * @param bucket Opciono ime bucket-a (defaultno koristnički dokumenti)
   * @returns Informacije o uploadovanom fajlu
   */
  async uploadFile(key: string, fileBuffer: Buffer, contentType: string, userId: string, bucket?: string): Promise<any> {
    try {
      // Ensure the file path starts with user ID for isolation
      if (!key.startsWith(`${userId}/`)) {
        key = `${userId}/${key}`;
      }
      
      const bucketName = bucket || WASABI_USER_DOCUMENTS_BUCKET;

      // Koristimo Upload klasu za multi-part upload velikih fajlova
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType
        }
      });

      return await upload.done();
    } catch (error) {
      console.error('Greška pri uploadu fajla na Wasabi:', error);
      throw error;
    }
  }

  /**
   * Preuzimanje fajla sa Wasabi-ja
   * @param key Ključ/putanja fajla
   * @param bucket Opciono ime bucket-a (defaultno koristnički dokumenti)
   * @returns Buffer sa sadržajem fajla
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL || value.hits < this.MIN_HITS_FOR_CACHE) {
        this.cache.delete(key);
      }
    }
    
    // If still over size limit, remove least accessed items
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => b[1].hits - a[1].hits)
        .slice(0, this.MAX_CACHE_SIZE);
      
      this.cache.clear();
      entries.forEach(([key, value]) => this.cache.set(key, value));
    }
  }

  async getFile(key: string, bucket?: string): Promise<Buffer> {
    const cacheKey = `${bucket || WASABI_USER_DOCUMENTS_BUCKET}:${key}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      cached.hits++;
      cached.timestamp = Date.now();
      return cached.buffer;
    }

    try {
      const bucketName = bucket || WASABI_USER_DOCUMENTS_BUCKET;

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);
      const chunks: Buffer[] = [];

      if (response.Body instanceof Readable) {
        for await (const chunk of response.Body) {
          chunks.push(Buffer.from(chunk));
        }
      }

      const buffer = Buffer.concat(chunks);
      
      // Cache the result
      this.cache.set(cacheKey, {
        buffer,
        timestamp: Date.now(),
        hits: 1
      });

      return buffer;
    } catch (error) {
      console.error('Greška pri preuzimanju fajla sa Wasabi-ja:', error);
      throw error;
    }
  }

  /**
   * Preuzimanje fajla kao stream za direktan pipe u response
   * @param key Ključ/putanja fajla
   * @param bucket Opciono ime bucket-a (defaultno koristnički dokumenti)
   * @returns Readable stream sa sadržajem fajla
   */
  async getFileAsStream(key: string, bucket?: string): Promise<Readable> {
    try {
      const bucketName = bucket || WASABI_USER_DOCUMENTS_BUCKET;

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);
      
      if (response.Body instanceof Readable) {
        return response.Body;
      } else {
        throw new Error('Nije moguće preuzeti fajl kao stream');
      }
    } catch (error) {
      console.error('Greška pri preuzimanju fajla kao stream sa Wasabi-ja:', error);
      throw error;
    }
  }

  /**
   * Brisanje fajla sa Wasabi-ja
   * @param key Ključ/putanja fajla
   * @param bucket Opciono ime bucket-a (defaultno koristnički dokumenti)
   */
  async deleteFile(key: string, bucket?: string): Promise<void> {
    try {
      const bucketName = bucket || WASABI_USER_DOCUMENTS_BUCKET;

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('Greška pri brisanju fajla sa Wasabi-ja:', error);
      throw error;
    }
  }

  /**
   * Listanje fajlova u određenom folderu na Wasabi-ju
   * @param prefix Prefiks/putanja foldera
   * @param bucket Opciono ime bucket-a (defaultno koristnički dokumenti)
   * @returns Lista fajlova u folderu
   */
  async listFiles(prefix: string, bucket?: string): Promise<WasabiFile[]> {
    try {
      const bucketName = bucket || WASABI_USER_DOCUMENTS_BUCKET;

      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        Delimiter: '/'
      });

      const response = await this.s3Client.send(command);
      
      const files: WasabiFile[] = [];
      
      // Dodaj foldere (CommonPrefixes)
      if (response.CommonPrefixes) {
        for (const commonPrefix of response.CommonPrefixes) {
          if (commonPrefix.Prefix) {
            files.push({
              Key: commonPrefix.Prefix
            });
          }
        }
      }
      
      // Dodaj fajlove (Contents)
      if (response.Contents) {
        for (const content of response.Contents) {
          // Preskočimo sam folder (koji se takođe pojavljuje kao Content)
          if (content.Key !== prefix) {
            files.push({
              Key: content.Key || '',
              LastModified: content.LastModified,
              Size: content.Size,
              ETag: content.ETag
            });
          }
        }
      }
      
      return files;
    } catch (error) {
      console.error('Greška pri listanju fajlova na Wasabi-ju:', error);
      throw error;
    }
  }
  
  /**
   * Generisanje potpisanog URL-a za pristup fajlu
   * @param key Ključ/putanja fajla
   * @param bucket Opciono ime bucket-a (defaultno koristnički dokumenti)
   * @param expiresIn Vreme važenja URL-a u sekundama (defaultno 3600)
   * @returns Potpisani URL za pristup fajlu
   */
  async getSignedUrl(key: string, bucket?: string, expiresIn: number = 3600): Promise<string> {
    try {
      const bucketName = bucket || WASABI_USER_DOCUMENTS_BUCKET;

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      
      // Kreiraj potpisani URL koji će važiti određeno vreme
      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      return signedUrl;
    } catch (error) {
      console.error('Greška pri generisanju potpisanog URL-a:', error);
      // Ako dođe do greške, vraćamo direktni URL koji možda neće raditi
      return `${WASABI_ENDPOINT}/${bucket || WASABI_USER_DOCUMENTS_BUCKET}/${key}`;
    }
  }

  /**
   * Provera da li je fajl deo baze znanja
   * @param key Ključ/putanja fajla
   * @returns True ako je deo baze znanja, false inače
   */
  isKnowledgeBaseFile(key: string): boolean {
    // Fajl je deo baze znanja ako:
    // 1. Nalazi se u bucket-u za bazu znanja
    // 2. Putanja počinje sa 'knowledge-base/' ili 'kb/'
    // 3. Putanja sadrži '/knowledge-base/' ili '/kb/'
    return (
      key.startsWith('knowledge-base/') ||
      key.startsWith('kb/') ||
      key.includes('/knowledge-base/') ||
      key.includes('/kb/')
    );
  }

  /**
   * Određivanje odgovarajućeg bucket-a na osnovu tipa fajla
   * @param key Ključ/putanja fajla
   * @param isKnowledgeBase Opcioni flag da li je fajl deo baze znanja
   * @returns Ime bucket-a
   */
  getAppropriateStorageBucket(key: string, isKnowledgeBase?: boolean): string {
    // Ako je izričito navedeno da je deo baze znanja, koristi bucket baze znanja
    if (isKnowledgeBase === true) {
      return WASABI_KNOWLEDGE_BASE_BUCKET;
    }
    
    // Ako nije izričito navedeno, proveri putanju
    if (this.isKnowledgeBaseFile(key)) {
      return WASABI_KNOWLEDGE_BASE_BUCKET;
    }
    
    // U ostalim slučajevima, koristi bucket za korisničke dokumente
    return WASABI_USER_DOCUMENTS_BUCKET;
  }

  /**
   * Računanje ukupne veličine fajlova korisnika (bez fajlova baze znanja)
   * @param userId ID korisnika
   * @returns Ukupna veličina u bajtovima
   */
  async calculateUserStorageUsage(userId: string): Promise<number> {
    try {
      // Dobavi samo korisničke dokumente
      const userPrefix = `${userId}/`;
      const userFiles = await this.listFiles(userPrefix);
      
      // Izračunaj ukupnu veličinu, isključujući fajlove baze znanja
      let totalSize = 0;
      for (const file of userFiles) {
        if (!this.isKnowledgeBaseFile(file.Key)) {
          totalSize += file.Size || 0;
        }
      }
      
      // Ažuriraj user_storage tabelu
      const { error } = await supabase
        .from('user_storage')
        .update({ 
          total_used_bytes: totalSize,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      if (error) {
        console.error('Greška pri ažuriranju user_storage tabele:', error);
      }
      
      return totalSize;
    } catch (error) {
      console.error('Greška pri računanju iskorišćenosti skladišta:', error);
      return 0;
    }
  }

  /**
   * Dobavljanje informacija o dostupnom i iskorišćenom prostoru za korisnika
   * @param userId ID korisnika
   * @returns Informacije o skladištu
   */
  async getUserStorageInfo(userId: string): Promise<StorageInfo> {
    try {
      // Dobavi informacije o skladištu iz baze
      const { data, error } = await supabase
        .from('user_storage')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        throw error;
      }
      
      // Ako nema podataka, vrati default vrednosti
      if (!data) {
        return {
          used: 0,
          base: 104857600, // 100MB default
          additional: 0,
          total: 104857600,
          percentage: 0
        };
      }
      
      const total = data.base_storage_bytes + data.additional_storage_bytes;
      const percentage = Math.min(100, Math.round((data.total_used_bytes / total) * 100));
      
      return {
        used: data.total_used_bytes,
        base: data.base_storage_bytes,
        additional: data.additional_storage_bytes,
        total,
        percentage
      };
    } catch (error) {
      console.error('Greška pri dobavljanju informacija o skladištu:', error);
      return {
        used: 0,
        base: 104857600,
        additional: 0,
        total: 104857600,
        percentage: 0
      };
    }
  }
}

// Kreiranje instance servisa za korištenje u aplikaciji
const wasabiStorageService = new WasabiStorageService();

// Eksportujemo i klasu i instancu
export { WasabiStorageService, wasabiStorageService };