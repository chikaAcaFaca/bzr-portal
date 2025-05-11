import axios from 'axios';
import { vectorStorageService } from './vector-storage-service';
import { blogSearchService } from './blog-search-service';
import { BlogPost } from '@shared/schema';

// Konstanta koja određuje koliko blog postova treba da bude pronađeno da se ne bi kreirao novi
const BLOG_POST_THRESHOLD = 3;

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
   * Vraća fiksne odgovore za najčešća pitanja iz oblasti BZR
   * Koristi se kao failback kada Gemini API nije dostupan
   */
  private getDefaultResponses(query: string): string | null {
    // Normalizujemo upit za pretragu
    const normalizedQuery = query.toLowerCase().trim();
    
    // Fiksni odgovori za najčešća pitanja
    const defaultResponses: Record<string, string> = {
      'obaveze poslodavca': `# Obaveze poslodavca prema Zakonu o bezbednosti i zdravlju na radu

Prema Zakonu o bezbednosti i zdravlju na radu u Republici Srbiji, poslodavac ima sledeće glavne obaveze:

1. **Organizovanje poslova bezbednosti i zdravlja na radu** - Poslodavac mora odrediti lice za bezbednost i zdravlje na radu koje ima položen stručni ispit (član 37)

2. **Donošenje akta o proceni rizika** - Mora izraditi i doneti pisani akt o proceni rizika za sva radna mesta (član 13)

3. **Obuka zaposlenih** - Mora obezbediti zaposlenima osposobljavanje za bezbedan rad (član 27)

4. **Obezbeđivanje lične zaštitne opreme** - Dužan je obezbediti i održavati opremu za zaštitu na radu (član 15)

5. **Organizacija preventivnih i periodičnih pregleda** - Mora obezbediti preventivne i periodične preglede i ispitivanja opreme za rad i uslova radne okoline (član 15)

6. **Praćenje zdravstvenog stanja zaposlenih** - Obavezan je pratiti zdravstveno stanje zaposlenih kroz periodične lekarske preglede (član 16)

7. **Vođenje evidencija** - Mora voditi i čuvati evidencije iz oblasti bezbednosti i zdravlja na radu (član 49)

8. **Osiguranje zaposlenih** - Obavezan je osigurati zaposlene od povreda na radu, profesionalnih oboljenja i oboljenja u vezi sa radom (član 53)

Nepoštovanje ovih obaveza podleže prekršajnim odredbama zakona sa novčanim kaznama od 800.000 do 1.000.000 dinara.`,

      'bezbednost na radu': `# Bezbednost na radu - Osnovne informacije

Bezbednost na radu obuhvata mere i aktivnosti usmerene na stvaranje bezbednih uslova rada i zaštitu zdravlja zaposlenih.

## Osnovni principi bezbednosti na radu:

1. **Prevencija** - Sprečavanje povreda i profesionalnih oboljenja je prioritet
2. **Procena rizika** - Identifikacija opasnosti, procena verovatnoće i težine posledica
3. **Eliminacija opasnosti** - Primena tehničkih mera za uklanjanje izvora opasnosti
4. **Supstitucija** - Zamena opasnih materija i postupaka manje opasnim
5. **Kolektivne mere zaštite** - Primena mera koje štite sve zaposlene
6. **Lična zaštitna oprema** - Dodatna zaštita za specifične rizike
7. **Obuka i informisanje** - Kontinuirana edukacija zaposlenih o rizicima i merama zaštite

## Zakonska regulativa:

Osnovni propis koji reguliše oblast bezbednosti i zdravlja na radu u Republici Srbiji je Zakon o bezbednosti i zdravlju na radu ("Sl. glasnik RS", br. 101/2005, 91/2015 i 113/2017 - dr. zakon).

Za specifične aspekte bezbednosti na radu, konsultujte odgovarajuće pravilnike i tehničke propise koji detaljnije regulišu pojedine oblasti.`,

      'procena rizika': `# Procena rizika na radnom mestu

Procena rizika je sistematski proces identifikacije i evaluacije potencijalnih opasnosti na radnom mestu. Ovaj postupak je temelj sistema bezbednosti i zdravlja na radu.

## Proces procene rizika obuhvata:

1. **Identifikacija opasnosti** - Utvrđivanje izvora potencijalnih opasnosti na radnom mestu
   
2. **Identifikacija izloženih radnika** - Određivanje koji radnici mogu biti izloženi opasnostima
   
3. **Procena nivoa rizika** - Ocena verovatnoće nastanka povrede ili oštećenja zdravlja i težine mogućih posledica
   
4. **Odlučivanje o preventivnim merama** - Izbor i primena mera za eliminaciju ili smanjenje rizika
   
5. **Dokumentovanje** - Izrada pisanog akta o proceni rizika
   
6. **Periodično preispitivanje** - Revizija procene rizika pri svakoj promeni uslova rada

## Zakonska obaveza:

Prema članu 13. Zakona o bezbednosti i zdravlju na radu, poslodavac je dužan da donese akt o proceni rizika u pisanoj formi za sva radna mesta i da utvrdi mere za otklanjanje ili smanjenje rizika.

## Metodologija:

Pravilnikom o načinu i postupku procene rizika na radnom mestu i u radnoj okolini propisana je metodologija za sprovođenje procene rizika. Rizik se najčešće izračunava prema formuli:

**Rizik = Verovatnoća × Posledica**

Procena rizika mora biti izvršena od strane stručnih lica sa odgovarajućim licencama.`,

      'lice za bezbednost': `# Lice za bezbednost i zdravlje na radu - Uloga i odgovornosti

Lice za bezbednost i zdravlje na radu je stručno lice koje poslodavac angažuje za obavljanje poslova bezbednosti i zdravlja na radu.

## Osnovne dužnosti lica za bezbednost:

1. **Sprovođenje preventivnih mera** - Učestvovanje u izradi akta o proceni rizika i sprovođenje preventivnih mera

2. **Osposobljavanje zaposlenih** - Priprema i sprovođenje osposobljavanja zaposlenih za bezbedan rad

3. **Kontrola i nadzor** - Provera primene mera za bezbedan i zdrav rad

4. **Praćenje stanja** - Praćenje stanja u vezi sa povredama na radu i profesionalnim oboljenjima

5. **Zabrana rada** - Zabrana rada na radnom mestu ili upotrebe sredstva za rad kada utvrdi neposrednu opasnost po život ili zdravlje

6. **Saradnja** - Saradnja sa službom medicine rada i inspektorom rada

## Zakonski uslovi:

Prema članu 37. Zakona o bezbednosti i zdravlju na radu, lice za bezbednost mora imati:
- Položen stručni ispit o praktičnoj osposobljenosti za obavljanje poslova bezbednosti i zdravlja na radu
- Najmanje tri godine radnog iskustva u struci (za poslodavce sa visokim rizikom)
- Odgovarajuće obrazovanje (visoka stručna sprema za poslodavce sa visokorizičnim delatnostima)

Poslodavci sa više od 50 zaposlenih koji rade na poslovima sa povećanim rizikom moraju odrediti barem jedno lice za bezbednost sa punim radnim vremenom.`,

      'ppu': `# Prethodna i periodična uverenja (PPU) - Lekarski pregledi zaposlenih

Prethodna i periodična uverenja (PPU) su lekaraska uverenja koja proizilaze iz prethodnih i periodičnih lekarskih pregleda zaposlenih.

## Prethodni lekarski pregledi:

- Obavljaju se **pre stupanja zaposlenog na rad** na radnom mestu sa povećanim rizikom
- Cilj je utvrđivanje zdravstvene sposobnosti zaposlenog za rad na konkretnom radnom mestu
- Rezultiraju izdavanjem Prethodnog lekarskog uverenja

## Periodični lekarski pregledi:

- Obavljaju se **u toku rada** na radnom mestu sa povećanim rizikom
- Vrše se u rokovima utvrđenim aktom o proceni rizika (najčešće na 12 meseci)
- Cilj je praćenje zdravstvenog stanja zaposlenih i rano otkrivanje promena
- Rezultiraju izdavanjem Periodičnog lekarskog uverenja

## Zakonska obaveza:

Prema članu 43. Zakona o bezbednosti i zdravlju na radu, poslodavac je dužan da zaposlenom na radnom mestu sa povećanim rizikom pre početka rada obezbedi prethodni lekarski pregled, kao i periodični lekarski pregled u toku rada.

## Sadržaj pregleda:

Sadržaj i obim lekarskih pregleda definisan je Pravilnikom o prethodnim i periodičnim lekarskim pregledima zaposlenih na radnim mestima sa povećanim rizikom i zavisi od specifičnih rizika na radnom mestu.

Preglede može obavljati samo služba medicine rada koja ima odgovarajuću licencu.`,

      'osiguranje zaposlenih': `# Osiguranje zaposlenih od povreda na radu i profesionalnih bolesti

Osiguranje zaposlenih od povreda na radu je zakonska obaveza poslodavca u Republici Srbiji.

## Ključne informacije o osiguranju zaposlenih:

1. **Zakonski osnov** - Član 53. Zakona o bezbednosti i zdravlju na radu propisuje obavezu osiguranja

2. **Ko mora biti osiguran** - Svi zaposleni, bez obzira na vrstu ugovora o radu

3. **Od čega se osigurava** - Od povreda na radu, profesionalnih oboljenja i oboljenja u vezi sa radom

4. **Ko plaća osiguranje** - Poslodavac u potpunosti snosi troškove premije osiguranja

5. **Način osiguranja** - Najčešće kroz polisu kolektivnog osiguranja zaposlenih

6. **Sankcije** - Neispunjavanje ove obaveze podleže novčanim kaznama prema članu 69. Zakona

## Pokriće osiguranja:

Standardno pokriće osiguranja obično uključuje:
- Troškove lečenja usled nezgode
- Dnevne naknade za bolovanje
- Naknade za trajni invaliditet
- Naknade u slučaju smrti usled nezgode

## Preporuke:

- Osiguranje treba ugovoriti sa renomiranim osiguravajućim društvom
- Iznos osiguranja treba prilagoditi stepenu rizika u delatnosti
- Poželjno je obuhvatiti sve rizike koji su identifikovani aktom o proceni rizika`
    };
    
    // Tražimo najbolje podudaranje u ključnim rečima
    for (const [key, response] of Object.entries(defaultResponses)) {
      if (normalizedQuery.includes(key)) {
        return response;
      }
    }
    
    // Ako nema konkretnog podudaranja, vraćamo generalni odgovor o BZR
    return `# Bezbednost i zdravlje na radu

Bezbednost i zdravlje na radu (BZR) je multidisciplinarno polje koje se bavi zaštitom bezbednosti, zdravlja i dobrobiti ljudi uključenih u rad ili zaposlenje.

## Osnovni principi BZR:

1. **Prevencija je prioritet** - Sprečavanje povreda i bolesti je efikasnije od rešavanja problema nakon što se dogode
   
2. **Odgovornost poslodavca** - Poslodavac ima primarnu odgovornost za obezbeđivanje bezbednog radnog okruženja
   
3. **Uključenost zaposlenih** - Zaposleni moraju biti uključeni u odluke o bezbednosti i zdravlju
   
4. **Kontinuirano unapređenje** - Sistem bezbednosti i zdravlja mora se redovno ažurirati i poboljšavati
   
5. **Kultura bezbednosti** - Promovisanje pozitivne kulture bezbednosti u celoj organizaciji

## Glavni elementi sistema BZR:

- Procena rizika na radnom mestu
- Kontrolne mere za smanjenje rizika
- Obuka zaposlenih o bezbednom radu
- Lična zaštitna oprema
- Procedure u vanrednim situacijama
- Redovni zdravstveni pregledi
- Vođenje evidencija

Za detaljnija uputstva o specifičnim aspektima bezbednosti i zdravlja na radu, molimo Vas da postavite konkretnije pitanje.`;
  }
  
  /**
   * Dohvata najbolji mogući odgovor od dostupnih LLM servisa
   * Koristi samo Gemini API sa fallback na fiksne odgovore
   */
  private async getLLMResponse(messages: ChatMessage[]): Promise<string> {
    console.log('Započinjem proces dobavljanja LLM odgovora...');
    
    // Izvlačimo korisničko pitanje
    const userMessages = messages.filter(msg => msg.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
    
    // Proveravamo da li imamo Gemini API ključ
    if (!config.geminiApiKey) {
      console.log('Gemini API ključ nije postavljen. Koristim fiksne odgovore.');
      const defaultResponse = this.getDefaultResponses(lastUserMessage);
      if (defaultResponse) {
        return defaultResponse;
      }
      return 'Nije moguće generisati odgovor. Molimo kontaktirajte administratora.';
    }
    
    try {
      // Prvo pokušavamo sa Gemini servisom
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
      
      console.log('Preuzimam fiksni odgovor kao zamenu...');
      const defaultResponse = this.getDefaultResponses(lastUserMessage);
      if (defaultResponse) {
        return defaultResponse;
      }
      
      throw new Error('Neuspešna komunikacija sa LLM servisom (Gemini)');
    }
    

    // Kraj metode
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
      
      if (options?.checkExistingBlogs !== false) {
        console.log(`Provera postojećih blog postova za pitanje: "${query}"`);
        try {
          // Tražimo blog postove sa većom relevantnošću (50%)
          relevantBlogPosts = await blogSearchService.findRelevantBlogPosts(query, 0.5);
          console.log(`Pronađeno ${relevantBlogPosts.length} visoko relevantnih blog postova.`);
          
          // Ako ima dovoljno postojećih visoko relevantnih blog postova, ne kreiraj novi
          if (relevantBlogPosts.length >= BLOG_POST_THRESHOLD) {
            console.log(`Postoji ${relevantBlogPosts.length} visoko relevantnih blog postova, nećemo kreirati novi.`);
            shouldCreateBlogPost = false;
          } else {
            // Ako nemamo dovoljno visoko relevantnih postova, probamo sa manjom relevantnošću
            const moreRelaxedPosts = await blogSearchService.findRelevantBlogPosts(query, 0.3);
            console.log(`Pronađeno ${moreRelaxedPosts.length} delimično relevantnih blog postova.`);
            
            if (moreRelaxedPosts.length >= BLOG_POST_THRESHOLD) {
              console.log(`Postoji ${moreRelaxedPosts.length} delimično relevantnih blog postova, nećemo kreirati novi.`);
              relevantBlogPosts = moreRelaxedPosts;
              shouldCreateBlogPost = false;
            } else {
              console.log(`Nema dovoljno relevantnih blog postova, potrebno je kreirati novi.`);
            }
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
          contextText += `VAŽNO: U tvom odgovoru OBAVEZNO prvo naglasi korisniku da smo već objavili blog postove na ovu temu. 
Format obaveštenja treba da bude sledeći:

"Na našem portalu već imamo detaljne članke o ovoj temi. Preporučujemo da pogledate:
- [${limitedPosts[0]?.title || 'Članak 1'}](/blog/${limitedPosts[0]?.slug || ''})
${limitedPosts[1] ? `- [${limitedPosts[1]?.title}](/blog/${limitedPosts[1]?.slug})\n` : ''}${limitedPosts[2] ? `- [${limitedPosts[2]?.title}](/blog/${limitedPosts[2]?.slug})\n` : ''}
Nakon toga možeš ukratko odgovoriti na pitanje."

Započni odgovor sa ovim obaveštenjem i nakon toga daj kratak odgovor na pitanje.\n\n`;
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