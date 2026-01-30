
// Fix: Use correct @google/genai initialization and model selection.
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

/**
 * Konsultasi dengan ahli hidrologi menggunakan Gemini API
 */
export const consultHydrologist = async (
  query: string, 
  contextData: string, 
  imageBase64?: string
): Promise<string> => {
  try {
    // Re-initialize client to ensure latest API key if applicable.
    const ai = getAiClient();
    // Hydrology analysis is a complex reasoning task, gemini-3-pro-preview is preferred.
    const model = 'gemini-3-pro-preview';

    const prompt = `
      Anda adalah Asisten Ahli Hidrologi Senior untuk aplikasi lapangan.
      Gunakan Bahasa Indonesia yang formal namun praktis.
      Berikan saran berdasarkan standar SNI (Standar Nasional Indonesia) jika relevan.
      
      Konteks Data Perhitungan Terakhir:
      ${contextData}

      Pertanyaan User:
      ${query}
    `;

    const generativeModel = ai.getGenerativeModel({ model });

    if (imageBase64) {
      // Clean base64 string if it contains data URL prefix
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      
      const response = await generativeModel.generateContent([
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
        prompt
      ]);
      
      const result = await response.response;
      return result.text() || "Maaf, saya tidak dapat menganalisis gambar saat ini.";
    } else {
      const response = await generativeModel.generateContent(prompt);
      const result = await response.response;
      return result.text() || "Maaf, tidak ada respon.";
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    return "Terjadi kesalahan saat menghubungi layanan AI. Pastikan koneksi internet tersedia.";
  }
};
