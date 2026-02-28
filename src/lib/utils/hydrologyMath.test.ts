/**
 * ============================================================================
 * PRODUCTION-GRADE UNIT TESTS - CORE MATH ENGINE
 * FASE 4: Core Engine Reliability (Unit Testing)
 * Target: Memastikan fungsi hidrologi bebas dari kesalahan kalkulasi.
 * ============================================================================
 * 
 * Test Coverage (Misi FASE 4):
 * 1. Akurasi desimal rumus Mononobe dengan R24 = 155 mm.
 * 2. Konservasi massa pada algoritma Distribusi ABM (total array harus sama persis dengan hujan rencana).
 * 
 * Standard: Production-Grade QA (Zero Silent Bugs) / SNI 2415:2016
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import {
  calculateMononobe,
  distributeRainfallABM,
} from './hydrologyMath';

// ============================================================================
// TEST SUITE 1: MONONOBE IDF CURVE
// ============================================================================

describe('Mononobe IDF Curve - calculateMononobe()', () => {
  /**
   * Misi FASE 4: Uji akurasi desimal rumus Mononobe.
   * Formula: I = (R24 / 24) × (24 / t)^(2/3)
   * 
   * Uji dengan angka pasti: R24 = 155 mm.
   */
  const R24 = 155;

  it('1. Akurasi desimal pada t = 1 jam (Intensitas Maksimum)', () => {
    // I = (155 / 24) * (24 / 1)^(2/3)
    // I = 6.45833 * 8.32033 = 53.735... mm/jam
    const expected = 53.735;
    
    const result = calculateMononobe(R24, 1);
    
    // Toleransi 3 digit desimal
    expect(result).toBeCloseTo(expected, 3);
  });

  it('2. Akurasi desimal pada t = 6 jam (Durasi Tipikal)', () => {
    // I = (155 / 24) * (24 / 6)^(2/3)
    // I = 6.45833 * (4)^(2/3)
    // I = 6.45833 * 2.51984 = 16.27398... mm/jam
    const expected = 16.274;
    
    const result = calculateMononobe(R24, 6);
    
    expect(result).toBeCloseTo(expected, 3);
  });

  it('3. Akurasi desimal pada t = 24 jam (Intensitas Minimum, harus sama dengan R24/24)', () => {
    // I = (155 / 24) * (24 / 24)^(2/3)
    // I = 155 / 24 = 6.458... mm/jam
    const expected = 155 / 24;
    
    const result = calculateMononobe(R24, 24);
    
    expect(result).toBeCloseTo(expected, 5);
  });

  it('4. Penanganan Boundary: t = 0 (Harus mengembalikan 0)', () => {
    const result = calculateMononobe(R24, 0);
    expect(result).toBe(0);
  });
});

// ============================================================================
// TEST SUITE 2: ALTERNATING BLOCK METHOD (ABM)
// ============================================================================

describe('Alternating Block Method - distributeRainfallABM()', () => {
  /**
   * Misi FASE 4: Konservasi massa pada algoritma Distribusi ABM.
   * (Total array harus sama persis dengan hujan rencana R24).
   * 
   * Uji dengan angka pasti: R24 = 155 mm.
   */
  const R24 = 155;

  it('1. CRITICAL: Hukum Konservasi Massa (Volume Balance 100%)', () => {
    const durasiHujan = 6; // 6 Jam
    
    const distribution = distributeRainfallABM(R24, durasiHujan);
    const totalDistributed = distribution.reduce((sum, val) => sum + val, 0);

    // Total distribusi (Sigma) harus SAMA PERSIS dengan R24. 
    // Menggunakan toBeCloseTo untuk menghindari masalah presisi floating-point JS.
    expect(totalDistributed).toBeCloseTo(R24, 10);
  });

  it('2. Panjang array harus sama dengan durasi hujan (interval 1 jam)', () => {
    const durasiHujan = 6;
    const distribution = distributeRainfallABM(R24, durasiHujan);
    
    expect(distribution.length).toBe(durasiHujan);
  });

  it('3. Karakteristik Kurva Bell (Alternating Pattern)', () => {
    const durasiHujan = 6;
    const distribution = distributeRainfallABM(R24, durasiHujan);
    
    const maxValue = Math.max(...distribution);
    const maxIndex = distribution.indexOf(maxValue);

    // Untuk durasi genap (6), elemen terbesar harus diletakkan di tengah (index 2 atau 3)
    expect(maxIndex).toBeGreaterThanOrEqual(2);
    expect(maxIndex).toBeLessThanOrEqual(3);
    
    // Elemen terkecil biasanya berada di salah satu ujung
    const minValue = Math.min(...distribution);
    expect(distribution[0] === minValue || distribution[distribution.length - 1] === minValue).toBeTruthy();
  });

  it('4. Penanganan Boundary: durasi = 1 jam', () => {
    const durasiHujan = 1;
    const distribution = distributeRainfallABM(R24, durasiHujan);
    
    expect(distribution.length).toBe(1);
    expect(distribution[0]).toBeCloseTo(R24, 10);
  });

  it('5. CRITICAL: Konservasi Massa pada durasi panjang (24 jam)', () => {
    const durasiHujan = 24;
    const distribution = distributeRainfallABM(R24, durasiHujan);
    const totalDistributed = distribution.reduce((sum, val) => sum + val, 0);

    expect(totalDistributed).toBeCloseTo(R24, 10);
  });
});
