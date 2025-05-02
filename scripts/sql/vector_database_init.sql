-- Inicijalizacija vektorske baze za BZR portal
-- Napomena: Ova skripta treba da se pokrene u Supabase SQL editoru

-- 1. Prvo, proveriti da li pgvector ekstenzija postoji, ako ne, instalirati je
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Kreiranje tabele za dokumente
CREATE TABLE IF NOT EXISTS documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536), -- 1536 je dimenzija za OpenAI embeddings
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Kreiranje indeksa za brzu pretragu na osnovu sličnosti vektora
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. Kreiranje funkcije za generisanje embeddings-a
-- Napomena: Ova funkcija je stub - stvarna implementacija bi trebala da koristi OpenAI API ili drugi model
CREATE OR REPLACE FUNCTION generate_embeddings(input_text text)
RETURNS vector
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ova funkcija bi trebala da pozove vanjski API za generisanje embeddings-a
  -- U produkciji, ovo treba zameniti sa stvarnim API pozivom
  RAISE EXCEPTION 'Funkcija nije implementirana na produkcijskom serveru.';
  RETURN NULL;
END;
$$;

-- 5. Funkcija za pretragu dokumenata na osnovu sličnosti embeddings-a
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;