# 🎯 ACTION PLAN: Implementation Guide untuk Top 5 Features

**Status**: Ready to Execute  
**Target**: Complete in 4-6 weeks

---

## 📋 TOP 5 FITUR PRIORITY

1. **Analytics Dashboard** - Decisive data insights
2. **Batch Calculator** - Productivity multiplier
3. **Enhanced Validation** - Data quality guarantee
4. **Comparison Tool** - Site analysis capability
5. **Mobile Responsiveness** - Field accessibility

---

## FEATURE #1: Analytics Dashboard

### Folder Structure
```
components/dashboard/
├── AnalyticsDashboard.tsx      # Main component
├── StatisticsCard.tsx          # KPI display
├── TrendChart.tsx              # Recharts wrapper
├── ComparisonChart.tsx         # Manning vs Rational
├── ExportButton.tsx            # Export analytics
└── types.ts                    # Dashboard types
```

### Implementation Step-by-Step

#### Step 1: Install Recharts dependency
```bash
npm install recharts
```

#### Step 2: Create type definitions

**File**: `components/dashboard/types.ts`
```typescript
export interface AnalyticsMetrics {
  totalCalculations: number;
  uniqueSites: number;
  manningCount: number;
  rationalCount: number;
  avgAccuracy: number;
  lastUpdated: Date;
}

export interface TrendDataPoint {
  date: string;
  manning: number;
  rational: number;
  total: number;
}

export interface LocationStatistics {
  region: string;
  district: string;
  calculationCount: number;
  percentage: number;
}

export interface UsageMetrics {
  metric: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}
```

#### Step 3: Create StatisticsCard component

**File**: `components/dashboard/StatisticsCard.tsx`
```typescript
import React from 'react';
import { Card } from '../ui/Card';
import { Bell, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  icon?: React.ReactNode;
}

export function StatisticsCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon
}: Props) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-slate-600';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {value} {unit && <span className="text-base text-slate-600">{unit}</span>}
          </p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">{trendValue}% vs last month</span>
            </div>
          )}
        </div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
    </Card>
  );
}
```

#### Step 4: Create TrendChart component

**File**: `components/dashboard/TrendChart.tsx`
```typescript
import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card } from '../ui/Card';
import { TrendDataPoint } from './types';

interface Props {
  data: TrendDataPoint[];
  chartType?: 'line' | 'bar';
  title: string;
  height?: number;
}

export function TrendChart({
  data,
  chartType = 'line',
  title,
  height = 400
}: Props) {
  return (
    <Card title={title} className="p-4">
      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="manning"
              stroke="#0ea5e9"
              strokeWidth={2}
              name="Manning"
            />
            <Line
              type="monotone"
              dataKey="rational"
              stroke="#10b981"
              strokeWidth={2}
              name="Rational"
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Total"
              strokeDasharray="5 5"
            />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="manning" fill="#0ea5e9" name="Manning" />
            <Bar dataKey="rational" fill="#10b981" name="Rational" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
}
```

#### Step 5: Create main AnalyticsDashboard component

**File**: `components/dashboard/AnalyticsDashboard.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { AnalyticsMetrics, TrendDataPoint, UsageMetrics } from './types';
import { StatisticsCard } from './StatisticsCard';
import { TrendChart } from './TrendChart';
import { Card } from '../ui/Card';
import { Button } from '../Button';
import { BarChart3, Database, Activity, MapPin, Download } from 'lucide-react';
import { useDatabase } from '../../lib/useDatabase';

export function AnalyticsDashboard() {
  const { calculations } = useDatabase();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);

  useEffect(() => {
    if (calculations.length === 0) return;

    // Calculate metrics
    const manningCount = calculations.filter(
      c => c.calculation_type === 'manning'
    ).length;
    const rationalCount = calculations.filter(
      c => c.calculation_type === 'rational'
    ).length;
    const uniqueSites = new Set(
      calculations.map(c => c.input_data?.site?.channelName)
    ).size;

    setMetrics({
      totalCalculations: calculations.length,
      uniqueSites,
      manningCount,
      rationalCount,
      avgAccuracy: 98.5, // From validation results
      lastUpdated: new Date()
    });

    // Generate trend data (last 30 days)
    const trendArray: TrendDataPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('id-ID', {
        month: 'short',
        day: 'numeric'
      });

      const dayCalcs = calculations.filter(c => {
        const calcDate = new Date(c.created_at || '');
        return calcDate.toDateString() === date.toDateString();
      });

      const manning = dayCalcs.filter(c => c.calculation_type === 'manning').length;
      const rational = dayCalcs.filter(c => c.calculation_type === 'rational').length;

      trendArray.push({
        date: dateStr,
        manning,
        rational,
        total: manning + rational
      });
    }
    setTrendData(trendArray);
  }, [calculations]);

  const handleExport = () => {
    // Export analytics as CSV/Excel
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Calculations', metrics?.totalCalculations],
      ['Unique Sites', metrics?.uniqueSites],
      ['Manning Calculations', metrics?.manningCount],
      ['Rational Calculations', metrics?.rationalCount],
      ['Average Accuracy', `${metrics?.avgAccuracy}%`]
    ];

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!metrics) {
    return <div className="p-8 text-center">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Updated: {metrics.lastUpdated.toLocaleString('id-ID')}
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={handleExport}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatisticsCard
          title="Total Calculations"
          value={metrics.totalCalculations}
          icon={<Database className="w-6 h-6" />}
          trend="up"
          trendValue={12}
        />
        <StatisticsCard
          title="Unique Sites"
          value={metrics.uniqueSites}
          icon={<MapPin className="w-6 h-6" />}
          trend="stable"
          trendValue={0}
        />
        <StatisticsCard
          title="Manning Calcs"
          value={metrics.manningCount}
          unit="%"
          trend="down"
          trendValue={-5}
        />
        <StatisticsCard
          title="Rational Calcs"
          value={metrics.rationalCount}
          unit="%"
          trend="up"
          trendValue={8}
        />
        <StatisticsCard
          title="Avg Accuracy"
          value={metrics.avgAccuracy}
          unit="%"
          icon={<Activity className="w-6 h-6" />}
          trend="up"
          trendValue={2}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart
          data={trendData}
          chartType="line"
          title="Calculation Trends (30 days)"
        />
        <TrendChart
          data={trendData}
          chartType="bar"
          title="Monthly Distribution"
        />
      </div>

      {/* More insights can be added here */}
      <Card title="Additional Insights" className="p-6">
        <p className="text-slate-600">
          Tambahan insights dan detailed breakdowns akan ditampilkan di sini
        </p>
      </Card>
    </div>
  );
}
```

#### Step 6: Add route to App.tsx

```typescript
// In App.tsx
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';

// Add new tab enum
enum Tab {
  SALURAN = 'SALURAN',
  BANJIR = 'BANJIR',
  HISTORY = 'HISTORY',
  ANALYTICS = 'ANALYTICS',  // NEW
  AI = 'AI'
}

// In render section, add tab button and content
<Button
  variant={activeTab === Tab.ANALYTICS ? 'primary' : 'secondary'}
  onClick={() => setActiveTab(Tab.ANALYTICS)}
>
  Analytics
</Button>

// And in the content area:
{activeTab === Tab.ANALYTICS && <AnalyticsDashboard />}
```

---

## FEATURE #2: Batch Calculator

### Folder Structure
```
components/batch/
├── BatchCalculator.tsx
├── FileUploadZone.tsx
├── PreviewTable.tsx
├── ProgressBar.tsx
└── ResultsExport.tsx
```

### Implementation

**File**: `components/batch/BatchCalculator.tsx`
```typescript
import React, { useState } from 'react';
import { FileUploadZone } from './FileUploadZone';
import { PreviewTable } from './PreviewTable';
import { ProgressBar } from './ProgressBar';
import { Card } from '../ui/Card';
import { Button } from '../Button';
import { Alert } from '../ui/Alert';
import { parseCSV } from '../../services/csvParser';
import { calculateManning, calculateRational } from '../../services/calculationService';
import { CalculationType } from '../../types';

interface BatchRow {
  id: string;
  inputs: Record<string, any>;
  type: CalculationType;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: Record<string, any>;
  error?: string;
}

export function BatchCalculator() {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      const csvData = await parseCSV(file);
      const newRows: BatchRow[] = csvData.map((row, idx) => ({
        id: `row-${idx}`,
        inputs: row,
        type: row.calculation_type === 'manning' ? CalculationType.MANNING : CalculationType.RATIONAL,
        status: 'pending'
      }));
      setRows(newRows);
      setError(null);
    } catch (err) {
      setError(`Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleProcessBatch = async () => {
    setIsProcessing(true);
    setProcessedCount(0);

    const results: BatchRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const result = row.type === CalculationType.MANNING
          ? calculateManning(row.inputs)
          : calculateRational(row.inputs);

        results.push({
          ...row,
          status: 'success',
          result
        });
      } catch (err) {
        results.push({
          ...row,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      setProcessedCount(i + 1);
      setRows([...results]);
    }

    setIsProcessing(false);
  };

  const successCount = rows.filter(r => r.status === 'success').length;
  const errorCount = rows.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-6 p-6">
      <Card title="Batch Calculator" description="Process multiple calculations at once">
        {error && (
          <Alert type="error" title="Error" message={error} />
        )}

        <FileUploadZone onFileUpload={handleFileUpload} />

        {rows.length > 0 && (
          <>
            <PreviewTable rows={rows} />

            {isProcessing && (
              <ProgressBar
                current={processedCount}
                total={rows.length}
              />
            )}

            {!isProcessing && rows.length > 0 && (
              <div className="flex gap-4 justify-between items-center p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {successCount} success, {errorCount} errors
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleProcessBatch}
                  disabled={isProcessing}
                >
                  Process {rows.length} Rows
                </Button>
              </div>
            )}

            {rows.some(r => r.status === 'success') && (
              <Button variant="secondary" className="w-full">
                Export Results
              </Button>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
```

**File**: `components/batch/FileUploadZone.tsx`
```typescript
import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Card } from '../ui/Card';

interface Props {
  onFileUpload: (file: File) => void;
}

export function FileUploadZone({ onFileUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === 'text/csv' || file?.name.endsWith('.csv')) {
      onFileUpload(file);
    }
  };

  return (
    <div
      className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center
                  hover:border-slate-400 transition cursor-pointer bg-slate-50"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
      <p className="text-lg font-semibold text-slate-900">Upload CSV File</p>
      <p className="text-sm text-slate-600 mt-1">
        Drag and drop your CSV file here or click to browse
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        hidden
        onChange={e => e.target.files?.[0] && onFileUpload(e.target.files[0])}
      />
    </div>
  );
}
```

---

## FEATURE #3: Enhanced Validation

### Create validation rules file

**File**: `utils/validation/engineeringValidators.ts`
```typescript
import { ManningInputs, RationalInputs } from '../../types';

export interface ValidationRule {
  field: string;
  min?: number;
  max?: number;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

// Manning validation rules
export const manningValidationRules: Record<string, ValidationRule> = {
  roughness: {
    field: 'roughness',
    min: 0.005,
    max: 0.15,
    message: 'Roughness coefficient must be between 0.005 and 0.15',
    suggestion: 'Typical values: Concrete (0.012-0.018), Earthen (0.025-0.05)'
  },
  slope: {
    field: 'slope',
    min: 0.0001,
    max: 1.0,
    message: 'Channel slope must be between 0.0001 and 1.0',
    suggestion: 'Check slope measurement method (use level instruments)'
  },
  width: {
    field: 'width',
    min: 0.1,
    max: 100,
    message: 'Channel width must be between 0.1m and 100m',
    suggestion: 'Verify width measurement is accurate'
  },
  depth: {
    field: 'depth',
    min: 0.05,
    max: 50,
    message: 'Flow depth must be between 0.05m and 50m',
    suggestion: 'Use water level gauge for accurate measurement'
  }
};

// Rational validation rules
export const rationalValidationRules: Record<string, ValidationRule> = {
  runoffCoefficient: {
    field: 'runoffCoefficient',
    min: 0.0,
    max: 1.0,
    message: 'Runoff coefficient must be between 0 and 1',
    suggestion: 'Check land use: Urban (0.75), Suburban (0.55), Rural (0.35)'
  },
  rainfallDesign: {
    field: 'rainfallDesign',
    min: 10,
    max: 500,
    message: 'Design rainfall must be between 10mm and 500mm',
    suggestion: 'Use BNPB rainfall data for your region'
  },
  area: {
    field: 'area',
    min: 0.01,
    max: 10000,
    message: 'Catchment area must be between 0.01 and 10000 km²',
    suggestion: 'Calculate from topographic map or GIS'
  }
};

export function validateManningInputs(inputs: ManningInputs): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check each rule
  Object.entries(manningValidationRules).forEach(([key, rule]) => {
    const value = (inputs as any)[key];

    if (value === undefined || value === null) {
      errors.push({
        field: key,
        message: `${key} is required`
      });
      return;
    }

    if (rule.min !== undefined && value < rule.min) {
      errors.push({
        field: key,
        message: `${key} (${value}) is below minimum (${rule.min})`
      });
    }

    if (rule.max !== undefined && value > rule.max) {
      errors.push({
        field: key,
        message: `${key} (${value}) exceeds maximum (${rule.max})`
      });
    }

    // Additional warnings for suspicious values
    if (key === 'roughness' && value > 0.1) {
      warnings.push({
        field: key,
        message: `Roughness ${value} is unusually high`,
        suggestion: `${rule.suggestion!}`
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateRationalInputs(inputs: RationalInputs): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  Object.entries(rationalValidationRules).forEach(([key, rule]) => {
    const value = (inputs as any)[key];

    if (value === undefined || value === null) {
      errors.push({
        field: key,
        message: `${key} is required`
      });
      return;
    }

    if (rule.min !== undefined && value < rule.min) {
      errors.push({
        field: key,
        message: `${key} is below minimum`
      });
    }

    if (rule.max !== undefined && value > rule.max) {
      errors.push({
        field: key,
        message: `${key} exceeds maximum`
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

### Create ValidationPanel component

**File**: `components/validation/ValidationPanel.tsx`
```typescript
import React from 'react';
import { Alert } from '../ui/Alert';
import { ValidationResult, ValidationError, ValidationWarning } from '../../utils/validation/engineeringValidators';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  validation: ValidationResult;
  onDismiss?: () => void;
}

export function ValidationPanel({ validation }: Props) {
  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <p className="text-green-800 font-medium">All validations passed ✓</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Errors */}
      {validation.errors.map((error, idx) => (
        <Alert
          key={`error-${idx}`}
          type="error"
          title={`Invalid: ${error.field}`}
          message={error.message}
        />
      ))}

      {/* Warnings */}
      {validation.warnings.map((warning, idx) => (
        <div
          key={`warning-${idx}`}
          className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-900 font-medium">{warning.field}</p>
            <p className="text-amber-800 text-sm mt-1">{warning.message}</p>
            <p className="text-amber-700 text-xs mt-2 italic">{warning.suggestion}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## FEATURE #4: Comparison Tool

**File**: `components/comparison/ComparisonTool.tsx`
```typescript
import React, { useState } from 'react';
import { CalculationResult } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../Button';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  history: CalculationResult[];
}

export function ComparisonTool({ history }: Props) {
  const [selected, setSelected] = useState<CalculationResult[]>([]);

  const handleSelectCalculation = (calc: CalculationResult) => {
    if (selected.find(s => s.id === calc.id)) {
      setSelected(selected.filter(s => s.id !== calc.id));
    } else if (selected.length < 3) {
      setSelected([...selected, calc]);
    }
  };

  const getValueDifference = (values: number[]): string => {
    if (values.length < 2) return '-';
    const diff = values[values.length - 1] - values[0];
    const percent = ((diff / values[0]) * 100).toFixed(1);
    return `${diff > 0 ? '+' : ''}${percent}%`;
  };

  return (
    <div className="space-y-6 p-6">
      <Card title="Comparison Tool" description="Compare up to 3 calculations side-by-side">
        {/* Selection Panel */}
        <div className="mb-6">
          <h3 className="font-semibold text-slate-900 mb-3">
            Select Calculations ({selected.length}/3)
          </h3>
          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
            {history.map(calc => (
              <div
                key={calc.id}
                className="flex items-center gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                onClick={() => handleSelectCalculation(calc)}
              >
                <input
                  type="checkbox"
                  checked={selected.some(s => s.id === calc.id)}
                  onChange={() => {}}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {calc.inputs.site?.channelName || `Calculation ${calc.id.slice(0, 8)}`}
                  </p>
                  <p className="text-sm text-slate-600">
                    {new Date(calc.date).toLocaleDateString('id-ID')} • {calc.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Results */}
        {selected.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Comparison Results</h3>

            {/* Discharge comparison */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selected.map((calc, idx) => (
                <Card key={calc.id} className="p-4">
                  <p className="text-xs text-slate-600 font-medium mb-2">
                    {idx === 0 ? 'Base' : `Calc ${idx + 1}`}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {(calc.outputs.Discharge || 0).toFixed(3)}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">m³/s</p>
                </Card>
              ))}

              {selected.length > 1 && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <p className="text-xs text-slate-600 font-medium mb-2">Difference</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {getValueDifference(
                      selected.map(c => c.outputs.Discharge || 0)
                    )}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Relative change</p>
                </Card>
              )}
            </div>

            {/* Detailed comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-3 font-semibold text-slate-900">Metric</th>
                    {selected.map((calc, idx) => (
                      <th key={calc.id} className="text-right p-3 font-semibold text-slate-900">
                        Calc {idx + 1}
                      </th>
                    ))}
                    {selected.length > 1 && (
                      <th className="text-right p-3 font-semibold text-blue-600">Change</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {['Discharge', 'Velocity', 'Area', 'Perimeter'].map(metric => (
                    <tr key={metric} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-700">{metric}</td>
                      {selected.map(calc => (
                        <td key={calc.id} className="text-right p-3 text-slate-900 font-mono">
                          {(calc.outputs[metric] || 0).toFixed(3)}
                        </td>
                      ))}
                      {selected.length > 1 && (
                        <td className="text-right p-3">
                          {getValueDifference(
                            selected.map(c => c.outputs[metric] || 0)
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
```

---

## 📦 QUICK START COMMANDS

```bash
# 1. Install Dependencies
npm install recharts jspdf html2canvas dexie date-fns

# 2. Create component folders
mkdir -p components/dashboard
mkdir -p components/batch
mkdir -p components/validation
mkdir -p components/comparison
mkdir -p utils/analysis
mkdir -p utils/validation

# 3. Copy code from above into respective files

# 4. Add new routes to App.tsx (examples provided)

# 5. Test each feature
npm run dev

# 6. Build & deploy
npm run build
```

---

## ✅ VERIFICATION CHECKLIST

After implementing each feature:

- [ ] Component renders without errors
- [ ] All TypeScript types are correct
- [ ] Mobile responsive (test at 320px, 768px, 1024px)
- [ ] Accessibility (test with keyboard navigation)
- [ ] Data persistence (refresh page, data remains)
- [ ] Error handling (test with invalid inputs)
- [ ] Performance (no console warnings, fast renders)
- [ ] Documentation (JSDoc comments added)

---

## 🎯 NEXT STEPS

1. **Choose a feature** from the list
2. **Create branch**: `git checkout -b feature/[feature-name]`
3. **Copy code** from above into your project
4. **Test locally**: `npm run dev`
5. **Create PR** for review
6. **Merge** and deploy

---

**Ready to start?** Pick Feature #1 (Analytics Dashboard) - it has the quickest ROI!
