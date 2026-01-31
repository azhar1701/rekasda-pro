# Tahap Pelaksanaan Integrasi Supabase

## 1. Setup Supabase Project
1. Buat akun di https://supabase.com
2. Create new project
3. Catat URL dan anon key dari Settings > API

## 2. Database Setup
### Untuk Database Baru:
1. Buka SQL Editor di Supabase Dashboard
2. Copy paste isi file `schema.sql`
3. Run query untuk membuat tabel dan index

### Untuk Database Existing:
1. Gunakan file `migration.sql` untuk update struktur
2. Run migration script di SQL Editor

## 3. Environment Configuration
1. Copy `.env.example` ke `.env.local`
2. Isi variabel:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Testing Connection
1. Run aplikasi: `npm run dev`
2. Cek console untuk pesan koneksi
3. Test save calculation untuk verifikasi
4. Data akan otomatis sync dengan Supabase

## 5. Features Terintegrasi
- ✅ Input data Manning Calculator → Supabase
- ✅ Input data Rational Calculator → Supabase  
- ✅ Manual entry modal → Supabase
- ✅ Pilot data generation → Supabase
- ✅ History list dari Supabase
- ✅ Delete operations → Supabase
- ✅ Metadata: location, photos, notes
- ✅ Fallback ke localStorage jika offline

## 6. Production Deployment
1. Set environment variables di hosting platform
2. Pastikan RLS policy sesuai kebutuhan security
3. Monitor usage di Supabase Dashboard
4. Setup backup policy untuk data penting

## Troubleshooting
- Jika error CORS: cek domain di Supabase Settings
- Jika RLS error: adjust policy di `schema.sql`
- Jika connection timeout: cek network/firewall
- Jika data tidak sync: cek console untuk error messages