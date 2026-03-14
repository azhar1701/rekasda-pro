import { toast } from '@/hooks/useToast';

/**
 * Elevation Service - Professional Geoprocessing
 * Uses Open-Meteo Elevation API (SRTM & GLO-30 based)
 */

export interface ElevationPoint {
 lat: number;
 lng: number;
 elevation: number;
}

/**
 * Fetches elevation for a single or multiple points.
 * @param coordinates Array of [lat, lng] or a single [lat, lng]
 */
export const getElevation = async (
 coordinates: [number, number] | [number, number][]
): Promise<ElevationPoint[]> => {
 try {
 const isArray = Array.isArray(coordinates[0]);
 const coords = isArray ? (coordinates as [number, number][]) : [coordinates as [number, number]];
 
 const lats = coords.map(c => c[0]).join(',');
 const lngs = coords.map(c => c[1]).join(',');
 
 const response = await fetch(
 `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`
 );
 
 if (!response.ok) {
 throw new Error('Gagal mengambil data elevasi dari satellite server.');
 }
 
 const data = await response.json();
 
 return coords.map((c, i) => ({
 lat: c[0],
 lng: c[1],
 elevation: data.elevation[i]
 }));
 } catch (error: any) {
 console.error('Elevation API Error:', error);
 toast.error('Gagal sinkronisasi elevasi: ' + error.message);
 return [];
 }
};

/**
 * Calculates Average Slope (S) of a river segment.
 * Formula: S = (H_upstream - H_downstream) / Length
 * @param h1 Upstream elevation (m)
 * @param h2 Downstream elevation (m)
 * @param length Length of river (km)
 * @returns Slope in m/m
 */
export const calculateSlope = (h1: number, h2: number, lengthKm: number): number => {
 if (lengthKm <= 0) return 0;
 const lengthM = lengthKm * 1000;
 const deltaH = h1 - h2;
 return deltaH / lengthM;
};
