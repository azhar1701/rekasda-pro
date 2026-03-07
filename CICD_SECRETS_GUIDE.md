# 🔐 CI/CD Secrets Configuration Guide — RekaSDA Pro

Panduan ini menjelaskan semua **GitHub Secrets** yang wajib dikonfigurasi agar pipeline CI/CD berjalan dengan benar.

**Lokasi**: Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

---

## 1. 🐳 Docker Credentials

Digunakan oleh job **Build & Push** untuk login dan mendorong image ke Docker Hub.

| Secret Name | Deskripsi | Contoh Nilai |
|---|---|---|
| `DOCKER_USERNAME` | Username akun Docker Hub | `johndoe` |
| `DOCKER_PASSWORD` | Password atau **Access Token** Docker Hub | `dckr_pat_xxxxxxxxxxxx` |

> [!TIP]
> Gunakan [Docker Hub Access Token](https://hub.docker.com/settings/security) sebagai pengganti password untuk keamanan yang lebih baik. Buat token dengan scope **Read & Write**.

---

## 2. 🖥️ Server Credentials (SSH)

Digunakan oleh job **Deploy** untuk melakukan koneksi SSH ke VPS produksi.

| Secret Name | Deskripsi | Contoh Nilai |
|---|---|---|
| `HOST` | IP address atau hostname VPS | `203.0.113.50` |
| `USERNAME` | User SSH di VPS | `deploy` atau `root` |
| `SSH_PORT` | Port SSH (default: 22) | `22` |
| `SSH_PRIVATE_KEY` | **Private key** SSH (format PEM, termasuk header/footer) | Lihat instruksi di bawah |

### 📋 Cara Mendapatkan SSH Private Key

```bash
# Di mesin lokal, generate key pair (jika belum ada)
ssh-keygen -t ed25519 -C "github-actions-deploy"

# Salin PUBLIC key ke VPS
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-vps-ip

# Salin PRIVATE key — ini yang dimasukkan ke GitHub Secrets
cat ~/.ssh/id_ed25519
```

> [!CAUTION]
> Salin **seluruh** isi private key termasuk baris `-----BEGIN OPENSSH PRIVATE KEY-----` dan `-----END OPENSSH PRIVATE KEY-----`. Jangan ada spasi atau baris kosong tambahan.

---

## 3. 🔗 App Environment Variables (Supabase & AI)

Digunakan sebagai **Docker build arguments** saat merakit image. Vite meng-embed variabel `VITE_*` ke dalam aset statis pada saat build.

| Secret Name | Deskripsi | Contoh Nilai |
|---|---|---|
| `VITE_SUPABASE_URL` | URL project Supabase | `https://abcdef.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key Supabase | `eyJhbGciOiJI...` |

> [!WARNING]
> Pastikan nilai-nilai ini adalah kredensial **produksi**, bukan development/staging. Image yang di-build akan langsung di-deploy ke server produksi.

---

## ✅ Checklist Verifikasi

Sebelum melakukan push pertama ke branch `main`, pastikan semua 8 secrets sudah terkonfigurasi:

- [ ] `DOCKER_USERNAME`
- [ ] `DOCKER_PASSWORD`
- [ ] `HOST`
- [ ] `USERNAME`
- [ ] `SSH_PORT`
- [ ] `SSH_PRIVATE_KEY`
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`

---

## 🏗️ Persiapan VPS (One-Time Setup)

Sebelum pipeline pertama berjalan, pastikan VPS sudah disiapkan:

```bash
# 1. Buat direktori aplikasi
sudo mkdir -p /opt/rekasda
cd /opt/rekasda

# 2. Salin file docker-compose.prod.yml ke VPS
# (via scp, git clone, atau copy manual)
scp docker-compose.prod.yml user@your-vps:/opt/rekasda/

# 3. Pastikan Docker dan Docker Compose terinstall
docker --version
docker compose version

# 4. Login ke Docker Hub di VPS (opsional, jika image private)
docker login -u your-dockerhub-username
```
