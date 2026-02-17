import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT, AI_MODEL } from '@/lib/ai/config';

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_API_KEY tidak ditemukan di environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
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

    const prompt = `
${SYSTEM_PROMPT}

═══════════════════════════════════════════════════════════════
KONTEKS DATA PERHITUNGAN
═══════════════════════════════════════════════════════════════

${contextData}

═══════════════════════════════════════════════════════════════
PERTANYAAN USER
═══════════════════════════════════════════════════════════════

${query}

═══════════════════════════════════════════════════════════════
INSTRUKSI
═══════════════════════════════════════════════════════════════

Analisis pertanyaan di atas dengan merujuk SNI/Permen yang relevan.
Berikan jawaban yang praktis, akurat, dan sesuai standar Indonesia.
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
      return `Error: ${error.message}`;
    }
    return "Terjadi kesalahan saat menghubungi layanan AI. Pastikan koneksi internet tersedia.";
  }
};
