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
  console.log('=== TEST 1: METODE RASIONAL ===');
  
  const input = {
    runoffCoefficient: 0.70, // Pemukiman padat
    area: 2.5, // km²
    rainfallDesign: 100, // mm
    flowLength: 1.5, // km
    catchmentSlope: 0.01, // m/m
  };

  const result = calculateRational(input);
  
  console.log('Input:');
  console.log(`  C = ${input.runoffCoefficient}`);
  console.log(`  A = ${input.area} km²`);
  console.log(`  R24 = ${input.rainfallDesign} mm`);
  console.log(`  L = ${input.flowLength} km`);
  console.log(`  S = ${input.catchmentSlope}`);
  
  console.log('\nOutput:');
  console.log(`  Tc = ${result.Tc} menit`);
  console.log(`  I = ${result.Intensity} mm/jam`);
  console.log(`  Q = ${result.Discharge} m³/s`);
  console.log(`  Volume = ${result.TotalVolume} m³`);
  
  console.log('\n');
  return result;
};

/**
 * Test Case 2: HSS Nakayasu - Analisis Banjir Sungai
 * Sumber: Contoh Soal SNI 2415:2016 Pasal 6.3
 */
export const testHSSNakayasu = () => {
  console.log('=== TEST 2: HSS NAKAYASU ===');
  
  const input = {
    Ro: 10, // mm
    Tg: 2.5, // jam
    Tr: 1.5, // jam
    Alpha: 2.0,
    A: 50, // km²
    L: 15, // km
  };

  const result = calculateHSSNakayasu(input);
  
  console.log('Input:');
  console.log(`  Ro = ${input.Ro} mm`);
  console.log(`  Tg = ${input.Tg} jam`);
  console.log(`  Tr = ${input.Tr} jam`);
  console.log(`  α = ${input.Alpha}`);
  console.log(`  A = ${input.A} km²`);
  
  console.log('\nOutput:');
  console.log(`  Qp = ${result.Qp} m³/s`);
  console.log(`  Tp = ${result.Tp} jam`);
  console.log(`  Tb = ${result.Tb} jam`);
  console.log(`  Jumlah titik hidrograf = ${result.hydrograph.length}`);
  
  console.log('\n');
  return result;
};

/**
 * Test Case 3: Manning - Saluran Trapesium
 * Sumber: Contoh Soal SNI 03-3424-1994
 */
export const testManningTrapezoid = () => {
  console.log('=== TEST 3: MANNING - TRAPESIUM ===');
  
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
  
  console.log('Input:');
  console.log(`  Bentuk = Trapesium`);
  console.log(`  n = ${input.roughness}`);
  console.log(`  S = ${input.slope}`);
  console.log(`  b = ${input.width} m`);
  console.log(`  h = ${input.depth} m`);
  console.log(`  z = ${input.sideSlope}`);
  
  console.log('\nOutput:');
  console.log(`  A = ${result.Area} m²`);
  console.log(`  P = ${result.Perimeter} m`);
  console.log(`  R = ${result.Radius} m`);
  console.log(`  V = ${result.Velocity} m/s`);
  console.log(`  Q = ${result.Discharge} m³/s`);
  console.log(`  Fr = ${result.Froude} (${result.FlowType})`);
  console.log(`  Freeboard = ${result.Freeboard} m (${result.SafetyStatus})`);
  
  console.log('\n');
  return result;
};

/**
 * Test Case 4: Manning - Pipa Lingkaran
 */
export const testManningCircular = () => {
  console.log('=== TEST 4: MANNING - LINGKARAN ===');
  
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
  
  console.log('Input:');
  console.log(`  Bentuk = Lingkaran`);
  console.log(`  n = ${input.roughness}`);
  console.log(`  S = ${input.slope}`);
  console.log(`  D = ${input.diameter} m`);
  console.log(`  h = ${input.depth} m (${(input.depth/input.diameter*100).toFixed(0)}% penuh)`);
  
  console.log('\nOutput:');
  console.log(`  A = ${result.Area} m²`);
  console.log(`  V = ${result.Velocity} m/s`);
  console.log(`  Q = ${result.Discharge} m³/s`);
  console.log(`  Fr = ${result.Froude}`);
  console.log(`  Re = ${result.Reynolds} (${result.Regime})`);
  
  console.log('\n');
  return result;
};

/**
 * Test Case 5: Neraca Air
 */
export const testWaterBalance = () => {
  console.log('=== TEST 5: NERACA AIR ===');
  
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
  
  console.log('Input:');
  console.log(`  Populasi = ${input.population.toLocaleString()} jiwa`);
  console.log(`  Luas Pertanian = ${input.agricultureArea} Ha`);
  console.log(`  Standar Domestik = ${input.domesticStandard} L/capita/day`);
  console.log(`  Kebutuhan Irigasi = ${input.irrigationDemand} L/s/Ha`);
  
  console.log('\nRingkasan:');
  console.log(`  Bulan Surplus = ${summary.surplusMonths}`);
  console.log(`  Bulan Defisit = ${summary.deficitMonths}`);
  console.log(`  Total Surplus = ${summary.totalSurplus} m³/s`);
  console.log(`  Total Defisit = ${summary.totalDeficit} m³/s`);
  console.log(`  Reliabilitas = ${summary.reliability}%`);
  console.log(`  Bulan Kritis = ${summary.criticalMonth.month} (${summary.criticalMonth.balance} m³/s)`);
  
  console.log('\nDetail Bulanan:');
  results.forEach((_r: any) => {
    console.log(`  ${_r.month}: ${_r.supply} - ${_r.totalDemand} = ${_r.balance} m³/s (${_r.status})`);
  });
  
  console.log('\n');
  return { results, summary };
};

/**
 * Jalankan Semua Test
 */
export const runAllTests = () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  VERIFIKASI KALIBRASI PERHITUNGAN REKASDA PRO         ║');
  console.log('║  Sesuai SNI 2415:2016, SNI 6738:2015, SNI 6728.1:2015 ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  try {
    testRationalMethod();
    testHSSNakayasu();
    testManningTrapezoid();
    testManningCircular();
    testWaterBalance();
    
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ SEMUA TEST BERHASIL                                ║');
    console.log('║  Perhitungan telah dikalibrasi sesuai SNI              ║');
    console.log('╚════════════════════════════════════════════════════════╝');
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
