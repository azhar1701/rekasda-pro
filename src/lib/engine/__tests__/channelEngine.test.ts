import { describe, it, expect } from 'vitest';
import {
  calculateChannelGeometry,
  calculateChannelHydraulics,
  calculateCriticalDepth,
  solveOptimalDimensions,
  SNI_CHANNEL_MATERIALS
} from '@/lib/engine/channelEngine';

describe('Channel Hydraulics Engine (channelEngine.ts)', () => {
  // ---------------------------------------------------------------------------
  // 1. Geometry Calculations
  // ---------------------------------------------------------------------------
  describe('1. calculateChannelGeometry', () => {
    it('calculates rectangular channel geometry accurately', () => {
      const geom = calculateChannelGeometry({
        shape: 'rectangular',
        width: 2.0,
        depth: 1.0
      });

      expect(geom.area).toBe(2.0); // 2 * 1 = 2
      expect(geom.wettedPerimeter).toBe(4.0); // 2 + 2(1) = 4
      expect(geom.hydraulicRadius).toBe(0.5); // 2 / 4 = 0.5
      expect(geom.topWidth).toBe(2.0);
      expect(geom.hydraulicDepth).toBe(1.0);
    });

    it('calculates trapezoidal channel geometry accurately', () => {
      const geom = calculateChannelGeometry({
        shape: 'trapezoid',
        width: 2.0,
        depth: 1.0,
        sideSlope: 1.0
      });

      // A = (b + mh)h = (2 + 1*1)*1 = 3 m²
      expect(geom.area).toBe(3.0);
      // P = b + 2h√(1+m²) = 2 + 2(1)√2 = 2 + 2.8284 = 4.8284 m
      expect(geom.wettedPerimeter).toBeCloseTo(4.8284, 3);
      // R = A/P = 3 / 4.8284 = 0.6214 m
      expect(geom.hydraulicRadius).toBeCloseTo(3.0 / 4.8284, 3);
      // T = b + 2mh = 2 + 2(1)(1) = 4 m
      expect(geom.topWidth).toBe(4.0);
      expect(geom.hydraulicDepth).toBe(3.0 / 4.0);
    });

    it('calculates triangular channel geometry accurately', () => {
      const geom = calculateChannelGeometry({
        shape: 'triangular',
        depth: 1.0,
        sideSlope: 1.0
      });

      // A = m*h² = 1 * 1² = 1 m²
      expect(geom.area).toBe(1.0);
      // P = 2*h*√(1+m²) = 2*1*√2 = 2.8284 m
      expect(geom.wettedPerimeter).toBeCloseTo(2.8284, 3);
      // T = 2*m*h = 2 m
      expect(geom.topWidth).toBe(2.0);
    });

    it('calculates circular channel full pipe geometry', () => {
      const geom = calculateChannelGeometry({
        shape: 'circular',
        diameter: 1.0,
        depth: 1.0
      });

      expect(geom.area).toBeCloseTo(Math.PI * 0.25, 4);
      expect(geom.wettedPerimeter).toBeCloseTo(Math.PI * 1.0, 4);
      expect(geom.hydraulicRadius).toBeCloseTo(0.25, 4); // D / 4
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Manning Flow & Hydraulics
  // ---------------------------------------------------------------------------
  describe('2. calculateChannelHydraulics', () => {
    it('computes discharge, velocity, and Froude number for rectangular subcritical flow', () => {
      const result = calculateChannelHydraulics({
        shape: 'rectangular',
        width: 2.0,
        depth: 1.0,
        slope: 0.001,
        roughness: 0.015, // Beton
        totalDepth: 1.8
      });

      // V = (1/0.015) * 0.5^(2/3) * sqrt(0.001)
      const expectedV = (1 / 0.015) * Math.pow(0.5, 2 / 3) * Math.sqrt(0.001);
      const expectedQ = 2.0 * expectedV;

      expect(result.velocity).toBeCloseTo(expectedV, 3);
      expect(result.discharge).toBeCloseTo(expectedQ, 3);
      expect(result.froudeNumber).toBeLessThan(1.0);
      expect(result.flowRegime).toBe('Subkritis');
      expect(result.isFreeboardSafe).toBe(true);
      expect(result.velocityStatus).toBe('Normal');
    });

    it('detects supercritical flow and calculates hydraulic jump properties', () => {
      // Steep slope for supercritical flow
      const result = calculateChannelHydraulics({
        shape: 'rectangular',
        width: 2.0,
        depth: 0.3,
        slope: 0.03, // steep slope 3%
        roughness: 0.013,
        totalDepth: 1.5
      });

      expect(result.froudeNumber).toBeGreaterThan(1.05);
      expect(result.flowRegime).toBe('Superkritis');
      expect(result.hydraulicJump).toBeDefined();
      expect(result.hydraulicJump?.hasJump).toBe(true);
      expect(result.hydraulicJump?.sequentDepth).toBeGreaterThan(0.3);
      expect(result.hydraulicJump?.energyLoss).toBeGreaterThan(0);
    });

    it('flags sediment risk when velocity is below SNI minimum (< 0.6 m/s)', () => {
      const result = calculateChannelHydraulics({
        shape: 'rectangular',
        width: 5.0,
        depth: 0.2,
        slope: 0.0001, // extremely flat slope
        roughness: 0.030,
        totalDepth: 1.0
      });

      expect(result.velocity).toBeLessThan(0.6);
      expect(result.velocityStatus).toBe('Rawan Sedimentasi (Silting)');
      expect(result.isVelocitySafe).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Critical Depth Solver
  // ---------------------------------------------------------------------------
  describe('3. calculateCriticalDepth', () => {
    it('computes exact analytical critical depth for rectangular channel', () => {
      const Q = 5.0; // m³/s
      const b = 2.0; // m
      const q = Q / b; // 2.5
      const expectedYc = Math.pow((q * q) / 9.81, 1 / 3);

      const yc = calculateCriticalDepth(Q, 'rectangular', { width: b });
      expect(yc).toBeCloseTo(expectedYc, 3);
    });

    it('computes critical depth for trapezoidal channel numerically', () => {
      const Q = 10.0;
      const yc = calculateCriticalDepth(Q, 'trapezoid', { width: 3.0, sideSlope: 1.5 });
      expect(yc).toBeGreaterThan(0.5);
      expect(yc).toBeLessThan(3.0);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Optimal Hydraulic Section Solver
  // ---------------------------------------------------------------------------
  describe('4. solveOptimalDimensions', () => {
    it('solves rectangular best hydraulic section (b = 2h, R = h/2)', () => {
      const opt = solveOptimalDimensions({
        shape: 'rectangular',
        targetDischarge: 4.5,
        slope: 0.002,
        roughness: 0.015
      });

      expect(opt.width).toBeCloseTo(2 * opt.depth, 1);
      expect(opt.capacity).toBeCloseTo(4.5, 1);
      expect(opt.totalDepth).toBeGreaterThan(opt.depth);
      expect(opt.freeboard).toBeGreaterThanOrEqual(0.3);
      expect(opt.isOptimal).toBe(true);
    });

    it('solves trapezoidal best hydraulic section accurately', () => {
      const opt = solveOptimalDimensions({
        shape: 'trapezoid',
        targetDischarge: 8.0,
        slope: 0.0015,
        roughness: 0.020,
        sideSlope: 1.0
      });

      expect(opt.capacity).toBeCloseTo(8.0, 1);
      expect(opt.width).toBeGreaterThan(0);
      expect(opt.depth).toBeGreaterThan(0);
      expect(opt.totalDepth).toBeGreaterThan(opt.depth);
    });

    it('solves circular pipe diameter for design discharge', () => {
      const opt = solveOptimalDimensions({
        shape: 'circular',
        targetDischarge: 1.2,
        slope: 0.003,
        roughness: 0.013
      });

      expect(opt.diameter).toBeDefined();
      expect(opt.diameter!).toBeGreaterThan(0.5);
      expect(opt.capacity).toBeGreaterThanOrEqual(1.1);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. SNI Material Constants
  // ---------------------------------------------------------------------------
  describe('5. SNI_CHANNEL_MATERIALS', () => {
    it('has standard materials covering artificial and natural channels', () => {
      expect(SNI_CHANNEL_MATERIALS.length).toBeGreaterThanOrEqual(6);
      const concrete = SNI_CHANNEL_MATERIALS.find(m => m.id === 'concrete_smooth');
      expect(concrete).toBeDefined();
      expect(concrete?.n).toBe(0.013);
      expect(concrete?.maxVelocity).toBe(3.5);
    });
  });
});
