import { describe, it, expect } from 'vitest';
import { aggregateMonthlyRainfall } from '@/utils/rainfallSeriesUtils';
import { calculateMultiYearFJMock, type MockParams, type MultiYearFJMockInput } from '@/lib/engine/fjMock';
import { calculateKPEffectiveRainfall, type PolaTanam } from '@/lib/engine/irrigationDemand';
import { DataHujan } from '@/stores/useHydrologyStore';

describe('Fase 2 Hydrology Verification: Multi-Year Dependable Flow & Water Balance', () => {
  describe('2.1 Multi-Year Daily-to-Monthly Rainfall Aggregation', () => {
    it('correctly aggregates daily rainfall across multiple years into monthly sums', () => {
      const mockDailyData: DataHujan[] = [];

      // Generate 3 years of daily rainfall data (2020 - 2022)
      // Jan (month 0): 10 mm/day -> 310 mm
      // Feb (month 1): 5 mm/day
      for (let yr = 2020; yr <= 2022; yr++) {
        for (let d = 1; d <= 31; d++) {
          const dayStr = d < 10 ? `0${d}` : `${d}`;
          mockDailyData.push({
            id: `d-${yr}-01-${dayStr}`,
            stasiun_id: 'sta-1',
            tanggal: `${yr}-01-${dayStr}`,
            curah_hujan: 10,
          });
        }
        for (let d = 1; d <= 28; d++) {
          const dayStr = d < 10 ? `0${d}` : `${d}`;
          mockDailyData.push({
            id: `d-${yr}-02-${dayStr}`,
            stasiun_id: 'sta-1',
            tanggal: `${yr}-02-${dayStr}`,
            curah_hujan: 5,
          });
        }
      }

      const agg = aggregateMonthlyRainfall(mockDailyData);

      expect(agg.years).toEqual([2020, 2021, 2022]);
      expect(agg.monthlyByYear[2020][0]).toBe(310);
      expect(agg.monthlyByYear[2021][0]).toBe(310);
      expect(agg.monthlyByYear[2022][0]).toBe(310);
      expect(agg.averageMonthly[0]).toBe(310);

      expect(agg.monthlyByYear[2020][1]).toBe(140);
      expect(agg.averageMonthly[1]).toBe(140);
    });
  });

  describe('2.2 Multi-Year Continuous F.J. Mock Simulation & Weibull FDC (SNI 6738:2015 & KP-01)', () => {
    const params: MockParams = {
      luasDas: 100, // 100 km²
      smc: 200,
      ism: 150,
      infiltrationFactor: 0.4,
      k: 0.6,
      exposedSurface: 0.1,
      initialGwStorage: 20,
    };

    // 5 years synthetic rainfall matrix (mm/month)
    const yearsData: MultiYearFJMockInput[] = [
      {
        year: 2018,
        monthlyPrecip: [320, 290, 260, 180, 110, 70, 40, 30, 60, 140, 220, 290],
      },
      {
        year: 2019,
        monthlyPrecip: [280, 250, 220, 150, 90, 50, 30, 20, 40, 110, 190, 260],
      },
      {
        year: 2020,
        monthlyPrecip: [350, 310, 290, 210, 140, 90, 60, 50, 80, 170, 250, 320],
      },
      {
        year: 2021,
        monthlyPrecip: [300, 270, 240, 170, 100, 60, 40, 30, 50, 130, 210, 280],
      },
      {
        year: 2022,
        monthlyPrecip: [340, 300, 270, 190, 120, 80, 50, 40, 70, 150, 230, 300],
      },
    ];

    it('executes continuous multi-year simulation across 5 years with 12 distinct monthly Q80 values', () => {
      const result = calculateMultiYearFJMock(params, yearsData, 80);

      expect(result.yearsCount).toBe(5);
      expect(result.probability).toBe(80);
      expect(result.monthlyQAndalan).toHaveLength(12);
      expect(result.monthlyRAndalan).toHaveLength(12);
      expect(result.monthlyBreakdown).toHaveLength(12);

      // Verify that wet season (Jan-Feb) has distinctly higher Q80 than dry season (Jul-Aug)
      const qJan = result.monthlyQAndalan[0];
      const qAug = result.monthlyQAndalan[7];
      expect(qJan).toBeGreaterThan(qAug);
      expect(qJan).toBeGreaterThan(0);
      expect(qAug).toBeGreaterThan(0);

      // Verify continuous results length = 5 years * 12 months = 60 months
      expect(result.continuousResults).toHaveLength(60);

      // Verify each month ranking uses Weibull formula P = m / (N+1)
      const janBreakdown = result.monthlyBreakdown[0];
      expect(janBreakdown.rankedDischarge).toHaveLength(5);
      // For N = 5, rankings should be m/(5+1) * 100 = 16.67%, 33.33%, 50.00%, 66.67%, 83.33%
      expect(janBreakdown.rankedDischarge[0].probability).toBeCloseTo(16.67, 1);
      expect(janBreakdown.rankedDischarge[4].probability).toBeCloseTo(83.33, 1);
    });

    it('verifies groundwater storage mass conservation continuity across year boundaries', () => {
      const result = calculateMultiYearFJMock(params, yearsData, 80);

      // Check boundary from Month 12 (Year 2018) to Month 13 (Year 2019 Month 1)
      const dec2018 = result.continuousResults[11];
      const jan2019 = result.continuousResults[12];

      expect(dec2018.year).toBe(2018);
      expect(jan2019.year).toBe(2019);

      // In F.J. Mock, Vg at start of Jan 2019 is Vg from end of Dec 2018
      const expectedVgJan2019 =
        params.k * dec2018.gwStorage +
        0.5 * (1 + params.k) * jan2019.infiltration;
      expect(jan2019.gwStorage).toBeCloseTo(expectedVgJan2019, 1);
    });
  });

  describe('2.3 KP-01 Effective Rainfall Derivation (Reff = 0.70 * R80 / days)', () => {
    it('correctly calculates effective rainfall for Padi, Palawija, and Bero', () => {
      // 12 monthly R80 values (mm)
      const r80Monthly = [250, 220, 200, 150, 90, 60, 30, 20, 45, 120, 180, 240];
      const polaTanam: PolaTanam[] = [
        'padi',
        'padi',
        'padi',
        'padi',
        'palawija',
        'palawija',
        'palawija',
        'bero',
        'bero',
        'padi',
        'padi',
        'padi',
      ];

      const rEff = calculateKPEffectiveRainfall(r80Monthly, polaTanam);

      expect(rEff).toHaveLength(12);

      // Month 0 (Jan, 31 days, Padi): Reff = 0.70 * 250 / 31 = 5.645 mm/day
      expect(rEff[0]).toBeCloseTo((0.7 * 250) / 31, 2);

      // Month 4 (Mei, 31 days, Palawija): Reff = 0.50 * 90 / 31 = 1.452 mm/day
      expect(rEff[4]).toBeCloseTo((0.5 * 90) / 31, 2);

      // Month 7 (Agu, 31 days, Bero): Reff = 0
      expect(rEff[7]).toBe(0);
    });
  });
});
