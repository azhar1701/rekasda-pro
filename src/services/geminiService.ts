import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/api/supabase';
import { apiService } from './api.service';

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
 * Helper to get the active Gemini API key from localStorage (user configured)
 * or fall back to environment variables.
 */
export const getActiveGeminiApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem('rekasda_gemini_api_key');
    if (customKey && customKey.trim().length > 0) return customKey.trim();
  }
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) return envKey.trim();
  return null;
};

/**
 * Helper to store or clear user-configured Gemini API key in localStorage
 */
export const setActiveGeminiApiKey = (key: string | null) => {
  if (typeof window !== 'undefined') {
    if (key && key.trim().length > 0) {
      localStorage.setItem('rekasda_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('rekasda_gemini_api_key');
    }
  }
};

/**
 * Tes koneksi ke API Google Gemini menggunakan API Key tertentu atau aktif
 */
export const testGeminiConnection = async (customApiKey?: string): Promise<{ success: boolean; message: string; model?: string }> => {
  const apiKey = customApiKey || getActiveGeminiApiKey();
  if (!apiKey) {
    return { success: false, message: 'Belum ada API Key yang dikonfigurasi.' };
  }

  const client = new GoogleGenerativeAI(apiKey);
  const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
  let lastErrMsg = '';

  for (const modelName of candidateModels) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const resp = await model.generateContent('Katakan OK.');
      const text = resp.response.text();
      if (text) {
        return { success: true, message: `Koneksi berhasil! Model aktif: ${modelName}`, model: modelName };
      }
    } catch (err: any) {
      lastErrMsg = err.message || '';
      if (lastErrMsg.includes('leaked') || lastErrMsg.includes('PERMISSION_DENIED')) {
        return { success: false, message: 'Kunci API ini dilaporkan bocor/leaked oleh Google dan telah dicabut. Harap buat Kunci API baru di Google AI Studio.' };
      }
      if (lastErrMsg.includes('API_KEY_INVALID')) {
        return { success: false, message: 'Format Kunci API tidak valid. Periksa kembali karakter kunci Anda.' };
      }
    }
  }

  return { success: false, message: `Gagal menghubungkan ke Gemini: ${lastErrMsg || 'Model tidak merespon'}` };
};

/**
 * Helper to build GoogleGenerativeAI client when API Key is available
 */
const getDirectClient = () => {
  const apiKey = getActiveGeminiApiKey();
  if (!apiKey || apiKey.trim() === '') return null;
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Konsultasi dengan Ahli Madya SDA menggunakan Gemini API
 * Arsitektur Triple-Layer:
 * Layer 1: Supabase Edge Function ('ai-consult')
 * Layer 2: Direct GoogleGenerativeAI Client (VITE_GEMINI_API_KEY)
 * Layer 3: Exception rethrow -> Offline SNI Expert Engine
 */
export const consultHydrologist = async (
  query: string, 
  contextData: string, 
  imageBase64?: string
): Promise<string> => {
  let lastError: Error | null = null;

  // Layer 1: Panggil Supabase Edge Function 'ai-consult'
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-consult', {
        body: {
          user_query: query,
          query: query,
          active_context: contextData,
          contextData: contextData,
          imageBase64: imageBase64
        }
      });

      if (!error && data) {
        const text = data.markdown_text || data.answer || data.text;
        if (text && typeof text === 'string' && !text.includes('kesalahan sistem')) {
          return text;
        }
      }
      if (error) lastError = error;
    } catch (e: any) {
      console.warn('Supabase Edge Function ai-consult unavailable, checking Layer 2 direct SDK:', e.message);
      lastError = e;
    }
  }

  // Layer 2: Panggil Direct GoogleGenerativeAI Client jika API key tersedia
  const directGenAI = getDirectClient();
  if (directGenAI) {
    const prompt = `You are a Principal Water Resources Engineer consulting for RekaSDA Pro.
Strictly comply with Indonesian National Standards (SNI 2415:2016, SNI 19-6728.1-2002, and SNI 03-2401-1991).

Konteks Perhitungan Saat Ini:
${contextData}

Pertanyaan / Masalah Pengguna:
${query}`;

      const parts: any[] = [{ text: prompt }];

      if (imageBase64 && typeof imageBase64 === 'string') {
        const mimeMatch = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const cleanBase64 = imageBase64.split(",")[1] || imageBase64;
        parts.push({
          inlineData: {
            mimeType,
            data: cleanBase64
          }
        });
      }

    for (const modelName of ['gemini-2.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash']) {
      try {
        const model = directGenAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(parts);
        const text = result.response.text();
        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (e: any) {
        console.warn(`Direct Gemini SDK model ${modelName} failed:`, e.message);
        lastError = e;
        if (e.message?.includes('leaked') || e.message?.includes('PERMISSION_DENIED')) {
          break;
        }
      }
    }
  }

  // Jika kedua jalur online gagal, lemparkan error agar ditangkap oleh UI untuk memicu Layer 3 (Offline SNI Engine)
  throw lastError || new Error('Layanan AI online tidak dapat dijangkau.');
};

/**
 * Konsultasi Streaming AI
 */
export const consultHydrologistStream = async (
  query: string,
  contextData: string,
  onChunk: (chunk: string) => void,
  imageBase64?: string
): Promise<void> => {
  // Coba streaming langsung jika direct SDK tersedia
  const directGenAI = getDirectClient();
  if (directGenAI) {
    const prompt = `You are a Principal Water Resources Engineer consulting for RekaSDA Pro.
Strictly comply with Indonesian National Standards (SNI 2415:2016, SNI 19-6728.1-2002, and SNI 03-2401-1991).

Konteks Perhitungan:
${contextData}

Pertanyaan:
${query}`;

    const parts: any[] = [{ text: prompt }];

    if (imageBase64 && typeof imageBase64 === 'string') {
      const mimeMatch = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const cleanBase64 = imageBase64.split(",")[1] || imageBase64;
      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64
        }
      });
    }

    for (const modelName of ['gemini-2.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash']) {
      try {
        const model = directGenAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContentStream(parts);
        let gotChunk = false;
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            gotChunk = true;
            onChunk(text);
          }
        }
        if (gotChunk) return;
      } catch (streamErr: any) {
        console.warn(`Direct streaming on ${modelName} failed:`, streamErr.message);
        if (streamErr.message?.includes('leaked') || streamErr.message?.includes('PERMISSION_DENIED')) {
          break;
        }
      }
    }
  }

  // Fallback ke consultHydrologist (akan memanggil Edge Function atau direct SDK, atau throw ke offline engine)
  const answer = await consultHydrologist(query, contextData, imageBase64);
  onChunk(answer);
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
