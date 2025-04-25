import { Request, Response } from 'express';
import { aiAgentService } from '../services/ai-agent-service';

export async function setupAIAgentRoutes(app: any) {
  // Ruta za postavljanje pitanja AI agentu
  app.post('/api/agent/ask', async (req: Request, res: Response) => {
    try {
      const { question, context, documentType, includeReferences } = req.body;
      
      if (!question) {
        return res.status(400).json({
          success: false,
          error: 'Pitanje nije poslato'
        });
      }

      const options = {
        context,
        documentType,
        includeReferences: !!includeReferences
      };

      const result = await aiAgentService.queryAgent(question, options);
      return res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      console.error('Greška pri obradi pitanja za AI agenta:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Interna greška servera'
      });
    }
  });

  // Ruta za generisanje dokumentacije
  app.post('/api/agent/generate-document', async (req: Request, res: Response) => {
    try {
      const { baseDocumentText, documentType, additionalParams } = req.body;
      
      if (!baseDocumentText || !documentType) {
        return res.status(400).json({
          success: false,
          error: 'Nedostaju potrebni parametri (baseDocumentText, documentType)'
        });
      }

      const result = await aiAgentService.generateDocument(
        baseDocumentText, 
        documentType, 
        additionalParams || {}
      );
      
      return res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      console.error('Greška pri generisanju dokumenta:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Interna greška servera'
      });
    }
  });

  // Ruta za analizu usklađenosti dokumenta
  app.post('/api/agent/analyze-compliance', async (req: Request, res: Response) => {
    try {
      const { documentText } = req.body;
      
      if (!documentText) {
        return res.status(400).json({
          success: false,
          error: 'Tekst dokumenta nije poslat'
        });
      }

      const result = await aiAgentService.analyzeComplianceWithRegulations(documentText);
      return res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      console.error('Greška pri analizi usklađenosti:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Interna greška servera'
      });
    }
  });
  
  // Ruta za dobavljanje često postavljenih pitanja (FAQ)
  app.get('/api/agent/faq', async (req: Request, res: Response) => {
    try {
      // Ovde možete implementirati učitavanje FAQ iz baze podataka
      const faqItems = [
        {
          question: "Šta su osnovne obaveze poslodavca prema Zakonu o BZR?",
          answer: "Prema aktuelnom Zakonu o bezbednosti i zdravlju na radu, poslodavac je dužan da obezbedi bezbedan rad na svim radnim mestima, sprovodi mere BZR, i vrši osposobljavanje zaposlenih za bezbedan rad."
        },
        {
          question: "Kada je obavezna procena rizika?",
          answer: "Procena rizika je obavezna za sva radna mesta u radnoj okolini i mora se ažurirati u slučaju pojave nove opasnosti i promene nivoa rizika."
        }
        // Dodajte više FAQ stavki prema potrebi
      ];
      
      return res.json({
        success: true,
        items: faqItems
      });
    } catch (error) {
      console.error('Greška pri dobavljanju FAQ:', error);
      return res.status(500).json({
        success: false,
        error: 'Greška pri dobavljanju FAQ'
      });
    }
  });
}
