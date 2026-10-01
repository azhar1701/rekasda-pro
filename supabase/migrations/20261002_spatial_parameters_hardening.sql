-- ============================================================================
-- MIGRATION: 20261002_spatial_parameters_hardening.sql
-- TUJUAN: Restrukturisasi Entitas Spasial DAS (Daerah Aliran Sungai)
-- Standar: SNI 2415:2016 & SNI 19-6728.1-2002
-- ============================================================================

-- 0. BERSIHKAN JIKA RELASI ADALAH VIEW (Bukan Tabel Fisik)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_views WHERE schemaname = 'public' AND viewname = 'master_das') THEN
        DROP VIEW public.master_das CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_views WHERE schemaname = 'public' AND viewname = 'master_morfometri_das') THEN
        DROP VIEW public.master_morfometri_das CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_views WHERE schemaname = 'public' AND viewname = 'master_tutupan_lahan') THEN
        DROP VIEW public.master_tutupan_lahan CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_views WHERE schemaname = 'public' AND viewname = 'master_hujan_wilayah') THEN
        DROP VIEW public.master_hujan_wilayah CASCADE;
    END IF;
END $$;

-- 1. TABEL UTAMA: master_das (Entitas Spasial Makro DAS Fisik)
CREATE TABLE IF NOT EXISTS public.master_das (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_das VARCHAR(150) NOT NULL DEFAULT 'DAS Wilayah Studi',
    nama_sungai_utama VARCHAR(150),
    luas_das DECIMAL(12, 4) NOT NULL DEFAULT 0,       -- km²
    panjang_sungai DECIMAL(12, 4) DEFAULT 0,          -- km
    kemiringan_sungai DECIMAL(12, 6) DEFAULT 0,       -- m/m
    elevasi_rata_rata DECIMAL(12, 2) DEFAULT 0,       -- mdpl
    geojson_polygon JSONB,                            -- Batas GeoJSON
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan semua kolom baru ditambahkan jika tabel master_das fisik sudah ada dari migrasi sebelumnya
ALTER TABLE public.master_das ADD COLUMN IF NOT EXISTS nama_das VARCHAR(150) NOT NULL DEFAULT 'DAS Wilayah Studi';
ALTER TABLE public.master_das ADD COLUMN IF NOT EXISTS nama_sungai_utama VARCHAR(150);
ALTER TABLE public.master_das ADD COLUMN IF NOT EXISTS luas_das DECIMAL(12, 4) NOT NULL DEFAULT 0;
ALTER TABLE public.master_das ADD COLUMN IF NOT EXISTS panjang_sungai DECIMAL(12, 4) DEFAULT 0;
ALTER TABLE public.master_das ADD COLUMN IF NOT EXISTS kemiringan_sungai DECIMAL(12, 6) DEFAULT 0;
ALTER TABLE public.master_das ADD COLUMN IF NOT EXISTS elevasi_rata_rata DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.master_das ADD COLUMN IF NOT EXISTS geojson_polygon JSONB;
ALTER TABLE public.master_das ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.master_das ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Sinkronisasi data lama dari kolom luas_km2 jika ada
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'master_das' 
          AND column_name = 'luas_km2'
    ) THEN
        UPDATE public.master_das 
        SET luas_das = luas_km2 
        WHERE (luas_das IS NULL OR luas_das = 0) AND luas_km2 IS NOT NULL;
    END IF;
END $$;

-- 2. Pastikan ada minimal 1 record default DAS untuk backward compatibility
INSERT INTO public.master_das (id, nama_das, luas_das, panjang_sungai, kemiringan_sungai, elevasi_rata_rata)
VALUES ('00000000-0000-0000-0000-000000000001', 'DAS Utama Proyek', 150.5000, 25.4000, 0.012500, 450.00)
ON CONFLICT (id) DO UPDATE SET
    luas_das = COALESCE(NULLIF(public.master_das.luas_das, 0), EXCLUDED.luas_das),
    panjang_sungai = COALESCE(NULLIF(public.master_das.panjang_sungai, 0), EXCLUDED.panjang_sungai),
    kemiringan_sungai = COALESCE(NULLIF(public.master_das.kemiringan_sungai, 0), EXCLUDED.kemiringan_sungai),
    elevasi_rata_rata = COALESCE(NULLIF(public.master_das.elevasi_rata_rata, 0), EXCLUDED.elevasi_rata_rata);

-- 3. PERBAIKAN master_morfometri_das:
CREATE TABLE IF NOT EXISTS public.master_morfometri_das (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    das_id UUID REFERENCES public.master_das(id) ON DELETE CASCADE,
    stasiun_id UUID REFERENCES public.master_stasiun(id) ON DELETE SET NULL,
    luas_das DECIMAL(12, 4) DEFAULT 0,
    panjang_sungai DECIMAL(12, 4) DEFAULT 0,
    kemiringan_sungai DECIMAL(12, 6) DEFAULT 0,
    elevasi DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lepas batasan UNIQUE(stasiun_id) dan buat stasiun_id NULLABLE, tambahkan das_id
ALTER TABLE public.master_morfometri_das ADD COLUMN IF NOT EXISTS das_id UUID REFERENCES public.master_das(id) ON DELETE CASCADE;
ALTER TABLE public.master_morfometri_das ALTER COLUMN stasiun_id DROP NOT NULL;
ALTER TABLE public.master_morfometri_das DROP CONSTRAINT IF EXISTS master_morfometri_das_stasiun_id_key;

CREATE INDEX IF NOT EXISTS idx_master_morfometri_das_id 
ON public.master_morfometri_das(das_id);

-- 4. PERBAIKAN master_tutupan_lahan:
CREATE TABLE IF NOT EXISTS public.master_tutupan_lahan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    das_id UUID REFERENCES public.master_das(id) ON DELETE CASCADE,
    stasiun_id UUID REFERENCES public.master_stasiun(id) ON DELETE SET NULL,
    jenis VARCHAR(100) NOT NULL,
    luas DECIMAL(12, 4) NOT NULL DEFAULT 0,
    koefisien_c DECIMAL(4, 3) NOT NULL DEFAULT 0.2,
    persentase DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.master_tutupan_lahan ADD COLUMN IF NOT EXISTS das_id UUID REFERENCES public.master_das(id) ON DELETE CASCADE;
ALTER TABLE public.master_tutupan_lahan ALTER COLUMN stasiun_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_master_tutupan_lahan_das_id 
ON public.master_tutupan_lahan(das_id);

-- 5. TABEL PERSISTENSI HUJAN WILAYAH: master_hujan_wilayah
CREATE TABLE IF NOT EXISTS public.master_hujan_wilayah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    das_id UUID REFERENCES public.master_das(id) ON DELETE CASCADE,
    metode VARCHAR(50) NOT NULL DEFAULT 'thiessen', -- 'aljabar', 'thiessen', 'isohyet'
    hujan_rata_rata DECIMAL(10, 2) DEFAULT 0,
    hujan_rata_rata_ams JSONB,                     -- Array [120, 135, ...]
    configs JSONB,                                 -- Configs pembobotan stasiun
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS Policies
ALTER TABLE public.master_das ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_morfometri_das ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_tutupan_lahan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_hujan_wilayah ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on master_das" ON public.master_das;
CREATE POLICY "Allow all on master_das" ON public.master_das FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on master_morfometri_das" ON public.master_morfometri_das;
CREATE POLICY "Allow all on master_morfometri_das" ON public.master_morfometri_das FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on master_tutupan_lahan" ON public.master_tutupan_lahan;
CREATE POLICY "Allow all on master_tutupan_lahan" ON public.master_tutupan_lahan FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on master_hujan_wilayah" ON public.master_hujan_wilayah;
CREATE POLICY "Allow all on master_hujan_wilayah" ON public.master_hujan_wilayah FOR ALL USING (true) WITH CHECK (true);
