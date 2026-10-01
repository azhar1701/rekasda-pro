import { describe, it, expect } from 'vitest';
import { calculateConvolution, validateConvolutionData } from '../../utils/convolutionUtils';
import { calculateFJMock, type MockParams, type MockMonthlyInput } from '../fjMock';

describe('Phase 1 Hydrology Engine Parity & Conservation Tests', () => {

  describe('1. Convolution Engine (Time-Step Normalization & Conservation)', () => {
    it('should correctly shift hydrographs by actual rainInterval when timeStep is 0.5h', () => {
      // 2 hours of effective rainfall: 10 mm on hour 1, 20 mm on hour 2
      const hujanEfektif = [10, 20]; // duration of each block = 1.0 hour
      // Triangular unit hydrograph (for 1 mm of excess rain) at dt = 0.5 hour
      // ordinates at t = 0.0, 0.5, 1.0, 1.5, 2.0
      const ordinatHSS = [0, 2.0, 4.0, 2.0, 0];

      const result = calculateConvolution({
        hujanEfektif,
        ordinatHSS,
        baseflow: 0,
        timeStep: 0.5,
        rainInterval: 1.0,
      });

      // lagSteps = 1.0 / 0.5 = 2 steps
      // Total steps = (2 - 1) * 2 + 5 = 7 steps
      // Time values: t = 0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0
      expect(result.debitBanjir).toHaveLength(7);

      // Component 1 (rain=10): [0, 20, 40, 20, 0, 0, 0]
      // Component 2 (rain=20, lagged by 2 steps = 1.0h): [0, 0, 0, 40, 80, 40, 0]
      // Total sum:
      // t=0.0 (idx 0): 0
      // t=0.5 (idx 1): 20
      // t=1.0 (idx 2): 40 + 0 = 40
      // t=1.5 (idx 3): 20 + 40 = 60
      // t=2.0 (idx 4): 0 + 80 = 80
      // t=2.5 (idx 5): 0 + 40 = 40
      // t=3.0 (idx 6): 0
      expect(result.debitBanjir[0]).toBeCloseTo(0, 1);
      expect(result.debitBanjir[1]).toBeCloseTo(20, 1);
      expect(result.debitBanjir[2]).toBeCloseTo(40, 1);
      expect(result.debitBanjir[3]).toBeCloseTo(60, 1);
      expect(result.debitBanjir[4]).toBeCloseTo(80, 1);
      expect(result.debitBanjir[5]).toBeCloseTo(40, 1);
      expect(result.debitBanjir[6]).toBeCloseTo(0, 1);

      expect(result.debitPuncak).toBeCloseTo(80, 1);
      expect(result.waktuPuncak).toBeCloseTo(2.0, 1);
    });

    it('should calculate volume conservation ratio against DAS area', () => {
      const luasDas = 10; // km²
      const hujanEfektif = [15]; // 15 mm rain
      // Unit hydrograph for 10 km² DAS with volume = 1 mm * 10 km² * 1000 = 10,000 m³
      // Ordinates over dt = 1h: [0, 2.7778, 0] -> trapezoid: (0+2.7778)/2*3600 + (2.7778+0)/2*3600 = 2.7778 * 3600 ≈ 10,000 m³
      const ordinatHSS = [0, 2.7778, 0];

      const result = calculateConvolution({
        hujanEfektif,
        ordinatHSS,
        baseflow: 0,
        timeStep: 1.0,
        rainInterval: 1.0,
        luasDas,
      });

      expect(result.volumeConservationRatio).toBeDefined();
      expect(result.volumeConservationRatio).toBeCloseTo(1.0, 2);
    });

    it('should validate inputs properly', () => {
      expect(validateConvolutionData([], [1, 2]).valid).toBe(false);
      expect(validateConvolutionData([1, 2], []).valid).toBe(false);
      expect(validateConvolutionData([1, 2], [1, 2]).valid).toBe(true);
    });
  });

  describe('2. F.J. Mock Engine (Groundwater Mass Conservation & Formula Baku)', () => {
    it('should strictly conserve infiltration into groundwater storage and baseflow (I = dVg + BF)', () => {
      const params: MockParams = {
        luasDas: 25, // km²
        smc: 200,
        ism: 150,
        infiltrationFactor: 0.5,
        k: 0.6,
        exposedSurface: 0.1,
        initialGwStorage: 100,
      };

      const monthlyData: MockMonthlyInput[] = [
        { month: 'Jan', precipitation: 250, eto: 120, daysInMonth: 31 },
        { month: 'Feb', precipitation: 200, eto: 110, daysInMonth: 28 },
        { month: 'Mar', precipitation: 180, eto: 130, daysInMonth: 31 },
      ];

      const results = calculateFJMock(params, monthlyData);

      expect(results).toHaveLength(3);

      let prevVg = params.initialGwStorage ?? 0;
      for (const res of results) {
        const dVg = res.gwStorage - prevVg;
        const totalGwOutput = dVg + res.baseFlow;

        // Infiltration entering groundwater MUST equal dVg + baseFlow within rounding
        expect(totalGwOutput).toBeCloseTo(res.infiltration, 1);
        prevVg = res.gwStorage;
      }
    });

    it('should adhere to the Ditjen SDA formulation for Vg and BF', () => {
      const K = 0.7;
      const initialVg = 80;
      const params: MockParams = {
        luasDas: 10,
        smc: 200,
        ism: 200,
        infiltrationFactor: 0.4,
        k: K,
        exposedSurface: 0.1,
        initialGwStorage: initialVg,
      };

      // In Jan: P=300, ETo=100 -> deltaS = 200
      // prevSM = 200 = SMC -> SM = 200, deltaSM = 0
      // WS = 200
      // I = 200 * 0.4 = 80
      const monthlyData: MockMonthlyInput[] = [
        { month: 'Jan', precipitation: 300, eto: 100, daysInMonth: 31 },
      ];

      const results = calculateFJMock(params, monthlyData);
      const jan = results[0];

      expect(jan.waterSurplus).toBeCloseTo(200, 1);
      expect(jan.infiltration).toBeCloseTo(80, 1);

      // Expected Vg = K * prevVg + 0.5 * (1 + K) * I
      // Vg = 0.7 * 80 + 0.5 * (1 + 0.7) * 80 = 56 + 0.5 * 1.7 * 80 = 56 + 68 = 124
      const expectedVg = K * initialVg + 0.5 * (1 + K) * jan.infiltration;
      expect(jan.gwStorage).toBeCloseTo(expectedVg, 2);

      // Expected BF = (1 - K) * (prevVg + 0.5 * I)
      // BF = 0.3 * (80 + 40) = 0.3 * 120 = 36
      const expectedBF = (1 - K) * (initialVg + 0.5 * jan.infiltration);
      expect(jan.baseFlow).toBeCloseTo(expectedBF, 2);

      // Check I = (Vg - initialVg) + BF: (124 - 80) + 36 = 44 + 36 = 80 = I
      expect(jan.gwStorage - initialVg + jan.baseFlow).toBeCloseTo(jan.infiltration, 2);
    });
  });

});
