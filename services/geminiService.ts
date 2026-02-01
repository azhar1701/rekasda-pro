import { GoogleGenerativeAI } from "@google/generative-ai";

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_API_KEY tidak ditemukan di environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Konsultasi dengan ahli hidrologi menggunakan Gemini API
 * Menggunakan standar SNI dan Kriteria Perencanaan (KP) Kementerian PUPR
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

DASAR STANDAR YANG HARUS DIGUNAKAN:

1. SNI SUMBER DAYA AIR:
   - SNI 6728.1:2015: Neraca Sumber Daya Air (Spasial)
   - SNI 6728-1:2015: Kebutuhan Air (60-90 L/orang/hari untuk semi-urban)
   - SNI 2415:2016: Perhitungan Debit Banjir
   - SNI 6738:2015: Perhitungan Debit Andalan Sungai

2. KRITERIA PERENCANAAN (KP) KEMENTERIAN PUPR:
   - KP-01: Perencanaan Jaringan Irigasi
   - KP-02: Bangunan Utama (Bendung dan pengambilan bebas)
   - KP-03: Saluran (Dimensi dan kapasitas saluran irigasi)
   - KP-04: Bangunan (Bangunan bagi, sadap, dan pengukur)
   - KP-05: Petak Tersier (Sistem irigasi tingkat usaha tani)
   - KP-06: Parameter Bangunan (Struktur bangunan irigasi)
   - KP-07: Bangunan Ukur dan Alat Ukur (Pengukuran debit air)

SELALU rujuk standar ini dalam analisis dan rekomendasi Anda.

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
