import area from '@turf/area';
import centroid from '@turf/centroid';
import bbox from '@turf/bbox';
import intersect from '@turf/intersect';
import booleanContains from '@turf/boolean-contains';
import { featureCollection } from '@turf/helpers';
import voronoi from '@turf/voronoi';
import { Feature, Polygon, MultiPolygon, FeatureCollection, Point, LineString, MultiLineString } from 'geojson';

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
  elevation?: number;
}

/**
 * FASE 1: Geoprocessing Engine (Optimized with Tree-shaking)
 */

/**
 * 1. Menghitung Luas DAS dan Titik Berat (Centroid)
 */
export function calculateDasParameters(dasGeoJSON: Feature<Polygon | MultiPolygon>): DasParameters {
  const areaM2 = area(dasGeoJSON);
  const areaKm2 = areaM2 / 1_000_000;
  const cent = centroid(dasGeoJSON).geometry.coordinates as [number, number];
  const b = bbox(dasGeoJSON);

  return { areaKm2, centroid: cent, bbox: b };
}

/**
 * 2. Validasi Alur Sungai terhadap Batas DAS
 * Memastikan alur sungai berada di dalam (contained by) area DAS
 */
export function validateRiverWithinDas(
  dasGeoJSON: Feature<Polygon | MultiPolygon>,
  riverGeoJSON: Feature<LineString | MultiLineString>
): { isValid: boolean; message: string } {
  try {
    const isWithin = booleanContains(dasGeoJSON, riverGeoJSON);
    return {
      isValid: isWithin,
      message: isWithin 
        ? 'Alur sungai terverifikasi berada di dalam batas DAS.' 
        : 'Peringatan: Sebagian atau seluruh alur sungai berada di luar batas DAS. Harap periksa kembali delineasi Anda.'
    };
  } catch (error) {
    return { isValid: false, message: 'Gagal melakukan validasi spasial alur sungai.' };
  }
}

/**
 * 3. Interseksi Tutupan Lahan & Hitung Koefisien C Komposit
 * Menghitung C Komposit = (Σ Ci * Ai) / Σ Ai
 */
export function calculateCompositeC(
  dasGeoJSON: Feature<Polygon | MultiPolygon>,
  landCoverFC: FeatureCollection<Polygon | MultiPolygon>
): { compositeC: number; details: LandCoverWeights[] } {
  const details: LandCoverWeights[] = [];
  const totalDasAreaM2 = area(dasGeoJSON);
  let totalWeightedC = 0;

  landCoverFC.features.forEach((lcFeature) => {
    const intersection = intersect(
      featureCollection([dasGeoJSON, lcFeature as any])
    );

    if (intersection) {
      const intersectedAreaM2 = area(intersection);
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
 * 4. Pembuatan Poligon Thiessen & Faktor Pembobot Luas
 * Ai / Atotal
 */
export function generateThiessenWeights(
  dasGeoJSON: Feature<Polygon | MultiPolygon>,
  stationsFC: FeatureCollection<Point>
): ThiessenWeight[] {
  const b = bbox(dasGeoJSON);
  const voronoiPolygons = voronoi(stationsFC, { bbox: b });
  const totalDasAreaM2 = area(dasGeoJSON);
  const results: ThiessenWeight[] = [];

  voronoiPolygons.features.forEach((voronoiFeature, index) => {
    if (!voronoiFeature) return;
    const clipped = intersect(
      featureCollection([dasGeoJSON, voronoiFeature as any])
    );

    if (clipped) {
      const areaM2 = area(clipped);
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
