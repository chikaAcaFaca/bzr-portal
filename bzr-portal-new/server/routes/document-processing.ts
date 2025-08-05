import { Request, Response } from 'express';
import { openRouterService } from '../services/openrouter-service';
import { db } from '../db';
import { jobPositions, riskCategories, risks } from '../../shared/schema';
import { documentQueueService } from '../services/document-queue-service';
import { upload } from '../middleware/upload-middleware';

export async function setupDocumentProcessingRoutes(app: any) {
  // Endpoint za generisanje kategorija rizika na osnovu postojećih radnih mesta
  app.post('/api/process/generate-risk-categories', async (req: Request, res: Response) => {
    try {
      // Dobavi sva radna mesta iz baze
      const positions = await db.select().from(jobPositions);

      if (!positions.length) {
        return res.status(400).json({
          success: false,
          error: 'Nema radnih mesta u bazi. Prvo unesite radna mesta.'
        });
      }

      // Koristi OpenRouter za generisanje kategorija rizika
      const result = await openRouterService.generateRiskCategories(positions);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Greška pri generisanju kategorija rizika'
        });
      }

      // Sačuvaj kategorije rizika u bazi
      const savedCategories = [];
      for (const category of result.data || []) {
        try {
          // Sačuvaj kategoriju
          const [savedCategory] = await db.insert(riskCategories).values({
            name: category.name,
            description: category.description,
            riskLevel: category.riskLevel
          }).returning();

          // Za svaki ID radnog mesta, poveži sa kategorijom rizika
          if (category.jobPositionIds && category.jobPositionIds.length > 0) {
            for (const jobId of category.jobPositionIds) {
              // Proveri da li radno mesto postoji
              const [position] = await db.select().from(jobPositions).where(({ id }) => id.equals(jobId));

              if (position) {
                // Ažuriraj radno mesto sa kategorijom rizika
                await db.update(jobPositions)
                  .set({ riskCategoryId: savedCategory.id })
                  .where(({ id }) => id.equals(jobId));
              }
            }
          }

          // Dodaj dummy rizike za svaku kategoriju
          const defaultRisks = [
            {
              name: `Opšti rizik za ${category.name}`,
              description: `Ovo je osnovni rizik koji se odnosi na sve pozicije u kategoriji ${category.name}`,
              riskCategoryId: savedCategory.id,
              preventionMeasures: ['Redovna obuka zaposlenih', 'Praćenje propisanih procedura']
            },
            {
              name: `Specifični rizik za ${category.name}`,
              description: `Ovo je specifičan rizik koji je karakterističan za pozicije u kategoriji ${category.name}`,
              riskCategoryId: savedCategory.id,
              preventionMeasures: ['Upotreba zaštitne opreme', 'Redovni zdravstveni pregledi']
            }
          ];

          for (const risk of defaultRisks) {
            await db.insert(risks).values(risk);
          }

          savedCategories.push({
            ...savedCategory,
            jobPositions: category.jobPositionIds || []
          });
        } catch (err) {
          console.error('Greška pri čuvanju kategorije rizika:', err);
        }
      }

      return res.status(200).json({
        success: true,
        data: savedCategories,
        message: `Uspešno kreirano ${savedCategories.length} kategorija rizika i povezano sa radnim mestima`
      });
    } catch (error: any) {
      console.error('Greška pri generisanju kategorija rizika:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Interna greška servera'
      });
    }
  });

  // Endpoint za obradu radnih mesta iz fajla
  app.post('/api/process/job-positions-file', upload.single('file'), async (req: Request, res: Response) => {
    // Set up SSE for progress tracking
    if (req.headers.accept === 'text/event-stream') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const docId = req.query.docId as string;
      if (!docId) {
        res.write('data: {"error": "Missing document ID"}\n\n');
        res.end();
        return;
      }

      documentQueueService.onProgress((data) => {
        if (data.id === docId) {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
      });

      documentQueueService.onCompleted((data) => {
        if (data.id === docId) {
          res.write(`data: ${JSON.stringify({ ...data, type: 'completed' })}\n\n`);
          res.end();
        }
      });

      documentQueueService.onFailed((data) => {
        if (data.id === docId) {
          res.write(`data: ${JSON.stringify({ ...data, type: 'failed' })}\n\n`);
          res.end();
        }
      });

      return;
    }
  });
}