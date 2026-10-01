-- ============================================================================
-- MIGRATION: 20261002_master_data_hardening.sql
-- TUJUAN: Penguatan Integritas Fisik & Spasial Master Data Hidrologi (SNI)
-- ============================================================================

-- 1. Pastikan ekstensi PostGIS aktif (jika didukung oleh cluster)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Validasi Batas Geografis Indonesia pada master_stasiun
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_stasiun_koordinat_indonesia'
    ) THEN
        ALTER TABLE public.master_stasiun
        ADD CONSTRAINT chk_stasiun_koordinat_indonesia
        CHECK (
            (koordinat_x IS NULL OR (koordinat_x >= 95.0 AND koordinat_x <= 141.0)) AND
            (koordinat_y IS NULL OR (koordinat_y >= -11.5 AND koordinat_y <= 6.5))
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_stasiun_elevasi_fisik'
    ) THEN
        ALTER TABLE public.master_stasiun
        ADD CONSTRAINT chk_stasiun_elevasi_fisik
        CHECK (elevasi IS NULL OR (elevasi >= -50 AND elevasi <= 6000));
    END IF;
END $$;

-- 3. Tambahkan Kolom Geometri Spasial Terproyeksi (WGS84 EPSG:4326)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'master_stasiun' 
          AND column_name = 'geom'
    ) THEN
        BEGIN
            ALTER TABLE public.master_stasiun 
            ADD COLUMN geom geometry(Point, 4326) 
            GENERATED ALWAYS AS (
                CASE 
                    WHEN koordinat_x IS NOT NULL AND koordinat_y IS NOT NULL 
                    THEN ST_SetSRID(ST_MakePoint(koordinat_x, koordinat_y), 4326)
                    ELSE NULL 
                END
            ) STORED;

            CREATE INDEX IF NOT EXISTS idx_master_stasiun_geom_gist 
            ON public.master_stasiun USING GIST (geom);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Catatan: Pembuatan kolom PostGIS geom dilewati jika ekstensi tidak aktif di lingkungan lokal.';
        END;
    END IF;
END $$;

-- 4. Penguatan Batas Fisik Curah Hujan Harian pada master_data_hujan
-- Curah hujan harian di Indonesia maksimum fisik PMP ~600 mm
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_data_hujan_batas_fisik'
    ) THEN
        ALTER TABLE public.master_data_hujan
        ADD CONSTRAINT chk_data_hujan_batas_fisik
        CHECK (curah_hujan >= 0 AND curah_hujan <= 600);
    END IF;
END $$;

-- 5. Pastikan Covering Index Time-Series Optimal
CREATE INDEX IF NOT EXISTS idx_master_data_hujan_stasiun_tanggal_covering
ON public.master_data_hujan (stasiun_id, tanggal DESC)
INCLUDE (curah_hujan);

-- 6. Update Statistik Perencana Query
ANALYZE public.master_stasiun;
ANALYZE public.master_data_hujan;

-- 7. Relaksasi RLS Policy master_stasiun & master_data_hujan
-- Memungkinkan operasional CRUD penuh bagi pengguna aplikasi (authenticated & anon)
DROP POLICY IF EXISTS "stasiun_admin_delete" ON public.master_stasiun;
DROP POLICY IF EXISTS "stasiun_admin_update" ON public.master_stasiun;
DROP POLICY IF EXISTS "stasiun_admin_insert" ON public.master_stasiun;
DROP POLICY IF EXISTS "stasiun_authenticated_select" ON public.master_stasiun;
DROP POLICY IF EXISTS "Enable read access for all users on master_stasiun" ON public.master_stasiun;
DROP POLICY IF EXISTS "Enable all operations for all on master_stasiun" ON public.master_stasiun;

CREATE POLICY "Enable all operations for all on master_stasiun"
ON public.master_stasiun
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "data_hujan_admin_delete" ON public.master_data_hujan;
DROP POLICY IF EXISTS "data_hujan_admin_update" ON public.master_data_hujan;
DROP POLICY IF EXISTS "data_hujan_admin_insert" ON public.master_data_hujan;
DROP POLICY IF EXISTS "Enable all operations for all on master_data_hujan" ON public.master_data_hujan;

CREATE POLICY "Enable all operations for all on master_data_hujan"
ON public.master_data_hujan
FOR ALL
USING (true)
WITH CHECK (true);

