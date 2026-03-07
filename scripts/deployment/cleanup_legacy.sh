#!/bin/bash

# ==============================================================================
# SCRIPT PEMBERSIHAN BACKEND LAMA & DEPLOYMENT PREP (SAFE CLEANUP SCRIPT)
# ==============================================================================
# Skrip ini akan:
# 1. Membuat backup (tar.gz) dari folder backend lama.
# 2. Menghapus folder backend/Sisa kode lama secara permanen.
# 3. Menonaktifkan service systemd (jika ada) untuk backend lama.
#
# HARAP BERJAGA-JAGA saat menjalankan script ini di Production.

# Konfigurasi Direktori
OLD_BACKEND_DIR="/var/www/rekasda-lama"   # Sesuaikan dengan direktori backend lama
BACKUP_ARCHIVE_DIR="/var/backups/rekasda" # Tempat menyimpan backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SERVICE_NAME_OLD="rekasda-node.service"   # Nama file service backend lama (jika ada)

echo "Memulai proses pembersihan backend lama..."

# 1. Pastikan direktori backup tersedia
mkdir -p "$BACKUP_ARCHIVE_DIR"

# 2. Backup Kode Lama
if [ -d "$OLD_BACKEND_DIR" ]; then
    echo "📦 Membuat backup berbentuk .tar.gz dari $OLD_BACKEND_DIR..."
    tar -czf "$BACKUP_ARCHIVE_DIR/rekasda_legacy_backup_$TIMESTAMP.tar.gz" -C $(dirname "$OLD_BACKEND_DIR") $(basename "$OLD_BACKEND_DIR")
    echo "✅ Backup berhasil disimpan di: $BACKUP_ARCHIVE_DIR/rekasda_legacy_backup_$TIMESTAMP.tar.gz"
else
    echo "⚠️ Folder backend lama ($OLD_BACKEND_DIR) tidak ditemukan. Melanjutkan tindakan berikutnya."
fi

# 3. Membuang Perkhidmatan / Service Lama dari systemd (Jika menggunakan systemd)
echo "🛑 Mencari dan menghentikan service backend lama ($SERVICE_NAME_OLD)..."
if systemctl list-units --full -all | grep -Fq "$SERVICE_NAME_OLD"; then
    sudo systemctl stop $SERVICE_NAME_OLD
    sudo systemctl disable $SERVICE_NAME_OLD
    sudo rm "/etc/systemd/system/$SERVICE_NAME_OLD"
    sudo systemctl daemon-reload
    echo "✅ Service lama ($SERVICE_NAME_OLD) berhasil dihapus dari systemd."
else
    echo "⚠️ Service $SERVICE_NAME_OLD tidak ditemukan dalam systemd."
fi

# 4. Hapus direktori lama (seperti vendor, node_modules, atau binari lama)
if [ -d "$OLD_BACKEND_DIR" ]; then
    echo "🗑️ Menghapus direktori kode lama ($OLD_BACKEND_DIR) secara kekal..."
    # Hati-hati menggunakan rm -rf! Pastikan variabel di set dengan benar.
    sudo rm -rf "$OLD_BACKEND_DIR"
    echo "✅ Kode lama terhapus sempurna."
fi

echo "🎉 Proses Safe Cleanup selesai! Anda kini siap menjalankan FastAPI & Nginx baru."
