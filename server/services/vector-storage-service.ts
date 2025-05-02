import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface VectorDocument {
  content: string;
  metadata: {
    filename: string;
    fileType: string;
    bucket?: string;
    filePath?: string;
    extractionDate?: string;
    addedAt?: string;
    userId?: string; 
    isPublic?: boolean;
    category?: string;
    folder?: string;
    tags?: string[];
    [key: string]: any;
  };
}

interface DocumentQuery {
  query: string;
  limit?: number;
  userId?: string;
  includePublic?: boolean;
  category?: string;
  folder?: string;
  fileTypes?: string[];
  tags?: string[];
  similarityThreshold?: number;
}

/**
 * Servis za rad sa vektorskim skladištem dokumenata u Supabase-u
 */
export class VectorStorageService {
  private supabase!: SupabaseClient;
  private isReady = false;
  private readonly collectionName = 'documents';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Nedostaju Supabase kredencijali. Vektorska baza neće biti dostupna.');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.isReady = true;
    console.log('VectorStorageService je inicijalizovan');
  }

  /**
   * Provera da li je vektorska baza dostupna
   */
  public async isAvailable(): Promise<boolean> {
    if (!this.isReady) return false;
    
    try {
      const { error } = await this.supabase.from('documents').select('id', { count: 'exact', head: true });
      return !error;
    } catch (error) {
      console.error('Greška pri proveri dostupnosti vektorske baze:', error);
      return false;
    }
  }

  /**
   * Dodaje dokument u vektorsku bazu
   */
  public async addDocument(document: VectorDocument): Promise<string | null> {
    if (!this.isReady) {
      console.error('Vektorska baza nije inicijalizovana');
      return null;
    }

    try {
      // Prvo generisati embedding vektor za sadržaj
      const embedding = await this.generateEmbedding(document.content);
      
      if (!embedding || embedding.length === 0) {
        throw new Error('Nije moguće generisati embedding za dokument');
      }

      // Dodati dokument u bazu
      const { data, error } = await this.supabase
        .from(this.collectionName)
        .insert({
          content: document.content,
          metadata: document.metadata,
          embedding: embedding
        })
        .select('id')
        .single();

      if (error) {
        console.error('Greška pri dodavanju dokumenta u vektorsku bazu:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Greška pri dodavanju dokumenta u vektorsku bazu:', error);
      return null;
    }
  }

  /**
   * Pretražuje dokumente u vektorskoj bazi na osnovu semantičke sličnosti
   */
  public async searchDocuments(query: DocumentQuery): Promise<VectorDocument[]> {
    if (!this.isReady) {
      console.error('Vektorska baza nije inicijalizovana');
      return [];
    }

    try {
      // Generisanje embedding-a za upit
      const embedding = await this.generateEmbedding(query.query);
      
      if (!embedding || embedding.length === 0) {
        throw new Error('Nije moguće generisati embedding za upit');
      }

      // Kreiranje RPC poziva za pretragu
      let rpcCall = this.supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: query.similarityThreshold || 0.7,
        match_count: query.limit || 5
      });

      // Dobavljanje rezultata
      const { data, error } = await rpcCall;

      if (error) {
        console.error('Greška pri pretrazi dokumenata:', error);
        return [];
      }

      // Filtriranje rezultata prema dodatnim kriterijumima
      let results = data || [];

      // Filtriranje prema korisniku i javnim dokumentima
      if (query.userId || query.includePublic !== undefined) {
        results = results.filter((item: any) => {
          // Ako je dokument od traženog korisnika
          if (query.userId && item.metadata.userId === query.userId) {
            return true;
          }
          
          // Ako su uključeni javni dokumenti i dokument je javan
          if (query.includePublic && item.metadata.isPublic === true) {
            return true;
          }
          
          return false;
        });
      }

      // Filtriranje prema kategoriji
      if (query.category) {
        results = results.filter((item: any) => item.metadata.category === query.category);
      }

      // Filtriranje prema folderu
      if (query.folder) {
        results = results.filter((item: any) => item.metadata.folder === query.folder);
      }

      // Filtriranje prema tipu fajla
      if (query.fileTypes && query.fileTypes.length > 0) {
        results = results.filter((item: any) => 
          query.fileTypes?.includes(item.metadata.fileType)
        );
      }

      // Filtriranje prema tagovima
      if (query.tags && query.tags.length > 0) {
        results = results.filter((item: any) => {
          if (!item.metadata.tags) return false;
          return query.tags?.some(tag => item.metadata.tags?.includes(tag));
        });
      }

      // Transformisanje rezultata u VectorDocument format
      return results.map((item: any) => ({
        content: item.content,
        metadata: item.metadata
      }));
    } catch (error) {
      console.error('Greška pri pretrazi dokumenata:', error);
      return [];
    }
  }

  /**
   * Generiše embedding za tekst koristeći Supabase funkciju
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isReady) {
      console.error('Vektorska baza nije inicijalizovana');
      return [];
    }

    try {
      const { data, error } = await this.supabase.rpc('generate_embeddings', {
        input_text: text
      });

      if (error) {
        console.error('Greška pri generisanju embeddings-a:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Greška pri generisanju embeddings-a:', error);
      return [];
    }
  }

  /**
   * Briše dokument iz vektorske baze
   */
  public async deleteDocument(documentId: string): Promise<boolean> {
    if (!this.isReady) {
      console.error('Vektorska baza nije inicijalizovana');
      return false;
    }

    try {
      const { error } = await this.supabase
        .from(this.collectionName)
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Greška pri brisanju dokumenta:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Greška pri brisanju dokumenta:', error);
      return false;
    }
  }

  /**
   * Ažurira dokument u vektorskoj bazi
   */
  public async updateDocument(documentId: string, document: Partial<VectorDocument>): Promise<boolean> {
    if (!this.isReady) {
      console.error('Vektorska baza nije inicijalizovana');
      return false;
    }

    try {
      // Priprema podataka za ažuriranje
      const updateData: any = {};
      
      if (document.content) {
        updateData.content = document.content;
        // Ako je sadržaj promenjen, potrebno je generisati novi embedding
        const embedding = await this.generateEmbedding(document.content);
        if (embedding && embedding.length > 0) {
          updateData.embedding = embedding;
        }
      }
      
      if (document.metadata) {
        updateData.metadata = document.metadata;
      }

      // Ako nema podataka za ažuriranje, završavamo
      if (Object.keys(updateData).length === 0) {
        return true;
      }

      const { error } = await this.supabase
        .from(this.collectionName)
        .update(updateData)
        .eq('id', documentId);

      if (error) {
        console.error('Greška pri ažuriranju dokumenta:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Greška pri ažuriranju dokumenta:', error);
      return false;
    }
  }

  /**
   * Vraća dokument iz vektorske baze po ID-u
   */
  public async getDocumentById(documentId: string): Promise<VectorDocument | null> {
    if (!this.isReady) {
      console.error('Vektorska baza nije inicijalizovana');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from(this.collectionName)
        .select('content, metadata')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Greška pri dobavljanju dokumenta:', error);
        return null;
      }

      return {
        content: data.content,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Greška pri dobavljanju dokumenta:', error);
      return null;
    }
  }

  /**
   * Vraća sve dokumente određenog korisnika
   */
  public async getUserDocuments(userId: string, options?: {
    includePublic?: boolean;
    category?: string;
    folder?: string;
    fileTypes?: string[];
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<VectorDocument[]> {
    if (!this.isReady) {
      console.error('Vektorska baza nije inicijalizovana');
      return [];
    }

    try {
      let query = this.supabase
        .from(this.collectionName)
        .select('content, metadata');

      // Kreiranje filtera prema korisniku i javnim dokumentima
      if (options?.includePublic) {
        query = query.or(`metadata->>userId.eq.${userId},metadata->>isPublic.eq.true`);
      } else {
        query = query.eq('metadata->>userId', userId);
      }

      // Dodatni filteri
      if (options?.category) {
        query = query.eq('metadata->>category', options.category);
      }

      if (options?.folder) {
        query = query.eq('metadata->>folder', options.folder);
      }

      // Paginacija
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        // Type assertion to access the offset method
        (query as any).offset(options.offset);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Greška pri dobavljanju korisničkih dokumenata:', error);
        return [];
      }

      // Filtriranje prema tipovima fajlova i tagovima na klijentskoj strani
      // jer Supabase ima ograničenja sa filterima na nizovima u JSON poljima
      let results = data || [];

      if (options?.fileTypes && options.fileTypes.length > 0) {
        results = results.filter((item: any) => 
          options.fileTypes?.includes(item.metadata.fileType)
        );
      }

      if (options?.tags && options.tags.length > 0) {
        results = results.filter((item: any) => {
          if (!item.metadata.tags) return false;
          return options.tags?.some(tag => item.metadata.tags?.includes(tag));
        });
      }

      return results.map((item: any) => ({
        content: item.content,
        metadata: item.metadata
      }));
    } catch (error) {
      console.error('Greška pri dobavljanju korisničkih dokumenata:', error);
      return [];
    }
  }
}

export const vectorStorageService = new VectorStorageService();