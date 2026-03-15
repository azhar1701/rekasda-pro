import { supabase } from '@/lib/api/supabase';

// ----------------------------------------------------------------------------
// Types & Interfaces: Hydro Calc Request & Response
// ----------------------------------------------------------------------------

export interface RationalParameters {
  c: number; // Koefisien Pengaliran (C)
  i: number; // Intensitas Hujan (mm/jam)
  a: number; // Luas DAS (km²)
}

export interface SnyderParameters {
  area: number; // Luas DAS (km²)
  l: number;    // Panjang sungai utama (km)
  lc: number;   // Panjang dari titik berat DAS ke outlet (km)
  cp: number;   // Koefisien peak (Cp)
  ct: number;   // Koefisien waktu (Ct)
}

export interface HydroCalcRequest {
  method: 'rational' | 'snyder';
  parameters: RationalParameters | SnyderParameters;
}

export interface HydroCompliance {
  standard: string;
  is_valid: boolean;
  notes: string;
}

export interface HydroData {
  peak_discharge?: number;
  time_to_peak?: number;
}

export interface HydroCalcResponse {
  status: string;
  data: HydroData;
  compliance: HydroCompliance;
}

// ----------------------------------------------------------------------------
// Types & Interfaces: AI Consult Request & Response
// ----------------------------------------------------------------------------

export interface AIConsultRequest {
  user_query: string;
  active_context: Record<string, any>;
}

export interface AIConsultResponse {
  markdown_text: string;
  confidence_score: number;
  agent_state: string;
}

// ----------------------------------------------------------------------------
// Service Methods
// ----------------------------------------------------------------------------

/**
 * Executes a hydrological calculation via the `hydro-calc` Supabase Edge Function.
 * Replaces client-side math to keep SNI compliance logic and formulas secure in the backend.
 * 
 * @param payload - The calculation request indicating method and parameters.
 * @returns {Promise<HydroCalcResponse>} The peak discharge results and SNI compliance status.
 * @throws Will throw an error if the network request fails or Edge Function returns an error.
 */
export async function calculateHydrograph(payload: HydroCalcRequest): Promise<HydroCalcResponse> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Check your credentials.');
  }

  const { data, error } = await supabase.functions.invoke<HydroCalcResponse>('hydro-calc', {
    body: payload,
  });

  if (error) {
    console.error('Edge Function Error (hydro-calc):', error);
    throw new Error(error.message || 'Failed to call hydro-calc function');
  }

  if (!data) {
    throw new Error('No data returned from hydro-calc function');
  }

  return data;
}

/**
 * Orchestrates a verification consultation with the Gemini AI via the `ai-consult` Edge Function.
 * Protects the Gemini API Key by processing the proxy in the backend securely.
 * 
 * @param payload - The context and query describing the parameters the user is analyzing.
 * @returns {Promise<AIConsultResponse>} The structured verification response.
 * @throws Will throw an error if the AI orchestration fails.
 */
export async function consultAI(payload: AIConsultRequest): Promise<AIConsultResponse> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Check your credentials.');
  }

  const { data, error } = await supabase.functions.invoke<AIConsultResponse>('ai-consult', {
    body: payload,
  });

  if (error) {
    console.error('Edge Function Error (ai-consult):', error);
    throw new Error(error.message || 'Failed to call ai-consult function');
  }

  if (!data) {
    throw new Error('No data returned from ai-consult function');
  }

  return data;
}
