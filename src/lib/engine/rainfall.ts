/**
 * Rainfall Intensity Calculation Engine
 * Sesuai SNI 2415:2016 Pasal 5.2.2
 */

import { z } from 'zod';

export interface RainfallIntensityInput {
 /** Curah hujan rencana 24 jam (mm) */
 R24: number;
 /** Durasi hujan / waktu konsentrasi (jam) */
 tc: number;
 /** Metode perhitungan */
 method: 'mononobe' | 'talbot' | 'sherman';
}

export interface RainfallIntensityOutput {
 /** Intensitas hujan (mm/jam) */
 I: number;
 /** Metode yang digunakan */
 method: string;
}

const RainfallInputSchema = z.object({
 R24: z.number().min(1, 'Curah hujan minimum 1 mm').max(1000, 'Curah hujan maksimum 1000 mm'),
 tc: z.number().min(0.1, 'Durasi minimum 0.1 jam').max(24, 'Durasi maksimum 24 jam'),
 method: z.enum(['mononobe', 'talbot', 'sherman']),
});

/**
 * Rumus Mononobe (SNI 2415:2016 Pasal 5.2.2)
 * Digunakan untuk wilayah Indonesia
 * 
 * Formula: I = (R24 / 24) × (24 / tc)^(2/3)
 * 
 * @param R24 - Curah hujan 24 jam (mm)
 * @param tc - Durasi hujan (jam)
 * @returns Intensitas hujan (mm/jam)
 */
export const calculateMononobe = (R24: number, tc: number): number => {
 return (R24 / 24) * Math.pow(24 / tc, 2 / 3);
};

/**
 * Rumus Talbot
 * Digunakan untuk daerah dengan data terbatas
 * 
 * Formula: I = (a × R24) / (tc + b)
 * Dimana: a = 0.21, b = 0.5 (untuk Indonesia)
 * 
 * @param R24 - Curah hujan 24 jam (mm)
 * @param tc - Durasi hujan (jam)
 * @returns Intensitas hujan (mm/jam)
 */
export const calculateTalbot = (R24: number, tc: number): number => {
 const a = 0.21;
 const b = 0.5;
 return (a * R24) / (tc + b);
};

/**
 * Rumus Sherman
 * Alternatif untuk daerah tropis
 * 
 * Formula: I = (a × R24) / (tc + b)^n
 * Dimana: a = 1.67, b = 0.5, n = 0.67
 * 
 * @param R24 - Curah hujan 24 jam (mm)
 * @param tc - Durasi hujan (jam)
 * @returns Intensitas hujan (mm/jam)
 */
export const calculateSherman = (R24: number, tc: number): number => {
 const a = 1.67;
 const b = 0.5;
 const n = 0.67;
 return (a * R24) / Math.pow(tc + b, n);
};

/**
 * Menghitung Intensitas Hujan dengan berbagai metode
 * 
 * @param input - Parameter input
 * @returns Intensitas hujan
 */
export const calculateRainfallIntensity = (input: RainfallIntensityInput): RainfallIntensityOutput => {
 const validated = RainfallInputSchema.parse(input);
 const { R24, tc, method } = validated;

 let I = 0;
 let methodName = '';

 switch (method) {
 case 'mononobe':
 I = calculateMononobe(R24, tc);
 methodName = 'Mononobe (SNI 2415:2016)';
 break;
 case 'talbot':
 I = calculateTalbot(R24, tc);
 methodName = 'Talbot';
 break;
 case 'sherman':
 I = calculateSherman(R24, tc);
 methodName = 'Sherman';
 break;
 }

 return {
 I: parseFloat(I.toFixed(2)),
 method: methodName,
 };
};

/**
 * Menghitung Waktu Konsentrasi (Tc)
 * Sesuai Permen PU No. 12/2014
 */
export interface TimeConcentrationInput {
 /** Panjang aliran (km) */
 L: number;
 /** Kemiringan lahan (m/m) */
 S: number;
 /** Metode perhitungan */
 method: 'kirpich' | 'bransby-williams' | 'california';
}

const TcInputSchema = z.object({
 L: z.number().min(0.01, 'Panjang minimum 0.01 km').max(1000, 'Panjang maksimum 1000 km'),
 S: z.number().min(0.0001, 'Kemiringan minimum 0.0001').max(1, 'Kemiringan maksimum 1'),
 method: z.enum(['kirpich', 'bransby-williams', 'california']),
});

/**
 * Rumus Kirpich (SNI 2415:2016)
 * Untuk DAS dengan kemiringan > 0.3%
 * 
 * Formula: Tc = 0.0195 × L^0.77 × S^-0.385 (menit)
 * 
 * @param L - Panjang aliran (km)
 * @param S - Kemiringan (m/m)
 * @returns Waktu konsentrasi (menit)
 */
export const calculateKirpich = (L: number, S: number): number => {
 return 0.0195 * Math.pow(L * 1000, 0.77) * Math.pow(S, -0.385);
};

/**
 * Rumus Bransby-Williams
 * Untuk DAS dengan luas > 130 km²
 * 
 * Formula: Tc = 58.5 × L / A^0.1 × S^0.2 (menit)
 * 
 * @param L - Panjang aliran (km)
 * @param A - Luas DAS (km²)
 * @param S - Kemiringan (m/m)
 * @returns Waktu konsentrasi (menit)
 */
export const calculateBransbyWilliams = (L: number, A: number, S: number): number => {
 return (58.5 * L) / (Math.pow(A, 0.1) * Math.pow(S, 0.2));
};

/**
 * Rumus California Culvert Practice
 * Untuk DAS kecil perkotaan
 * 
 * Formula: Tc = (0.87 × L³ / H)^0.385 (jam)
 * 
 * @param L - Panjang aliran (km)
 * @param H - Beda tinggi (m)
 * @returns Waktu konsentrasi (jam)
 */
export const calculateCaliforniaCulvert = (L: number, H: number): number => {
 return Math.pow((0.87 * Math.pow(L, 3)) / H, 0.385);
};

/**
 * Menghitung Waktu Konsentrasi
 * 
 * @param input - Parameter input
 * @returns Waktu konsentrasi (menit)
 */
export const calculateTimeConcentration = (input: TimeConcentrationInput): number => {
 const validated = TcInputSchema.parse(input);
 const { L, S, method } = validated;

 switch (method) {
 case 'kirpich':
 return parseFloat(calculateKirpich(L, S).toFixed(2));
 case 'california':
 const H = L * 1000 * S; // Estimasi beda tinggi
 return parseFloat((calculateCaliforniaCulvert(L, H) * 60).toFixed(2));
 default:
 return parseFloat(calculateKirpich(L, S).toFixed(2));
 }
};
