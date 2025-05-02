import { Router, Request, Response } from 'express';
import { aiAgentService } from '../services/ai-agent-service';
import { blogCreationService } from '../services/blog-creation-service';
import { notificationService } from '../services/notification-service';

/**
 * Postavljanje ruta za AI agenta
 */
export async function setupAIAgentRoutes(app: any) {
  const router = Router();
  
  /**
   * Endpoint za dobijanje odgovora od AI agenta
   * 
   * @route POST /api/ai-agent/chat
   * @param {string} query - Pitanje korisnika
   * @param {string} userId - ID korisnika (opciono)
   * @param {boolean} includePublic - Da li uključiti javne dokumente (podrazumevano: true)
   * @param {number} contextLimit - Broj dokumenata koji će biti korišćeni za kontekst (podrazumevano: 5)
   * @param {Array<{role: string, content: string}>} history - Istorija prethodnih poruka (opciono)
   */
  router.post('/chat', async (req: Request, res: Response) => {
    try {
      const { query, userId, includePublic, contextLimit, history, createBlog } = req.body;
      
      if (!query || typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Nedostaje obavezni parametar: query (pitanje)'
        });
      }
      
      // Provera autorizacije (opciono, zavisno od poslovnih zahteva)
      // Ako korisnik nije prijavljen, možda treba ograničiti funkcionalnost
      /*
      if (!req.isAuthenticated() && userId) {
        return res.status(401).json({
          success: false,
          message: 'Niste autorizovani za pristup dokumentima drugih korisnika'
        });
      }
      */
      
      // Poziv AI agenta
      const aiResponse = await aiAgentService.generateAnswer(query, {
        userId: userId || (req.user ? (req.user as any).id : undefined),
        includePublic: includePublic !== false, // podrazumevano true
        contextLimit,
        history
      });
      
      // Provera da li je došlo do greške
      if (aiResponse.error) {
        return res.status(500).json({
          success: false,
          message: aiResponse.error,
          answer: aiResponse.answer
        });
      }
      
      // Ako je zatraženo kreiranje bloga i ako je odgovor kvalitetan (min 200 karaktera)
      let blogPost = null;
      if (createBlog && aiResponse.answer.length > 200) {
        try {
          // Kategorija se može izvući iz sadržaja pitanja
          let category = 'general';
          if (query.toLowerCase().includes('zakon') || query.toLowerCase().includes('pravil')) {
            category = 'regulative';
          } else if (query.toLowerCase().includes('rizik') || query.toLowerCase().includes('opasnost')) {
            category = 'procena-rizika';
          } else if (query.toLowerCase().includes('obuk') || query.toLowerCase().includes('trening')) {
            category = 'obuke-zaposlenih';
          } else if (query.toLowerCase().includes('zaštit') || query.toLowerCase().includes('zdravlj')) {
            category = 'zaštita-zdravlja';
          }
          
          // Kreiranje blog posta
          blogPost = await blogCreationService.createBlogFromAIResponse({
            originalQuestion: query,
            aiResponse: aiResponse.answer,
            userId: req.user ? (req.user as any).id : null,
            category,
            tags: ['ai-generisano', 'bzr', 'bezbednost']
          });
          
          console.log(`Blog post kreiran! ID: ${blogPost.id}, Naslov: ${blogPost.title}`);
          
          // Pošalji notifikaciju administratorima o novom blog postu za odobrenje
          try {
            await notificationService.notifyBlogApproval(blogPost.id, blogPost.title);
            console.log(`Notifikacija za odobrenje blog posta ${blogPost.id} poslata administratorima`);
          } catch (notificationError) {
            console.error('Greška pri slanju notifikacije:', notificationError);
            // Nastavljamo sa izvršavanjem iako slanje notifikacije nije uspelo
          }
        } catch (blogError) {
          console.error('Greška pri kreiranju blog posta:', blogError);
          // Nastavljamo sa izvršavanjem iako je kreiranje bloga neuspelo
        }
      }
      
      // Uspešan odgovor
      return res.status(200).json({
        success: true,
        answer: aiResponse.answer,
        sourceDocuments: aiResponse.sourceDocuments,
        blogPost: blogPost // Vraćamo podatke o kreiranom blog postu (ako je kreiran)
      });
    } catch (error: any) {
      console.error('Greška pri komunikaciji sa AI agentom:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Došlo je do greške pri generisanju odgovora'
      });
    }
  });
  
  /**
   * Endpoint za dobijanje relevantnog konteksta za pitanje
   * (Koristi se za predobijanje konteksta pre slanja upita, kada je to potrebno)
   * 
   * @route POST /api/ai-agent/context
   * @param {string} query - Pitanje korisnika
   * @param {string} userId - ID korisnika (opciono)
   * @param {boolean} includePublic - Da li uključiti javne dokumente (podrazumevano: true)
   * @param {number} limit - Broj dokumenata koji će biti vraćeni (podrazumevano: 5)
   */
  router.post('/context', async (req: Request, res: Response) => {
    try {
      const { query, userId, includePublic, limit } = req.body;
      
      if (!query || typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Nedostaje obavezni parametar: query (pitanje)'
        });
      }
      
      // Provera autorizacije (opciono, zavisno od poslovnih zahteva)
      /*
      if (!req.isAuthenticated() && userId) {
        return res.status(401).json({
          success: false,
          message: 'Niste autorizovani za pristup dokumentima drugih korisnika'
        });
      }
      */
      
      // Dobavljanje relevantnog konteksta
      const contextDocs = await aiAgentService.getRelevantContext(query, {
        userId: userId || (req.user ? (req.user as any).id : undefined),
        includePublic: includePublic !== false, // podrazumevano true
        limit: limit || 5
      });
      
      // Uspešan odgovor
      return res.status(200).json({
        success: true,
        contextDocuments: contextDocs
      });
    } catch (error: any) {
      console.error('Greška pri dobavljanju konteksta:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Došlo je do greške pri dobavljanju konteksta'
      });
    }
  });
  
  app.use('/api/ai-agent', router);
}