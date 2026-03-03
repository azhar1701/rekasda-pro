import axios from 'axios';
import * as cheerio from 'cheerio';
import { z } from 'zod';
import { supabase } from '../lib/api/supabase';

const SIHKA_BASE_URL = import.meta.env.VITE_SIHKA_BASE_URL || 'https://sihka.bbwscitanduy.id/pch';

export const RawSihkaDataSchema = z.object({
  station_id: z.string(),
  station_name: z.string(),
  date: z.string(),
  rainfall_manual: z.string(),
  rainfall_telemetry: z.string(),
});

export type RawSihkaData = z.infer<typeof RawSihkaDataSchema>;

/**
 * Fetch Rainfall Data for a specific station over a specific month.
 * Strategy: Iterates daily view at /pch?s=YYYY-MM-DD
 */

export async function fetchSihkaRainfallData(
  stationId: string, 
  year: number, 
  month: number
): Promise<RawSihkaData[]> {
  const results: RawSihkaData[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  console.log(`Fetching data for Station ID ${stationId} for ${year}-${month}`);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const url = `${SIHKA_BASE_URL}?s=${dateStr}`;

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      // Select all station rows across all kabupaten tables
      const stationLink = $(`a[href$="/pch/${stationId}"]`);
      if (stationLink.length > 0) {
        const row = stationLink.closest('tr');
        const cells = row.find('td');
        
        results.push({
          station_id: stationId,
          station_name: stationLink.text().trim(),
          date: dateStr,
          rainfall_manual: $(cells[1]).text().trim(),
          rainfall_telemetry: $(cells[2]).text().trim(),
        });
      } else {
        // Data might be empty for this day or station not found in today's list
        results.push({
          station_id: stationId,
          station_name: 'Unknown',
          date: dateStr,
          rainfall_manual: '-',
          rainfall_telemetry: '-',
        });
      }
    } catch (error) {
      console.error(`Error fetching data for ${dateStr}:`, error);
      results.push({
        station_id: stationId,
        station_name: 'Error',
        date: dateStr,
        rainfall_manual: 'Error',
        rainfall_telemetry: 'Error',
      });
    }
    
    // Slight delay to avoid being blocked
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}


export interface CleanRainfallData {
  station_id: string;
  date: string;
  rainfall: number | null;
}

/**
 * Sanitizes raw data from SIHKA.
 * - Converts comma to dot
 * - Removes extra spaces and "mm"
 * - Handles missing values (-, null, NaN) -> 0 or null
 * - Returns clean float
 */
export function sanitizeRainfallData(rawDataArray: RawSihkaData[]): CleanRainfallData[] {
  return rawDataArray.map(item => {
    let cleanVal: number | null = null;
    
    // Use manual data as priority, fallback to telemetry if needed
    const rawVal = item.rainfall_manual && item.rainfall_manual !== '-' 
      ? item.rainfall_manual 
      : (item.rainfall_telemetry && item.rainfall_telemetry !== '-' ? item.rainfall_telemetry : null);

    if (rawVal !== null && rawVal !== 'Error' && rawVal !== '-') {
      // 1. Replace comma with dot
      let sanitized = rawVal.replace(',', '.');
      // 2. Remove any non-numeric except dot and minus
      sanitized = sanitized.replace(/[^0-9.-]/g, '');
      
      const num = parseFloat(sanitized);
      cleanVal = isNaN(num) ? 0 : num; // If it was a number but failed, assume 0 or null. 0 is safer for rainfall unless sensor broken.
    } else {
      // If sensor broken/no data, we might want to return null to avoid skewing average
      cleanVal = null; 
    }

    return {
      station_id: item.station_id,
      date: item.date,
      rainfall: cleanVal
    };
  });
}


/**
 * Loads clean rainfall data into Supabase with upsert.
 */
export async function loadRainfallDataToSupabase(dataChunk: CleanRainfallData[]): Promise<{ count: number; error: any }> {
  if (!supabase) {
    return { count: 0, error: 'Supabase client is not initialized' };
  }

  const { error } = await supabase
    .from('master_data_hujan')
    .upsert(dataChunk.map(d => ({
      stasiun_id: d.station_id,
      tanggal: d.date,
      curah_hujan: d.rainfall ?? 0
    })), { 
      onConflict: 'stasiun_id, tanggal', 
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error loading data to Supabase:', error);
    return { count: 0, error };
  }

  return { count: dataChunk.length, error: null };
}

/**
 * Main function to run the full sync using Supabase Edge Functions.
 * This bypasses CORS by running the scraper on the server side.
 */
export async function syncSihkaStationData(stationId: string, year: number, month: number) {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase.functions.invoke('sync-sihka', {
    body: { stationId, year, month }
  });

  if (error) {
    console.error('Edge Function Error:', error);
    return { count: 0, error };
  }

  return { count: data.count, error: null };
}
