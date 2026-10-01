import { describe, it, expect } from 'vitest';
import {
  calculateDomesticDemand,
  calculateAgricultureDemand,
  calculateWaterBalance,
  getWaterBalanceSummary,
  classifyWaterScarcity,
  sequentPeakAlgorithm,
  calculateRippleMassCurve,
} from '@/services/waterBalanceEngine';
import {
  calculateVanDeGoorZijlstra,
  convertDailyEToToMonthly,
  convertMonthlyEToToDaily,
  calculateIrrigationDemand,
  calculateKPEffectiveRainfall,
  generateDefaultIrrigationInput,
  type IrrigationParams,
} from '@/lib/engine/irrigationDemand';
import {
  calculateFJMock,
  calculateWeibullDependableFlow,
  calculateMultiYearFJMock,
  type MockParams,
} from '@/lib/engine/fjMock';

describe('Water Balance & Hydrology Parity Suite', () => {

  describe('Domestic & Agriculture Basic Conversions', () => {
    it('calculates domestic demand correctly per SNI standards', () => {
      // 5,000 people at 100 L/cap/day
      // (5000 * 100) / 86,400,000 = 0.005787 m³/s
      const qDom = calculateDomesticDemand(5000, 100);
      expect(qDom).toBeCloseTo(0.005787, 5);
    });

    it('calculates agriculture flat demand correctly', () => {
      // 100 Ha at 1.0 L/s/Ha = 100 L/s = 0.10 m³/s
      const qAgri = calculateAgricultureDemand(100, 1.0);
      expect(qAgri).toBeCloseTo(0.10, 4);
    });
  });

  describe('KP-01 Van de Goor & Zijlstra Land Preparation', () => {
    it('computes land preparation water requirement according to Ditjen SDA formula', () => {
      // Eo = 5.5 mm/day, P = 2.0 mm/day -> M = 7.5 mm/day
      // T = 30 days, S = 250 mm -> k = (7.5 * 30) / 250 = 0.90
      // e^0.90 ≈ 2.4596
      // IR = 7.5 * (2.4596 / 1.4596) ≈ 12.64 mm/day
      const ir = calculateVanDeGoorZijlstra(5.5, 2.0, 30, 250);
      expect(ir).toBeCloseTo(12.64, 1);
    });

    it('handles zero or boundary saturation depth gracefully', () => {
      const ir = calculateVanDeGoorZijlstra(4.0, 1.0, 0, 0);
      expect(ir).toBe(5.0); // M = Eo + P
    });
  });

  describe('ETo Unit Conversion Utilities', () => {
    it('converts daily ETo to monthly total and vice versa with conservation of volume', () => {
      const daily = [4.8, 5.0, 5.0, 5.0, 4.5, 4.0, 3.7, 4.0, 4.5, 5.0, 5.0, 4.8];
      const monthly = convertDailyEToToMonthly(daily);
      expect(monthly[0]).toBeCloseTo(4.8 * 31, 1); // Jan: 148.8
      expect(monthly[1]).toBeCloseTo(5.0 * 28, 1); // Feb: 140.0

      const backToDaily = convertMonthlyEToToDaily(monthly);
      for (let i = 0; i < 12; i++) {
        expect(backToDaily[i]).toBeCloseTo(daily[i], 1);
      }
    });
  });

  describe('KP-01 Dynamic Irrigation Demand Engine', () => {
    it('computes NFR and Diversion Requirement (DR) for typical cropping cycle', () => {
      const params: IrrigationParams = {
        luasIrigasi: 500, // 500 Ha
        efisiensi: 0.65, // 65% efficiency
      };

      const defaultInput = generateDefaultIrrigationInput();
      const results = calculateIrrigationDemand(params, defaultInput);

      expect(results).toHaveLength(12);

      // In fallow (bero) months (e.g. Sep/Oct, index 8/9), NFR and DR must be zero
      const beroRow = results.find(r => r.polaTanam === 'bero');
      if (beroRow) {
        expect(beroRow.nfr).toBe(0);
        expect(beroRow.dr).toBe(0);
      }

      // In paddy months, DR must be positive
      const padiRow = results.find(r => r.polaTanam === 'padi');
      expect(padiRow).toBeDefined();
      expect(padiRow!.dr).toBeGreaterThan(0);
      expect(padiRow!.nfrLsHa).toBeGreaterThan(0);
    });

    it('calculates KP-01 effective rainfall factor (70% for paddy, 50% for palawija)', () => {
      const r80 = [100, 100, 100, 100, 50, 50, 20, 20, 0, 0, 100, 100];
      const pola = ['padi', 'padi', 'padi', 'padi', 'palawija', 'palawija', 'bero', 'bero', 'bero', 'bero', 'padi', 'padi'] as const;
      const reff = calculateKPEffectiveRainfall(r80, pola as any);

      expect(reff).toHaveLength(12);
      // Jan (padi, 31 days): (100 * 0.70) / 31 = 2.258 -> 2.26 mm/day
      expect(reff[0]).toBeCloseTo(2.26, 1);
      // May (palawija, 31 days): (50 * 0.50) / 31 = 0.806 -> 0.81 mm/day
      expect(reff[4]).toBeCloseTo(0.81, 1);
      // Jul (bero): must be 0
      expect(reff[6]).toBe(0);
    });
  });

  describe('Water Scarcity Index (SNI 19-6728.1-2002)', () => {
    it('classifies water scarcity categories with correct thresholds', () => {
      // 1. Aman: Demand < 50% of Supply
      const aman = classifyWaterScarcity(40, 100);
      expect(aman.status).toBe('Aman');
      expect(aman.badgeColor).toBe('emerald');
      expect(aman.ikaPercent).toBe(40.0);

      // 2. Sedang: 50% <= Demand <= 75%
      const sedang = classifyWaterScarcity(65, 100);
      expect(sedang.status).toBe('Sedang');
      expect(sedang.badgeColor).toBe('amber');

      // 3. Kritis: 75% < Demand <= 100%
      const kritis = classifyWaterScarcity(90, 100);
      expect(kritis.status).toBe('Kritis');
      expect(kritis.badgeColor).toBe('orange');

      // 4. Sangat Kritis: Demand > 100%
      const sangatKritis = classifyWaterScarcity(130, 100);
      expect(sangatKritis.status).toBe('Sangat Kritis');
      expect(sangatKritis.badgeColor).toBe('rose');
    });
  });

  describe('Sequent Peak Algorithm & Storage Sizing', () => {
    it('returns zero required storage when inflows always exceed outflows', () => {
      const inflows = [100, 100, 100, 100];
      const outflows = [50, 50, 50, 50];
      const storage = sequentPeakAlgorithm(inflows, outflows);
      expect(storage).toBe(0);
    });

    it('calculates required active storage to bridge dry-season deficit', () => {
      // Wet period: inflow 100, outflow 40 (+60)
      // Dry period: inflow 20, outflow 60 (-40)
      const inflows = [100, 20, 20, 100];
      const outflows = [40, 60, 60, 40];
      const storage = sequentPeakAlgorithm(inflows, outflows);
      // Deficit across the dry period: 40 + 40 = 80
      expect(storage).toBe(80);
    });

    it('computes Ripple mass curve correctly', () => {
      const results = calculateWaterBalance({
        population: 5000,
        agricultureArea: 100,
        domesticStandard: 100,
        irrigationDemand: 1.0,
        monthlySupply: [2.0, 1.8, 1.5, 1.2, 0.8, 0.5, 0.3, 0.2, 0.4, 0.8, 1.5, 1.9],
      });

      const ripple = calculateRippleMassCurve(results);
      expect(ripple).toHaveLength(12);
      expect(ripple[11].cumInflowM3).toBeGreaterThan(0);
      expect(ripple[11].cumOutflowM3).toBeGreaterThan(0);
    });
  });

  describe('Integrated Water Balance with Dynamic KP-01 Feeding', () => {
    it('replaces flat irrigation demand with dynamic KP-01 DR when provided', () => {
      const dynamicDR = [0.15, 0.18, 0.12, 0.08, 0.05, 0.02, 0.0, 0.0, 0.0, 0.04, 0.10, 0.16];
      const inputs = {
        population: 10000,
        agricultureArea: 200,
        domesticStandard: 120,
        irrigationDemand: 1.0, // Should be ignored when dynamicDR is passed!
        dynamicIrrigationDemand: dynamicDR,
        monthlySupply: [1.5, 1.4, 1.2, 1.0, 0.8, 0.6, 0.5, 0.4, 0.5, 0.8, 1.1, 1.3],
      };

      const results = calculateWaterBalance(inputs);
      expect(results).toHaveLength(12);

      // Verify agricultureDemand matches dynamicDR exactly
      for (let i = 0; i < 12; i++) {
        expect(results[i].agricultureDemand).toBeCloseTo(dynamicDR[i], 4);
      }

      // Verify environmental flow is 10% of supply (UU 17/2019)
      for (let i = 0; i < 12; i++) {
        expect(results[i].environmentalFlow).toBeCloseTo(results[i].supply * 0.10, 4);
      }

      const summary = getWaterBalanceSummary(results);
      expect(summary.totalSupply).toBeGreaterThan(0);
      expect(summary.totalDemand).toBeGreaterThan(0);
      expect(summary.waterScarcity).toBeDefined();
      expect(summary.storageRequiredM3).toBeGreaterThanOrEqual(0);
    });
  });

  describe('F.J. Mock Multi-Year Simulation & Dependable Flow', () => {
    it('executes continuous multi-year simulation and calculates monthly Q80', () => {
      const params: MockParams = {
        luasDas: 45.0,
        smc: 200,
        ism: 200,
        infiltrationFactor: 0.4,
        k: 0.7,
        exposedSurface: 0.1,
      };

      const yearsData = [
        {
          year: 2021,
          monthlyPrecip: [300, 280, 250, 180, 120, 80, 50, 40, 60, 150, 220, 290],
        },
        {
          year: 2022,
          monthlyPrecip: [320, 290, 260, 200, 110, 70, 40, 30, 50, 140, 230, 310],
        },
        {
          year: 2023,
          monthlyPrecip: [280, 260, 230, 160, 90, 60, 30, 20, 40, 130, 200, 270],
        },
      ];

      const res = calculateMultiYearFJMock(params, yearsData, 80);

      expect(res.yearsCount).toBe(3);
      expect(res.monthlyQAndalan).toHaveLength(12);
      expect(res.monthlyRAndalan).toHaveLength(12);
      expect(res.continuousResults).toHaveLength(36);

      // Wet season discharges must exceed dry season discharges
      const janQ = res.monthlyQAndalan[0];
      const augQ = res.monthlyQAndalan[7];
      expect(janQ).toBeGreaterThan(augQ);
    });
  });
});
