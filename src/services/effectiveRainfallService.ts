/**
 * Effective Rainfall Service
 * Menghitung hujan efektif dari hujan total berdasarkan tutupan lahan
 */

import type { LandCoverParameters, EffectiveRainfallResult } from '@/stores/useHydrologyStore';

import { 
 calculateEffectiveRainfallByC as calcC, 
 calculateEffectiveRainfallByCN as calcCN, 
 calculateEffectiveRainfallByPhi as calcPhi 
} from '@/lib/utils/hydrology/runoff';

/**
 * Metode Koefisien Pengaliran (C)
 * Sesuai SNI 2415:2016 untuk Metode Rasional
 */
export function calculateEffectiveRainfallByC(
 totalRainfall: number,
 C: number
): EffectiveRainfallResult {
 const effectiveRainfall = calcC(totalRainfall, C);
 const losses = totalRainfall - effectiveRainfall;

 return {
 totalRainfall,
 effectiveRainfall,
 losses,
 method: 'Koefisien Pengaliran (C)',
 };
}

/**
 * Metode Curve Number (CN) - SCS Method
 * Sesuai USDA-SCS (Soil Conservation Service)
 */
export function calculateEffectiveRainfallByCN(
 totalRainfall: number,
 CN: number
): EffectiveRainfallResult {
 const effectiveRainfall = calcCN(totalRainfall, CN);
 const losses = totalRainfall - effectiveRainfall;

 return {
 totalRainfall,
 effectiveRainfall,
 losses,
 method: 'Curve Number (CN-SCS)',
 };
}

/**
 * Metode Phi-Index (Infiltration Index)
 * Laju infiltrasi konstan
 */
export function calculateEffectiveRainfallByPhiIndex(
 totalRainfall: number,
 phiIndex: number,
 duration: number
): EffectiveRainfallResult {
 const effectiveRainfall = calcPhi(totalRainfall, phiIndex, duration);
 const losses = totalRainfall - effectiveRainfall;

 return {
 totalRainfall,
 effectiveRainfall,
 losses,
 method: 'Phi-Index',
 };
}

/**
 * Calculate effective rainfall with hourly distribution
 */
export function calculateEffectiveRainfallWithDistribution(
 hourlyRainfall: number[],
 params: LandCoverParameters
): EffectiveRainfallResult {
 const totalRainfall = hourlyRainfall.reduce((a, b) => a + b, 0);
 
 let result: EffectiveRainfallResult;
 
 switch (params.method) {
 case 'C':
 result = calculateEffectiveRainfallByC(totalRainfall, params.C!);
 break;
 case 'CN':
 result = calculateEffectiveRainfallByCN(totalRainfall, params.CN!);
 break;
 case 'PhiIndex':
 result = calculateEffectiveRainfallByPhiIndex(
 totalRainfall,
 params.phiIndex!,
 hourlyRainfall.length
 );
 break;
 default:
 throw new Error('Invalid method');
 }

 // Calculate hourly effective rainfall distribution
 const ratio = result.effectiveRainfall / totalRainfall;
 result.hourlyDistribution = hourlyRainfall.map(h => h * ratio);

 return result;
}

/**
 * Get recommended C coefficient based on land use
 */
export function getRecommendedC(landUse: string): number {
 const coefficients: Record<string, number> = {
 'Perkotaan Padat': 0.85,
 'Perkotaan Sedang': 0.70,
 'Perumahan': 0.50,
 'Taman/Lapangan': 0.25,
 'Hutan': 0.15,
 'Sawah': 0.35,
 'Kebun': 0.30,
 'Tanah Kosong': 0.40,
 };
 
 return coefficients[landUse] || 0.50;
}

/**
 * Get recommended CN based on land use and soil type
 */
export function getRecommendedCN(landUse: string, soilType: 'A' | 'B' | 'C' | 'D'): number {
 const cnTable: Record<string, Record<string, number>> = {
 'Hutan': { A: 36, B: 60, C: 73, D: 79 },
 'Padang Rumput': { A: 49, B: 69, C: 79, D: 84 },
 'Pertanian': { A: 67, B: 78, C: 85, D: 89 },
 'Perumahan': { A: 77, B: 85, C: 90, D: 92 },
 'Perkotaan': { A: 89, B: 92, C: 94, D: 95 },
 };
 
 return cnTable[landUse]?.[soilType] || 75;
}
