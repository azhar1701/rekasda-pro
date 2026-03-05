-- Migration: 20260305_spatial_parameters.sql
-- Description: Persistence layer for DAS Morphometry and Land Use

-- 1. master_morfometri_das
CREATE TABLE IF NOT EXISTS public.master_morfometri_das (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stasiun_id UUID REFERENCES public.master_stasiun(id) ON DELETE CASCADE,
    project_id UUID, -- Optional if global/project-specific
    luas_das DECIMAL(12, 4) NOT NULL, -- km2
    panjang_sungai DECIMAL(12, 4), -- km
    kemiringan_sungai DECIMAL(12, 6), -- m/m or %
    elevasi DECIMAL(12, 2), -- mdpl
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stasiun_id)
);

-- 2. master_tutupan_lahan
CREATE TABLE IF NOT EXISTS public.master_tutupan_lahan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stasiun_id UUID REFERENCES public.master_stasiun(id) ON DELETE CASCADE,
    project_id UUID,
    jenis TEXT NOT NULL, -- e.g., 'Hutan', 'Sawah', 'Pemukiman'
    luas DECIMAL(12, 4) NOT NULL, -- km2 or ha
    nilai_c DECIMAL(5, 3), -- Rational Method coefficient
    nilai_cn DECIMAL(5, 2), -- SCS Curve Number
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.master_morfometri_das ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_tutupan_lahan ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (True for now to match other tables)
DROP POLICY IF EXISTS "Allow all access to master_morfometri_das" ON public.master_morfometri_das;
CREATE POLICY "Allow all access to master_morfometri_das" 
ON public.master_morfometri_das FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to master_tutupan_lahan" ON public.master_tutupan_lahan;
CREATE POLICY "Allow all access to master_tutupan_lahan" 
ON public.master_tutupan_lahan FOR ALL 
USING (true) 
WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_master_morfometri_das_updated_at ON public.master_morfometri_das;
CREATE TRIGGER update_master_morfometri_das_updated_at
    BEFORE UPDATE ON public.master_morfometri_das
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_master_tutupan_lahan_updated_at ON public.master_tutupan_lahan;
CREATE TRIGGER update_master_tutupan_lahan_updated_at
    BEFORE UPDATE ON public.master_tutupan_lahan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
