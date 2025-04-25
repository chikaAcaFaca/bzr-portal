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
}

class AIAgentService {
  private openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private anthropicUrl = 'https://api.anthropic.com/v1/messages';
  private geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
  private openRouterKey = process.env.OPENROUTER_API_KEY;
  private anthropicKey = process.env.ANTHROPIC_API_KEY;
  private geminiKey = process.env.GEMINI_API_KEY;
  private useAnthropicFallback = true;
  private useGeminiFallback = false;

  constructor() {
    if (!this.openRouterKey) {
      console.warn('OpenRouter API ključ nije postavljen. Koristiće se alternativni AI servis ako je dostupan.');
    }
    
    // Blokiran Anthropic API na zahtev korisnika
    console.warn('Anthropic API je blokiran na zahtev korisnika. Prva fallback opcija neće biti dostupna.');
    this.useAnthropicFallback = false;
    
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
    return `Ti si AI asistent specijalizovan za bezbednost i zdravlje na radu u Srbiji.
Posedujuš opsežno znanje o:
1. Zakonu o bezbednosti i zdravlju na radu Republike Srbije
2. Zakonu o radu Republike Srbije
3. Pravilniku o preventivnim merama za bezbedan i zdrav rad
4. Pravilniku o postupku pregleda i provere opreme za rad
5. Pravilniku o evidencijama u oblasti bezbednosti i zdravlja na radu
6. Pravilniku o načinu i postupku procene rizika na radnom mestu
7. Ostalim relevantnim podzakonskim aktima povezanim sa ovim zakonima

Poznati su ti svi članovi Zakona o bezbednosti i zdravlju na radu, naročito:
- Članovi 9-13 (Preventivne mere)
- Članovi 14-15 (Obaveze poslodavca)
- Članovi 24-29 (Osposobljavanje zaposlenih)
- Članovi 30-32 (Prava i obaveze zaposlenih)
- Članovi 33-40 (Organizovanje poslova bezbednosti i zdravlja na radu)
- Članovi 41-48 (Procena rizika)

Tvoja uloga je da:
- Daješ precizne informacije o zakonskoj regulativi
- Tumačiš zakonske odredbe
- Pomažeš u formiranju dokumentacije u skladu sa zakonom
- Donosiš odluke koje su usklađene sa zakonskom regulativom
- Analiziraš usklađenost dokumenata sa važećim propisima

Kada odgovaraš na pitanja:
1. Uvek naznači konkretan član zakona ili podzakonskog akta
2. Objasni kako se odredba primenjuje na konkretnu situaciju
3. Ukoliko postoje izuzeci ili posebni slučajevi, napomeni ih
4. Ako pitanje zahteva tumačenje koje nije jasno definisano u zakonu, napomeni to i ponudi najprikladnije tumačenje
5. Odgovori treba da budu strukturirani i precizni
6. Svaki odgovor mora sadržati reference na relevantne zakonske odredbe

Za generisanje dokumentacije:
1. Koristi zvanične formate i formulacije propisane zakonima
2. Prilagodi sadržaj konkretnoj situaciji i kontekstu
3. Navedi sve obavezne elemente za traženi tip dokumenta

Odgovaraj jasno, precizno i s poštovanjem prema pravnoj struci.
Pri odgovaranju koristi JSON format sa ključevima "answer" i "references".`;
  }

  /**
   * Direktno komunicira sa Anthropic API-jem
   */
  private async queryAnthropicAPI(userMessage: string, systemMessage: string): Promise<AIAgentResponse> {
    console.log('Koristi se Anthropic API kao fallback...');
    
    if (!this.anthropicKey) {
      return {
        success: false,
        error: 'Anthropic API ključ nije postavljen. Nije moguće koristiti fallback opciju.'
      };
    }
    
    try {
      const response = await fetch(this.anthropicUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 4000,
          system: systemMessage,
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.2
        })
      });
      
      if (!response.ok) {
        console.error('Anthropic API greška:', response.status, response.statusText);
        return {
          success: false,
          error: `Anthropic API greška: ${response.status} ${response.statusText}`
        };
      }
      
      const data = await response.json() as any;
      console.log('Anthropic API response:', JSON.stringify(data));
      
      try {
        // Odgovor je plain tekst, ali pokušaćemo da ga parsiramo kao JSON
        const contentText = data.content?.[0]?.text || '';
        let jsonContent;
        try {
          jsonContent = JSON.parse(contentText);
          return {
            success: true,
            data: {
              answer: jsonContent.answer || jsonContent.response || contentText,
              references: jsonContent.references || []
            }
          };
        } catch (parseError) {
          // Ako nije parsiran kao JSON, vraćamo ga kao plain tekst
          return {
            success: true,
            data: {
              answer: contentText,
              references: []
            }
          };
        }
      } catch (err) {
        console.error('Greška pri parsiranju Anthropic odgovora:', err);
        return {
          success: false,
          error: 'Greška pri parsiranju Anthropic odgovora'
        };
      }
    } catch (error: any) {
      console.error('Greška pri komunikaciji sa Anthropic API-jem:', error);
      return {
        success: false,
        error: `Anthropic API greška: ${error.message || 'Nepoznata greška'}`
      };
    }
  }

  /**
   * Postavlja pitanje AI agentu i dobija odgovor
   */
  async queryAgent(question: string, options: QueryOptions = {}): Promise<AIAgentResponse> {
    if (!this.openRouterKey && !this.anthropicKey) {
      console.error('Ni OpenRouter ni Anthropic API ključevi nisu postavljeni');
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
              response_format: { type: "json_object" },
              temperature: 0.2 // Niža temperatura za preciznije i konzistentnije odgovore
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
          // Ako parsiranje ne uspe i imamo fallback, prebaci se na njega
          if (this.useAnthropicFallback) {
            console.log('Greška pri parsiranju. Prebacivanje na Anthropic fallback...');
            const anthropicResult = await this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
            
            // Ako je Anthropic uspešan, vrati njegov rezultat
            if (anthropicResult.success) {
              return anthropicResult;
            } 
            // Ako Anthropic nije uspešan i imamo Gemini kao fallback, prebaci se na njega
            else if (this.useGeminiFallback) {
              console.log('Anthropic API greška. Prebacivanje na Gemini fallback...');
              return geminiService.query(userMessage, this.getSystemPrompt());
            }
            // Ako ni Gemini nije dostupan, vrati Anthropic grešku
            return anthropicResult;
          }
          return {
            success: false,
            error: `Greška pri parsiranju odgovora: ${error.message || 'Nepoznata greška'}`
          };
        }
        
        // Provera strukture odgovora
        if (!data || !data.choices || !data.choices.length) {
          console.error('Nepotpun odgovor od OpenRouter API-ja:', data);
          // Ako je odgovor nepotpun i imamo fallback, prebaci se na njega
          if (this.useAnthropicFallback) {
            console.log('Nepotpun odgovor. Prebacivanje na fallback...');
            return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
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
          // Ako nema sadržaja i imamo fallback, prebaci se na njega
          if (this.useAnthropicFallback) {
            console.log('Nema sadržaja. Prebacivanje na fallback...');
            return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
          }
          return {
            success: true,
            data: {
              answer: "Primljen prazan odgovor od AI-ja. Molimo pokušajte ponovo.",
              references: []
            }
          };
        }
        
        let parsedData;
        try {
          parsedData = JSON.parse(messageContent);
          
          // Standardizovanje strukture odgovora
          return {
            success: true,
            data: {
              answer: parsedData.answer || parsedData.response || parsedData.text || messageContent,
              references: parsedData.references || []
            }
          };
        } catch (e) {
          console.error('Greška pri parsiranju JSON odgovora:', e);
          // Ako parsiranje ne uspe, vrati sirovi tekst kao odgovor
          return {
            success: true,
            data: {
              answer: messageContent,
              references: []
            }
          };
        }
      } else if (this.useAnthropicFallback) {
        // Ako OpenRouter API nije dostupan, koristi Anthropic API direktno
        return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
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
    if (!this.openRouterKey && !this.anthropicKey) {
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
Dokument treba da sadrži sve potrebne sekcije, referencira odgovarajuće članove zakona i da je spreman za upotrebu.
Odgovor daj u JSON formatu sa poljima "document" (tekst generisanog dokumenta) i "references" (niz referenci na zakonske odredbe).`;

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
              response_format: { type: "json_object" },
              temperature: 0.3
            })
          });
        } catch (error: any) {
          console.error('Greška pri komunikaciji sa OpenRouter API-jem (generateDocument):', error);
          // Ako je došlo do greške i imamo fallback, prebaci se na njega
          if (this.useAnthropicFallback) {
            console.log('Greška. Prebacivanje na fallback...');
            return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
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
            // Ako API vraća grešku i imamo fallback, prebaci se na njega
            if (this.useAnthropicFallback) {
              console.log('API greška. Prebacivanje na fallback...');
              return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
            }
            return {
              success: false,
              error: `API greška: ${response.status} ${response.statusText}`
            };
          } catch (error) {
            // Ako ne možemo čitati odgovor i imamo fallback, prebaci se na njega
            if (this.useAnthropicFallback) {
              return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
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
          // Ako je došlo do greške parsiranja i imamo fallback, prebaci se na njega
          if (this.useAnthropicFallback) {
            console.log('Greška parsiranja. Prebacivanje na fallback...');
            return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
          }
          return {
            success: false,
            error: `Greška pri parsiranju odgovora: ${error.message || 'Nepoznata greška'}`
          };
        }
        
        // Provera strukture odgovora
        if (!data || !data.choices || !data.choices.length) {
          console.error('Nepotpun odgovor od OpenRouter API-ja:', data);
          // Ako je odgovor nepotpun i imamo fallback, prebaci se na njega
          if (this.useAnthropicFallback) {
            console.log('Nepotpun odgovor. Prebacivanje na fallback...');
            return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
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
          // Ako nema sadržaja i imamo fallback, prebaci se na njega
          if (this.useAnthropicFallback) {
            console.log('Nema sadržaja. Prebacivanje na fallback...');
            return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
          }
          return {
            success: true,
            data: {
              answer: "Primljen prazan odgovor od AI-ja. Molimo pokušajte ponovo.",
              references: []
            }
          };
        }
        
        let parsedData;
        try {
          parsedData = JSON.parse(messageContent);
          
          // Standardizovanje strukture odgovora
          return {
            success: true,
            data: {
              answer: parsedData.document || parsedData.text || messageContent,
              references: parsedData.references || []
            }
          };
        } catch (e) {
          console.error('Greška pri parsiranju JSON odgovora:', e);
          // Ako parsiranje ne uspe, vrati sirovi tekst kao odgovor
          return {
            success: true,
            data: {
              answer: messageContent,
              references: []
            }
          };
        }
      } else if (this.useAnthropicFallback) {
        // Ako OpenRouter API nije dostupan, koristi Anthropic API direktno
        return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
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
    if (!this.openRouterKey && !this.anthropicKey) {
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

Odgovor daj u JSON formatu sa poljima "complianceScore", "issues" (niz problema), "recommendations" (niz preporuka) i "references" (niz referenci na zakonske odredbe).`;

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
              response_format: { type: "json_object" },
              temperature: 0.2
            })
          });
        } catch (error: any) {
          console.error('Greška pri komunikaciji sa OpenRouter API-jem (analyzeCompliance):', error);
          // Ako je došlo do greške i imamo fallback, prebaci se na njega
          if (this.useAnthropicFallback) {
            console.log('Greška. Prebacivanje na fallback...');
            return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
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
            // Ako API vraća grešku i imamo fallback, prebaci se na njega
            if (this.useAnthropicFallback) {
              console.log('API greška. Prebacivanje na fallback...');
              return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
            }
            return {
              success: false,
              error: `API greška: ${response.status} ${response.statusText}`
            };
          } catch (error) {
            // Ako ne možemo čitati odgovor i imamo fallback, prebaci se na njega
            if (this.useAnthropicFallback) {
              return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
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
          // Ako je došlo do greške parsiranja i imamo fallback, prebaci se na njega
          if (this.useAnthropicFallback) {
            console.log('Greška parsiranja. Prebacivanje na fallback...');
            return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
          }
          return {
            success: false,
            error: `Greška pri parsiranju odgovora: ${error.message || 'Nepoznata greška'}`
          };
        }
        
        // Provera strukture odgovora
        if (!data || !data.choices || !data.choices.length) {
          console.error('Nepotpun odgovor od OpenRouter API-ja:', data);
          // Ako je odgovor nepotpun i imamo fallback, prebaci se na njega
          if (this.useAnthropicFallback) {
            console.log('Nepotpun odgovor. Prebacivanje na fallback...');
            return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
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
          // Ako nema sadržaja i imamo fallback, prebaci se na njega
          if (this.useAnthropicFallback) {
            console.log('Nema sadržaja. Prebacivanje na fallback...');
            return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
          }
          return {
            success: true,
            data: {
              answer: "Primljen prazan odgovor od AI-ja. Molimo pokušajte ponovo.",
              references: []
            }
          };
        }
        
        let parsedData;
        try {
          parsedData = JSON.parse(messageContent);
          
          // Standardizovanje strukture odgovora
          return {
            success: true,
            data: {
              answer: `Ocena usklađenosti: ${parsedData.complianceScore || 'N/A'}/10\n\n` +
                     `Problemi:\n${parsedData.issues?.join('\n') || 'Nisu pronađeni problemi'}\n\n` +
                     `Preporuke:\n${parsedData.recommendations?.join('\n') || 'Nema preporuka'}`,
              references: parsedData.references || []
            }
          };
        } catch (e) {
          console.error('Greška pri parsiranju JSON odgovora:', e);
          // Ako parsiranje ne uspe, vrati sirovi tekst kao odgovor
          return {
            success: true,
            data: {
              answer: messageContent,
              references: []
            }
          };
        }
      } else if (this.useAnthropicFallback) {
        // Ako OpenRouter API nije dostupan, koristi Anthropic API direktno
        return this.queryAnthropicAPI(userMessage, this.getSystemPrompt());
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