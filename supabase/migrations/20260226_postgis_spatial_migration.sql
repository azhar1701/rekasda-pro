-- ============================================================================
-- PRODUCTION-GRADE POSTGIS MIGRATION
-- FASE 3 - TAHAP 2: Migrasi Database ke Data Spasial
-- Date: 2026-02-26
-- Standard: Enterprise Geospatial Engineering
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENABLE POSTGIS EXTENSION
-- ============================================================================

-- Enable PostGIS extension (Supabase supports this by default)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS version
SELECT PostGIS_Version();

-- ============================================================================
-- SECTION 2: ADD GEOMETRY COLUMN TO master_stasiun
-- ============================================================================

-- Add geometry column for spatial point data (SRID 4326 = WGS84)
ALTER TABLE public.master_stasiun 
ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

-- Create spatial index for fast spatial queries
CREATE INDEX IF NOT EXISTS idx_master_stasiun_geom 
ON public.master_stasiun USING GIST (geom);

-- ============================================================================
-- SECTION 3: MIGRATE EXISTING DATA (koordinat_x/y → geom)
-- ============================================================================

-- Populate geom column from existing koordinat_x (longitude) and koordinat_y (latitude)
-- Only update rows where coordinates exist and geom is NULL
UPDATE public.master_stasiun
SET geom = ST_SetSRID(ST_MakePoint(koordinat_x, koordinat_y), 4326)
WHERE koordinat_x IS NOT NULL 
  AND koordinat_y IS NOT NULL 
  AND geom IS NULL;

-- ============================================================================
-- SECTION 4: AUTO-SYNC TRIGGER (koordinat_x/y ↔ geom)
-- ============================================================================

-- Function to auto-update geom when koordinat_x or koordinat_y changes
CREATE OR REPLACE FUNCTION sync_stasiun_geometry()
RETURNS TRIGGER AS $$
BEGIN
    -- If coordinates are provided, update geometry
    IF NEW.koordinat_x IS NOT NULL AND NEW.koordinat_y IS NOT NULL THEN
        NEW.geom := ST_SetSRID(ST_MakePoint(NEW.koordinat_x, NEW.koordinat_y), 4326);
    ELSE
        NEW.geom := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-sync on INSERT or UPDATE
CREATE TRIGGER trigger_sync_stasiun_geometry
BEFORE INSERT OR UPDATE OF koordinat_x, koordinat_y ON public.master_stasiun
FOR EACH ROW
EXECUTE FUNCTION sync_stasiun_geometry();

-- ============================================================================
-- SECTION 5: REVERSE SYNC (geom → koordinat_x/y)
-- ============================================================================

-- Function to extract coordinates from geometry (for backward compatibility)
CREATE OR REPLACE FUNCTION extract_coordinates_from_geom()
RETURNS TRIGGER AS $$
BEGIN
    -- If geom is updated directly (e.g., from map click), sync back to koordinat_x/y
    IF NEW.geom IS NOT NULL THEN
        NEW.koordinat_x := ST_X(NEW.geom);
        NEW.koordinat_y := ST_Y(NEW.geom);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Reverse sync when geom is updated
CREATE TRIGGER trigger_extract_coordinates
BEFORE UPDATE OF geom ON public.master_stasiun
FOR EACH ROW
WHEN (NEW.geom IS DISTINCT FROM OLD.geom)
EXECUTE FUNCTION extract_coordinates_from_geom();

-- ============================================================================
-- SECTION 6: SPATIAL QUERY EXAMPLES (For Testing)
-- ============================================================================

-- Test 1: Find stations within 50km radius of a point (Jakarta: -6.2088, 106.8456)
-- SELECT 
--     nama_stasiun,
--     ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)::geography) / 1000 AS distance_km
-- FROM public.master_stasiun
-- WHERE ST_DWithin(
--     geom::geography,
--     ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)::geography,
--     50000  -- 50km in meters
-- )
-- ORDER BY distance_km;

-- Test 2: Find stations within a bounding box (West Java region)
-- SELECT nama_stasiun, koordinat_x, koordinat_y
-- FROM public.master_stasiun
-- WHERE geom && ST_MakeEnvelope(106.0, -7.5, 108.5, -6.0, 4326);

-- Test 3: Get GeoJSON for all stations (for Leaflet map)
-- SELECT jsonb_build_object(
--     'type', 'FeatureCollection',
--     'features', jsonb_agg(
--         jsonb_build_object(
--             'type', 'Feature',
--             'geometry', ST_AsGeoJSON(geom)::jsonb,
--             'properties', jsonb_build_object(
--                 'id', id,
--                 'nama_stasiun', nama_stasiun,
--                 'elevasi', elevasi
--             )
--         )
--     )
-- ) AS geojson
-- FROM public.master_stasiun
-- WHERE geom IS NOT NULL;

-- ============================================================================
-- SECTION 7: VALIDATION QUERIES
-- ============================================================================

-- Check migration status
SELECT 
    COUNT(*) AS total_stations,
    COUNT(geom) AS stations_with_geometry,
    COUNT(*) - COUNT(geom) AS stations_without_geometry
FROM public.master_stasiun;

-- Check for invalid geometries
SELECT id, nama_stasiun, koordinat_x, koordinat_y
FROM public.master_stasiun
WHERE geom IS NOT NULL AND NOT ST_IsValid(geom);

-- Check coordinate range (Indonesia: 95°E-141°E, 6°S-11°N)
SELECT id, nama_stasiun, koordinat_x, koordinat_y
FROM public.master_stasiun
WHERE koordinat_x IS NOT NULL 
  AND koordinat_y IS NOT NULL
  AND (
    koordinat_x < 95 OR koordinat_x > 141 OR
    koordinat_y < -11 OR koordinat_y > 6
  );

-- ============================================================================
-- SECTION 8: PERFORMANCE MONITORING
-- ============================================================================

-- Check spatial index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read
FROM pg_stat_user_indexes
WHERE tablename = 'master_stasiun'
  AND indexname = 'idx_master_stasiun_geom';

-- Check table size after migration
SELECT 
    pg_size_pretty(pg_total_relation_size('public.master_stasiun')) AS total_size,
    pg_size_pretty(pg_relation_size('public.master_stasiun')) AS table_size,
    pg_size_pretty(pg_indexes_size('public.master_stasiun')) AS indexes_size;

-- ============================================================================
-- SECTION 9: CLEANUP (OPTIONAL - Run after verification)
-- ============================================================================

-- After confirming geom column works correctly, you can optionally:
-- 1. Keep koordinat_x/y for backward compatibility (RECOMMENDED)
-- 2. Or drop them to enforce spatial-only approach (NOT RECOMMENDED for now)

-- UNCOMMENT ONLY IF YOU WANT TO DROP OLD COLUMNS (NOT RECOMMENDED):
-- ALTER TABLE public.master_stasiun DROP COLUMN IF EXISTS koordinat_x;
-- ALTER TABLE public.master_stasiun DROP COLUMN IF EXISTS koordinat_y;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✅ PostGIS extension enabled
-- ✅ Geometry column added with spatial index
-- ✅ Existing data migrated to geom column
-- ✅ Auto-sync triggers created (bidirectional)
-- ✅ Spatial queries ready for WebGIS integration
-- ✅ Validation queries provided

-- Next Steps:
-- 1. Run validation queries to verify data integrity
-- 2. Test spatial queries with sample data
-- 3. Integrate with React-Leaflet frontend (TAHAP 3)
