import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

// Tipovi za objekte i rezultate
interface WasabiFile {
  Key: string;
  LastModified?: Date;
  Size?: number;
  ETag?: string;
}

// Konfiguracija Wasabi servisa
// Prema dokumentaciji: https://docs.wasabi.com/v1/docs/service-urls-for-wasabis-storage-regions
const WASABI_USER_DOCUMENTS_BUCKET = process.env.WASABI_USER_DOCUMENTS_BUCKET || 'bzr-user-documents-bucket';
const WASABI_KNOWLEDGE_BASE_BUCKET = process.env.WASABI_KNOWLEDGE_BASE_BUCKET || 'bzr-knowledge-base-bucket';
const WASABI_REGION = 'eu-west-2';

// Za Path-Style URL (preporučeno za SDK integracije)
const WASABI_ENDPOINT = 'https://s3.eu-west-2.wasabisys.com';

// Alternativna opcija za Virtual-Host-Style URL:
// const WASABI_ENDPOINT = undefined; // Koristi default S3 protokol za formiranje URL-a

class WasabiStorageService {
  private s3Client: S3Client;

  constructor() {
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
  async uploadFile(key: string, fileBuffer: Buffer, contentType: string, bucket?: string): Promise<any> {
    try {
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
  async getFile(key: string, bucket?: string): Promise<Buffer> {
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

      return Buffer.concat(chunks);
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
}

// Kreiranje instance servisa za korištenje u aplikaciji
const wasabiStorageService = new WasabiStorageService();

// Eksportujemo i klasu i instancu
export { WasabiStorageService, wasabiStorageService };