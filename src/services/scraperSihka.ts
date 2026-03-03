import { z } from 'zod';
import { supabase } from '../lib/api/supabase';

export const RawSihkaDataSchema = z.object({
  station_id: z.string(),
  station_name: z.string(),
  date: z.string(),
  rainfall_manual: z.string(),
  rainfall_telemetry: z.string(),
});

export type RawSihkaData = z.infer<typeof RawSihkaDataSchema>;

/**
 * Main function to run the full sync.
 * This calls the Supabase Edge Function to perform scraping server-side.
 * Server-side execution is immune to CORS and network blockages.
 */
export async function syncSihkaStationData(
  stationId: string, 
  year: number, 
  month: number,
  onProgress?: (progress: { current: number; total: number; date: string; status: 'loading' | 'success' | 'error' }) => void
) {
  if (!supabase) throw new Error('Supabase client not initialized');

  // We can't easily do granular "per-day" progress for a single server-side call,
  // but we can show a "Loading..." state for the whole month.
  if (onProgress) {
    onProgress({ current: 0, total: 1, date: `Syncing ${month}/${year}`, status: 'loading' });
  }

  try {
    const { data, error } = await supabase.functions.invoke('sync-sihka', {
      body: { stationId, year, month }
    });

    if (error) {
      console.error('Edge Function Error:', error);
      const errorMessage = (error as any).context?.message || error.message;
      if (onProgress) onProgress({ current: 1, total: 1, date: `Failed: ${errorMessage}`, status: 'error' });
      return { count: 0, error: errorMessage };
    }

    if (onProgress) {
      onProgress({ current: 1, total: 1, date: `Success: ${data.count} days`, status: 'success' });
    }

    return { count: data.count, error: null };
  } catch (err: any) {
    console.error('Sync Error:', err);
    if (onProgress) onProgress({ current: 1, total: 1, date: `Critical Failure`, status: 'error' });
    return { count: 0, error: err.message };
  }
}

