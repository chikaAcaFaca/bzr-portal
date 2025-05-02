import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as mammoth from 'mammoth';
// Koristimo našu verziju PDF parsera
import { parsePDF } from '../utils/pdf-parser';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import fetch from 'node-fetch';
import { pipeline } from 'stream/promises';

// Privremena konfiguracija dok čekamo popravku u ../config
const config = {
  wasabi: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || '',
    region: 'eu-west-2',
    endpoint: 'https://s3.eu-west-2.wasabisys.com',
    knowledgeBaseBucket: process.env.WASABI_KNOWLEDGE_BASE_BUCKET || 'bzr-knowledge-base',
    userDocumentsBucket: process.env.WASABI_USER_DOCUMENTS_BUCKET || 'bzr-user-documents',
    baseUrl: 'https://s3.eu-west-2.wasabisys.com'
  }
};

// Konfiguracija za Wasabi S3
const s3Client = new S3Client({
  region: config.wasabi.region,
  endpoint: config.wasabi.endpoint,
  credentials: {
    accessKeyId: config.wasabi.accessKeyId,
    secretAccessKey: config.wasabi.secretAccessKey
  }
});

export interface DocumentContent {
  text: string;
  metadata: {
    filename: string;
    fileType: string;
    extractionDate: Date;
    fileSize?: number;
  }
}

/**
 * Servis za ekstrakciju sadržaja iz različitih tipova dokumenata
 */
export class DocumentExtractorService {
  
  /**
   * Preuzima dokument sa Wasabi S3 skladišta
   */
  private async getFileFromWasabi(bucket: string, key: string): Promise<{ buffer: Buffer, contentType: string }> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const response = await s3Client.send(command);
      
      // Konvertujemo stream u buffer
      const chunks: Buffer[] = [];
      if (response.Body) {
        // @ts-ignore - Type confusion with Body stream
        for await (const chunk of response.Body) {
          chunks.push(Buffer.from(chunk));
        }
      }
      
      const buffer = Buffer.concat(chunks);
      const contentType = response.ContentType || this.getContentTypeFromKey(key);
      
      return { buffer, contentType };
    } catch (error: any) {
      console.error('Greška pri preuzimanju fajla sa Wasabi:', error);
      throw new Error(`Nije moguće preuzeti dokument: ${error.message}`);
    }
  }
  
  /**
   * Dobijanje content-type na osnovu ekstenzije
   */
  private getContentTypeFromKey(key: string): string {
    const extension = path.extname(key).toLowerCase();
    switch (extension) {
      case '.pdf': return 'application/pdf';
      case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case '.doc': return 'application/msword';
      case '.xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case '.xls': return 'application/vnd.ms-excel';
      case '.pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case '.ppt': return 'application/vnd.ms-powerpoint';
      case '.txt': return 'text/plain';
      case '.jpg': case '.jpeg': return 'image/jpeg';
      case '.png': return 'image/png';
      default: return 'application/octet-stream';
    }
  }

  /**
   * Ekstrakcija teksta iz PDF dokumenta
   */
  private async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      // Koristimo našu wrapper funkciju za parsiranje PDF-a
      const data = await parsePDF(buffer);
      return data.text;
    } catch (error: any) {
      console.error('Greška pri ekstrakciji teksta iz PDF-a:', error);
      throw new Error(`Nije moguće ekstraktovati tekst iz PDF-a: ${error.message}`);
    }
  }

  /**
   * Ekstrakcija teksta iz DOCX dokumenta
   */
  private async extractTextFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error: any) {
      console.error('Greška pri ekstrakciji teksta iz DOCX-a:', error);
      throw new Error(`Nije moguće ekstraktovati tekst iz DOCX-a: ${error.message}`);
    }
  }

  /**
   * Ekstrakcija teksta iz Excel fajla (XLS, XLSX)
   */
  private extractTextFromExcel(buffer: Buffer): string {
    try {
      const workbook = xlsx.read(buffer);
      let text = '';
      
      // Prolazimo kroz sve sheet-ove i izvlačimo tekst
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        // Dodajemo ime sheet-a
        text += `\n[Sheet: ${sheetName}]\n`;
        
        // Dodajemo sadržaj sheet-a
        sheetData.forEach((row: unknown) => {
          if (row && Array.isArray(row) && row.length) {
            text += (row as any[]).filter(cell => cell !== null && cell !== undefined)
                      .join(' | ') + '\n';
          }
        });
      });
      
      return text;
    } catch (error: any) {
      console.error('Greška pri ekstrakciji teksta iz Excel fajla:', error);
      throw new Error(`Nije moguće ekstraktovati tekst iz Excel fajla: ${error.message}`);
    }
  }

  /**
   * Ekstrakcija teksta iz slike koristeći OCR (preko API-ja)
   * Napomena: Ovo zahteva API ključ za Tesseract ili drugi OCR servis
   */
  private async extractTextFromImage(buffer: Buffer, filename: string): Promise<string> {
    try {
      // Zbog kompleksnosti OCR-a, koristićemo Gemini API za obradu slika
      // Alternativno bismo mogli koristiti tesseract.js, ali je sporiji
      // Čuvamo fajl privremeno na disku
      const tempPath = path.join(os.tmpdir(), `ocr_${Date.now()}_${path.basename(filename)}`);
      await fs.promises.writeFile(tempPath, buffer);
      
      // TODO: Implementirati Gemini API poziv za slike kada bude potrebno
      
      // Brisanje privremenog fajla
      await fs.promises.unlink(tempPath);
      
      // Privremeno vraćamo poruku da nije implementirano
      return '[Ekstrakcija teksta iz slika nije trenutno podržana]';
    } catch (error: any) {
      console.error('Greška pri ekstrakciji teksta iz slike:', error);
      throw new Error(`Nije moguće ekstraktovati tekst iz slike: ${error.message}`);
    }
  }

  /**
   * Ekstrahuje tekst iz dokumenta na osnovu tipa dokumenta
   */
  private async extractTextByType(buffer: Buffer, contentType: string, filename: string): Promise<string> {
    contentType = contentType.toLowerCase();
    const extension = path.extname(filename).toLowerCase();
    
    // PDF dokumenti
    if (contentType.includes('pdf') || extension === '.pdf') {
      return await this.extractTextFromPdf(buffer);
    }
    
    // Word dokumenti
    else if (contentType.includes('word') || contentType.includes('docx') || 
             extension === '.docx' || extension === '.doc') {
      return await this.extractTextFromDocx(buffer);
    }
    
    // Excel dokumenti
    else if (contentType.includes('excel') || contentType.includes('spreadsheet') || 
             extension === '.xlsx' || extension === '.xls') {
      return this.extractTextFromExcel(buffer);
    }
    
    // Obični tekstualni fajlovi
    else if (contentType.includes('text/plain') || extension === '.txt') {
      return buffer.toString('utf-8');
    }
    
    // Slike - koristi OCR
    else if (contentType.includes('image') || ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(extension)) {
      return await this.extractTextFromImage(buffer, filename);
    }
    
    // Nepodržani formati
    else {
      return `[Nepodržan format dokumenta: ${contentType}]`;
    }
  }

  /**
   * Glavni metod za ekstrakciju sadržaja iz dokumenta
   */
  public async extractDocumentContent(bucket: string, key: string): Promise<DocumentContent> {
    try {
      console.log(`Ekstrakcija sadržaja iz dokumenta: ${key}`);
      const filename = path.basename(key);
      
      // Preuzimanje fajla sa Wasabi
      const { buffer, contentType } = await this.getFileFromWasabi(bucket, key);
      
      // Ekstrakcija teksta iz fajla
      const text = await this.extractTextByType(buffer, contentType, filename);
      
      return {
        text,
        metadata: {
          filename,
          fileType: contentType,
          extractionDate: new Date(),
          fileSize: buffer.length
        }
      };
    } catch (error) {
      console.error('Greška pri ekstrakciji sadržaja dokumenta:', error);
      throw new Error(`Nije moguće ekstraktovati sadržaj dokumenta: ${error.message}`);
    }
  }
  
  /**
   * Prebacuje dokument u vektorsku bazu
   */
  public async storeDocumentInVectorDatabase(documentContent: DocumentContent, additionalMetadata?: { 
    userId?: string; 
    isPublic?: boolean;
    category?: string;
    folder?: string;
    tags?: string[];
  }): Promise<string | null> {
    try {
      // Importujemo servis ovde da izbegnemo cirkularne zavisnosti
      const { vectorStorageService } = await import('./vector-storage-service');
      
      // Proveravamo da li je vektorska baza dostupna
      const isAvailable = await vectorStorageService.isAvailable();
      if (!isAvailable) {
        console.warn('Vektorska baza nije dostupna. Dokument neće biti sačuvan.');
        return null;
      }
      
      // Kreiranje unosa za vektorsku bazu
      const vectorEntry = {
        content: documentContent.text,
        metadata: {
          ...documentContent.metadata,
          bucket: additionalMetadata?.folder ? 'bzr-user-documents-bucket' : 'bzr-knowledge-base-bucket',
          filePath: additionalMetadata?.folder 
            ? `${additionalMetadata.folder}/${documentContent.metadata.filename}`
            : documentContent.metadata.filename,
          addedAt: new Date().toISOString(),
          extractionDate: documentContent.metadata.extractionDate.toISOString(),
          ...additionalMetadata
        }
      };
      
      // Čuvanje u vektorskoj bazi
      const documentId = await vectorStorageService.addDocument(vectorEntry);
      
      if (documentId) {
        console.log(`Dokument uspešno sačuvan u vektorskoj bazi sa ID: ${documentId}`);
      } else {
        console.error('Greška pri čuvanju dokumenta u vektorskoj bazi');
      }
      
      return documentId;
    } catch (error: any) {
      console.error('Greška pri čuvanju dokumenta u vektorskoj bazi:', error);
      return null;
    }
  }
}

export const documentExtractorService = new DocumentExtractorService();