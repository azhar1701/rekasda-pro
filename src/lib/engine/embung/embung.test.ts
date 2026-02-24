/**
 * =============================================================================
 * Unit Tests — Embung Hydrology Services
 * =============================================================================
 * Self-contained test runner (no vitest/jest dependency needed).
 * Run with: npx tsx src/lib/engine/embung/embung.test.ts
 * =============================================================================
 */

import { linearInterpolate, toCurvePoints, validateSortedCurve } from './mathUtils';
import { calculateFloodRouting } from './floodRouting';
import { calculateSequentPeak } from './capacityCalculator';
import { calculateSedimentYield } from './sedimentation';
import { calculateWaterBalance } from './waterBalance';
import { HydroValidationError, type CurvePoint } from '@/features/embung/types/embung.types';

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

function assertApprox(actual: number, expected: number, tolerance: number, message: string): void {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (ok) {
    passed++;
    console.log(`  ✅ ${message} (actual=${actual.toFixed(4)}, expected=${expected.toFixed(4)})`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message} — actual=${actual}, expected=${expected}, tol=${tolerance}`);
  }
}

function assertThrows(fn: () => void, expectedCode: string, message: string): void {
  try {
    fn();
    failed++;
    console.error(`  ❌ FAIL: ${message} — expected error but none thrown`);
  } catch (e) {
    if (e instanceof HydroValidationError && e.code === expectedCode) {
      passed++;
      console.log(`  ✅ ${message} (threw ${expectedCode})`);
    } else {
      failed++;
      console.error(`  ❌ FAIL: ${message} — wrong error: ${e}`);
    }
  }
}

function describe(name: string, fn: () => void): void {
  console.log(`\n🔬 ${name}`);
  fn();
}

// ===========================================================================
// Tests
// ===========================================================================

describe('linearInterpolate', () => {
  const curve: CurvePoint[] = [
    { x: 0, y: 0 },
    { x: 10, y: 100 },
    { x: 20, y: 300 },
    { x: 30, y: 600 },
  ];

  assert(linearInterpolate(curve, 0, 'test') === 0, 'Exact match at first point');
  assert(linearInterpolate(curve, 30, 'test') === 600, 'Exact match at last point');
  assertApprox(linearInterpolate(curve, 5, 'test'), 50, 0.001, 'Midpoint between 0–10');
  assertApprox(linearInterpolate(curve, 15, 'test'), 200, 0.001, 'Midpoint between 10–20');
  assertApprox(linearInterpolate(curve, 25, 'test'), 450, 0.001, 'Midpoint between 20–30');

  // Boundary clamping
  assert(linearInterpolate(curve, -5, 'test') === 0, 'Clamps below lower bound');
  assert(linearInterpolate(curve, 100, 'test') === 600, 'Clamps above upper bound');
});

describe('validateSortedCurve', () => {
  assertThrows(
    () => validateSortedCurve([{ x: 0, y: 0 }], 'test'),
    'CURVE_TOO_SHORT',
    'Rejects curve with < 2 points'
  );

  assertThrows(
    () => validateSortedCurve([{ x: 10, y: 0 }, { x: 5, y: 1 }], 'test'),
    'CURVE_NOT_SORTED',
    'Rejects unsorted curve'
  );
});

describe('toCurvePoints', () => {
  const result = toCurvePoints([1, 2, 3], [10, 20, 30]);
  assert(result.length === 3, 'Creates correct number of points');
  assert(result[1].x === 2 && result[1].y === 20, 'Maps values correctly');

  assertThrows(
    () => toCurvePoints([1, 2], [10, 20, 30], 'a', 'b'),
    'ARRAY_LENGTH_MISMATCH',
    'Rejects mismatched array lengths'
  );
});

describe('calculateSequentPeak', () => {
  const result = calculateSequentPeak({
    inflow:  [120, 150, 110, 80, 50, 30, 20, 15, 40, 90, 130, 160],
    outflow: [80,  85,  90,  95, 100, 105, 110, 105, 90, 85,  80,  80],
  });

  assert(result.netFlow.length === 12, 'Produces 12 net flow values');
  assert(result.maxStorageRequired >= 0, 'Max storage is non-negative');
  assert(result.massCurveData.length === 12, 'Mass curve has 12 points');

  // The dry months (May–Aug) should show accumulating deficit
  const dryNetFlow = result.netFlow[4] + result.netFlow[5] + result.netFlow[6] + result.netFlow[7];
  assert(dryNetFlow < 0, 'Dry season has negative net flow');

  console.log(`  ℹ️  Max storage required: ${result.maxStorageRequired.toFixed(2)} Juta m³`);
});

describe('calculateFloodRouting', () => {
  // Simple triangular inflow hydrograph
  const inflowHydrograph = [
    { time: 0,     discharge: 0 },
    { time: 3600,  discharge: 50 },
    { time: 7200,  discharge: 100 },  // peak
    { time: 10800, discharge: 50 },
    { time: 14400, discharge: 10 },
    { time: 18000, discharge: 0 },
  ];

  // Simple Stage-Storage-Area-Discharge curves
  const stageStorageCurve = {
    elevation: [100, 101, 102, 103, 104, 105],
    storage:   [0, 50000, 120000, 210000, 320000, 450000],
    area:      [0, 10000, 22000, 35000, 50000, 67000],
  };

  const stageDischargeCurve = {
    elevation: [100, 101, 102, 103, 104, 105],
    discharge: [0, 0, 5, 20, 50, 100],
  };

  const result = calculateFloodRouting({
    inflowHydrograph,
    stageStorageCurve,
    stageDischargeCurve,
    deltaT: 3600,
    initialElevation: 100,
  });

  assert(result.steps.length > 0, 'Produces routing steps');
  assert(result.peakInflow > 0, 'Peak inflow is positive');
  // peakInflow tracks max of Iavg = (I1+I2)/2 per step, so max is (50+100)/2 = 75
  assertApprox(result.peakInflow, 75, 0.01, 'Peak avg inflow is 75 m³/s (average of 50 & 100)');
  assert(result.peakOutflow <= result.peakInflow, 'Outflow peak ≤ inflow peak (attenuation)');
  assert(result.attenuationRatio >= 0 && result.attenuationRatio <= 1, 'Attenuation ratio in [0,1]');
  assert(result.maxElevation > 100, 'Water level rises above initial');

  console.log(`  ℹ️  Peak attenuation: ${(result.attenuationRatio * 100).toFixed(1)}%`);
  console.log(`  ℹ️  Max elevation: ${result.maxElevation.toFixed(2)} m`);
  console.log(`  ℹ️  Peak outflow: ${result.peakOutflow.toFixed(2)} m³/s`);
});

describe('calculateWaterBalance', () => {
  const config = {
    maxStorage: 500000,
    deadStorage: 50000,
    initialStorage: 300000,
    surfaceArea: 20000,
  };

  const steps = [
    { inflow: 60000, demand: 40000, rainfall: 100, evaporation: 50 },
    { inflow: 20000, demand: 50000, rainfall: 20, evaporation: 80 },
    { inflow: 10000, demand: 60000, rainfall: 10, evaporation: 100 },
  ];

  const result = calculateWaterBalance(config, steps);

  assert(result.steps.length === 3, 'Produces 3 steps');
  assert(result.reliability >= 0 && result.reliability <= 100, 'Reliability is a percentage');
  assert(result.totalDeficit >= 0, 'Total deficit is non-negative');
  assert(result.totalOverflow >= 0, 'Total overflow is non-negative');

  // First step should be surplus (inflow > demand)
  assert(result.steps[0].storageEnd >= config.deadStorage, 'Storage never below dead storage');
});

describe('calculateSedimentYield', () => {
  const result = calculateSedimentYield({
    samples: [
      { concentration: 500, discharge: 10, duration: 86400 },
      { concentration: 300, discharge: 5, duration: 86400 },
    ],
    bulkDensity: 1.2,
    catchmentArea: 50,
    activeStorage: 1000000,
    trapEfficiency: 0.9,
  });

  assert(result.totalLoadTonnesPerYear > 0, 'Total load is positive');
  assert(result.totalVolumeM3PerYear > 0, 'Total volume is positive');
  assert(result.specificYield > 0, 'Specific yield is positive');
  assert(result.erosionRate > 0, 'Erosion rate is positive');
  assert(result.reservoirUsefulLife > 0, 'Useful life is positive');
  assert(result.sampleDetails.length === 2, 'Returns 2 sample details');

  console.log(`  ℹ️  Total load: ${result.totalLoadTonnesPerYear.toFixed(2)} tonnes/year`);
  console.log(`  ℹ️  Useful life: ${result.reservoirUsefulLife.toFixed(1)} years`);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(50)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'='.repeat(50)}`);

if (failed > 0) {
  process.exit(1);
}
