# Manual Update Guide - FloodDischargeCalculator.tsx

## Langkah Update Header Tab Banjir

### 1. Hapus Import yang Tidak Perlu
```tsx
// HAPUS baris ini:
import { CardLegacy as Card, CardContent } from './ui/CardNew';
import { PageHeader, PageContent, Section } from './ui/Layout';
```

### 2. Ganti Return Statement (baris ~270)
```tsx
// DARI:
return (
  <div className="space-y-8">
    {/* Page Header */}
    <PageHeader
      title="Analisis Banjir & Hidrologi"
      subtitle="Perhitungan debit puncak menggunakan metode Rasional atau Nakayasu"
      icon={<span className="text-2xl">💧</span>}
    />

// MENJADI:
return (
  <div className="min-h-screen bg-slate-50 p-6">
    <div className="max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Analisis Banjir & Hidrologi</h1>
        <p className="text-sm text-slate-500 mt-1">Perhitungan debit puncak • Metode Rasional & Nakayasu</p>
      </div>
```

### 3. Ganti Grid Layout (baris ~295)
```tsx
// DARI:
<PageContent>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* LEFT SIDEBAR - 33% */}
    <div className="space-y-6">

// MENJADI:
      <div className="grid grid-cols-12 gap-6">
        
        {/* LEFT SIDEBAR - 30% */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="sticky top-6 h-[calc(100vh-100px)] overflow-y-auto pr-2 space-y-4">
```

### 4. Ganti Semua Section Component
```tsx
// DARI:
<Section title="Data Pilot">
  <PilotDataLoader ... />
</Section>

// MENJADI:
<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Data Pilot</h2>
  <PilotDataLoader ... />
</div>
```

### 5. Hapus LocationIdentity Section Wrapper
```tsx
// DARI:
<Section title="Identitas Lokasi">
  <LocationIdentity onLocationChange={setLocationData} />
</Section>

// MENJADI:
<LocationIdentity onLocationChange={setLocationData} />
```

### 6. Update Main Content Grid
```tsx
// DARI:
{/* MAIN CONTENT - 67% */}
<div className="lg:col-span-2 space-y-6">

// MENJADI:
{/* MAIN CONTENT - 70% */}
<div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
```

### 7. Ganti Section di Main Content
```tsx
// DARI:
<Section>
  <div className="grid grid-cols-1 gap-4">
    {/* KPI Cards */}
  </div>
</Section>

// MENJADI:
<div className="grid grid-cols-1 gap-4">
  {/* KPI Cards */}
</div>
```

### 8. Update Chart Section
```tsx
// DARI:
<Section title="Hidrograf Banjir Rencana">
  <Card>
    <CardContent>
      <FloodHydrographChart ... />
    </CardContent>
  </Card>
</Section>

// MENJADI:
<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
  <h2 className="text-lg font-bold text-slate-800 mb-4">Hidrograf Banjir Rencana</h2>
  <FloodHydrographChart ... />
</div>
```

### 9. Tutup Div Container (di akhir sebelum return closing)
```tsx
// DARI:
        </div>
      </PageContent>
    </div>
  );

// MENJADI:
          </div>
        </div>
      </div>
    </div>
  );
```

## Hasil Akhir
Setelah update, struktur akan sama dengan ManningCalculator dan WaterBalanceTab:
- Header sederhana dengan h1 + p
- Grid 12 kolom dengan sidebar 30% dan content 70%
- Section menggunakan div dengan header h2
- Sticky sidebar dengan scroll
