import { Router, Request, Response } from 'express';
import { aiAgentService } from '../services/ai-agent-service';
import type { Express } from 'express';

const router = Router();

/**
 * Postavljanje AI agent ruta
 */
export function setupAIAgentRoutes(app: Express) {
  app.use('/api/ai-agent', router);
}

/**
 * Endpoint za chat sa AI agentom
 * 
 * @route POST /api/ai-agent/chat
 * @param {string} query - Pitanje korisnika
 * @param {string[]} context - Opcioni kontekst za odgovor (override za vektorsku bazu)
 * @param {number} maxTokens - Maksimalan broj tokena za odgovor
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { query, context, maxTokens } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Nedostaje pitanje (query parametar)'
      });
    }
    
    // Dobijanje odgovora od AI agenta
    const userId = req.user?.id; // ako imamo autentifikaciju
    const aiResponse = await aiAgentService.getResponse({
      query,
      context,
      userId: userId?.toString(),
      maxTokens
    });
    
    return res.status(200).json({
      success: true,
      ...aiResponse
    });
  } catch (error: any) {
    console.error('Greška pri chat komunikaciji sa AI agentom:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Greška pri komunikaciji sa AI agentom'
    });
  }
});

/**
 * Endpoint za proveru preostalih besplatnih pitanja za FREE korisnike
 * 
 * @route GET /api/ai-agent/quota
 */
router.get('/quota', async (req: Request, res: Response) => {
  try {
    // TODO: Implementirati proveru kvote i limita
    // Za sad vraćamo hardkodirane vrednosti
    const isPro = false; // TODO: proveriti iz korisničkog profila
    
    return res.status(200).json({
      success: true,
      quota: {
        isPro,
        dailyLimit: isPro ? null : 3, // null znači da nema limita za PRO korisnike
        usedToday: 0,    // TODO: implementirati stvarno brojanje
        remaining: 3,    // TODO: izračunati stvarni preostali broj
        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString() // Sledeća ponoć
      }
    });
  } catch (error: any) {
    console.error('Greška pri dobijanju kvote za AI agenta:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Greška pri dobijanju informacija o kvoti'
    });
  }
});

export default router;