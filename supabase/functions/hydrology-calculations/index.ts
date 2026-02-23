// @ts-nocheck - Deno runtime, not compiled by project tsc
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, inputs } = await req.json()

    let results = {}

    if (type === 'manning') {
      results = calculateManning(inputs)
    } else if (type === 'rational') {
      results = calculateRational(inputs)
    } else if (type === 'water-balance') {
      results = calculateWaterBalance(inputs)
    } else {
      throw new Error('Invalid calculation type')
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    )
  }
})

// --- Calculation Engines (Ported from Frontend) ---

function calculateManning(inputs: any) {
  const { shape, roughness, slope, width, diameter, depth, sideSlope, totalDepth } = inputs
  const n = roughness || 0.013
  const S = Math.max(0.000001, slope)
  const g = 9.81
  
  let A = 0
  let P = 0
  let T = 0

  if (shape === 'CIRCULAR') {
    const D = diameter
    const h = Math.min(depth, D)
    const theta = 2 * Math.acos(1 - (2 * h) / D)
    A = (D * D / 8) * (theta - Math.sin(theta))
    P = (theta * D) / 2
    T = D * Math.sin(theta / 2)
  } else {
    const b = width
    const h = depth
    const z = sideSlope || 0
    A = (b + z * h) * h
    P = b + 2 * h * Math.sqrt(1 + z * z)
    T = b + 2 * z * h
  }

  const R = P > 0 ? A / P : 0
  const V = (1 / n) * Math.pow(R, 2 / 3) * Math.pow(S, 1 / 2)
  const Q = A * V
  const Dh = T > 0 ? A / T : 0
  const Fr = Dh > 0 ? V / Math.sqrt(g * Dh) : 0

  const velocityHead = V * V / (2 * g)
  const specificEnergy = depth + velocityHead
  
  const H_physical = shape === 'CIRCULAR' ? diameter : (totalDepth || depth * 1.5)
  const freeboard = H_physical - depth
  
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
    SpecificEnergy: specificEnergy.toFixed(3)
  }
}

function calculateRational(inputs: any) {
  const { runoffCoefficient, area, rainfallDesign, flowLength, catchmentSlope } = inputs
  
  const L_km = flowLength
  const S = Math.max(0.0001, catchmentSlope)
  
  const Tc_minutes = 0.0195 * Math.pow(L_km * 1000, 0.77) * Math.pow(S, -0.385)
  const Tc_hours = Tc_minutes / 60
  const I = (rainfallDesign / 24) * Math.pow(24 / Math.max(0.1, Tc_hours), 2 / 3)
  const Q = 0.278 * runoffCoefficient * I * area

  return {
    Discharge: Q.toFixed(3),
    Intensity: I.toFixed(2),
    Tc: Tc_minutes.toFixed(2),
    Coefficient: runoffCoefficient.toFixed(2),
    CatchmentArea: area.toFixed(3)
  }
}

function calculateWaterBalance(inputs: any) {
  const { population, agricultureArea, domesticStandard, irrigationDemand, monthlySupply } = inputs
  
  const domesticDemand = (population * domesticStandard) / 86400000
  const agricultureDemand = (agricultureArea * irrigationDemand) / 1000
  
  const results = monthlySupply.map((supply: number, index: number) => {
    const environmentalFlow = supply * 0.10
    const totalDemand = domesticDemand + agricultureDemand + environmentalFlow
    const balance = supply - totalDemand
    
    let status = 'Seimbang'
    if (balance > 0.01) status = 'Surplus'
    else if (balance < -0.01) status = 'Defisit'
    
    return {
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][index],
      supply: supply.toFixed(3),
      domesticDemand: domesticDemand.toFixed(3),
      agricultureDemand: agricultureDemand.toFixed(3),
      environmentalFlow: environmentalFlow.toFixed(3),
      totalDemand: totalDemand.toFixed(3),
      balance: balance.toFixed(3),
      status
    }
  })

  return results
}
