import { describe, it, expect } from 'vitest';
import {
  calculateSequentPeak,
  calculateFloodRouting,
  generateSpillwayDischargeCurve,
  calculateReservoirOperation,
  calculateSedimentYield,
  calculateRegionalSedimentYield,
  linearInterpolate,
  REGIONAL_SEDIMENT_PRESETS
} from '@/lib/engine/embungEngine';
import type {
  StageStorageCurve,
  SpillwayConfig,
  WaterBalanceConfig,
  WaterBalanceStepInput,
  SedimentationInput
} from '@/features/embung/types/embung.types';

describe('Embung Engine — Hydrological & Hydraulic Calculations (SNI 03-3432-1994 & Pd. T-03-2005-A)', () => {

  // ---------------------------------------------------------------------------
  // 1. Helper: Linear Interpolation
  // ---------------------------------------------------------------------------
  describe('1. linearInterpolate', () => {
    it('correctly interpolates values within range and clamps to bounds', () => {
      const x = [100, 102, 105];
      const y = [0, 50000, 150000];

      expect(linearInterpolate(100, x, y)).toBe(0);
      expect(linearInterpolate(101, x, y)).toBe(25000);
      expect(linearInterpolate(102, x, y)).toBe(50000);
      expect(linearInterpolate(103.5, x, y)).toBe(100000);
      expect(linearInterpolate(105, x, y)).toBe(150000);
      // Below lower bound
      expect(linearInterpolate(98, x, y)).toBe(0);
      // Above upper bound
      expect(linearInterpolate(110, x, y)).toBe(150000);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Sequent Peak Algorithm (Metode Rippl)
  // ---------------------------------------------------------------------------
  describe('2. calculateSequentPeak (Storage Capacity Requirement)', () => {
    it('returns zero required storage when inflow always exceeds outflow', () => {
      const result = calculateSequentPeak({
        inflow: [10, 15, 20, 25, 20, 15, 12, 14, 18, 22, 20, 15],
        outflow: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
      });

      expect(result.maxStorageRequired).toBe(0);
      expect(result.requiredStorage.every(s => s === 0)).toBe(true);
    });

    it('accurately computes required active storage during dry season deficit', () => {
      // Inflow high in wet season (Jan-Apr), drops in dry season (May-Sep)
      const inflow =  [10, 12, 10, 8, 2, 1, 1, 1, 2, 5, 8, 10]; // Juta m³
      const outflow = [5,  5,  5,  5, 5, 5, 5, 5, 5, 5, 5,  5]; // Juta m³ (demand konstan)

      const result = calculateSequentPeak({ inflow, outflow });

      expect(result.maxStorageRequired).toBeGreaterThan(0);
      // Deficit period: May (2-5=-3), Jun (1-5=-4), Jul (1-5=-4), Aug (1-5=-4), Sep (2-5=-3)
      // Total cumulative deficit = 3 + 4 + 4 + 4 + 3 = 18 Juta m³
      expect(result.maxStorageRequired).toBeCloseTo(18, 0);
      expect(result.massCurveData).toHaveLength(12);
      expect(result.massCurveData[11].cumulativeInflow).toBe(70);
      expect(result.massCurveData[11].cumulativeOutflow).toBe(60);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Spillway Stage-Discharge Curve Generator (Pd. T-03-2005-A)
  // ---------------------------------------------------------------------------
  describe('3. generateSpillwayDischargeCurve', () => {
    const elevations = [100, 101, 102, 103, 104, 105];
    const spillway: SpillwayConfig = {
      crestElevation: 103.0,
      crestLength: 10.0,
      dischargeCoefficient: 2.0,
      spillwayType: 'ogee'
    };

    it('produces Q = 0 for elevations at or below crest elevation', () => {
      const curve = generateSpillwayDischargeCurve(elevations, spillway);

      // Check elevations 100, 101, 102, 103
      const idx100 = curve.elevation.indexOf(100);
      const idx102 = curve.elevation.indexOf(102);
      const idx103 = curve.elevation.indexOf(103);

      expect(curve.discharge[idx100]).toBe(0);
      expect(curve.discharge[idx102]).toBe(0);
      expect(curve.discharge[idx103]).toBe(0);
    });

    it('calculates Q = Cd * B * H^1.5 for elevations above crest', () => {
      const curve = generateSpillwayDischargeCurve(elevations, spillway);

      // At elevation 104: H = 1.0 m, Q = 2.0 * 10 * (1.0)^1.5 = 20 m³/s
      const idx104 = curve.elevation.indexOf(104);
      expect(curve.discharge[idx104]).toBeCloseTo(20.0, 2);

      // At elevation 105: H = 2.0 m, Q = 2.0 * 10 * (2.0)^1.5 = 20 * 2.8284 = 56.57 m³/s
      const idx105 = curve.elevation.indexOf(105);
      expect(curve.discharge[idx105]).toBeCloseTo(20 * Math.pow(2, 1.5), 2);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Flood Routing (Level-Pool / Modified Puls Method)
  // ---------------------------------------------------------------------------
  describe('4. calculateFloodRouting (Level-Pool Routing)', () => {
    const stageStorageCurve: StageStorageCurve = {
      elevation: [100, 101, 102, 103, 104, 105, 106],
      storage: [0, 50000, 120000, 210000, 320000, 450000, 600000],
      area: [0, 10000, 22000, 35000, 50000, 67000, 85000]
    };

    const spillway: SpillwayConfig = {
      crestElevation: 103.0,
      crestLength: 10.0,
      dischargeCoefficient: 2.0,
      spillwayType: 'ogee'
    };

    const stageDischargeCurve = generateSpillwayDischargeCurve(stageStorageCurve.elevation, spillway);

    const inflowHydrograph = [
      { time: 0, discharge: 0 },
      { time: 1, discharge: 15 },
      { time: 2, discharge: 45 },
      { time: 3, discharge: 120 },
      { time: 4, discharge: 85 },
      { time: 5, discharge: 50 },
      { time: 6, discharge: 25 },
      { time: 7, discharge: 10 },
      { time: 8, discharge: 0 }
    ];

    it('successfully routes hydrograph and produces peak attenuation', () => {
      const result = calculateFloodRouting({
        inflowHydrograph,
        stageStorageCurve,
        stageDischargeCurve,
        deltaT: 3600,
        initialElevation: spillway.crestElevation
      });

      expect(result.peakInflow).toBe(120);
      expect(result.peakOutflow).toBeLessThan(result.peakInflow);
      expect(result.peakOutflow).toBeGreaterThan(0);
      expect(result.attenuationRatio).toBeGreaterThan(0);
      expect(result.attenuationRatio).toBeLessThan(1.0);
      expect(result.maxElevation).toBeGreaterThan(spillway.crestElevation);
      expect(result.maxStorage).toBeGreaterThan(210000);
      expect(result.steps).toHaveLength(inflowHydrograph.length);
    });

    it('handles floods exceeding top surveyed contour without clamping', () => {
      const highInflowHydrograph = [
        { time: 0, discharge: 0 },
        { time: 1, discharge: 50 },
        { time: 2, discharge: 150 },
        { time: 3, discharge: 300 },
        { time: 4, discharge: 180 },
        { time: 5, discharge: 60 },
        { time: 6, discharge: 0 }
      ];

      const result = calculateFloodRouting({
        inflowHydrograph: highInflowHydrograph,
        stageStorageCurve,
        stageDischargeCurve,
        deltaT: 3600,
        initialElevation: spillway.crestElevation
      });

      // Max elevation should realistically exceed top contour (106)
      expect(result.maxElevation).toBeGreaterThan(106);
      expect(result.peakOutflow).toBeGreaterThan(0);
      expect(result.peakOutflow).toBeLessThan(300);
      // Ensure steps are smooth without duplicate plateau values
      const outflows = result.steps.map(s => s.outflow);
      expect(new Set(outflows.slice(1, 4)).size).toBeGreaterThan(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Reservoir Operation (Water Balance Simulation)
  // ---------------------------------------------------------------------------
  describe('5. calculateReservoirOperation', () => {
    const config: WaterBalanceConfig = {
      maxStorage: 450000,
      deadStorage: 50000,
      initialStorage: 350000,
      surfaceArea: 50000,
      seepageLoss: 0
    };

    it('correctly tracks storage, satisfies demand, and determines reliability', () => {
      const stepsIn: WaterBalanceStepInput[] = [
        { inflow: 60000, demand: 40000, rainfall: 150, evaporation: 100 },
        { inflow: 50000, demand: 40000, rainfall: 120, evaporation: 110 },
        { inflow: 20000, demand: 40000, rainfall: 50,  evaporation: 120 },
        { inflow: 10000, demand: 40000, rainfall: 20,  evaporation: 130 },
      ];

      const result = calculateReservoirOperation(config, stepsIn);

      expect(result.steps).toHaveLength(4);
      expect(result.reliability).toBeGreaterThanOrEqual(0);
      expect(result.reliability).toBeLessThanOrEqual(100);
      // All end storages should never drop below deadStorage
      result.steps.forEach(step => {
        expect(step.storageEnd).toBeGreaterThanOrEqual(config.deadStorage);
        expect(step.storageEnd).toBeLessThanOrEqual(config.maxStorage);
      });
    });

    it('identifies deficit when water drops to dead storage', () => {
      const stepsIn: WaterBalanceStepInput[] = [
        { inflow: 0, demand: 200000, rainfall: 0, evaporation: 0 },
        { inflow: 0, demand: 200000, rainfall: 0, evaporation: 0 },
        { inflow: 0, demand: 200000, rainfall: 0, evaporation: 0 }
      ];

      const result = calculateReservoirOperation({
        ...config,
        initialStorage: 100000 // only 50,000 m³ active storage available
      }, stepsIn);

      expect(result.totalDeficit).toBeGreaterThan(0);
      expect(result.reliability).toBeLessThan(100);
      const deficitSteps = result.steps.filter(s => s.status === 'deficit');
      expect(deficitSteps.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Sedimentation (Rating Curve & Brune Trap Efficiency)
  // ---------------------------------------------------------------------------
  describe('6. calculateSedimentYield (Rating Curve & Brune 1953)', () => {
    const input: SedimentationInput = {
      qData: [0.5, 1.2, 2.5, 5.0, 8.5],
      qsData: [0.1, 0.4, 1.1, 2.8, 6.2],
      luasDas: 15,
      beratJenis: 1.4,
      bedLoadPercentage: 15,
      reservoirCapacity: 450000,
      annualInflow: 10000000, // C/I = 0.045
      deadStorageM3: 50000
    };

    it('computes power regression coefficients, trapped volume, and lifespan', () => {
      const result = calculateSedimentYield(input);

      expect(result.b).toBeGreaterThan(1.0); // Q vs Qs exponent typically 1.2 - 2.5
      expect(result.bcf).toBeGreaterThanOrEqual(1.0);
      expect(result.totalLoadTonnes).toBeGreaterThan(0);
      expect(result.totalVolumeM3).toBeGreaterThan(0);
      expect(result.trapEfficiency).toBeGreaterThan(60); // At C/I = 0.045 Brune gives ~75-80%
      expect(result.trappedVolumeM3).toBeLessThan(result.totalVolumeM3);
      expect(result.lifespanYears).toBeDefined();
      expect(result.lifespanYears!).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Regional Sediment Yield & SDR (SNI 03-3432-1994 / USLE)
  // ---------------------------------------------------------------------------
  describe('7. calculateRegionalSedimentYield (Boyd SDR & Regional Rates)', () => {
    it('accurately calculates gross erosion, sediment yield, and dead storage lifespan', () => {
      const result = calculateRegionalSedimentYield({
        luasDasKm2: 12.0,
        erosionRateMmYear: 1.5,
        beratJenisTonM3: 1.4,
        trapEfficiencyPercent: 95,
        deadStorageM3: 60000
      });

      // Gross erosion volume: 1.5 mm * 12 km² * 1000 = 18,000 m³/year
      expect(result.grossErosionM3).toBe(18000);
      expect(result.grossErosionTonnes).toBe(18000 * 1.4);

      // Boyd SDR: 0.47 * (12)^-0.125
      const expectedSdr = 0.47 * Math.pow(12, -0.125);
      expect(result.sdr).toBeCloseTo(expectedSdr, 3);

      // Sediment Yield
      expect(result.sedimentYieldM3).toBeCloseTo(18000 * expectedSdr, 1);

      // Trapped volume at 95%
      const expectedTrapped = (18000 * expectedSdr) * 0.95;
      expect(result.trappedVolumeM3).toBeCloseTo(expectedTrapped, 1);

      // Lifespan = 60,000 / expectedTrapped
      expect(result.lifespanYears).toBeCloseTo(60000 / expectedTrapped, 1);
    });

    it('contains valid regional sediment presets conforming to technical standards', () => {
      expect(REGIONAL_SEDIMENT_PRESETS.length).toBeGreaterThanOrEqual(4);
      const jawaKritis = REGIONAL_SEDIMENT_PRESETS.find(p => p.id === 'jawa_kritis');
      expect(jawaKritis).toBeDefined();
      expect(jawaKritis!.rateMmYear).toBe(2.5);
    });
  });

});
