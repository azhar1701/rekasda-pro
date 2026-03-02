import * as turf from '@turf/turf';
import { Feature, Polygon, MultiPolygon, FeatureCollection, Point } from 'geojson';

export interface DasParameters {
  areaKm2: number;
  centroid: [number, number]; // [lng, lat]
  bbox: number[];
}

export interface LandCoverWeights {
  jenis: string;
  luasKm2: number;
  nilaiC: number;
  bobotC: number; // (luas / totalLuas) * nilaiC
}

export interface ThiessenWeight {
  stasiunId: string;
  namaStasiun: string;
  areaKm2: number;
  weight: number; // Ai / Atotal
}

/**
 * FASE 1: Geoprocessing Engine
 */

/**
 * 1. Menghitung Luas DAS dan Titik Berat (Centroid)
 */
export function calculateDasParameters(dasGeoJSON: Feature<Polygon | MultiPolygon>): DasParameters {
  const areaM2 = turf.area(dasGeoJSON);
  const areaKm2 = areaM2 / 1_000_000;
  const centroid = turf.centroid(dasGeoJSON).geometry.coordinates as [number, number];
  const bbox = turf.bbox(dasGeoJSON);

  return { areaKm2, centroid, bbox };
}

/**
 * 2. Interseksi Tutupan Lahan & Hitung Koefisien C Komposit
 * Menghitung C Komposit = (Σ Ci * Ai) / Σ Ai
 */
export function calculateCompositeC(
  dasGeoJSON: Feature<Polygon | MultiPolygon>,
  landCoverFC: FeatureCollection<Polygon | MultiPolygon>
): { compositeC: number; details: LandCoverWeights[] } {
  const details: LandCoverWeights[] = [];
  const totalDasAreaM2 = turf.area(dasGeoJSON);
  let totalWeightedC = 0;

  landCoverFC.features.forEach((lcFeature) => {
    // Interseksi antara DAS dan satu poligon Tutupan Lahan
    const intersection = turf.intersect(
      turf.featureCollection([dasGeoJSON, lcFeature])
    );

    if (intersection) {
      const intersectedAreaM2 = turf.area(intersection);
      const intersectedAreaKm2 = intersectedAreaM2 / 1_000_000;
      const nilaiC = (lcFeature.properties?.nilaiC as number) || 0;
      const jenis = (lcFeature.properties?.jenis as string) || 'Tidak Diketahui';

      const weight = intersectedAreaM2 / totalDasAreaM2;
      totalWeightedC += weight * nilaiC;

      details.push({
        jenis,
        luasKm2: intersectedAreaKm2,
        nilaiC,
        bobotC: weight * nilaiC,
      });
    }
  });

  return {
    compositeC: totalWeightedC,
    details: details.sort((a, b) => b.luasKm2 - a.luasKm2),
  };
}

/**
 * 3. Pembuatan Poligon Thiessen & Faktor Pembobot Luas
 * Ai / Atotal
 */
export function generateThiessenWeights(
  dasGeoJSON: Feature<Polygon | MultiPolygon>,
  stationsFC: FeatureCollection<Point>
): ThiessenWeight[] {
  const bbox = turf.bbox(dasGeoJSON);
  
  // Turf voronoi membutuhkan koleksi titik dan bbox sebagai batas luar
  const voronoiPolygons = turf.voronoi(stationsFC, { bbox });
  const totalDasAreaM2 = turf.area(dasGeoJSON);
  const results: ThiessenWeight[] = [];

  voronoiPolygons.features.forEach((voronoiFeature, index) => {
    // Clip poligon Thiessen dengan batas DAS sebenarnya
    const clipped = turf.intersect(
      turf.featureCollection([dasGeoJSON, voronoiFeature])
    );

    if (clipped) {
      const areaM2 = turf.area(clipped);
      const stasiun = stationsFC.features[index];
      
      results.push({
        stasiunId: stasiun.properties?.id || `st-${index}`,
        namaStasiun: stasiun.properties?.nama_stasiun || `Stasiun ${index + 1}`,
        areaKm2: areaM2 / 1_000_000,
        weight: areaM2 / totalDasAreaM2,
      });
    }
  });

  return results.sort((a, b) => b.areaKm2 - a.areaKm2);
}
