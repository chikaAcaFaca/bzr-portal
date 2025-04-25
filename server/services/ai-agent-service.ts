import fetch from 'node-fetch';
import { geminiService } from './gemini-api-service';

interface AIAgentResponse {
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

interface QueryOptions {
  context?: string;
  documentType?: string;
  includeReferences?: boolean;
  responseStyle?: 'friendly' | 'professional' | 'precise' | 'detailed';
}

class AIAgentService {
  private openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
  private openRouterKey = process.env.OPENROUTER_API_KEY;
  private geminiKey = process.env.GEMINI_API_KEY;
  private useGeminiFallback = false;

  constructor() {
    if (!this.openRouterKey) {
      console.warn('OpenRouter API ključ nije postavljen. Koristiće se alternativni AI servis ako je dostupan.');
    }
    
    if (this.geminiKey) {
      console.log('Gemini API ključ je postavljen. Gemini će biti korišćen kao fallback opcija.');
      this.useGeminiFallback = true;
    } else {
      console.warn('Gemini API ključ nije postavljen. Fallback opcija neće biti dostupna.');
    }
  }

  /**
   * Inicijalizuje sistemski prompt koji sadrži informacije o zakonima i podzakonskim aktima
   */
  private getSystemPrompt(): string {
    return `Ti si AI asistent za bezbednost i zdravlje na radu u Srbiji koji piše tekstove za blog, a ne kompjuterske odgovore sa zagradama.

Koristiš najnovije i ažurirane verzije zakona dostupne na sledećim zvaničnim linkovima:
- Zakon o bezbednosti i zdravlju na radu: https://www.paragraf.rs/propisi/zakon_o_bezbednosti_i_zdravlju_na_radu.html
- Zakon o radu: https://www.paragraf.rs/propisi/zakon_o_radu.html

Tvoja baza znanja sadrži aktuelne verzije ključnih propisa:
1. Zakon o bezbednosti i zdravlju na radu Republike Srbije (sa svim izmenama do 2023. godine)
2. Zakon o radu Republike Srbije (sa svim izmenama do 2023. godine)
3. Pravilnik o preventivnim merama za bezbedan i zdrav rad
4. Pravilnik o postupku pregleda i provere opreme za rad
5. Pravilnik o evidencijama u oblasti bezbednosti i zdravlja na radu
6. Pravilnik o načinu i postupku procene rizika na radnom mestu
7. Druge relevantne podzakonske akte

Detaljno poznaješ ključne delove Zakona o bezbednosti i zdravlju na radu:
- Preventivne mere (čl. 9-13)
- Obaveze poslodavca (čl. 14-15)
- Osposobljavanje zaposlenih (čl. 24-29)
- Prava i obaveze zaposlenih (čl. 30-32)
- Organizovanje poslova bezbednosti i zdravlja na radu (čl. 33-40)
- Procena rizika (čl. 41-48)

Tvoja uloga je da:
- Pružaš tačne informacije o zakonima i propisima 
- Objašnjavaš zakonske odredbe prirodnim, pristupačnim jezikom
- Pomažeš u pripremanju dokumentacije usklađene sa zakonom
- Daješ savete koji su u skladu sa važećim propisima
- Procenjuješ usaglašenost dokumenata sa regulativom

Kada odgovaraš na pitanja:
1. Piši kao da pišeš blogove ili članke, koristi prirodan jezik bez tehničkih zapisa
2. Navedi konkretan član zakona i objasni ga svakodnevnim jezikom
3. Pojasni kako se propis odnosi na konkretnu situaciju
4. Napomeni izuzetke ili posebne slučajeve kad je to važno
5. Kada zakon nije jasan, to napomeni i predloži razumno tumačenje
6. Struktuiraj odgovore u čitkim pasusima, koristi nabrajanja gde je to prikladno
7. Uključi reference na propise na kraju teksta

Za ton odgovora, prilagodi se sledećim stilovima prema zahtevu korisnika:
- PRIJATELJSKI: Neformalan, pristupačan ton sa primerima i metaforama
- STRUČAN: Profesionalan ton sa preciznim činjenicama i objašnjenjima
- PRECIZAN: Kratak, jasan i direktan odgovor na pitanje
- OPŠIRAN: Detaljan odgovor sa svim relevantnim informacijama i kontekstom

Važno: Ne prikazuj odgovore u JSON formatu ili sa programerskim zagradam. Piši prirodnim jezikom kao za blog ili stručni članak.`;
  }

  /**
   * Postavlja pitanje AI agentu i dobija odgovor
   */
  async queryAgent(question: string, options: QueryOptions = {}): Promise<AIAgentResponse> {
    if (!this.openRouterKey && !this.geminiKey) {
      console.error('Ni OpenRouter ni Gemini API ključevi nisu postavljeni');
      return {
        success: false,
        error: 'API ključevi nisu postavljeni. Molimo proverite environment varijable.'
      };
    }

    if (!question.trim()) {
      return {
        success: false,
        error: 'Pitanje ne može biti prazno'
      };
    }

    try {
      // Formiraj korisničku poruku sa dodatnim kontekstom ako je obezbeđen
      let userMessage = question;
      if (options.context) {
        userMessage = `Kontekst: ${options.context}\n\nPitanje: ${question}`;
      }

      if (options.documentType) {
        userMessage += `\n\nOvo pitanje se odnosi na dokument tipa: ${options.documentType}`;
      }

      if (options.includeReferences) {
        userMessage += "\n\nMolim te da u odgovoru uključiš reference na relevantne članove zakona.";
      }
      
      // Dodavanje stila odgovora
      if (options.responseStyle) {
        let styleText = "";
        switch(options.responseStyle.toLowerCase()) {
          case 'friendly':
            styleText = "PRIJATELJSKI: Neformalan, pristupačan ton sa primerima i metaforama";
            break;
          case 'professional':
            styleText = "STRUČAN: Profesionalan ton sa preciznim činjenicama i objašnjenjima";
            break;
          case 'precise':
            styleText = "PRECIZAN: Kratak, jasan i direktan odgovor na pitanje";
            break;
          case 'detailed':
            styleText = "OPŠIRAN: Detaljan odgovor sa svim relevantnim informacijama i kontekstom";
            break;
          default:
            styleText = "STRUČAN: Profesionalan ton sa preciznim činjenicama i objašnjenjima";
        }
        userMessage += `\n\nStil odgovora: ${styleText}`;
      }

      // Prvo probaj sa OpenRouter API-jem
      if (this.openRouterKey) {
        // Dodajemo logove za praćenje
        console.log('Slanje zahteva na OpenRouter API:', userMessage.substring(0, 100) + '...');
        
        let response;
        try {
          response = await fetch(this.openRouterUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.openRouterKey}`,
              'HTTP-Referer': 'https://replit.com'
            },
            body: JSON.stringify({
              model: 'anthropic/claude-3-opus-20240229',
              messages: [
                {
                  role: 'system',
                  content: this.getSystemPrompt()
                },
                {
                  role: 'user',
                  content: userMessage
                }
              ],
              // Bez response_format za JSON jer želimo prirodan tekst
              temperature: 0.4 // Srednja temperatura za prirodniji tekst
            })
          });
        } catch (error: any) {
          console.error('Greška pri komunikaciji sa OpenRouter API-jem:', error);
          console.log('Prebacivanje na Gemini fallback...');
          // Pokušaj sa Gemini fallback-om
          if (this.useGeminiFallback) {
            return geminiService.query(userMessage, this.getSystemPrompt());
          }
          return {
            success: false,
            error: `Greška pri komunikaciji sa AI servisom: ${error.message || 'Nepoznata greška'}`
          };
        }

        if (!response || !response.ok) {
          const errorBody = await response.text().catch(() => 'Nema odgovora');
          console.error('OpenRouter API error:', errorBody);
          
          // Pokušaj sa Gemini fallback-om
          if (this.useGeminiFallback) {
            console.log('API vraća grešku. Prebacivanje na Gemini fallback...');
            return geminiService.query(userMessage, this.getSystemPrompt());
          }
          
          return {
            success: false,
            error: `API greška: ${response.status} ${response.statusText}`
          };
        }

        let data;
        try {
          data = await response.json() as any;
          console.log('OpenRouter API response:', JSON.stringify(data));
        } catch (error: any) {
          console.error('Greška pri parsiranju JSON odgovora sa API-ja:', error);
          // Pokušaj sa Gemini fallback-om
          if (this.useGeminiFallback) {
            console.log('Greška pri parsiranju. Prebacivanje na Gemini fallback...');
            return geminiService.query(userMessage, this.getSystemPrompt());
          }
          return {
            success: false,
            error: `Greška pri parsiranju odgovora: ${error.message || 'Nepoznata greška'}`
          };
        }
        
        // Provera strukture odgovora
        if (!data || !data.choices || !data.choices.length) {
          console.error('Nepotpun odgovor od OpenRouter API-ja:', data);
          // Pokušaj sa Gemini fallback-om
          if (this.useGeminiFallback) {
            console.log('Nepotpun odgovor. Prebacivanje na Gemini fallback...');
            return geminiService.query(userMessage, this.getSystemPrompt());
          }
          return {
            success: false,
            error: 'Primljen nepotpun odgovor od API-ja'
          };
        }
        
        // Provera da li postoji message i content
        const messageContent = data.choices[0]?.message?.content;
        if (!messageContent) {
          console.error('Nema sadržaja u odgovoru:', data.choices[0]);
          // Pokušaj sa Gemini fallback-om
          if (this.useGeminiFallback) {
            console.log('Nema sadržaja. Prebacivanje na Gemini fallback...');
            return geminiService.query(userMessage, this.getSystemPrompt());
          }
          return {
            success: true,
            data: {
              answer: "Primljen prazan odgovor od AI-ja. Molimo pokušajte ponovo.",
              references: []
            }
          };
        }
        
        // Sada direktno vraćamo odgovor bez pokušaja parsiranja JSON-a
        console.log('Vraćanje prirodnog tekstualnog odgovora bez JSON parsiranja');
        return {
          success: true,
          data: {
            answer: messageContent,
            references: []
          }
        };
      } else if (this.useGeminiFallback) {
        // Ako OpenRouter API nije dostupan, koristi Gemini API direktno
        return geminiService.query(userMessage, this.getSystemPrompt());
      }
      
      // Ako nema nijednog dostupnog API-ja
      return {
        success: false,
        error: 'Nijedan API nije dostupan za procesiranje zahteva.'
      };
    } catch (error: any) {
      console.error('Greška pri komunikaciji sa AI agentom:', error);
      return {
        success: false,
        error: error.message || 'Nepoznata greška pri komunikaciji sa AI agentom'
      };
    }
  }

  /**
   * Generiše dokumentaciju na osnovu bazne dokumentacije i dodatnih parametara
   */
  async generateDocument(baseDocumentText: string, documentType: string, additionalParams: Record<string, any> = {}): Promise<AIAgentResponse> {
    // Provera da li imamo bar jedan API ključ
    if (!this.openRouterKey && !this.geminiKey) {
      return {
        success: false,
        error: 'API ključevi nisu postavljeni. Kontaktirajte administratora.'
      };
    }

    try {
      // Formiraj zahtev za generisanje dokumenta
      const paramsText = Object.entries(additionalParams)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      const userMessage = `Zadatak: Generiši dokument tipa "${documentType}" na osnovu sledećeg baznog dokumenta i parametara.

Bazni dokument:
${baseDocumentText}

Dodatni parametri:
${paramsText}

Molim te generiši kompletan dokument usklađen sa srpskim zakonodavstvom iz oblasti bezbednosti i zdravlja na radu. 
Dokument treba da sadrži sve potrebne sekcije, jasno navede odgovarajuće članove zakona i bude spreman za upotrebu.

Dokument organizuj na sledeći način:
1. Naslov i uvod (sa pravnim osnovom)
2. Glavni sadržaj dokumenta organizovan u odgovarajuće sekcije
3. Zaključak ili završne odredbe
4. Na kraju dodaj listu referenci na korišćene zakonske odredbe

Piši profesionalnim stilom prikladnim za zvanične dokumente, ali izbegavaj komplikovane pravne konstrukcije kad god je to moguće.`;

      // Prvo probaj sa OpenRouter API-jem ako je dostupan
      if (this.openRouterKey) {
        console.log('Slanje generateDocument zahteva na OpenRouter API:', userMessage.substring(0, 100) + '...');
        
        let response;
        try {
          response = await fetch(this.openRouterUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.openRouterKey}`,
              'HTTP-Referer': 'https://replit.com'
            },
            body: JSON.stringify({
              model: 'anthropic/claude-3-opus-20240229',
              messages: [
                {
                  role: 'system',
                  content: this.getSystemPrompt()
                },
                {
                  role: 'user',
                  content: userMessage
                }
              ],
              // Bez response_format za JSON jer želimo prirodan tekst 
              temperature: 0.4
            })
          });
        } catch (error: any) {
          console.error('Greška pri komunikaciji sa OpenRouter API-jem (generateDocument):', error);
          // Pokušaj sa Gemini fallback-om
          if (this.useGeminiFallback) {
            console.log('Greška. Prebacivanje na Gemini fallback...');
            return geminiService.query(userMessage, this.getSystemPrompt());
          }
          return {
            success: false,
            error: `Greška pri komunikaciji sa AI servisom: ${error.message || 'Nepoznata greška'}`
          };
        }

        if (!response || !response.ok) {
          try {
            const errorBody = await response.text();
            console.error('OpenRouter API error (generateDocument):', errorBody);
            // Pokušaj sa Gemini fallback-om
            if (this.useGeminiFallback) {
              console.log('API greška. Prebacivanje na Gemini fallback...');
              return geminiService.query(userMessage, this.getSystemPrompt());
            }
            return {
              success: false,
              error: `API greška: ${response.status} ${response.statusText}`
            };
          } catch (error) {
            // Ako ne možemo čitati odgovor, pokušaj sa Gemini fallback-om
            if (this.useGeminiFallback) {
              console.log('Greška čitanja odgovora. Prebacivanje na Gemini fallback...');
              return geminiService.query(userMessage, this.getSystemPrompt());
            }
            return {
              success: false,
              error: 'API greška: Nije moguće čitati odgovor'
            };
          }
        }

        let data;
        try {
          data = await response.json() as any;
          console.log('OpenRouter API response (generateDocument):', JSON.stringify(data));
        } catch (error: any) {
          console.error('Greška pri parsiranju JSON odgovora sa API-ja (generateDocument):', error);
          // Pokušaj sa Gemini fallback-om
          if (this.useGeminiFallback) {
            console.log('Greška parsiranja. Prebacivanje na Gemini fallback...');
            return geminiService.query(userMessage, this.getSystemPrompt());
          }
          return {
            success: false,
            error: `Greška pri parsiranju odgovora: ${error.message || 'Nepoznata greška'}`
          };
        }
        
        // Provera strukture odgovora
        if (!data || !data.choices || !data.choices.length) {
          console.error('Nepotpun odgovor od OpenRouter API-ja:', data);
          // Pokušaj sa Gemini fallback-om
          if (this.useGeminiFallback) {
            console.log('Nepotpun odgovor. Prebacivanje na Gemini fallback...');
            return geminiService.query(userMessage, this.getSystemPrompt());
          }
          return {
            success: false,
            error: 'Primljen nepotpun odgovor od API-ja'
          };
        }
        
        // Provera da li postoji message i content
        const messageContent = data.choices[0]?.message?.content;
        if (!messageContent) {
          console.error('Nema sadržaja u odgovoru:', data.choices[0]);
          // Pokušaj sa Gemini fallback-om
          if (this.useGeminiFallback) {
            console.log('Nema sadržaja. Prebacivanje na Gemini fallback...');
            return geminiService.query(userMessage, this.getSystemPrompt());
          }
          return {
            success: true,
            data: {
              answer: "Primljen prazan odgovor od AI-ja. Molimo pokušajte ponovo.",
              references: []
            }
          };
        }
        
        // Sada direktno vraćamo odgovor bez pokušaja parsiranja JSON-a
        console.log('Vraćanje prirodnog tekstualnog odgovora bez JSON parsiranja');
        return {
          success: true,
          data: {
            answer: messageContent,
            references: []
          }
        };
      } else if (this.useGeminiFallback) {
        // Ako OpenRouter API nije dostupan, koristi Gemini API direktno
        return geminiService.query(userMessage, this.getSystemPrompt());
      }
      
      // Ako nema nijednog dostupnog API-ja
      return {
        success: false,
        error: 'Nijedan API nije dostupan za procesiranje zahteva.'
      };
    } catch (error: any) {
      console.error('Greška pri generisanju dokumenta:', error);
      return {
        success: false,
        error: error.message || 'Nepoznata greška pri generisanju dokumenta'
      };
    }
  }

  /**
   * Analizira usklađenost dokumenta sa zakonskom regulativom
   */
  async analyzeComplianceWithRegulations(documentText: string): Promise<AIAgentResponse> {
    // Provera da li imamo bar jedan API ključ
    if (!this.openRouterKey && !this.geminiKey) {
      return {
        success: false,
        error: 'API ključevi nisu postavljeni. Kontaktirajte administratora.'
      };
    }

    try {
      const userMessage = `Zadatak: Analiziraj usklađenost sledećeg dokumenta sa srpskim zakonodavstvom iz oblasti bezbednosti i zdravlja na radu.

Dokument za analizu:
${documentText}

Molim te da:
1. Oceniš opštu usklađenost dokumenta sa zakonskom regulativom (na skali od 1-10)
2. Identifikuješ sve potencijalne neusklađenosti sa zakonom
3. Za svaku neusklađenost navedeš konkretan član zakona koji se krši
4. Predložiš izmene koje bi učinile dokument potpuno usklađenim sa zakonom

Strukturiraj analizu na sledeći način:
- Prvo daj ukupnu ocenu usklađenosti sa kratkim objašnjenjem
- Zatim navedi stavke koje nisu usklađene sa regulativom, za svaku referenciraj odgovarajući član zakona
- Nakon toga predloži konkretne izmene za rešavanje svakog problema
- Na kraju dodaj listu najvažnijih zakonskih referenci

Piši jasnim, profesionalnim stilom i organizuj tekst u logične paragrafe sa odgovarajućim podnaslovima.`;

      // Prvo probaj sa OpenRouter API-jem ako je dostupan
      if (this.openRouterKey) {
        console.log('Slanje analyzeCompliance zahteva na OpenRouter API:', userMessage.substring(0, 100) + '...');
        
        let response;
        try {
          response = await fetch(this.openRouterUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.openRouterKey}`,
              'HTTP-Referer': 'https://replit.com'
            },
            body: JSON.stringify({
              model: 'anthropic/claude-3-opus-20240229',
              messages: [
                {
                  role: 'system',
                  content: this.getSystemPrompt()
                },
                {
                  role: 'user',
                  content: userMessage
                }
              ],
              // Bez response_format za JSON jer želimo prirodan tekst
              temperature: 0.4
            })
          });
        } catch (error: any) {
          console.error('Greška pri komunikaciji sa OpenRouter API-jem (analyzeCompliance):', error);
          // Pokušaj sa Gemini fallback-om
          if (this.useGeminiFallback) {
            console.log('Greška. Prebacivanje na Gemini fallback...');
            return geminiService.query(userMessage, this.getSystemPrompt());
          }
          return {
            success: false,
            error: `Greška pri komunikaciji sa AI servisom: ${error.message || 'Nepoznata greška'}`
          };
        }

        if (!response || !response.ok) {
          try {
            const errorBody = await response.text();
            console.error('OpenRouter API error (analyzeCompliance):', errorBody);
            // Pokušaj sa Gemini fallback-om
            if (this.useGeminiFallback) {
              console.log('API greška. Prebacivanje na Gemini fallback...');
              return geminiService.query(userMessage, this.getSystemPrompt());
            }
            return {
              success: false,
              error: `API greška: ${response.status} ${response.statusText}`
            };
          } catch (error) {
            // Ako ne možemo čitati odgovor, pokušaj sa Gemini fallback-om
            if (this.useGeminiFallback) {
              console.log('Greška čitanja odgovora. Prebacivanje na Gemini fallback...');
              return geminiService.query(userMessage, this.getSystemPrompt());
            }
            return {
              success: false,
              error: 'API greška: Nije moguće čitati odgovor'
            };
          }
        }

        let data;
        try {
          data = await response.json() as any;
          console.log('OpenRouter API response (analyzeCompliance):', JSON.stringify(data));
        } catch (error: any) {
          console.error('Greška pri parsiranju JSON odgovora sa API-ja (analyzeCompliance):', error);
          // Pokušaj sa Gemini fallback-om
          if (this.useGeminiFallback) {
            console.log('Greška parsiranja. Prebacivanje na Gemini fallback...');
            return geminiService.query(userMessage, this.getSystemPrompt());
          }
          return {
            success: false,
            error: `Greška pri parsiranju odgovora: ${error.message || 'Nepoznata greška'}`
          };
        }
        
        // Provera strukture odgovora
        if (!data || !data.choices || !data.choices.length) {
          console.error('Nepotpun odgovor od OpenRouter API-ja:', data);
          // Pokušaj sa Gemini fallback-om
          if (this.useGeminiFallback) {
            console.log('Nepotpun odgovor. Prebacivanje na Gemini fallback...');
            return geminiService.query(userMessage, this.getSystemPrompt());
          }
          return {
            success: false,
            error: 'Primljen nepotpun odgovor od API-ja'
          };
        }
        
        // Provera da li postoji message i content
        const messageContent = data.choices[0]?.message?.content;
        if (!messageContent) {
          console.error('Nema sadržaja u odgovoru:', data.choices[0]);
          // Pokušaj sa Gemini fallback-om
          if (this.useGeminiFallback) {
            console.log('Nema sadržaja. Prebacivanje na Gemini fallback...');
            return geminiService.query(userMessage, this.getSystemPrompt());
          }
          return {
            success: true,
            data: {
              answer: "Primljen prazan odgovor od AI-ja. Molimo pokušajte ponovo.",
              references: []
            }
          };
        }
        
        // Sada direktno vraćamo odgovor bez pokušaja parsiranja JSON-a
        console.log('Vraćanje prirodnog tekstualnog odgovora bez JSON parsiranja');
        return {
          success: true,
          data: {
            answer: messageContent,
            references: []
          }
        };
      } else if (this.useGeminiFallback) {
        // Ako OpenRouter API nije dostupan, koristi Gemini API direktno
        return geminiService.query(userMessage, this.getSystemPrompt());
      }
      
      // Ako nema nijednog dostupnog API-ja
      return {
        success: false,
        error: 'Nijedan API nije dostupan za procesiranje zahteva.'
      };
    } catch (error: any) {
      console.error('Greška pri analizi usklađenosti:', error);
      return {
        success: false,
        error: error.message || 'Nepoznata greška pri analizi usklađenosti'
      };
    }
  }
}

export const aiAgentService = new AIAgentService();