# 🔧 Quick Fix: IMMUTABLE Function Error

**Error**: `ERROR: 42P17: functions in index predicate must be marked IMMUTABLE`

**Cause**: PostgreSQL partial indexes require IMMUTABLE functions in WHERE clause. `CURRENT_DATE` is STABLE, not IMMUTABLE.

---

## ✅ Solution Applied

**File**: `supabase/migrations/20260226_performance_optimization.sql`

**Changed**:
```sql
-- BEFORE (Error)
WHERE tanggal >= CURRENT_DATE - INTERVAL '5 years'

-- AFTER (Fixed)
WHERE tanggal >= '2020-01-01'::date
```

---

## 🚀 Run Migration Again

1. Open Supabase SQL Editor
2. Copy entire `20260226_performance_optimization.sql`
3. Click **Run**
4. **Expected**: All indexes created successfully ✅

---

## 📊 Index Maintenance

The partial index uses fixed date `'2020-01-01'`. Update yearly:

```sql
-- Run this in January 2026
DROP INDEX IF EXISTS idx_master_data_hujan_recent;
CREATE INDEX idx_master_data_hujan_recent 
ON public.master_data_hujan (stasiun_id, tanggal DESC)
WHERE tanggal >= '2021-01-01'::date;
```

**Frequency**: Once per year (low maintenance)

---

## ✅ Verification

After migration:

```sql
-- Check all indexes created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'master_data_hujan';

-- Expected output:
-- idx_master_data_hujan_compound_primary
-- idx_master_data_hujan_compound_reverse
-- idx_master_data_hujan_stasiun_covering
-- idx_master_data_hujan_recent
-- idx_master_stasiun_nama_trgm
```

---

**Status**: ✅ Fixed - Ready to run
