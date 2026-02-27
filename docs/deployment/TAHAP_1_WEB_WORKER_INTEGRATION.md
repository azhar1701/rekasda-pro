# TAHAP 1: Web Worker Integration Guide
## Offloading Komputasi Berat - Implementasi Selesai

### ✅ File yang Telah Dibuat

1. **`src/workers/hydrology.worker.ts`**
   - Web Worker untuk menjalankan `calculateConvolution` di background thread
   - Mencegah UI freezing saat kalkulasi matriks superposisi
   - Komunikasi async dengan main thread via `postMessage`

2. **`src/hooks/useHydrologyWorker.ts`**
   - Custom React Hook untuk komunikasi dengan worker
   - API: `{ calculateAsync, isCalculating, result, error }`
   - Auto-cleanup worker saat component unmount

---

### 🔧 Cara Integrasi ke ModulBanjirRencana.tsx

#### Langkah 1: Import Hook
```typescript
import { useHydrologyWorker } from '@/hooks/useHydrologyWorker';
```

#### Langkah 2: Inisialisasi Hook (di dalam component)
```typescript
export const ModulBanjirRencana: React.FC<ModulBanjirRencanaProps> = ({ ... }) => {
  // ... existing state ...
  
  // ADD THIS:
  const { calculateAsync, isCalculating: isWorkerCalculating } = useHydrologyWorker();
  
  // ... rest of component ...
```

#### Langkah 3: Ganti Logika Konvolusi di `handleCalculate`

**SEBELUM (Synchronous - UI Freeze):**
```typescript
// Di dalam handleCalculate, setelah mendapat hujanEfektif dan ordinatHSS:
const result = calculateConvolution({
  hujanEfektif: [...],
  ordinatHSS: [...],
  baseflow: 0,
  timeStep: 0.5
});
```

**SESUDAH (Asynchronous - Non-blocking):**
```typescript
// Di dalam handleCalculate:
try {
  const result = await calculateAsync({
    hujanEfektif: [...],
    ordinatHSS: [...],
    baseflow: 0,
    timeStep: 0.5
  });
  
  // Process result
  setChartData(result.debitBanjir.map((q, i) => ({
    time: i * 0.5,
    inflow: q
  })));
  
  setResultSummary({
    debitPuncak: result.debitPuncak,
    waktuPuncak: result.waktuPuncak
  });
  
  toast.success('Konvolusi berhasil dihitung (Web Worker)');
} catch (error) {
  toast.error('Gagal menghitung konvolusi: ' + error.message);
}
```

#### Langkah 4: Update Loading State
```typescript
// Ganti isCalculating dengan isWorkerCalculating di button:
<Button
  disabled={isWorkerCalculating}
  onClick={handleCalculate}
>
  {isWorkerCalculating ? 'Memproses di Background...' : 'Hitung Analisis'}
</Button>
```

---

### 📊 Performa yang Diharapkan

| Metrik | Sebelum (Main Thread) | Sesudah (Web Worker) |
|--------|----------------------|---------------------|
| UI Responsiveness | ❌ Freeze 500-2000ms | ✅ Smooth (0ms block) |
| Calculation Time | ~800ms | ~800ms (parallel) |
| User Experience | Blocked | Non-blocking |

---

### 🎯 Lokasi Injeksi di ModulBanjirRencana.tsx

**Baris ~70-75** (setelah deklarasi state):
```typescript
const [isCalculating, setIsCalculating] = useState(false);

// ADD HERE:
const { calculateAsync, isCalculating: isWorkerCalculating } = useHydrologyWorker();
```

**Baris ~150-250** (di dalam `handleCalculate` function):
- Cari bagian yang memanggil konvolusi (kemungkinan di mock calculation atau real calculation)
- Ganti dengan `await calculateAsync(...)`

**Baris ~400** (di button render):
- Ganti `isCalculating` dengan `isWorkerCalculating`

---

### ⚠️ Catatan Penting

1. **Vite Configuration**: Pastikan Vite sudah support Web Workers (default sudah support)
2. **TypeScript**: Worker types sudah di-export, tidak perlu konfigurasi tambahan
3. **Browser Support**: Web Workers didukung semua browser modern (IE11+)
4. **Debugging**: Gunakan Chrome DevTools → Sources → Workers untuk debug worker

---

### 🚀 Next Steps (TAHAP 2)

Setelah integrasi selesai, kita akan lanjut ke:
- **TAHAP 2**: Migrasi Database ke PostGIS (spatial data)
- **TAHAP 3**: Integrasi React-Leaflet (interactive map)

---

**Status**: ✅ TAHAP 1 SELESAI - Siap untuk integrasi
