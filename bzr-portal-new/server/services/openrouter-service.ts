import fetch from 'node-fetch';

type AIProcessingResult<T> = {
  success: boolean;
  data?: T[];
  error?: string;
};

interface JobPosition {
  title: string;
  department: string;
  requiredEducation: string;
  coefficient: number;
  requiredSkills: string[];
  responsibilities: string[];
}

interface Employee {
  firstName: string;
  lastName: string;
  jobPositionTitle: string;
  email?: string;
  phone?: string;
  personalIdNumber?: string;  // JMBG
  identificationNumber?: string;  // Lična karta
  street?: string;
  streetNumber?: string;
  city?: string;
  postalCode?: string;
  children?: {
    firstName: string;
    lastName: string;
    birthDate: string;
  }[];
}

interface JobDescription {
  jobPositionTitle: string;
  description: string;
  duties: string[];
  workingConditions: string;
  equipment: string[];
}

interface RiskCategory {
  name: string;
  description: string;
  riskLevel: string;
  jobPositionIds: number[];
}

class OpenRouterService {
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private apiKey = process.env.OPENROUTER_API_KEY;
  private lawKnowledgeBase: string;

  constructor() {
    if (!this.apiKey) {
      console.warn('OpenRouter API ključ nije postavljen. Obrada dokumenata neće raditi.');
    }
    this.lawKnowledgeBase = `
      Zakon o bezbednosti i zdravlju na radu
      Zakon o radu
      Pravilnik o preventivnim merama za bezbedan i zdrav rad
      Pravilnik o evidencijama u oblasti bezbednosti i zdravlja na radu
    `;
  }

  async processSystematizationDocument(documentText: string): Promise<AIProcessingResult<JobPosition>> {
    const prompt = `
      Analiziraj sledeći dokument sistematizacije:
      ${documentText}
      
      Ekstraktuj sve informacije o radnim mestima i vrati ih u strukturiranom formatu.
      Obrati pažnju na:
      1. Nazive radnih mesta
      2. Potrebne kvalifikacije
      3. Odgovornosti
      4. Zahteve radnog mesta
      5. Rizike povezane sa radnim mestom
    `;
    return this.processWithAI<JobPosition>(prompt);
  }

  async processJobDescriptionDocument(documentText: string): Promise<AIProcessingResult<JobDescription>> {
    const prompt = `
      Analiziraj sledeći dokument opisa poslova:
      ${documentText}
      
      Ekstraktuj detaljne informacije o:
      1. Specifičnim dužnostima
      2. Radnim zadacima
      3. Potrebnoj opremi
      4. Uslovima rada
      5. Merama zaštite
    `;
    return this.processWithAI<JobDescription>(prompt);
  }

  async analyzeLegalCompliance(question: string): Promise<string> {
    const prompt = `
      Kao ekspert za bezbednost i zdravlje na radu, sa detaljnim poznavanjem:
      ${this.lawKnowledgeBase}
      
      Odgovori na sledeće pitanje ili analiziraj usklađenost:
      ${question}
    `;
    
    const result = await this.processWithAI<{ answer: string }>(prompt);
    return result.success ? result.data?.[0]?.answer || '' : '';
  }

  private async processWithAI<T>(prompt: string): Promise<AIProcessingResult<T>> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenRouter API ključ nije postavljen. Kontaktirajte administratora.'
      };
    }

    // Dodatna provera dužine prompta
    if (prompt.length > 100000) {
      console.warn('Prompt je veoma dugačak (preko 100000 karaktera). Ovo može uticati na performanse ili uzrokovati greške.');
    }

    try {
      // Dodato timeout od 120 sekundi (2 minute)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://replit.com'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3-opus-20240229',
            messages: [
              {
                role: 'system',
                content: 'Ti si AI asistent specijalizovan za obradu dokumenata u vezi sa bezbednošću i zdravljem na radu. Tvoj zadatak je da analiziraš dokumente i ekstraktuješ ključne podatke u strukturiranom formatu. Odgovaraj isključivo u JSON formatu bez dodatnih objašnjenja i uvek koristi format sa "items" nizom.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1, // Niža temperatura za preciznije odgovore
            max_tokens: 4000  // Povećan limit za veće dokumente
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorBody = await response.text();
          console.error('OpenRouter API error:', errorBody);
          
          // Provjeri specifične greške
          if (response.status === 429) {
            return {
              success: false,
              error: 'Rate limit prekoračen. Molimo sačekajte nekoliko minuta pre nego što pokušate ponovo.'
            };
          } else if (response.status === 413) {
            return {
              success: false,
              error: 'Dokument je prevelik za obradu. Molimo smanjite veličinu dokumenta.'
            };
          } else if (response.status >= 500) {
            return {
              success: false,
              error: `Greška na AI servisu. Pokušaćemo da koristimo Gemini kao backup. Detalji: ${response.status} ${response.statusText}`
            };
          }
          
          return {
            success: false,
            error: `API greška: ${response.status} ${response.statusText}`
          };
        }

        const data = await response.json() as any;
        console.log('OpenRouter API response status:', data?.object || 'unknown', 'model:', data?.model || 'unknown');
        
        // Uzmi sadržaj odgovora
        const content = data.choices && data.choices[0]?.message?.content;
        
        if (!content) {
          console.error('Nema sadržaja u odgovoru: ', data);
          return {
            success: false,
            error: 'Nema sadržaja u odgovoru od AI servisa.'
          };
        }
        
        let parsedData;
        try {
          // Pokušaj da direktno parsiraj ako već nije JSON
          if (typeof content === 'string') {
            parsedData = JSON.parse(content);
          } else {
            parsedData = content;
          }
          
          // Verifikuj strukturu podataka
          if (!parsedData || typeof parsedData !== 'object') {
            throw new Error('Odgovor nije validan JSON objekat');
          }
          
          // Normalizuj različite strukture odgovora
          if (!parsedData.items) {
            // Ako imamo niz na najvišem nivou
            if (Array.isArray(parsedData)) {
              parsedData = { items: parsedData };
            } 
            // Ako imamo objekat sa različitim ključevima koji su nizovi
            else if (typeof parsedData === 'object') {
              const arrayKeys = Object.keys(parsedData).filter(key => 
                Array.isArray(parsedData[key]) && 
                parsedData[key].length > 0 && 
                typeof parsedData[key][0] === 'object'
              );
              
              if (arrayKeys.length > 0) {
                parsedData = { items: parsedData[arrayKeys[0]] };
              } else {
                // Ako nemamo niz, ali imamo pojedinačan objekat, stavimo ga u niz
                const objKeys = Object.keys(parsedData).filter(key => 
                  typeof parsedData[key] === 'object' && !Array.isArray(parsedData[key])
                );
                
                if (objKeys.length > 0) {
                  parsedData = { items: [parsedData] };
                } else {
                  parsedData = { items: [] };
                }
              }
            } else {
              parsedData = { items: [] };
            }
          }
          
          // Proveri da li je items zaista niz
          if (!Array.isArray(parsedData.items)) {
            parsedData.items = [parsedData.items];
          }
          
          // Filtriraj null i undefined vrednosti iz niza
          parsedData.items = parsedData.items.filter(item => item !== null && item !== undefined);
          
          // Log za bolji debug
          console.log(`Processed ${parsedData.items.length} items from AI response`);
          
        } catch (e) {
          console.error('Greška pri parsiranju JSON odgovora:', e, 'Raw content:', content);
          // Pokušaj da direktno koristimo odgovor kao string ako nije ispravan JSON
          if (typeof content === 'string' && content.length > 0) {
            // Pokušaj da nađemo bilo kakve JSON podatke u odgovoru
            try {
              const jsonMatch = content.match(/\{.*\}/s);
              if (jsonMatch) {
                const extractedJson = jsonMatch[0];
                parsedData = JSON.parse(extractedJson);
                
                if (!parsedData.items && typeof parsedData === 'object') {
                  parsedData = { items: [parsedData] };
                }
              } else {
                throw new Error('Nije pronađen JSON u odgovoru');
              }
            } catch (nestedError) {
              return {
                success: false,
                error: 'Greška pri parsiranju odgovora od AI servisa: ' + (e as Error).message
              };
            }
          } else {
            return {
              success: false,
              error: 'Greška pri parsiranju odgovora od AI servisa: ' + (e as Error).message
            };
          }
        }

        return {
          success: true,
          data: parsedData.items || []
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      // Posebna obrada za timeout
      if (error.name === 'AbortError') {
        console.error('Timeout prilikom čekanja na odgovor od AI servisa');
        return {
          success: false,
          error: 'Isteklo je vreme za odgovor od AI servisa. Pokušajte sa manjim dokumentom ili kasnije.'
        };
      }
      
      console.error('Greška pri obradi dokumenta sa AI:', error);
      return {
        success: false,
        error: error.message || 'Nepoznata greška pri obradi dokumenta'
      };
    }
  }

  async parseJobPositionDocument(documentText: string): Promise<AIProcessingResult<JobPosition>> {
    const prompt = `
      Analiziraj sledeći dokument koji sadrži sistemizaciju radnih mesta:
      
      ${documentText}
      
      Ekstraktuj sve informacije o radnim mestima i vrati ih u sledećem JSON formatu:
      {
        "items": [
          {
            "title": "naziv radnog mesta",
            "department": "naziv sektora/odeljenja",
            "requiredEducation": "potrebno obrazovanje",
            "coefficient": broj (koeficijent složenosti),
            "requiredSkills": ["veština1", "veština2"],
            "responsibilities": ["odgovornost1", "odgovornost2"]
          }
        ]
      }
      
      Obavezno analiziraj dokument pažljivo i ekstraktuj što više informacija. Ako neki podatak ne možeš da pronađeš, ostavi prazno polje ili niz.
    `;

    return await this.processWithAI<JobPosition>(prompt);
  }

  async parseEmployeeDocument(documentText: string): Promise<AIProcessingResult<Employee>> {
    const prompt = `
      Analiziraj sledeći dokument koji sadrži podatke o zaposlenima:
      
      ${documentText}
      
      Ekstraktuj sve informacije o zaposlenima i vrati ih u sledećem JSON formatu:
      {
        "items": [
          {
            "firstName": "ime",
            "lastName": "prezime",
            "jobPositionTitle": "naziv radnog mesta",
            "email": "email adresa (opciono)",
            "phone": "telefon (opciono)",
            "personalIdNumber": "JMBG (opciono)",
            "identificationNumber": "broj lične karte (opciono)",
            "street": "ulica (opciono)",
            "streetNumber": "broj (opciono)",
            "city": "grad (opciono)",
            "postalCode": "poštanski broj (opciono)",
            "children": [
              {
                "firstName": "ime deteta",
                "lastName": "prezime deteta",
                "birthDate": "datum rođenja"
              }
            ]
          }
        ]
      }
      
      Obavezno analiziraj dokument pažljivo i ekstraktuj što više informacija. Ako neki podatak ne možeš da pronađeš, ostavi ga praznim.
    `;

    return await this.processWithAI<Employee>(prompt);
  }

  async parseJobDescriptionDocument(documentText: string): Promise<AIProcessingResult<JobDescription>> {
    const prompt = `
      Analiziraj sledeći dokument koji sadrži opise poslova:
      
      ${documentText}
      
      Ekstraktuj sve informacije o opisima poslova za radna mesta i vrati ih u sledećem JSON formatu:
      {
        "items": [
          {
            "jobPositionTitle": "naziv radnog mesta",
            "description": "opšti opis posla",
            "duties": ["dužnost1", "dužnost2"],
            "workingConditions": "opis uslova rada",
            "equipment": ["oprema1", "oprema2"]
          }
        ]
      }
      
      Obavezno analiziraj dokument pažljivo i ekstraktuj što više informacija. Ako neki podatak ne možeš da pronađeš, ostavi prazno polje ili niz.
    `;

    return await this.processWithAI<JobDescription>(prompt);
  }

  async generateRiskCategories(jobPositions: any[]): Promise<AIProcessingResult<RiskCategory>> {
    const jobPositionsJSON = JSON.stringify(jobPositions);
    
    const prompt = `
      Analiziraj sledeće radno mesto i klasifikuj ih u kategorije rizika:
      
      ${jobPositionsJSON}
      
      Kreiraj kategorije rizika prema hijerarhiji:
      1. Direktori imaju prioritet (direktorske pozicije)
      2. Menadžeri sa najvišim koeficijentima
      3. Administrativno osoblje
      4. Blagajnici
      5. Vozači i terenske pozicije
      
      Za svaku kategoriju rizika vrati informacije u sledećem JSON formatu:
      {
        "items": [
          {
            "name": "naziv kategorije rizika",
            "description": "opis kategorije rizika",
            "riskLevel": "nivo rizika (nizak/srednji/visok)",
            "jobPositionIds": [1, 2, 3] - ID-ovi radnih mesta koji pripadaju ovoj kategoriji
          }
        ]
      }
      
      Obavezno kreiraj minimum 5 kategorija rizika i razvrstaj sva radna mesta. Ako neko radno mesto nije jasno definisano, stavi ga u najbližu odgovarajuću kategoriju.
    `;

    return await this.processWithAI<RiskCategory>(prompt);
  }
}

export const openRouterService = new OpenRouterService();