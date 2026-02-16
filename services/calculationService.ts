
import { ManningInputs, RationalInputs, ChannelShape } from '../types';
import { supabase } from '../lib/supabase';

// Interfaces untuk data perhitungan
export interface FloodCalcData {
  method: string;
  projectName: string;
  inputs: any;
  results: any;
}

export interface WaterBalanceData {
  projectName: string;
  monthlyInputs: any;
  monthlyResults: any;
  summary: any;
}

/**
 * Menghitung Debit Saluran Terbuka menggunakan Rumus Manning dengan Output yang Sangat Detail
 */
export const calculateManning = (inputs: ManningInputs) => {
  const { shape, roughness, slope, width, diameter, depth, sideSlope, totalDepth } = inputs;
  const n = roughness || 0.001;
  const S = Math.max(0.000001, slope); 
  const g = 9.81;
  const gamma = 9810; // Berat jenis air (N/m3)
  const kinematicViscosity = 1.004e-6; // Viskositas air pada 20°C (m2/s)
  
  let A = 0; // Luas Penampang Basah
  let P = 0; // Keliling Basah
  let T = 0; // Lebar Permukaan

  if (shape === ChannelShape.CIRCULAR) {
    const D = diameter;
    const h = Math.min(depth, D);
    let theta = 2 * Math.acos(1 - (2 * h) / D);
    A = (Math.pow(D, 2) / 8) * (theta - Math.sin(theta));
    P = (theta * D) / 2;
    T = D * Math.sin(theta / 2);
  } else {
    const b = width;
    const h = depth;
    const z = sideSlope;
    A = (b + z * h) * h;
    P = b + 2 * h * Math.sqrt(1 + z * z);
    T = b + 2 * z * h;
  }

  const R = P === 0 ? 0 : A / P; 
  const V = (1 / n) * Math.pow(R, 2 / 3) * Math.pow(S, 1 / 2);
  const Q = A * V; 

  const Dh = T === 0 ? 0 : A / T; 
  const Fr = Dh === 0 ? 0 : V / Math.sqrt(g * Dh); 

  // --- Parameter Lanjutan ---
  
  // 1. Bilangan Reynolds (Re = V*R / nu)
  const Re = (V * R) / kinematicViscosity;
  let regimeState = "Laminar";
  if (Re > 4000) regimeState = "Turbulen";
  else if (Re > 2000) regimeState = "Transisi";

  // 2. Kedalaman Kritis (hc) - Estimasi untuk penampang umum
  // hc = (Q^2 / (g * T^2))^(1/3) -> Pendekatan iteratif sederhana
  let hc = Math.pow(Math.pow(Q, 2) / (g * Math.pow(Math.max(0.1, T), 2)), 1/3);
  if (shape === ChannelShape.CIRCULAR) {
    hc = 0.35 * diameter * Math.pow(Q / (Math.sqrt(g) * Math.pow(diameter, 2.5)), 0.45); // Pendekatan pipa
  }

  // 3. Kemiringan Kritis (Sc)
  // Sc = (n^2 * g * A) / (T * R^(4/3))
  const Sc = (Math.pow(n, 2) * g * A) / (Math.max(0.1, T) * Math.pow(Math.max(0.01, R), 4/3));

  const velocityHead = Math.pow(V, 2) / (2 * g);
  const specificEnergy = depth + velocityHead;
  const conveyance = (1 / n) * A * Math.pow(R, 2 / 3);
  const shearStress = gamma * R * S; 
  const streamPower = gamma * Q * S;

  const H_physical = shape === ChannelShape.CIRCULAR ? diameter : (totalDepth || depth * 1.5);
  const freeboard = H_physical - depth;
  
  return {
    Area: A.toFixed(4),
    Perimeter: P.toFixed(4),
    Radius: R.toFixed(4),
    Velocity: V.toFixed(3),
    Discharge: Q.toFixed(3),
    Froude: Fr.toFixed(3),
    FlowType: Fr < 0.9 ? "Sub-kritis" : Fr > 1.1 ? "Super-kritis" : "Kritis",
    Freeboard: freeboard.toFixed(3),
    SafetyStatus: freeboard < 0 ? "MELUAP" : freeboard < 0.3 ? "Waspada" : "Aman",
    TopWidth: T.toFixed(3),
    HydraulicDepth: Dh.toFixed(3),
    SpecificEnergy: specificEnergy.toFixed(3),
    Conveyance: conveyance.toFixed(2),
    ShearStress: shearStress.toFixed(2),
    StreamPower: streamPower.toFixed(2),
    Reynolds: Math.round(Re).toLocaleString(),
    Regime: regimeState,
    CriticalDepth: hc.toFixed(3),
    CriticalSlope: Sc.toFixed(5),
    WettedRatio: (depth / H_physical).toFixed(2)
  };
};

/**
 * Menghitung Debit Banjir menggunakan Metode Rasional dengan parameter Hidrologi Diperkaya
 */
export const calculateRational = (inputs: RationalInputs) => {
  const { runoffCoefficient, area, rainfallDesign, flowLength, catchmentSlope } = inputs;
  
  const L_meters = flowLength * 1000;
  const S_land = Math.max(0.0001, catchmentSlope);
  
  // Tc Kirpich
  const Tc_minutes = 0.0195 * Math.pow(L_meters, 0.77) * Math.pow(S_land, -0.385);
  const Tc_hours = Tc_minutes / 60;

  // Intensitas Mononobe (mm/jam)
  const I = (rainfallDesign / 24) * Math.pow(24 / Math.max(0.1, Tc_hours), 2 / 3);

  // Q = 0.278 * C * I * A (m3/s)
  const Q = 0.278 * runoffCoefficient * I * area;

  // --- Parameter Hidrologi Lanjutan ---
  
  // 1. Estimasi Volume Total Limpasan (m3) selama durasi Tc
  // V = C * (Rainfall in duration Tc) * Area
  const rainDepthInTc = I * (Tc_minutes / 60); // mm
  const volumeTotal = (runoffCoefficient * (rainDepthInTc / 1000) * (area * 1000000));

  // 2. Debit Spesifik (m3/s/km2)
  const specificDischarge = Q / area;

  // 3. Waktu Lag (Waktu keterlambatan puncak) - Estimasi 0.6 * Tc
  const lagTime = 0.6 * Tc_minutes;

  // 4. Tebal Hujan Efektif (Excess Rainfall)
  const excessRain = runoffCoefficient * rainDepthInTc;

  return {
    Discharge: Q.toFixed(3),
    Intensity: I.toFixed(2),
    Tc: Tc_minutes.toFixed(2),
    Coefficient: runoffCoefficient.toFixed(2),
    CatchmentArea: area.toFixed(3),
    Rainfall24: rainfallDesign.toFixed(0),
    TotalVolume: Math.round(volumeTotal).toLocaleString(),
    SpecificDischarge: specificDischarge.toFixed(3),
    LagTime: lagTime.toFixed(2),
    ExcessRain: excessRain.toFixed(2)
  };
};

/**
 * Menyimpan data perhitungan Manning ke Supabase
 */
export const saveManningCalculation = async (data: { projectName: string; inputs: any; results: any }) => {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  const { data: result, error } = await supabase
    .from('manning_calculations')
    .insert({
      project_name: data.projectName,
      inputs: data.inputs,
      results: data.results
    })
    .select()
    .single();

  return { data: result, error };
};

/**
 * Menyimpan data perhitungan banjir ke Supabase
 */
export const saveFloodCalculation = async (data: FloodCalcData) => {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  const { data: result, error } = await supabase
    .from('flood_calculations')
    .insert({
      method: data.method,
      project_name: data.projectName,
      inputs: data.inputs,
      results: data.results
    })
    .select()
    .single();

  return { data: result, error };
};

/**
 * Menyimpan data neraca air ke Supabase
 */
export const saveWaterBalance = async (data: WaterBalanceData) => {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  const { data: result, error } = await supabase
    .from('water_balance_calculations')
    .insert({
      project_name: data.projectName,
      monthly_inputs: data.monthlyInputs,
      monthly_results: data.monthlyResults,
      summary: data.summary
    })
    .select()
    .single();

  return { data: result, error };
};
