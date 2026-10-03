import { supabase } from '../lib/api/supabase';
import {
  getAllUnifiedSnapshots,
  getUnifiedProjectList,
  deleteCalculationSnapshot
} from './unifiedProjectService';

export interface AllCalculationsData {
  id: string;
  type: 'manning' | 'flood' | 'water_balance' | 'embung';
  project_name: string;
  created_at: string;
  data: any;
  location?: { latitude: number; longitude: number };
  isLocalOnly?: boolean;
  // Unified project metadata
  projectId?: string;
  projectCode?: string;
  scenarioName?: string;
  snapshotTitle?: string;
  createdBy?: string;
  notes?: string;
  isSnapshot?: boolean;
}

/**
 * Mengambil semua data perhitungan dari database Supabase dan/atau localStorage offline,
 * termasuk snapshot skenario dari sistem penyimpanan proyek terpadu (Unified Storage).
 */
export const getAllCalculations = async (): Promise<AllCalculationsData[]> => {
  const allData: AllCalculationsData[] = [];
  const processedIds = new Set<string>();

  // 0. Ambil rekaman dari Unified Project Snapshots (Single Source of Truth)
  try {
    const [snapshots, projects] = await Promise.all([
      getAllUnifiedSnapshots(),
      getUnifiedProjectList()
    ]);

    const projectMap = new Map<string, { name: string; projectCode: string }>();
    projects.forEach((p) => {
      projectMap.set(p.id, { name: p.name, projectCode: p.projectCode });
    });

    snapshots.forEach((snap) => {
      processedIds.add(String(snap.id));
      const parentProj = projectMap.get(snap.projectId);
      const displayName = snap.snapshotTitle || parentProj?.name || 'Hasil Analisis';

      allData.push({
        id: String(snap.id),
        type: snap.moduleType as any,
        project_name: displayName,
        created_at: snap.createdAt,
        data: {
          inputs: snap.inputParameters,
          results: snap.outputResults,
          monthly_inputs: snap.inputParameters?.monthlyInputs,
          monthly_results: snap.outputResults?.monthlyResults,
          summary: snap.outputResults?.summary,
          result_data: snap.outputResults,
          input_data: snap.inputParameters
        },
        location: snap.location || snap.inputParameters?.site?.location || snap.inputParameters?.location,
        isLocalOnly: false,
        projectId: snap.projectId,
        projectCode: parentProj?.projectCode,
        scenarioName: snap.scenarioName,
        snapshotTitle: snap.snapshotTitle,
        createdBy: snap.createdBy,
        notes: snap.notes,
        isSnapshot: true
      });
    });
  } catch (e) {
    console.warn('Gagal memuat unified calculation snapshots:', e);
  }

  // 1. Ambil data dari Supabase jika tersedia
  if (supabase) {
    try {
      // Ambil data Manning
      const { data: manningData, error: manningError } = await supabase
        .from('manning_calculations')
        .select('*')
        .order('created_at', { ascending: false });

      if (manningData && !manningError) {
        manningData.forEach((item: any) => {
          processedIds.add(String(item.id));
          allData.push({
            id: String(item.id),
            type: 'manning',
            project_name: item.project_name || 'Saluran Terbuka',
            created_at: item.created_at,
            data: { inputs: item.inputs, results: item.results },
            location: item.inputs?.site?.location || (item.inputs?.location?.latitude ? item.inputs.location : undefined),
            isLocalOnly: false
          });
        });
      }
    } catch (e) {
      console.warn('Gagal memuat manning_calculations:', e);
    }

    try {
      // Ambil data Flood
      const { data: floodData, error: floodError } = await supabase
        .from('flood_calculations')
        .select('*')
        .order('created_at', { ascending: false });

      if (floodData && !floodError) {
        floodData.forEach((item: any) => {
          processedIds.add(String(item.id));
          allData.push({
            id: String(item.id),
            type: 'flood',
            project_name: item.project_name || 'Analisis Banjir',
            created_at: item.created_at,
            data: { method: item.method, inputs: item.inputs, results: item.results },
            location: item.inputs?.location || item.inputs?.site?.location,
            isLocalOnly: false
          });
        });
      }
    } catch (e) {
      console.warn('Gagal memuat flood_calculations:', e);
    }

    try {
      // Ambil data Water Balance
      const { data: waterData, error: waterError } = await supabase
        .from('water_balance_calculations')
        .select('*')
        .order('created_at', { ascending: false });

      if (waterData && !waterError) {
        waterData.forEach((item: any) => {
          processedIds.add(String(item.id));
          const location = item.monthly_inputs?.location?.coordinates ? {
            latitude: item.monthly_inputs.location.coordinates.lat,
            longitude: item.monthly_inputs.location.coordinates.lng
          } : item.monthly_inputs?.location;

          allData.push({
            id: String(item.id),
            type: 'water_balance',
            project_name: item.project_name || 'Neraca Air',
            created_at: item.created_at,
            data: { monthly_inputs: item.monthly_inputs, monthly_results: item.monthly_results, summary: item.summary },
            location,
            isLocalOnly: false
          });
        });
      }
    } catch (e) {
      console.warn('Gagal memuat water_balance_calculations:', e);
    }

    try {
      // Ambil data Embung
      const { data: embungData, error: embungError } = await supabase
        .from('embung_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (embungData && !embungError) {
        embungData.forEach((item: any) => {
          processedIds.add(String(item.id));
          allData.push({
            id: String(item.id),
            type: 'embung',
            project_name: item.project_name || 'Proyek Embung',
            created_at: item.created_at,
            data: {
              analysis_type: item.analysis_type,
              input_data: item.input_data,
              result_data: item.result_data,
              curve_data: item.curve_data
            },
            location: item.location,
            isLocalOnly: false
          });
        });
      }
    } catch (e) {
      console.warn('Gagal memuat embung_projects:', e);
    }
  }

  // 2. Ambil data dari localStorage offline ('hydrofield_history') jika di browser
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      const rawLocal = window.localStorage.getItem('hydrofield_history');
      if (rawLocal) {
        const localItems = JSON.parse(rawLocal);
      if (Array.isArray(localItems)) {
        localItems.forEach((localRecord: any) => {
          const recId = String(localRecord.id || '');
          if (!recId || processedIds.has(recId)) return; // Jangan duplikasi

          let calcType: AllCalculationsData['type'] = 'manning';
          const typeStr = String(localRecord.type || '').toUpperCase();
          if (typeStr.includes('FLOOD') || typeStr.includes('RATIONAL')) calcType = 'flood';
          else if (typeStr.includes('WATER')) calcType = 'water_balance';
          else if (typeStr.includes('EMBUNG')) calcType = 'embung';

          const projectName = localRecord.inputs?.site?.channelName ||
            localRecord.inputs?.projectName ||
            localRecord.inputs?.site?.namaPekerjaan ||
            localRecord.notes ||
            `Perhitungan ${calcType} (Lokal)`;

          allData.push({
            id: recId,
            type: calcType,
            project_name: projectName,
            created_at: localRecord.date || new Date().toISOString(),
            data: {
              inputs: localRecord.inputs || {},
              results: localRecord.outputs || {},
              monthly_inputs: localRecord.inputs?.monthlyInputs,
              monthly_results: localRecord.outputs?.monthlyResults,
              summary: localRecord.outputs?.summary,
              result_data: localRecord.outputs,
              input_data: localRecord.inputs
            },
            location: localRecord.location,
            isLocalOnly: true
          });
        });
      }
    }
  }
} catch (e) {
    console.warn('Gagal membaca hydrofield_history dari localStorage:', e);
  }

  // 3. Urutkan berdasarkan waktu pembuatan terbaru
  allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return allData;
};

/**
 * Hapus data berdasarkan tipe dan ID (dari Supabase maupun localStorage)
 */
export const deleteCalculationById = async (type: string, id: string) => {
  let dbError: any = null;

  // 1. Bersihkan dari Unified Project Snapshots (jika id berupa UUID snapshot)
  try {
    await deleteCalculationSnapshot(id);
  } catch (err) {
    console.warn('Gagal menghapus snapshot:', err);
  }

  // 2. Bersihkan dari tabel legacy Supabase jika ada
  if (supabase) {
    let tableName = '';
    if (type === 'manning') tableName = 'manning_calculations';
    else if (type === 'flood') tableName = 'flood_calculations';
    else if (type === 'water_balance') tableName = 'water_balance_calculations';
    else if (type === 'embung') tableName = 'embung_projects';

    if (tableName) {
      try {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) dbError = error;
      } catch (err: any) {
        dbError = err;
      }
    }
  }

  // Selalu bersihkan dari localStorage jika ada
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      const rawLocal = window.localStorage.getItem('hydrofield_history');
      if (rawLocal) {
        const localItems = JSON.parse(rawLocal);
        if (Array.isArray(localItems)) {
          const filtered = localItems.filter((item: any) => String(item.id) !== String(id));
          window.localStorage.setItem('hydrofield_history', JSON.stringify(filtered));
        }
      }
    }
  } catch (e) {
    console.warn('Gagal menghapus item dari localStorage:', e);
  }

  return { error: dbError };
};
