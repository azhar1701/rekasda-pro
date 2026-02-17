# Flood Hydrograph Visualization - Enhanced Components

## Overview

Komponen visualization untuk Flood Hydrograph telah di-refactor dan di-enhance dengan design yang modern, clean, dan profesional. Menggunakan Tailwind CSS dan Recharts untuk membuat dashboard yang responsif dan intuitif.

## Komponen yang Disediakan

### 1. **FloodHydrographChart** 
File: `components/FloodHydrographChart.tsx`

Komponen utama untuk menampilkan area chart hydrograph dengan style modern.

#### Features:
- **Area Chart dengan Gradient Fill**: Vertical gradient yang fade ke bawah untuk visual representation water volume
- **Custom Interactive Tooltip**: Menampilkan Waktu (jam) dan Debit (m³/s) dengan semi-transparent background dan backdrop blur
- **Subtle Grid**: Dashed grid lines yang very light gray untuk aesthetic yang clean
- **Clean Axes**: Tick labels dengan font sans-serif, tanpa axis lines, hanya grid
- **Peak Indicator**: Automatic annotation untuk Q-peak (debit maksimal)
- **Reference Line**: Garis horizontal pada peak discharge untuk reference visual
- **Fully Responsive**: Maintains aspect ratio dan responsive di semua ukuran layar
- **Header dengan Statistics**: Menampilkan Q-peak dan T-peak values
- **Footer Info**: Durasi total dan jumlah data points

#### Props:
```typescript
interface FloodHydrographChartProps {
  data: HydrographDataPoint[];      // Array of {time, discharge}
  qPeak?: number;                   // Peak discharge value (m³/s)
  tPeak?: number;                   // Time to peak (hours)
  title?: string;                   // Chart title (default: "Hidrograf Banjir Rencana")
  primaryColor?: string;            // Primary color (default: "#0d9488" teal)
  height?: number;                  // Chart height in px (default: 400)
  volume?: number;                  // Total water volume (juta m³)
}
```

#### Usage:
```typescript
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

---

### 2. **HydrographInsights**
File: `components/HydrographInsights.tsx`

Komponen untuk menampilkan key statistics dan insights dari hydrograph dalam grid format yang modern.

#### Features:
- **Responsive Grid**: 1 column pada mobile, 2 di tablet, 4 di desktop
- **Color-coded Cards**: Setiap metric memiliki warna unik (teal, blue, emerald, orange)
- **Icon Support**: Menggunakan lucide-react icons untuk visual clarity
- **Hover Effects**: Subtle scale up dan shadow effect pada hover
- **Statistics Display**: 
  - Debit Puncak (Q-peak)
  - Waktu Puncak (T-peak)
  - Volume Total
  - Durasi Total
- **Descriptions**: Setiap metric memiliki penjelasan untuk konteks engineering

#### Props:
```typescript
interface HydrographInsightsProps {
  data: HydrographDataPoint[];  // Array of {time, discharge}
  qPeak: number;                // Peak discharge (m³/s)
  tPeak: number;                // Time to peak (hours)
  volume: number;               // Total volume (juta m³)
  unit?: string;                // Unit display (default: "m³/s")
}
```

#### Usage:
```typescript
<HydrographInsights 
  data={hydrographData}
  qPeak={qPeak}
  tPeak={tPeak}
  volume={volume}
/>
```

---

## Data Structure

Kedua komponen mengharapkan data dalam format:

```typescript
interface HydrographDataPoint {
  time: number;      // Waktu dalam jam (e.g., 0, 0.5, 1.0, ...)
  discharge: number; // Debit dalam m³/s (e.g., 0, 5.2, 10.5, ...)
}
```

Contoh data:
```typescript
const hydrographData = [
  { time: 0, discharge: 0 },
  { time: 0.5, discharge: 2.5 },
  { time: 1.0, discharge: 5.2 },
  { time: 1.5, discharge: 8.9 },
  { time: 2.0, discharge: 12.3 },  // Peak
  { time: 2.5, discharge: 10.1 },
  { time: 3.0, discharge: 7.8 },
  { time: 3.5, discharge: 5.2 },
  { time: 4.0, discharge: 2.8 },
  { time: 4.5, discharge: 0.5 },
  { time: 5.0, discharge: 0 }
];
```

---

## Integration dengan FloodDischargeCalculator

Komponen telah terintegrasi di `FloodDischargeCalculator.tsx`:

```typescript
import { FloodHydrographChart } from './FloodHydrographChart';
import { HydrographInsights } from './HydrographInsights';

// Dalam JSX render:
<>
  <HydrographInsights 
    data={hydrographData}
    qPeak={qPeak}
    tPeak={tPeak}
    volume={volume}
  />
  
  <FloodHydrographChart 
    data={hydrographData}
    qPeak={qPeak}
    tPeak={tPeak}
    volume={volume}
    title="Hidrograf Banjir Rencana"
    primaryColor="#0d9488"
    height={400}
  />
</>
```

---

## Styling & Customization

### Color Customization
Primary color dapat disesuaikan via `primaryColor` prop:

```typescript
<FloodHydrographChart 
  data={data}
  primaryColor="#3b82f6"  // Blue
  // atau
  primaryColor="#06b6d4"  // Cyan
  // atau
  primaryColor="#ec4899"  // Pink
/>
```

### Responsive Design
Komponen sudah fully responsive:
- **Mobile (< 640px)**: Single column, height auto
- **Tablet (640px - 1024px)**: 2-column grid untuk Insights
- **Desktop (> 1024px)**: 4-column grid untuk Insights

### Tailwind Classes
Komponen menggunakan Tailwind CSS classes untuk styling:
- `rounded-2xl` - Border radius yang modern
- `shadow-sm hover:shadow-md` - Subtle shadows dengan hover effect
- `backdrop-blur-sm` - Backdrop blur pada tooltip untuk aesthetic modern
- `transition-all duration-300` - Smooth transitions

---

## Best Practices

### 1. Data Validation
Pastikan data yang dikirim valid:
```typescript
if (!data || data.length === 0) {
  return <div>No data available</div>;
}
```

### 2. Performance
Untuk data set besar (> 200 points), pertimbangkan untuk:
- Mengurangi jumlah points dengan aggregation
- Menggunakan `useMemo` untuk mencegah re-renders

```typescript
const memoizedData = useMemo(() => aggregateData(data, 50), [data]);
<FloodHydrographChart data={memoizedData} {...props} />
```

### 3. Accessibility
- Labels sudah jelas dan deskriptif
- Colors dipilih untuk readability
- Font sizes sesuai dengan best practices

---

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE 11: ⚠️ Requires polyfills

---

## Dependencies

- **recharts** (>=2.15.4): Chart library
- **lucide-react**: Icon library untuk HydrographInsights
- **tailwindcss**: Styling

---

## Tips untuk Engineering Dashboard

### 1. Peak Detection
Komponen secara otomatis menemukan dan menampilkan peak:
```typescript
const peakPoint = data.reduce((max, point) =>
  point.discharge > max.discharge ? point : max
);
```

### 2. Volume Calculation
Volume dihitung dari area di bawah kurva (integral).

### 3. Time to Peak
Nilai `tPeak` sangat penting untuk:
- Emergency response planning
- Gate operation timing
- Flood warning systems

---

## Troubleshooting

### Chart tidak muncul
1. Pastikan data bukan array kosong
2. Check console untuk error messages
3. Verify container height tidak `auto`

### Tooltip tidak muncul
1. Mouse hover sudah dicoba?
2. Check z-index styling
3. Backdrop blur memerlukan browser yang support CSS backdrop-filter

### Legend/Labels tidak terlihat
1. Gunakan `inspect element` untuk check sizing
2. Verify font size di axis configuration
3. Check color contrast

---

## Future Enhancements

Beberapa fitur yang bisa ditambahkan:
- [ ] Export chart sebagai PNG/PDF
- [ ] Compare multiple hydrographs
- [ ] Animate hydrograph generation
- [ ] Add recession curve analysis
- [ ] Integration dengan water balance analysis
- [ ] Historical hydrograph comparison

---

## Examples

### Contoh 1: Rational Method Hydrograph
```typescript
const rationalHydrograph = generateRationalHydrograph(Q, tc);
<FloodHydrographChart 
  data={rationalHydrograph}
  qPeak={Q}
  tPeak={tc}
  title="Hidrograf Rasional"
/>
```

### Contoh 2: Nakayasu Method Hydrograph
```typescript
const nakayasuHydrograph = generateNakayasuHydrograph(params);
<HydrographInsights 
  data={nakayasuHydrograph}
  qPeak={params.qPeak}
  tPeak={params.tPeak}
  volume={calculateVolume(nakayasuHydrograph)}
/>
```

---

## Version History

- **v1.0.0** (Feb 2026): Initial release
  - Area Chart dengan gradient fill
  - Custom interactive tooltip
  - Peak indicator annotation
  - Responsive design
  - HydrographInsights component

---

## Author Notes

Komponen dirancang dengan prinsip:
1. **Clean & Modern**: Aesthetic yang profesional untuk engineering dashboard
2. **Performance**: Optimized untuk smooth interactions
3. **Accessibility**: Readable dan accessible untuk semua users
4. **Maintainability**: Modular dan mudah di-customize
5. **Engineering-focused**: Menampilkan metrics yang paling penting untuk hydro engineers

---
