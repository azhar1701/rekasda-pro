import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT, AI_MODEL } from '@/lib/ai/config';
import { apiService } from './api.service';

const getAiClient = () => {
  // TODO: SECURITY RISK - VITE_ prefix exposes the API key to the client bundle.
  // RECOMMENDATION: Move Gemini API calls to a Supabase Edge Function to secure the key.
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY tidak ditemukan di environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Mendapatkan embeddings untuk teks menggunakan Gemini
 */
export const getEmbeddings = async (text: string): Promise<number[]> => {
  try {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
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
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ model: AI_MODEL });

    // RAG: Search for technical references
    const references = await searchTechnicalReferences(query);
    const referenceContext = references.length > 0 
      ? "\nREFERENSI TEKNIS SNI/REGULASI RELEVAN:\n" + references.map((r: any) => `- [${r.metadata?.title || 'SNI'}] ${r.content_chunk}`).join('\n')
      : "";

    const prompt = `
${SYSTEM_PROMPT}

═══════════════════════════════════════════════════════════════
KONTEKS DATA PERHITUNGAN
═══════════════════════════════════════════════════════════════

${contextData}
${referenceContext}

═══════════════════════════════════════════════════════════════
PERTANYAAN USER
═══════════════════════════════════════════════════════════════

${query}

═══════════════════════════════════════════════════════════════
INSTRUKSI
═══════════════════════════════════════════════════════════════

Analisis pertanyaan di atas dengan merujuk SNI/Permen yang relevan.
Berikan jawaban yang praktis, akurat, dan sesuai standar Indonesia.
Siapkan kutipan yang jelas jika menggunakan referensi teknis yang disediakan.
    `;

    if (imageBase64) {
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64
          }
        },
        prompt
      ]);
      
      const response = await result.response;
      return response.text() || "Maaf, saya tidak dapat menganalisis gambar saat ini.";
    } else {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || "Maaf, tidak ada respon.";
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return "Error: API Key tidak valid atau tidak ditemukan. Periksa konfigurasi VITE_API_KEY di file .env";
      }
      if (error.message.includes('503') || error.message.includes('high demand')) {
        return "⚠️ Layanan AI sedang mengalami lonjakan permintaan. Silakan coba lagi dalam beberapa saat.";
      }
      return `Error: ${error.message}`;
    }
    return "Terjadi kesalahan saat menghubungi layanan AI. Pastikan koneksi internet tersedia.";
  }
};
/**
 * Konsultasi dengan Ahli Madya SDA menggunakan Gemini API (Streaming version)
 */
export const consultHydrologistStream = async (
  query: string,
  contextData: string,
  onChunk: (chunk: string) => void,
  imageBase64?: string
): Promise<void> => {
  try {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ model: AI_MODEL });

    const references = await searchTechnicalReferences(query);
    const referenceContext = references.length > 0 
      ? "\nREFERENSI TEKNIS SNI/REGULASI RELEVAN:\n" + references.map((r: any) => `- [${r.metadata?.title || 'SNI'}] ${r.content_chunk}`).join('\n')
      : "";

    const prompt = `
${SYSTEM_PROMPT}

═══════════════════════════════════════════════════════════════
KONTEKS DATA PERHITUNGAN
═══════════════════════════════════════════════════════════════

${contextData}
${referenceContext}

═══════════════════════════════════════════════════════════════
PERTANYAAN USER
═══════════════════════════════════════════════════════════════

${query}

═══════════════════════════════════════════════════════════════
INSTRUKSI
═══════════════════════════════════════════════════════════════

Analisis pertanyaan di atas dengan merujuk SNI/Permen yang relevan.
Berikan jawaban yang praktis, akurat, dan sesuai standar Indonesia.
Siapkan kutipan yang jelas jika menggunakan referensi teknis yang disediakan.
    `;

    let result;
    if (imageBase64) {
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      result = await model.generateContentStream([
        { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
        prompt
      ]);
    } else {
      result = await model.generateContentStream(prompt);
    }

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      onChunk(chunkText);
    }
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    throw error;
  }
};


/**
 * @feature Otomasi PDF OCR
 * Mengekstrak matriks curah hujan dari PDF menggunakan Gemini Multimodal OCR.
 * Menghasilkan struktur JSON { data: number[][] } dengan dimensi 31x12.
 */
export const extractRainfallFromPdf = async (pdfBase64: string, year: number): Promise<number[][] | null> => {
  try {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ 
      model: AI_MODEL,
      generationConfig: { responseMimeType: "application/json" }
    });

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

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: cleanBase64
        }
      },
      prompt
    ]);

    const response = await result.response;
    const text = response.text();
    const json = JSON.parse(text);
    
    if (json.data && Array.isArray(json.data)) {
      return json.data;
    }
    
    return null;
  } catch (error) {
    console.error("extractRainfallFromPdf failed:", error);
    throw error;
  }
};
