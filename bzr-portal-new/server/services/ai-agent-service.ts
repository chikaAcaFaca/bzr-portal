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

Dragi korisniče, prema Zakonu o bezbednosti i zdravlju na radu ("Sl. glasnik RS", br. 101/2005, 91/2015 i 113/2017 - dr. zakon), svaki poslodavac u Republici Srbiji ima sledeće ključne obaveze koje mora ispuniti:

1. **Organizovanje poslova bezbednosti i zdravlja na radu** - Prema članu 37, poslodavac je dužan da organizuje poslove za bezbednost i zdravlje na radu i odredi stručno lice sa položenim stručnim ispitom. Ovo je temelj celokupnog sistema zaštite na radu u Vašoj organizaciji.

2. **Donošenje akta o proceni rizika** - Član 13 jasno propisuje da je poslodavac obavezan da donese pisani akt o proceni rizika za sva radna mesta. Ovaj dokument je ključan jer identifikuje sve potencijalne opasnosti i mere zaštite.

3. **Osposobljavanje zaposlenih** - Prema članu 27, zaposleni moraju biti adekvatno obučeni za bezbedan rad. Ova obuka mora biti prilagođena radnom mestu i rizicima.

4. **Obezbeđivanje sredstava i opreme za ličnu zaštitu** - Član 15 nalaže da ste kao poslodavac dužni obezbediti zaposlenima odgovarajuću zaštitnu opremu prema rizicima na radnom mestu.

5. **Ispitivanje uslova radne okoline** - Prema istom članu 15, moraju se sprovesti periodična ispitivanja uslova radne okoline i pregledi opreme za rad kako bi se osiguralo njihovo ispravno funkcionisanje.

6. **Praćenje zdravstvenog stanja** - Član 16 propisuje obavezu praćenja zdravstvenog stanja zaposlenih, posebno onih na radnim mestima sa povećanim rizikom, putem ciljanih lekarskih pregleda.

7. **Vođenje evidencija** - Član 49 zahteva vođenje propisanih evidencija iz oblasti BZR, što je osnova za praćenje sprovođenja mera zaštite.

8. **Osiguranje zaposlenih** - Prema članu 53, dužni ste osigurati zaposlene od povreda na radu i profesionalnih oboljenja.

Važno je napomenuti da nepoštovanje ovih obaveza podleže prekršajnim odredbama sa novčanim kaznama od 800.000 do 1.000.000 dinara prema članu 69.

Redovno sprovođenje ovih obaveza ne samo da osigurava usklađenost sa zakonom, već stvara bezbedno radno okruženje i smanjuje rizik od povreda i profesionalnih oboljenja.`,

      'bezbednost na radu': `# Bezbednost na radu - Osnovne informacije

Poštovani, bezbednost i zdravlje na radu predstavlja sistem pravila i mera zaštite koji se primenjuju na radnim mestima kako bi se sprečile povrede, profesionalna oboljenja i očuvalo zdravlje zaposlenih. Republika Srbija ovo područje reguliše Zakonom o bezbednosti i zdravlju na radu ("Sl. glasnik RS", br. 101/2005, 91/2015 i 113/2017 - dr. zakon).

## Osnovni principi bezbednosti na radu definisani članom 12:

1. **Prevencija kao prioritet** - Član 12 propisuje primenu preventivnih mera pre početka rada. Ulaganje u prevenciju je uvek isplativije od saniranja posledica povreda.

2. **Procena rizika** - Prema članu 13, obavezna je izrada akta o proceni rizika koji identifikuje sve potencijalne opasnosti i štetnosti na radnom mestu.

3. **Hijerarhija kontrolnih mera** - Zakon u članu 15 nalaže primenu mera sledećim redosledom:
   - **Eliminacija opasnosti** - Kada je moguće, ukloniti izvor opasnosti
   - **Supstitucija** - Zamena opasnih materija i postupaka manje opasnim
   - **Tehničke mere zaštite** - Ugradnja kolektivnih zaštitnih sistema
   - **Organizacione mere** - Skraćenje vremena izlaganja, rotacija poslova
   - **Lična zaštitna oprema** - Kao dodatna mera kada prethodne nisu dovoljne

4. **Kolektivne mere zaštite** - Član 15 prioritizuje kolektivnu zaštitu nad individualnom, što znači da mere koje štite sve zaposlene imaju prednost.

5. **Obuka zaposlenih** - Članovi 27-30 detaljno propisuju obavezu osposobljavanja zaposlenih za bezbedan rad, kao i periodično ponavljanje obuke.

## Ključni podzakonski akti:

Pored osnovnog zakona, posebni pravilnici regulišu specifične oblasti poput:
- Pravilnik o načinu i postupku procene rizika
- Pravilnik o preventivnim merama za bezbedan i zdrav rad pri korišćenju opreme za rad
- Pravilnik o preventivnim merama za bezbedan i zdrav rad pri izlaganju hemijskim materijama

Pravilna primena ovih principa stvara zdravo i bezbedno radno okruženje, povećava produktivnost i smanjuje troškove koji nastaju usled povreda i bolovanja.`,

      'procena rizika': `# Procena rizika na radnom mestu

Dragi korisniče, procena rizika predstavlja jedan od najvažnijih dokumenata u sistemu bezbednosti i zdravlja na radu. To je sistematski i proaktivan proces koji omogućava identifikaciju svih potencijalnih opasnosti i štetnosti kojima mogu biti izloženi zaposleni.

## Zakonski osnov:

Član 13. Zakona o bezbednosti i zdravlju na radu ("Sl. glasnik RS", br. 101/2005, 91/2015 i 113/2017) jasno propisuje: **"Poslodavac je dužan da donese akt o proceni rizika u pisanoj formi za sva radna mesta u radnoj okolini i da utvrdi način i mere za njihovo otklanjanje."** Ova obaveza je detaljnije uređena Pravilnikom o načinu i postupku procene rizika na radnom mestu i u radnoj okolini ("Sl. glasnik RS", br. 72/2006, 84/2006, 30/2010 i 102/2015).

## Proces procene rizika sadrži šest ključnih koraka:

1. **Identifikacija opasnosti i štetnosti** - Član 4. Pravilnika nalaže pažljivu analizu svih potencijalnih opasnosti (mehaničke, električne, požar, eksplozija) i štetnosti (hemijske, fizičke, biološke, štetni mikroklimatski uslovi).
   
2. **Identifikacija izloženih radnika** - Prema članu 5, potrebno je utvrditi koja lica mogu biti izložena identifikovanim opasnostima, posebno uzimajući u obzir osetljive kategorije (trudnice, mladi radnici, osobe sa invaliditetom).
   
3. **Procena nivoa rizika** - Član 6. definiše da se rizik procenjuje kombinovanjem:
   - Verovatnoće nastanka povrede ili oštećenja zdravlja
   - Težine potencijalnih posledica
   Uobičajena formula je: **Rizik = Verovatnoća × Posledica** gde se obe komponente vrednuju numerički.
   
4. **Utvrđivanje preventivnih mera** - Član 7. zahteva definisanje konkretnih mera za svaki identifikovani rizik, uz poštovanje hijerarhije kontrolnih mera propisane zakonom.
   
5. **Izrada pisanog dokumenta** - Prema članu 8, akt o proceni rizika mora sadržati:
   - Opšte podatke o poslodavcu
   - Opis procesa rada
   - Prepoznate i utvrđene opasnosti i štetnosti
   - Procenu rizika za svako radno mesto
   - Utvrđene mere za kontrolu i smanjenje rizika
   - Zaključak sa pregledom radnih mesta sa povećanim rizikom
   
6. **Periodično preispitivanje** - Član 15. propisuje obavezu revizije akta o proceni rizika u slučaju:
   - Teške povrede na radu ili smrtnog ishoda
   - Promene u procesu rada koje mogu uticati na rizik
   - Kada mere zaštite nisu adekvatne
   - Minimum svakih tri godine za radna mesta sa povećanim rizikom

Procenu rizika moraju izvršiti stručna lica sa odgovarajućim licencama, a poslodavac je odgovoran za sprovođenje utvrđenih mera. Pravilno izrađen akt o proceni rizika ne samo da ispunjava zakonsku obavezu već suštinski doprinosi prevenciji povreda i profesionalnih oboljenja.`,

      'lice za bezbednost': `# Lice za bezbednost i zdravlje na radu - Uloga i zakonske odgovornosti

Poštovani, lice za bezbednost i zdravlje na radu ima ključnu ulogu u implementaciji i održavanju sistema zaštite zaposlenih. Ova funkcija je detaljno uređena Zakonom o bezbednosti i zdravlju na radu, a posebno članovima 37-40.

## Zakonski osnov:

Član 37. Zakona o bezbednosti i zdravlju na radu ("Sl. glasnik RS", br. 101/2005, 91/2015 i 113/2017) propisuje da je poslodavac dužan da organizuje poslove za bezbednost i zdravlje na radu, što uključuje određivanje stručnog lica - lica za bezbednost i zdravlje na radu.

## Osnovne dužnosti propisane članom 40:

1. **Učestvovanje u izradi akta o proceni rizika** - Lice za bezbednost aktivno učestvuje u identifikaciji opasnosti i proceni rizika na radnim mestima.

2. **Kreiranje i sprovođenje preventivnih mera** - Na osnovu člana 40, stav 1, tačka 3, lice za bezbednost priprema i sprovodi mere za poboljšanje uslova rada i smanjenje rizika.

3. **Osposobljavanje zaposlenih** - Prema članu 40, stav 1, tačka 4, lice priprema i sprovodi osposobljavanje zaposlenih za bezbedan rad, što uključuje teorijsku i praktičnu obuku.

4. **Redovni nadzor i kontrola** - Član 40, stav 1, tačka 7 nalaže praćenje primene mera za bezbednost i zdravlje zaposlenih na radnom mestu.

5. **Praćenje povreda i profesionalnih oboljenja** - Obaveza vođenja evidencija i analize uzroka povreda, profesionalnih oboljenja i bolesti u vezi sa radom.

6. **Zabrana rada u slučaju opasnosti** - Ključno ovlašćenje propisano članom 40, stav 1, tačka 8 - pravo i obaveza da zabrani rad kada postoji neposredna opasnost po život ili zdravlje zaposlenog.

7. **Saradnja sa drugim subjektima** - Prema članu 40, stav 1, tačka 10, lice sarađuje sa službom medicine rada, inspekcijom rada i drugim institucijama.

## Zakonski zahtevi za lice za bezbednost (član 37):

- **Stručni ispit** - Položen stručni ispit o praktičnoj osposobljenosti za obavljanje poslova bezbednosti i zdravlja na radu
- **Radno iskustvo** - Za poslodavce sa visokorizičnim delatnostima, najmanje tri godine radnog iskustva u struci
- **Obrazovanje** - Visoka stručna sprema tehničke struke za poslodavce koji imaju visokorizične delatnosti ili više od 50 zaposlenih na poslovima sa povećanim rizikom

## Organizacioni zahtevi (član 37):

- Poslodavac koji ima do 20 zaposlenih može sam obavljati poslove BZR ili ih poveriti drugom licu
- Poslodavac koji ima 21-50 zaposlenih mora odrediti jedno lice za bezbednost i zdravlje na radu
- Poslodavac sa više od 50 zaposlenih na poslovima sa povećanim rizikom mora odrediti najmanje jedno lice isključivo za poslove bezbednosti i zdravlja na radu

Stručno i odgovorno lice za bezbednost predstavlja temelj efikasnog sistema zaštite na radu i značajno doprinosi prevenciji povreda i profesionalnih oboljenja.`,

      'ppu': `# Odgovor na pitanje o prethodnim i periodičnim lekarskim pregledima (PPU)

Pitali ste o prethodnim i periodičnim uverenjima (PPU) koja se odnose na lekarske preglede zaposlenih. Evo konkretnog odgovora na Vaše pitanje:

Prethodna i periodična lekarska uverenja (PPU) su zakonski obavezni dokumenti koji potvrđuju zdravstvenu sposobnost zaposlenih za rad na radnim mestima sa povećanim rizikom. Ova obaveza je jasno definisana u članu 43. Zakona o bezbednosti i zdravlju na radu.

**Prema Vašem pitanju, evo šta je potrebno znati:**

1. **Kada se obavljaju prethodni pregledi?** 
   - Pre nego što zaposleni započne rad na radnom mestu sa povećanim rizikom
   - Poslodavac **ne sme dozvoliti** rad zaposlenom bez ovog uverenja

2. **Kada se obavljaju periodični pregledi?**
   - U toku rada, u intervalima koji su definisani aktom o proceni rizika
   - Najčešće se obavljaju na 12 meseci, ali to može varirati zavisno od vrste rizika
   - Propuštanje ovih pregleda predstavlja prekršaj koji podleže kazni prema članu 69

3. **Ko može izdati PPU?**
   - Isključivo služba medicine rada koja ima odgovarajuću licencu izdatu od Ministarstva zdravlja
   - Poslodavac mora imati ugovor sa takvom službom

4. **Šta se dešava ako zaposleni nije zdravstveno sposoban?**
   - Poslodavac mora ponuditi drugo odgovarajuće radno mesto bez povećanog rizika
   - Ako takvog mesta nema, zaposlenom ne može biti otkazan ugovor o radu po tom osnovu

5. **Koje su posledice nepridržavanja ove obaveze?**
   - Novčane kazne od 800.000 do 1.000.000 dinara za pravno lice prema članu 69
   - Kazna od 40.000 do 50.000 dinara za odgovorno lice

Ova dokumentacija je ključna u dokazivanju da ste kao poslodavac preduzeli sve zakonske mere za zaštitu zaposlenih na radnim mestima sa povećanim rizikom.`,

      'osiguranje zaposlenih': `# Odgovor na pitanje o osiguranju zaposlenih od povreda na radu

Pitali ste o osiguranju zaposlenih od povreda na radu i profesionalnih bolesti. Evo direktnog odgovora sa svim potrebnim informacijama:

**Da, osiguranje zaposlenih od povreda na radu i profesionalnih bolesti je zakonska obaveza svakog poslodavca u Republici Srbiji.** Ova obaveza je jasno definisana članom 53. Zakona o bezbednosti i zdravlju na radu, koji kaže: "Poslodavac je dužan da zaposlene osigura od povreda na radu, profesionalnih oboljenja i oboljenja u vezi sa radom, radi obezbeđivanja naknade štete."

**Što se tiče Vašeg pitanja, evo ključnih činjenica koje morate znati:**

1. **Ko mora biti osiguran?**
   - Apsolutno svi zaposleni, bez izuzetka
   - Obaveza važi bez obzira na vrstu ugovora o radu (određeno, neodređeno)
   - Odnosi se i na zaposlene sa nepunim radnim vremenom

2. **Ko snosi troškove osiguranja?**
   - Isključivo poslodavac, u potpunosti (100%)
   - Zabranjeno je prebacivanje troškova osiguranja na zaposlene

3. **Kako se sprovodi osiguranje?**
   - Zaključenjem ugovora o osiguranju sa osiguravajućim društvom
   - Najčešće kroz polisu kolektivnog osiguranja zaposlenih
   - Polisa mora pokrivati minimum: lečenje, invaliditet, i smrt usled povrede na radu

4. **Koje su posledice nepridržavanja ove obaveze?**
   - Novčana kazna od 800.000 do 1.000.000 dinara za pravno lice (prema članu 69)
   - Odgovorno lice može biti kažnjeno sa 40.000 do 50.000 dinara

5. **Da li je ovo osiguranje isto što i zdravstveno osiguranje?**
   - Ne, ovo je dodatno osiguranje pored obaveznog zdravstvenog osiguranja
   - Njegovom svrhom se smatra obezbeđivanje naknade štete zaposlenima

Bitno je napomenuti da je prema nedavnim tumačenjima Ministarstva za rad, vođenje evidencije o polisi osiguranja sastavni deo obavezne dokumentacije iz oblasti BZR koju poslodavac mora imati.`
    };
    
    // Tražimo najbolje podudaranje u ključnim rečima
    for (const [key, response] of Object.entries(defaultResponses)) {
      if (normalizedQuery.includes(key)) {
        return response;
      }
    }
    
    // Pošto pitanje nije prepoznato u konkretnim odgovorima, pokušaćemo da damo direktan odgovor na osnovu sadržaja pitanja
    
    // Pokušavamo izvući ključne reči iz pitanja
    const keywords = normalizedQuery.split(' ').filter(word => word.length > 3);
    
    // Pokušavamo odrediti koje zakonske odredbe bi mogle biti relevantne
    let relevantArticles = '';
    
    if (normalizedQuery.includes('kazn') || normalizedQuery.includes('prekršaj')) {
      relevantArticles = `Kazne za prekršaje u oblasti BZR definisane su članovima 69-73 Zakona o bezbednosti i zdravlju na radu, a kreću se od 800.000 do 1.000.000 dinara za pravna lica za teže prekršaje.`;
    } else if (normalizedQuery.includes('osposobljavanje') || normalizedQuery.includes('obuka')) {
      relevantArticles = `Osposobljavanje za bezbedan rad regulisano je članovima 27-31 Zakona o bezbednosti i zdravlju na radu i mora se sprovesti pre početka rada zaposlenog.`;
    } else if (normalizedQuery.includes('oprema') || normalizedQuery.includes('sredstva')) {
      relevantArticles = `Sredstva i oprema za ličnu zaštitu regulisani su članom 15 Zakona i Pravilnikom o preventivnim merama za bezbedan i zdrav rad pri korišćenju sredstava i opreme za ličnu zaštitu na radu.`;
    }
    
    return `# Odgovor na Vaše pitanje o bezbednosti i zdravlju na radu

Poštovani, na osnovu Vašeg pitanja "${query}", mogu Vam pružiti sledeće informacije:

Zakon o bezbednosti i zdravlju na radu ("Sl. glasnik RS", br. 101/2005, 91/2015 i 113/2017) reguliše ovu oblast i propisuje konkretne obaveze i mere koje moraju biti implementirane na radnim mestima.

${relevantArticles}

Da bih Vam pružio/la precizniji odgovor, molim Vas da postavite specifičnije pitanje vezano za:
- Konkretne obaveze poslodavca koje Vas interesuju
- Procenu rizika i potrebnu dokumentaciju
- Ulogu lica za bezbednost i zdravlje na radu
- Prava i obaveze zaposlenih
- Osposobljavanje za bezbedan rad
- Periodične preglede i ispitivanja
- Osiguranje od povreda na radu

Na taj način moći ću da Vam pružim detaljan odgovor sa referencama na tačne članove zakona i podzakonskih akata koji regulišu Vaše konkretno pitanje.`;
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