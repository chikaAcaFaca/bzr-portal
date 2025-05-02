import axios from 'axios';
import { vectorStorageService } from './vector-storage-service';

// Privremena konfiguracija ako ne možemo importovati iz config
const config = {
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY
};

interface AIResponse {
  answer: string;
  sourceDocuments?: any[];
  error?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Servis za AI agenta koji može da odgovara na pitanja na osnovu baze znanja
 */
export class AIAgentService {
  private readonly openrouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
  private readonly anthropicUrl = 'https://api.anthropic.com/v1/messages';
  private ready = false;

  constructor() {
    this.checkApiKeys();
  }

  private checkApiKeys() {
    if (config.openrouterApiKey) {
      console.log('OpenRouter API ključ je postavljen. OpenRouter je spreman.');
      this.ready = true;
    } else {
      console.warn('OpenRouter API ključ nije postavljen.');
    }

    if (config.geminiApiKey) {
      console.log('Gemini API ključ je postavljen. Gemini service je spreman.');
      this.ready = true;
    } else {
      console.warn('Gemini API ključ nije postavljen.');
    }

    if (config.anthropicApiKey) {
      console.log('Anthropic API ključ je postavljen. Claude je spreman.');
      this.ready = true;
    } else {
      console.warn('Anthropic API ključ nije postavljen.');
    }

    if (!this.ready) {
      console.error('Nijedan LLM API ključ nije postavljen. AI Agent neće funkcionisati.');
    }
  }

  /**
   * Dohvata odgovor od OpenRouter API-ja
   */
  private async getOpenRouterResponse(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await axios.post(
        this.openrouterUrl,
        {
          model: 'anthropic/claude-3-opus-20240229',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openrouterApiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Greška pri komunikaciji sa OpenRouter:', error);
      throw new Error('Neuspešna komunikacija sa LLM servisom (OpenRouter)');
    }
  }

  /**
   * Dohvata odgovor od Gemini API-ja kao fallback
   */
  private async getGeminiResponse(messages: ChatMessage[]): Promise<string> {
    try {
      // Konvertujemo ChatMessage format u Gemini format
      const geminiMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }]
      }));

      const response = await axios.post(
        `${this.geminiUrl}?key=${config.geminiApiKey}`,
        {
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            topP: 0.95,
            topK: 50
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Greška pri komunikaciji sa Gemini:', error);
      throw new Error('Neuspešna komunikacija sa LLM servisom (Gemini)');
    }
  }

  /**
   * Dohvata odgovor od Anthropic API-ja
   */
  private async getAnthropicResponse(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await axios.post(
        this.anthropicUrl,
        {
          model: 'claude-3-sonnet-20240229',
          messages: messages,
          max_tokens: 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.anthropicApiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('Greška pri komunikaciji sa Anthropic:', error);
      throw new Error('Neuspešna komunikacija sa LLM servisom (Claude)');
    }
  }

  /**
   * Dohvata najbolji mogući odgovor od dostupnih LLM servisa
   */
  private async getLLMResponse(messages: ChatMessage[]): Promise<string> {
    // Prvo probamo OpenRouter
    if (config.openrouterApiKey) {
      try {
        return await this.getOpenRouterResponse(messages);
      } catch (error) {
        console.warn('OpenRouter nedostupan, prebacujem na Anthropic...', error);
      }
    }

    // Zatim probamo Anthropic
    if (config.anthropicApiKey) {
      try {
        return await this.getAnthropicResponse(messages);
      } catch (error) {
        console.warn('Anthropic nedostupan, prebacujem na Gemini...', error);
      }
    }

    // Na kraju probamo Gemini
    if (config.geminiApiKey) {
      try {
        return await this.getGeminiResponse(messages);
      } catch (error) {
        console.error('Svi LLM servisi su nedostupni.', error);
        throw new Error('Svi LLM servisi su trenutno nedostupni. Pokušajte kasnije.');
      }
    }

    throw new Error('Nijedan LLM API ključ nije postavljen. AI Agent ne može da generiše odgovor.');
  }

  /**
   * Dobavlja relevantni kontekst iz vektorske baze znanja za pitanje
   */
  public async getRelevantContext(query: string, options?: {
    limit?: number;
    userId?: string;
    includePublic?: boolean;
    similarityThreshold?: number;
  }): Promise<any[]> {
    // Proverimo da li je vektorska baza dostupna
    const isVectorStoreAvailable = await vectorStorageService.isAvailable();
    if (!isVectorStoreAvailable) {
      console.warn('Vektorska baza nije dostupna. Odgovori će biti generisani bez konteksta.');
      return [];
    }

    try {
      // Pretraga vektorske baze
      const documents = await vectorStorageService.searchDocuments({
        query,
        limit: options?.limit || 5,
        userId: options?.userId,
        includePublic: options?.includePublic !== false, // Podrazumevano uključi javne dokumente
        similarityThreshold: options?.similarityThreshold || 0.7
      });

      // Transformiši dokumente u format koji je lakši za korišćenje
      return documents.map(doc => ({
        text: doc.content,
        metadata: doc.metadata
      }));
    } catch (error) {
      console.error('Greška pri dobavljanju konteksta:', error);
      return [];
    }
  }

  /**
   * Generiše odgovor na pitanje korisnika
   */
  public async generateAnswer(query: string, options?: {
    userId?: string;
    includePublic?: boolean;
    contextLimit?: number;
    history?: ChatMessage[];
  }): Promise<AIResponse> {
    if (!this.ready) {
      return {
        answer: 'AI servis trenutno nije dostupan. Proverite vaše API ključeve.',
        error: 'Nijedan LLM API ključ nije postavljen.'
      };
    }

    try {
      // 1. Dohvati relevantni kontekst iz baze znanja
      const contextDocs = await this.getRelevantContext(query, {
        limit: options?.contextLimit || 5,
        userId: options?.userId,
        includePublic: options?.includePublic
      });

      // 2. Pripremi kontekst za AI model
      let contextText = '';
      if (contextDocs.length > 0) {
        contextText = 'Relevantni kontekst iz baze znanja:\n\n';
        
        contextDocs.forEach((doc, index) => {
          contextText += `Dokument ${index + 1}: ${doc.metadata.filename || 'Nepoznat dokument'}\n`;
          contextText += `${doc.text.slice(0, 1500)}\n\n`;
        });
      }

      // 3. Pripremi poruke za AI model
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `Ti si AI asistent koji pomaže sa pitanjima o bezbednosti i zdravlju na radu prema propisima Republike Srbije. 
Odgovaraj na srpskom jeziku, ćiriličnim ili latiničnim pismom u zavisnosti od pisma kojim je korisnik postavio pitanje.
Budi koncizni i precizni u svojim odgovorima. Fokusiraj se na pružanje tačnih i korisnih odgovora.
Ako je dostupan relevantni kontekst, koristi ga kao primarni izvor informacija. Ako nešto nije jasno iz konteksta ili kontekst ne sadrži odgovor, jasno naznači da nemaš dovoljno informacija i predloži koja dodatna dokumentacija bi mogla biti relevantna.`
        }
      ];

      // Dodaj prethodnu istoriju ako postoji
      if (options?.history && options.history.length > 0) {
        messages.push(...options.history);
      }

      // Dodaj kontekst i pitanje
      if (contextText) {
        messages.push({
          role: 'user',
          content: `${contextText}\n\nMoje pitanje je: ${query}`
        });
      } else {
        messages.push({
          role: 'user',
          content: query
        });
      }

      // 4. Dobavi odgovor od LLM-a
      const answer = await this.getLLMResponse(messages);

      // 5. Vrati odgovor i izvore
      return {
        answer,
        sourceDocuments: contextDocs.length > 0 ? contextDocs : undefined
      };
    } catch (error: any) {
      console.error('Greška pri generisanju odgovora:', error);
      return {
        answer: 'Došlo je do greške pri generisanju odgovora. Molimo pokušajte ponovo.',
        error: error.message
      };
    }
  }
}

export const aiAgentService = new AIAgentService();