-- ============================================================================
-- MIGRATION: 20261002_spatial_parameters_hardening.sql
-- TUJUAN: Restrukturisasi Entitas Spasial DAS (Daerah Aliran Sungai)
-- Standar: SNI 2415:2016 & SNI 19-6728.1-2002
-- ============================================================================

-- 1. TABEL UTAMA: master_das (Entitas Spasial Makro DAS)
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

-- 2. Pastikan ada minimal 1 record default DAS untuk backward compatibility
INSERT INTO public.master_das (id, nama_das, luas_das, panjang_sungai, kemiringan_sungai, elevasi_rata_rata)
VALUES ('00000000-0000-0000-0000-000000000001', 'DAS Utama Proyek', 150.5000, 25.4000, 0.012500, 450.00)
ON CONFLICT (id) DO NOTHING;

-- 3. PERBAIKAN master_morfometri_das:
-- Lepas batasan UNIQUE(stasiun_id) dan buat stasiun_id NULLABLE, tambahkan das_id
DO $$
BEGIN
    -- Tambahkan das_id jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'master_morfometri_das' 
          AND column_name = 'das_id'
    ) THEN
        ALTER TABLE public.master_morfometri_das 
        ADD COLUMN das_id UUID REFERENCES public.master_das(id) ON DELETE CASCADE;
    END IF;

    -- Ubah stasiun_id menjadi NULLABLE
    ALTER TABLE public.master_morfometri_das 
    ALTER COLUMN stasiun_id DROP NOT NULL;

    -- Lepaskan constraint UNIQUE(stasiun_id) jika ada
    ALTER TABLE public.master_morfometri_das 
    DROP CONSTRAINT IF EXISTS master_morfometri_das_stasiun_id_key;

    -- Pastikan das_id memiliki index
    CREATE INDEX IF NOT EXISTS idx_master_morfometri_das_id 
    ON public.master_morfometri_das(das_id);
END $$;

-- 4. PERBAIKAN master_tutupan_lahan:
-- Tambahkan das_id dan buat stasiun_id NULLABLE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'master_tutupan_lahan' 
          AND column_name = 'das_id'
    ) THEN
        ALTER TABLE public.master_tutupan_lahan 
        ADD COLUMN das_id UUID REFERENCES public.master_das(id) ON DELETE CASCADE;
    END IF;

    ALTER TABLE public.master_tutupan_lahan 
    ALTER COLUMN stasiun_id DROP NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_master_tutupan_lahan_das_id 
    ON public.master_tutupan_lahan(das_id);
END $$;

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
