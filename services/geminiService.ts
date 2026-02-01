import { GoogleGenerativeAI } from "@google/generative-ai";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly maxRequests = 10;
  private readonly windowMs = 60000; // 1 minute
  private locks = new Map<string, boolean>();

  canMakeRequest(key: string): boolean {
    // Simple lock mechanism to prevent race conditions
    if (this.locks.get(key)) {
      return false;
    }
    
    this.locks.set(key, true);
    
    try {
      const now = Date.now();
      const entry = this.limits.get(key);

      if (!entry || now > entry.resetTime) {
        this.limits.set(key, { count: 1, resetTime: now + this.windowMs });
        return true;
      }

      if (entry.count >= this.maxRequests) {
        return false;
      }

      entry.count++;
      return true;
    } finally {
      this.locks.delete(key);
    }
  }

  getTimeUntilReset(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;
    return Math.max(0, entry.resetTime - Date.now());
  }
}

class ResponseCache {
  private cache = new Map<string, { data: string; timestamp: number }>();
  private readonly maxAge = 5 * 60 * 1000; // 5 minutes

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: string): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // Clean old entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const rateLimiter = new RateLimiter();
const responseCache = new ResponseCache();

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_API_KEY tidak ditemukan di environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
};

const createCacheKey = (query: string, contextData: string, hasImage: boolean): string => {
  const content = query + contextData + (hasImage ? 'with-image' : 'no-image');
  return btoa(content).slice(0, 32); // Simple hash
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
  const cacheKey = createCacheKey(query, contextData, !!imageBase64);
  
  // Check cache first (only for non-image requests)
  if (!imageBase64) {
    const cached = responseCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Check rate limit
  if (!rateLimiter.canMakeRequest('gemini-api')) {
    const resetTime = rateLimiter.getTimeUntilReset('gemini-api');
    throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(resetTime / 1000)} seconds.`);
  }

  try {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    let result;
    if (imageBase64) {
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      
      result = await model.generateContent([
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64
          }
        },
        prompt
      ]);
    } else {
      result = await model.generateContent(prompt);
    }
    
    const response = await result.response;
    const text = response.text() || "Maaf, tidak ada respon.";
    
    // Cache response (only for non-image requests)
    if (!imageBase64) {
      responseCache.set(cacheKey, text);
    }
    
    return text;

  } catch (error) {
    console.error("Gemini Error:", error);
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return "Error: API Key tidak valid atau tidak ditemukan. Periksa konfigurasi VITE_API_KEY di file .env";
      }
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return "Error: Kuota API habis atau rate limit terlampaui. Coba lagi nanti.";
      }
      return `Error: ${error.message}`;
    }
    return "Terjadi kesalahan saat menghubungi layanan AI. Pastikan koneksi internet tersedia.";
  }
};

export const clearCache = () => {
  responseCache.clear();
};

export const getCacheStats = () => {
  return {
    size: responseCache['cache'].size,
    maxSize: 100
  };
};
