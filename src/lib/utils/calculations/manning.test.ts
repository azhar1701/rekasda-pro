import { describe, it, expect } from 'vitest';
import { calculateManning, calculateTrapezoidArea, calculateTrapezoidPerimeter, calculateManningVelocity } from './manning';
import { ChannelShape } from '@/types/common.types';

describe('Manning Equation Engine', () => {
  it('calculates trapezoid area correctly', () => {
    expect(calculateTrapezoidArea(2.0, 1.5, 1.5)).toBeCloseTo(6.375, 3);
    expect(calculateTrapezoidArea(0, 1, 1)).toBe(0);
    expect(calculateTrapezoidArea(1, 0, 1)).toBe(0);
  });

  it('calculates trapezoid perimeter correctly', () => {
    expect(calculateTrapezoidPerimeter(2.0, 1.5, 1.5)).toBeCloseTo(7.408, 3);
  });

  it('calculates basic manning velocity correctly', () => {
    const v = calculateManningVelocity(0.025, 1.5, 0.001); // (1/0.025) * 1.5^(2/3) * sqrt(0.001)
    expect(v).toBeCloseTo(1.658, 3);
    expect(calculateManningVelocity(0, 1, 1)).toBe(0);
  });

  it('performs full Manning calculation with subcritical flow', () => {
    const inputs = {
      shape: ChannelShape.TRAPEZOID,
      width: 5.0,
      depth: 2.0,
      sideSlope: 1.0,  // z=1
      slope: 0.0005,
      roughness: 0.025,
      diameter: 0 // ignored
    };
    const result = calculateManning(inputs);
    
    // A = (5 + 1*2)*2 = 14
    expect(parseFloat(result.Area)).toBeCloseTo(14.0, 2);
    // P = 5 + 2*2*sqrt(2) = 10.657
    expect(parseFloat(result.Perimeter)).toBeCloseTo(10.657, 2);
    // flowtype is string "Sub-kritis" or "Super-kritis"
    expect(result.FlowType).toContain('Sub-kritis');
  });

  it('performs full Manning calculation with supercritical flow', () => {
    const inputs = {
      shape: ChannelShape.TRAPEZOID,
      width: 2.0,
      depth: 0.5,
      sideSlope: 1.5,
      slope: 0.04,     // Steep slope -> high velocity
      roughness: 0.015, // Smooth -> high velocity
      diameter: 0
    };
    const result = calculateManning(inputs);
    expect(result.FlowType).toContain('Super-kritis');
    expect(parseFloat(result.Velocity)).toBeGreaterThan(2.0); // should be fast
  });

  it('throws error for invalid negative or zero inputs', () => {
    const badInputs = {
      shape: ChannelShape.TRAPEZOID,
      width: -2.0,
      depth: 1.0,
      sideSlope: 1.5,
      slope: 0.001,
      roughness: 0.025,
      diameter: 0
    };
    expect(() => calculateManning(badInputs)).toThrow('Channel width must be > 0');
  });

  it('handles circular channel shape', () => {
    const inputs = {
      shape: ChannelShape.CIRCULAR,
      width: 0,
      depth: 0.5, // half full
      sideSlope: 0,
      slope: 0.01,
      roughness: 0.013,
      diameter: 1.0
    };
    const result = calculateManning(inputs);
    // Area of half full pipe = pi * r^2 / 2 = 3.14159 * 0.25 / 2 = 0.3927
    expect(parseFloat(result.Area)).toBeCloseTo(0.393, 2);
    // Perimeter = half circle = pi * r = 1.5708
    expect(parseFloat(result.Perimeter)).toBeCloseTo(1.571, 2);
  });
});
