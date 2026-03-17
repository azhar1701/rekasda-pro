
import { ManningInputs, RationalInputs, ChannelShape } from '@/types/types';
import { supabase } from '@/lib/api/supabase';

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
 * Menghitung Kapasitas Saluran Terbuka - Rumus Manning
 * Sesuai SNI 2415:2016 & SNI 03-3424-1994
 * 
 * Formula Manning: V = (1/n) × R^(2/3) × S^(1/2)
 * Dimana:
 * - V = Kecepatan aliran (m/s)
 * - n = Koefisien kekasaran Manning
 * - R = Jari-jari hidrolik (m) = A/P
 * - S = Kemiringan dasar saluran (m/m)
 * - Q = A × V (m³/s)
 */
export const calculateManning = (inputs: ManningInputs) => {
  const { shape, roughness, slope, width, diameter, depth, sideSlope, totalDepth } = inputs;
  const n = roughness || 0.013; // Default beton halus
  const S = Math.max(0.000001, slope); 
  const g = 9.81; // Gravitasi (m/s²)
  const gamma = 9810; // Berat jenis air (N/m³)
  const nu = 1.004e-6; // Viskositas kinematik air 20°C (m²/s)
  
  let A = 0; // Luas penampang basah (m²)
  let P = 0; // Keliling basah (m)
  let T = 0; // Lebar permukaan (m)

  // Perhitungan geometri saluran
  if (shape === ChannelShape.CIRCULAR) {
    const D = diameter;
    const h = Math.min(depth, D);
    const theta = 2 * Math.acos(1 - (2 * h) / D); // Sudut sentral (radian)
    A = (D * D / 8) * (theta - Math.sin(theta));
    P = (theta * D) / 2;
    T = D * Math.sin(theta / 2);
  } else {
    // Trapesium atau persegi (z=0)
    const b = width;
    const h = depth;
    const z = sideSlope || 0;
    A = (b + z * h) * h;
    P = b + 2 * h * Math.sqrt(1 + z * z);
    T = b + 2 * z * h;
  }

  // Jari-jari hidrolis (SNI 2415:2016)
  const R = P > 0 ? A / P : 0;
  
  // Kecepatan aliran - Manning Formula
  const V = (1 / n) * Math.pow(R, 2 / 3) * Math.pow(S, 1 / 2);
  
  // Debit (m³/s)
  const Q = A * V;

  // Kedalaman hidrolik
  // Untuk lingkaran, T -> 0 saat h -> D atau h -> 0. Gunakan limit untuk stabilitas numerik.
  const Dh = T > 0.0001 ? A / T : (shape === ChannelShape.CIRCULAR ? (depth > 0 ? depth : 0) : 0);
  
  // Bilangan Froude (Fr = V / √(g × Dh))
  const Fr = Dh > 0 ? V / Math.sqrt(g * Dh) : 0;

  // Bilangan Reynolds (Re = V × R / ν)
  const Re = (V * R) / nu;
  let regime = "Laminar";
  if (Re > 4000) regime = "Turbulen";
  else if (Re > 2000) regime = "Transisi";

  // Kedalaman kritis (hc) - Iterasi sederhana
  let hc = 0;
  if (Q > 0 && T > 0.0001) {
    hc = Math.pow(Q * Q / (g * T * T), 1/3);
  }

  // Kemiringan kritis (Sc)
  const Sc = R > 0 && T > 0.0001 ? (n * n * g * A) / (T * Math.pow(R, 4/3)) : 0;

  // Parameter hidrolik tambahan
  const velocityHead = V * V / (2 * g); // Tinggi kecepatan (m)
  const specificEnergy = depth + velocityHead; // Energi spesifik (m)
  const conveyance = (1 / n) * A * Math.pow(R, 2 / 3); // Daya hantar (m³/s)
  const shearStress = gamma * R * S; // Tegangan geser (N/m²)

  // Tinggi jagaan (freeboard)
  const H_physical = shape === ChannelShape.CIRCULAR ? diameter : (totalDepth || depth * 1.5);
  const freeboard = H_physical - depth;
  
  return {
    Area: A.toFixed(4),
    Perimeter: P.toFixed(4),
    Radius: R.toFixed(4),
    Velocity: V.toFixed(3),
    Discharge: Q.toFixed(3),
    Froude: Fr.toFixed(3),
    FlowType: Fr < 1.0 ? "Sub-kritis" : Fr > 1.0 ? "Super-kritis" : "Kritis",
    Freeboard: freeboard.toFixed(3),
    SafetyStatus: freeboard < 0 ? "MELUAP" : freeboard < 0.3 ? "Waspada" : "Aman",
    TopWidth: T.toFixed(3),
    HydraulicDepth: Dh.toFixed(3),
    SpecificEnergy: specificEnergy.toFixed(3),
    Conveyance: conveyance.toFixed(2),
    ShearStress: shearStress.toFixed(2),
    Reynolds: Math.round(Re).toLocaleString(),
    Regime: regime,
    CriticalDepth: hc.toFixed(3),
    CriticalSlope: Sc.toFixed(6),
    WettedRatio: (depth / H_physical).toFixed(2)
  };
};

/**
 * Menghitung Debit Banjir menggunakan Metode Rasional
 * Sesuai SNI 2415:2016 Pasal 5.2 & Permen PU No. 12/2014
 * 
 * Formula: Q = 0.278 × C × I × A
 * Dimana:
 * - Q = Debit puncak (m³/s)
 * - C = Koefisien pengaliran (0-1)
 * - I = Intensitas hujan (mm/jam) dari Mononobe
 * - A = Luas DAS (km²)
 */
export const calculateRational = (inputs: RationalInputs) => {
 const { runoffCoefficient, area, rainfallDesign, flowLength, catchmentSlope } = inputs;
 
 const L_km = flowLength;
 const S = Math.max(0.0001, catchmentSlope);
 
 // Waktu Konsentrasi (Tc) - Kirpich Formula (SNI 2415:2016)
 // Tc = 0.0195 × L^0.77 × S^-0.385 (menit)
 const Tc_minutes = 0.0195 * Math.pow(L_km * 1000, 0.77) * Math.pow(S, -0.385);
 const Tc_hours = Tc_minutes / 60;

 // Intensitas Hujan - Mononobe Formula (SNI 2415:2016 Pasal 5.2.2)
 // I = (R24 / 24) × (24 / Tc)^(2/3)
 const I = (rainfallDesign / 24) * Math.pow(24 / Math.max(0.1, Tc_hours), 2 / 3);

 // Debit Puncak - Metode Rasional (SNI 2415:2016 Pasal 5.2.1)
 // Q = 0.278 × C × I × A
 const Q = 0.278 * runoffCoefficient * I * area;

 // Parameter Hidrologi Tambahan
 const rainDepthInTc = I * Tc_hours; // Kedalaman hujan selama Tc (mm)
 const volumeTotal = (runoffCoefficient * (rainDepthInTc / 1000) * (area * 1000000)); // Volume limpasan (m³)
 const specificDischarge = Q / area; // Debit spesifik (m³/s/km²)
 const lagTime = 0.6 * Tc_minutes; // Waktu lag (menit)
 const excessRain = runoffCoefficient * rainDepthInTc; // Hujan efektif (mm)

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

 // Get current user for RLS association
 const { data: { user } } = await supabase.auth.getUser();

 const { data: result, error } = await supabase
 .from('manning_calculations')
 .insert({
 project_name: data.projectName,
 inputs: data.inputs,
 results: data.results,
 user_id: user?.id || null
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

 // Get current user for RLS association
 const { data: { user } } = await supabase.auth.getUser();

 const { data: result, error } = await supabase
 .from('flood_calculations')
 .insert({
 method: data.method,
 project_name: data.projectName,
 inputs: data.inputs,
 results: data.results,
 user_id: user?.id || null
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

 // Get current user for RLS association
 const { data: { user } } = await supabase.auth.getUser();

 const { data: result, error } = await supabase
 .from('water_balance_calculations')
 .insert({
 project_name: data.projectName,
 monthly_inputs: data.monthlyInputs,
 monthly_results: data.monthlyResults,
 summary: data.summary,
 user_id: user?.id || null
 })
 .select()
 .single();

 return { data: result, error };
};
