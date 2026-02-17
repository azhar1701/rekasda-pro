/**
 * SNI Calculation Engine - Verification Tests
 * Run with: npx tsx src/lib/engine/test.ts
 */

import {
  calculateRationalDischarge,
  calculateHSSNakayasu,
} from './flood';
import { SNI_RUNOFF_COEFFICIENTS, SNI_MANNING_ROUGHNESS } from '../constants/sni';

console.log('🧪 Testing SNI-Compliant Calculation Engine\n');

// Test 1: Rational Method
console.log('📊 Test 1: Metode Rasional (Urban Drainage)');
console.log('─'.repeat(50));
try {
  const rational = calculateRationalDischarge({
    C: SNI_RUNOFF_COEFFICIENTS.PEMUKIMAN_PADAT.value,
    I: 120,
    A: 2.5,
  });
  console.log(`✅ Input: C=0.70, I=120 mm/jam, A=2.5 km²`);
  console.log(`✅ Output: Q = ${rational.Q.toFixed(2)} m³/s`);
  console.log(`✅ Formula: Q = 0.278 × C × I × A`);
} catch (error) {
  console.error('❌ Error:', error);
}

console.log('\n');

// Test 2: HSS Nakayasu
console.log('📊 Test 2: HSS Nakayasu (Flood Hydrograph)');
console.log('─'.repeat(50));
try {
  const nakayasu = calculateHSSNakayasu({
    Ro: 10,
    Tg: 2.5,
    Tr: 1.5,
    Alpha: 2.0,
    A: 50,
    L: 15,
  });
  console.log(`✅ Input: Ro=10mm, Tg=2.5h, Tr=1.5h, α=2.0, A=50km², L=15km`);
  console.log(`✅ Debit Puncak (Qp): ${nakayasu.Qp.toFixed(2)} m³/s`);
  console.log(`✅ Waktu Puncak (Tp): ${nakayasu.Tp.toFixed(2)} jam`);
  console.log(`✅ Waktu Dasar (Tb): ${nakayasu.Tb.toFixed(2)} jam`);
  console.log(`✅ Data Points: ${nakayasu.hydrograph.length} titik`);
  
  // Show first 5 points
  console.log('\n📈 Sample Hydrograph (first 5 points):');
  nakayasu.hydrograph.slice(0, 5).forEach(point => {
    console.log(`   t=${point.time.toFixed(1)}h → Q=${point.discharge.toFixed(2)} m³/s`);
  });
} catch (error) {
  console.error('❌ Error:', error);
}

console.log('\n');

// Test 3: Validation (should fail)
console.log('📊 Test 3: Input Validation (Expected to Fail)');
console.log('─'.repeat(50));
try {
  calculateRationalDischarge({
    C: 1.5, // Invalid: > 1.0
    I: 120,
    A: 2.5,
  });
  console.log('❌ Should have thrown validation error');
} catch (error: any) {
  console.log('✅ Validation working correctly');
  console.log(`✅ Error: ${error.errors[0].message}`);
}

console.log('\n');

// Test 4: Constants
console.log('📊 Test 4: SNI Constants');
console.log('─'.repeat(50));
console.log(`✅ Runoff Coefficients: ${Object.keys(SNI_RUNOFF_COEFFICIENTS).length} types`);
console.log(`✅ Manning Roughness: ${Object.keys(SNI_MANNING_ROUGHNESS).length} types`);
console.log('\nSample Runoff Coefficients:');
console.log(`   - ${SNI_RUNOFF_COEFFICIENTS.JALAN_ASPAL.description}: ${SNI_RUNOFF_COEFFICIENTS.JALAN_ASPAL.value}`);
console.log(`   - ${SNI_RUNOFF_COEFFICIENTS.PUSAT_KOTA.description}: ${SNI_RUNOFF_COEFFICIENTS.PUSAT_KOTA.value}`);
console.log(`   - ${SNI_RUNOFF_COEFFICIENTS.TAMAN.description}: ${SNI_RUNOFF_COEFFICIENTS.TAMAN.value}`);

console.log('\n✅ All tests completed!\n');
