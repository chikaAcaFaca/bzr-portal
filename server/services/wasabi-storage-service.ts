import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

/**
 * Servis za interakciju sa Wasabi Storage servisom
 * Koristi AWS S3 SDK pošto Wasabi Storage ima kompatibilan API sa AWS S3
 */
class WasabiStorageService {
  private s3Client: S3Client;
  private knowledgeBaseBucket: string;
  private userDocumentsBucket: string;
  private region: string = 'eu-central-1'; // Wasabi region

  constructor() {
    // Proveri da li su svi potrebni ključevi dostupni
    if (!process.env.WASABI_ACCESS_KEY_ID || !process.env.WASABI_SECRET_ACCESS_KEY) {
      console.error('Wasabi kredencijali nisu postavljeni u environment varijablama');
    }
    
    if (!process.env.WASABI_KNOWLEDGE_BASE_BUCKET || !process.env.WASABI_USER_DOCUMENTS_BUCKET) {
      console.error('Wasabi bucket names nisu postavljeni u environment varijablama');
    }
    
    this.knowledgeBaseBucket = process.env.WASABI_KNOWLEDGE_BASE_BUCKET || '';
    this.userDocumentsBucket = process.env.WASABI_USER_DOCUMENTS_BUCKET || '';

    // Inicijalizuj S3 klijenta sa Wasabi servis endpointom
    this.s3Client = new S3Client({
      region: this.region,
      endpoint: `https://s3.${this.region}.wasabisys.com`,
      credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || ''
      }
    });
  }

  /**
   * Upload fajla u bazu znanja
   * @param filePath - Putanja do fajla na lokalnom serveru
   * @param destinationPath - Putanja gde će fajl biti sačuvan na Wasabi (npr. "zakoni/zakon-o-radu.pdf")
   * @param metadata - Opcioni metadata
   * @returns - Objekat sa URL-om do uploadovanog fajla
   */
  async uploadToKnowledgeBase(filePath: string, destinationPath: string, metadata?: Record<string, string>): Promise<{ success: boolean, url?: string, error?: string }> {
    try {
      return await this.uploadFile(filePath, destinationPath, this.knowledgeBaseBucket, metadata);
    } catch (error: any) {
      console.error('Greška pri uploadovanju u knowledge base:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload fajla za korisnika
   * @param filePath - Putanja do fajla na lokalnom serveru
   * @param destinationPath - Putanja gde će fajl biti sačuvan na Wasabi (npr. "user123/sistematizacija/dokument.pdf")
   * @param metadata - Opcioni metadata
   * @returns - Objekat sa URL-om do uploadovanog fajla
   */
  async uploadUserDocument(filePath: string, destinationPath: string, metadata?: Record<string, string>): Promise<{ success: boolean, url?: string, error?: string }> {
    try {
      return await this.uploadFile(filePath, destinationPath, this.userDocumentsBucket, metadata);
    } catch (error: any) {
      console.error('Greška pri uploadovanju korisničkog dokumenta:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Preuzmi dokument iz baze znanja
   * @param documentPath - Putanja do dokumenta na Wasabi
   * @param localPath - Opciona lokalna putanja gde će fajl biti sačuvan
   * @returns - Stream sa sadržajem dokumenta ili informacija o sačuvanom fajlu
   */
  async getKnowledgeBaseDocument(documentPath: string, localPath?: string): Promise<{ success: boolean, stream?: Readable, filePath?: string, error?: string }> {
    try {
      return await this.getDocument(documentPath, this.knowledgeBaseBucket, localPath);
    } catch (error: any) {
      console.error('Greška pri preuzimanju iz knowledge base:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Preuzmi korisnički dokument
   * @param documentPath - Putanja do dokumenta na Wasabi
   * @param localPath - Opciona lokalna putanja gde će fajl biti sačuvan
   * @returns - Stream sa sadržajem dokumenta ili informacija o sačuvanom fajlu
   */
  async getUserDocument(documentPath: string, localPath?: string): Promise<{ success: boolean, stream?: Readable, filePath?: string, error?: string }> {
    try {
      return await this.getDocument(documentPath, this.userDocumentsBucket, localPath);
    } catch (error: any) {
      console.error('Greška pri preuzimanju korisničkog dokumenta:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Izlistaj dokumente korisnika u određenom folderu
   * @param userId - ID korisnika 
   * @param folderPath - Opciona putanja foldera (npr. "sistematizacija")
   * @returns - Lista dokumenata
   */
  async listUserDocuments(userId: string, folderPath?: string): Promise<{ success: boolean, files?: any[], error?: string }> {
    try {
      const prefix = folderPath ? `${userId}/${folderPath}/` : `${userId}/`;
      
      const command = new ListObjectsV2Command({
        Bucket: this.userDocumentsBucket,
        Prefix: prefix,
        Delimiter: '/'
      });
      
      const response = await this.s3Client.send(command);
      
      const files = [];
      
      // Dodaj fajlove
      if (response.Contents) {
        for (const item of response.Contents) {
          if (item.Key && !item.Key.endsWith('/')) {
            const fileName = item.Key.split('/').pop() || '';
            files.push({
              name: fileName,
              path: item.Key,
              size: item.Size,
              lastModified: item.LastModified
            });
          }
        }
      }
      
      // Dodaj foldere
      if (response.CommonPrefixes) {
        for (const prefix of response.CommonPrefixes) {
          if (prefix.Prefix) {
            const folderName = prefix.Prefix.split('/').filter(p => p).pop() || '';
            files.push({
              name: folderName,
              path: prefix.Prefix,
              isFolder: true
            });
          }
        }
      }
      
      return { success: true, files };
    } catch (error: any) {
      console.error('Greška pri listanju korisničkih dokumenata:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obriši dokument korisnika
   * @param documentPath - Putanja do dokumenta
   * @returns - Informacija o uspešnosti
   */
  async deleteUserDocument(documentPath: string): Promise<{ success: boolean, error?: string }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.userDocumentsBucket,
        Key: documentPath
      });
      
      await this.s3Client.send(command);
      return { success: true };
    } catch (error: any) {
      console.error('Greška pri brisanju korisničkog dokumenta:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generisanje URL-a za dokument sa ograničenim vremenskim trajanjem
   * @param documentPath - Putanja do dokumenta
   * @param bucketName - Ime bucketa
   * @returns - URL sa SAS tokenom
   */
  generateDocumentUrl(documentPath: string, isKnowledgeBase: boolean = false): string {
    const bucketName = isKnowledgeBase ? this.knowledgeBaseBucket : this.userDocumentsBucket;
    return `https://s3.${this.region}.wasabisys.com/${bucketName}/${documentPath}`;
  }

  // Pomoćna metoda za upload fajla
  private async uploadFile(
    filePath: string, 
    destinationPath: string, 
    bucketName: string, 
    metadata?: Record<string, string>
  ): Promise<{ success: boolean, url?: string, error?: string }> {
    try {
      // Proveri da li fajl postoji
      if (!fs.existsSync(filePath)) {
        throw new Error(`Fajl ne postoji na putanji: ${filePath}`);
      }
      
      const fileStream = fs.createReadStream(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      // Odredi MIME tip na osnovu ekstenzije fajla
      switch (fileExtension) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.doc':
        case '.docx':
          contentType = 'application/msword';
          break;
        case '.xls':
        case '.xlsx':
          contentType = 'application/vnd.ms-excel';
          break;
        case '.odt':
          contentType = 'application/vnd.oasis.opendocument.text';
          break;
        case '.ods':
          contentType = 'application/vnd.oasis.opendocument.spreadsheet';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.csv':
          contentType = 'text/csv';
          break;
        case '.bmp':
          contentType = 'image/bmp';
          break;
      }
      
      // Upload fajla koristeći multipart upload za veće fajlove
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: bucketName,
          Key: destinationPath,
          Body: fileStream,
          ContentType: contentType,
          Metadata: metadata
        }
      });
      
      await upload.done();
      
      // Generiši URL do fajla
      const fileUrl = this.generateDocumentUrl(destinationPath, bucketName === this.knowledgeBaseBucket);
      
      return { success: true, url: fileUrl };
    } catch (error: any) {
      throw error;
    }
  }

  // Pomoćna metoda za preuzimanje dokumenta
  private async getDocument(
    documentPath: string, 
    bucketName: string, 
    localPath?: string
  ): Promise<{ success: boolean, stream?: Readable, filePath?: string, error?: string }> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: documentPath
      });
      
      const response = await this.s3Client.send(command);
      
      // Ako je dobijena lokalna putanja, sačuvaj fajl tamo
      if (localPath && response.Body) {
        const directory = path.dirname(localPath);
        
        // Kreiraj direktorijum ako ne postoji
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        
        const stream = response.Body as Readable;
        const writeStream = fs.createWriteStream(localPath);
        
        // Čekaj da se završi upis u fajl
        await new Promise((resolve, reject) => {
          stream.pipe(writeStream)
            .on('finish', resolve)
            .on('error', reject);
        });
        
        return { success: true, filePath: localPath };
      }
      
      // Inače vrati stream
      if (response.Body instanceof Readable) {
        return { success: true, stream: response.Body };
      }
      
      throw new Error('Neuspešno preuzimanje dokumenta');
    } catch (error: any) {
      throw error;
    }
  }
}

// Eksportiraj instancu servisa
export const wasabiStorageService = new WasabiStorageService();