# 🎯 Flood Hydrograph Charts - Quick Reference Card

## 📦 Components Available

```
┌─────────────────────────────────────────────────────────┐
│  FloodHydrographChart                                   │
├─────────────────────────────────────────────────────────┤
│  Area chart dengan gradient fill, peak indicator, dan   │  
│  interactive tooltip. Primary chart untuk hydrograph.   │
│                                                         │
│  Props: data, qPeak, tPeak, volume, primaryColor,      │
│         title, height                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  HydrographInsights                                     │
├─────────────────────────────────────────────────────────┤
│  Statistics cards menampilkan 4 key metrics dalam       │
│  responsive grid (1→2→4 columns).                       │
│                                                         │
│  Props: data, qPeak, tPeak, volume, unit               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ComparativeHydrographChart                             │
├─────────────────────────────────────────────────────────┤
│  Multi-scenario overlay chart untuk membandingkan       │
│  berbagai kala ulang atau skenario hidrologis.          │
│                                                         │
│  Props: data, scenarios, title, height, showLegend     │
└─────────────────────────────────────────────────────────┘
```

---

## ⚡ 5-Minute Setup

### 1. Import
```typescript
import { FloodHydrographChart } from './components/FloodHydrographChart';
import { HydrographInsights } from './components/HydrographInsights';
```

### 2. Prepare Data (Object Array)
```typescript
const hydrographData = [
  { time: 0, discharge: 0 },
  { time: 1, discharge: 5 },
  { time: 2, discharge: 12 },    // ← Peak
  { time: 3, discharge: 8 },
  { time: 4, discharge: 2 }
];
```

### 3. Find Peak
```typescript
const peakPoint = hydrographData.reduce((max, p) =>
  p.discharge > max.discharge ? p : max
);

const qPeak = peakPoint.discharge;  // 12
const tPeak = peakPoint.time;        // 2
```

### 4. Render
```typescript
<>
  <HydrographInsights 
    data={hydrographData}
    qPeak={qPeak}
    tPeak={tPeak}
    volume={100}
  />
  
  <FloodHydrographChart 
    data={hydrographData}
    qPeak={qPeak}
    tPeak={tPeak}
    volume={100}
  />
</>
```

---

## 🎨 Color Presets

```typescript
// Teal (Default - Recommended)
primaryColor="#0d9488"

// Blue
primaryColor="#3b82f6"

// Purple
primaryColor="#a855f7"

// Red
primaryColor="#ef4444"

// Emerald
primaryColor="#10b981"

// Cyan
primaryColor="#06b6d4"
```

---

## 📊 Props Cheatsheet

### FloodHydrographChart
```typescript
interface Props {
  ✅ data: [{time: number, discharge: number}]  // Required
  ✅ qPeak?: number                              // Peak discharge
  ✅ tPeak?: number                              // Time to peak  
  ✅ volume?: number                             // Total volume
  ✅ title?: string                              // Default: "Hidrograf Banjir Rencana"
  ✅ primaryColor?: string                       // Default: "#0d9488"
  ✅ height?: number                             // Default: 400 (px)
}
```

### HydrographInsights
```typescript
interface Props {
  ✅ data: [{time: number, discharge: number}]  // Required
  ✅ qPeak: number                               // Required
  ✅ tPeak: number                               // Required
  ✅ volume: number                              // Required
  ✅ unit?: string                               // Default: "m³/s"
}
```

### ComparativeHydrographChart
```typescript
interface Props {
  ✅ data: [{time: number, [key]: number}]      // Combined data
  ✅ scenarios: [{                              // Required
    key: string,
    label: string,
    color: string,
    qPeak?: number,
    tPeak?: number
  }]
  ✅ title?: string                              // Default: "Perbandingan Hidrograf"
  ✅ height?: number                             // Default: 450
  ✅ showLegend?: boolean                        // Default: true
}
```

---

## 🔄 Integration Examples

### ✅ Dalam FloodDischargeCalculator

```typescript
// Already integrated!
// See: components/FloodDischargeCalculator.tsx line ~480

<FloodHydrographChart 
  data={hydrographData}
  qPeak={qPeak}
  tPeak={tPeak}
  volume={volume}
  title="Hidrograf Banjir Rencana"
  primaryColor="#0d9488"
  height={400}
/>
```

### ✅ Dalam Custom Component

```typescript
export const MyComponent = () => {
  const { data, qPeak, tPeak } = calculateHydrograph();
  
  return (
    <div className="space-y-6 p-6">
      <HydrographInsights 
        data={data}
        qPeak={qPeak}
        tPeak={tPeak}
        volume={0}
      />
      <FloodHydrographChart 
        data={data}
        qPeak={qPeak}
        tPeak={tPeak}
      />
    </div>
  );
};
```

### ✅ Responsive Layout

```typescript
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  {/* Sidebar */}
  <div className="lg:col-span-1">
    {/* Controls */}
  </div>
  
  {/* Main Content */}
  <div className="lg:col-span-3 space-y-6">
    <HydrographInsights {...props} />
    <FloodHydrographChart {...props} />
  </div>
</div>
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Chart blank | Check data array is not empty |
| Tooltip not showing | Hover over chart area |
| Grid lines too dark | That's stylistic, can customize |
| Colors not matching | Verify `primaryColor` prop exact value |
| Component not found | Ensure import path is correct |
| Styling looks off | Check Tailwind CSS is installed |

---

## 🚀 Performance Tips

```typescript
// ✅ Good: For large datasets (>200 points)
const optimizedData = useMemo(() => {
  if (data.length > 200) {
    const step = Math.ceil(data.length / 100);
    return data.filter((_, idx) => idx % step === 0);
  }
  return data;
}, [data]);

<FloodHydrographChart data={optimizedData} {...props} />

// ❌ Avoid: Recalculating data on every render
const chart = <FloodHydrographChart data={calculateHydrograph()} />
```

---

## 📦 File Locations

```typescript
// Components
import { FloodHydrographChart } from './components/FloodHydrographChart';
import { HydrographInsights } from './components/HydrographInsights';
import { ComparativeHydrographChart } from './components/ComparativeHydrographChart';

// Documentation
// → docs/FLOOD_HYDROGRAPH_VISUALIZATION.md
// → docs/HYDROGRAPH_EXAMPLES.md
// → HYDROGRAPH_REFACTORING_SUMMARY.md
```

---

## 📚 Documentation Map

| Document | Purpose | Location |
|----------|---------|----------|
| FLOOD_HYDROGRAPH_VISUALIZATION.md | Detailed API & features | docs/ |
| HYDROGRAPH_EXAMPLES.md | 6 complete usage examples | docs/ |
| HYDROGRAPH_REFACTORING_SUMMARY.md | Summary of all changes | root |
| This file | Quick reference | root |

---

## ✅ Validation Checklist

Before using in production:

- [ ] Data format is `{time, discharge}` objects
- [ ] `qPeak` and `tPeak` are calculated correctly  
- [ ] `height` prop is set appropriately
- [ ] `primaryColor` is valid hex color
- [ ] All required props are provided
- [ ] Component renders without console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] Tooltip appears on hover

---

## 🎯 Common Workflows

### Workflow 1: Calculate Then Display
```typescript
// 1. Calculate hydrograph
const Q = 0.278 * C * I * A;  // Rational method
const hydrograph = generateRationalHydrograph(Q, tc);

// 2. Find peak
const peak = findMaxDischarge(hydrograph);

// 3. Display
<FloodHydrographChart 
  data={hydrograph}
  qPeak={peak.discharge}
  tPeak={peak.time}
/>
```

### Workflow 2: Compare Multiple Scenarios
```typescript
// 1. Calculate multiple hydrographs
const scenarios = [
  { q2: calculateQ2(), q5: calculateQ5(), ... },
  ...
];

// 2. Combine data
const combined = combineHydrographs(scenarios);

// 3. Display comparison
<ComparativeHydrographChart 
  data={combined}
  scenarios={[...]}
/>
```

### Workflow 3: Real-time Updates
```typescript
const [params, setParams] = useState({A: 50, L: 15});

useEffect(() => {
  const hydrograph = recalculate(params);
  setHydrograph(hydrograph);
}, [params]);

return (
  <FloodHydrographChart data={hydrograph} {...props} />
);
```

---

## 🔗 Dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "recharts": "^2.15.4",
    "lucide-react": "latest",
    "tailwindcss": "^3.0.0"
  }
}
```

Verify versions:
```bash
npm ls recharts
npm ls lucide-react
```

---

## 🆘 Getting Help

1. **Quick Issues:** Check "🐛 Common Issues" section above
2. **API Questions:** See `FLOOD_HYDROGRAPH_VISUALIZATION.md`
3. **Usage Examples:** Check `HYDROGRAPH_EXAMPLES.md` (6 examples)
4. **Component Code:** Direct file `components/FloodHydrographChart.tsx`
5. **TypeScript Help:** Hover over components in VS Code

---

## 💡 Pro Tips

✨ **Tip 1:** Use `useMemo` untuk large datasets
```typescript
const memoData = useMemo(() => processData(data), [data]);
```

✨ **Tip 2:** Customize peak color dengan conditional
```typescript
const color = qPeak > THRESHOLD ? "#ef4444" : "#0d9488";
```

✨ **Tip 3:** Add description di Card untuk context
```typescript
<Card description="Flow analysis untuk Q100 (100 tahun)">
  <FloodHydrographChart {...props} />
</Card>
```

✨ **Tip 4:** Combine dengan HydrographInsights untuk complete view
```typescript
<> 
  <HydrographInsights {...props} />
  <FloodHydrographChart {...props} />
</>
```

---

## 📝 Version Info

- **Version:** 1.0.0
- **Status:** Production Ready ✅
- **Last Updated:** February 15, 2026
- **Compatible:** React 18+, TypeScript 4.5+

---

**Need more details?** 📖 Check full documentation in `docs/` folder
