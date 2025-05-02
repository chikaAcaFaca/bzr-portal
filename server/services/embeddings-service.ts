import axios from 'axios';
import { config } from '../config';

/**
 * Servis za generisanje vektorskih embeddings-a za tekstove
 * Koristi različite AI modele (OpenAI, Gemini, Claude) kao fallback opcije
 */
export class EmbeddingsService {
  private ready = false;

  constructor() {
    this.checkApiKeys();
  }

  private checkApiKeys() {
    if (config.openrouterApiKey) {
      console.log('OpenRouter API ključ je postavljen. Embeddings servis je spreman.');
      this.ready = true;
    } else {
      console.warn('OpenRouter API ključ nije postavljen.');
    }

    if (config.geminiApiKey) {
      console.log('Gemini API ključ je postavljen. Gemini embeddings je spreman.');
      this.ready = true;
    } else {
      console.warn('Gemini API ključ nije postavljen.');
    }

    if (!this.ready) {
      console.error('Nijedan API ključ za embeddings nije postavljen. Servis neće funkcionisati.');
    }
  }

  /**
   * Generiše embedding za dati tekst
   * Prioritetno koristi Gemini, zatim OpenRouter/OpenAI kao fallback
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    if (!this.ready) {
      console.error('Nijedan AI model za embeddings nije dostupan');
      throw new Error('Nijedan AI model za embeddings nije dostupan');
    }

    console.log(`Generisanje embeddings za tekst dužine ${text.length} karaktera...`);
    
    // Gemini pokušaj kao primarni
    if (config.geminiApiKey) {
      try {
        console.log('Pokušaj generisanja Gemini embeddings...');
        const embeddings = await this.getGeminiEmbedding(text);
        console.log(`Uspešno generisani Gemini embeddings, dužina vektora: ${embeddings.length}`);
        return embeddings;
      } catch (error) {
        console.error('Greška pri generisanju Gemini embeddings:', error);
      }
    }

    // OpenRouter pokušaj kao fallback
    if (config.openrouterApiKey) {
      try {
        console.log('Pokušaj generisanja OpenRouter embeddings (fallback)...');
        const embeddings = await this.getOpenRouterEmbedding(text);
        console.log(`Uspešno generisani OpenRouter embeddings, dužina vektora: ${embeddings.length}`);
        return embeddings;
      } catch (error) {
        console.error('Greška pri generisanju OpenRouter embeddings:', error);
      }
    }

    console.error('Nije uspelo generisanje embeddings ni sa jednim dostupnim modelom');
    throw new Error('Nije moguće generisati embedding ni sa jednim dostupnim AI modelom');
  }

  /**
   * Dohvata embedding od OpenRouter API-ja (OpenAI kompatibilni API)
   */
  private async getOpenRouterEmbedding(text: string): Promise<number[]> {
    try {
      console.log('Šaljem zahtev za OpenRouter embeddings...');
      
      // OpenRouter zahteva da input bude ili string ili niz stringova
      const response = await axios.post(
        'https://openrouter.ai/api/v1/embeddings',
        {
          model: 'openai/text-embedding-ada-002',
          input: text
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openrouterApiKey}`,
            'HTTP-Referer': 'https://bzr-portal.replit.app', // Zahtevana vrednost za OpenRouter
            'X-Title': 'BZR Portal' // Informativna vrednost za OpenRouter
          }
        }
      );

      console.log('Odgovor od OpenRouter embeddings API:', 
                  response.status, 
                  response.data && response.data.data ? 'Uspešno' : 'Neuspešno');

      if (response.data && response.data.data && response.data.data[0] && response.data.data[0].embedding) {
        const embeddingData = response.data.data[0].embedding;
        return embeddingData;
      } else {
        console.error('Neočekivan format odgovora od OpenRouter:', response.data);
        throw new Error('Nevalidan format odgovora od OpenRouter');
      }
    } catch (error) {
      console.error('Greška pri komunikaciji sa OpenRouter za embeddings:', error);
      throw new Error('Neuspešna komunikacija sa OpenRouter za generisanje embeddings-a');
    }
  }

  /**
   * Dohvata embedding od Gemini API-ja
   */
  private async getGeminiEmbedding(text: string): Promise<number[]> {
    try {
      console.log('Šaljem zahtev za Gemini embeddings...');
      
      const apiKey = config.geminiApiKey;
      if (!apiKey) {
        throw new Error('Gemini API ključ nije postavljen');
      }
      
      // Ispisujemo više podataka za debug
      console.log(`Gemini API ključ dužine: ${apiKey.length}`);
      console.log(`Tekst za embedding dužine: ${text.length} karaktera`);
      
      // Gemini zahteva maksimalnu dužinu teksta od 3000 tokena, što je otprilike 12000 karaktera
      // Sečemo tekst ako je predugačak
      const maxTextLength = 12000;
      const truncatedText = text.length > maxTextLength ? text.substring(0, maxTextLength) : text;
      if (text.length > maxTextLength) {
        console.log(`Tekst je skraćen sa ${text.length} na ${truncatedText.length} karaktera`);
      }
      
      try {
        // Gemini embeddings model koristi drugačiju strukturu zahteva
        const response = await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedText',
          {
            text: truncatedText
          },
          {
            params: {
              key: apiKey
            },
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Odgovor od Gemini embeddings API:', 
                    response.status, 
                    response.data && response.data.embedding ? 'Uspešno' : 'Neuspešno');

        if (response.data && response.data.embedding && response.data.embedding.values) {
          // Gemini vraća drugačiji format - pretvaramo u format kompatibilan sa OpenAI/text-embedding-ada-002
          let embedding = response.data.embedding.values;
          
          // Ako je potrebno proširiti embedding do 1536 dimenzija
          if (embedding.length < 1536) {
            console.log(`Gemini embedding ima ${embedding.length} dimenzija, proširujemo do 1536`);
            const padding = new Array(1536 - embedding.length).fill(0);
            embedding = [...embedding, ...padding];
          } 
          // Ako je veći od 1536, sečemo do 1536
          else if (embedding.length > 1536) {
            console.log(`Gemini embedding ima ${embedding.length} dimenzija, sečemo do 1536`);
            embedding = embedding.slice(0, 1536);
          }

          return embedding;
        } else {
          console.error('Neočekivan format odgovora od Gemini:', JSON.stringify(response.data));
          throw new Error('Nevalidan format odgovora od Gemini');
        }
      } catch (axiosError: any) {
        if (axiosError.response) {
          console.error('Gemini API odgovor greška:', 
                      axiosError.response.status, 
                      axiosError.response.data);
        } else {
          console.error('Greška pri komunikaciji sa Gemini:', axiosError.message);
        }
        throw new Error('Neuspešna komunikacija sa Gemini API za embeddings');
      }
    } catch (error) {
      console.error('Greška pri generisanju Gemini embeddings:', error);
      throw new Error('Neuspešna komunikacija sa Gemini za generisanje embeddings-a');
    }
  }
}

export const embeddingsService = new EmbeddingsService();