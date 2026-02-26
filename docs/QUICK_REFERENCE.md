# 🚀 QUICK REFERENCE: exceljs Migration

Panduan cepat untuk developer yang ingin menggunakan fungsi export/import Excel setelah migrasi ke exceljs.

---

## 1️⃣ EXPORT DATA KE EXCEL

```typescript
import { exportToExcel } from '@/utils/excelService';

// Contoh data
const data = [
  { Nama: 'Bendung A', Debit: 15.5, Status: 'Aman' },
  { Nama: 'Bendung B', Debit: 22.3, Status: 'Waspada' }
];

// Export (ASYNC!)
const handleExport = async () => {
  await exportToExcel(data, 'laporan-banjir', 'Sheet1');
};
```

⚠️ **PENTING**: Fungsi sekarang ASYNC, harus pakai `await`!

---

## 2️⃣ IMPORT DATA DARI EXCEL

```typescript
import { parseExcelData } from '@/utils/excelService';

const handleImport = async (file: File) => {
  const buffer = await file.arrayBuffer();
  
  // Parse dengan type safety
  const data = await parseExcelData<{
    Tanggal: string;
    'Curah Hujan (mm)': number;
  }>(buffer, 4); // 4 = skip 4 baris header
  
  console.log(data);
};
```

---

## 3️⃣ DOWNLOAD TEMPLATE

```typescript
import { exportHidrologiTemplate } from '@/utils/excelService';

const handleDownloadTemplate = async () => {
  await exportHidrologiTemplate('Stasiun Cikampak');
};
```

---

## 4️⃣ CONTOH LENGKAP DALAM KOMPONEN

```typescript
import React, { useState } from 'react';
import { exportToExcel } from '@/utils/excelService';

export const MyComponent = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = [
        { Col1: 'Value1', Col2: 123 },
        { Col1: 'Value2', Col2: 456 }
      ];
      
      await exportToExcel(data, 'my-report', 'Data');
      alert('✅ Export berhasil!');
    } catch (error) {
      console.error(error);
      alert('❌ Export gagal!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={loading}>
      {loading ? 'Exporting...' : 'Export Excel'}
    </button>
  );
};
```

---

## 5️⃣ MIGRATION CHECKLIST

**SEBELUM (xlsx):**
```typescript
exportToExcel(data, 'file', 'Sheet1');  // Sync
```

**SESUDAH (exceljs):**
```typescript
await exportToExcel(data, 'file', 'Sheet1');  // Async ✅
```

**JANGAN LUPA:**
1. Tambah `async` di function
2. Tambah `await` sebelum `exportToExcel()`
3. Wrap dengan try-catch untuk error handling

---

## 6️⃣ STYLING OTOMATIS

Header otomatis mendapat styling:
- **Font**: Bold
- **Background**: #D9E9F7 (biru muda)
- **Width**: 15 karakter

Untuk custom styling, edit `excelService.ts`

---

## 📚 DOKUMENTASI LENGKAP

Lihat:
- `docs/EXCEL_MIGRATION.md`
- `docs/MIGRATION_SUMMARY.md`
- `docs/examples/ExcelExportExample.tsx`
