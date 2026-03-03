-- =========================================================================
-- MIGRATION: PEMISAHAN DATA HUJAN TITIK (STASIUN) DAN KAWASAN (CHIRPS/DAS)
-- =========================================================================

-- FASE 1: Master Tables & Spatial Support

-- Aktifkan ekstensi PostGIS (jika belum ada)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Perbarui master_stasiun (Jika sudah ada, kita tambahkan kolom geom aman)
ALTER TABLE public.master_stasiun 
ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

-- Trigger opsional: update geom dari koordinat X/Y secara otomatis
CREATE OR REPLACE FUNCTION sync_stasiun_geom() RETURNS trigger AS $$
BEGIN
    IF NEW.koordinat_x IS NOT NULL AND NEW.koordinat_y IS NOT NULL THEN
        NEW.geom := ST_SetSRID(ST_MakePoint(NEW.koordinat_x, NEW.koordinat_y), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_geom ON public.master_stasiun;
CREATE TRIGGER trg_sync_geom 
BEFORE INSERT OR UPDATE ON public.master_stasiun 
FOR EACH ROW EXECUTE FUNCTION sync_stasiun_geom();

-- 2. Buat tabel master_das
CREATE TABLE IF NOT EXISTS public.master_das (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_das VARCHAR(255) NOT NULL UNIQUE,
    luas_km2 NUMERIC(10,3),
    geom geometry(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- FASE 2: Tabel Time-Series (The Core Data)
-- =========================================================================

-- 1. Tabel data_hujan_titik (Pengganti master_data_hujan yang lebih spesifik)
CREATE TABLE IF NOT EXISTS public.data_hujan_titik (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES public.master_stasiun(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    curah_hujan_mm NUMERIC(10,2) NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint Mutlak: Tidak boleh ada data ganda di hari yang sama untuk stasiun yang sama
    CONSTRAINT unique_hujan_titik_per_hari UNIQUE(station_id, tanggal)
);

-- Migrasikan data lama dari master_data_hujan (opsional, jika diperlukan)
-- INSERT INTO public.data_hujan_titik (station_id, tanggal, curah_hujan_mm, created_at)
-- SELECT stasiun_id, tanggal, curah_hujan::numeric, created_at FROM public.master_data_hujan
-- ON CONFLICT DO NOTHING;

-- 2. Tabel data_hujan_kawasan (Untuk CHIRPS, Thiessen, Aljabar)
CREATE TABLE IF NOT EXISTS public.data_hujan_kawasan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    das_id UUID NOT NULL REFERENCES public.master_das(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    curah_hujan_mm NUMERIC(10,2) NOT NULL,
    sumber_data VARCHAR(50) NOT NULL CHECK (sumber_data IN ('CHIRPS', 'THIESSEN', 'ALJABAR', 'ISOYET')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint Mutlak: Mencegah duplikasi data sumber yang sama di DAS yang sama per harinya
    CONSTRAINT unique_hujan_kawasan_per_sumber UNIQUE(das_id, tanggal, sumber_data)
);
-- =========================================================================
-- FASE 3: Indexing B-Tree Kinerja Tinggi & Keamanan RLS
-- =========================================================================

-- Indexing untuk query rentang waktu harian yang super cepat (Range Queries)
CREATE INDEX IF NOT EXISTS idx_hujan_titik_tanggal ON public.data_hujan_titik USING btree (tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_hujan_kawasan_tanggal ON public.data_hujan_kawasan USING btree (tanggal DESC);

-- Index sekunder untuk pengelompokan berdasarkan Stasiun/DAS
CREATE INDEX IF NOT EXISTS idx_hujan_titik_station ON public.data_hujan_titik USING btree (station_id);
CREATE INDEX IF NOT EXISTS idx_hujan_kawasan_das ON public.data_hujan_kawasan USING btree (das_id);

-- Index spasial (GIST) untuk kalkulasi geometri PostGIS (mencari stasiun di dalam DAS)
CREATE INDEX IF NOT EXISTS idx_master_stasiun_geom ON public.master_stasiun USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_master_das_geom ON public.master_das USING GIST (geom);

-- Keamanan Tingkat Baris (Row Level Security / RLS)
ALTER TABLE public.master_das ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_hujan_titik ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_hujan_kawasan ENABLE ROW LEVEL SECURITY;

-- Policy 1: Akses BACA Publik / Authenticated (untuk Dashboard UI React)
CREATE POLICY "Enable read access for all users on master_das" ON public.master_das FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users on data_hujan_titik" ON public.data_hujan_titik FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users on data_hujan_kawasan" ON public.data_hujan_kawasan FOR SELECT USING (true);

-- Policy 2: Akses TULIS Terbatas (hanya untuk Service Role / Backend Cron)
CREATE POLICY "Enable insert/update/delete for service role only on data_hujan_titik" 
ON public.data_hujan_titik FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Enable insert/update/delete for service role only on data_hujan_kawasan" 
ON public.data_hujan_kawasan FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Kebijakan khusus (Tulis) untuk Master DAS (biasanya oleh Engineer secara manual atau service_role)
CREATE POLICY "Enable insert/update/delete for authenticated users on master_das" 
ON public.master_das FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- =========================================================================
-- END OF MIGRATION
-- =========================================================================
