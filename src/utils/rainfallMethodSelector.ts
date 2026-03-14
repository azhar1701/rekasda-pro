export interface MethodParams {
 hasCoordinates: boolean;
 topography: 'flat' | 'varied';
 distribution: 'uniform' | 'uneven';
 stationCount: number;
}

export interface RecommendationResult {
 method: 'Metode Rata-Rata Aljabar' | 'Metode Poligon Thiessen' | 'Metode Isohyet';
 reason: string;
}

export function determineRainfallMethod(params: MethodParams): RecommendationResult {
 const { hasCoordinates, topography, distribution, stationCount } = params;

 // 1. Jika koordinat stasiun tidak tersedia (mutlak tidak bisa poligon/isohyet)
 if (!hasCoordinates) {
 return {
 method: 'Metode Rata-Rata Aljabar',
 reason: 'Direkomendasikan secara mutlak karena data koordinat stasiun tidak tersedia untuk membentuk poligon atau garis isohyet.'
 };
 }

 // 2. Jika stasiun berjumlah besar (>5), topografi sangat bervariasi
 // (Asumsi jika stasiun cukup untuk isohyet, maka isohyet diutamakan di daerah pegunungan/bervariasi)
 if (stationCount > 5 && topography === 'varied') {
 return {
 method: 'Metode Isohyet',
 reason: 'Direkomendasikan karena jumlah stasiun memadai (>5) dan topografi wilayah bervariasi, sehingga garis isohyet dapat merepresentasikan distribusi hujan dengan paling akurat.'
 };
 }

 // 3. Jika topografi relatif datar dan penyebaran hujan merata (homogen)
 if (topography === 'flat' && distribution === 'uniform') {
 return {
 method: 'Metode Rata-Rata Aljabar',
 reason: 'Direkomendasikan karena kondisi topografi yang relatif datar dan sifat penyebaran hujan yang homogen/merata (pengaruh lokasi tidak signifikan).'
 };
 }

 // 4. Jika jumlah stasiun memadai (>=3), ada koordinat, dan hujan tidak merata
 if (stationCount >= 3 && hasCoordinates && distribution === 'uneven') {
 return {
 method: 'Metode Poligon Thiessen',
 reason: 'Direkomendasikan karena stasiun mencukupi (≥3), koordinat diketahui, dan penyebaran hujan tidak merata sehingga perlu pembobotan area pengaruh (Poligon Thiessen).'
 };
 }

 // Fallback / Kasus di luar kondisi eksplisit di atas
 if (stationCount < 3) {
 return {
 method: 'Metode Rata-Rata Aljabar',
 reason: 'Direkomendasikan karena jumlah stasiun pengamatan kurang dari 3, sehingga pembentukan poligon atau garis kontur hujan (isohyet) tidak memungkinkan.'
 };
 }

 return {
 method: 'Metode Poligon Thiessen',
 reason: 'Direkomendasikan sebagai metode standar mengingat koordinat stasiun diketahui dan jumlah stasiun memadai (≥3).'
 };
}
