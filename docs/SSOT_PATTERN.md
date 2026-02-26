# Single Source of Truth (SSOT) Pattern

## Architecture Overview

RekaSDA Pro implements a strict SSOT pattern to prevent data duplication and ensure consistency across modules.

## Data Ownership Hierarchy

### 1. Master Data (Primary Owner)
**Location**: `Master Data` module

**Owns**:
- `luasDAS` (A) - Catchment area (km²)
- `panjangSungai` (L) - Stream length (km)
- `kemiringanSungai` (S) - Stream slope (m/m)
- `elevasi` - Average elevation (m)
- `koefisienC` - Runoff coefficient
- `curveNumber` (CN) - SCS Curve Number
- `hujanBulanan` - Monthly rainfall (12 months)
- `etoBulanan` - Monthly evapotranspiration

**Rule**: These parameters MUST NOT be redefined in other modules.

### 2. Analisis Frekuensi (Probability Owner)
**Location**: `Analisis Frekuensi` module

**Owns**:
- `curahHujanRencana` (R₂₄) - Design rainfall by return period
- `metodeTerpilih` - Selected distribution method
- `parameterStatistik` - Statistical parameters

**Depends on**: Master Data (rainfall data)

### 3. Analisis Banjir (Extreme Event Owner)
**Location**: `Modul Banjir` (Stepper)

**Owns**:
- `debitPuncakBanjir` (Qp) - Peak flood discharge (m³/s)
- `hidrografBanjir` - Flood hydrograph time series
- `hujanEfektif` - Effective rainfall distribution

**Depends on**: Master Data (A, L, S), Analisis Frekuensi (R₂₄)

### 4. Neraca Air (Water Availability Owner)
**Location**: `Neraca Air` module

**Owns**:
- `debitAndalan` (Q_andalan) - Dependable flow (m³/s)
- `neracaBulanan` - Monthly water balance (surplus/deficit)

**Depends on**: Master Data (A, rainfall, ETO)

## Derived State (Auto-computed)

These values are NEVER stored, always computed on-demand:

### Time of Concentration (tc)
```typescript
tc = 0.0195 × L^0.77 × S^-0.385
```
**Source**: Master Data (L, S)

### Design Discharge (Q)
```typescript
Q = Qp (flood) OR Q_andalan (irrigation)
```
**Source**: Analisis Banjir OR Neraca Air (based on channel type)

### Rainfall Volume
```typescript
V = R × A × 1000 (m³)
```
**Source**: Analisis Frekuensi (R) × Master Data (A)

## Cascade Invalidation

When upstream data changes, downstream calculations are automatically invalidated:

### Master Data Changes → Invalidates:
- ✗ Analisis Frekuensi
- ✗ Analisis Banjir
- ✗ Neraca Air
- ✗ Embung

### Analisis Frekuensi Changes → Invalidates:
- ✗ Analisis Banjir
- ✗ Embung

### Analisis Banjir Changes → Invalidates:
- ✗ Embung (routing)

## Usage in Components

### Reading Integrated Parameters

```typescript
import { useIntegratedParameters } from '@/hooks/useIntegratedParameters';

const MyComponent = () => {
  const { masterData, derived, status } = useIntegratedParameters();
  
  // Access SSOT data
  const A = masterData.luasDAS;
  const tc = derived.timeOfConcentration;
  const Q = derived.designDischarge('flood');
  
  // Check availability
  if (!status.hasMasterData) {
    return <Warning>Master Data belum lengkap</Warning>;
  }
};
```

### Displaying Integrated Inputs

```typescript
import { IntegratedInput } from '@/components/ui/IntegratedInput';

<IntegratedInput
  label="Luas DAS (A)"
  value={masterData.luasDAS.toFixed(2)}
  unit="km²"
  source="Master Data"
  tooltip="Luas daerah tangkapan air"
/>
```

### Updating with Cascade

```typescript
import { useHydrologyStore } from '@/stores/useHydrologyStore';

const updateMasterData = () => {
  // Use updateMorfometriDAS for cascade invalidation
  store.updateMorfometriDAS({
    luasDAS: 100,
    panjangSungai: 20,
    kemiringanSungai: 0.005,
    elevasi: 250
  });
  // This will automatically invalidate all downstream calculations
};
```

## Visual Indicators

### IntegratedInput Component
- **Background**: `bg-slate-50` (read-only gray)
- **Border**: `border-2 border-slate-200`
- **Icon**: 🔗 Link icon with source label
- **Info Box**: Blue banner explaining data source

### Status Indicators
- 🟢 Green dot: Data available
- 🔴 Red dot: Data missing
- 🟡 Yellow banner: Override warning

## Best Practices

1. **Never duplicate state** - Always read from SSOT
2. **Use derived getters** - Don't store computed values
3. **Cascade on update** - Use `updateMorfometriDAS` not `setMorfometriDAS`
4. **Show integration status** - Let users know what's connected
5. **Lock integrated inputs** - Make them read-only with navigation

## Anti-Patterns (DON'T DO THIS)

❌ Storing duplicate parameters:
```typescript
// BAD
const [localLuasDAS, setLocalLuasDAS] = useState(0);
```

❌ Manual computation without derived state:
```typescript
// BAD
const tc = 0.0195 * Math.pow(L, 0.77) * Math.pow(S, -0.385);
```

❌ Updating without cascade:
```typescript
// BAD
setMorfometriDAS(newData); // Doesn't invalidate downstream
```

## Migration Guide

If you have existing components with duplicate state:

1. Remove local state variables
2. Import `useIntegratedParameters`
3. Replace inputs with `IntegratedInput`
4. Use derived getters for computed values
5. Test cascade invalidation

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Maintainer**: RekaSDA Pro Team
