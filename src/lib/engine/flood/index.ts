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
  type EngineeringMetadata,
  type RationalOutputWithMetadata,
  type HSSNakayasuOutputWithMetadata,
} from './sni2415';

// Re-export methods from legacy flood proxy
export {
  calculateHSSGamma1,
  calculateHSSSnyder,
  calculateHSSSCS,
  calculateHSSClark,
  calculateMelchior,
  calculateHaspers,
  calculateWeduwen as calculateDerWeduwen,
  calculateConvolution,
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
