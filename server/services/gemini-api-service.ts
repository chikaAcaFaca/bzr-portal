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
   * Šalje upit Gemini API-ju i dobija odgovor
   */
  async query(userMessage: string, systemMessage: string): Promise<GeminiResponse> {
    if (!this.geminiKey) {
      return {
        success: false,
        error: 'Gemini API ključ nije postavljen.'
      };
    }
    
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
                { text: systemMessage },
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