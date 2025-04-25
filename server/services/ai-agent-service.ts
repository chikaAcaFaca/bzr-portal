import fetch from 'node-fetch';

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
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private apiKey = process.env.OPENROUTER_API_KEY;

  constructor() {
    if (!this.apiKey) {
      console.warn('OpenRouter API ključ nije postavljen. AI agent neće raditi.');
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
3. Podzakonskim aktima povezanim sa ovim zakonima

Tvoja uloga je da:
- Daješ precizne informacije o zakonskoj regulativi
- Tumačiš zakonske odredbe
- Pomažeš u formiranju dokumentacije u skladu sa zakonom
- Donosiš odluke koje su usklađene sa zakonskom regulativom

Kada odgovaraš na pitanja:
1. Uvek naznači konkretan član zakona ili podzakonskog akta
2. Objasni kako se primenjuje na konkretnu situaciju
3. Ukoliko postoje izuzeci ili posebni slučajevi, napomeni ih
4. Ako pitanje zahteva tumačenje koje nije jasno definisano u zakonu, napomeni to i ponudi najprikladnije tumačenje

Odgovaraj jasno, precizno i s poštovanjem prema pravnoj struci.`;
  }

  /**
   * Postavlja pitanje AI agentu i dobija odgovor
   */
  async queryAgent(question: string, options: QueryOptions = {}): Promise<AIAgentResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenRouter API ključ nije postavljen. Kontaktirajte administratora.'
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

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('OpenRouter API error:', errorBody);
        return {
          success: false,
          error: `API greška: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json() as any;
      const content = data.choices[0].message.content;
      
      let parsedData;
      try {
        parsedData = JSON.parse(content);
        
        // Standardizovanje strukture odgovora
        return {
          success: true,
          data: {
            answer: parsedData.answer || parsedData.response || parsedData.text || content,
            references: parsedData.references || []
          }
        };
      } catch (e) {
        console.error('Greška pri parsiranju JSON odgovora:', e);
        // Ako parsiranje ne uspe, vrati sirovi tekst kao odgovor
        return {
          success: true,
          data: {
            answer: content,
            references: []
          }
        };
      }
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
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenRouter API ključ nije postavljen. Kontaktirajte administratora.'
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

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('OpenRouter API error:', errorBody);
        return {
          success: false,
          error: `API greška: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json() as any;
      const content = data.choices[0].message.content;
      
      let parsedData;
      try {
        parsedData = JSON.parse(content);
        
        // Standardizovanje strukture odgovora
        return {
          success: true,
          data: {
            answer: parsedData.document || parsedData.text || content,
            references: parsedData.references || []
          }
        };
      } catch (e) {
        console.error('Greška pri parsiranju JSON odgovora:', e);
        // Ako parsiranje ne uspe, vrati sirovi tekst kao odgovor
        return {
          success: true,
          data: {
            answer: content,
            references: []
          }
        };
      }
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
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenRouter API ključ nije postavljen. Kontaktirajte administratora.'
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

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('OpenRouter API error:', errorBody);
        return {
          success: false,
          error: `API greška: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json() as any;
      const content = data.choices[0].message.content;
      
      let parsedData;
      try {
        parsedData = JSON.parse(content);
        
        // Standardizovanje strukture odgovora
        return {
          success: true,
          data: {
            answer: `Ocena usklađenosti: ${parsedData.complianceScore}/10\n\n` +
                   `Problemi:\n${parsedData.issues?.join('\n')}\n\n` +
                   `Preporuke:\n${parsedData.recommendations?.join('\n')}`,
            references: parsedData.references || []
          }
        };
      } catch (e) {
        console.error('Greška pri parsiranju JSON odgovora:', e);
        // Ako parsiranje ne uspe, vrati sirovi tekst kao odgovor
        return {
          success: true,
          data: {
            answer: content,
            references: []
          }
        };
      }
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