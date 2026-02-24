-- TAHAP 1: Skema Database (Supabase / PostgreSQL) untuk Master Data Hidrologi

-- Enum for optional station types if needed later (not strictly requested, but good practice)
-- CREATE TYPE station_type AS ENUM ('Hujan', 'Klimatologi', 'Duga Air');

-- 1. Tabel master_stasiun
CREATE TABLE IF NOT EXISTS public.master_stasiun (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_stasiun VARCHAR(255) NOT NULL,
    koordinat_x FLOAT, -- Longitude / Easting
    koordinat_y FLOAT, -- Latitude / Northing
    elevasi FLOAT,     -- in meters (msl)
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protect with RLS (Row Level Security) if applicable
ALTER TABLE public.master_stasiun ENABLE ROW LEVEL SECURITY;

-- 2. Tabel master_data_hujan
CREATE TABLE IF NOT EXISTS public.master_data_hujan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stasiun_id UUID NOT NULL REFERENCES public.master_stasiun(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    curah_hujan FLOAT NOT NULL, -- in mm
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_data_hujan_stasiun_id ON public.master_data_hujan(stasiun_id);
CREATE INDEX IF NOT EXISTS idx_data_hujan_tanggal ON public.master_data_hujan(tanggal);
CREATE INDEX IF NOT EXISTS idx_data_hujan_stasiun_tanggal ON public.master_data_hujan(stasiun_id, tanggal);

-- Protect with RLS
ALTER TABLE public.master_data_hujan ENABLE ROW LEVEL SECURITY;

-- Create policy examples (assuming authenticated users can read, admin can write)
-- This is a placeholder; adjust according to app's auth setup.
CREATE POLICY "Enable read access for all users on master_stasiun" ON public.master_stasiun FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users on master_data_hujan" ON public.master_data_hujan FOR SELECT USING (true);

-- Trigger for updated_at in master_stasiun
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ language 'plpgsql';

CREATE TRIGGER update_master_stasiun_modtime
    BEFORE UPDATE ON public.master_stasiun
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
