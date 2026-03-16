import { supabase } from '@/lib/api/supabase';

/**
 * Service to fetch CHIRPS daily rainfall data via Supabase Edge Function using ClimateSERV API.
 */
export async function extractChirpsData(
  input: any, // Can be full Feature or just Geometry
  startDate: string, // format MM/DD/YYYY
  endDate: string, // format MM/DD/YYYY
  dasId: string
) {
  // Extract geometry and properties
  const geoJsonPolygon = input?.geometry || input;
  const isDemo = dasId === 'spatial-query' && (input?.properties?.name?.includes('Demo') || input?.name?.includes('Demo'));

  if (isDemo) {
    console.log("[CHIRPS] Running in Simulation/Demo Mode.");
    await new Promise(r => setTimeout(r, 1500)); // Simulate networking
    
    const startYear = parseInt(startDate.split('/').pop() || '2010');
    const endYear = parseInt(endDate.split('/').pop() || '2023');
    const mockData: any[] = [];
    
    for (let y = startYear; y <= endYear; y++) {
      for (let m = 1; m <= 12; m++) {
        const days = new Date(y, m, 0).getDate();
        for (let d = 1; d <= days; d++) {
          // Seasonal variation (higher in rainy season Nov-March)
          const isRainy = m >= 11 || m <= 3;
          const prob = isRainy ? 0.3 : 0.05;
          const rain = Math.random() < prob ? Math.random() * (isRainy ? 50 : 15) : 0;
          
          mockData.push({
            tanggal: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,
            curah_hujan: parseFloat(rain.toFixed(1))
          });
        }
      }
    }
    return { success: true, count: mockData.length, rawData: mockData };
  }

 if (!supabase) throw new Error('Supabase client not initialized');

 try {
 const { data, error } = await supabase.functions.invoke('chirps-extract', {
 body: { geoJsonPolygon, startDate, endDate, dasId }
 });

 if (error) {
 // Menangani error jaringan atau "Failed to send request"
 if (error.message && error.message.includes("Failed to send a request")) {
 console.warn("⚠️ [DEV WARNING] Edge Function 'chirps-extract' tidak dapat dijangkau.");
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