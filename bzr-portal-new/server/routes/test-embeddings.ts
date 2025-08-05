import { Router, Request, Response } from 'express';
import { embeddingsService } from '../services/embeddings-service';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * Test ruta za proveru generisanja embeddings-a
 * Čita tekst iz test fajla i pokušava da generiše embedding
 */
router.get('/test-embeddings', async (req: Request, res: Response) => {
  try {
    console.log('Test embeddings ruta pozvana...');
    
    // Čitanje test dokumenta
    const testFilePath = path.join(process.cwd(), 'test-files', 'test_dokument.txt');
    const fileExists = fs.existsSync(testFilePath);
    
    if (!fileExists) {
      console.error(`Test fajl ne postoji na putanji: ${testFilePath}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Test fajl nije pronađen',
        filePath: testFilePath
      });
    }
    
    const text = fs.readFileSync(testFilePath, 'utf8');
    console.log(`Pročitan test dokument dužine: ${text.length} karaktera`);
    
    // Generisanje embeddings-a
    console.log('Pozivanje embeddingsService.generateEmbedding...');
    const embedding = await embeddingsService.generateEmbedding(text);
    
    return res.status(200).json({
      success: true,
      embeddingLength: embedding.length,
      embeddingSample: embedding.slice(0, 10),
      textLength: text.length
    });
  } catch (error: any) {
    console.error('Greška pri testu embeddings-a:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Greška pri generisanju embeddings-a'
    });
  }
});

export default router;