# FloodDischargeCalculator - Layout Refactoring Guide

## Perubahan yang Dilakukan

### 1. Import Changes
```tsx
// HAPUS
import { Card } from './ui/Card';
import { SiteIdentityForm } from './SiteIdentityForm';
import { SiteIdentity } from '../types';

// TAMBAH
import { LocationIdentity } from './LocationIdentity';
```

### 2. State Changes
```tsx
// UBAH dari:
const [locationData, setLocationData] = useState<SiteIdentity>({
  channelName: '',
  regency: '',
  district: '',
  village: ''
});

// MENJADI:
const [locationData, setLocationData] = useState<any>(null);
```

### 3. Layout Structure - Main Grid
```tsx
// UBAH dari:
<div className="grid grid-cols-1 lg:grid-cols-10 gap-6 pb-20">
  <div className="lg:col-span-3 space-y-6">
    <div className="lg:sticky lg:top-24 space-y-6">

// MENJADI:
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
  <div className="lg:col-span-4">
    <div className="sticky top-6 h-[calc(100vh-100px)] overflow-y-auto pr-2 space-y-6">
```

### 4. Location Component
```tsx
// UBAH dari:
<SiteIdentityForm value={locationData} onChange={setLocationData} />

// MENJADI:
<LocationIdentity onLocationChange={setLocationData} />
```

### 5. Method Selector Card
```tsx
// UBAH dari:
<Card>
  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">

// MENJADI:
<div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
  <h3 className="text-sm font-bold text-slate-900 mb-3">Pilih Metode Perhitungan</h3>
  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
    {/* buttons tetap sama */}
  </div>
</div>
```

### 6. Replace All Card Components
Ganti semua `<Card title="..." className="bg-white">` dengan:
```tsx
<div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
  <h3 className="text-sm font-bold text-slate-900 mb-4">{title}</h3>
  {/* content */}
</div>
```

### 7. Right Panel Grid
```tsx
// UBAH dari:
<div className="lg:col-span-7 space-y-6">

// MENJADI:
<div className="lg:col-span-8 space-y-6">
```

### 8. KPI Cards Gap
```tsx
// UBAH dari:
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

// MENJADI:
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
```

### 9. handleSaveToDB Function
```tsx
// UBAH dari:
const inputs = method === 'RATIONAL' 
  ? { ...rationalInputs, site: locationData } 
  : { ...nakayasuInputs, site: locationData };

// MENJADI:
const inputs = method === 'RATIONAL' 
  ? { ...rationalInputs, location: locationData } 
  : { ...nakayasuInputs, location: locationData };

// DAN UBAH:
const projectName = window.prompt('Masukkan Nama Proyek/Lokasi:');

// MENJADI:
const projectName = locationData?.channelName || window.prompt('Masukkan Nama Proyek/Lokasi:');

// DAN UBAH alert success:
alert('Berhasil menyimpan perhitungan!');
// MENJADI:
alert('✓ Berhasil menyimpan perhitungan!');
```

## Summary Perubahan Layout

### Before (Old Layout):
- Grid: 10 kolom (3 sidebar + 7 content)
- Sidebar: `lg:sticky lg:top-24`
- Menggunakan `<Card>` component
- Menggunakan `<SiteIdentityForm>`

### After (New Layout):
- Grid: 12 kolom (4 sidebar + 8 content)
- Sidebar: `sticky top-6 h-[calc(100vh-100px)] overflow-y-auto pr-2`
- Menggunakan `<div>` dengan styling manual
- Menggunakan `<LocationIdentity>`
- Gap antar elemen lebih besar (gap-6)
- Hierarki visual lebih jelas dengan title di setiap card

## Keuntungan Layout Baru:
1. ✅ Sidebar sticky dengan scroll independent
2. ✅ Proporsi lebih baik (35% sidebar, 65% content)
3. ✅ LocationIdentity lebih sederhana dan clean
4. ✅ Tidak ada dependency ke Card component
5. ✅ Hierarki visual lebih jelas
6. ✅ Responsive dan mobile-friendly
