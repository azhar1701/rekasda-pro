# Troubleshooting Supabase "Save Failed" Error

## Langkah-langkah Perbaikan

### 1. Periksa Environment Variables
Pastikan file `.env.local` berisi:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Jalankan SQL Script untuk Memperbaiki RLS Policy
Di Supabase SQL Editor, jalankan script `database/fix-rls-policy.sql`:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON calculations;
DROP POLICY IF EXISTS "Allow all operations for everyone" ON calculations;
DROP POLICY IF EXISTS "Allow all operations" ON calculations;

-- Create new policy that allows anonymous access
CREATE POLICY "Enable all operations for anonymous users" ON calculations
  FOR ALL 
  TO anon
  USING (true)
  WITH CHECK (true);
```

### 3. Verifikasi Struktur Tabel
Pastikan tabel `calculations` memiliki struktur yang benar:

```sql
-- Check table structure
\d calculations;

-- Should have these columns:
-- id (UUID, PRIMARY KEY)
-- site_name (TEXT, NOT NULL)
-- calculation_type (TEXT, CHECK constraint)
-- input_data (JSONB, NOT NULL)
-- result_data (JSONB, NOT NULL)
-- location (JSONB, nullable)
-- photo_url (TEXT, nullable)
-- notes (TEXT, nullable)
-- created_at (TIMESTAMP WITH TIME ZONE)
-- updated_at (TIMESTAMP WITH TIME ZONE)
```

### 4. Debug di Browser Console
Buka Developer Tools (F12) dan jalankan:

```javascript
// Test full diagnostic
await debugSupabase.runFullDiagnostic()

// Test individual components
await debugSupabase.checkEnvironment()
await debugSupabase.testBasicConnection()
await debugSupabase.testInsertPermissions()
```

### 5. Common Error Messages dan Solusi

#### "relation 'calculations' does not exist"
- Tabel belum dibuat
- Jalankan `database/schema.sql` di Supabase SQL Editor

#### "permission denied for table calculations"
- RLS policy tidak mengizinkan akses anonymous
- Jalankan `database/fix-rls-policy.sql`

#### "new row violates check constraint"
- Data tidak sesuai dengan constraint
- Pastikan `calculation_type` adalah 'manning' atau 'rational'

#### "invalid input syntax for type json"
- Data JSON tidak valid
- Periksa format `input_data` dan `result_data`

### 6. Restart Development Server
Setelah mengubah environment variables:
```bash
npm run dev
```

### 7. Verifikasi di Supabase Dashboard
1. Buka Supabase Dashboard
2. Go to Table Editor
3. Periksa tabel `calculations` ada dan bisa diakses
4. Go to Authentication > Policies
5. Pastikan policy untuk tabel `calculations` mengizinkan operasi anonymous

## Testing
Setelah perbaikan, status database di aplikasi harus menunjukkan:
- 🟢 "All tests passed" (hijau) = Berhasil
- 🔴 "Test failed: [error message]" (merah) = Masih ada masalah
- 🟡 "Testing..." (kuning) = Sedang testing

## Debug Console Output
Periksa browser console untuk log detail:
- Environment check results
- Connection test results  
- Insert permission test results
- Detailed error messages dengan hint dan code