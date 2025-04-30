import { Request, Response, Router } from 'express';
import { openRouterService } from '../services/openrouter-service';
import { geminiService } from '../services/gemini-api-service';

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
    console.log(`Dužina teksta: ${text.length} karaktera`);
    
    // Uzmi prvih 500 karaktera teksta za logovanje (da ne opterećujemo konzolu)
    const textPreview = text.substring(0, 500) + (text.length > 500 ? '...' : '');
    console.log('Početak teksta:', textPreview);
    
    // Prvo pokušaj sa OpenRouter-om
    try {
      console.log('Pokušaj ekstrakcije sa OpenRouter servisom...');
      const result = await openRouterService.parseJobPositionDocument(text);
      
      if (result.success && result.data && result.data.length > 0) {
        console.log(`OpenRouter je identifikovao ${result.data.length} radnih mesta u tekstu`);
        
        return res.status(200).json({
          success: true,
          message: `Uspešno identifikovano ${result.data.length} radnih mesta`,
          data: result.data
        });
      } else {
        console.log('OpenRouter nije uspešno identifikovao radna mesta, pokušavam sa Gemini servisom');
      }
    } catch (openRouterError) {
      console.error('Greška pri OpenRouter ekstrakciji:', openRouterError);
      console.log('Nastavak sa Gemini servisom...');
    }
    
    // Ako OpenRouter nije uspeo, pokušaj sa Gemini
    try {
      console.log('Pokušaj ekstrakcije sa Gemini servisom...');
      
      // Specifični prompt za Gemini fokusiran na identifikaciju radnih mesta
      const prompt = `
      Analiziraj sledeći tekst sistematizacije radnih mesta i ekstrahuj sva radna mesta koja su navedena. 
      Za svako radno mesto izvuci sledeće informacije:
      - Naziv radnog mesta
      - Šifru/kod radnog mesta (ako postoji)
      - Potrebne kvalifikacije (ako su navedene)
      - Opis i odgovornosti (ako su navedeni)
      
      Tekst sadrži sistematizaciju radnih mesta i/ili opise poslova. Pažljivo analiziraj svaki pasus 
      i identifikuj sve nazive radnih mesta čak i kada nisu eksplicitno označeni.
      Obrati posebnu pažnju na sekcije koje počinju sa "RADNO MESTO:", "Naziv radnog mesta:", ili sl.
      
      Tekst za analizu:
      ${text}
      
      Vrati rezultate u JSON formatu kao niz objekata, gde svaki objekat predstavlja jedno radno mesto sa sledećim poljima:
      - name: naziv radnog mesta
      - code: šifra/kod radnog mesta (ako postoji, inače prazan string)
      - educationLevel: potreban nivo obrazovanja (ako je naveden, inače prazan string)
      - requiredWorkExperience: potrebno radno iskustvo (ako je navedeno, inače prazan string)
      - requiredSkills: niz veština koje su potrebne (ako su navedene)
      - responsibilities: niz odgovornosti/dužnosti (ako su navedene)
      
      Rezultat treba da bude validan JSON niz objekata. Ako u tekstu nema jasno definisanih radnih mesta, 
      pokušaj da identifikuješ ih na osnovu konteksta. Obrati posebnu pažnju na VELIKA SLOVA u tekstu koja 
      često označavaju nazive radnih mesta ili naslove sekcija.
      `;
      
      const geminiResponse = await geminiService.generateContent(prompt, 'json');
      
      if (geminiResponse && geminiResponse.success) {
        try {
          const parsedData = JSON.parse(geminiResponse.text);
          
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log(`Gemini je identifikovao ${parsedData.length} radnih mesta u tekstu`);
            
            // Formatiraj dobijene podatke u format koji očekuje naša aplikacija
            const formattedData = parsedData.map((item: any) => ({
              name: item.name || '',
              code: item.code || '',
              department: '', // Gemini možda nije izdvojio ovaj podatak
              educationLevel: item.educationLevel || '',
              requiredWorkExperience: item.requiredWorkExperience || '',
              requiredSkills: Array.isArray(item.requiredSkills) ? item.requiredSkills : [],
              responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities : []
            }));
            
            return res.status(200).json({
              success: true,
              message: `Uspešno identifikovano ${formattedData.length} radnih mesta pomoću Gemini AI`,
              data: formattedData
            });
          } else {
            console.warn('Gemini je vratio prazan niz radnih mesta');
          }
        } catch (parseError) {
          console.error('Greška pri parsiranju Gemini odgovora:', parseError);
          console.log('Gemini tekst odgovor:', geminiResponse.text.substring(0, 1000));
        }
      } else {
        console.log('Gemini nije uspeo da generiše rezultate');
      }
    } catch (geminiError) {
      console.error('Greška pri Gemini ekstrakciji:', geminiError);
    }
    
    // Ako oba servisa ne uspeju, pokušaj izdvojiti barem nešto iz teksta
    console.log('Pokušaj jednostavne ekstrakcije iz teksta...');
    
    // Jednostavna heuristika za identifikaciju potencijalnih radnih mesta
    // Ovo je vrlo osnovni pristup koji može dati neprecizne rezultate
    const lines = text.split('\n');
    const possibleJobPositions = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Pokušaj identifikacije linija koje mogu biti nazivi radnih mesta
      if (
        (trimmedLine.toUpperCase() === trimmedLine && trimmedLine.length > 5 && trimmedLine.length < 100) || 
        trimmedLine.startsWith('RADNO MESTO:') || 
        trimmedLine.startsWith('Naziv radnog mesta:')
      ) {
        let name = trimmedLine;
        
        // Očisti prefiks ako postoji
        if (name.startsWith('RADNO MESTO:')) {
          name = name.replace('RADNO MESTO:', '').trim();
        } else if (name.startsWith('Naziv radnog mesta:')) {
          name = name.replace('Naziv radnog mesta:', '').trim();
        }
        
        // Samo ako ime nije prazno nakon čišćenja
        if (name.length > 0) {
          possibleJobPositions.push({
            name: name,
            code: '',
            department: '',
            educationLevel: '',
            requiredWorkExperience: '',
            requiredSkills: [],
            responsibilities: []
          });
        }
      }
    }
    
    if (possibleJobPositions.length > 0) {
      console.log(`Jednostavna ekstrakcija identifikovala ${possibleJobPositions.length} potencijalnih radnih mesta`);
      
      return res.status(200).json({
        success: true,
        message: `Identifikovano ${possibleJobPositions.length} potencijalnih radnih mesta`,
        data: possibleJobPositions
      });
    }
    
    // Ako nijedan pristup nije uspeo, vrati grešku
    return res.status(200).json({
      success: true,
      message: 'Nije bilo moguće identifikovati radna mesta u tekstu',
      data: []
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