import axios from 'axios';
import path from 'path';
import { KnowledgeReference } from '@shared/schema';
import { wasabiStorageService } from './wasabi-storage-service';
import { documentExtractorService } from './document-extractor-service';
import { storage } from '../storage';

/**
 * Servis za rad sa referencama znanja i njihovim prenosom na Wasabi
 */
class KnowledgeReferenceService {
  // Bucket za dokumenta baze znanja
  private knowledgeBaseBucket = process.env.WASABI_KNOWLEDGE_BASE_BUCKET || 'bzr-knowledge-base-bucket';
  
  /**
   * Skida dokument sa URL-a i prebacuje ga na Wasabi bucket za znanje
   * 
   * @param reference Referenca znanja koja sadrži URL do dokumenta
   * @returns Informacije o uploadovanom dokumentu
   */
  public async downloadAndUploadToWasabi(reference: KnowledgeReference): Promise<{ 
    success: boolean;
    message: string;
    wasabiKey?: string;
    documentId?: string | null;
  }> {
    try {
      console.log(`Započinjem prenos dokumenta: ${reference.title}`);
      
      if (!reference.url) {
        return {
          success: false,
          message: 'URL dokumenta nije definisan'
        };
      }
      
      // 1. Skidanje dokumenta sa URL-a
      console.log(`Preuzimanje dokumenta sa URL-a: ${reference.url}`);
      const response = await axios.get(reference.url, {
        responseType: 'arraybuffer',
      });
      
      if (!response.data) {
        return {
          success: false,
          message: 'Neuspešno preuzimanje dokumenta sa URL-a'
        };
      }
      
      // 2. Priprema za upload na Wasabi
      const fileBuffer = Buffer.from(response.data);
      const fileName = this.getFileNameFromURL(reference.url);
      const contentType = this.getContentTypeFromFileName(fileName);
      
      // 3. Kreiranje ključa za Wasabi pod kojim će se čuvati dokument
      // Format: kategorija/ime_dokumenta
      const category = reference.category || 'general';
      const wasabiKey = `${category}/${fileName}`;
      
      console.log(`Prebacivanje dokumenta na Wasabi: ${wasabiKey}`);
      
      // 4. Upload dokumenta na Wasabi
      await wasabiStorageService.uploadFile(
        wasabiKey,
        fileBuffer,
        contentType,
        this.knowledgeBaseBucket
      );
      
      console.log(`Dokument uspešno prebačen na Wasabi: ${wasabiKey}`);
      
      // 5. Ekstrakcija sadržaja dokumenta i smeštanje u vektorsku bazu
      console.log(`Ekstrakcija sadržaja dokumenta: ${wasabiKey}`);
      
      try {
        const documentContent = await documentExtractorService.extractDocumentContent(
          this.knowledgeBaseBucket,
          wasabiKey
        );
        
        // 6. Smeštanje u vektorsku bazu
        console.log(`Smeštanje dokumenta u vektorsku bazu: ${reference.title}`);
        
        const documentId = await documentExtractorService.storeDocumentInVectorDatabase(
          documentContent,
          {
            isPublic: true,
            category: reference.category,
            tags: [reference.category || 'regulation'],
          }
        );
        
        return {
          success: true,
          message: 'Dokument uspešno prebačen na Wasabi i indeksiran u vektorskoj bazi',
          wasabiKey,
          documentId
        };
      } catch (error: any) {
        console.error(`Greška pri ekstrakciji sadržaja dokumenta: ${error.message}`);
        
        // Dokument je uploadovan na Wasabi, ali nije indeksiran u vektorskoj bazi
        return {
          success: true,
          message: `Dokument prebačen na Wasabi, ali nije indeksiran u vektorskoj bazi: ${error.message}`,
          wasabiKey
        };
      }
    } catch (error: any) {
      console.error(`Greška pri prenosu dokumenta: ${error.message}`);
      return {
        success: false,
        message: `Greška pri prenosu dokumenta: ${error.message}`
      };
    }
  }
  
  /**
   * Izvlači ime fajla iz URL-a
   * 
   * @param url URL dokumenta
   * @returns Ime fajla sa ekstenzijom
   */
  private getFileNameFromURL(url: string): string {
    try {
      // Izdvajanje putanje iz URL-a
      const urlPath = new URL(url).pathname;
      
      // Izdvajanje imena fajla iz putanje
      let fileName = path.basename(urlPath);
      
      // Decodiranje URL-kodiranih karaktera u imenu fajla (za ćirilicu i specijalne karaktere)
      try {
        fileName = decodeURIComponent(fileName);
      } catch (e) {
        // Ako decodiranje ne uspe, zadržavamo originalnu vrednost
        console.warn(`Nije moguće dekodirati ime fajla: ${fileName}`);
      }
      
      return fileName;
    } catch (error) {
      // U slučaju greške, vraćamo generički naziv
      console.warn(`Nije moguće izdvojiti ime fajla iz URL-a: ${url}`, error);
      return `document_${Date.now()}.pdf`;
    }
  }
  
  /**
   * Određuje MIME tip fajla na osnovu ekstenzije
   * 
   * @param fileName Ime fajla sa ekstenzijom
   * @returns MIME tip fajla
   */
  private getContentTypeFromFileName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }
  
  /**
   * Prebacuje sve postojeće reference znanja na Wasabi bucket
   * 
   * @returns Rezultat operacije sa statistikom
   */
  public async migrateAllReferencesToWasabi(): Promise<{
    success: boolean;
    totalReferences: number;
    processedReferences: number;
    successfulUploads: number;
    failedUploads: number;
    errors: Array<{ title: string; error: string }>;
  }> {
    try {
      console.log('Započinjem prebacivanje svih referenci znanja na Wasabi...');
      
      // 1. Dobavi sve reference znanja iz baze
      const references = await storage.getAllKnowledgeReferences();
      
      console.log(`Pronađeno ${references.length} referenci znanja za prebacivanje`);
      
      // 2. Inicijalizacija brojača za statistiku
      const stats = {
        totalReferences: references.length,
        processedReferences: 0,
        successfulUploads: 0,
        failedUploads: 0,
        errors: [] as Array<{ title: string; error: string }>
      };
      
      // 3. Asinhorno prebacivanje svakog dokumenta
      for (const reference of references) {
        try {
          console.log(`Obrađujem referencu: ${reference.title}`);
          
          const result = await this.downloadAndUploadToWasabi(reference);
          
          stats.processedReferences++;
          
          if (result.success) {
            stats.successfulUploads++;
            console.log(`Uspešno prebačen dokument: ${reference.title}`);
          } else {
            stats.failedUploads++;
            stats.errors.push({
              title: reference.title,
              error: result.message
            });
            console.error(`Neuspešno prebačen dokument: ${reference.title} - ${result.message}`);
          }
        } catch (error: any) {
          stats.processedReferences++;
          stats.failedUploads++;
          stats.errors.push({
            title: reference.title,
            error: error.message || 'Nepoznata greška'
          });
          console.error(`Greška pri prebacivanju dokumenta ${reference.title}:`, error);
        }
      }
      
      return {
        success: stats.failedUploads === 0,
        ...stats
      };
    } catch (error: any) {
      console.error('Greška pri prebacivanju referenci znanja:', error);
      return {
        success: false,
        totalReferences: 0,
        processedReferences: 0,
        successfulUploads: 0,
        failedUploads: 0,
        errors: [{ title: 'Globalna greška', error: error.message || 'Nepoznata greška' }]
      };
    }
  }
}

// Kreiranje instance servisa za korištenje u aplikaciji
export const knowledgeReferenceService = new KnowledgeReferenceService();