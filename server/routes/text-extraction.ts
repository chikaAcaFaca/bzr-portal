import { Request, Response, Router } from 'express';
import { openRouterService } from '../services/openrouter-service';

const router = Router();

/**
 * API endpoint za ekstrakciju radnih mesta iz teksta koristeći AI
 * Ovaj endpoint koristimo kada regularna obrada teksta ne uspe
 */
router.post('/extract-job-positions', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Tekst nije prosleđen'
      });
    }
    
    console.log('Pokrenuta AI ekstrakcija radnih mesta iz teksta...');
    
    // Koristi OpenRouter za parsiranje sadržaja - isti servis koji se koristi u regularnoj obradi teksta
    const result = await openRouterService.parseJobPositionDocument(text);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Greška pri ekstrakciji radnih mesta',
        message: 'AI nije uspeo da ekstrahuje radna mesta iz teksta'
      });
    }
    
    console.log(`AI je identifikovao ${result.data.length} radnih mesta u tekstu`);
    
    return res.status(200).json({
      success: true,
      message: `Uspešno identifikovano ${result.data.length} radnih mesta`,
      data: result.data
    });
  } catch (error: any) {
    console.error('Greška pri AI ekstrakciji radnih mesta:', error);
    return res.status(500).json({
      success: false,
      message: `Greška pri ekstrakciji: ${error.message || 'Nepoznata greška'}`
    });
  }
});

export default router;