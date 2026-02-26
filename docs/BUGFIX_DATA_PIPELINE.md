# 🔧 BUGFIX: Pipa Data Hujan Efektif → Konvolusi

## 🎯 Problem Statement

**Issue**: Konvolusi stuck - "Data Hujan Efektif belum tersedia"  
**Root Cause**: Array hasil Distribusi Hujan tidak tersimpan ke Global Store  
**Impact**: User tidak bisa melanjutkan ke tahap konvolusi

---

## ✅ Solution Implemented

### TAHAP 1: Global Store ✅

**File**: `src/stores/useHydrologyStore.ts`

**State yang Sudah Ada**:
```typescript
effectiveRainfall: EffectiveRainfallResult | null;
setEffectiveRainfall: (result: EffectiveRainfallResult | null) => void;
```

**Interface**:
```typescript
interface EffectiveRainfallResult {
  totalRainfall: number;
  effectiveRainfall: number;
  losses: number;
  method: string;
  hourlyDistribution?: number[]; // Array jam-jaman
}
```

✅ Store sudah siap, tidak perlu modifikasi

---

### TAHAP 2: Publisher (Distribusi Hujan) ✅

**File**: `src/features/flood-analysis/components/steps/DistribusiHujanStep.tsx`

**Perubahan**:
```typescript
const handleComplete = () => {
  // CRITICAL: Simpan ke Global Store
  const { setEffectiveRainfall } = useHydrologyStore.getState();
  setEffectiveRainfall({
    totalRainfall: hyetograph.reduce((a, b) => a + b, 0),
    effectiveRainfall: effectiveRainfall.reduce((a, b) => a + b, 0),
    losses: hyetograph.reduce((a, b) => a + b, 0) - effectiveRainfall.reduce((a, b) => a + b, 0),
    method: lossMethod === 'C' ? `Koef. C = ${C.toFixed(3)}` : `CN = ${CN}`,
    hourlyDistribution: effectiveRainfall // ARRAY JAM-JAMAN
  });
  
  console.log('✅ Menyimpan Hujan Efektif ke Store:', effectiveRainfall);
  onComplete(effectiveRainfall, durasi);
};
```

**Features**:
- ✅ Simpan array `hourlyDistribution` ke store
- ✅ Console log untuk debugging
- ✅ Metadata lengkap (total, losses, method)

---

### TAHAP 3: Subscriber (Konvolusi) ✅

**File**: `src/features/flood-analysis/components/steps/KonvolusiStep.tsx`

**1. Data Validation**:
```typescript
const hujanEfektif = effectiveRainfall?.hourlyDistribution || [];
const isDataReady = hujanEfektif.length > 0 && hssOrdinates.length > 0;
```

**2. Smart Empty State**:
```tsx
{!isDataReady && (
  <Card className="p-6 bg-yellow-50 border-2 border-yellow-200">
    <div className="flex items-start gap-4">
      <div className="p-3 bg-yellow-100 rounded-full">
        <Waves className="w-6 h-6 text-yellow-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-yellow-900 mb-2">
          ⚠️ Data Hujan Efektif Belum Tersedia
        </h3>
        <p className="text-sm text-yellow-800 mb-4">
          Sistem membutuhkan distribusi hujan jam-jaman untuk melakukan konvolusi.
          Silakan hitung <strong>Distribusi Hujan</strong> di langkah sebelumnya.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg"
        >
          👈 Kembali ke Distribusi Hujan
        </button>
      </div>
    </div>
  </Card>
)}
```

**3. Button State**:
```typescript
<button
  disabled={!isDataReady}
  title={!isDataReady ? 'Selesaikan Distribusi Hujan terlebih dahulu' : ''}
>
  {!isDataReady ? 'Menunggu Data Hujan...' : 'Hitung Konvolusi'}
</button>
```

---

## 📊 Data Flow

```
┌─────────────────────────┐
│ Distribusi Hujan Step  │
│                         │
│ 1. User hitung ABM      │
│ 2. Generate array       │
│ 3. handleComplete()     │
│    ├─ setEffectiveRainfall() ──┐
│    └─ console.log()             │
└─────────────────────────┘       │
                                  │
                    ┌─────────────▼──────────────┐
                    │   Zustand Global Store     │
                    │                            │
                    │ effectiveRainfall: {       │
                    │   hourlyDistribution: []   │
                    │ }                          │
                    └─────────────┬──────────────┘
                                  │
┌─────────────────────────────────▼───┐
│ Konvolusi Step                      │
│                                     │
│ 1. const { effectiveRainfall }      │
│ 2. const hujanEfektif = ...hourly   │
│ 3. if (!isDataReady) → Alert        │
│ 4. else → Enable button             │
└─────────────────────────────────────┘
```

---

## 🧪 Testing

### Test 1: Data Flow ✅
```
1. Navigate to Distribusi Hujan
2. Set parameters (Tr=25, durasi=6)
3. Click "Hitung Distribusi"
4. Click "Lanjut ke HSS"
5. Check console: "✅ Menyimpan Hujan Efektif ke Store: [...]"
6. Navigate to Konvolusi
7. Verify: Button enabled, no alert
```

### Test 2: Empty State ✅
```
1. Navigate directly to Konvolusi (skip Distribusi)
2. Verify: Yellow alert appears
3. Verify: Button disabled
4. Click "Kembali ke Distribusi Hujan"
5. Verify: Navigates back
```

### Test 3: Data Persistence ✅
```
1. Complete Distribusi Hujan
2. Navigate away
3. Navigate back to Konvolusi
4. Verify: Data still available (from store)
```

---

## 📁 Files Modified

1. ✅ `DistribusiHujanStep.tsx` - Publisher (save to store)
2. ✅ `KonvolusiStep.tsx` - Subscriber (smart empty state)

---

## 🎯 UX Improvements

### Before
- ❌ Silent failure
- ❌ No user feedback
- ❌ Button disabled without explanation
- ❌ No way to go back

### After
- ✅ Clear alert message
- ✅ Explanation why data needed
- ✅ Button with tooltip
- ✅ "Kembali" button for navigation
- ✅ Console log for debugging

---

## 🔍 Debugging

**Check if data saved**:
```javascript
// In browser console
useHydrologyStore.getState().effectiveRainfall
```

**Expected output**:
```javascript
{
  totalRainfall: 185.5,
  effectiveRainfall: 120.3,
  losses: 65.2,
  method: "Koef. C = 0.650",
  hourlyDistribution: [10.2, 25.8, 42.1, 28.5, 15.3, 8.4]
}
```

---

## ✅ Verification

```
npm run typecheck: ✅ PASSED
Build: ✅ SUCCESS
Data flow: ✅ Working
UX: ✅ Improved
```

---

**Bugfix Complete**: 2024-01-XX  
**Status**: Production Ready 🚀
