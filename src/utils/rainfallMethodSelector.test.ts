import { describe, it, expect } from 'vitest';
import {
  determineRainfallMethod,
  inferParamsFromSpatial,
  type MethodParams
} from './rainfallMethodSelector';

describe('rainfallMethodSelector', () => {
  describe('inferParamsFromSpatial', () => {
    it('should correctly infer parameters when DAS is mountainous and stations have coordinates', () => {
      const morfometri = {
        luasDAS: 180,
        kemiringanSungai: 0.035, // 3.5% (varied)
        elevasi: 750, // mdpl (varied)
      };
      const stasiun = [
        { koordinat_x: 107.6, koordinat_y: -6.9 },
        { koordinat_x: 107.7, koordinat_y: -6.8 },
        { koordinat_x: 107.5, koordinat_y: -7.0 },
      ];

      const params = inferParamsFromSpatial(morfometri, stasiun);
      expect(params.hasCoordinates).toBe(true);
      expect(params.topography).toBe('varied');
      expect(params.distribution).toBe('uneven');
      expect(params.stationCount).toBe(3);
      expect(params.luasDAS).toBe(180);
    });

    it('should detect flat topography for gentle slope and low elevation', () => {
      const morfometri = {
        luasDAS: 30,
        kemiringanSungai: 0.005, // 0.5%
        elevasi: 50,
      };
      const stasiun = [
        { koordinat_x: 106.8, koordinat_y: -6.2 },
        { koordinat_x: 106.9, koordinat_y: -6.3 },
      ];

      const params = inferParamsFromSpatial(morfometri, stasiun);
      expect(params.topography).toBe('flat');
      expect(params.distribution).toBe('uniform');
      expect(params.stationCount).toBe(2);
    });

    it('should detect missing coordinates if any station lacks coordinates', () => {
      const stasiun = [
        { koordinat_x: 107.6, koordinat_y: -6.9 },
        { koordinat_x: null, koordinat_y: null },
      ];
      const params = inferParamsFromSpatial(null, stasiun);
      expect(params.hasCoordinates).toBe(false);
    });
  });

  describe('determineRainfallMethod', () => {
    it('recommends Aljabar when coordinates are missing', () => {
      const params: MethodParams = {
        hasCoordinates: false,
        topography: 'flat',
        distribution: 'uniform',
        stationCount: 4,
      };
      const result = determineRainfallMethod(params);
      expect(result.method).toBe('Metode Rata-Rata Aljabar');
      expect(result.sourceStandard).toContain('SNI 2415:2016');
    });

    it('recommends Aljabar when station count < 3', () => {
      const params: MethodParams = {
        hasCoordinates: true,
        topography: 'flat',
        distribution: 'uniform',
        stationCount: 2,
      };
      const result = determineRainfallMethod(params);
      expect(result.method).toBe('Metode Rata-Rata Aljabar');
    });

    it('recommends Thiessen for >= 3 stations with coordinates on medium/large DAS', () => {
      const params: MethodParams = {
        hasCoordinates: true,
        topography: 'flat',
        distribution: 'uneven',
        stationCount: 3,
        luasDAS: 120,
      };
      const result = determineRainfallMethod(params);
      expect(result.method).toBe('Metode Poligon Thiessen');
    });

    it('recommends Isohyet for > 5 stations in mountainous/varied topography', () => {
      const params: MethodParams = {
        hasCoordinates: true,
        topography: 'varied',
        distribution: 'uneven',
        stationCount: 6,
        elevasi: 850,
      };
      const result = determineRainfallMethod(params);
      expect(result.method).toBe('Metode Isohyet');
      expect(result.sourceStandard).toContain('SNI 2415:2016');
    });

    it('recommends Aljabar for small flat uniform DAS (<= 50 km²)', () => {
      const params: MethodParams = {
        hasCoordinates: true,
        topography: 'flat',
        distribution: 'uniform',
        stationCount: 3,
        luasDAS: 25,
      };
      const result = determineRainfallMethod(params);
      expect(result.method).toBe('Metode Rata-Rata Aljabar');
    });
  });
});
