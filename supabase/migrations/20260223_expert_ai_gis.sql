-- Phase 3: Expert AI & GIS Setup

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Update Calculations Table with Spacial Data
-- We'll add a geography column for precise spatial queries
ALTER TABLE calculations 
ADD COLUMN IF NOT EXISTS geo_location GEOGRAPHY(POINT, 4326);

-- Backfill geo_location from input_data if possible (optional but good practice)
-- Logic would depend on the structure of input_data

-- 3. Document Storage for RAG-based AI
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read documents (public technical standards)
CREATE POLICY "Public read access for documents"
ON documents FOR SELECT
USING (true);

-- 4. Document Embeddings for Vector Search
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    embedding VECTOR(768), -- 768 for Gemini text-embedding-004
    content_chunk TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create a vector index for fast retrieval
CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx 
ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable RLS on document_embeddings
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for document_embeddings"
ON document_embeddings FOR SELECT
USING (true);

-- 5. Helper Function for Spatial Search
CREATE OR REPLACE FUNCTION find_nearby_calculations(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters FLOAT DEFAULT 5000
)
RETURNS SETOF calculations AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM calculations
    WHERE ST_DWithin(
        geo_location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_meters
    )
    ORDER BY ST_Distance(
        geo_location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Helper Function for Vector Search (RAG)
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content_chunk TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.document_id,
    de.content_chunk,
    de.metadata,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM document_embeddings de
  WHERE 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 7. Seed Data: SNI snippets (Titles only, content for RAG)
INSERT INTO documents (title, content, metadata, source_url)
VALUES 
('SNI 2415:2016 - Tata Cara Perhitungan Debit Banjir Rencana', 'Metode Rasional digunakan untuk DAS dengan luas kurang dari 5000 ha atau 50 km2. Rumus: Q = 0.278 * C * I * A. Koefisien pengaliran (C) ditentukan berdasarkan tata guna lahan. Intensitas hujan (I) dihitung menggunakan rumus Mononobe.', '{"code": "SNI 2415:2016", "category": "Hydrology"}', 'https://sispk.bsn.go.id'),
('UU No. 17 Tahun 2019 tentang Sumber Daya Air', 'Pasal 22 mewajibkan alokasi air untuk kebutuhan pokok sehari-hari dan irigasi pertanian rakyat dalam sistem irigasi yang sudah ada. Selain itu, alokasi air untuk lingkungan (debit pemeliharaan) ditetapkan paling sedikit 10% dari debit andalan.', '{"code": "UU 17/2019", "category": "Legal"}', 'https://jdih.setkab.go.id'),
('Permen PUPR No. 12/PRT/M/2014 - Drainase Perkotaan', 'Perencanaan sistem drainase perkotaan harus memperhatikan kriteria hidrologi dan hidraulika. Koefisien pengaliran untuk kawasan perumahan padat berkisar antara 0.60 - 0.80. Kala ulang rencana untuk saluran primer kota besar adalah 10 tahun.', '{"code": "Permen PUPR 12/2014", "category": "Drainage"}', 'https://jdih.pu.go.id');

-- NOTE: Embeddings should be generated via application layer or trigger calling an Edge Function.
-- For now, we leave document_embeddings empty until a sync/bootstrap process is run.
