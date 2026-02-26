# 📊 Migrasi xlsx → exceljs

## 🔒 Latar Belakang Keamanan

Pustaka `xlsx` (SheetJS versi komunitas) memiliki kerentanan keamanan:
- **CVE-2024-XXXXX**: Prototype Pollution (High)
- **CVE-2024-XXXXX**: ReDoS Attack (High)

Solusi: Migrasi ke `exceljs` - pustaka modern, aman, dan aktif dipelihara.

---

## ✅ Status Migrasi

| Komponen | Status | Keterangan |
|----------|--------|------------|
| `utils/excelService.ts` | ✅ Selesai | Core service direfactor |
| `MasterHidrologiTab.tsx` | ✅ Selesai | Import/Export template |
| Dependensi | ✅ Selesai | xlsx dihapus, exceljs terinstal |

---

## 📦 Instalasi

```bash
# Hapus pustaka lama
npm uninstall xlsx

# Install pustaka baru
npm install exceljs file-saver
npm install --save-dev @types/file-saver
```

---

## 🔧 API Reference

### `exportToExcel(data, filename, sheetName)`

Export data array of objects ke file Excel dengan styling profesional.

**Parameter:**
- `data: any[]` - Array of objects untuk diexport
- `filename: string` - Nama file (tanpa .xlsx)
- `sheetName: string` - Nama sheet (default: 'Sheet1')

**Return:** `Promise<void>`

**Contoh:**

```typescript
import { exportToExcel } from '@/utils/excelService';

const handleExport = async () => {
  const data = [
    { Nama: 'Bendung A', Debit: 15.5, Status: 'Aman' },
    { Nama: 'Bendung B', Debit: 22.3, Status: 'Waspada' }
  ];
  
  await exportToExcel(data, 'laporan-banjir-2024', 'Data Banjir');
};
```

### `parseExcelData<T>(buffer, range)`

Parse file Excel menjadi array of objects.

**Parameter:**
- `buffer: ArrayBuffer` - Buffer dari file Excel
- `range: number` - Baris awal pembacaan (default: 0)

**Return:** `Promise<T[]>`

**Contoh:**

```typescript
import { parseExcelData } from '@/utils/excelService';

const handleImport = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const data = await parseExcelData<{ Tanggal: string; Debit: number }>(buffer, 5);
  console.log(data);
};
```

### `exportHidrologiTemplate(stasiunName)`

Export template khusus untuk import data curah hujan.

**Parameter:**
- `stasiunName: string` - Nama stasiun hujan

**Return:** `Promise<void>`

---

## 🎨 Styling Excel

Header otomatis mendapat styling:
- **Font**: Bold
- **Background**: Biru muda (#D9E9F7)
- **Width**: Auto-adjust 15 karakter

Untuk custom styling, edit `exportToExcel()` di `excelService.ts`:

```typescript
// Contoh: Tambah border
worksheet.eachRow((row) => {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
});
```

---

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Build test
npm run build
```

---

## 📚 Referensi

- [ExcelJS Documentation](https://github.com/exceljs/exceljs)
- [FileSaver.js](https://github.com/eligrey/FileSaver.js)
- [SNI 2415:2016](https://sni.bsn.go.id) - Standar Hidrologi Indonesia

---

**Migrasi Selesai**: 2024-01-XX  
**Engineer**: DevSecOps Team  
**Status**: ✅ Production Ready
