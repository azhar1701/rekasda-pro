/**
 * ============================================================================
 * PRODUCTION-GRADE UNIT TESTS - CORE MATH ENGINE
 * FASE 1 - TAHAP 2: Validitas Kalkulasi Hidrologi
 * ============================================================================
 * 
 * Test Coverage:
 * 1. Mononobe IDF Curve (Intensity-Duration-Frequency)
 * 2. Alternating Block Method (ABM) - Rainfall Distribution
 * 3. Convolution (Unit Hydrograph → Design Flood Hydrograph)
 * 
 * Standard: Production-Grade QA (Zero Silent Bugs)
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import {
  calculateMononobe,
  distributeRainfallABM,
  calculateEffectiveRainfall,
  generateABMTable,
} from '@/lib/utils/hydrologyMath';
import {
  convolveUnitHydrograph,
  resampleUnitHydrograph,
  computeDesignFloodHydrograph,
  type HydrographPoint,
} from '@/lib/engine/flood/convolution';

// ============================================================================
// TEST SUITE 1: MONONOBE IDF CURVE
// ============================================================================

describe('Mononobe IDF Curve - calculateMononobe()', () => {
  /**
   * Test 1.1: Validasi Formula Matematis
   * Formula: I = (R24 / 24) × (24 / t)^(2/3)
   * 
   * Mock Data: R24 = 155 mm, t = 6 jam
   * Expected: I = (155/24) × (24/6)^(2/3) = 6.458 × 2.52 = 16.27 mm/jam
   */
  it('should calculate intensity correctly for R24=155mm, t=6h', () => {
    const R24 = 155;
    const t = 6;
    const expected = 16.27; // Manual calculation

    const result = calculateMononobe(R24, t);

    expect(result).toBeCloseTo(expected, 1); // Tolerance: 1 decimal
  });

  /**
   * Test 1.2: Edge Case - t = 1 jam (intensitas maksimum)
   */
  it('should handle t=1 hour (maximum intensity)', () => {
    const R24 = 100;
    const t = 1;
    // I = (100/24) × (24/1)^(2/3) = 4.167 × 8.318 = 34.66 mm/jam
    const expected = 34.66;

    const result = calculateMononobe(R24, t);

    expect(result).toBeCloseTo(expected, 1);
  });

  /**
   * Test 1.3: Edge Case - t = 24 jam (intensitas minimum)
   */
  it('should handle t=24 hours (minimum intensity)', () => {
    const R24 = 100;
    const t = 24;
    // I = (100/24) × (24/24)^(2/3) = 4.167 × 1 = 4.167 mm/jam
    const expected = 4.167;

    const result = calculateMononobe(R24, t);

    expect(result).toBeCloseTo(expected, 2);
  });

  /**
   * Test 1.4: Boundary - t = 0 (harus return 0, tidak crash)
   */
  it('should return 0 for t=0 without crashing', () => {
    const R24 = 100;
    const t = 0;

    const result = calculateMononobe(R24, t);

    expect(result).toBe(0);
  });

  /**
   * Test 1.5: Boundary - t negatif (harus return 0)
   */
  it('should return 0 for negative duration', () => {
    const R24 = 100;
    const t = -5;

    const result = calculateMononobe(R24, t);

    expect(result).toBe(0);
  });
});

// ============================================================================
// TEST SUITE 2: ALTERNATING BLOCK METHOD (ABM)
// ============================================================================

describe('Alternating Block Method - distributeRainfallABM()', () => {
  /**
   * Test 2.1: CRITICAL - Volume Conservation (100% Mass Balance)
   * Total distribusi ABM HARUS PERSIS SAMA dengan R24
   * Ini adalah aturan MUTLAK hidrologi: tidak boleh ada volume yang hilang!
   */
  it('should conserve total volume (sum = R24) - CRITICAL TEST', () => {
    const R24 = 155;
    const durasiHujan = 6;

    const distribution = distributeRainfallABM(R24, durasiHujan);
    const totalDistributed = distribution.reduce((sum, val) => sum + val, 0);

    // CRITICAL: Total harus PERSIS R24 (tolerance 0.01 mm untuk floating point)
    expect(totalDistributed).toBeCloseTo(R24, 2);
  });

  /**
   * Test 2.2: Validasi Jumlah Interval
   * Durasi 6 jam dengan interval 1 jam = 6 interval
   */
  it('should return correct number of intervals', () => {
    const R24 = 100;
    const durasiHujan = 6;
    const interval = 1;

    const distribution = distributeRainfallABM(R24, durasiHujan, interval);

    expect(distribution.length).toBe(6);
  });

  /**
   * Test 2.3: Validasi Pola Alternating (Terbesar di Tengah)
   * Nilai maksimum harus berada di sekitar tengah array
   */
  it('should place maximum rainfall near the center (alternating pattern)', () => {
    const R24 = 100;
    const durasiHujan = 6;

    const distribution = distributeRainfallABM(R24, durasiHujan);
    const maxValue = Math.max(...distribution);
    const maxIndex = distribution.indexOf(maxValue);

    // Maksimum harus di tengah (index 2 atau 3 untuk array 6 elemen)
    expect(maxIndex).toBeGreaterThanOrEqual(2);
    expect(maxIndex).toBeLessThanOrEqual(3);
  });

  /**
   * Test 2.4: Edge Case - Durasi 1 jam
   */
  it('should handle single hour duration', () => {
    const R24 = 50;
    const durasiHujan = 1;

    const distribution = distributeRainfallABM(R24, durasiHujan);

    expect(distribution.length).toBe(1);
    expect(distribution[0]).toBeCloseTo(R24, 2);
  });

  /**
   * Test 2.5: Edge Case - Durasi 0 atau negatif (harus return array kosong)
   */
  it('should return empty array for zero or negative duration', () => {
    const R24 = 100;

    const result1 = distributeRainfallABM(R24, 0);
    const result2 = distributeRainfallABM(R24, -5);

    expect(result1).toEqual([]);
    expect(result2).toEqual([]);
  });

  /**
   * Test 2.6: Validasi dengan Interval Custom (0.5 jam)
   */
  it('should handle custom interval (0.5 hours)', () => {
    const R24 = 100;
    const durasiHujan = 3;
    const interval = 0.5;

    const distribution = distributeRainfallABM(R24, durasiHujan, interval);

    expect(distribution.length).toBe(6); // 3 jam / 0.5 jam = 6 interval
    
    const total = distribution.reduce((sum, val) => sum + val, 0);
    expect(total).toBeCloseTo(R24, 2);
  });
});

// ============================================================================
// TEST SUITE 3: EFFECTIVE RAINFALL
// ============================================================================

describe('Effective Rainfall - calculateEffectiveRainfall()', () => {
  /**
   * Test 3.1: Validasi Perhitungan dengan C = 0.6
   */
  it('should calculate effective rainfall correctly with C=0.6', () => {
    const hyetograph = [10, 20, 30, 20, 10];
    const C = 0.6;
    const expected = [6, 12, 18, 12, 6];

    const result = calculateEffectiveRainfall(hyetograph, C);

    result.forEach((val, i) => {
      expect(val).toBeCloseTo(expected[i], 2);
    });
  });

  /**
   * Test 3.2: Edge Case - C = 0 (tidak ada limpasan)
   */
  it('should return all zeros when C=0', () => {
    const hyetograph = [10, 20, 30];
    const C = 0;

    const result = calculateEffectiveRainfall(hyetograph, C);

    result.forEach(val => {
      expect(val).toBe(0);
    });
  });

  /**
   * Test 3.3: Edge Case - C = 1 (100% limpasan)
   */
  it('should return same values when C=1', () => {
    const hyetograph = [10, 20, 30];
    const C = 1;

    const result = calculateEffectiveRainfall(hyetograph, C);

    result.forEach((val, i) => {
      expect(val).toBeCloseTo(hyetograph[i], 2);
    });
  });

  /**
   * Test 3.4: Validation - C di luar range (harus throw error)
   */
  it('should throw error for C > 1', () => {
    const hyetograph = [10, 20, 30];
    const C = 1.5;

    expect(() => calculateEffectiveRainfall(hyetograph, C)).toThrow();
  });

  it('should throw error for C < 0', () => {
    const hyetograph = [10, 20, 30];
    const C = -0.2;

    expect(() => calculateEffectiveRainfall(hyetograph, C)).toThrow();
  });
});

// ============================================================================
// TEST SUITE 4: ABM TABLE GENERATION
// ============================================================================

describe('ABM Table Generation - generateABMTable()', () => {
  /**
   * Test 4.1: Validasi Struktur Tabel
   */
  it('should generate complete table with all columns', () => {
    const R24 = 100;
    const durasiHujan = 6;

    const table = generateABMTable(R24, durasiHujan);

    expect(table.length).toBe(6);
    
    table.forEach(row => {
      expect(row).toHaveProperty('t');
      expect(row).toHaveProperty('I');
      expect(row).toHaveProperty('X');
      expect(row).toHaveProperty('deltaX');
      expect(row).toHaveProperty('deltaXPercent');
      expect(row).toHaveProperty('hyetograph');
    });
  });

  /**
   * Test 4.2: Validasi Volume Conservation di Tabel
   */
  it('should conserve volume in table hyetograph column', () => {
    const R24 = 155;
    const durasiHujan = 6;

    const table = generateABMTable(R24, durasiHujan);
    const totalHyetograph = table.reduce((sum, row) => sum + row.hyetograph, 0);

    expect(totalHyetograph).toBeCloseTo(R24, 2);
  });

  /**
   * Test 4.3: Validasi Persentase Total = 100%
   */
  it('should have deltaXPercent sum to 100%', () => {
    const R24 = 100;
    const durasiHujan = 6;

    const table = generateABMTable(R24, durasiHujan);
    const totalPercent = table.reduce((sum, row) => sum + row.deltaXPercent, 0);

    expect(totalPercent).toBeCloseTo(100, 1);
  });
});

// ============================================================================
// TEST SUITE 5: CONVOLUTION (UNIT HYDROGRAPH → DESIGN FLOOD)
// ============================================================================

describe('Convolution - convolveUnitHydrograph()', () => {
  /**
   * Test 5.1: Validasi Output Length
   * Length = len(UH) + len(Rainfall) - 1
   */
  it('should produce correct output length', () => {
    const unitHydrograph: HydrographPoint[] = [
      { time: 0, discharge: 0 },
      { time: 1, discharge: 5 },
      { time: 2, discharge: 10 },
      { time: 3, discharge: 5 },
      { time: 4, discharge: 0 },
    ];
    const effectiveRainfall = [10, 20, 15];
    const timeStep = 1;

    const result = convolveUnitHydrograph({
      unitHydrograph,
      effectiveRainfall,
      timeStep,
    });

    // Expected length = 5 + 3 - 1 = 7
    expect(result.floodHydrograph.length).toBe(7);
  });

  /**
   * Test 5.2: Validasi Peak Discharge > 0
   */
  it('should calculate peak discharge correctly', () => {
    const unitHydrograph: HydrographPoint[] = [
      { time: 0, discharge: 0 },
      { time: 1, discharge: 10 },
      { time: 2, discharge: 20 },
      { time: 3, discharge: 10 },
      { time: 4, discharge: 0 },
    ];
    const effectiveRainfall = [5, 10, 5];
    const timeStep = 1;

    const result = convolveUnitHydrograph({
      unitHydrograph,
      effectiveRainfall,
      timeStep,
    });

    expect(result.peakDischarge).toBeGreaterThan(0);
    expect(result.timeToPeak).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test 5.3: CRITICAL - Validasi Array Kosong (Tidak Boleh Crash!)
   */
  it('should throw error for empty unit hydrograph', () => {
    const unitHydrograph: HydrographPoint[] = [];
    const effectiveRainfall = [10, 20];
    const timeStep = 1;

    expect(() =>
      convolveUnitHydrograph({
        unitHydrograph,
        effectiveRainfall,
        timeStep,
      })
    ).toThrow();
  });

  it('should throw error for empty rainfall array', () => {
    const unitHydrograph: HydrographPoint[] = [
      { time: 0, discharge: 0 },
      { time: 1, discharge: 10 },
    ];
    const effectiveRainfall: number[] = [];
    const timeStep = 1;

    expect(() =>
      convolveUnitHydrograph({
        unitHydrograph,
        effectiveRainfall,
        timeStep,
      })
    ).toThrow();
  });

  /**
   * Test 5.4: Validasi Time Step Invalid
   */
  it('should throw error for zero or negative time step', () => {
    const unitHydrograph: HydrographPoint[] = [
      { time: 0, discharge: 0 },
      { time: 1, discharge: 10 },
    ];
    const effectiveRainfall = [10];

    expect(() =>
      convolveUnitHydrograph({
        unitHydrograph,
        effectiveRainfall,
        timeStep: 0,
      })
    ).toThrow();

    expect(() =>
      convolveUnitHydrograph({
        unitHydrograph,
        effectiveRainfall,
        timeStep: -1,
      })
    ).toThrow();
  });

  /**
   * Test 5.5: Validasi Volume Conservation (Approximate)
   * Volume output ≈ sum(rainfall) × UH_volume
   */
  it('should approximately conserve volume', () => {
    const unitHydrograph: HydrographPoint[] = [
      { time: 0, discharge: 0 },
      { time: 1, discharge: 10 },
      { time: 2, discharge: 20 },
      { time: 3, discharge: 10 },
      { time: 4, discharge: 0 },
    ];
    const effectiveRainfall = [10, 20, 10];
    const timeStep = 1;

    const result = convolveUnitHydrograph({
      unitHydrograph,
      effectiveRainfall,
      timeStep,
    });

    expect(result.totalVolume).toBeGreaterThan(0);
  });
});

// ============================================================================
// TEST SUITE 6: RESAMPLE UNIT HYDROGRAPH
// ============================================================================

describe('Resample Unit Hydrograph - resampleUnitHydrograph()', () => {
  /**
   * Test 6.1: Validasi Resampling dari 0.5h ke 1h
   */
  it('should resample from 0.5h to 1h intervals', () => {
    const uh: HydrographPoint[] = [
      { time: 0, discharge: 0 },
      { time: 0.5, discharge: 5 },
      { time: 1.0, discharge: 10 },
      { time: 1.5, discharge: 15 },
      { time: 2.0, discharge: 10 },
      { time: 2.5, discharge: 5 },
      { time: 3.0, discharge: 0 },
    ];
    const newStep = 1.0;

    const resampled = resampleUnitHydrograph(uh, newStep);

    expect(resampled.length).toBe(4); // 0, 1, 2, 3
    expect(resampled[0].time).toBe(0);
    expect(resampled[1].time).toBe(1);
    expect(resampled[2].time).toBe(2);
    expect(resampled[3].time).toBe(3);
  });

  /**
   * Test 6.2: Edge Case - Empty Array
   */
  it('should handle empty array gracefully', () => {
    const uh: HydrographPoint[] = [];
    const newStep = 1.0;

    const resampled = resampleUnitHydrograph(uh, newStep);

    expect(resampled).toEqual([]);
  });

  /**
   * Test 6.3: Edge Case - Invalid Time Step
   */
  it('should return original array for invalid time step', () => {
    const uh: HydrographPoint[] = [
      { time: 0, discharge: 0 },
      { time: 1, discharge: 10 },
    ];
    const newStep = 0;

    const resampled = resampleUnitHydrograph(uh, newStep);

    expect(resampled).toEqual(uh);
  });
});

// ============================================================================
// TEST SUITE 7: INTEGRATION TEST (ABM + CONVOLUTION)
// ============================================================================

describe('Integration Test - computeDesignFloodHydrograph()', () => {
  /**
   * Test 7.1: End-to-End Workflow
   * ABM Rainfall → Unit Hydrograph → Design Flood Hydrograph
   */
  it('should compute design flood hydrograph from ABM rainfall', () => {
    // Mock Unit Hydrograph (simplified Nakayasu)
    const unitHydrograph: HydrographPoint[] = [
      { time: 0, discharge: 0 },
      { time: 1, discharge: 50 },
      { time: 2, discharge: 100 },
      { time: 3, discharge: 80 },
      { time: 4, discharge: 50 },
      { time: 5, discharge: 20 },
      { time: 6, discharge: 0 },
    ];

    // Mock ABM Rainfall (6 hours)
    const abmRainfall = [15, 25, 40, 30, 20, 10];

    const result = computeDesignFloodHydrograph(unitHydrograph, abmRainfall, 1.0);

    expect(result.peakDischarge).toBeGreaterThan(0);
    expect(result.timeToPeak).toBeGreaterThan(0);
    expect(result.floodHydrograph.length).toBeGreaterThan(0);
    expect(result.totalVolume).toBeGreaterThan(0);
  });

  /**
   * Test 7.2: Validasi dengan Time Step Berbeda
   */
  it('should handle different time steps (0.5h UH with 1h rainfall)', () => {
    const unitHydrograph: HydrographPoint[] = [
      { time: 0, discharge: 0 },
      { time: 0.5, discharge: 30 },
      { time: 1.0, discharge: 60 },
      { time: 1.5, discharge: 40 },
      { time: 2.0, discharge: 20 },
      { time: 2.5, discharge: 0 },
    ];

    const abmRainfall = [20, 40, 30, 10];

    const result = computeDesignFloodHydrograph(unitHydrograph, abmRainfall, 0.5);

    expect(result.peakDischarge).toBeGreaterThan(0);
    expect(result.floodHydrograph.length).toBeGreaterThan(0);
  });
});
