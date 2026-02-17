/**
 * Manning Formula Calculations
 * ========================================
 *
 * Core hydraulic calculations for open channel flow using Manning's equation
 * 
 * Reference Documents:
 * - Chow, V.T. (1959) "Open Channel Hydraulics"
 * - Indonesian Standard SNI 8066:2015
 * - Hidayat et al. (2020) "Engineering Hydrology"
 *
 * Manning Equation: V = (1/n) * R^(2/3) * S^(1/2)
 * Where:
 *   V = Velocity (m/s)
 *   n = Manning's roughness coefficient
 *   R = Hydraulic radius (A/P), where A=area, P=perimeter
 *   S = Channel slope (m/m)
 */

import { ManningInputs, ChannelShape } from '@/types/types';
import { HydraulicFormatter } from '../formatting/numbers';

const GRAVITY = 9.81; // m/s²
const WATER_UNIT_WEIGHT = 9810; // N/m³
const KINEMATIC_VISCOSITY = 1.004e-6; // m²/s at 20°C

/**
 * Calculate cross-sectional area for trapezoid channel
 * 
 * Formula: A = (b + z*h) * h
 * Where:
 *   b = bottom width (m)
 *   h = water depth (m)
 *   z = side slope ratio (h:1)
 * 
 * @param bottomWidth - Bottom width in meters
 * @param waterDepth - Current water depth in meters
 * @param sideSlope - Side slope ratio (e.g., 0.5 = 0.5:1)
 * @returns Cross-sectional area in m²
 */
export function calculateTrapezoidArea(
  bottomWidth: number,
  waterDepth: number,
  sideSlope: number
): number {
  if (bottomWidth <= 0 || waterDepth <= 0) return 0;
  return (bottomWidth + sideSlope * waterDepth) * waterDepth;
}

/**
 * Calculate wetted perimeter for trapezoid channel
 * 
 * Formula: P = b + 2*h*√(1+z²)
 * Where:
 *   b = bottom width (m)
 *   h = water depth (m)
 *   z = side slope ratio
 * 
 * @param bottomWidth - Bottom width in meters
 * @param waterDepth - Water depth in meters
 * @param sideSlope - Side slope ratio
 * @returns Wetted perimeter in meters
 */
export function calculateTrapezoidPerimeter(
  bottomWidth: number,
  waterDepth: number,
  sideSlope: number
): number {
  if (bottomWidth <= 0 || waterDepth <= 0) return 0;
  return bottomWidth + 2 * waterDepth * Math.sqrt(1 + sideSlope * sideSlope);
}

/**
 * Calculate geometry for circular channel
 * 
 * Uses central angle method for partial flow
 * θ = 2 * arccos(1 - 2h/D)
 * 
 * @param diameter - Pipe diameter in meters
 * @param depth - Water depth in meters
 * @returns Object containing area, perimeter, and top width
 */
function calculateCircularGeometry(
  diameter: number,
  depth: number
): {
  area: number;
  perimeter: number;
  topWidth: number;
} {
  const D = diameter;
  const h = Math.min(depth, D);

  if (h <= 0 || h > D) {
    return { area: 0, perimeter: 0, topWidth: 0 };
  }

  // Central angle (radians)
  const theta = 2 * Math.acos(1 - (2 * h) / D);

  // Cross-sectional area
  const area = (Math.pow(D, 2) / 8) * (theta - Math.sin(theta));

  // Wetted perimeter (arc length)
  const perimeter = (theta * D) / 2;

  // Top width (chord length)
  const topWidth = D * Math.sin(theta / 2);

  return { area, perimeter, topWidth };
}

/**
 * Calculate hydraulic radius
 * 
 * R = A / P
 * Where A = cross-sectional area, P = wetted perimeter
 * 
 * @param area - Cross-sectional area (m²)
 * @param perimeter - Wetted perimeter (m)
 * @returns Hydraulic radius in meters
 */
function calculateHydraulicRadius(area: number, perimeter: number): number {
  return perimeter > 0 ? area / perimeter : 0;
}

/**
 * Calculate Manning velocity
 * 
 * Core Manning equation: V = (1/n) * R^(2/3) * S^(1/2)
 * 
 * @param roughness - Manning coefficient (typical: 0.025-0.035)
 * @param hydraulicRadius - Hydraulic radius in meters
 * @param slope - Channel slope (m/m)
 * @returns Velocity in m/s
 */
export function calculateManningVelocity(
  roughness: number,
  hydraulicRadius: number,
  slope: number
): number {
  if (roughness <= 0 || hydraulicRadius <= 0 || slope <= 0) return 0;
  const velocity =
    (1 / roughness) *
    Math.pow(hydraulicRadius, 2 / 3) *
    Math.pow(slope, 1 / 2);
  return isFinite(velocity) ? velocity : 0;
}

/**
 * Calculate discharge (flow rate)
 * 
 * Q = A * V
 * Where A = area, V = velocity
 * 
 * @param area - Cross-sectional area (m²)
 * @param velocity - Flow velocity (m/s)
 * @returns Discharge in m³/s
 */
function calculateDischarge(area: number, velocity: number): number {
  return area * velocity;
}

/**
 * Calculate Froude number
 * 
 * Fr = V / √(g * Dh)
 * Where Dh = A/T = hydraulic depth
 * 
 * - Fr < 1: Subcritical (calm flow)
 * - Fr = 1: Critical
 * - Fr > 1: Supercritical (rapid flow)
 * 
 * @param velocity - Flow velocity (m/s)
 * @param hydraulicDepth - Hydraulic depth (m)
 * @returns Froude number (dimensionless)
 */
function calculateFroudeNumber(velocity: number, hydraulicDepth: number): number {
  if (hydraulicDepth <= 0) return 0;
  const sqrtgDh = Math.sqrt(GRAVITY * hydraulicDepth);
  return sqrtgDh > 0 ? velocity / sqrtgDh : 0;
}

/**
 * Classify flow regime based on Froude number
 */
function classifyFlowRegime(froudeNumber: number): string {
  if (froudeNumber < 0.9) return 'Sub-kritis (Aliran Tenang)';
  if (froudeNumber > 1.1) return 'Super-kritis (Aliran Deras)';
  return 'Kritis';
}

/**
 * Calculate Reynolds number to determine flow state
 * 
 * Re = V*R / ν
 * Where ν = kinematic viscosity
 * 
 * - Re < 500: Laminar
 * - 500 < Re < 2000: Transition
 * - Re > 2000: Turbulent
 */
function calculateReynoldsNumber(velocity: number, radius: number): string {
  const Re = (velocity * radius) / KINEMATIC_VISCOSITY;

  if (Re < 500) return `Laminar (Re = ${Re.toFixed(0)})`;
  if (Re < 2000) return `Transisi (Re = ${Re.toFixed(0)})`;
  return `Turbulen (Re = ${Re.toFixed(0)})`;
}

/**
 * Calculate velocity head energy
 * 
 * hv = V² / (2g)
 */
function calculateVelocityHead(velocity: number): number {
  return (velocity * velocity) / (2 * GRAVITY);
}

/**
 * Calculate shear stress at channel bed
 * 
 * τ = γ * R * S
 * Where γ = unit weight of water, R = hydraulic radius, S = slope
 */
function calculateShearStress(
  unitWeight: number,
  radius: number,
  slope: number
): number {
  return unitWeight * radius * slope;
}

/**
 * Full Manning calculation with comprehensive hydraulic parameters
 * 
 * This is the main calculation function that computes all hydraulic
 * parameters for open channel flow analysis
 * 
 * @param inputs - ManningInputs object with channel geometry and properties
 * @returns Object with all calculated hydraulic parameters
 * @throws Error if inputs are invalid
 * 
 * @example
 * const results = calculateManning({
 *   shape: ChannelShape.TRAPEZOID,
 *   roughness: 0.025,
 *   slope: 0.001,
 *   width: 2.0,
 *   depth: 1.0,
 *   sideSlope: 0.5,
 * });
 */
export function calculateManning(inputs: ManningInputs) {
  const { shape, roughness, slope, width, diameter, depth, sideSlope } = inputs;

  // ===== INPUT VALIDATION =====
  if (roughness <= 0) {
    throw new Error('Manning roughness coefficient must be > 0');
  }
  if (slope <= 0 || slope > 1) {
    throw new Error('Slope must be between 0 and 1 m/m');
  }
  if (depth <= 0) {
    throw new Error('Water depth must be > 0');
  }

  // ===== GEOMETRY CALCULATIONS =====
  let area = 0;
  let perimeter = 0;
  let topWidth = 0;

  if (shape === ChannelShape.CIRCULAR) {
    if (diameter <= 0) {
      throw new Error('Diameter must be > 0');
    }
    const circular = calculateCircularGeometry(diameter, depth);
    area = circular.area;
    perimeter = circular.perimeter;
    topWidth = circular.topWidth;
  } else {
    // TRAPEZOID (default)
    if (width <= 0) {
      throw new Error('Channel width must be > 0');
    }
    area = calculateTrapezoidArea(width, depth, sideSlope);
    perimeter = calculateTrapezoidPerimeter(width, depth, sideSlope);
    topWidth = width + 2 * sideSlope * depth;
  }

  // ===== BASIC HYDRAULICS =====
  const radius = calculateHydraulicRadius(area, perimeter);
  const velocity = calculateManningVelocity(roughness, radius, slope);
  const discharge = calculateDischarge(area, velocity);

  // ===== FLOW CHARACTERISTICS =====
  const hydraulicDepth = topWidth > 0 ? area / topWidth : 0;
  const froudeNumber = calculateFroudeNumber(velocity, hydraulicDepth);
  const flowType = classifyFlowRegime(froudeNumber);

  // ===== ENERGY & MOMENTUM =====
  const velocityHead = calculateVelocityHead(velocity);
  const specificEnergy = depth + velocityHead;
  const shearStress = calculateShearStress(WATER_UNIT_WEIGHT, radius, slope);
  const streamPower = WATER_UNIT_WEIGHT * discharge * slope;

  // ===== FLOW REGIMES =====
  const reynoldsClassification = calculateReynoldsNumber(velocity, radius);

  // ===== SAFETY CHECKS =====
  const physicalHeight =
    shape === ChannelShape.CIRCULAR ? diameter : depth * 1.5;
  const freeboard = Math.max(0, physicalHeight - depth);
  const safetyStatus =
    freeboard < 0
      ? 'MELUAP'
      : freeboard < 0.3
        ? 'Waspada'
        : 'Aman';

  // ===== FORMAT & RETURN =====
  return {
    // Geometry
    Area: HydraulicFormatter.area(area),
    Perimeter: HydraulicFormatter.distance(perimeter),
    Radius: HydraulicFormatter.distance(radius),
    TopWidth: HydraulicFormatter.distance(topWidth),

    // Hydraulics
    Velocity: HydraulicFormatter.velocity(velocity),
    Discharge: HydraulicFormatter.discharge(discharge),
    Froude: HydraulicFormatter.dimensionless(froudeNumber),
    FlowType: flowType,

    // Energy
    VelocityHead: HydraulicFormatter.distance(velocityHead),
    SpecificEnergy: HydraulicFormatter.distance(specificEnergy),

    // Flow Regime
    ReynoldsNumber: reynoldsClassification,

    // Resistance
    ShearStress: shearStress.toFixed(2),
    StreamPower: streamPower.toFixed(2),

    // Safety
    Freeboard: HydraulicFormatter.distance(freeboard),
    SafetyStatus: safetyStatus,
  };
}

export type ManningResults = ReturnType<typeof calculateManning>;
