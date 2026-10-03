export interface MethodParams {
  hasCoordinates: boolean;
  topography: 'flat' | 'varied';
  distribution: 'uniform' | 'uneven';
  stationCount: number;
  luasDAS?: number;           // km² (dari Morfometri DAS)
  kemiringanSungai?: number;  // rasio atau % (dari Morfometri DAS)
  elevasi?: number;           // mdpl (dari Morfometri DAS)
}

export interface RecommendationResult {
  method: 'Metode Rata-Rata Aljabar' | 'Metode Poligon Thiessen' | 'Metode Isohyet';
  reason: string;
  sourceStandard?: string;
  spatialSummary?: string;
}

/**
 * Infer parameter evaluasi metode hujan wilayah berdasarkan data spasial morfometri DAS dan stasiun hidrologi.
 * Mengacu pada SNI 2415:2016 dan standar Ditjen SDA Kementerian PUPR.
 */
export function inferParamsFromSpatial(
  morfometriDAS: { luasDAS?: number; kemiringanSungai?: number; elevasi?: number } | null | undefined,
  stasiunList: Array<{ koordinat_x?: number | null; koordinat_y?: number | null }>
): MethodParams {
  const stationCount = stasiunList.length;
  const hasCoordinates = stationCount > 0 && stasiunList.every(s =>
    s.koordinat_x !== null && s.koordinat_x !== undefined && s.koordinat_x !== 0 &&
    s.koordinat_y !== null && s.koordinat_y !== undefined && s.koordinat_y !== 0
  );

  const luas = morfometriDAS?.luasDAS || 0;
  const slope = morfometriDAS?.kemiringanSungai || 0;
  const elev = morfometriDAS?.elevasi || 0;

  // Kemiringan >= 2% atau >= 0.02 atau elevasi >= 500 mdpl menandakan wilayah pegunungan/bervariasi
  const isVaried = slope >= 2 || (slope >= 0.02 && slope < 1) || elev >= 500;
  // DAS luas > 50 km² atau stasiun >= 3 secara spasial cenderung memiliki sebaran hujan tidak seragam
  const isUneven = luas > 50 || stationCount >= 3;

  return {
    hasCoordinates,
    topography: isVaried ? 'varied' : 'flat',
    distribution: isUneven ? 'uneven' : 'uniform',
    stationCount,
    luasDAS: luas,
    kemiringanSungai: slope,
    elevasi: elev,
  };
}

export function determineRainfallMethod(params: MethodParams): RecommendationResult {
  const { hasCoordinates, topography, distribution, stationCount, luasDAS, kemiringanSungai, elevasi } = params;

  // 1. Jika koordinat stasiun tidak tersedia (mutlak tidak bisa poligon/isohyet)
  if (!hasCoordinates) {
    return {
      method: 'Metode Rata-Rata Aljabar',
      reason: 'Direkomendasikan secara mutlak karena data koordinat geografis stasiun belum lengkap/tersedia. Poligon Thiessen dan garis Isohyet memerlukan koordinat lokasi stasiun.',
      sourceStandard: 'SNI 2415:2016 Pasal 5.1'
    };
  }

  // 2. Jika jumlah stasiun kurang dari 3
  if (stationCount < 3) {
    return {
      method: 'Metode Rata-Rata Aljabar',
      reason: `Jumlah stasiun pengamatan hanya ${stationCount} stasiun (< 3). Secara kaidah geometris dan hidrologi, pembentukan poligon Thiessen atau garis kontur isohyet membutuhkan minimal 3 titik stasiun.`,
      sourceStandard: 'SNI 2415:2016 Pasal 5.1'
    };
  }

  // 3. Jika stasiun berjumlah banyak (>5) dan topografi pegunungan / elevasi bervariasi tinggi
  const isHighOrVaried = topography === 'varied' || (elevasi !== undefined && elevasi >= 500) || (kemiringanSungai !== undefined && (kemiringanSungai >= 2 || kemiringanSungai >= 0.02));
  if (stationCount > 5 && isHighOrVaried) {
    return {
      method: 'Metode Isohyet',
      reason: `Direkomendasikan Metode Garis Isohyet berdasarkan SNI 2415:2016: Jumlah stasiun padat (${stationCount} stasiun > 5) dan topografi DAS bergelombang/pegunungan ${elevasi ? `(elevasi ${elevasi} mdpl)` : ''}. Metode Isohyet mampu memperhitungkan efek orografis hujan dengan akurasi paling tinggi.`,
      sourceStandard: 'SNI 2415:2016 Pasal 5.3'
    };
  }

  // 4. Jika DAS kecil (<= 50 km²), topografi relatif datar, dan penyebaran hujan merata (homogen)
  if (luasDAS !== undefined && luasDAS > 0 && luasDAS <= 50 && topography === 'flat' && distribution === 'uniform') {
    return {
      method: 'Metode Rata-Rata Aljabar',
      reason: `Metode Rata-Rata Aljabar dapat diterapkan untuk DAS berukuran kecil (${luasDAS} km² ≤ 50 km²) dengan topografi datar dan sifat penyebaran hujan yang homogen antar stasiun.`,
      sourceStandard: 'SNI 2415:2016 Pasal 5.1'
    };
  }

  // 5. Standar SNI: Stasiun >= 3 dengan koordinat lengkap (DAS sedang/besar > 50 km², atau topografi bervariasi, atau hujan tidak merata)
  const dasText = luasDAS && luasDAS > 0 ? ` untuk DAS seluas ${luasDAS.toLocaleString('id-ID')} km²` : '';
  return {
    method: 'Metode Poligon Thiessen',
    reason: `Direkomendasikan Metode Poligon Thiessen sesuai SNI 2415:2016: Tersedia ${stationCount} stasiun pengamatan berkoordinat lengkap${dasText}. Pembobotan area pengaruh (Thiessen polygons) memberikan estimasi hujan wilayah paling obyektif dan representatif.`,
    sourceStandard: 'SNI 2415:2016 Pasal 5.2'
  };
}

