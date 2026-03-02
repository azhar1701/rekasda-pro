import { FeatureCollection, Polygon, Point } from 'geojson';

/**
 * Mock Batas DAS (Sample Catchment in Bogor/Ciliwung Upper area)
 */
export const MOCK_DAS_GEOJSON: any = {
  type: "Feature",
  properties: { name: "DAS Ciliwung Hulu (Demo)" },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [106.820, -6.650],
      [106.880, -6.650],
      [106.920, -6.700],
      [106.900, -6.780],
      [106.800, -6.800],
      [106.750, -6.750],
      [106.780, -6.680],
      [106.820, -6.650]
    ]]
  }
};

/**
 * Mock Tutupan Lahan (Land Use intersections)
 */
export const MOCK_LAND_COVER_FC: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { jenis: "Hutan Lebat", nilaiC: 0.15 },
      geometry: {
        type: "Polygon",
        coordinates: [[[106.700, -6.700], [107.000, -6.700], [107.000, -6.900], [106.700, -6.900], [106.700, -6.700]]]
      }
    },
    {
      type: "Feature",
      properties: { jenis: "Pemukiman Padat", nilaiC: 0.75 },
      geometry: {
        type: "Polygon",
        coordinates: [[[106.800, -6.600], [106.900, -6.600], [106.900, -6.750], [106.800, -6.750], [106.800, -6.600]]]
      }
    },
    {
      type: "Feature",
      properties: { jenis: "Sawah / Tegalan", nilaiC: 0.40 },
      geometry: {
        type: "Polygon",
        coordinates: [[[106.750, -6.750], [106.850, -6.750], [106.850, -6.850], [106.750, -6.850], [106.750, -6.750]]]
      }
    }
  ]
};

/**
 * Mock Station Locations (Rain Gauges)
 */
export const MOCK_STATIONS_FC: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "st-1", nama_stasiun: "Pos Hujan Gadog" },
      geometry: { type: "Point", coordinates: [106.850, -6.660] }
    },
    {
      type: "Feature",
      properties: { id: "st-2", nama_stasiun: "Pos Hujan Cisarua" },
      geometry: { type: "Point", coordinates: [106.930, -6.700] }
    },
    {
      type: "Feature",
      properties: { id: "st-3", nama_stasiun: "Pos Hujan Katulampa" },
      geometry: { type: "Point", coordinates: [106.830, -6.640] }
    }
  ]
};
