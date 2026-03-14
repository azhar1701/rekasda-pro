/**
 * Modul Hujan Kawasan (Areal Rainfall)
 * 
 * Modul ini menyediakan fungsi murni (pure functions) untuk menghitung curah hujan
 * rata-rata di suatu kawasan DAS menggunakan tiga metode standar.
 */

/**
 * Menghitung Hujan Rata-Rata Kawasan dengan Metode Aljabar (Aritmatika)
 * P = (x1 + x2 + ... + xn) / n
 * 
 * Sangat cocok untuk daerah datar dan jumlah stasiun yang tersebar merata.
 * 
 * @param stationRainfalls Array nilai curah hujan dari titik stasiun (contoh: [100, 150, 120])
 * @returns Nilai rata-rata curah hujan (mm)
 */
export function calculateAlgebraicMean(stationRainfalls: number[]): number {
 if (!stationRainfalls || stationRainfalls.length === 0) return 0;
 
 const sum = stationRainfalls.reduce((acc, val) => acc + val, 0);
 return sum / stationRainfalls.length;
}

/**
 * Menghitung Hujan Rata-Rata Kawasan dengan Metode Poligon Thiessen
 * P = Σ(Ai * xi) / ΣAi
 * 
 * Cocok untuk daerah yang stasiunnya tidak tersebar merata.
 * 
 * @param stations Array konfigurasi stasiun dengan nilai hujan dan luas pengaruh (Ai)
 * @returns Nilai curah hujan rata-rata tertimbang (mm)
 */
export function calculateThiessenPolygon(
 stations: Array<{ rainfall: number; area: number }>
): number {
 if (!stations || stations.length === 0) return 0;

 let totalArea = 0;
 let weightedRainfallSum = 0;

 for (const station of stations) {
 if (station.area > 0) {
 totalArea += station.area;
 weightedRainfallSum += (station.rainfall * station.area);
 }
 }

 if (totalArea === 0) return 0;
 return weightedRainfallSum / totalArea;
}

/**
 * Menghitung Hujan Rata-Rata Kawasan dengan Metode Isohyet
 * Memungkinkan pemetaan dengan kontur hujan bergradasi.
 * P = Σ(Ai * (I1+I2)/2) / ΣAi
 * 
 * Cocok untuk daerah pegunungan di mana hujan sangat dipengaruhi elevasi.
 *
 * @param isohyets Array objek yang memuat rata-rata hujan di antara 2 garis isohyet dan luas area diantaranya.
 * @returns Nilai curah hujan rata-rata tertimbang (mm)
 */
export function calculateIsohyet(
 isohyets: Array<{ averageRainfall: number; area: number }>
): number {
 if (!isohyets || isohyets.length === 0) return 0;

 let totalArea = 0;
 let weightedRainfallSum = 0;

 for (const isohyet of isohyets) {
 if (isohyet.area > 0) {
 totalArea += isohyet.area;
 weightedRainfallSum += (isohyet.averageRainfall * isohyet.area);
 }
 }

 if (totalArea === 0) return 0;
 return weightedRainfallSum / totalArea;
}
