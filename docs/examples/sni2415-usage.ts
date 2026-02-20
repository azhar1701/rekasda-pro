/**
 * SNI 2415:2016 Flood Calculation Engine - Usage Examples
 * 
 * This file demonstrates how to use the refactored flood calculation engine
 * with strict SNI 2415:2016 compliance.
 */

import {
  validateSNI2415Workflow,
  calculateRationalDischarge,
  calculateHSSNakayasu,
  SNI_RATIONAL_AREA_LIMIT_KM2,
  SNI_RATIONAL_AREA_LIMIT_HA,
  type SNI2415WorkflowResult,
} from '@/lib/engine/flood/sni2415';

// ============================================================================
// EXAMPLE 1: Workflow Validation - Small Catchment (Rational Method Valid)
// ============================================================================

console.log('=== EXAMPLE 1: Small Catchment (2.5 km²) ===');

const smallCatchmentArea = 2.5; // km²
const workflow1 = validateSNI2415Workflow(smallCatchmentArea);

console.log('Workflow Result:', workflow1);
// Output:
// {
//   recommendedMethod: 'rational',
//   isRationalValid: true,
//   areaKm2: 2.5
// }

if (workflow1.isRationalValid) {
  console.log('✅ Metode Rasional dapat digunakan');
  
  // Calculate using Rational Method
  const result = calculateRationalDischarge({
    C: 0.7,   // Koefisien pengaliran (pemukiman sedang)
    I: 120,   // Intensitas hujan (mm/jam)
    A: 2.5,   // Luas DAS (km²)
  });
  
  console.log(`Debit Banjir Rencana: Q = ${result.Q} m³/s`);
  // Output: Debit Banjir Rencana: Q = 58.8 m³/s
}

// ============================================================================
// EXAMPLE 2: Workflow Validation - Large Catchment (HSS Required)
// ============================================================================

console.log('\n=== EXAMPLE 2: Large Catchment (25 km²) ===');

const largeCatchmentArea = 25; // km²
const workflow2 = validateSNI2415Workflow(largeCatchmentArea);

console.log('Workflow Result:', workflow2);
// Output:
// {
//   recommendedMethod: 'hss',
//   isRationalValid: false,
//   warning: 'Luas DAS (25.00 km² / 2500 ha) melebihi batas Metode Rasional...',
//   areaKm2: 25
// }

if (!workflow2.isRationalValid) {
  console.log('⚠️ Metode Rasional TIDAK dapat digunakan');
  console.log('Warning:', workflow2.warning);
  console.log('✅ Gunakan Metode HSS');
  
  // Calculate using HSS Nakayasu
  const hssResult = calculateHSSNakayasu({
    Ro: 50,      // Hujan satuan (mm)
    Tg: 2.0,     // Waktu kelambatan (jam) - atau biarkan auto-calculate
    Tr: 1.5,     // Durasi hujan efektif (jam)
    Alpha: 2.0,  // Parameter hidrograf (standar SNI)
    A: 25,       // Luas DAS (km²)
    L: 15,       // Panjang sungai utama (km)
  });
  
  console.log(`Debit Puncak: Qp = ${hssResult.Qp} m³/s`);
  console.log(`Waktu Puncak: Tp = ${hssResult.Tp} jam`);
  console.log(`Waktu Dasar: Tb = ${hssResult.Tb} jam`);
  console.log(`Jumlah titik hidrograf: ${hssResult.hydrograph.length}`);
}

// ============================================================================
// EXAMPLE 3: Boundary Condition (Exactly 3 km²)
// ============================================================================

console.log('\n=== EXAMPLE 3: Boundary Condition (3.0 km²) ===');

const boundaryArea = 3.0; // km² (exactly at limit)
const workflow3 = validateSNI2415Workflow(boundaryArea);

console.log('Workflow Result:', workflow3);
console.log('✅ Tepat di batas: Metode Rasional masih dapat digunakan');

// ============================================================================
// EXAMPLE 4: Error Handling - Area Exceeds Limit
// ============================================================================

console.log('\n=== EXAMPLE 4: Error Handling ===');

try {
  const invalidResult = calculateRationalDischarge({
    C: 0.7,
    I: 120,
    A: 25, // ❌ Exceeds limit!
  });
} catch (error) {
  if (error instanceof Error) {
    console.log('❌ Error caught:', error.message);
  }
}

// ============================================================================
// EXAMPLE 5: React Component Integration
// ============================================================================

/*
import { useState } from 'react';
import { useSNI2415Workflow } from '@/hooks/useSNI2415Workflow';

const FloodAnalysisForm = () => {
  const [area, setArea] = useState(2.5);
  const workflow = useSNI2415Workflow(area);

  return (
    <div>
      {workflow.warning && <Alert>{workflow.warning}</Alert>}
      {workflow.isRationalValid ? <RationalForm /> : <HSSForm />}
    </div>
  );
};
*/

export {};
