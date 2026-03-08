/**
 * Test Cases for Calibrated Calculations
 * Verifikasi perhitungan sesuai SNI 2415:2016 dan SNI 6738:2015
 */

import {
  calculateHSSNakayasu,
} from '@/lib/engine';

import { calculateManning, calculateRational } from '@/services/calculationService';
import { calculateWaterBalance, getWaterBalanceSummary } from '@/services/waterBalanceEngine';
import { ChannelShape } from '@/types/types';

/**
 * Test Case 1: Metode Rasional - Drainase Perkotaan
 * Sumber: Contoh Soal SNI 2415:2016
 */
export const testRationalMethod = () => {
    
  const input = {
    runoffCoefficient: 0.70, // Pemukiman padat
    area: 2.5, // km²
    rainfallDesign: 100, // mm
    flowLength: 1.5, // km
    catchmentSlope: 0.01, // m/m
  };

  const result = calculateRational(input);
  return result;
};

/**
 * Test Case 2: HSS Nakayasu - Analisis Banjir Sungai
 * Sumber: Contoh Soal SNI 2415:2016 Pasal 6.3
 */
export const testHSSNakayasu = () => {
    
  const input = {
    Ro: 10, // mm
    Tg: 2.5, // jam
    Tr: 1.5, // jam
    Alpha: 2.0,
    A: 50, // km²
    L: 15, // km
  };

  const result = calculateHSSNakayasu(input);
  return result;
};

/**
 * Test Case 3: Manning - Saluran Trapesium
 * Sumber: Contoh Soal SNI 03-3424-1994
 */
export const testManningTrapezoid = () => {
    
  const input = {
    shape: ChannelShape.TRAPEZOID,
    roughness: 0.013, // Beton halus
    slope: 0.002, // m/m
    width: 2.0, // m
    depth: 1.0, // m
    sideSlope: 1.0, // 1:1
    totalDepth: 1.5, // m
    diameter: 0,
    topWidth: 0,
  };

  const result = calculateManning(input);
  return result;
};

/**
 * Test Case 4: Manning - Pipa Lingkaran
 */
export const testManningCircular = () => {
    
  const input = {
    shape: ChannelShape.CIRCULAR,
    roughness: 0.010, // PVC
    slope: 0.003,
    diameter: 0.8, // m
    depth: 0.6, // m (75% penuh)
    width: 0,
    sideSlope: 0,
    totalDepth: 0.8,
    topWidth: 0,
  };

  const result = calculateManning(input);
  return result;
};

/**
 * Test Case 5: Neraca Air
 */
export const testWaterBalance = () => {
    
  const input = {
    population: 50000, // jiwa
    agricultureArea: 500, // Ha
    domesticStandard: 100, // L/capita/day
    irrigationDemand: 1.0, // L/s/Ha
    monthlySupply: [
      2.5, 2.8, 3.2, 3.8, 4.2, 4.5,
      4.0, 3.5, 3.0, 2.7, 2.4, 2.2
    ], // m³/s
  };
  
  const results = calculateWaterBalance(input);
  const summary = getWaterBalanceSummary(results);
  
  return { results, summary };
};

/**
 * Jalankan Semua Test
 */
export const runAllTests = () => {
  try {
    testRationalMethod();
    testHSSNakayasu();
    testManningTrapezoid();
    testManningCircular();
    testWaterBalance();
  } catch (error) {
    console.error('❌ TEST GAGAL:', error);
  }
};

// Export untuk digunakan di console atau testing framework
export default {
  testRationalMethod,
  testHSSNakayasu,
  testManningTrapezoid,
  testManningCircular,
  testWaterBalance,
  runAllTests,
};
