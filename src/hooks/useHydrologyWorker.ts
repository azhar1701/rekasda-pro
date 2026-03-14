/**
 * useHydrologyWorker — React Hook
 * ================================
 * Antarmuka React untuk berkomunikasi dengan Hydrology Web Worker.
 * Menyediakan API Promise-based yang type-safe untuk semua operasi
 * CPU-intensive: Konvolusi HSS, ABM, Mononobe, dan Hujan Efektif.
 *
 * Pola penggunaan:
 * const { calculateConvolution, calculateABM, isCalculating } = useHydrologyWorker();
 * const result = await calculateABM({ R24: 155, durasiHujan: 6 });
 *
 * Standard: Enterprise Performance Engineering
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ConvolutionInput, ConvolutionResult } from '../lib/utils/convolutionUtils';
import type {
 WorkerMessage,
 WorkerResponse,

 ABMInput,
 ABMResult,
 MononobeInput,
 MononobeResult,
 EffectiveRainfallInput,
 EffectiveRainfallResult,
} from '../workers/hydrology.worker';

// ─── Tipe return hook ────────────────────────────────────────────────────────

export interface UseHydrologyWorkerReturn {
 /** Hitung konvolusi HSS × Hujan Efektif */
 calculateConvolution: (input: ConvolutionInput) => Promise<ConvolutionResult>;
 /** Distribusikan hujan menggunakan Alternating Block Method */
 calculateABM: (input: ABMInput) => Promise<ABMResult>;
 /** Hitung intensitas Mononobe untuk array durasi */
 calculateMononobe: (input: MononobeInput) => Promise<MononobeResult>;
 /** Hitung hujan efektif dari hyetograph dan koefisien C */
 calculateEffectiveRainfall: (input: EffectiveRainfallInput) => Promise<EffectiveRainfallResult>;
 /** true saat ada pekerjaan yang sedang diproses worker */
 isCalculating: boolean;
 /** Pesan error terakhir, null jika tidak ada */
 error: string | null;
 /** Bersihkan error state */
 clearError: () => void;
}

// Peta dari tipe response ke tipe request-nya untuk validasi
// const RESPONSE_TO_REQUEST_TYPE: Record<WorkerResponseType, string> = {
// CONVOLUTION_RESULT: 'CALCULATE_CONVOLUTION',
// ABM_RESULT: 'CALCULATE_ABM',
// MONONOBE_RESULT: 'CALCULATE_MONONOBE',
// EFFECTIVE_RAINFALL_RESULT: 'CALCULATE_EFFECTIVE_RAINFALL',
// WORKER_ERROR: 'WORKER_ERROR',
// };

// ─── Hook utama ──────────────────────────────────────────────────────────────

export function useHydrologyWorker(): UseHydrologyWorkerReturn {
 const [isCalculating, setIsCalculating] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // Satu worker instance untuk semua operasi — lebih efisien dari membuat banyak worker
 const workerRef = useRef<Worker | null>(null);

 // Map correlation ID → Promise handlers; mendukung concurrency
 const pendingRef = useRef<
 Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>
 >(new Map());

 // Hitung jumlah request aktif untuk isCalculating yang akurat
 const activeCountRef = useRef(0);

 // ── Inisialisasi & cleanup worker ─────────────────────────────────────────

 useEffect(() => {
 const worker = new Worker(
 new URL('../workers/hydrology.worker.ts', import.meta.url),
 { type: 'module' },
 );

 worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
 const { type, payload, id } = event.data;
 const pending = pendingRef.current.get(id);

 if (!pending) return; // Respons sudah kadaluarsa atau duplikat

 pendingRef.current.delete(id);
 activeCountRef.current = Math.max(0, activeCountRef.current - 1);
 if (activeCountRef.current === 0) setIsCalculating(false);

 if (type === 'WORKER_ERROR') {
 const msg = (payload as { error: string }).error;
 setError(msg);
 pending.reject(new Error(msg));
 } else {
 setError(null);
 pending.resolve(payload);
 }
 };

 worker.onerror = (event) => {
 const msg = event.message ?? 'Kesalahan tidak dikenal pada Web Worker';
 setError(msg);
 // Reject semua pending requests
 pendingRef.current.forEach(({ reject }) => reject(new Error(msg)));
 pendingRef.current.clear();
 activeCountRef.current = 0;
 setIsCalculating(false);
 };

 workerRef.current = worker;

 return () => {
 worker.terminate();
 workerRef.current = null;
 };
 }, []);

 // ── Fungsi pengiriman generik ──────────────────────────────────────────────

 const dispatch = useCallback(
 <TResult>(message: WorkerMessage): Promise<TResult> => {
 return new Promise<TResult>((resolve, reject) => {
 if (!workerRef.current) {
 reject(new Error('Worker hidrologi belum siap. Coba lagi sebentar.'));
 return;
 }

 const { id } = message;
 pendingRef.current.set(id, {
 resolve: resolve as (v: unknown) => void,
 reject,
 });

 activeCountRef.current += 1;
 setIsCalculating(true);
 setError(null);

 workerRef.current.postMessage(message);
 });
 },
 [],
 );

 // ── ID generator ──────────────────────────────────────────────────────────

 const nextId = (): string =>
 `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

 // ── API publik ────────────────────────────────────────────────────────────

 const calculateConvolution = useCallback(
 (input: ConvolutionInput): Promise<ConvolutionResult> =>
 dispatch<ConvolutionResult>({
 type: 'CALCULATE_CONVOLUTION',
 payload: input,
 id: nextId(),
 }),
 [dispatch],
 );

 const calculateABM = useCallback(
 (input: ABMInput): Promise<ABMResult> =>
 dispatch<ABMResult>({
 type: 'CALCULATE_ABM',
 payload: input,
 id: nextId(),
 }),
 [dispatch],
 );

 const calculateMononobe = useCallback(
 (input: MononobeInput): Promise<MononobeResult> =>
 dispatch<MononobeResult>({
 type: 'CALCULATE_MONONOBE',
 payload: input,
 id: nextId(),
 }),
 [dispatch],
 );

 const calculateEffectiveRainfall = useCallback(
 (input: EffectiveRainfallInput): Promise<EffectiveRainfallResult> =>
 dispatch<EffectiveRainfallResult>({
 type: 'CALCULATE_EFFECTIVE_RAINFALL',
 payload: input,
 id: nextId(),
 }),
 [dispatch],
 );

 const clearError = useCallback(() => setError(null), []);

 return {
 calculateConvolution,
 calculateABM,
 calculateMononobe,
 calculateEffectiveRainfall,
 isCalculating,
 error,
 clearError,
 };
}

// Re-export tipe dari worker agar konsumer tidak perlu import ganda
export type {
 ABMInput,
 ABMResult,
 MononobeInput,
 MononobeResult,
 EffectiveRainfallInput,
 EffectiveRainfallResult,
};
