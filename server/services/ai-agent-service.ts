import axios from 'axios';
import { vectorStorageService } from './vector-storage-service';
import { blogSearchService } from './blog-search-service';
import { BlogPost } from '@shared/schema';

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
  relevantBlogPosts?: BlogPost[];
  shouldCreateBlogPost?: boolean;
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
  private readonly geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';
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
   * Dohvata odgovor od Gemini API-ja kao primarni servis
   * Koristi pojednostavljenu strukturu poruka za Gemini API
   */
  private async getGeminiResponse(messages: ChatMessage[]): Promise<string> {
    try {
      console.log('Pozivanje Gemini API-ja...');
      
      // Za Gemini je najbolje koristiti jednostavniji model sa jednom porukom
      // izdvajamo sistemsku poruku
      const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
      
      // izdvajamo korisničku poruku (poslednju)
      const userMessages = messages.filter(msg => msg.role === 'user');
      const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
      
      // pravimo jednostavniji format koji sigurno radi sa Gemini
      const prompt = `${systemMessage}\n\n${lastUserMessage}`;
      
      console.log(`Gemini prompt dužina: ${prompt.length} karaktera`);
      
      // Koristimo jednostavniji API poziv za Gemini
      // Koristimo model sa manjim ograničenjima zbog quota limits-a
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${config.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            topP: 0.95
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Gemini API odgovor primljen, provera strukture...');
      
      // Provera odgovora i prikaz potencijalnih problema
      if (!response.data) {
        console.error('Gemini API je vratio prazan odgovor');
        throw new Error('Prazan odgovor od Gemini API-ja');
      }
      
      if (response.data.promptFeedback && response.data.promptFeedback.blockReason) {
        console.error('Gemini je blokirao prompt:', response.data.promptFeedback);
        throw new Error(`Gemini je blokirao prompt: ${response.data.promptFeedback.blockReason}`);
      }
      
      if (!response.data.candidates || response.data.candidates.length === 0) {
        console.error('Gemini nije vratio kandidate:', response.data);
        throw new Error('Nema kandidata u odgovoru od Gemini API-ja');
      }
      
      const candidate = response.data.candidates[0];
      
      if (candidate.finishReason === 'SAFETY') {
        console.error('Gemini je blokirao odgovor iz sigurnosnih razloga:', candidate.safetyRatings);
        throw new Error('Gemini je blokirao odgovor iz sigurnosnih razloga');
      }
      
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('Gemini odgovor nema sadržaj:', candidate);
        throw new Error('Nepotpun odgovor od Gemini API-ja');
      }
      
      const text = candidate.content.parts[0].text;
      
      if (!text) {
        console.error('Gemini odgovor nema tekst:', candidate.content.parts[0]);
        throw new Error('Nema teksta u odgovoru od Gemini API-ja');
      }
      
      console.log('Gemini API je uspešno odgovorio, dužina odgovora:', text.length);
      return text;
    } catch (error: any) {
      // Detaljniji prikaz greške za debugging
      console.error('Greška pri komunikaciji sa Gemini:', error.message);
      if (error.response) {
        console.error('Gemini API status:', error.response.status);
        console.error('Gemini API odgovor:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('Gemini API zahtev poslat ali nema odgovora');
      } else {
        console.error('Greška pre slanja zahteva:', error.message);
      }
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
   * Koristi samo Gemini API
   */
  private async getLLMResponse(messages: ChatMessage[]): Promise<string> {
    console.log('Započinjem proces dobavljanja LLM odgovora...');
    
    // Koristimo samo Gemini
    console.log('Koristimo isključivo Gemini API za odgovore');
    
    // Proveravamo da li imamo Gemini API ključ
    if (!config.geminiApiKey) {
      throw new Error('Gemini API ključ nije postavljen. AI Agent ne može da generiše odgovor.');
    }
    
    try {
      console.log('Pokušavam sa Gemini servisom...');
      const response = await this.getGeminiResponse(messages);
      console.log('Gemini je uspešno dao odgovor.');
      return response;
    } catch (error: any) {
      console.error('Greška pri komunikaciji sa Gemini:', error.message);
      if (error.response && error.response.status) {
        console.log('Gemini API status:', error.response.status);
        console.log('Gemini API odgovor:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error('Neuspešna komunikacija sa LLM servisom (Gemini)');
    }
    
    // Stara implementacija koja se sada ignoriše
    const servicePriority = [
      { 
        name: 'Gemini', 
        hasKey: !!config.geminiApiKey, 
        handler: this.getGeminiResponse.bind(this)
      }
    ];
    
    // Uvek koristimo samo Gemini
    const availableServices = [servicePriority[0]];
    
    if (availableServices.length === 0) {
      console.error('Nijedan LLM servis nije dostupan - nema API ključeva.');
      throw new Error('Nijedan LLM API ključ nije postavljen. AI Agent ne može da generiše odgovor.');
    }
    
    console.log(`Dostupni LLM servisi (${availableServices.length}): ${availableServices.map(s => s.name).join(', ')}`);
    
    // Pokušaj redom sa svakim dostupnim servisom
    let lastError = null;
    
    for (const service of availableServices) {
      try {
        console.log(`Pokušavam sa ${service.name} servisom...`);
        const response = await service.handler(messages);
        console.log(`${service.name} je uspešno dao odgovor.`);
        return response;
      } catch (error: any) {
        console.warn(`${service.name} servis nije dostupan: ${error.message}`);
        lastError = error;
        // Nastavljamo sa sledećim servisom
      }
    }
    
    // Ako smo došli dovde, znači da nijedan servis nije uspeo
    console.error('Svi LLM servisi su nedostupni.', lastError);
    throw new Error('Svi LLM servisi su trenutno nedostupni. Pokušajte kasnije.');
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
    checkExistingBlogs?: boolean;
  }): Promise<AIResponse> {
    if (!this.ready) {
      return {
        answer: 'AI servis trenutno nije dostupan. Proverite vaše API ključeve.',
        error: 'Nijedan LLM API ključ nije postavljen.'
      };
    }

    try {
      // 0. Provera postojećih blog postova za ovo pitanje
      let relevantBlogPosts: BlogPost[] = [];
      let shouldCreateBlogPost = true;
      
      // Limit blog postova koji se smatraju dovoljnim
      const BLOG_POST_THRESHOLD = 3;
      
      if (options?.checkExistingBlogs !== false) {
        console.log(`Provera postojećih blog postova za pitanje: "${query}"`);
        try {
          relevantBlogPosts = await blogSearchService.findRelevantBlogPosts(query, 0.4); // Minimum 40% relevantnosti
          console.log(`Pronađeno ${relevantBlogPosts.length} relevantnih blog postova.`);
          
          // Ako ima dovoljno postojećih blog postova, ne kreiraj novi
          if (relevantBlogPosts.length >= BLOG_POST_THRESHOLD) {
            console.log(`Postoji ${relevantBlogPosts.length} relevantnih blog postova, nećemo kreirati novi.`);
            shouldCreateBlogPost = false;
          }
        } catch (error) {
          console.error('Greška pri pretrazi blog postova:', error);
          // Nastavljamo sa izvršavanjem i ignorišemo grešku
        }
      }

      // 1. Dohvati relevantni kontekst iz baze znanja
      const contextDocs = await this.getRelevantContext(query, {
        limit: options?.contextLimit || 5,
        userId: options?.userId,
        includePublic: options?.includePublic
      });

      // 2. Pripremi kontekst za AI model
      let contextText = '';
      
      // Prvo dodaj relevantne blogove u kontekst ako postoje
      if (relevantBlogPosts.length > 0) {
        contextText += 'Relevantni postojeći blog postovi:\n\n';
        // Ograničimo na najviše 3 najrelevantnija bloga
        const limitedPosts = relevantBlogPosts.slice(0, 3);
        limitedPosts.forEach((post, index) => {
          contextText += `Blog ${index + 1} - ${post.title}:\n`;
          contextText += `${post.excerpt || ''}\n`;
          contextText += `Link: /blog/${post.slug}\n\n`;
        });
        
        // Dodajemo napomenu o relevantnim blogovima koje korisnik treba da vidi
        if (relevantBlogPosts.length > 0) {
          contextText += `VAŽNO: U tvom odgovoru OBAVEZNO naglasi korisniku da smo već objavili blog postove na ovu temu i navedi linkove ka njima (/${limitedPosts.map(p => `blog/${p.slug}`).join(', /')}). Započni odgovor sa referencom na ove linkove!\n\n`;
        }
      }
      
      // Zatim dodaj dokumente iz baze znanja
      if (contextDocs.length > 0) {
        contextText += 'Relevantni kontekst iz baze znanja:\n\n';
        
        contextDocs.forEach((doc, index) => {
          contextText += `Dokument ${index + 1}: ${doc.metadata.filename || 'Nepoznat dokument'}\n`;
          contextText += `${doc.text.slice(0, 1500)}\n\n`;
        });
      }

      // 3. Pripremi poruke za AI model
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `Ti si prijateljski i stručni AI asistent "BZR Savetnik" koji pomaže sa pitanjima o bezbednosti i zdravlju na radu prema propisima Republike Srbije.

STIL KOMUNIKACIJE:
- Uvek odgovaraj ljubazno, pristupačno i sa empatijom kao da razgovaraš sa kolegom iz struke
- Koristi jednostavan i razumljiv jezik, ali zadržavajući stručnu terminologiju gde je potrebno
- Budi srdačan ali profesionalan, izbegavaj previše formalni stil, ali zadrži stručni ton
- Obraćaj se direktno korisniku koristeći "Vi" formu iz poštovanja

FORMAT ODGOVORA:
- Započni sa jasnim, direktnim odgovorom na pitanje
- Organizuj složenije odgovore u kratke pasuse sa podnaslovima gde je to potrebno
- Ako citiraš propise, jasno navedi član i zakon
- Izbegavaj komplikovane pravne formulacije - objasni propise jednostavnim jezikom

SADRŽAJ:
- Odgovaraj na srpskom jeziku, koristi pismo (ćirilicu/latinicu) kojim je korisnik postavio pitanje
- Fokusiraj se na pružanje korisnih i tačnih informacija iz propisa Republike Srbije
- Koristi relevantni kontekst iz baze znanja kao primarni izvor informacija
- Ako nemaš dovoljno informacija, priznaj to i predloži koja dodatna dokumentacija bi mogla biti relevantna
- Kada spominješ zakonske obaveze, navedi ih precizno i jasno

Tvoj cilj je da korisniku pružiš korisne i stručne informacije o zaštiti na radu na način koji je prijatan i razumljiv.`
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

      // 5. Vrati odgovor, izvore i informacije o pronađenim blog postovima
      return {
        answer,
        sourceDocuments: contextDocs.length > 0 ? contextDocs : undefined,
        relevantBlogPosts: relevantBlogPosts.length > 0 ? relevantBlogPosts : undefined,
        shouldCreateBlogPost
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