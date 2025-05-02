import { Router, Request, Response } from 'express';
import { documentExtractorService, DocumentContent } from '../services/document-extractor-service';

/**
 * Postavljanje ruta za ekstrakciju dokumenta
 */
export function setupDocumentExtractionRoutes(app: any) {
  const router = Router();
  
  /**
   * Endpoint za ekstrakciju sadržaja iz dokumenta koji se nalazi na Wasabi skladištu
   * 
   * @route POST /api/document-extraction/extract
   * @param {string} bucket - Ime bucket-a (default: WASABI_USER_DOCUMENTS_BUCKET)
   * @param {string} key - Putanja do fajla u bucket-u
   */
  router.post('/extract', async (req: Request, res: Response) => {
    try {
      const { bucket, key } = req.body;
      
      if (!key) {
        return res.status(400).json({
          success: false, 
          message: 'Nedostaje obavezni parametar: key'
        });
      }
      
      // Podrazumevani bucket ako nije prosleđen
      const bucketName = bucket || process.env.WASABI_USER_DOCUMENTS_BUCKET || 'bzr-user-documents';
      
      const documentContent = await documentExtractorService.extractDocumentContent(bucketName, key);
      
      return res.status(200).json({
        success: true,
        data: documentContent
      });
    } catch (error: any) {
      console.error('Greška pri ekstrakciji dokumenta:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Došlo je do greške pri ekstrakciji dokumenta'
      });
    }
  });
  
  /**
   * Endpoint za ekstrakciju sadržaja i čuvanje u vektorskoj bazi
   * 
   * @route POST /api/document-extraction/process-and-store
   * @param {string} bucket - Ime bucket-a (default: WASABI_USER_DOCUMENTS_BUCKET)
   * @param {string} key - Putanja do fajla u bucket-u
   * @param {object} metadata - Dodatni metapodaci za dokument
   */
  router.post('/process-and-store', async (req: Request, res: Response) => {
    try {
      const { bucket, key, metadata } = req.body;
      
      if (!key) {
        return res.status(400).json({
          success: false, 
          message: 'Nedostaje obavezni parametar: key'
        });
      }
      
      // Podrazumevani bucket ako nije prosleđen
      const bucketName = bucket || process.env.WASABI_USER_DOCUMENTS_BUCKET || 'bzr-user-documents';
      
      // 1. Ekstrakcija sadržaja
      const documentContent = await documentExtractorService.extractDocumentContent(bucketName, key);
      
      // 2. Čuvanje u vektorskoj bazi
      const documentId = await documentExtractorService.storeDocumentInVectorDatabase(
        documentContent, 
        { 
          userId: metadata?.userId,
          isPublic: metadata?.isPublic,
          category: metadata?.category,
          folder: metadata?.folder,
          tags: metadata?.tags
        }
      );
      
      return res.status(200).json({
        success: true,
        data: {
          documentContent,
          documentId
        }
      });
    } catch (error: any) {
      console.error('Greška pri obradi i čuvanju dokumenta:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Došlo je do greške pri obradi i čuvanju dokumenta'
      });
    }
  });
  
  /**
   * Endpoint za ekstrakciju više dokumenata odjednom
   * 
   * @route POST /api/document-extraction/batch-extract
   * @param {Array<{bucket?: string, key: string, metadata?: object}>} documents - Niz objekata sa bucket i key vrednostima
   */
  router.post('/batch-extract', async (req: Request, res: Response) => {
    try {
      const { documents } = req.body;
      
      if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return res.status(400).json({
          success: false, 
          message: 'Nedostaje obavezni parametar: documents (niz)'
        });
      }
      
      const results: any[] = [];
      const errors: any[] = [];
      
      // Obrada svakog dokumenta
      for (const doc of documents) {
        try {
          if (!doc.key) {
            errors.push({ key: doc.key, error: 'Nedostaje obavezni parametar: key' });
            continue;
          }
          
          const bucketName = doc.bucket || process.env.WASABI_USER_DOCUMENTS_BUCKET || 'bzr-user-documents';
          
          // Ekstrakcija sadržaja
          const documentContent = await documentExtractorService.extractDocumentContent(bucketName, doc.key);
          
          // Čuvanje u vektorskoj bazi ako postoje metapodaci
          let documentId = null;
          if (doc.metadata) {
            documentId = await documentExtractorService.storeDocumentInVectorDatabase(
              documentContent, 
              { 
                userId: doc.metadata?.userId,
                isPublic: doc.metadata?.isPublic,
                category: doc.metadata?.category,
                folder: doc.metadata?.folder,
                tags: doc.metadata?.tags
              }
            );
          }
          
          results.push({
            key: doc.key,
            success: true,
            documentContent,
            documentId
          });
        } catch (error: any) {
          console.error(`Greška pri obradi dokumenta ${doc.key}:`, error);
          errors.push({
            key: doc.key,
            success: false,
            error: error.message
          });
        }
      }
      
      return res.status(200).json({
        success: true,
        results,
        errors,
        summary: {
          total: documents.length,
          successful: results.length,
          failed: errors.length
        }
      });
    } catch (error: any) {
      console.error('Greška pri batch ekstrakciji:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Došlo je do greške pri batch ekstrakciji'
      });
    }
  });
  
  /**
   * Endpoint za indeksiranje svih dokumenata u određenom folderu/bucketu
   * 
   * @route POST /api/document-extraction/index-folder
   * @param {string} bucket - Ime bucket-a (default: WASABI_USER_DOCUMENTS_BUCKET)
   * @param {string} folderPath - Putanja do foldera u bucket-u
   * @param {object} metadata - Dodatni metapodaci za sve dokumente
   */
  router.post('/index-folder', async (req: Request, res: Response) => {
    // Ova funkcionalnost zahteva listu objekata u bucket-u, pa ćemo je implementirati kasnije
    // kada budemo imali wasabiStorageService sa listObjects funkcijom
    res.status(501).json({ 
      success: false,
      message: 'Ova funkcionalnost još nije implementirana' 
    });
  });
  
  app.use('/api/document-extraction', router);
}