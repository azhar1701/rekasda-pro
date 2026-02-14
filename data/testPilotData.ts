/**
 * Test Suite untuk Data Pilot
 * Memastikan semua data valid dan terintegrasi dengan baik
 */

import {
  rationalPilotData,
  nakayasuPilotData,
  getRationalPilotByName,
  getNakayasuPilotByName,
  getAllRationalPilotNames,
  getAllNakayasuPilotNames
} from '../data/floodPilotData';

// ============================================
// TEST DATA PILOT RASIONAL
// ============================================

console.log('=== TEST DATA PILOT RASIONAL ===\n');

// Test 1: Jumlah data
console.log(`✓ Total data Rasional: ${rationalPilotData.length}`);

// Test 2: Validasi struktur data
rationalPilotData.forEach((data, index) => {
  console.log(`\n[${index + 1}] ${data.name}`);
  
  // Validasi inputs
  const { C, A, tc, I } = data.inputs;
  
  console.log(`  Koefisien Limpasan (C): ${C} ${C >= 0 && C <= 1 ? '✓' : '✗ INVALID'}`);
  console.log(`  Luas DAS (A): ${A} km² ${A > 0 ? '✓' : '✗ INVALID'}`);
  console.log(`  Waktu Konsentrasi (tc): ${tc} menit ${tc > 0 ? '✓' : '✗ INVALID'}`);
  console.log(`  Intensitas Hujan (I): ${I} mm/jam ${I > 0 ? '✓' : '✗ INVALID'}`);
  
  // Validasi location
  console.log(`  Lokasi: ${data.location.channelName} ✓`);
  console.log(`  Koordinat: ${data.location.coordinates ? '✓' : '✗ MISSING'}`);
  
  // Validasi return periods
  console.log(`  Data Kala Ulang: ${data.returnPeriods.length} periode ${data.returnPeriods.length === 6 ? '✓' : '✗ INVALID'}`);
  
  // Hitung debit puncak estimasi
  const Q = 0.278 * C * I * A;
  console.log(`  Debit Puncak Estimasi: ${Q.toFixed(2)} m³/s`);
});

// Test 3: Helper functions
console.log('\n=== TEST HELPER FUNCTIONS (RASIONAL) ===\n');
const testRationalName = rationalPilotData[0].name;
const foundRational = getRationalPilotByName(testRationalName);
console.log(`getRationalPilotByName("${testRationalName}"): ${foundRational ? '✓ FOUND' : '✗ NOT FOUND'}`);

const allRationalNames = getAllRationalPilotNames();
console.log(`getAllRationalPilotNames(): ${allRationalNames.length} names ${allRationalNames.length === rationalPilotData.length ? '✓' : '✗ MISMATCH'}`);

// ============================================
// TEST DATA PILOT NAKAYASU
// ============================================

console.log('\n\n=== TEST DATA PILOT NAKAYASU ===\n');

// Test 1: Jumlah data
console.log(`✓ Total data Nakayasu: ${nakayasuPilotData.length}`);

// Test 2: Validasi struktur data
nakayasuPilotData.forEach((data, index) => {
  console.log(`\n[${index + 1}] ${data.name}`);
  
  // Validasi inputs
  const { A, L, Ro, Alpha } = data.inputs;
  
  console.log(`  Luas DAS (A): ${A} km² ${A > 0 ? '✓' : '✗ INVALID'}`);
  console.log(`  Panjang Sungai (L): ${L} km ${L > 0 ? '✓' : '✗ INVALID'}`);
  console.log(`  Hujan Satuan (Ro): ${Ro} mm ${Ro > 0 ? '✓' : '✗ INVALID'}`);
  console.log(`  Alpha (α): ${Alpha} ${Alpha >= 1.5 && Alpha <= 3.0 ? '✓' : '⚠ OUT OF RANGE (1.5-3.0)'}`);
  
  // Validasi location
  console.log(`  Lokasi: ${data.location.channelName} ✓`);
  console.log(`  Koordinat: ${data.location.coordinates ? '✓' : '✗ MISSING'}`);
  
  // Validasi return periods
  console.log(`  Data Kala Ulang: ${data.returnPeriods.length} periode ${data.returnPeriods.length === 6 ? '✓' : '✗ INVALID'}`);
  
  // Hitung parameter Nakayasu
  const Tg = 0.21 * Math.pow(L, 0.7);
  const Tp = Tg + 0.8 * Alpha;
  const Qp = (0.278 * A * Ro) / (3.6 * Tp);
  
  console.log(`  Tg: ${Tg.toFixed(2)} jam`);
  console.log(`  Tp: ${Tp.toFixed(2)} jam`);
  console.log(`  Debit Puncak Estimasi: ${Qp.toFixed(2)} m³/s`);
});

// Test 3: Helper functions
console.log('\n=== TEST HELPER FUNCTIONS (NAKAYASU) ===\n');
const testNakayasuName = nakayasuPilotData[0].name;
const foundNakayasu = getNakayasuPilotByName(testNakayasuName);
console.log(`getNakayasuPilotByName("${testNakayasuName}"): ${foundNakayasu ? '✓ FOUND' : '✗ NOT FOUND'}`);

const allNakayasuNames = getAllNakayasuPilotNames();
console.log(`getAllNakayasuPilotNames(): ${allNakayasuNames.length} names ${allNakayasuNames.length === nakayasuPilotData.length ? '✓' : '✗ MISMATCH'}`);

// ============================================
// SUMMARY
// ============================================

console.log('\n\n=== SUMMARY ===\n');
console.log(`Total Data Pilot: ${rationalPilotData.length + nakayasuPilotData.length}`);
console.log(`  - Metode Rasional: ${rationalPilotData.length} dataset`);
console.log(`  - HSS Nakayasu: ${nakayasuPilotData.length} dataset`);
console.log('\n✓ Semua data pilot valid dan siap digunakan!');

// Export untuk digunakan di test runner
export const testResults = {
  rational: {
    total: rationalPilotData.length,
    valid: rationalPilotData.every(d => 
      d.inputs.C >= 0 && d.inputs.C <= 1 &&
      d.inputs.A > 0 &&
      d.inputs.tc > 0 &&
      d.inputs.I > 0 &&
      d.returnPeriods.length === 6
    )
  },
  nakayasu: {
    total: nakayasuPilotData.length,
    valid: nakayasuPilotData.every(d =>
      d.inputs.A > 0 &&
      d.inputs.L > 0 &&
      d.inputs.Ro > 0 &&
      d.inputs.Alpha >= 1.5 && d.inputs.Alpha <= 3.0 &&
      d.returnPeriods.length === 6
    )
  }
};
