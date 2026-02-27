-- ============================================================================
-- PRODUCTION-GRADE DATABASE OPTIMIZATION
-- FASE 2 - TAHAP 1: Performa & Stabilitas Akses Data
-- Date: 2026-02-26
-- Standard: Enterprise Performance Engineering
-- ============================================================================

-- ============================================================================
-- SECTION 1: PERFORMANCE BASELINE (Before Optimization)
-- ============================================================================

-- Test Query 1: Fetch rainfall data for specific station and date range
-- This simulates typical user query pattern
EXPLAIN ANALYZE
SELECT 
    mh.tanggal,
    mh.curah_hujan,
    ms.nama_stasiun
FROM public.master_data_hujan mh
JOIN public.master_stasiun ms ON mh.stasiun_id = ms.id
WHERE mh.stasiun_id = (SELECT id FROM public.master_stasiun LIMIT 1)
  AND mh.tanggal BETWEEN '2020-01-01' AND '2023-12-31'
ORDER BY mh.tanggal DESC;

-- Expected: Sequential Scan or Index Scan (slow for large datasets)
-- Note: Save execution time for comparison

-- ============================================================================
-- SECTION 2: ADVANCED COMPOUND INDEXES (B-Tree)
-- ============================================================================

-- Drop existing basic indexes (will be replaced with optimized versions)
DROP INDEX IF EXISTS public.idx_data_hujan_stasiun_id;
DROP INDEX IF EXISTS public.idx_data_hujan_tanggal;
DROP INDEX IF EXISTS public.idx_data_hujan_stasiun_tanggal;

-- 1. PRIMARY COMPOUND INDEX: Station + Date (Most Common Query Pattern)
-- This covers: WHERE stasiun_id = X AND tanggal BETWEEN Y AND Z
CREATE INDEX idx_master_data_hujan_compound_primary 
ON public.master_data_hujan (stasiun_id, tanggal DESC)
INCLUDE (curah_hujan);

-- Benefits:
-- - Covers station filtering + date range queries
-- - DESC order optimizes ORDER BY tanggal DESC
-- - INCLUDE clause adds curah_hujan for index-only scans (no table lookup)

-- 2. REVERSE COMPOUND INDEX: Date + Station (For Time-Series Analysis)
-- This covers: WHERE tanggal BETWEEN Y AND Z (across all stations)
CREATE INDEX idx_master_data_hujan_compound_reverse 
ON public.master_data_hujan (tanggal DESC, stasiun_id)
INCLUDE (curah_hujan);

-- Benefits:
-- - Optimizes queries filtering by date first
-- - Useful for monthly/yearly aggregations across stations

-- 3. COVERING INDEX: Station Only (For Station-Level Aggregations)
CREATE INDEX idx_master_data_hujan_stasiun_covering 
ON public.master_data_hujan (stasiun_id)
INCLUDE (tanggal, curah_hujan);

-- Benefits:
-- - Fast station-level statistics (AVG, SUM, COUNT)
-- - Index-only scan without table access

-- 4. PARTIAL INDEX: Recent Data (Last 5 Years)
-- Most queries focus on recent data, so optimize for it
-- Note: Using fixed date instead of CURRENT_DATE for IMMUTABLE requirement
CREATE INDEX idx_master_data_hujan_recent 
ON public.master_data_hujan (stasiun_id, tanggal DESC)
WHERE tanggal >= '2020-01-01'::date;

-- Alternative: If you need dynamic date, recreate index periodically (e.g., yearly)
-- DROP INDEX IF EXISTS idx_master_data_hujan_recent;
-- CREATE INDEX idx_master_data_hujan_recent ON public.master_data_hujan (stasiun_id, tanggal DESC)
-- WHERE tanggal >= '2025-01-01'::date;

-- Benefits:
-- - Smaller index size (faster scans)
-- - Optimized for most common use case (recent data)

-- ============================================================================
-- SECTION 3: MASTER_STASIUN OPTIMIZATION
-- ============================================================================

-- Enable pg_trgm extension FIRST (required for text search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Spatial Index for Location-Based Queries (if using PostGIS)
-- Uncomment if you need to query "stations near me"
-- CREATE INDEX idx_master_stasiun_location 
-- ON public.master_stasiun USING GIST (
--     ST_MakePoint(koordinat_x, koordinat_y)
-- );

-- 2. Text Search Index for Station Name (Fast Autocomplete)
CREATE INDEX idx_master_stasiun_nama_trgm 
ON public.master_stasiun USING GIN (nama_stasiun gin_trgm_ops);

-- Benefits:
-- - Fast fuzzy search: WHERE nama_stasiun ILIKE '%keyword%'
-- - Autocomplete with <-> similarity operator

-- ============================================================================
-- SECTION 4: TABLE STATISTICS UPDATE
-- ============================================================================

-- Update table statistics for query planner optimization
ANALYZE public.master_data_hujan;
ANALYZE public.master_stasiun;

-- ============================================================================
-- SECTION 5: PERFORMANCE VERIFICATION (After Optimization)
-- ============================================================================

-- Test Query 1: Same query as baseline (should be MUCH faster)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
    mh.tanggal,
    mh.curah_hujan,
    ms.nama_stasiun
FROM public.master_data_hujan mh
JOIN public.master_stasiun ms ON mh.stasiun_id = ms.id
WHERE mh.stasiun_id = (SELECT id FROM public.master_stasiun LIMIT 1)
  AND mh.tanggal BETWEEN '2020-01-01' AND '2023-12-31'
ORDER BY mh.tanggal DESC;

-- Expected: Index Scan using idx_master_data_hujan_compound_primary
-- Expected Speedup: 10-100x faster (depending on data size)

-- Test Query 2: Aggregation across all stations for a month
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    DATE_TRUNC('month', tanggal) AS bulan,
    AVG(curah_hujan) AS rata_rata,
    MAX(curah_hujan) AS maksimum,
    COUNT(*) AS jumlah_data
FROM public.master_data_hujan
WHERE tanggal BETWEEN '2023-01-01' AND '2023-12-31'
GROUP BY DATE_TRUNC('month', tanggal)
ORDER BY bulan;

-- Expected: Index Scan using idx_master_data_hujan_compound_reverse

-- Test Query 3: Station name search (autocomplete)
EXPLAIN ANALYZE
SELECT id, nama_stasiun
FROM public.master_stasiun
WHERE nama_stasiun ILIKE '%ciliwung%'
LIMIT 10;

-- Expected: Bitmap Index Scan using idx_master_stasiun_nama_trgm

-- ============================================================================
-- SECTION 6: INDEX MAINTENANCE QUERIES
-- ============================================================================

-- Check index sizes
SELECT
    i.schemaname,
    i.relname as tablename,
    i.indexrelname as indexname,
    pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size
FROM pg_stat_user_indexes i
WHERE i.schemaname = 'public'
  AND i.relname IN ('master_data_hujan', 'master_stasiun')
ORDER BY pg_relation_size(i.indexrelid) DESC;

-- Check index usage statistics
SELECT
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname IN ('master_data_hujan', 'master_stasiun')
ORDER BY idx_scan DESC;

-- Check for unused indexes (run after 1 week in production)
SELECT
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname IN ('master_data_hujan', 'master_stasiun')
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- SECTION 7: QUERY OPTIMIZATION TIPS
-- ============================================================================

-- TIP 1: Always filter by stasiun_id first, then tanggal
-- GOOD:
-- SELECT * FROM master_data_hujan 
-- WHERE stasiun_id = 'xxx' AND tanggal BETWEEN 'a' AND 'b';

-- TIP 2: Use LIMIT for pagination
-- SELECT * FROM master_data_hujan 
-- WHERE stasiun_id = 'xxx' 
-- ORDER BY tanggal DESC 
-- LIMIT 100 OFFSET 0;

-- TIP 3: Avoid SELECT * in production queries
-- Use specific columns to enable index-only scans

-- TIP 4: Use prepared statements to cache query plans
-- PREPARE get_rainfall AS 
-- SELECT tanggal, curah_hujan FROM master_data_hujan 
-- WHERE stasiun_id = $1 AND tanggal BETWEEN $2 AND $3;

-- ============================================================================
-- SECTION 8: MONITORING QUERIES (Run Periodically)
-- ============================================================================

-- Check table bloat (run monthly)
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('master_data_hujan', 'master_stasiun');

-- Check slow queries (requires pg_stat_statements extension)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- SELECT 
--     query,
--     calls,
--     total_exec_time,
--     mean_exec_time,
--     max_exec_time
-- FROM pg_stat_statements
-- WHERE query LIKE '%master_data_hujan%'
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- ============================================================================
-- VERIFICATION CHECKLIST
-- ============================================================================

-- [ ] Run baseline EXPLAIN ANALYZE (save execution time)
-- [ ] Execute all CREATE INDEX statements
-- [ ] Run ANALYZE on both tables
-- [ ] Run verification EXPLAIN ANALYZE (compare execution time)
-- [ ] Verify index usage with pg_stat_user_indexes
-- [ ] Check index sizes (should be reasonable)
-- [ ] Test application queries (should be faster)
-- [ ] Monitor for 1 week, check for unused indexes

-- ============================================================================
-- EXPECTED PERFORMANCE IMPROVEMENTS
-- ============================================================================

-- Query Type                    | Before    | After     | Speedup
-- ------------------------------|-----------|-----------|----------
-- Single station date range     | 500ms     | 5ms       | 100x
-- Multi-station aggregation     | 2000ms    | 50ms      | 40x
-- Station name search           | 100ms     | 2ms       | 50x
-- Recent data (last year)       | 300ms     | 3ms       | 100x

-- ============================================================================
-- END OF OPTIMIZATION SCRIPT
-- ============================================================================
