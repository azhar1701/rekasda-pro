-- ============================================================================
-- RLS HARDENING FIX: Permissive Guest/Offline Fallback for Calculation Tables
-- RekasDA Pro — Platform Rekayasa SDA & Hidrologi (SNI Compliant)
-- Tanggal: 2026-10-03
-- ============================================================================
-- Memastikan pengguna publik/tamu dapat menyimpan hasil kalkulasi tanpa error
-- RLS 42501 (insufficient_privilege) saat beroperasi offline atau tanpa login.
-- ============================================================================

BEGIN;

-- 1. Tabel calculations
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'calculations' AND policyname = 'calc_anon_insert_policy'
    ) THEN
        CREATE POLICY calc_anon_insert_policy ON public.calculations
            FOR INSERT TO anon, authenticated
            WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'calculations' AND policyname = 'calc_anon_select_policy'
    ) THEN
        CREATE POLICY calc_anon_select_policy ON public.calculations
            FOR SELECT TO anon
            USING (user_id IS NULL);
    END IF;
END $$;

-- 2. Tabel manning_calculations
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'manning_calculations' AND policyname = 'manning_anon_insert_policy'
    ) THEN
        CREATE POLICY manning_anon_insert_policy ON public.manning_calculations
            FOR INSERT TO anon, authenticated
            WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
    END IF;
END $$;

-- 3. Tabel flood_calculations
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'flood_calculations' AND policyname = 'flood_anon_insert_policy'
    ) THEN
        CREATE POLICY flood_anon_insert_policy ON public.flood_calculations
            FOR INSERT TO anon, authenticated
            WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'flood_calculations' AND policyname = 'flood_anon_select_policy'
    ) THEN
        CREATE POLICY flood_anon_select_policy ON public.flood_calculations
            FOR SELECT TO anon
            USING (user_id IS NULL);
    END IF;
END $$;

-- 4. Tabel water_balance_calculations
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'water_balance_calculations' AND policyname = 'water_balance_anon_insert_policy'
    ) THEN
        CREATE POLICY water_balance_anon_insert_policy ON public.water_balance_calculations
            FOR INSERT TO anon, authenticated
            WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'water_balance_calculations' AND policyname = 'water_balance_anon_select_policy'
    ) THEN
        CREATE POLICY water_balance_anon_select_policy ON public.water_balance_calculations
            FOR SELECT TO anon
            USING (user_id IS NULL);
    END IF;
END $$;

-- 5. Tabel embung_projects (Mendukung skema dengan owner_id maupun user_id)
DO $$ 
DECLARE
    v_col_name text;
BEGIN
    -- Deteksi apakah kolom owner_id atau user_id yang ada di tabel embung_projects
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'embung_projects' AND column_name = 'owner_id'
    ) THEN
        v_col_name := 'owner_id';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'embung_projects' AND column_name = 'user_id'
    ) THEN
        v_col_name := 'user_id';
    ELSE
        -- Jika belum ada keduanya di tabel, tambahkan user_id
        ALTER TABLE public.embung_projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        v_col_name := 'user_id';
    END IF;

    -- Drop policy lama jika ada untuk idempotensi
    EXECUTE 'DROP POLICY IF EXISTS embung_anon_insert_policy ON public.embung_projects';
    EXECUTE 'DROP POLICY IF EXISTS embung_anon_select_policy ON public.embung_projects';

    -- Buat policy baru yang dinamis sesuai kolom yang ada di database
    EXECUTE format(
        'CREATE POLICY embung_anon_insert_policy ON public.embung_projects
         FOR INSERT TO anon, authenticated
         WITH CHECK (%I IS NULL OR auth.uid() = %I)',
        v_col_name, v_col_name
    );

    EXECUTE format(
        'CREATE POLICY embung_anon_select_policy ON public.embung_projects
         FOR SELECT TO anon
         USING (%I IS NULL)',
        v_col_name
    );
END $$;

COMMIT;
