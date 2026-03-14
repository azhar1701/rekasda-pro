import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

type RasionalMethod = 'haspers' | 'der_weduwen' | 'melchior';

interface RasionalModifikasiRequest {
 method: RasionalMethod;
 A: number; // Luas DAS (km²)
 L: number; // Panjang sungai (km)
 S: number; // Kemiringan sungai
 I?: number; // Intensitas hujan
 R24?: number;
 C?: number; // Koefisien pengaliran (khusus Melchior)
}

interface RasionalModifikasiResult {
 qPeak: number;
 t?: number;
 alpha?: number;
 beta?: number;
 method?: string;
 warnings?: string[];
}

interface NakayasuRequest {
 A: number; // Luas DAS (km²)
 L: number; // Panjang sungai (km)
 ro?: number; // Satuan hujan efektif (mm)
 alpha?: number; // Koefisien α (default 2.0)
 rainfall?: number[];
}

interface NakayasuResult {
 Tp: number;
 T03: number;
 Tg: number;
 Qp: number;
 hydrograph: Array<{ time: number; inflow: number }>;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Mutation hook for Modified Rational Method (Haspers, der Weduwen, Melchior).
 * Endpoint: POST /api/v1/banjir/rasional-modifikasi
 */
export function useRasionalModifikasiMutation() {
 return useMutation({
 mutationKey: ['banjir', 'rasional-modifikasi'],
 mutationFn: (payload: RasionalModifikasiRequest) =>
 apiClient.post<RasionalModifikasiResult>(
 '/api/v1/banjir/rasional-modifikasi',
 payload,
 ),
 });
}

/**
 * Mutation hook for HSS Nakayasu hydrograph generation.
 * Endpoint: POST /api/v1/banjir/nakayasu
 */
export function useNakayasuMutation() {
 return useMutation({
 mutationKey: ['banjir', 'nakayasu'],
 mutationFn: (payload: NakayasuRequest) =>
 apiClient.post<NakayasuResult>('/api/v1/banjir/nakayasu', payload),
 });
}
