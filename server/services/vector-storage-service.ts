import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Definišemo interfejs za podatke vektorske baze
export interface VectorEntry {
  id?: string;          // UUID dokumenta
  content: string;      // Tekstualni sadržaj
  embedding?: number[]; // Vektorska reprezentacija (generisana na Supabase strani)
  metadata: {
    filename: string;   // Naziv originalnog fajla
    filePath: string;   // Putanja na Wasabi
    fileType: string;   // Tip dokumenta
    bucket: string;     // Bucket u kojem se nalazi
    addedAt: string;    // Datum dodavanja
    fileSize?: number;  // Veličina fajla
    userType?: string;  // Admin ili korisnik
    userId?: string;    // ID korisnika koji je postavio dokument
    folder?: string;    // Folder u kojem se nalazi dokument
    isPublic?: boolean; // Da li je javno dostupan
    category?: string;  // Kategorija dokumenta (npr. 'BZR', 'Zakon', itd.)
    tags?: string[];    // Tagovi za pretragu
  };
}

export interface SearchOptions {
  query: string;
  matchThreshold?: number;
  limit?: number;
  userFilters?: {
    userId?: string;
    isPublic?: boolean;
    category?: string;
    folder?: string;
    tags?: string[];
  };
}

export class VectorStorageService {
  private supabase;
  private readonly vectorCollection = 'bzr_document_vectors';
  
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Nedostaju Supabase kredencijali. Vektorska baza neće biti dostupna.');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  /**
   * Provera da li je vektorska baza dostupna
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.from(this.vectorCollection).select('id').limit(1);
      
      if (error) {
        console.error('Greška pri proveri vektorske baze:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Greška pri proveri vektorske baze:', error);
      return false;
    }
  }
  
  /**
   * Dodavanje dokumenta u vektorsku bazu
   * Napomena: Embedding se automatski generiše na Supabase strani
   */
  public async addDocument(document: VectorEntry): Promise<string | null> {
    try {
      // Provera da li je dokument već u bazi
      if (document.metadata.filePath) {
        const { data: existingDocs } = await this.supabase
          .from(this.vectorCollection)
          .select('id')
          .eq('metadata->>filePath', document.metadata.filePath)
          .limit(1);
        
        if (existingDocs && existingDocs.length > 0) {
          console.log(`Dokument već postoji u vektorskoj bazi: ${document.metadata.filePath}`);
          return existingDocs[0].id;
        }
      }
      
      // Postavimo datum dodavanja ako nije već postavljen
      if (!document.metadata.addedAt) {
        document.metadata.addedAt = new Date().toISOString();
      }
      
      // Dodajemo dokument u vektorsku bazu
      const { data, error } = await this.supabase
        .from(this.vectorCollection)
        .insert({
          content: document.content,
          metadata: document.metadata
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Greška pri dodavanju dokumenta u vektorsku bazu:', error);
        return null;
      }
      
      console.log(`Dokument uspešno dodat u vektorsku bazu sa ID: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('Greška pri dodavanju dokumenta u vektorsku bazu:', error);
      return null;
    }
  }
  
  /**
   * Pretraga dokumenata u vektorskoj bazi
   */
  public async searchDocuments(options: SearchOptions): Promise<VectorEntry[]> {
    try {
      const { query, matchThreshold = 0.3, limit = 5, userFilters } = options;
      
      // Pripremamo search upit za Supabase
      let vectorQuery = this.supabase.rpc('match_documents', {
        query_text: query,
        match_threshold: matchThreshold,
        match_count: limit
      });
      
      // Dodajemo filtriranje po metapodacima ako je potrebno
      if (userFilters) {
        if (userFilters.userId) {
          vectorQuery = vectorQuery.filter('metadata->>userId', 'eq', userFilters.userId);
        }
        
        if (userFilters.isPublic !== undefined) {
          vectorQuery = vectorQuery.filter('metadata->>isPublic', 'eq', userFilters.isPublic.toString());
        }
        
        if (userFilters.category) {
          vectorQuery = vectorQuery.filter('metadata->>category', 'eq', userFilters.category);
        }
        
        if (userFilters.folder) {
          vectorQuery = vectorQuery.filter('metadata->>folder', 'eq', userFilters.folder);
        }
        
        if (userFilters.tags && userFilters.tags.length > 0) {
          // Za tagove koristimo contains operator za JSON niz
          vectorQuery = vectorQuery.filter('metadata->>tags', 'cs', JSON.stringify(userFilters.tags));
        }
      }
      
      // Izvršavamo upit
      const { data, error } = await vectorQuery;
      
      if (error) {
        console.error('Greška pri pretrazi vektorske baze:', error);
        return [];
      }
      
      // Transformišemo rezultate u VectorEntry format
      return (data || []).map((item: any) => ({
        id: item.id,
        content: item.content,
        embedding: item.embedding,
        metadata: item.metadata
      }));
    } catch (error) {
      console.error('Greška pri pretrazi vektorske baze:', error);
      return [];
    }
  }
  
  /**
   * Pretraga relevantnog konteksta za prosleđeni upit
   */
  public async getRelevantContext(query: string, userId?: string): Promise<string[]> {
    try {
      // Podrazumevani filteri - javni dokumenti ili dokumenti korisnika
      const userFilters: SearchOptions['userFilters'] = {
        isPublic: true
      };
      
      // Ako je prosleđen userId, dodajemo i njegove dokumente
      if (userId) {
        // Ovde je potrebna promena u logici upita, jer želimo SVE javne dokumente
        // I dodatno dokumente koje je kreirao sam korisnik
        // Ovo ne možemo jednostavno uraditi sa postojećim filterima
        // Za sad ćemo samo koristiti javne dokumente
      }
      
      // Tražimo relevantne dokumente
      const results = await this.searchDocuments({
        query,
        matchThreshold: 0.3,
        limit: 5,
        userFilters
      });
      
      // Izvlačimo samo tekstualni sadržaj
      return results.map(result => result.content);
    } catch (error) {
      console.error('Greška pri dobavljanju relevantnog konteksta:', error);
      return [];
    }
  }
  
  /**
   * Brisanje dokumenta iz vektorske baze
   */
  public async deleteDocument(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.vectorCollection)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Greška pri brisanju dokumenta iz vektorske baze:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Greška pri brisanju dokumenta iz vektorske baze:', error);
      return false;
    }
  }
  
  /**
   * Brisanje dokumenata po putanji
   */
  public async deleteDocumentByPath(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.vectorCollection)
        .delete()
        .eq('metadata->>filePath', filePath);
      
      if (error) {
        console.error('Greška pri brisanju dokumenta iz vektorske baze:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Greška pri brisanju dokumenta iz vektorske baze:', error);
      return false;
    }
  }
  
  /**
   * Ažuriranje metapodataka dokumenta
   */
  public async updateDocumentMetadata(id: string, metadata: Partial<VectorEntry['metadata']>): Promise<boolean> {
    try {
      // Prvo dobavljamo postojeći dokument
      const { data: existingDoc, error: fetchError } = await this.supabase
        .from(this.vectorCollection)
        .select('metadata')
        .eq('id', id)
        .single();
      
      if (fetchError || !existingDoc) {
        console.error('Dokument nije pronađen:', fetchError);
        return false;
      }
      
      // Spajamo postojeće i nove metapodatke
      const updatedMetadata = {
        ...existingDoc.metadata,
        ...metadata
      };
      
      // Ažuriramo dokument
      const { error } = await this.supabase
        .from(this.vectorCollection)
        .update({ metadata: updatedMetadata })
        .eq('id', id);
      
      if (error) {
        console.error('Greška pri ažuriranju metapodataka dokumenta:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Greška pri ažuriranju metapodataka dokumenta:', error);
      return false;
    }
  }
}

export const vectorStorageService = new VectorStorageService();