# Header Update Summary

## Perubahan yang Dilakukan

### Tab Saluran (ManningCalculator)
✅ Header diganti dari `PageHeader` component menjadi simple header
✅ Layout grid menggunakan `grid-cols-12` dengan sidebar 30% dan content 70%
✅ Section titles menggunakan card dengan header sederhana
✅ Sticky sidebar dengan scroll

### Tab Banjir (FloodDischargeCalculator)  
✅ Header diganti dari `PageHeader` component menjadi simple header
✅ Layout grid menggunakan `grid-cols-12` dengan sidebar 30% dan content 70%
✅ Section titles menggunakan card dengan header sederhana
✅ Sticky sidebar dengan scroll

### Tab Neraca Air (WaterBalanceTab)
✅ Sudah menggunakan format header yang benar (referensi)

## Format Header yang Seragam

```tsx
<div className="min-h-screen bg-slate-50 p-6">
  <div className="max-w-[1600px] mx-auto">
    
    {/* Header */}
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-slate-800">Judul Tab</h1>
      <p className="text-sm text-slate-500 mt-1">Deskripsi • Detail</p>
    </div>

    <div className="grid grid-cols-12 gap-6">
      {/* Sidebar 30% */}
      <div className="col-span-12 lg:col-span-4 xl:col-span-3">
        <div className="sticky top-6 h-[calc(100vh-100px)] overflow-y-auto pr-2 space-y-4">
          {/* Content */}
        </div>
      </div>

      {/* Main Content 70% */}
      <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
        {/* Content */}
      </div>
    </div>
  </div>
</div>
```

## Hasil Akhir

Ketiga tab (Saluran, Banjir, Neraca Air) sekarang memiliki:
- ✅ Header yang seragam
- ✅ Layout grid yang konsisten
- ✅ Spacing yang sama
- ✅ Section styling yang uniform
- ✅ Sticky sidebar dengan scroll
