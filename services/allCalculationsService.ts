import { supabase } from '../lib/supabase';

export interface AllCalculationsData {
  id: string;
  type: 'manning' | 'flood' | 'water_balance';
  project_name: string;
  created_at: string;
  data: any;
  location?: { latitude: number; longitude: number };
}

/**
 * Mengambil semua data perhitungan dari 3 tabel
 */
export const getAllCalculations = async (): Promise<AllCalculationsData[]> => {
  if (!supabase) {
    return [];
  }

  try {
    // Ambil data Manning
    const { data: manningData, error: manningError } = await supabase
      .from('manning_calculations')
      .select('*')
      .order('created_at', { ascending: false });

    // Ambil data Flood
    const { data: floodData, error: floodError } = await supabase
      .from('flood_calculations')
      .select('*')
      .order('created_at', { ascending: false });

    // Ambil data Water Balance
    const { data: waterData, error: waterError } = await supabase
      .from('water_balance_calculations')
      .select('*')
      .order('created_at', { ascending: false });

    const allData: AllCalculationsData[] = [];

    // Convert Manning data
    if (manningData && !manningError) {
      manningData.forEach(item => {
        allData.push({
          id: item.id,
          type: 'manning',
          project_name: item.project_name,
          created_at: item.created_at,
          data: { inputs: item.inputs, results: item.results },
          location: item.inputs?.site?.location
        });
      });
    }

    // Convert Flood data
    if (floodData && !floodError) {
      floodData.forEach(item => {
        allData.push({
          id: item.id,
          type: 'flood',
          project_name: item.project_name,
          created_at: item.created_at,
          data: { method: item.method, inputs: item.inputs, results: item.results },
          location: item.inputs?.location
        });
      });
    }

    // Convert Water Balance data
    if (waterData && !waterError) {
      waterData.forEach(item => {
        allData.push({
          id: item.id,
          type: 'water_balance',
          project_name: item.project_name,
          created_at: item.created_at,
          data: { monthly_inputs: item.monthly_inputs, monthly_results: item.monthly_results, summary: item.summary },
          location: item.monthly_inputs?.location
        });
      });
    }

    // Sort by date
    allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return allData;
  } catch (error) {
    console.error('Error fetching all calculations:', error);
    return [];
  }
};

/**
 * Hapus data berdasarkan tipe dan ID
 */
export const deleteCalculationById = async (type: string, id: string) => {
  if (!supabase) {
    return { error: { message: 'Supabase not configured' } };
  }

  let tableName = '';
  if (type === 'manning') tableName = 'manning_calculations';
  else if (type === 'flood') tableName = 'flood_calculations';
  else if (type === 'water_balance') tableName = 'water_balance_calculations';
  else return { error: { message: 'Invalid type' } };

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  return { error };
};
