import { supabase } from '@/lib/api/supabase';

/**
 * Service to fetch CHIRPS daily rainfall data via Supabase Edge Function using ClimateSERV API.
 */
export async function extractChirpsData(
  geoJsonPolygon: any, 
  startDate: string, // format MM/DD/YYYY
  endDate: string,   // format MM/DD/YYYY
  dasId: string
) {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data, error } = await supabase.functions.invoke('chirps-extract', {
      body: { geoJsonPolygon, startDate, endDate, dasId }
    });

    if (error) {
      // Menangani error jaringan atau "Failed to send request"
      if (error.message && error.message.includes("Failed to send a request")) {
        console.warn("⚠️ [DEV WARNING] Edge Function 'chirps-extract' tidak dapat dijangkau.");
        console.warn("Pastikan Anda telah menjalankan 'supabase functions serve' di terminal lokal, atau pastikan instance Supabase online.");
        throw new Error('Koneksi ke Edge Function gagal. Pastikan server lokal berjalan.');
      }
      throw new Error(error.message || 'Gagal mengeksekusi Edge Function CHIRPS');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (err: any) {
    // Tangkap error tidak terduga lainnya (misal timeout atau CORS blocking parah)
    const errorMessage = err.message || 'Terjadi kesalahan sistem saat menghubungi server.';
    console.error('[CHIRPS SERVICE ERROR]:', errorMessage);
    
    // Melempar error ke atas agar ditangkap UI (WebGISPanel) 
    // dan dimunculkan lewat Toast Notification merah bergaya GovTech.
    throw new Error(errorMessage);
  }
}