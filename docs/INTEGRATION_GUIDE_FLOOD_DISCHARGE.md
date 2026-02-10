# Panduan Integrasi FloodDischargeCalculator ke App.tsx

## Langkah 1: Import Komponen

Tambahkan import di bagian atas App.tsx:

```tsx
import { FloodDischargeCalculator } from './components/FloodDischargeCalculator';
```

## Langkah 2: Update Tab Enum (Opsional)

Jika ingin membuat tab terpisah untuk modul baru, tambahkan ke enum Tab:

```tsx
enum Tab {
  SALURAN = 'SALURAN',
  BANJIR = 'BANJIR',
  BANJIR_RENCANA = 'BANJIR_RENCANA',  // Tab baru
  NERACA = 'NERACA',
  HISTORY = 'HISTORY',
  AI = 'AI'
}
```

## Langkah 3: Tambahkan Navigation Item

Update array `navigationItems`:

```tsx
const navigationItems = [
  { 
    tab: Tab.SALURAN, 
    label: 'Saluran', 
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 10l8-8m0 0l8 8M12 2v20" /></svg>,
  },
  { 
    tab: Tab.BANJIR, 
    label: 'Banjir', 
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>,
  },
  // TAMBAHKAN INI:
  { 
    tab: Tab.BANJIR_RENCANA, 
    label: 'Q Rencana', 
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  // ... items lainnya
];
```

## Langkah 4: Render Komponen di Main Content

Tambahkan kondisi render di dalam `<main>`:

```tsx
<main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-8 pb-40 lg:pb-32 z-10 relative">
  <div className="transition-all duration-500 ease-out transform">
    {activeTab === Tab.SALURAN && <ManningCalculator onSave={handleCalculationSave} onConsultAI={(i, o) => handleConsultAI(CalculationType.MANNING, i, o)} />}
    {activeTab === Tab.BANJIR && <RationalCalculator onSave={handleCalculationSave} onConsultAI={(i, o) => handleConsultAI(CalculationType.RATIONAL, i, o)} />}
    
    {/* TAMBAHKAN INI: */}
    {activeTab === Tab.BANJIR_RENCANA && <FloodDischargeCalculator />}
    
    {activeTab === Tab.NERACA && <WaterBalanceTab />}
    {activeTab === Tab.AI && <div className="max-w-4xl mx-auto pt-4 animate-slide-up"><GeminiConsultant lastContext={lastContext} initialQuery={aiInitialQuery} /></div>}
    {/* ... history tab */}
  </div>
</main>
```

## Alternatif: Ganti Tab BANJIR yang Ada

Jika ingin mengganti RationalCalculator dengan FloodDischargeCalculator:

```tsx
// GANTI INI:
{activeTab === Tab.BANJIR && <RationalCalculator onSave={handleCalculationSave} onConsultAI={(i, o) => handleConsultAI(CalculationType.RATIONAL, i, o)} />}

// DENGAN INI:
{activeTab === Tab.BANJIR && <FloodDischargeCalculator />}
```

## Langkah 5: Install Dependencies

Pastikan recharts sudah terinstall:

```bash
npm install recharts
```

Atau tambahkan ke package.json:

```json
{
  "dependencies": {
    "recharts": "^2.10.0"
  }
}
```

## Langkah 6: Test

1. Jalankan development server:
   ```bash
   npm run dev
   ```

2. Navigasi ke tab "Q Rencana" atau "Banjir"

3. Test kedua metode:
   - Pilih "Metode Rasional" → Input parameter → Lihat hidrograf
   - Pilih "HSS Nakayasu" → Input parameter → Lihat hidrograf

4. Test fitur:
   - Kalkulator Tc (klik icon kalkulator)
   - Edit nilai kala ulang di tabel
   - Lihat update grafik real-time

## Troubleshooting

### Error: Cannot find module 'recharts'
```bash
npm install recharts --save
```

### Grafik tidak muncul
- Buka browser console (F12)
- Check error messages
- Pastikan data hydrographData tidak kosong

### Styling tidak sesuai
- Pastikan Tailwind CSS sudah dikonfigurasi
- Check tailwind.config.js mencakup path components

## Fitur Tambahan (Opsional)

### Tambahkan Save & Export
Jika ingin menambahkan fitur save seperti calculator lain:

```tsx
// Di FloodDischargeCalculator.tsx, tambahkan props:
interface Props {
  onSave?: (type: CalculationType, inputs: any, outputs: any) => void;
  onConsultAI?: (inputs: any, outputs: any) => void;
}

export const FloodDischargeCalculator: React.FC<Props> = ({ onSave, onConsultAI }) => {
  // ... existing code
  
  // Tambahkan button di hasil:
  <Button 
    onClick={() => onSave?.(CalculationType.RATIONAL, rationalInputs, { Discharge: qPeak })}
  >
    Simpan Hasil
  </Button>
}
```

### Tambahkan ke CalculationType
Di types.ts, tambahkan:

```tsx
export enum CalculationType {
  MANNING = 'MANNING',
  RATIONAL = 'RATIONAL',
  FLOOD_DISCHARGE = 'FLOOD_DISCHARGE'  // Tambahkan ini
}
```

## Catatan Penting

1. **Responsiveness**: Komponen sudah responsive untuk mobile & desktop
2. **Performance**: Perhitungan real-time menggunakan useEffect dengan dependencies yang optimal
3. **Styling**: Menggunakan warna emerald/green konsisten dengan design system
4. **Accessibility**: Semua input memiliki label dan help text

## Referensi File

- Komponen utama: `components/FloodDischargeCalculator.tsx`
- Utility Nakayasu: `utils/calculations/nakayasu.ts`
- Utility Rasional: `utils/calculations/rational.ts` (existing)
- Dokumentasi: `docs/FLOOD_DISCHARGE_MODULE.md`
