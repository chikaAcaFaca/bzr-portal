import axios from 'axios';
import { config } from '../config';

/**
 * Servis za generisanje vektorskih embeddings-a za tekstove
 * Koristi različite AI modele (OpenAI, Gemini, Claude) kao fallback opcije
 */
export class EmbeddingsService {
  private readonly openrouterUrl = 'https://openrouter.ai/api/v1/embeddings';
  private readonly geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedText';
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
   * Prioritetno koristi OpenRouter/OpenAI, zatim Gemini kao fallback
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    if (!this.ready) {
      console.error('Nijedan AI model za embeddings nije dostupan');
      throw new Error('Nijedan AI model za embeddings nije dostupan');
    }

    console.log(`Generisanje embeddings za tekst dužine ${text.length} karaktera...`);
    
    // OpenRouter pokušaj
    if (config.openrouterApiKey) {
      try {
        console.log('Pokušaj generisanja OpenRouter embeddings...');
        const embeddings = await this.getOpenRouterEmbedding(text);
        console.log(`Uspešno generisani OpenRouter embeddings, dužina vektora: ${embeddings.length}`);
        return embeddings;
      } catch (error) {
        console.error('Greška pri generisanju OpenRouter embeddings:', error);
      }
    }

    // Gemini pokušaj kao fallback
    if (config.geminiApiKey) {
      try {
        console.log('Pokušaj generisanja Gemini embeddings (fallback)...');
        const embeddings = await this.getGeminiEmbedding(text);
        console.log(`Uspešno generisani Gemini embeddings, dužina vektora: ${embeddings.length}`);
        return embeddings;
      } catch (error) {
        console.error('Greška pri generisanju Gemini embeddings:', error);
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
      const response = await axios.post(
        this.openrouterUrl,
        {
          model: 'openai/text-embedding-ada-002',
          input: text,
          dimensions: 1536 // Standardna dimenzija za text-embedding-ada-002
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openrouterApiKey}`
          }
        }
      );

      return response.data.data[0].embedding;
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
      const response = await axios.post(
        `${this.geminiUrl}?key=${config.geminiApiKey}`,
        {
          text: text
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Gemini vraća drugačiji format - pretvaramo u format kompatibilan sa OpenAI/text-embedding-ada-002
      // Obično ima manju dimenziju, pa dodajemo nule da dopunimo do 1536 ako treba
      let embedding = response.data.embedding.values;
      
      // Ako je potrebno proširiti embedding do 1536 dimenzija
      if (embedding.length < 1536) {
        const padding = new Array(1536 - embedding.length).fill(0);
        embedding = [...embedding, ...padding];
      } 
      // Ako je veći od 1536, sečemo do 1536
      else if (embedding.length > 1536) {
        embedding = embedding.slice(0, 1536);
      }

      return embedding;
    } catch (error) {
      console.error('Greška pri komunikaciji sa Gemini za embeddings:', error);
      throw new Error('Neuspešna komunikacija sa Gemini za generisanje embeddings-a');
    }
  }
}

export const embeddingsService = new EmbeddingsService();