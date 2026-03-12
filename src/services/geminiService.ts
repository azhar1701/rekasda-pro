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
    
    if (error) {
      console.error("Supabase function error:", error);
      const details = error instanceof Error ? error.message : JSON.stringify(error);
      return `Kesalahan Layanan AI: ${details}. Pastikan fungsi sudah di-deploy.`;
    }
    
    return data.answer;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `Gagal menghubungi AI: ${error.message || 'Cek koneksi internet atau status deploy fungsi.'}`;
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
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) throw new Error("VITE_API_KEY is not set in environment variables.");
    
    const systemPrompt = `
      Anda adalah "RekaSDA AI", asisten ahli hidrologi dan teknik sumber daya air yang profesional.
      Tugas Anda adalah membantu insinyur dalam menganalisis data hidrologi, perhitungan debit banjir, dan pengelolaan sumber daya air sesuai standar SNI (Standar Nasional Indonesia).
      Selalu merujuk pada SNI 2415:2016 jika relevan.
      
      Context Data Proyek Saat Ini:
      ${contextData}
    `;

    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse&key=${apiKey}`;

    const parts: any[] = [{ text: systemPrompt }, { text: `Pertanyaan Pengguna: ${query}` }];
    
    if (imageBase64) {
      const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64
        }
      });
    }

    const geminiReqBody = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiReqBody)
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errorMsg}`);
    }
    if (!response.body) throw new Error('No response body received from stream.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              onChunk(text);
            }
          } catch (e) {
            // Ignore partial parsing errors in SSE stream
          }
        }
      }
    }
  } catch (error: any) {
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
