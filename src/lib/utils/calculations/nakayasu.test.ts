import { describe, it, expect } from 'vitest';
import {
  calculateTg,
  calculateTp,
  calculateT03,
  calculateQp,
  calculateDischargeAtTime,
  generateHydrograph
} from './nakayasu';

describe('HSS Nakayasu Engine', () => {
  const sampleParams = {
    A: 15.0, // km²
    L: 8.5,  // km
    Ro: 1.0, // mm
    Alpha: 2.0
  };

  it('calculates Tg (time of concentration) correctly', () => {
    const Tg = calculateTg(sampleParams.L);
    expect(Tg).toBeCloseTo(0.4 + 0.058 * 8.5, 4);
    expect(calculateTg(0)).toBe(0);
  });

  it('calculates Tp (time to peak) correctly', () => {
    const Tg = calculateTg(sampleParams.L);
    const Tp = calculateTp(Tg);
    // default tr = 0.5 * Tg
    const expectedTp = Tg + 0.8 * (0.5 * Tg);
    expect(Tp).toBeCloseTo(expectedTp, 4);

    const TpCustomTr = calculateTp(Tg, 2.0);
    expect(TpCustomTr).toBeCloseTo(Tg + 0.8 * 2.0, 4);
  });

  it('calculates T03 (time of base) correctly', () => {
    const Tg = 1.5;
    const T03 = calculateT03(sampleParams.Alpha, Tg);
    expect(T03).toBeCloseTo(3.0, 4);
  });

  it('calculates Qp (peak discharge) correctly', () => {
    const Tp = 2.0;
    const T03 = 3.0;
    const Qp = calculateQp(sampleParams.A, sampleParams.Ro, Tp, T03);
    const expectedQp = (15.0 * 1.0) / (3.6 * (0.3 * 2.0 + 3.0));
    expect(Qp).toBeCloseTo(expectedQp, 4);
    expect(calculateQp(0, 1, 1, 1)).toBe(0);
  });

  it('calculates discharge at specific times', () => {
    const Qp = 10.0;
    const Tp = 2.0;
    const T03 = 3.0;

    // t < 0
    expect(calculateDischargeAtTime(-1, Qp, Tp, T03)).toBe(0);
    
    // Rising limb t < Tp
    expect(calculateDischargeAtTime(1, Qp, Tp, T03)).toBeCloseTo(10 * Math.pow(1/2, 2.4), 4);
    
    // Peak t = Tp
    expect(calculateDischargeAtTime(2, Qp, Tp, T03)).toBeCloseTo(10, 4);

    // Falling limb 1 (Tp < t < Tp + T03) -> t=4
    expect(calculateDischargeAtTime(4, Qp, Tp, T03)).toBeCloseTo(10 * Math.pow(0.3, (4-2)/3), 4);

    // Falling limb 2 (Tp + T03 < t < Tp + T03 + 1.5*T03) -> t=6
    expect(calculateDischargeAtTime(6, Qp, Tp, T03)).toBeCloseTo(10 * Math.pow(0.3, 1 + (6-2-3)/(1.5*3)), 4);

    // Falling limb 3 (t > Tp + 2.5*T03) -> t=10
    expect(calculateDischargeAtTime(10, Qp, Tp, T03)).toBeCloseTo(10 * Math.pow(0.3, 2.5 + (10-2-7.5)/(2*3)), 4);
  });

  it('generates hydrograph array safely without floating-point drift', () => {
    const Qp = 10.0;
    const Tp = 2.0;
    const T03 = 3.0;
    const timeStep = 0.1;
    // total time will be Tp + 3 * T03 = 2.0 + 9.0 = 11.0
    
    const hydrograph = generateHydrograph(Qp, Tp, T03, timeStep);
    const expectedPoints = (11.0 / 0.1) + 1; // 111 points

    expect(hydrograph.length).toBe(Math.round(expectedPoints));
    expect(hydrograph[0].time).toBe(0);
    expect(hydrograph[hydrograph.length - 1].time).toBe(11.0);
    
    // Checking precision
    for (const point of hydrograph) {
      expect(Number.isFinite(point.time)).toBe(true);
      expect(Number.isFinite(point.discharge)).toBe(true);
      // Ensure no trailing 999999 or 000001 drift on time
      const timeStr = point.time.toString();
      expect(timeStr.length).toBeLessThanOrEqual(5); // e.g. "10.9" is 4 chars
    }
  });
});
