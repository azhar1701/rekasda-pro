/**
 * Engineering Decision Tree - Flood Calculation Method Selector
 * Based on: SNI 2415:2016 and "Hidrologi untuk Pengairan" (Sosrodarsono)
 * 
 * This utility provides professional recommendations for water resources engineers
 * based on catchment characteristics and project objectives.
 */

export type ProjectObjective = 'peak_only' | 'hydrograph_routing';

export interface MethodRecommendation {
 id: string;
 name: string;
 category: 'RATIONAL' | 'MODIFIED_RATIONAL' | 'HSS';
 suitability: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NOT_RECOMMENDED';
 justification: string;
 standardReference: string;
}

export interface DecisionResult {
 primaryMethod: MethodRecommendation;
 alternativeMethods: MethodRecommendation[];
 engineeringNotes: string[];
}

/**
 * Professional Logic for Flood Method Selection
 * 
 * @param areaKm2 - Catchment area in km²
 * @param objective - Whether the engineer needs just a peak (Qp) or a full hydrograph (Q vs t)
 * @returns DecisionResult
 */
export function getEngineeringRecommendation(
 areaKm2: number,
 objective: ProjectObjective
): DecisionResult {
 const recommendations: MethodRecommendation[] = [];
 const notes: string[] = [];

 // 1. STANDARD RATIONAL METHOD (A <= 3 km²)
 if (areaKm2 <= 3) {
 recommendations.push({
 id: 'RATIONAL',
 name: 'Metode Rasional Standar',
 category: 'RATIONAL',
 suitability: 'EXCELLENT',
 justification: 'Sangat akurat untuk DAS kecil (< 3 km²) dimana intensitas hujan dianggap merata.',
 standardReference: 'SNI 2415:2016 Pasal 5.2',
 });
 notes.push('Gunakan Mononobe untuk perhitungan intensitas hujan.');
 }

 // 2. MODIFIED RATIONAL (Haspers, Weduwen, Melchior)
 // Suitable for Peak Only (Drainage/Bridges)
 if (objective === 'peak_only') {
 if (areaKm2 > 3 && areaKm2 <= 100) {
 recommendations.push({
 id: 'DER_WEDUWEN',
 name: 'Metode Der Weduwen',
 category: 'MODIFIED_RATIONAL',
 suitability: 'EXCELLENT',
 justification: 'Metode empiris terbaik untuk DAS menengah (3-100 km²) di Indonesia.',
 standardReference: 'Standar Pengairan Indonesia (Sosrodarsono)',
 });
 recommendations.push({
 id: 'HASPERS',
 name: 'Metode Haspers',
 category: 'MODIFIED_RATIONAL',
 suitability: 'GOOD',
 justification: 'Alternatif empiris untuk DAS > 3 km².',
 standardReference: 'Metode Empiris Indonesia',
 });
 } else if (areaKm2 > 100) {
 recommendations.push({
 id: 'MELCHIOR',
 name: 'Metode Melchior',
 category: 'MODIFIED_RATIONAL',
 suitability: 'EXCELLENT',
 justification: 'Direkomendasikan untuk DAS besar (> 100 km²) dengan koefisien reduksi elips.',
 standardReference: 'Standar Pengairan Indonesia',
 });
 }
 }

 // 3. SYNTHETIC UNIT HYDROGRAPH (HSS)
 // Mandatory for Reservoir Routing or large infrastructure
 if (objective === 'hydrograph_routing' || areaKm2 > 3) {
 const isHssPrimary = objective === 'hydrograph_routing';
 
 recommendations.push({
 id: 'NAKAYASU',
 name: 'HSS Nakayasu',
 category: 'HSS',
 suitability: isHssPrimary ? 'EXCELLENT' : 'GOOD',
 justification: 'Standar industri di Indonesia untuk penelusuran hidrograf. Fleksibel dengan parameter Alpha.',
 standardReference: 'SNI 2415:2016 Pasal 6.3',
 });

 if (areaKm2 > 100) {
 recommendations.push({
 id: 'SNYDER',
 name: 'HSS Snyder',
 category: 'HSS',
 suitability: 'GOOD',
 justification: 'Baik untuk DAS besar dengan data geomorfologi yang lengkap.',
 standardReference: 'SNI 2415:2016 Pasal 6.2',
 });
 }

 recommendations.push({
 id: 'GAMMA1',
 name: 'HSS Gamma I',
 category: 'HSS',
 suitability: 'GOOD',
 justification: 'Dikembangkan di Indonesia (Sri Harto), sangat baik untuk DAS di Pulau Jawa.',
 standardReference: 'Metode Akademik & Praktisi (Sri Harto, 1993)',
 });
 }

 // Sorting results to provide a Primary recommendation
 const sorted = recommendations.sort((a, b) => {
 const score = { EXCELLENT: 3, GOOD: 2, FAIR: 1, NOT_RECOMMENDED: 0 };
 return score[b.suitability] - score[a.suitability];
 });

 return {
 primaryMethod: sorted[0],
 alternativeMethods: sorted.slice(1),
 engineeringNotes: notes,
 };
}
