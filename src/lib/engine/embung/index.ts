/**
 * Barrel export for all Embung hydrology services.
 */
export { linearInterpolate, validateSortedCurve, toCurvePoints } from './mathUtils';
export { calculateSequentPeak } from './capacityCalculator';
export { calculateFloodRouting } from './floodRouting';
export { simulateReservoirOperation } from './waterBalance';
export { calculateSedimentYield } from './sedimentation';
