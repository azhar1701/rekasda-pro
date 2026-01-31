import { GoogleGenerativeAI } from "@google/generative-ai";

// Polyfill fetch for environments that don't have it
if (typeof fetch !== 'function') {
  const { default: nodeFetch } = await import('node-fetch');
  global.fetch = nodeFetch;
}

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_API_KEY tidak ditemukan di environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
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
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
Anda adalah Asisten Ahli Hidrologi Senior untuk aplikasi lapangan.
Gunakan Bahasa Indonesia yang formal namun praktis.
Berikan saran berdasarkan standar SNI (Standar Nasional Indonesia) jika relevan.

Konteks Data Perhitungan Terakhir:
${contextData}

Pertanyaan User:
${query}
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
