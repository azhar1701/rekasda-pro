# SNI 2415:2016 Workflow Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT: Luas DAS (A)                          │
│                  Catchment Area in km²                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  A ≤ 3 km²?    │
                    │  (≤ 300 ha)    │
                    └────┬───────┬───┘
                         │       │
                    YES  │       │  NO
                         │       │
         ┌───────────────┘       └───────────────┐
         ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────┐
│  METODE RASIONAL    │               │   METODE HSS        │
│  ✅ DIPERBOLEHKAN   │               │   ⚠️ WAJIB          │
├─────────────────────┤               ├─────────────────────┤
│ Formula:            │               │ Pilihan:            │
│ Q = 0.278×C×I×A     │               │ • HSS Nakayasu      │
│                     │               │ • HSS Gamma I       │
│ Input:              │               │ • HSS Snyder        │
│ • C (0-1)           │               │                     │
│ • I (mm/jam)        │               │ Nakayasu Input:     │
│ • A (km²)           │               │ • Ro (mm)           │
│                     │               │ • Tg (jam)          │
│ Output:             │               │ • Tr (jam)          │
│ • Q (m³/s)          │               │ • α (1.5-3.0)       │
│                     │               │ • A (km²)           │
│ Batasan:            │               │ • L (km)            │
│ • DAS homogen       │               │                     │
│ • Tc < 6 jam        │               │ Output:             │
│ • A ≤ 300 ha        │               │ • Qp (m³/s)         │
│                     │               │ • Hidrograf         │
└─────────────────────┘               └─────────────────────┘
         │                                       │
         └───────────────┬───────────────────────┘
                         ▼
              ┌──────────────────────┐
              │  DEBIT BANJIR        │
              │  RENCANA (Q)         │
              │  Peak Discharge      │
              └──────────────────────┘
```

## Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  validateSNI2415Workflow(areaKm2)                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ areaKm2 ≤ 3.0? │
                    └────┬───────┬───┘
                         │       │
                    YES  │       │  NO
                         │       │
         ┌───────────────┘       └───────────────┐
         ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────┐
│ Return:             │               │ Return:             │
│ {                   │               │ {                   │
│   recommendedMethod:│               │   recommendedMethod:│
│     'rational',     │               │     'hss',          │
│   isRationalValid:  │               │   isRationalValid:  │
│     true,           │               │     false,          │
│   areaKm2: X        │               │   warning: "...",   │
│ }                   │               │   areaKm2: X        │
│                     │               │ }                   │
└─────────────────────┘               └─────────────────────┘
         │                                       │
         ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────┐
│ UI: Show Rational   │               │ UI: Show Warning    │
│     Method Form     │               │     Alert           │
│                     │               │                     │
│ ✅ Proceed with     │               │ ⚠️ Force HSS        │
│    calculation      │               │    Method           │
└─────────────────────┘               └─────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  calculateRationalDischarge({ C, I, A })                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Zod Validation │
                    └────┬───────┬───┘
                         │       │
                    PASS │       │ FAIL
                         │       │
         ┌───────────────┘       └───────────────┐
         ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────┐
│ Calculate:          │               │ Throw ZodError:     │
│ Q = 0.278×C×I×A     │               │                     │
│                     │               │ Possible errors:    │
│ Return:             │               │ • C not in [0,1]    │
│ { Q: number }       │               │ • I out of range    │
│                     │               │ • A > 3 km² ⚠️      │
└─────────────────────┘               └─────────────────────┘
         │                                       │
         ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────┐
│ Success             │               │ UI: Display Error   │
│ Display Result      │               │ "Luas DAS melebihi  │
│                     │               │  batas SNI..."      │
└─────────────────────┘               └─────────────────────┘
```

## React Hook Integration

```
┌─────────────────────────────────────────────────────────────────┐
│  Component: FloodAnalysisForm                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ useState(area) │
                    └────────┬───────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │ useSNI2415Workflow(area) │
              └──────────┬───────────────┘
                         │
                         ▼
                ┌────────────────┐
                │ useMemo(() =>  │
                │   validate...  │
                │ , [area])      │
                └────┬───────────┘
                     │
                     ▼
            ┌────────────────────┐
            │ Return workflow    │
            │ object             │
            └────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Render UI based on:    │
        │ • workflow.warning     │
        │ • workflow.isValid     │
        │ • workflow.recommended │
        └────────────────────────┘
```

## SNI 2415:2016 Compliance Matrix

| Area (km²) | Area (ha) | Rational | HSS | SNI Status |
|------------|-----------|----------|-----|------------|
| 0.5        | 50        | ✅       | ✅  | Compliant  |
| 1.0        | 100       | ✅       | ✅  | Compliant  |
| 2.0        | 200       | ✅       | ✅  | Compliant  |
| 3.0        | 300       | ✅       | ✅  | Boundary   |
| 3.01       | 301       | ❌       | ✅  | HSS Only   |
| 5.0        | 500       | ❌       | ✅  | HSS Only   |
| 10.0       | 1000      | ❌       | ✅  | HSS Only   |
| 100.0      | 10000     | ❌       | ✅  | HSS Only   |

Legend:
- ✅ = Allowed by SNI
- ❌ = Not allowed by SNI (will throw error)

---

**Reference**: SNI 2415:2016 Pasal 5.2 & 6.3  
**Implementation**: `src/lib/engine/flood/sni2415.ts`
