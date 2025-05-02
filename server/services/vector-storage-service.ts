import { createClient } from '@supabase/supabase-js';

// Provera Supabase kredencijala
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

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
  private supabase;
  private isReady = false;
  private readonly collectionName = 'documents';

  constructor() {
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.isReady = true;
    } else {
      console.warn('Nedostaju Supabase kredencijali. Vector storage neće biti dostupan.');
    }
  }

  /**
   * Provera da li je vektorska baza dostupna
   */
  public async isAvailable(): Promise<boolean> {
    if (!this.isReady) return false;
    
    try {
      // Testiramo konekciju sa jednostavnim upitom
      const { data, error } = await this.supabase
        .from('vector_documents')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Greška pri proveri dostupnosti vektorske baze:', error);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Izuzetak pri proveri dostupnosti vektorske baze:', e);
      return false;
    }
  }

  /**
   * Dodaje dokument u vektorsku bazu
   */
  public async addDocument(document: VectorDocument): Promise<string | null> {
    if (!this.isReady) {
      console.warn('Vector storage nije dostupan. Dokument neće biti sačuvan.');
      return null;
    }
    
    try {
      const { data, error } = await this.supabase
        .from('vector_documents')
        .insert({
          content: document.content,
          metadata: document.metadata,
          embedding: await this.generateEmbedding(document.content)
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Greška pri dodavanju dokumenta u vektorsku bazu:', error);
        return null;
      }
      
      return data.id;
    } catch (e) {
      console.error('Izuzetak pri dodavanju dokumenta u vektorsku bazu:', e);
      return null;
    }
  }

  /**
   * Pretražuje dokumente u vektorskoj bazi na osnovu semantičke sličnosti
   */
  public async searchDocuments(query: DocumentQuery): Promise<VectorDocument[]> {
    if (!this.isReady) {
      console.warn('Vector storage nije dostupan. Pretraga neće biti izvršena.');
      return [];
    }
    
    try {
      const embedding = await this.generateEmbedding(query.query);
      const limit = query.limit || 5;
      const threshold = query.similarityThreshold || 0.7;
      
      // Kreiramo upit sa filterima
      let queryBuilder = this.supabase
        .rpc('match_documents', {
          query_embedding: embedding,
          match_threshold: threshold,
          match_count: limit
        });
      
      // Primena filtera za pristup (privatni/javni dokumenti)
      if (query.userId) {
        if (query.includePublic) {
          queryBuilder = queryBuilder.or(`metadata->>'userId'.eq.${query.userId},metadata->>'isPublic'.eq.true`);
        } else {
          queryBuilder = queryBuilder.eq('metadata->userId', query.userId);
        }
      } else if (!query.includePublic) {
        queryBuilder = queryBuilder.eq('metadata->isPublic', true);
      }
      
      // Filtriranje po kategoriji
      if (query.category) {
        queryBuilder = queryBuilder.eq('metadata->category', query.category);
      }
      
      // Filtriranje po folderu
      if (query.folder) {
        queryBuilder = queryBuilder.eq('metadata->folder', query.folder);
      }
      
      // Filtriranje po tipu fajla
      if (query.fileTypes && query.fileTypes.length > 0) {
        queryBuilder = queryBuilder.in('metadata->fileType', query.fileTypes);
      }
      
      // Filtriranje po tagovima (ako postoje)
      if (query.tags && query.tags.length > 0) {
        // Ovo je složeniji filter koji bi trebalo implementirati posebno
        // za svaki tip baze (Postgres/Supabase handle JSON arrays differently)
      }
      
      const { data, error } = await queryBuilder;
      
      if (error) {
        console.error('Greška pri pretrazi dokumenata:', error);
        return [];
      }
      
      return data.map(item => ({
        content: item.content,
        metadata: item.metadata
      }));
    } catch (e) {
      console.error('Izuzetak pri pretrazi dokumenata:', e);
      return [];
    }
  }

  /**
   * Generiše embedding za tekst koristeći Supabase funkciju
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isReady) {
      throw new Error('Vector storage nije dostupan. Embedding ne može biti generisan.');
    }
    
    try {
      const { data, error } = await this.supabase
        .rpc('generate_embeddings', { text });
      
      if (error) {
        console.error('Greška pri generisanju embeddinga:', error);
        throw new Error(`Nije moguće generisati embedding: ${error.message}`);
      }
      
      return data;
    } catch (e) {
      console.error('Izuzetak pri generisanju embeddinga:', e);
      // Vraćamo prazan niz kao fallback (neće biti koristan za pretragu)
      return [];
    }
  }

  /**
   * Briše dokument iz vektorske baze
   */
  public async deleteDocument(documentId: string): Promise<boolean> {
    if (!this.isReady) {
      console.warn('Vector storage nije dostupan. Dokument neće biti obrisan.');
      return false;
    }
    
    try {
      const { error } = await this.supabase
        .from('vector_documents')
        .delete()
        .eq('id', documentId);
      
      if (error) {
        console.error('Greška pri brisanju dokumenta:', error);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Izuzetak pri brisanju dokumenta:', e);
      return false;
    }
  }

  /**
   * Ažurira dokument u vektorskoj bazi
   */
  public async updateDocument(documentId: string, document: Partial<VectorDocument>): Promise<boolean> {
    if (!this.isReady) {
      console.warn('Vector storage nije dostupan. Dokument neće biti ažuriran.');
      return false;
    }
    
    try {
      // Pripremamo podatke za ažuriranje
      const updateData: any = {};
      
      if (document.metadata) {
        updateData.metadata = document.metadata;
      }
      
      if (document.content) {
        updateData.content = document.content;
        updateData.embedding = await this.generateEmbedding(document.content);
      }
      
      const { error } = await this.supabase
        .from('vector_documents')
        .update(updateData)
        .eq('id', documentId);
      
      if (error) {
        console.error('Greška pri ažuriranju dokumenta:', error);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Izuzetak pri ažuriranju dokumenta:', e);
      return false;
    }
  }
}

export const vectorStorageService = new VectorStorageService();