import { Express, Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export function setupDocumentScraperRoutes(app: Express) {
  // Ruta za pretraživanje dokumenata na nekom URL-u
  app.post('/api/scrape-documents', async (req: Request, res: Response) => {
    try {
      console.log('Request body:', req.body);
      // Ekstraktujemo URL iz tela zahteva ili pokušavamo da dobijemo ceo body kao URL
      const { url } = req.body || {};
      
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
      const docLinks: { title: string, url: string, fileType: string }[] = [];
      
      // Pronađi sve linkove sa podržanim ekstenzijama dokumenta
      $('a').each((_, element) => {
        const link = $(element).attr('href');
        if (!link) return;
        
        // Podržane ekstenzije dokumenta (PDF, Word, Excel, PowerPoint, TXT...)
        const supportedExtensions = [
          '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
          '.ppt', '.pptx', '.txt', '.rtf', '.odt',
          '.ods', '.odp', '.csv', '.xml', '.json'
        ];
        
        const linkLower = link.toLowerCase();
        
        // Provera da li link ima neku od podržanih ekstenzija
        const hasExtension = supportedExtensions.some(ext => 
          linkLower.endsWith(ext) || linkLower.includes(`${ext}?`)
        );
        
        // Provera za content-type ako ekstenzija nije eksplicitna
        const hasContentType = [
          'content-type=application/pdf',
          'content-type=application/msword',
          'content-type=application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'content-type=application/vnd.ms-excel',
          'content-type=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'content-type=application/vnd.ms-powerpoint',
          'content-type=application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'content-type=text/plain',
          'content-type=text/rtf',
          'content-type=application/vnd.oasis.opendocument.text',
          'content-type=application/vnd.oasis.opendocument.spreadsheet',
          'content-type=application/vnd.oasis.opendocument.presentation'
        ].some(ct => linkLower.includes(ct));
        
        if (hasExtension || hasContentType) {
          
          // Uzmi tekst linka kao naslov
          let title = $(element).text().trim();
          
          // Ako nema teksta, pokušaj sa title atributom ili samim URL-om
          if (!title || title === '') {
            title = $(element).attr('title') || 
                    link.split('/').pop() || 
                    'Dokument';
          }
          
          // Apsolutni URL
          const absoluteUrl = new URL(link, url).href;
          
          // Odredi tip dokumenta iz URL-a
          let fileType = 'other';
          if (linkLower.endsWith('.pdf') || linkLower.includes('.pdf?') || linkLower.includes('content-type=application/pdf')) {
            fileType = 'pdf';
          } else if (linkLower.endsWith('.doc') || linkLower.endsWith('.docx') || linkLower.includes('content-type=application/msword')) {
            fileType = 'word';
          } else if (linkLower.endsWith('.xls') || linkLower.endsWith('.xlsx')) {
            fileType = 'excel';
          } else if (linkLower.endsWith('.ppt') || linkLower.endsWith('.pptx')) {
            fileType = 'powerpoint';
          } else if (linkLower.endsWith('.txt')) {
            fileType = 'text';
          }
          
          // Dodaj u listu
          docLinks.push({
            title,
            url: absoluteUrl,
            fileType
          });
        }
      });
      
      return res.json({
        success: true,
        files: docLinks,
      });
    } catch (error: any) {
      console.error('Greška pri skrejpovanju:', error);
      return res.status(500).json({
        error: 'Došlo je do greške pri pretraživanju dokumenata',
        message: error.message,
      });
    }
  });
}