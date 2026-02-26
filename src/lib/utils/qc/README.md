# Modul Quality Control Data Hujan - Production Grade

## 📋 Overview

Modul QC Data Hujan yang production-ready dengan:
- ✅ Hardcoded statistical tables (anti-hallucination)
- ✅ Comprehensive error handling
- ✅ Type-safe TypeScript implementation
- ✅ Engineer override capability
- ✅ Detailed logging & debugging

## 🏗️ Architecture

```
src/
├── lib/utils/qc/
│   └── dataQualityMath.ts          # Core math engine
├── hooks/
│   └── useDataQualityControl.ts    # React integration hook
├── components/ui/
│   ├── DataQualityDashboard.tsx    # Main UI component
│   └── QCDetailsPanel.tsx          # Detailed results panel
└── stores/
    └── useHydrologyStore.ts        # State management (updated)
```

## 🚀 Usage Example

### Basic Implementation

```typescript
import { DataQualityDashboard } from '@/components/ui/DataQualityDashboard';
import { QCDetailsPanel } from '@/components/ui/QCDetailsPanel';
import { useDataQualityControl } from '@/hooks/useDataQualityControl';
import { useState } from 'react';

function FrequencyAnalysisPage() {
  const { runQC } = useDataQualityControl();
  const [qcResult, setQcResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleRunQC = async () => {
    try {
      // Your rainfall data (minimum 10 years)
      const rainfallData = [
        { tahun: 2014, hujan: 120.5 },
        { tahun: 2015, hujan: 135.2 },
        { tahun: 2016, hujan: 98.7 },
        { tahun: 2017, hujan: 142.3 },
        { tahun: 2018, hujan: 115.8 },
        { tahun: 2019, hujan: 128.4 },
        { tahun: 2020, hujan: 105.9 },
        { tahun: 2021, hujan: 138.6 },
        { tahun: 2022, hujan: 122.1 },
        { tahun: 2023, hujan: 131.7 },
      ];

      const result = runQC(rainfallData);
      setQcResult(result);
      
      console.log('QC completed:', result);
    } catch (error) {
      console.error('QC failed:', error);
    }
  };

  const handleProceed = () => {
    // Navigate to frequency analysis
    console.log('Proceeding to frequency analysis...');
  };

  return (
    <div className="space-y-6">
      <button onClick={handleRunQC}>Run Quality Control</button>
      
      <DataQualityDashboard onProceed={handleProceed} />
      
      {qcResult && showDetails && (
        <QCDetailsPanel result={qcResult} />
      )}
    </div>
  );
}
```

### Direct API Usage

```typescript
import { runFullQC, validateDataLength, QCValidationError } from '@/lib/utils/qc/dataQualityMath';

// Validate data first
try {
  validateDataLength(data);
} catch (error) {
  if (error instanceof QCValidationError) {
    console.error(`Validation failed: ${error.message} (Code: ${error.code})`);
  }
}

// Run full QC
const result = runFullQC(data);

console.log('Konsisten:', result.isKonsisten);
console.log('Bebas Outlier:', result.isBebasOutlier);
console.log('Homogen:', result.isHomogen);

// Access detailed results
console.log('RAPS:', result.details.raps);
console.log('Grubbs:', result.details.grubbs);
console.log('Homogenitas:', result.details.homogenitas);
```

## 🔒 Error Handling

### Validation Errors

```typescript
try {
  runFullQC(data);
} catch (error) {
  if (error instanceof QCValidationError) {
    switch (error.code) {
      case 'INSUFFICIENT_DATA':
        // Handle: less than 10 years
        break;
      case 'EXCESSIVE_DATA':
        // Handle: more than 100 years
        break;
      case 'NEGATIVE_RAINFALL':
        // Handle: negative values
        break;
      case 'DUPLICATE_YEARS':
        // Handle: duplicate years
        break;
      case 'INVALID_DATA_TYPE':
        // Handle: non-numeric data
        break;
      case 'NON_FINITE_VALUE':
        // Handle: NaN or Infinity
        break;
    }
  }
}
```

## 📊 Statistical Tables

### Hardcoded Tables (α = 5%)

- **Grubbs Table**: n = 10-50
- **RAPS Q Table**: n = 10-50
- **RAPS R Table**: n = 10-50
- **F-Table**: df = 4-25
- **t-Table**: df = 8-50

Linear interpolation for intermediate values.

## 🎯 Override Workflow

1. **QC Fails** → Red blocking banner appears
2. **Engineer Review** → Analyze detailed results
3. **Override Decision** → Click "Force Override" button
4. **Warning State** → Yellow banner with risk warning
5. **Proceed** → Continue to frequency analysis

## 🧪 Testing

```typescript
// Test with valid data
const validData = Array.from({ length: 20 }, (_, i) => ({
  tahun: 2000 + i,
  hujan: 100 + Math.random() * 50
}));

const result = runFullQC(validData);
console.assert(result.isKonsisten === true);

// Test with insufficient data
try {
  runFullQC([{ tahun: 2020, hujan: 100 }]);
} catch (error) {
  console.assert(error instanceof QCValidationError);
  console.assert(error.code === 'INSUFFICIENT_DATA');
}

// Test with outliers
const dataWithOutlier = [
  ...validData,
  { tahun: 2021, hujan: 500 } // Extreme outlier
];

const outlierResult = runFullQC(dataWithOutlier);
console.assert(outlierResult.isBebasOutlier === false);
console.assert(outlierResult.details.grubbs.outliers.length > 0);
```

## 📈 Performance

- **Validation**: O(n)
- **RAPS Test**: O(n log n) - sorting
- **Grubbs Test**: O(n)
- **Homogeneity Test**: O(n)
- **Total**: O(n log n)

Optimized for datasets up to 100 years.

## 🔧 Configuration

### Environment Variables

```env
# Development mode enables console logging
VITE_ENV=development
```

### Store Configuration

```typescript
// In useHydrologyStore.ts
qcStatus: { konsisten: boolean; bebasOutlier: boolean; homogen: boolean } | null;
isQCOverridden: boolean;
```

## 📝 Standards Compliance

- **SNI 2415:2016**: Flood discharge calculations
- **SNI 6738:2015**: Dependable flow analysis
- **SNI 19-6728.1-2002**: Water balance methodology

## 🐛 Debugging

```typescript
import { getQCSummary } from '@/lib/utils/qc/dataQualityMath';

const result = runFullQC(data);
console.log(getQCSummary(result));
// Output: "QC: 2/3 passed | Konsisten: ✓ | Outlier: ✗ | Homogen: ✓"
```

## 🚨 Common Issues

### Issue: "Data terlalu pendek"
**Solution**: Ensure minimum 10 years of data

### Issue: "Standar deviasi nol"
**Solution**: Check if all rainfall values are identical

### Issue: "Tahun duplikat"
**Solution**: Remove duplicate year entries

## 📦 Dependencies

- React 18.3+
- TypeScript 5.9+
- Zustand (state management)
- Lucide React (icons)

## 🎓 References

1. Soewarno (1995) - Hidrologi Aplikasi Metode Statistik
2. SNI 2415:2016 - Tata Cara Perhitungan Debit Banjir Rencana
3. Grubbs, F.E. (1969) - Procedures for Detecting Outlying Observations
4. RAPS Test - Rescaled Adjusted Partial Sums

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Maintainer**: RekaSDA Pro Team
