import { describe, it, expect } from 'vitest';
import {
  calculateHSSNakayasu,
  calculateRational,
  calculateMelchior,
  calculateHaspers,
  calculateDerWeduwen,
  calculateConvolution,
  generateEmpiricalHydrograph,
} from '@/lib/engine/flood';
import { calculateCumulativeSCSCNRunoff } from '@/lib/utils/hydrology/runoff';

describe('Flood Analysis Parity & SNI 2415:2016 Compliance Tests', () => {

  describe('1. HSS Nakayasu Branching & Standards Compliance (SNI 2415:2016 Pasal 6.3)', () => {
    it('should use power formula Tg = 0.21 * L^0.7 when river length L <= 15 km', () => {
      const L = 8.0; // km (<= 15 km)
      const input = {
        Ro: 1.0,
        Alpha: 2.0,
        A: 25.0,
        L: L
      };

      const result = calculateHSSNakayasu(input);

      // Expected Tg = 0.21 * 8^0.7 = 0.21 * 4.287 = 0.900 jam
      const expectedTg = 0.21 * Math.pow(L, 0.7);
      const expectedTr = 0.75 * expectedTg;
      const expectedTp = expectedTg + 0.8 * expectedTr;

      expect(result.Tp).toBeCloseTo(expectedTp, 1);
      expect(result.Qp).toBeGreaterThan(0);
      expect(result.hydrograph.length).toBeGreaterThan(0);
    });

    it('should use linear formula Tg = 0.4 + 0.058 * L when river length L > 15 km', () => {
      const L = 25.0; // km (> 15 km)
      const input = {
        Ro: 1.0,
        Alpha: 2.0,
        A: 80.0,
        L: L
      };

      const result = calculateHSSNakayasu(input);

      // Expected Tg = 0.4 + 0.058 * 25 = 1.85 jam
      const expectedTg = 0.4 + 0.058 * L;
      const expectedTr = 0.75 * expectedTg;
      const expectedTp = expectedTg + 0.8 * expectedTr;

      expect(result.Tp).toBeCloseTo(expectedTp, 1);
      expect(result.Qp).toBeGreaterThan(0);
      expect(result.hydrograph.length).toBeGreaterThan(0);
    });
  });

  describe('2. Cumulative SCS-CN Runoff Abstraction (NRCS NEH-4)', () => {
    it('should accumulate storm rainfall before deducting initial abstraction (Ia = 0.2S)', () => {
      const CN = 75;
      const S = (25400 / CN) - 254; // 84.67 mm
      const Ia = 0.2 * S;           // 16.93 mm

      // Storm hyetograph: [10, 15, 30, 20, 15, 10] => Total = 100 mm
      const hyetograph = [10, 15, 30, 20, 15, 10];
      const peff = calculateCumulativeSCSCNRunoff(hyetograph, CN);

      expect(peff).toHaveLength(hyetograph.length);

      // Hour 1: CumP = 10 mm <= 16.93 mm => Peff[0] must be 0
      expect(peff[0]).toBe(0);

      // Hour 2: CumP = 25 mm > 16.93 mm => Runoff starts in hour 2
      expect(peff[1]).toBeGreaterThan(0);

      // Hours 3 to 6: Runoff continues incrementally
      for (let i = 2; i < peff.length; i++) {
        expect(peff[i]).toBeGreaterThan(0);
      }

      // Total effective rainfall should equal standard cumulative formula for 100 mm
      const totalP = hyetograph.reduce((a, b) => a + b, 0);
      const expectedTotalQ = Math.pow(totalP - Ia, 2) / (totalP + 0.8 * S);
      const actualTotalQ = peff.reduce((a, b) => a + b, 0);

      expect(actualTotalQ).toBeCloseTo(expectedTotalQ, 1);
    });
  });

  describe('3. Empirical Hydrograph Synthesis (SNI 2415:2016 Pasal 5.3)', () => {
    it('should generate valid synthetic hydrograph matching Qp for Rational Method', () => {
      const Qp = 45.5; // m³/s
      const tc = 2.0;  // jam
      const hydrograph = generateEmpiricalHydrograph('rational', Qp, tc, 24);

      expect(hydrograph.length).toBeGreaterThan(10);
      expect(hydrograph[0].time).toBe(0);
      expect(hydrograph[0].discharge).toBe(0);

      // Max discharge in hydrograph must equal Qp
      const maxQ = Math.max(...hydrograph.map(h => h.discharge));
      expect(maxQ).toBeCloseTo(Qp, 2);

      // Hydrograph should peak near tc
      const peakPoint = hydrograph.find(h => Math.abs(h.discharge - Qp) < 0.01);
      expect(peakPoint?.time).toBeCloseTo(tc, 1);
    });
  });

  describe('4. Hydrograph Convolution & Volume Integration', () => {
    it('should convolve unit hydrograph with effective rainfall and compute total volume', () => {
      // 1 mm UH
      const unitHydrograph = [
        { time: 0, discharge: 0 },
        { time: 1, discharge: 2.5 },
        { time: 2, discharge: 8.0 },
        { time: 3, discharge: 5.0 },
        { time: 4, discharge: 2.0 },
        { time: 5, discharge: 0.8 },
        { time: 6, discharge: 0 }
      ];

      // Effective rainfall: 2 hours of rain
      const effectiveRainfall = [20.0, 35.0];

      const conv = calculateConvolution({
        unitHydrograph,
        effectiveRainfall
      });

      expect(conv.hydrograph.length).toBeGreaterThan(unitHydrograph.length);
      expect(conv.Qp).toBeGreaterThan(0);
      expect(conv.Tp).toBeGreaterThan(0);

      // totalVolume must be computed and positive
      expect(conv.totalVolume).toBeDefined();
      expect(conv.totalVolume).toBeGreaterThan(0);

      // Dimension check: approx volume
      // 55 mm over equivalent catchment should yield consistent order of magnitude
      expect(conv.totalVolume).toBeGreaterThan(1000);
    });
  });

  describe('5. Empirical Peak Discharge Engines', () => {
    it('should compute Rational Method discharge with Kirpich tc and Mononobe intensity', () => {
      const input = {
        C: 0.65,
        A: 2.5,  // km² (<= 3 km² / 300 ha)
        L: 2.0,  // km
        S: 0.02, // m/m
        R24: 120 // mm
      };

      const result = calculateRational(input);
      expect(result.Qp).toBeGreaterThan(0);
      expect(result.tc).toBeGreaterThan(0);
      expect(result.I).toBeGreaterThan(0);
    });

    it('should compute Melchior, Haspers, and Der Weduwen methods', () => {
      const params = {
        A: 45.0,
        L: 12.0,
        S: 0.015,
        R24: 135
      };

      const melchior = calculateMelchior(params);
      const haspers = calculateHaspers(params);
      const derWeduwen = calculateDerWeduwen(params);

      expect(melchior.Qp).toBeGreaterThan(0);
      expect(haspers.Qp).toBeGreaterThan(0);
      expect(derWeduwen.Qp).toBeGreaterThan(0);
    });
  });
});
