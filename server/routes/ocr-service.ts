import { Request, Response, Router } from 'express';
import { geminiService } from '../services/gemini-api-service';

const router = Router();

/**
 * API endpoint za OCR obradu problematičnog teksta iz PDF/DOC dokumenata
 * Koristi Gemini AI za pročišćavanje i ekstrakciju teksta
 */
router.post('/ocr-text', async (req: Request, res: Response) => {
  try {
    const { text, format } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Tekst nije prosleđen'
      });
    }
    
    // Ograniči dužinu teksta na 15000 znakova za API pozive
    const limitedText = text.substring(0, 15000);
    
    // Koristi Gemini za ekstrakiju i čišćenje teksta
    const result = await geminiService.extractTextFromComplexFormat(limitedText, format || 'PDF/DOC');
    
    return res.status(200).json({
      success: result.success,
      text: result.text,
      message: result.message || 'Tekst je uspešno obrađen'
    });
  } catch (error: any) {
    console.error('Greška pri OCR obradi teksta:', error);
    return res.status(500).json({
      success: false,
      message: `Greška pri OCR obradi: ${error.message || 'Nepoznata greška'}`
    });
  }
});

export default router;