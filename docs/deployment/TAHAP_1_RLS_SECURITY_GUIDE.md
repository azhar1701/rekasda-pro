# 🔒 TAHAP 1: Panduan Eksekusi RLS Security Configuration

## 📋 Ringkasan
Script SQL ini mengamankan database RekaSDA Pro dengan Row Level Security (RLS) standar Enterprise.

---

## 🎯 Apa yang Dilakukan Script Ini?

### 1. **User Profiles & Role Management**
- Membuat tabel `user_profiles` dengan role: `user`, `admin`, `engineer`
- Users hanya bisa lihat/edit profil sendiri
- Role tidak bisa diubah sendiri (anti privilege escalation)

### 2. **Calculations Table (User-Owned Data)**
- ✅ **SELECT**: User hanya bisa lihat kalkulasi miliknya
- ✅ **INSERT**: User hanya bisa insert dengan `user_id` sendiri
- ✅ **UPDATE**: User hanya bisa update kalkulasi miliknya
- ✅ **DELETE**: User hanya bisa hapus kalkulasi miliknya
- ✅ **Public Data**: Anonymous user bisa lihat pilot data (`user_id IS NULL`)

### 3. **Master Data (Read-Only for Users)**
Tabel: `master_stasiun`, `master_data_hujan`, `parameter_das`
- ✅ **SELECT**: Semua authenticated user bisa READ
- ❌ **INSERT/UPDATE/DELETE**: HANYA admin yang bisa WRITE

### 4. **Audit Logging (Optional)**
- Mencatat semua operasi INSERT/UPDATE/DELETE
- Hanya admin yang bisa akses audit logs

### 5. **Helper Functions**
- `is_admin()`: Cek apakah user adalah admin
- `get_user_role()`: Ambil role user saat ini

---

## 🚀 Cara Menjalankan di Supabase

### **Metode 1: SQL Editor (Recommended)**

1. **Login ke Supabase Dashboard**
   - Buka: https://supabase.com/dashboard
   - Pilih project RekaSDA Pro

2. **Buka SQL Editor**
   - Sidebar kiri → **SQL Editor**
   - Klik **New Query**

3. **Copy-Paste Script**
   - Buka file: `supabase/migrations/20260226_production_rls_security.sql`
   - Copy seluruh isi file
   - Paste ke SQL Editor

4. **Execute**
   - Klik tombol **Run** (atau tekan `Ctrl+Enter`)
   - Tunggu hingga muncul "Success. No rows returned"

5. **Verifikasi**
   ```sql
   -- Cek RLS sudah aktif
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   
   -- Cek policies yang terpasang
   SELECT tablename, policyname, cmd 
   FROM pg_policies 
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```

---

### **Metode 2: Supabase CLI (Advanced)**

```bash
# Pastikan Supabase CLI sudah terinstall
supabase --version

# Login
supabase login

# Link ke project
supabase link --project-ref your-project-ref

# Apply migration
supabase db push

# Atau run langsung
supabase db execute -f supabase/migrations/20260226_production_rls_security.sql
```

---

## 🧪 Testing RLS (Wajib Dilakukan!)

### **Test 1: Cek RLS Status**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('calculations', 'master_stasiun', 'master_data_hujan');
```
**Expected**: Semua tabel harus `rowsecurity = true`

---

### **Test 2: Cek Policies**
```sql
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
**Expected**: Minimal 4 policies per tabel (SELECT, INSERT, UPDATE, DELETE)

---

### **Test 3: Simulasi User Access**

#### **Sebagai User Biasa:**
```sql
-- Set role sebagai authenticated user (bukan admin)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "test-user-uuid"}';

-- Test: User bisa lihat data sendiri
SELECT * FROM calculations WHERE user_id = 'test-user-uuid';

-- Test: User TIDAK bisa lihat data orang lain
SELECT * FROM calculations WHERE user_id != 'test-user-uuid';
-- Expected: 0 rows

-- Test: User bisa lihat master data
SELECT * FROM master_stasiun LIMIT 5;
-- Expected: Success

-- Test: User TIDAK bisa insert ke master data
INSERT INTO master_stasiun (nama_stasiun) VALUES ('Test');
-- Expected: ERROR - new row violates row-level security policy
```

#### **Sebagai Admin:**
```sql
-- Set role sebagai admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "admin-user-uuid"}';

-- Pastikan user ini ada di user_profiles dengan role = 'admin'
INSERT INTO user_profiles (id, role) VALUES ('admin-user-uuid', 'admin');

-- Test: Admin bisa insert ke master data
INSERT INTO master_stasiun (nama_stasiun) VALUES ('Test Admin');
-- Expected: Success
```

---

## 🔧 Setup Initial Admin User

Setelah migration, buat admin pertama:

```sql
-- Ganti dengan UUID user pertama Anda (dari auth.users)
INSERT INTO public.user_profiles (id, email, full_name, role, organization)
VALUES (
    'your-user-uuid-from-auth-users',
    'admin@rekasda.pro',
    'Administrator',
    'admin',
    'PUPR'
);
```

**Cara dapat UUID:**
```sql
SELECT id, email FROM auth.users LIMIT 5;
```

---

## ⚠️ Troubleshooting

### **Error: "new row violates row-level security policy"**
**Penyebab**: User tidak punya permission untuk operasi tersebut.

**Solusi**:
1. Cek role user:
   ```sql
   SELECT * FROM user_profiles WHERE id = auth.uid();
   ```
2. Pastikan policy sudah terpasang:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'nama_tabel';
   ```

---

### **Error: "function auth.uid() does not exist"**
**Penyebab**: Supabase Auth extension belum aktif.

**Solusi**:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Auth extension biasanya sudah aktif by default di Supabase
```

---

### **Error: "relation 'user_profiles' does not exist"**
**Penyebab**: Script belum dijalankan atau gagal.

**Solusi**:
1. Jalankan ulang script dari awal
2. Cek error log di SQL Editor

---

## ✅ Checklist Setelah Eksekusi

- [ ] Script berhasil dijalankan tanpa error
- [ ] RLS aktif di semua tabel (`rowsecurity = true`)
- [ ] Minimal 4 policies per tabel terpasang
- [ ] Tabel `user_profiles` sudah ada
- [ ] Admin pertama sudah dibuat
- [ ] Test user access berhasil (user tidak bisa akses data orang lain)
- [ ] Test admin access berhasil (admin bisa insert/update master data)

---

## 📊 Expected Output

Setelah script berhasil, struktur keamanan Anda:

```
┌─────────────────────┬──────────────┬─────────────────┐
│ Table               │ User (READ)  │ Admin (WRITE)   │
├─────────────────────┼──────────────┼─────────────────┤
│ calculations        │ Own data     │ Own data        │
│ master_stasiun      │ ✅ All       │ ✅ All          │
│ master_data_hujan   │ ✅ All       │ ✅ All          │
│ parameter_das       │ ✅ All       │ ✅ All          │
│ user_profiles       │ Own profile  │ Own profile     │
│ audit_logs          │ ❌ None      │ ✅ All          │
└─────────────────────┴──────────────┴─────────────────┘
```

---

## 🎯 Next Steps

Setelah TAHAP 1 selesai, konfirmasi dengan:

```
✅ TAHAP 1 SELESAI - RLS Security Configuration berhasil diterapkan
```

Kemudian kita lanjut ke:
- **TAHAP 2**: Core Math Engine Unit Testing (Vitest)
- **TAHAP 3**: Global Error Boundary Integration

---

## 📞 Support

Jika ada error atau pertanyaan:
1. Screenshot error message
2. Copy query yang dijalankan
3. Cek Supabase logs: Dashboard → Logs → Postgres Logs
