import fetch from 'node-fetch';

interface GeminiResponse {
  success: boolean;
  data?: {
    answer: string;
    references?: {
      source: string;
      text: string;
      article?: string;
    }[];
  };
  error?: string;
}

export class GeminiService {
  private geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
  private geminiKey = process.env.GEMINI_API_KEY;

  constructor() {
    if (!this.geminiKey) {
      console.warn('Gemini API ključ nije postavljen. Gemini service neće biti dostupan.');
    } else {
      console.log('Gemini API ključ je postavljen. Gemini service je spreman.');
    }
  }
  
  /**
   * Ekstraktuje tekst iz kompleksnih formata dokumenata (PDF, DOC) koristeći OCR mogućnosti
   * Koristi se kao dodatna pomoć kada je tekst sadržao problematične znakove
   */
  async extractTextFromComplexFormat(text: string, format: string): Promise<{ text: string, success: boolean, message?: string }> {
    if (!this.geminiKey) {
      return {
        text: text,
        success: false,
        message: 'Gemini API ključ nije postavljen.'
      };
    }
    
    try {
      const fullUrl = `${this.geminiUrl}?key=${this.geminiKey}`;
      
      const prompt = `
        Ti si stručnjak za OCR i ekstrakciju teksta iz dokumenta. Sledeći tekst je kopiran iz ${format} dokumenta i sadrži neke greške, specijalne znakove ili probleme sa formatiranjem.
        
        Tvoj zadatak je da pročistiš tekst, ukloniš problematične znakove, probleme sa formatiranjem i vratiš samo suštinski sadržaj teksta.
        
        Specijalno obrati pažnju na:
        - Nestandardne razmake i kontrolne znakove
        - Probleme sa kodiranjem i specijalnim znakovima iz PDF-a i DOC formata
        - Nevidljive znakove koji mogu prouzrokovati probleme pri parsiranju
        - Spajanje paragrafa koji su nepravilno podeljeni
        - Tačke, zareze i znakove interpunkcije
        
        Tekst: """
        ${text.substring(0, 15000)} 
        """
        
        Vrati samo pročišćeni tekst, bez dodatnih objašnjenja.
      `;
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192
          }
        })
      });
      
      if (!response.ok) {
        console.error('Gemini API greška pri OCR ekstrakciji:', response.status, response.statusText);
        return {
          text: text,
          success: false,
          message: `Gemini API greška: ${response.status} ${response.statusText}`
        };
      }
      
      const data = await response.json() as any;
      
      try {
        // Izvlačimo tekst odgovora
        const cleanedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (cleanedText.length < 10) {
          return {
            text: text,
            success: false,
            message: 'Gemini nije uspeo da ekstrahuje tekst iz dokumenta.'
          };
        }
        
        console.log('Gemini uspešno ekstraktovao tekst iz kompleksnog formata');
        return {
          text: cleanedText,
          success: true
        };
      } catch (err) {
        console.error('Greška pri parsiranju Gemini OCR odgovora:', err);
        return {
          text: text,
          success: false,
          message: 'Greška pri parsiranju Gemini OCR odgovora'
        };
      }
    } catch (error: any) {
      console.error('Greška pri komunikaciji sa Gemini API-jem za OCR:', error);
      return {
        text: text,
        success: false,
        message: `Gemini API OCR greška: ${error.message || 'Nepoznata greška'}`
      };
    }
  }

  /**
   * Šalje upit Gemini API-ju i dobija odgovor
   */
  async query(userMessage: string, systemMessage: Promise<string>): Promise<GeminiResponse> {
    if (!this.geminiKey) {
      return {
        success: false,
        error: 'Gemini API ključ nije postavljen.'
      };
    }
    
    // Sačekaj da se dobije sistemski prompt
    const resolvedSystemMessage = await systemMessage;
    
    try {
      const fullUrl = `${this.geminiUrl}?key=${this.geminiKey}`;
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: resolvedSystemMessage },
                { text: userMessage }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192
          }
        })
      });
      
      if (!response.ok) {
        console.error('Gemini API greška:', response.status, response.statusText);
        return {
          success: false,
          error: `Gemini API greška: ${response.status} ${response.statusText}`
        };
      }
      
      const data = await response.json() as any;
      console.log('Gemini API response:', JSON.stringify(data));
      
      try {
        // Izvlačimo tekst odgovora
        const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Sada direktno vraćamo odgovor kao prirodan tekst
        console.log('Vraćanje prirodnog tekstualnog odgovora iz Gemini API-ja');
        return {
          success: true,
          data: {
            answer: contentText,
            references: []
          }
        };
      } catch (err) {
        console.error('Greška pri parsiranju Gemini odgovora:', err);
        return {
          success: false,
          error: 'Greška pri parsiranju Gemini odgovora'
        };
      }
    } catch (error: any) {
      console.error('Greška pri komunikaciji sa Gemini API-jem:', error);
      return {
        success: false,
        error: `Gemini API greška: ${error.message || 'Nepoznata greška'}`
      };
    }
  }
}

export const geminiService = new GeminiService();