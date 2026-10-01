/**
 * Flood Calculation Engine - SNI 2415:2016 Compliant
 * Tata Cara Perhitungan Debit Banjir Rencana
 */

export {
  // Workflow Validation
  validateSNI2415Workflow,
  SNI_RATIONAL_AREA_LIMIT_KM2,
  SNI_RATIONAL_AREA_LIMIT_HA,
  
  // Metode Rasional
  calculateRationalDischarge,
  validateRationalInput,
  
  // HSS Nakayasu
  calculateHSSNakayasu,
  validateHSSNakayasuInput,
  
  // Types
  type SNI2415WorkflowResult,
} from './sni2415';

// Re-export legacy functions for backward compatibility
export {
  calculateHSSGamma1,
  calculateHSSSnyder,
} from '../flood';

// Convolution (Superposition) — SNI 2415:2016 Pasal 6
export {
  convolveUnitHydrograph,
  resampleUnitHydrograph,
  computeDesignFloodHydrograph,
  type ConvolutionInput,
  type ConvolutionResult,
  type HydrographPoint as ConvolutionHydrographPoint,
} from './convolution';

// Empirical Hydrographs — SNI 2415:2016 Pasal 5.3
export {
  generateEmpiricalHydrograph,
  type EmpiricalHydrographPoint,
} from './empiricalHydrograph';

