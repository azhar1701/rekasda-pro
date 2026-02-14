# Flood Hydrograph Charts - Usage Guide & Examples

## Quick Start

### 1. Import Komponen
```typescript
import { FloodHydrographChart } from './components/FloodHydrographChart';
import { HydrographInsights } from './components/HydrographInsights';
import { ComparativeHydrographChart } from './components/ComparativeHydrographChart';
```

### 2. Prepare Data
```typescript
// Minimal data structure
const hydrographData = [
  { time: 0, discharge: 0 },
  { time: 1, discharge: 5 },
  { time: 2, discharge: 12 },  // Peak
  { time: 3, discharge: 8 },
  { time: 4, discharge: 2 },
  { time: 5, discharge: 0 }
];

const qPeak = 12;     // m³/s
const tPeak = 2;      // hour
const volume = 100;   // juta m³
```

### 3. Render Chart
```typescript
<FloodHydrographChart 
  data={hydrographData}
  qPeak={qPeak}
  tPeak={tPeak}
  volume={volume}
/>
```

---

## Component Details & Examples

### Example 1: Basic Hydrograph Display

```typescript
import React, { useState, useEffect } from 'react';
import { FloodHydrographChart } from './components/FloodHydrographChart';

export const BasicHydrograph = () => {
  const [hydrographData, setHydrographData] = useState([]);
  const [qPeak, setQPeak] = useState(0);
  const [tPeak, setTPeak] = useState(0);

  useEffect(() => {
    // Simulate hydrograph calculation
    const simulated = generateRationalHydrograph(10, 2);
    setHydrographData(simulated);
    
    const maxPoint = simulated.reduce((max, p) => 
      p.discharge > max.discharge ? p : max
    );
    setQPeak(maxPoint.discharge);
    setTPeak(maxPoint.time);
  }, []);

  return (
    <div className="p-6">
      <FloodHydrographChart 
        data={hydrographData}
        qPeak={qPeak}
        tPeak={tPeak}
        title="Hidrograf Banjir Rencana - Metode Rasional"
      />
    </div>
  );
};
```

---

### Example 2: With Insights Card

```typescript
import { FloodHydrographChart } from './components/FloodHydrographChart';
import { HydrographInsights } from './components/HydrographInsights';

export const HydrographWithInsights = () => {
  const { hydrographData, qPeak, tPeak, volume } = useHydrographCalculation();

  return (
    <div className="space-y-6 p-6">
      {/* Statistics Cards */}
      <HydrographInsights 
        data={hydrographData}
        qPeak={qPeak}
        tPeak={tPeak}
        volume={volume}
      />

      {/* Main Chart */}
      <FloodHydrographChart 
        data={hydrographData}
        qPeak={qPeak}
        tPeak={tPeak}
        volume={volume}
        height={450}
      />
    </div>
  );
};
```

---

### Example 3: Multiple Return Periods Comparison

```typescript
import { ComparativeHydrographChart } from './components/ComparativeHydrographChart';

export const ReturnPeriodComparison = () => {
  // Generate hydrographs for different return periods
  const hydrographs = calculateMultipleReturnPeriods();

  // Combine data for chart
  const comparativeData = combineHydrographs(
    hydrographs.q2,
    hydrographs.q5,
    hydrographs.q10,
    hydrographs.q25,
    hydrographs.q50,
    hydrographs.q100
  );

  const scenarios = [
    {
      key: 'q2',
      label: 'Q2 (2 tahun)',
      color: '#a3e635',
      qPeak: hydrographs.q2.qPeak,
      tPeak: hydrographs.q2.tPeak,
    },
    {
      key: 'q5',
      label: 'Q5 (5 tahun)',
      color: '#84cc16',
      qPeak: hydrographs.q5.qPeak,
      tPeak: hydrographs.q5.tPeak,
    },
    {
      key: 'q10',
      label: 'Q10 (10 tahun)',
      color: '#65a30d',
      qPeak: hydrographs.q10.qPeak,
      tPeak: hydrographs.q10.tPeak,
    },
    {
      key: 'q25',
      label: 'Q25 (25 tahun)',
      color: '#d97706',
      qPeak: hydrographs.q25.qPeak,
      tPeak: hydrographs.q25.tPeak,
    },
    {
      key: 'q50',
      label: 'Q50 (50 tahun)',
      color: '#dc2626',
      qPeak: hydrographs.q50.qPeak,
      tPeak: hydrographs.q50.tPeak,
    },
    {
      key: 'q100',
      label: 'Q100 (100 tahun)',
      color: '#7f1d1d',
      qPeak: hydrographs.q100.qPeak,
      tPeak: hydrographs.q100.tPeak,
    },
  ];

  return (
    <div className="p-6">
      <ComparativeHydrographChart 
        data={comparativeData}
        scenarios={scenarios}
        title="Perbandingan Hidrograf - Berbagai Kala Ulang"
        height={500}
      />
    </div>
  );
};

// Helper function to combine hydrographs
function combineHydrographs(...hydrographs) {
  const maxLength = Math.max(...hydrographs.map(h => h.data.length));
  const combined = [];

  for (let i = 0; i < maxLength; i++) {
    const point: any = { time: 0 };
    hydrographs.forEach((h, idx) => {
      if (i < h.data.length) {
        point.time = h.data[i].time;
        point[`q${[2, 5, 10, 25, 50, 100][idx]}`] = h.data[i].discharge;
      }
    });
    combined.push(point);
  }

  return combined;
}
```

---

### Example 4: Color Customization

```typescript
// Use different primary colors
export const ColorCustomization = () => {
  const data = generateHydrograph();
  const { qPeak, tPeak } = analyzeHydrograph(data);

  return (
    <div className="grid grid-cols-2 gap-6 p-6">
      {/* Teal (Default) */}
      <FloodHydrographChart 
        data={data}
        qPeak={qPeak}
        tPeak={tPeak}
        primaryColor="#0d9488"
        title="Tema Teal"
      />

      {/* Blue */}
      <FloodHydrographChart 
        data={data}
        qPeak={qPeak}
        tPeak={tPeak}
        primaryColor="#3b82f6"
        title="Tema Blue"
      />

      {/* Purple */}
      <FloodHydrographChart 
        data={data}
        qPeak={qPeak}
        tPeak={tPeak}
        primaryColor="#a855f7"
        title="Tema Purple"
      />

      {/* Red */}
      <FloodHydrographChart 
        data={data}
        qPeak={qPeak}
        tPeak={tPeak}
        primaryColor="#ef4444"
        title="Tema Red"
      />
    </div>
  );
};
```

---

### Example 5: Responsive Grid Layout

```typescript
import { Card } from './components/ui/Card';

export const ResponsiveLayout = () => {
  const { hydrographData, qPeak, tPeak, volume } = useHydrographCalculation();

  return (
    <div className="space-y-6 p-6">
      {/* Insights - Full width or 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Statistik Utama" fullHeight>
          <HydrographInsights 
            data={hydrographData}
            qPeak={qPeak}
            tPeak={tPeak}
            volume={volume}
          />
        </Card>

        <Card title="Informasi Deskriptif" fullHeight>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-slate-900">Parameter Input</p>
              <p className="text-slate-600">A = 50 km², L = 15 km, C = 0.7</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Metode Perhitungan</p>
              <p className="text-slate-600">Rational Method dengan Intensitas Empiris</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Kala Ulang</p>
              <p className="text-slate-600">Q100 (100 tahun)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Chart - Full width */}
      <Card title="Hidrograf Banjir Rencana" fullHeight>
        <FloodHydrographChart 
          data={hydrographData}
          qPeak={qPeak}
          tPeak={tPeak}
          volume={volume}
          height={500}
        />
      </Card>
    </div>
  );
};
```

---

### Example 6: Dynamic Updates with Form

```typescript
import { FloodHydrographChart } from './components/FloodHydrographChart';
import { HydrographInsights } from './components/HydrographInsights';

export const HydrographWithForm = () => {
  const [inputs, setInputs] = useState({ A: 50, L: 15, C: 0.7, I: 100 });
  const [hydrographData, setHydrographData] = useState([]);
  const [qPeak, setQPeak] = useState(0);
  const [tPeak, setTPeak] = useState(0);

  // Recalculate on input change
  useEffect(() => {
    const Q = calculateDischarge(inputs);
    const hydrograph = generateRationalHydrograph(Q, inputs.A * 1000 / inputs.L);
    
    setHydrographData(hydrograph);
    
    const maxPoint = hydrograph.reduce((max, p) => 
      p.discharge > max.discharge ? p : max
    );
    setQPeak(maxPoint.discharge);
    setTPeak(maxPoint.time);
  }, [inputs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
      {/* Input Form */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Luas DAS (km²)
          </label>
          <input
            type="number"
            value={inputs.A}
            onChange={(e) => setInputs({ ...inputs, A: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600"
          />

          <label className="block text-sm font-semibold text-slate-700 mt-4 mb-2">
            Panjang Sungai (km)
          </label>
          <input
            type="number"
            value={inputs.L}
            onChange={(e) => setInputs({ ...inputs, L: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600"
          />

          <label className="block text-sm font-semibold text-slate-700 mt-4 mb-2">
            Koef. Aliran (C)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={inputs.C}
            onChange={(e) => setInputs({ ...inputs, C: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600"
          />
        </div>
      </div>

      {/* Chart and Insights */}
      <div className="lg:col-span-3 space-y-6">
        <HydrographInsights 
          data={hydrographData}
          qPeak={qPeak}
          tPeak={tPeak}
          volume={0}
        />

        <FloodHydrographChart 
          data={hydrographData}
          qPeak={qPeak}
          tPeak={tPeak}
          height={400}
        />
      </div>
    </div>
  );
};
```

---

## Data Preparation Best Practices

### 1. Rational Method Example
```typescript
function generateRationalHydrograph(Q: number, tc: number) {
  const data = [];
  const totalTime = tc * 3;
  const timeStep = totalTime / 20;
  
  for (let t = 0; t <= totalTime; t += timeStep) {
    let discharge = 0;
    if (t <= tc) {
      discharge = Q * (t / tc);
    } else if (t <= tc * 2) {
      discharge = Q * (2 - t / tc);
    }
    data.push({ 
      time: parseFloat(t.toFixed(1)), 
      discharge: parseFloat(discharge.toFixed(2)) 
    });
  }
  
  return data;
}
```

### 2. Nakayasu Method Example
```typescript
function generateNakayasuHydrograph(A: number, L: number, Ro: number, Alpha: number) {
  // Implementation of Nakayasu equation
  // See hydrologic references for detailed equations
  
  const data = [];
  const qPeak = Ro * A / (0.3 * Alpha * L + 1);
  const tPeak = (0.8 * L) / Math.sqrt(Alpha * L);
  
  // Generate synthetic unit hydrograph
  for (let t = 0; t <= tPeak * 3; t += 0.1) {
    const q = calculateNakayasuDischarge(t, qPeak, tPeak);
    data.push({ time: parseFloat(t.toFixed(1)), discharge: parseFloat(q.toFixed(2)) });
  }
  
  return data;
}
```

---

## Performance Optimization

### Memoization for large datasets
```typescript
import { useMemo } from 'react';

export const OptimizedChart = ({ rawData }) => {
  // Memoize data processing
  const processedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    
    // Aggregate data if too many points
    if (rawData.length > 200) {
      const step = Math.ceil(rawData.length / 100);
      return rawData.filter((_, idx) => idx % step === 0);
    }
    
    return rawData;
  }, [rawData]);

  return (
    <FloodHydrographChart 
      data={processedData}
      qPeak={findPeak(processedData).discharge}
      tPeak={findPeak(processedData).time}
    />
  );
};
```

---

## Styling Customization

### Tailwind Configuration
Komponen sudah compatible dengan Tailwind CSS default config. Untuk custom styling:

```typescript
// Override default styles
<div className="custom-hydrograph-container">
  <div className="shadow-2xl rounded-3xl overflow-hidden">
    <FloodHydrographChart 
      data={data}
      qPeak={qPeak}
      tPeak={tPeak}
    />
  </div>
</div>

// CSS
<style jsx>{`
  .custom-hydrograph-container {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 2rem;
    border-radius: 1rem;
  }
`}</style>
```

---

## Testing

### Unit Test Example
```typescript
import { render, screen } from '@testing-library/react';
import { FloodHydrographChart } from './FloodHydrographChart';

describe('FloodHydrographChart', () => {
  it('renders chart with title', () => {
    const data = [{ time: 0, discharge: 0 }];
    render(
      <FloodHydrographChart 
        data={data}
        title="Test Chart"
        qPeak={10}
        tPeak={2}
      />
    );
    
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
  });

  it('displays peak values correctly', () => {
    const data = [
      { time: 0, discharge: 0 },
      { time: 2, discharge: 15 },
      { time: 4, discharge: 0 }
    ];
    
    const { container } = render(
      <FloodHydrographChart data={data} qPeak={15} tPeak={2} />
    );
    
    expect(container.textContent).toContain('15.00');
    expect(container.textContent).toContain('2.0');
  });
});
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Chart tidak muncul | Pastikan data array tidak kosong |
| Tooltip error | Update recharts ke v2.15+ |
| Color tidak jelas | Adjust `primaryColor` prop |
| Grid tidak terlihat | Check `opacity` setting di CartesianGrid |
| Performance lambat | Reduce data points atau use `useMemo` |

---

## File Reference

- **FloodHydrographChart.tsx** - Main area chart component
- **HydrographInsights.tsx** - Statistics card component
- **ComparativeHydrographChart.tsx** - Multi-scenario comparison chart
- **FloodDischargeCalculator.tsx** - Integration example

---

## API Reference

### FloodHydrographChart Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | HydrographDataPoint[] | required | Chart data |
| `qPeak` | number | undefined | Peak discharge value |
| `tPeak` | number | undefined | Time to peak |
| `title` | string | "Hidrograf Banjir Rencana" | Chart title |
| `primaryColor` | string | "#0d9488" | Primary color |
| `height` | number | 400 | Chart height (px) |
| `volume` | number | 0 | Total volume |

### HydrographInsights Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | HydrographDataPoint[] | required | Chart data |
| `qPeak` | number | required | Peak discharge |
| `tPeak` | number | required | Time to peak |
| `volume` | number | required | Total volume |
| `unit` | string | "m³/s" | Unit display |

### ComparativeHydrographChart Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | HydrographDataPoint[] | required | Combined chart data |
| `scenarios` | Scenario[] | required | Scenario definitions |
| `title` | string | "Perbandingan Hidrograf" | Chart title |
| `height` | number | 450 | Chart height (px) |
| `showLegend` | boolean | true | Show legend |

---

**Version:** 1.0.0  
**Last Updated:** February 15, 2026  
**Author:** Frontend Development Team
