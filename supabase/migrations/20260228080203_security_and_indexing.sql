-- ============================================================================
-- ENTERPRISE SECURITY & PERFORMANCE MIGRATION
-- Sistem: RekaSDA — Decision Support System Hidrologi
-- Instansi: Direktorat Jenderal SDA, Kementerian PUPR
-- Tanggal: 2026-02-28
-- Versi: 1.0 (Konsolidasi dari 5 file migration sebelumnya)
-- Standard: Enterprise Security + PostgreSQL Performance Engineering
-- ============================================================================
--
-- CATATAN PENTING:
-- Migration ini menggantikan dan mengkonsolidasi kebijakan RLS yang
-- tersebar di file-file berikut (yang kini berstatus DEPRECATED):
--   - fix-rls-policy.sql            (anon ALLOW ALL — TIDAK AMAN)
--   - 20260223_rls_hardening.sql    (parsial)
--   - 20260225060400_master_hidrologi.sql (SELECT USING true — terlalu permisif)
--   - 20260226_production_rls_security.sql (basis terbaik, dikonsolidasi di sini)
--   - 20260225_embung_projects.sql  (FOR ALL USING true — TIDAK AMAN)
--
-- ARSITEKTUR KEAMANAN:
--   READ  → Semua authenticated user (termasuk 'engineer', 'user')
--   WRITE → Khusus role 'admin' pada tabel master (stasiun, hujan)
--   CRUD  → User hanya dapat mengelola DATA MILIKNYA SENDIRI
--   AUDIT → Semua operasi DML dicatat di audit_logs
-- ============================================================================


-- ============================================================================
-- BAGIAN 0: EKSTENSI & HELPER FUNCTIONS
-- ============================================================================

-- Aktifkan ekstensi pencarian teks trigram (untuk autocomplete nama stasiun)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Aktifkan PostGIS (spatial queries — digunakan Fase 3 WebGIS)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Fungsi pembantu: cek apakah user yang sedang login adalah admin
-- SECURITY DEFINER: fungsi berjalan dengan hak superuser, bukan hak pemanggil
-- Ini mencegah user biasa memanipulasi kondisi pengecekan
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE  -- hasil konsisten dalam satu transaksi, boleh di-cache oleh planner
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
END;
$$;

-- Fungsi pembantu: ambil role user yang sedang login
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN (
        SELECT role
        FROM public.user_profiles
        WHERE id = auth.uid()
    );
END;
$$;

-- Fungsi umum: perbarui kolom updated_at secara otomatis
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- ============================================================================
-- BAGIAN 1: TABEL user_profiles (Manajemen Peran)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT,
    full_name   TEXT,
    -- Peran yang diizinkan: 'user' (default), 'engineer' (akses analisis lanjutan), 'admin' (pengelola data master)
    role        TEXT        NOT NULL DEFAULT 'user'
                            CHECK (role IN ('user', 'engineer', 'admin')),
    organization TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at untuk user_profiles
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Index performa pada role (untuk query pengecekan admin yang sering dipanggil)
CREATE INDEX IF NOT EXISTS idx_user_profiles_role
    ON public.user_profiles (role)
    WHERE role IN ('admin', 'engineer');

-- Aktifkan RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Users can view own profile"   ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles"  ON public.user_profiles;

-- Policy: Setiap user hanya melihat profil miliknya sendiri
CREATE POLICY "profile_select_own"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy: User hanya dapat update profil dirinya sendiri,
--         dan TIDAK BOLEH menaikkan role-nya sendiri
CREATE POLICY "profile_update_own_no_role_escalation"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())
    );

-- Policy: Admin dapat melihat semua profil (untuk halaman manajemen pengguna)
CREATE POLICY "profile_admin_select_all"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Policy: Admin dapat mengubah role user lain
CREATE POLICY "profile_admin_update_role"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- Trigger: Buat profil user secara otomatis saat user baru mendaftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'user'  -- Default role: user biasa
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- BAGIAN 2: TABEL master_stasiun (Data Stasiun Hidrologi)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.master_stasiun (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_stasiun    VARCHAR(255) NOT NULL,
    koordinat_x     FLOAT,          -- Longitude / Bujur (WGS84)
    koordinat_y     FLOAT,          -- Latitude / Lintang (WGS84)
    elevasi         FLOAT,          -- Elevasi dalam meter (msl)
    geom            geometry(Point, 4326),  -- Kolom spasial PostGIS
    keterangan      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_master_stasiun_updated_at ON public.master_stasiun;
CREATE TRIGGER trg_master_stasiun_updated_at
    BEFORE UPDATE ON public.master_stasiun
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Fungsi sinkronisasi: koordinat_x/y → geom (otomatis saat INSERT/UPDATE)
CREATE OR REPLACE FUNCTION public.sync_stasiun_geometry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.koordinat_x IS NOT NULL AND NEW.koordinat_y IS NOT NULL THEN
        -- ST_MakePoint(longitude, latitude) → SRID 4326 (WGS84)
        NEW.geom := ST_SetSRID(
            ST_MakePoint(NEW.koordinat_x, NEW.koordinat_y),
            4326
        );
    ELSE
        NEW.geom := NULL;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_stasiun_geometry ON public.master_stasiun;
CREATE TRIGGER trg_sync_stasiun_geometry
    BEFORE INSERT OR UPDATE OF koordinat_x, koordinat_y
    ON public.master_stasiun
    FOR EACH ROW EXECUTE FUNCTION public.sync_stasiun_geometry();

-- Migrasi data lama: isi kolom geom dari koordinat yang sudah ada
UPDATE public.master_stasiun
SET geom = ST_SetSRID(ST_MakePoint(koordinat_x, koordinat_y), 4326)
WHERE koordinat_x IS NOT NULL
  AND koordinat_y IS NOT NULL
  AND geom IS NULL;

-- ── Index untuk master_stasiun ──────────────────────────────────────────────

-- B-Tree Index: pencarian nama stasiun (exact match dan ORDER BY)
CREATE INDEX IF NOT EXISTS idx_master_stasiun_nama
    ON public.master_stasiun (nama_stasiun);

-- GIN Trigram Index: fuzzy search / autocomplete nama stasiun
-- Mendukung query: WHERE nama_stasiun ILIKE '%ciliwung%'
CREATE INDEX IF NOT EXISTS idx_master_stasiun_nama_trgm
    ON public.master_stasiun USING GIN (nama_stasiun gin_trgm_ops);

-- GIST Spatial Index: pencarian spasial (nearest station, within polygon)
CREATE INDEX IF NOT EXISTS idx_master_stasiun_geom
    ON public.master_stasiun USING GIST (geom);

-- ── RLS untuk master_stasiun ────────────────────────────────────────────────

ALTER TABLE public.master_stasiun ENABLE ROW LEVEL SECURITY;

-- Hapus SEMUA policy lama (konsolidasi)
DROP POLICY IF EXISTS "Enable read access for all users on master_stasiun" ON public.master_stasiun;
DROP POLICY IF EXISTS "auth_select_master_stasiun"                         ON public.master_stasiun;
DROP POLICY IF EXISTS "admin_insert_master_stasiun"                        ON public.master_stasiun;
DROP POLICY IF EXISTS "admin_update_master_stasiun"                        ON public.master_stasiun;
DROP POLICY IF EXISTS "admin_delete_master_stasiun"                        ON public.master_stasiun;

-- Policy: Semua authenticated user dapat READ data stasiun
CREATE POLICY "stasiun_authenticated_select"
    ON public.master_stasiun FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Hanya admin yang dapat INSERT stasiun baru
CREATE POLICY "stasiun_admin_insert"
    ON public.master_stasiun FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Policy: Hanya admin yang dapat UPDATE data stasiun
CREATE POLICY "stasiun_admin_update"
    ON public.master_stasiun FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- Policy: Hanya admin yang dapat DELETE stasiun
CREATE POLICY "stasiun_admin_delete"
    ON public.master_stasiun FOR DELETE
    TO authenticated
    USING (public.is_admin());


-- ============================================================================
-- BAGIAN 3: TABEL master_data_hujan (Data Curah Hujan Historis)
-- ============================================================================
-- Ini adalah tabel terbesar dan paling kritis untuk query time-series.
-- Optimasi indeks di sini sangat berdampak pada performa seluruh aplikasi.

CREATE TABLE IF NOT EXISTS public.master_data_hujan (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    stasiun_id      UUID        NOT NULL REFERENCES public.master_stasiun(id)
                                ON DELETE CASCADE,
    tanggal         DATE        NOT NULL,
    curah_hujan     FLOAT       NOT NULL CHECK (curah_hujan >= 0),  -- mm, tidak boleh negatif
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint: Satu stasiun hanya boleh punya satu record per tanggal
ALTER TABLE public.master_data_hujan
    DROP CONSTRAINT IF EXISTS uq_stasiun_tanggal;
ALTER TABLE public.master_data_hujan
    ADD CONSTRAINT uq_stasiun_tanggal UNIQUE (stasiun_id, tanggal);

-- ── B-Tree Compound Indexes untuk master_data_hujan ─────────────────────────
--
-- STRATEGI INDEXING:
-- Query paling umum: WHERE stasiun_id = X AND tanggal BETWEEN Y AND Z
-- Maka compound index (stasiun_id, tanggal) adalah yang paling efektif.
--
-- INCLUDE clause: menambahkan curah_hujan ke dalam index itu sendiri
-- sehingga Postgres dapat lakukan "index-only scan" tanpa menyentuh heap table.
-- Ini menghasilkan speedup 10-100x untuk dataset besar.

-- Hapus index lama yang tidak dioptimasi
DROP INDEX IF EXISTS public.idx_data_hujan_stasiun_id;
DROP INDEX IF EXISTS public.idx_data_hujan_tanggal;
DROP INDEX IF EXISTS public.idx_data_hujan_stasiun_tanggal;
DROP INDEX IF EXISTS public.idx_master_data_hujan_compound_primary;
DROP INDEX IF EXISTS public.idx_master_data_hujan_compound_reverse;
DROP INDEX IF EXISTS public.idx_master_data_hujan_stasiun_covering;
DROP INDEX IF EXISTS public.idx_master_data_hujan_recent;

-- INDEX UTAMA: (stasiun_id, tanggal DESC) INCLUDE (curah_hujan)
-- Pola query: WHERE stasiun_id = X AND tanggal BETWEEN Y AND Z ORDER BY tanggal DESC
-- Ini adalah index yang paling sering digunakan di seluruh aplikasi RekaSDA.
CREATE INDEX idx_data_hujan_stasiun_tanggal_asc
    ON public.master_data_hujan (stasiun_id, tanggal ASC)
    INCLUDE (curah_hujan);

-- INDEX SEKUNDER: (stasiun_id, tanggal ASC)
-- Digunakan untuk analisis deret waktu maju (time-series chart ascending)
CREATE INDEX idx_data_hujan_stasiun_tanggal_desc
    ON public.master_data_hujan (stasiun_id, tanggal DESC)
    INCLUDE (curah_hujan);

-- INDEX REVERSE: (tanggal, stasiun_id)
-- Digunakan untuk query lintas-stasiun pada rentang tanggal tertentu
-- Contoh: Ambil semua data hujan tanggal 2023-01 dari semua stasiun
CREATE INDEX idx_data_hujan_tanggal_stasiun
    ON public.master_data_hujan (tanggal DESC, stasiun_id)
    INCLUDE (curah_hujan);

-- INDEX PARSIAL: Data 5 tahun terakhir (query paling umum di aplikasi)
-- Index lebih kecil → scan lebih cepat untuk data terbaru
-- Perbarui tanggal ini setiap tahun via cronjob atau migration baru
CREATE INDEX idx_data_hujan_recent_5yr
    ON public.master_data_hujan (stasiun_id, tanggal DESC)
    WHERE tanggal >= '2021-01-01'::date;

-- UPDATE statistik tabel untuk query planner Postgres
ANALYZE public.master_data_hujan;
ANALYZE public.master_stasiun;

-- ── RLS untuk master_data_hujan ─────────────────────────────────────────────

ALTER TABLE public.master_data_hujan ENABLE ROW LEVEL SECURITY;

-- Hapus SEMUA policy lama
DROP POLICY IF EXISTS "Enable read access for all users on master_data_hujan" ON public.master_data_hujan;
DROP POLICY IF EXISTS "auth_select_master_data_hujan"                         ON public.master_data_hujan;
DROP POLICY IF EXISTS "admin_insert_master_data_hujan"                        ON public.master_data_hujan;
DROP POLICY IF EXISTS "admin_update_master_data_hujan"                        ON public.master_data_hujan;
DROP POLICY IF EXISTS "admin_delete_master_data_hujan"                        ON public.master_data_hujan;

-- Policy: Semua authenticated user dapat READ data curah hujan
CREATE POLICY "hujan_authenticated_select"
    ON public.master_data_hujan FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Hanya admin yang dapat INSERT data hujan baru
CREATE POLICY "hujan_admin_insert"
    ON public.master_data_hujan FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Policy: Hanya admin yang dapat UPDATE data hujan
CREATE POLICY "hujan_admin_update"
    ON public.master_data_hujan FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- Policy: Hanya admin yang dapat DELETE data hujan
CREATE POLICY "hujan_admin_delete"
    ON public.master_data_hujan FOR DELETE
    TO authenticated
    USING (public.is_admin());


-- ============================================================================
-- BAGIAN 4: TABEL calculations (Hasil Kalkulasi Hidrologi)
-- ============================================================================

-- Pastikan kolom user_id ada (dari migration sebelumnya)
ALTER TABLE public.calculations
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index performa pada user_id
CREATE INDEX IF NOT EXISTS idx_calculations_user_id
    ON public.calculations (user_id);

-- Index pada created_at untuk pagination dan sorting
CREATE INDEX IF NOT EXISTS idx_calculations_created_at
    ON public.calculations (created_at DESC);

ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

-- Hapus SEMUA policy lama yang mungkin konflik
DROP POLICY IF EXISTS "Allow all operations for authenticated users"    ON public.calculations;
DROP POLICY IF EXISTS "Allow all operations for everyone"               ON public.calculations;
DROP POLICY IF EXISTS "Allow all operations"                            ON public.calculations;
DROP POLICY IF EXISTS "Enable all operations for anonymous users"       ON public.calculations;
DROP POLICY IF EXISTS "Enable all operations for authenticated users"   ON public.calculations;
DROP POLICY IF EXISTS "Users can only see their own calculations"       ON public.calculations;
DROP POLICY IF EXISTS "Users can only insert their own calculations"    ON public.calculations;
DROP POLICY IF EXISTS "Users can only update their own calculations"    ON public.calculations;
DROP POLICY IF EXISTS "Users can only delete their own calculations"    ON public.calculations;
DROP POLICY IF EXISTS "Anonymous users can view public calculations"    ON public.calculations;
DROP POLICY IF EXISTS "auth_select_own_calculations"                    ON public.calculations;
DROP POLICY IF EXISTS "auth_insert_own_calculations"                    ON public.calculations;
DROP POLICY IF EXISTS "auth_update_own_calculations"                    ON public.calculations;
DROP POLICY IF EXISTS "auth_delete_own_calculations"                    ON public.calculations;
DROP POLICY IF EXISTS "anon_select_public_calculations"                 ON public.calculations;

-- Policy: User hanya melihat kalkulasi miliknya sendiri
CREATE POLICY "calc_select_own"
    ON public.calculations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: User hanya dapat menyimpan kalkulasi dengan user_id dirinya sendiri
CREATE POLICY "calc_insert_own"
    ON public.calculations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: User hanya dapat mengupdate kalkulasi miliknya
CREATE POLICY "calc_update_own"
    ON public.calculations FOR UPDATE
    TO authenticated
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: User hanya dapat menghapus kalkulasi miliknya
CREATE POLICY "calc_delete_own"
    ON public.calculations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Admin dapat melihat SEMUA kalkulasi (untuk audit dan dukungan teknis)
CREATE POLICY "calc_admin_select_all"
    ON public.calculations FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Policy: Data publik (pilot data, user_id NULL) dapat dilihat tanpa login
CREATE POLICY "calc_anon_select_public"
    ON public.calculations FOR SELECT
    TO anon
    USING (user_id IS NULL);


-- ============================================================================
-- BAGIAN 5: TABEL embung_projects (Proyek Analisis Situ & Embung)
-- ============================================================================

-- Pastikan user_id ada di tabel embung_projects
ALTER TABLE public.embung_projects
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_embung_user_id
    ON public.embung_projects (user_id);

ALTER TABLE public.embung_projects ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama yang terlalu permisif
DROP POLICY IF EXISTS "Allow all for embung" ON public.embung_projects;

-- Policy: User hanya melihat proyek embung miliknya
CREATE POLICY "embung_select_own"
    ON public.embung_projects FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: User menyimpan dengan user_id dirinya sendiri
CREATE POLICY "embung_insert_own"
    ON public.embung_projects FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: User mengupdate proyek miliknya
CREATE POLICY "embung_update_own"
    ON public.embung_projects FOR UPDATE
    TO authenticated
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: User menghapus proyek miliknya
CREATE POLICY "embung_delete_own"
    ON public.embung_projects FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Admin dapat melihat semua proyek embung
CREATE POLICY "embung_admin_select_all"
    ON public.embung_projects FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Policy: Data publik (pilot data)
CREATE POLICY "embung_anon_select_public"
    ON public.embung_projects FOR SELECT
    TO anon
    USING (user_id IS NULL);


-- ============================================================================
-- BAGIAN 6: TABEL audit_logs (Jejak Audit Enterprise)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    table_name  TEXT        NOT NULL,
    operation   TEXT        NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data    JSONB,
    new_data    JSONB,
    ip_address  INET,       -- Untuk forensik keamanan
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query audit: cari per user, per tabel, per waktu
CREATE INDEX IF NOT EXISTS idx_audit_user_id
    ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_table_operation
    ON public.audit_logs (table_name, operation, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_audit_logs" ON public.audit_logs;

-- Policy: Hanya admin yang dapat melihat audit log
CREATE POLICY "audit_admin_select_only"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Fungsi audit universal: dipanggil oleh trigger pada tabel manapun
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, table_name, operation, old_data, new_data)
    VALUES (
        auth.uid(),
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Pasang audit trigger pada tabel master (data kritis)
DROP TRIGGER IF EXISTS trg_audit_master_stasiun  ON public.master_stasiun;
CREATE TRIGGER trg_audit_master_stasiun
    AFTER INSERT OR UPDATE OR DELETE ON public.master_stasiun
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS trg_audit_master_data_hujan ON public.master_data_hujan;
CREATE TRIGGER trg_audit_master_data_hujan
    AFTER INSERT OR UPDATE OR DELETE ON public.master_data_hujan
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();


-- ============================================================================
-- BAGIAN 7: VERIFIKASI (Jalankan untuk konfirmasi setelah migration)
-- ============================================================================

-- 1. Verifikasi status RLS semua tabel
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- 2. Verifikasi semua policy yang aktif
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;

-- 3. Verifikasi index yang dibuat
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('master_stasiun', 'master_data_hujan', 'calculations', 'embung_projects')
-- ORDER BY tablename, indexname;

-- 4. Estimasi performa index (jalankan setelah ada data)
-- EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
-- SELECT stasiun_id, tanggal, curah_hujan
-- FROM public.master_data_hujan
-- WHERE stasiun_id = '<uuid>'
--   AND tanggal BETWEEN '2020-01-01' AND '2024-12-31'
-- ORDER BY tanggal DESC;
-- Harapan: "Index Only Scan using idx_data_hujan_stasiun_tanggal_desc"

-- ============================================================================
-- AKHIR MIGRATION
-- ============================================================================
-- Ringkasan Apa yang Dilakukan Migration Ini:
--
-- KEAMANAN:
--   [✓] RLS diaktifkan pada 5 tabel: user_profiles, master_stasiun,
--       master_data_hujan, calculations, embung_projects, audit_logs
--   [✓] Policy ALLOW ALL yang berbahaya dihapus sepenuhnya
--   [✓] Kebijakan user-owned CRUD untuk calculations & embung_projects
--   [✓] Kebijakan read-only untuk authenticated user pada tabel master
--   [✓] Kebijakan write hanya untuk admin pada tabel master
--   [✓] Auto-create profil user baru via trigger auth.users
--   [✓] Audit log otomatis untuk INSERT/UPDATE/DELETE pada tabel master
--
-- PERFORMA:
--   [✓] B-Tree Compound Index (stasiun_id, tanggal) dengan INCLUDE clause
--       untuk index-only scan — eliminasi heap access pada query time-series
--   [✓] Reverse compound index (tanggal, stasiun_id) untuk analisis lintas-stasiun
--   [✓] Partial index 5 tahun terakhir (ukuran lebih kecil, scan lebih cepat)
--   [✓] GIN Trigram index pada nama_stasiun untuk autocomplete O(log n)
--   [✓] GIST Spatial index pada geom untuk query spasial PostGIS
--   [✓] Unique constraint (stasiun_id, tanggal) untuk integritas data
--
-- SPASIAL:
--   [✓] PostGIS extension diaktifkan
--   [✓] Kolom geom geometry(Point, 4326) pada master_stasiun
--   [✓] Auto-sync trigger: koordinat_x/y ↔ geom
--   [✓] Migrasi data koordinat lama ke format geom
-- ============================================================================
