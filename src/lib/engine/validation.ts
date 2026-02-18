/**
 * Validation Engine for Hydrological Calculations
 * Sesuai SNI 2415:2016, SNI 6738:2015, dan SK Menteri PU No. 306/1989
 */

import { z } from 'zod';

/**
 * Validasi Koefisien Pengaliran (C)
 * Sesuai Permen PU No. 12/2014
 */
export const validateRunoffCoefficient = (C: number, landUse: string): { valid: boolean; message: string } => {
  if (C < 0 || C > 1) {
    return { valid: false, message: 'Koefisien pengaliran harus antara 0 dan 1' };
  }

  // Validasi berdasarkan tata guna lahan
  const ranges: Record<string, { min: number; max: number }> = {
    'jalan-aspal': { min: 0.85, max: 0.95 },
    'pusat-kota': { min: 0.70, max: 0.90 },
    'pemukiman-padat': { min: 0.60, max: 0.80 },
    'pemukiman-sedang': { min: 0.40, max: 0.60 },
    'taman': { min: 0.10, max: 0.25 },
    'hutan': { min: 0.10, max: 0.20 },
  };

  const range = ranges[landUse];
  if (range && (C < range.min || C > range.max)) {
    return {
      valid: false,
      message: `Koefisien untuk ${landUse} biasanya ${range.min}-${range.max}`,
    };
  }

  return { valid: true, message: 'Valid' };
};

/**
 * Validasi Luas DAS untuk Metode Rasional
 * SNI 2415:2016: Metode Rasional untuk DAS < 5000 Ha (50 km²)
 */
export const validateRationalMethodArea = (area: number): { valid: boolean; message: string } => {
  if (area <= 0) {
    return { valid: false, message: 'Luas DAS harus positif' };
  }

  if (area > 50) {
    return {
      valid: false,
      message: 'Metode Rasional hanya untuk DAS < 50 km². Gunakan HSS Nakayasu untuk DAS lebih besar',
    };
  }

  return { valid: true, message: 'Valid' };
};

/**
 * Validasi Parameter HSS Nakayasu
 * Sesuai SNI 2415:2016 Pasal 6.3
 */
export const validateNakayasuParameters = (params: {
  Alpha: number;
  Tg: number;
  Tr: number;
  A: number;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Alpha: 1.5 - 3.0 (standard = 2.0)
  if (params.Alpha < 1.5 || params.Alpha > 3.0) {
    errors.push('Parameter Alpha harus antara 1.5 - 3.0 (standard = 2.0)');
  }

  // Tr harus 0.5 - 1.0 × Tg
  if (params.Tr < 0.5 * params.Tg || params.Tr > params.Tg) {
    errors.push('Time unit (Tr) harus antara 0.5×Tg sampai 1.0×Tg');
  }

  // Luas DAS minimum untuk HSS
  if (params.A < 10) {
    errors.push('HSS Nakayasu direkomendasikan untuk DAS > 10 km²');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validasi Kecepatan Aliran Saluran
 * Sesuai SNI 03-3424-1994
 */
export const validateChannelVelocity = (V: number, material: string): { valid: boolean; message: string } => {
  // Batas kecepatan berdasarkan material
  const limits: Record<string, { min: number; max: number }> = {
    'beton': { min: 0.3, max: 6.0 },
    'pasangan-batu': { min: 0.3, max: 4.0 },
    'tanah': { min: 0.3, max: 1.5 },
    'rumput': { min: 0.3, max: 1.0 },
  };

  const limit = limits[material] || { min: 0.3, max: 3.0 };

  if (V < limit.min) {
    return {
      valid: false,
      message: `Kecepatan terlalu rendah (< ${limit.min} m/s), risiko sedimentasi`,
    };
  }

  if (V > limit.max) {
    return {
      valid: false,
      message: `Kecepatan terlalu tinggi (> ${limit.max} m/s), risiko erosi`,
    };
  }

  return { valid: true, message: 'Kecepatan aman' };
};

/**
 * Validasi Tinggi Jagaan (Freeboard)
 * Sesuai SNI 03-3424-1994
 */
export const validateFreeboard = (
  freeboard: number,
  Q: number,
  channelType: 'primer' | 'sekunder' | 'tersier'
): { valid: boolean; message: string } => {
  // Tinggi jagaan minimum berdasarkan debit dan tipe saluran
  let minFreeboard = 0.2; // Default 20 cm

  if (channelType === 'primer') {
    if (Q > 5) minFreeboard = 0.5;
    else if (Q > 1) minFreeboard = 0.4;
    else minFreeboard = 0.3;
  } else if (channelType === 'sekunder') {
    if (Q > 1) minFreeboard = 0.3;
    else minFreeboard = 0.25;
  } else {
    minFreeboard = 0.2;
  }

  if (freeboard < 0) {
    return { valid: false, message: 'BAHAYA: Saluran meluap!' };
  }

  if (freeboard < minFreeboard) {
    return {
      valid: false,
      message: `Tinggi jagaan kurang (min ${minFreeboard} m untuk ${channelType})`,
    };
  }

  return { valid: true, message: 'Tinggi jagaan aman' };
};

/**
 * Validasi Neraca Air
 * Sesuai SNI 6738:2015
 */
export const validateWaterBalance = (supply: number, demand: number): { 
  valid: boolean; 
  status: string;
  recommendation: string;
} => {
  const balance = supply - demand;
  const ratio = supply / demand;

  if (ratio >= 1.2) {
    return {
      valid: true,
      status: 'Surplus',
      recommendation: 'Ketersediaan air mencukupi dengan margin aman',
    };
  } else if (ratio >= 1.0) {
    return {
      valid: true,
      status: 'Cukup',
      recommendation: 'Ketersediaan air cukup, perlu monitoring',
    };
  } else if (ratio >= 0.8) {
    return {
      valid: false,
      status: 'Defisit Ringan',
      recommendation: 'Perlu efisiensi penggunaan air atau sumber tambahan',
    };
  } else {
    return {
      valid: false,
      status: 'Defisit Berat',
      recommendation: 'Ketersediaan air tidak mencukupi, perlu sumber alternatif segera',
    };
  }
};

/**
 * Validasi Bilangan Froude
 * Untuk klasifikasi aliran
 */
export const validateFroudeNumber = (Fr: number): { 
  flowType: string; 
  stability: string;
  recommendation: string;
} => {
  if (Fr < 1.0) {
    return {
      flowType: 'Sub-kritis',
      stability: 'Stabil',
      recommendation: 'Aliran tenang, cocok untuk saluran irigasi',
    };
  } else if (Fr === 1.0) {
    return {
      flowType: 'Kritis',
      stability: 'Tidak Stabil',
      recommendation: 'Hindari kondisi kritis, ubah geometri atau kemiringan',
    };
  } else {
    return {
      flowType: 'Super-kritis',
      stability: 'Tidak Stabil',
      recommendation: 'Aliran deras, perlu peredam energi',
    };
  }
};

/**
 * Validasi Komprehensif untuk Metode Rasional
 */
export const validateRationalMethod = (params: {
  C: number;
  I: number;
  A: number;
  landUse?: string;
}) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validasi C
  const cValidation = validateRunoffCoefficient(params.C, params.landUse || 'unknown');
  if (!cValidation.valid) errors.push(cValidation.message);

  // Validasi I
  if (params.I < 10 || params.I > 300) {
    warnings.push('Intensitas hujan di luar rentang normal (10-300 mm/jam)');
  }

  // Validasi A
  const areaValidation = validateRationalMethodArea(params.A);
  if (!areaValidation.valid) errors.push(areaValidation.message);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validasi Komprehensif untuk Manning
 */
export const validateManningCalculation = (params: {
  n: number;
  S: number;
  V: number;
  Fr: number;
  freeboard: number;
  Q: number;
  material?: string;
  channelType?: 'primer' | 'sekunder' | 'tersier';
}) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validasi n
  if (params.n < 0.008 || params.n > 0.15) {
    errors.push('Koefisien Manning di luar rentang normal (0.008-0.15)');
  }

  // Validasi S
  if (params.S < 0.0001) {
    warnings.push('Kemiringan sangat landai, risiko sedimentasi tinggi');
  } else if (params.S > 0.05) {
    warnings.push('Kemiringan sangat curam, perlu peredam energi');
  }

  // Validasi V
  const vValidation = validateChannelVelocity(params.V, params.material || 'beton');
  if (!vValidation.valid) warnings.push(vValidation.message);

  // Validasi Freeboard
  const fbValidation = validateFreeboard(params.freeboard, params.Q, params.channelType || 'sekunder');
  if (!fbValidation.valid) errors.push(fbValidation.message);

  // Validasi Froude
  const frValidation = validateFroudeNumber(params.Fr);
  if (frValidation.stability === 'Tidak Stabil') {
    warnings.push(frValidation.recommendation);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};
