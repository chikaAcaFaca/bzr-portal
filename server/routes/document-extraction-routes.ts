import { Router, Request, Response } from 'express';
import type { Express } from 'express';

const router = Router();

/**
 * Postavljanje ruta za ekstrakciju dokumenta
 */
export function setupDocumentExtractionRoutes(app: Express) {
  app.use('/api/document-extraction', router);
}

// Ovde ćemo kasnije dodati rute iz našeg postojećeg koda

export default router;