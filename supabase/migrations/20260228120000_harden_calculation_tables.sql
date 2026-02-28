-- ============================================================================
-- ENTERPRISE RLS HARDENING: Calculation Module Tables
-- Sistem: RekaSDA — Decision Support System Hidrologi
-- Instansi: Direktorat Jenderal SDA, Kementerian PUPR
-- Tanggal: 2026-02-28
-- Versi: 1.0
-- Prasyarat: Jalankan 20260228080203_security_and_indexing.sql TERLEBIH DAHULU
-- ============================================================================
--
-- DESKRIPSI:
-- Migration konsolidasi 20260228080203 telah mengamankan 6 tabel inti:
--   user_profiles, master_stasiun, master_data_hujan,
--   calculations, embung_projects, audit_logs
--
-- Namun 3 TABEL KALKULASI MODUL masih terbuka lebar:
--   ⚠️  manning_calculations     → FOR ALL USING (true)  ← TIDAK AMAN
--   ⚠️  flood_calculations       → FOR ALL USING (true)  ← TIDAK AMAN
--   ⚠️  water_balance_calculations → FOR ALL USING (true)  ← TIDAK AMAN
--
-- Migration ini menutup celah keamanan tersebut dengan:
--   1. Menambahkan kolom user_id + updated_at
--   2. Menghapus policy FOR ALL USING (true)
--   3. Membuat policy user-owned CRUD (pola sama dengan calculations & embung)
--   4. Menambahkan B-Tree index untuk performa query
--   5. Memasang trigger updated_at + audit logging
--
-- ARSITEKTUR KEAMANAN (konsisten dengan tabel calculations & embung_projects):
--   SELECT  → User hanya melihat data MILIKNYA SENDIRI
--   INSERT  → User hanya menyimpan dengan user_id DIRINYA SENDIRI
--   UPDATE  → User hanya mengubah data MILIKNYA SENDIRI
--   DELETE  → User hanya menghapus data MILIKNYA SENDIRI
--   ADMIN   → Admin dapat melihat SEMUA data (audit & dukungan teknis)
--   ANON    → Hanya melihat data publik (pilot data, user_id IS NULL)
-- ============================================================================

BEGIN;

-- ============================================================================
-- BAGIAN 1: SKEMA — Tambahkan Kolom user_id & updated_at
-- ============================================================================

-- 1a. manning_calculations
ALTER TABLE public.manning_calculations
    ADD COLUMN IF NOT EXISTS user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- 1b. flood_calculations
ALTER TABLE public.flood_calculations
    ADD COLUMN IF NOT EXISTS user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- 1c. water_balance_calculations
ALTER TABLE public.water_balance_calculations
    ADD COLUMN IF NOT EXISTS user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();


-- ============================================================================
-- BAGIAN 2: TRIGGER — Auto-update kolom updated_at
-- ============================================================================
-- Menggunakan fungsi public.handle_updated_at() yang sudah dibuat di
-- migration konsolidasi 20260228080203.

DROP TRIGGER IF EXISTS trg_manning_calc_updated_at ON public.manning_calculations;
CREATE TRIGGER trg_manning_calc_updated_at
    BEFORE UPDATE ON public.manning_calculations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_flood_calc_updated_at ON public.flood_calculations;
CREATE TRIGGER trg_flood_calc_updated_at
    BEFORE UPDATE ON public.flood_calculations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_water_balance_calc_updated_at ON public.water_balance_calculations;
CREATE TRIGGER trg_water_balance_calc_updated_at
    BEFORE UPDATE ON public.water_balance_calculations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- BAGIAN 3: INDEX — B-Tree untuk Performa Query
-- ============================================================================

-- 3a. manning_calculations
CREATE INDEX IF NOT EXISTS idx_manning_calc_user_id
    ON public.manning_calculations (user_id);
CREATE INDEX IF NOT EXISTS idx_manning_calc_user_created
    ON public.manning_calculations (user_id, created_at DESC);

-- 3b. flood_calculations
CREATE INDEX IF NOT EXISTS idx_flood_calc_user_id
    ON public.flood_calculations (user_id);
CREATE INDEX IF NOT EXISTS idx_flood_calc_user_created
    ON public.flood_calculations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flood_calc_method
    ON public.flood_calculations (method);

-- 3c. water_balance_calculations
CREATE INDEX IF NOT EXISTS idx_water_balance_calc_user_id
    ON public.water_balance_calculations (user_id);
CREATE INDEX IF NOT EXISTS idx_water_balance_calc_user_created
    ON public.water_balance_calculations (user_id, created_at DESC);


-- ============================================================================
-- BAGIAN 4: RLS — Hapus Policy Lama yang TIDAK AMAN
-- ============================================================================

-- Pastikan RLS aktif (sudah diaktifkan di create-all-tables.sql,
-- tapi kita pastikan lagi untuk keamanan)
ALTER TABLE public.manning_calculations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flood_calculations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_balance_calculations    ENABLE ROW LEVEL SECURITY;

-- Hapus SEMUA policy lama yang terlalu permisif
DROP POLICY IF EXISTS "Allow all for manning"   ON public.manning_calculations;
DROP POLICY IF EXISTS "Allow all for flood"     ON public.flood_calculations;
DROP POLICY IF EXISTS "Allow all for water"     ON public.water_balance_calculations;

-- Hapus policy lama lainnya yang mungkin ada (dari migration sebelumnya)
DROP POLICY IF EXISTS "Enable all operations for anonymous users"     ON public.manning_calculations;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.manning_calculations;
DROP POLICY IF EXISTS "Enable all operations for anonymous users"     ON public.flood_calculations;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.flood_calculations;
DROP POLICY IF EXISTS "Enable all operations for anonymous users"     ON public.water_balance_calculations;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.water_balance_calculations;


-- ============================================================================
-- BAGIAN 5: RLS POLICIES — manning_calculations
-- ============================================================================

-- Policy: User hanya melihat kalkulasi Manning miliknya
CREATE POLICY "manning_select_own"
    ON public.manning_calculations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: User menyimpan dengan user_id dirinya sendiri
CREATE POLICY "manning_insert_own"
    ON public.manning_calculations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: User hanya mengupdate kalkulasi miliknya
CREATE POLICY "manning_update_own"
    ON public.manning_calculations FOR UPDATE
    TO authenticated
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: User hanya menghapus kalkulasi miliknya
CREATE POLICY "manning_delete_own"
    ON public.manning_calculations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Admin dapat melihat SEMUA kalkulasi Manning
CREATE POLICY "manning_admin_select_all"
    ON public.manning_calculations FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Policy: Data publik (pilot data, user_id IS NULL) untuk anon
CREATE POLICY "manning_anon_select_public"
    ON public.manning_calculations FOR SELECT
    TO anon
    USING (user_id IS NULL);


-- ============================================================================
-- BAGIAN 6: RLS POLICIES — flood_calculations
-- ============================================================================

-- Policy: User hanya melihat kalkulasi banjir miliknya
CREATE POLICY "flood_select_own"
    ON public.flood_calculations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: User menyimpan dengan user_id dirinya sendiri
CREATE POLICY "flood_insert_own"
    ON public.flood_calculations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: User hanya mengupdate kalkulasi miliknya
CREATE POLICY "flood_update_own"
    ON public.flood_calculations FOR UPDATE
    TO authenticated
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: User hanya menghapus kalkulasi miliknya
CREATE POLICY "flood_delete_own"
    ON public.flood_calculations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Admin dapat melihat SEMUA kalkulasi banjir
CREATE POLICY "flood_admin_select_all"
    ON public.flood_calculations FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Policy: Data publik (pilot data)
CREATE POLICY "flood_anon_select_public"
    ON public.flood_calculations FOR SELECT
    TO anon
    USING (user_id IS NULL);


-- ============================================================================
-- BAGIAN 7: RLS POLICIES — water_balance_calculations
-- ============================================================================

-- Policy: User hanya melihat kalkulasi neraca air miliknya
CREATE POLICY "water_balance_select_own"
    ON public.water_balance_calculations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: User menyimpan dengan user_id dirinya sendiri
CREATE POLICY "water_balance_insert_own"
    ON public.water_balance_calculations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: User hanya mengupdate kalkulasi miliknya
CREATE POLICY "water_balance_update_own"
    ON public.water_balance_calculations FOR UPDATE
    TO authenticated
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: User hanya menghapus kalkulasi miliknya
CREATE POLICY "water_balance_delete_own"
    ON public.water_balance_calculations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Admin dapat melihat SEMUA kalkulasi neraca air
CREATE POLICY "water_balance_admin_select_all"
    ON public.water_balance_calculations FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Policy: Data publik (pilot data)
CREATE POLICY "water_balance_anon_select_public"
    ON public.water_balance_calculations FOR SELECT
    TO anon
    USING (user_id IS NULL);


-- ============================================================================
-- BAGIAN 8: AUDIT TRIGGERS
-- ============================================================================
-- Menggunakan fungsi public.log_audit_event() dari migration konsolidasi.
-- Setiap INSERT/UPDATE/DELETE pada 3 tabel ini akan dicatat di audit_logs.

DROP TRIGGER IF EXISTS trg_audit_manning_calc ON public.manning_calculations;
CREATE TRIGGER trg_audit_manning_calc
    AFTER INSERT OR UPDATE OR DELETE ON public.manning_calculations
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS trg_audit_flood_calc ON public.flood_calculations;
CREATE TRIGGER trg_audit_flood_calc
    AFTER INSERT OR UPDATE OR DELETE ON public.flood_calculations
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS trg_audit_water_balance_calc ON public.water_balance_calculations;
CREATE TRIGGER trg_audit_water_balance_calc
    AFTER INSERT OR UPDATE OR DELETE ON public.water_balance_calculations
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();


-- ============================================================================
-- BAGIAN 9: UPDATE STATISTIK TABEL
-- ============================================================================

ANALYZE public.manning_calculations;
ANALYZE public.flood_calculations;
ANALYZE public.water_balance_calculations;

COMMIT;

-- ============================================================================
-- VERIFIKASI (Jalankan setelah migration berhasil)
-- ============================================================================

-- 1. Verifikasi RLS aktif pada semua tabel kalkulasi
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--       'manning_calculations',
--       'flood_calculations',
--       'water_balance_calculations'
--   );

-- 2. Verifikasi policy yang aktif
-- SELECT tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN (
--       'manning_calculations',
--       'flood_calculations',
--       'water_balance_calculations'
--   )
-- ORDER BY tablename, cmd;

-- 3. Verifikasi kolom user_id dan updated_at sudah ada
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN (
--       'manning_calculations',
--       'flood_calculations',
--       'water_balance_calculations'
--   )
--   AND column_name IN ('user_id', 'updated_at')
-- ORDER BY table_name, column_name;

-- 4. Verifikasi index yang dibuat
-- SELECT tablename, indexname
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN (
--       'manning_calculations',
--       'flood_calculations',
--       'water_balance_calculations'
--   )
-- ORDER BY tablename, indexname;

-- ============================================================================
-- AKHIR MIGRATION
-- ============================================================================
-- Ringkasan:
--
-- KEAMANAN:
--   [✓] Policy FOR ALL USING (true) dihapus dari 3 tabel
--   [✓] Kolom user_id (FK → auth.users) ditambahkan ke 3 tabel
--   [✓] Policy user-owned CRUD: SELECT/INSERT/UPDATE/DELETE hanya data sendiri
--   [✓] Policy admin SELECT ALL untuk audit & dukungan teknis
--   [✓] Policy anon SELECT untuk pilot data (user_id IS NULL)
--   [✓] Audit trail otomatis via log_audit_event()
--
-- PERFORMA:
--   [✓] B-Tree Index pada (user_id) untuk filter cepat per-user
--   [✓] B-Tree Compound Index pada (user_id, created_at DESC) untuk pagination
--   [✓] B-Tree Index pada flood_calculations(method) untuk filter metode
--   [✓] Trigger auto-update updated_at via handle_updated_at()
--   [✓] ANALYZE dijalankan untuk optimasi query planner
--
-- CATATAN FRONTEND:
--   Setelah migration ini aktif, service calculationService.ts HARUS
--   mengirimkan user_id saat INSERT. Jika tidak, data akan tersimpan
--   dengan user_id = NULL (dianggap data publik/pilot).
-- ============================================================================
