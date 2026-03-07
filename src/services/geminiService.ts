import { supabase } from '@/lib/api/supabase';
import { apiService } from './api.service';

// getAiClient removed as logic moved to Supabase Edge Functions

/**
 * Mendapatkan embeddings untuk teks menggunakan Gemini
 */
export const getEmbeddings = async (text: string): Promise<number[]> => {
  try {
    if (!supabase) throw new Error("Supabase client not initialized");
    const { data, error } = await supabase.functions.invoke('get-embeddings', { body: { text } });
    if (error) throw error;
    return data.embedding;
  } catch (error) {
    console.error("Embedding Error:", error);
    return [];
  }
};

/**
 * Mencari referensi teknis SNI/Regulasi menggunakan Vector Search
 */
export const searchTechnicalReferences = async (query: string) => {
  try {
    const embedding = await getEmbeddings(query);
    if (embedding.length === 0) return [];

    const { data, error } = await apiService.searchDocuments(embedding, 0.5, 3);
    if (error) {
      console.error("Vector Search Error:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("searchTechnicalReferences failed:", error);
    return [];
  }
};

/**
 * Konsultasi dengan Ahli Madya SDA menggunakan Gemini API
 * Compliant dengan SNI 2415:2016 dan Permen PU No. 12/2014
 */
export const consultHydrologist = async (
  query: string, 
  contextData: string, 
  imageBase64?: string
): Promise<string> => {
  try {
    if (!supabase) throw new Error("Supabase client not initialized");
    const { data, error } = await supabase.functions.invoke('consult-hydrologist', {
      body: { query, contextData, imageBase64 }
    });
    if (error) throw error;
    return data.answer;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Terjadi kesalahan saat menghubungi layanan AI.";
  }
};
export const consultHydrologistStream = async (
  query: string,
  contextData: string,
  onChunk: (chunk: string) => void,
  imageBase64?: string
): Promise<void> => {
  // Note: Supabase Edge Functions support streaming but require specific handling.
  // For now, we'll implement a non-streaming fallback or use the standard invoke if streaming is not yet configured.
  try {
    const answer = await consultHydrologist(query, contextData, imageBase64);
    onChunk(answer);
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    throw error;
  }
};


/**
 * @feature Otomasi PDF OCR
 * Mengekstrak matriks curah hujan dari PDF menggunakan Supabase Edge Function (Gemini Multimodal OCR).
 * Menghasilkan struktur JSON { data: number[][] } dengan dimensi 31x12.
 */
export const extractRainfallFromPdf = async (pdfBase64: string, year: number): Promise<number[][] | null> => {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const cleanBase64 = pdfBase64.split(',')[1] || pdfBase64;

    const prompt = `
      Ekstrak tabel curah hujan harian dari dokumen PDF ini untuk tahun ${year}.
      
      ATURAN EKSTRAKSI:
      1. Hasil HARUS berupa matriks 2D dengan format JSON: { "data": number[][] }
      2. Matriks harus memiliki tepat 31 baris (Hari 1 s/d 31) and 12 kolom (Januari s/d Desember).
      3. Gunakan nilai 0 untuk hari tanpa hujan.
      4. Gunakan nilai null untuk sel yang kosong, strip (-), atau tidak memiliki data (misalnya 31 Februari).
      5. Pastikan semua angka desimal menggunakan titik (.) sebagai pemisah.
      6. Jika ada teks "NR" atau "Tidak ada data", anggap sebagai null.
      
      Kembalikan hanya objek JSON dengan key "data".
    `;

    const { data, error } = await supabase.functions.invoke('extract-rainfall', {
      body: { 
        fileData: cleanBase64, 
        mimeType: 'application/pdf', 
        prompt 
      }
    });

    if (error) {
      throw error;
    }

    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error("extractRainfallFromPdf failed:", error);
    throw error;
  }
};
