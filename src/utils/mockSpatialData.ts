import { FeatureCollection, Polygon, Point } from 'geojson';

/**
 * Mock Alur Sungai Ciliwung Hulu
 */
export const MOCK_RIVER_GEOJSON: any = {
  type: "Feature",
  properties: { name: "Alur Sungai Ciliwung Hulu" },
  geometry: {
    type: "LineString",
    coordinates: [
      [106.950, -6.800], // Hulu (Puncak)
      [106.930, -6.750],
      [106.900, -6.720],
      [106.880, -6.680],
      [106.850, -6.650],
      [106.835, -6.620],
      [106.800, -6.600]  // Outlet (Katulampa)
    ]
  }
};

/**
 * Mock Batas DAS Ciliwung (Detailed Boundary for Upper-Middle Basin)
 */
export const MOCK_DAS_GEOJSON: any = {
  type: "Feature",
  properties: { 
    name: "DAS Ciliwung Hulu - Bendung Katulampa (Demo)",
    luas_gis: 150.5,
    kabupaten: "Bogor"
  },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [106.800, -6.600], // Utara (Katulampa - Outlet)
      [106.850, -6.580],
      [106.900, -6.600],
      [106.950, -6.650],
      [106.980, -6.720], // Timur (Puncak Area)
      [106.950, -6.800], // Selatan (Gn Gede Pangrango - Hulu)
      [106.880, -6.830],
      [106.800, -6.800],
      [106.750, -6.750], // Barat
      [106.770, -6.680],
      [106.800, -6.600]
    ]]
  }
};


/**
 * Mock Tutupan Lahan DAS Ciliwung
 */
export const MOCK_LAND_COVER_FC: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { jenis: "Hutan Lindung (Puncak)", nilaiC: 0.15 },
      geometry: {
        type: "Polygon",
        coordinates: [[[106.850, -6.720], [107.000, -6.720], [107.000, -6.850], [106.850, -6.850], [106.850, -6.720]]]
      }
    },
    {
      type: "Feature",
      properties: { jenis: "Perkebunan/Kebun Teh", nilaiC: 0.30 },
      geometry: {
        type: "Polygon",
        coordinates: [[[106.800, -6.680], [106.950, -6.680], [106.950, -6.750], [106.800, -6.750], [106.800, -6.680]]]
      }
    },
    {
      type: "Feature",
      properties: { jenis: "Pemukiman/Villa", nilaiC: 0.65 },
      geometry: {
        type: "Polygon",
        coordinates: [[[106.800, -6.580], [106.880, -6.580], [106.880, -6.650], [106.800, -6.650], [106.800, -6.580]]]
      }
    }
  ]
};

/**
 * Rain Gauge Stations synchronized with Ciliwung Catchment
 * metadata includes elevation (m) for orographic correction
 */
export const MOCK_STATIONS_DATA = [
  {
    id: 'st-ciliwung-1',
    nama_stasiun: 'Pos Hujan Cisarua (Hulu)',
    koordinat_x: 106.935,
    koordinat_y: -6.705,
    elevasi: 1100, // High rainfall intensity
    keterangan: 'Puncak Area'
  },
  {
    id: 'st-ciliwung-2',
    nama_stasiun: 'Pos Hujan Gadog',
    koordinat_x: 106.865,
    koordinat_y: -6.655,
    elevasi: 450, // Moderate rainfall
    keterangan: 'Middle Reach'
  },
  {
    id: 'st-ciliwung-3',
    nama_stasiun: 'Pos Hujan Katulampa',
    koordinat_x: 106.835,
    koordinat_y: -6.625,
    elevasi: 250, // Lower rainfall intensity
    keterangan: 'Outlet Control'
  }
];

export const MOCK_STATIONS_FC: FeatureCollection<Point> = {
  type: 'FeatureCollection',
  features: MOCK_STATIONS_DATA.map(s => ({
    type: 'Feature',
    properties: { ...s },
    geometry: { type: 'Point', coordinates: [s.koordinat_x, s.koordinat_y] }
  }))
};

