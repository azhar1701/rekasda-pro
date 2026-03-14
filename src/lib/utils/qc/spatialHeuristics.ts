/**
 * Spatial Heuristics Engine
 * Implements WMO (World Meteorological Organization) density standards
 * and spatial proximity checks.
 */

import * as turf from '@turf/turf';

export interface WMODensityResult {
 density: number; // km2 per station
 standard: number; // WMO standard (e.g. 250 km2/station)
 isSufficient: boolean;
 message: string;
 recommendation: string;
}

export interface CentroidDistance {
 stasiunId: string;
 distanceKm: number;
}

/**
 * Calculates station density and checks against WMO Guide to Hydrological Practices (2008)
 * Standard:
 * - Coastal/Flat: 575 km2/station
 * - Mountainous: 250 km2/station
 * - Small Islands: 25 km2/station
 */
export const checkWMODensity = (
 areaKm2: number, 
 stationCount: number, 
 topography: 'flat' | 'mountainous' = 'mountainous'
): WMODensityResult => {
 if (stationCount === 0 || areaKm2 === 0) {
 return {
 density: 0,
 standard: 0,
 isSufficient: false,
 message: 'Data tidak lengkap',
 recommendation: 'Tambahkan stasiun dan pastikan Luas DAS terisi.'
 };
 }

 const density = areaKm2 / stationCount;
 const standard = topography === 'flat' ? 575 : 250;
 
 const isSufficient = density <= standard;

 return {
 density,
 standard,
 isSufficient,
 message: isSufficient 
 ? `Kerapatan memadai (${density.toFixed(0)} km²/stasiun)`
 : `Kerapatan kurang (${density.toFixed(0)} km²/stasiun)`,
 recommendation: isSufficient
 ? 'Jaringan stasiun memenuhi standar WMO.'
 : `Standar WMO untuk area ${topography === 'flat' ? 'datar' : 'pegunungan'} adalah 1 stasiun per ${standard} km². Disarankan menambah ${Math.ceil(areaKm2/standard) - stationCount} stasiun lagi.`
 };
};

/**
 * Calculates distance from each station to the DAS Centroid
 */
export const calculateCentroidDistances = (
 dasGeoJSON: any, 
 stations: { id: string, lat: number, lng: number }[]
): CentroidDistance[] => {
 if (!dasGeoJSON) return [];

 try {
 const centroid = turf.centroid(dasGeoJSON);
 
 return stations.map(s => {
 const stationPoint = turf.point([s.lng, s.lat]);
 const distance = turf.distance(centroid, stationPoint, { units: 'kilometers' });
 return {
 stasiunId: s.id,
 distanceKm: distance
 };
 });
 } catch (e) {
 console.error('Centroid calculation failed:', e);
 return [];
 }
};
