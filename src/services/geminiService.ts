import { supabase } from '@/lib/api/supabase';

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
 * Konsultasi dengan Ahli Madya SDA menggunakan Gemini API
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

/**
 * Konsultasi Streaming dengan Gemini
 */
export const consultHydrologistStream = async (
  query: string,
  contextData: string,
  onChunk: (chunk: string) => void,
  imageBase64?: string
): Promise<void> => {
  try {
    const { data: { session } } = await supabase!.auth.getSession();
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/consult-hydrologist-stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ query, contextData, imageBase64 })
      }
    );

    if (!response.ok) throw new Error('Network response was not ok');
    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  } catch (error) {
    console.error("Streaming Error:", error);
    throw error;
  }
};

/**
 * Mengekstrak matriks curah hujan dari PDF (Gemini Multimodal OCR)
 */
export const extractRainfallFromPdf = async (pdfBase64: string, year: number): Promise<number[][] | null> => {
  try {
    if (!supabase) throw new Error("Supabase client not initialized");
    const cleanBase64 = pdfBase64.split(',')[1] || pdfBase64;
    const prompt = `Ekstrak tabel curah hujan harian dari dokumen PDF ini untuk tahun ${year}.`;

    const { data, error } = await supabase.functions.invoke('extract-rainfall', {
      body: { fileData: cleanBase64, mimeType: 'application/pdf', prompt }
    });

    if (error) throw error;
    return data?.data || null;
  } catch (error) {
    console.error("extractRainfallFromPdf failed:", error);
    throw error;
  }
};
