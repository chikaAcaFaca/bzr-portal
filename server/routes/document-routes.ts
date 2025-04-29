
import { Request, Response } from 'express';
import { DocumentTemplateService } from '../services/document-template-service';
import { storage } from '../storage';

export async function setupDocumentRoutes(app: any) {
  // Ruta za generisanje dokumenta
  app.post('/api/documents/generate', async (req: Request, res: Response) => {
    try {
      const { documentType, data } = req.body;
      
      if (!documentType || !data) {
        return res.status(400).json({
          success: false,
          error: 'Nedostaju potrebni parametri'
        });
      }

      let content = '';
      
      switch(documentType) {
        case 'obrazac1':
          content = DocumentTemplateService.generateObrazac1(data);
          break;
        case 'obrazac6':
          content = DocumentTemplateService.generateObrazac6(data);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Nepoznat tip dokumenta'
          });
      }

      return res.json({
        success: true,
        content
      });
    } catch (error: any) {
      console.error('Greška pri generisanju dokumenta:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Greška pri generisanju dokumenta'
      });
    }
  });
}
