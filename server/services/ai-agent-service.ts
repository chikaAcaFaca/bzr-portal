import axios from 'axios';
import { config } from '../config';

// Tipovi podataka za upite
export interface AIQuery {
  query: string;
  context?: string[];
  userId?: string;
  maxTokens?: number;
}

export interface AIResponse {
  answer: string;
  sourceDocuments?: {
    text: string;
    metadata: {
      filename: string;
      fileType: string;
    }
  }[];
}

/**
 * Servis za AI agenta koji koristi dokumente za odgovore na pitanja
 */
export class AIAgentService {
  
  /**
   * Koristi OpenRouter API za generisanje odgovora
   */
  private async getResponseFromOpenRouter(query: string, context?: string[], maxTokens: number = 1000): Promise<string> {
    try {
      // Priprema sistemske instrukcije
      const systemInstruction = `Ti si stručnjak za bezbednost i zdravlje na radu (BZR) u Srbiji. 
Odgovori na pitanja korisnika u vezi sa BZR temama na osnovu konteksta koji ti je dat. 
Ako ne možeš da nađeš odgovor u kontekstu, reci "Ne mogu da nađem odgovor na ovo pitanje u dostupnim dokumentima."
Uvek budi formalan, precizan i kratak. Citiraj izvore kada je to moguće.`;

      // Priprema poruke sa kontekstom
      let prompt = query;
      if (context && context.length > 0) {
        prompt = `Korisnik postavlja sledeće pitanje: "${query}"\n\nEvo relevantnih informacija iz dokumenata:\n\n${context.join('\n\n')}`;
      }

      // OpenRouter API poziv
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'anthropic/claude-3-5-sonnet',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openrouterApiKey}`
          }
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('Nije dobijen validan odgovor od OpenRouter API-ja');
      }
    } catch (error) {
      console.error('Greška pri dobijanju odgovora od OpenRouter:', error);
      
      // Ako je greška vezana za API ključ ili autentikaciju, probaj fallback na Gemini
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('Prelazak na Gemini API kao rezervu...');
        return this.getResponseFromGemini(query, context, maxTokens);
      }
      
      throw new Error(`Greška pri dobijanju odgovora od AI: ${error.message}`);
    }
  }
  
  /**
   * Koristi Gemini API kao fallback ako OpenRouter ne radi
   */
  private async getResponseFromGemini(query: string, context?: string[], maxTokens: number = 1000): Promise<string> {
    try {
      // Priprema sistemske instrukcije i konteksta kao deo jedinstvenog prompta
      let prompt = `Ti si stručnjak za bezbednost i zdravlje na radu (BZR) u Srbiji.\n\n`;
      
      if (context && context.length > 0) {
        prompt += `Evo relevantnih informacija iz dokumenata:\n${context.join('\n\n')}\n\n`;
      }
      
      prompt += `Pitanje korisnika: ${query}\n\nOdgovori na pitanje korisnika u vezi sa BZR temama na osnovu konteksta. Ako ne možeš da nađeš odgovor u kontekstu, reci "Ne mogu da nađem odgovor na ovo pitanje u dostupnim dokumentima." Uvek budi formalan, precizan i kratak. Citiraj izvore kada je to moguće.`;

      // Gemini API poziv
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
        {
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.2,
            topP: 0.9,
            topK: 40
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          params: {
            key: config.geminiApiKey
          }
        }
      );

      if (response.data && 
          response.data.candidates && 
          response.data.candidates.length > 0 && 
          response.data.candidates[0].content && 
          response.data.candidates[0].content.parts && 
          response.data.candidates[0].content.parts.length > 0) {
        return response.data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Nije dobijen validan odgovor od Gemini API-ja');
      }
    } catch (error) {
      console.error('Greška pri dobijanju odgovora od Gemini:', error);
      throw new Error(`Greška pri dobijanju odgovora od AI: ${error.message}`);
    }
  }
  
  /**
   * Koristi Anthropic API direktno (ako dodamo podršku)
   */
  private async getResponseFromAnthropic(query: string, context?: string[], maxTokens: number = 1000): Promise<string> {
    try {
      // Priprema sistemske instrukcije
      const systemInstruction = `Ti si stručnjak za bezbednost i zdravlje na radu (BZR) u Srbiji. 
Odgovori na pitanja korisnika u vezi sa BZR temama na osnovu konteksta koji ti je dat. 
Ako ne možeš da nađeš odgovor u kontekstu, reci "Ne mogu da nađem odgovor na ovo pitanje u dostupnim dokumentima."
Uvek budi formalan, precizan i kratak. Citiraj izvore kada je to moguće.`;

      // Priprema poruke sa kontekstom
      let prompt = query;
      if (context && context.length > 0) {
        prompt = `Korisnik postavlja sledeće pitanje: "${query}"\n\nEvo relevantnih informacija iz dokumenata:\n\n${context.join('\n\n')}`;
      }

      // Anthropic API poziv
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: maxTokens,
          messages: [
            { role: 'user', content: prompt }
          ],
          system: systemInstruction
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.anthropicApiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      if (response.data && response.data.content) {
        return response.data.content[0].text;
      } else {
        throw new Error('Nije dobijen validan odgovor od Anthropic API-ja');
      }
    } catch (error) {
      console.error('Greška pri dobijanju odgovora od Anthropic:', error);
      throw new Error(`Greška pri dobijanju odgovora od AI: ${error.message}`);
    }
  }

  /**
   * Pretraži i dobavi relevantni kontekst iz vektorske baze
   */
  private async retrieveRelevantContext(query: string, userId?: string): Promise<string[]> {
    try {
      // Importujemo servis ovde da izbegnemo cirkularne zavisnosti
      const { vectorStorageService } = await import('./vector-storage-service');
      
      // Proveravamo da li je vektorska baza dostupna
      const isAvailable = await vectorStorageService.isAvailable();
      if (!isAvailable) {
        console.warn('Vektorska baza nije dostupna. Nije moguće dobaviti kontekst.');
        return [];
      }
      
      console.log(`Pretraživanje relevantnog konteksta za upit: ${query}`);
      
      // Pozivamo metod za dobavljanje relevantnog konteksta
      return await vectorStorageService.getRelevantContext(query, userId);
    } catch (error) {
      console.error('Greška pri dobavljanju konteksta iz vektorske baze:', error);
      return [];
    }
  }

  /**
   * Glavni metod za dobijanje odgovora od AI agenta
   */
  public async getResponse(aiQuery: AIQuery): Promise<AIResponse> {
    try {
      const { query, context, userId, maxTokens = 1000 } = aiQuery;
      
      // Dobavljanje relevantnog konteksta iz vektorske baze ako nije prosleđen kontekst
      const relevantContext = context || await this.retrieveRelevantContext(query, userId);
      
      // Dobijanje odgovora od AI modela
      const answer = await this.getResponseFromOpenRouter(query, relevantContext, maxTokens);
      
      return {
        answer,
        sourceDocuments: relevantContext.map(text => ({
          text,
          metadata: {
            filename: 'Interni dokument',  // Placeholder dok ne implementiramo vektorsku bazu
            fileType: 'text/plain'
          }
        }))
      };
    } catch (error) {
      console.error('Greška pri dobijanju odgovora od AI agenta:', error);
      throw new Error(`Greška pri dobijanju odgovora od AI agenta: ${error.message}`);
    }
  }
}

export const aiAgentService = new AIAgentService();