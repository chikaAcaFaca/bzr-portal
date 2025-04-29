import { Express, Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export function setupPdfScraperRoutes(app: Express) {
  // Ruta za pretraživanje PDF dokumenata na nekom URL-u
  app.post('/api/scrape-pdfs', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL je obavezan' });
      }
      
      // Dohvati HTML stranu
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Učitaj HTML u cheerio
      const $ = cheerio.load(response.data);
      
      // Pronađi sve linkove na stranici
      const pdfLinks: { title: string, url: string }[] = [];
      
      // Pronađi sve linkove sa .pdf ekstenzijom
      $('a').each((_, element) => {
        const link = $(element).attr('href');
        if (!link) return;
        
        // Ako link sadrži .pdf ili ima query parametar koji sadrži pdf
        if (link.toLowerCase().endsWith('.pdf') || 
            link.toLowerCase().includes('.pdf?') || 
            link.toLowerCase().includes('content-type=application/pdf')) {
          
          // Uzmi tekst linka kao naslov
          let title = $(element).text().trim();
          
          // Ako nema teksta, pokušaj sa title atributom ili samim URL-om
          if (!title || title === '') {
            title = $(element).attr('title') || 
                    (link.split('/').pop() || '').replace('.pdf', '') || 
                    'PDF Dokument';
          }
          
          // Apsolutni URL
          const absoluteUrl = new URL(link, url).href;
          
          // Dodaj u listu
          pdfLinks.push({
            title,
            url: absoluteUrl,
          });
        }
      });
      
      return res.json({
        success: true,
        files: pdfLinks,
      });
    } catch (error: any) {
      console.error('Greška pri skrejpovanju:', error);
      return res.status(500).json({
        error: 'Došlo je do greške pri pretraživanju PDF dokumenata',
        message: error.message,
      });
    }
  });
}