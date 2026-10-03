-- ============================================================================
-- MIGRATION: UNIFIED PROJECT & CALCULATION STORAGE (FASE 1)
-- Platform: RekasDA Pro — Engineering Platform SDA & Hidrologi (SNI Compliant)
-- Tanggal: 2026-10-03
-- Tujuan: Menyatukan dualisme penyimpanan antara Manajer Proyek (.rekasda)
--         dan Riwayat Perhitungan menjadi Satu Tempat (Project-Centric Architecture)
-- ============================================================================

-- 1. TABEL INDUK: PROYEK PEMODELAN HIDROLOGI
CREATE TABLE IF NOT EXISTS public.hydrology_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    das_name VARCHAR(255) NOT NULL,
    river_name VARCHAR(255),
    province VARCHAR(100),
    regency VARCHAR(100),
    author VARCHAR(150) NOT NULL DEFAULT 'Tenaga Ahli Hidrologi',
    institution VARCHAR(200) DEFAULT 'Konsultan Perencana SDA / Balai Wilayah Sungai',
    
    -- Koordinat titik outlet / tinjauan utama proyek
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    
    -- Status proyek: DRAFT, FINAL, TERVERIFIKASI, ARSIP
    status VARCHAR(50) DEFAULT 'DRAFT',
    schema_version VARCHAR(10) DEFAULT '2.0',
    
    -- Seluruh Konfigurasi Data Master (Morfometri DAS, Tutupan Lahan, Stasiun Configs, dll)
    master_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status Hasil Analisis Aktif Terkini Seluruh Modul (Frekuensi, Banjir, Neraca, Embung, Saluran)
    analysis_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Ringkasan Metrik Cepat untuk Dashboard (Kala Ulang Desain, Q_peak, Neraca Status, dll)
    summary_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks performa untuk pencarian dan penyortiran proyek
CREATE INDEX IF NOT EXISTS idx_hydrology_projects_updated_at 
    ON public.hydrology_projects (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hydrology_projects_user_id 
    ON public.hydrology_projects (user_id);
CREATE INDEX IF NOT EXISTS idx_hydrology_projects_code 
    ON public.hydrology_projects (project_code);

-- 2. TABEL ANAK: RIWAYAT & SKENARIO PERHITUNGAN TERPADU
CREATE TABLE IF NOT EXISTS public.project_calculation_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.hydrology_projects(id) ON DELETE CASCADE,
    
    -- Modul asal: 'manning' | 'flood' | 'water_balance' | 'embung' | 'frequency'
    module_type VARCHAR(50) NOT NULL,
    
    -- Judul & skenario analisis
    snapshot_title VARCHAR(255) NOT NULL,
    scenario_name VARCHAR(100) DEFAULT 'Kondisi Eksisting',
    
    -- Data lengkap parameter dan keluaran
    input_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Geolokasi & Bukti Lapangan
    location JSONB, -- { latitude, longitude, accuracy }
    photo_url TEXT,
    
    notes TEXT,
    created_by VARCHAR(150),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks relasi dan filter modul
CREATE INDEX IF NOT EXISTS idx_snapshots_project_id 
    ON public.project_calculation_snapshots (project_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_module_type 
    ON public.project_calculation_snapshots (module_type);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at 
    ON public.project_calculation_snapshots (created_at DESC);

-- 3. TRIGGER AUTO UPDATE TIMESTAMP
CREATE OR REPLACE FUNCTION public.set_hydrology_project_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hydrology_project_updated_at ON public.hydrology_projects;
CREATE TRIGGER trigger_hydrology_project_updated_at
    BEFORE UPDATE ON public.hydrology_projects
    FOR EACH ROW
    EXECUTE FUNCTION public.set_hydrology_project_timestamp();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.hydrology_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_calculation_snapshots ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk hydrology_projects
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'hydrology_projects' AND policyname = 'hydrology_projects_read_policy'
    ) THEN
        CREATE POLICY hydrology_projects_read_policy ON public.hydrology_projects
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'hydrology_projects' AND policyname = 'hydrology_projects_insert_policy'
    ) THEN
        CREATE POLICY hydrology_projects_insert_policy ON public.hydrology_projects
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'hydrology_projects' AND policyname = 'hydrology_projects_update_policy'
    ) THEN
        CREATE POLICY hydrology_projects_update_policy ON public.hydrology_projects
            FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'hydrology_projects' AND policyname = 'hydrology_projects_delete_policy'
    ) THEN
        CREATE POLICY hydrology_projects_delete_policy ON public.hydrology_projects
            FOR DELETE USING (true);
    END IF;
END $$;

-- Kebijakan untuk project_calculation_snapshots
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'project_calculation_snapshots' AND policyname = 'project_snapshots_read_policy'
    ) THEN
        CREATE POLICY project_snapshots_read_policy ON public.project_calculation_snapshots
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'project_calculation_snapshots' AND policyname = 'project_snapshots_insert_policy'
    ) THEN
        CREATE POLICY project_snapshots_insert_policy ON public.project_calculation_snapshots
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'project_calculation_snapshots' AND policyname = 'project_snapshots_update_policy'
    ) THEN
        CREATE POLICY project_snapshots_update_policy ON public.project_calculation_snapshots
            FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'project_calculation_snapshots' AND policyname = 'project_snapshots_delete_policy'
    ) THEN
        CREATE POLICY project_snapshots_delete_policy ON public.project_calculation_snapshots
            FOR DELETE USING (true);
    END IF;
END $$;
