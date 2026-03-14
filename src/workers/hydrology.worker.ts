/**
 * Hydrology Web Worker — RekaSDA Enterprise
 * ==========================================
 * Offload semua komputasi CPU-intensive ke background thread.
 * Mencegah UI freeze saat kalkulasi matriks besar (konvolusi HSS,
 * distribusi ABM, perhitungan IDF Mononobe massal).
 *
 * Arsitektur: Request-Response dengan correlation ID
 * Main Thread ──postMessage(WorkerMessage)──▶ Worker
 * Worker ──postMessage(WorkerResponse)──▶ Main Thread
 *
 * Standard: Enterprise Performance Engineering / SNI 2415:2016
 */

import {
 calculateConvolution,
 type ConvolutionInput,
 type ConvolutionResult,
} from '../lib/utils/convolutionUtils';

import {
 calculateMononobe,
 distributeRainfallABM,
 calculateEffectiveRainfall,
 generateABMTable,
 type ABMTableRow,
} from '../lib/utils/hydrologyMath';

// ─── Tipe Input / Output untuk setiap operasi ───────────────────────────────

export interface ABMInput {
 R24: number;
 durasiHujan: number;
 interval?: number;
}

export interface ABMResult {
 distribution: number[];
 table: ABMTableRow[];
 totalRainfall: number;
 peakIntensityIndex: number;
}

export interface MononobeInput {
 R24: number;
 /** Array durasi dalam jam yang akan dihitung intensitasnya */
 durations: number[];
}

export interface MononobeResult {
 /** Array intensitas (mm/jam) sesuai urutan durations input */
 intensities: number[];
}

export interface EffectiveRainfallInput {
 hyetograph: number[];
 koefisienC: number;
}

export interface EffectiveRainfallResult {
 effectiveRainfall: number[];
 totalEffective: number;
}

// ─── Discriminated Union tipe pesan ─────────────────────────────────────────

export type WorkerMessageType =
 | 'CALCULATE_CONVOLUTION'
 | 'CALCULATE_ABM'
 | 'CALCULATE_MONONOBE'
 | 'CALCULATE_EFFECTIVE_RAINFALL';

export type WorkerResponseType =
 | 'CONVOLUTION_RESULT'
 | 'ABM_RESULT'
 | 'MONONOBE_RESULT'
 | 'EFFECTIVE_RAINFALL_RESULT'
 | 'WORKER_ERROR';

export interface WorkerMessage {
 /** Tipe operasi yang diminta */
 type: WorkerMessageType;
 /** Payload sesuai type */
 payload:
 | ConvolutionInput
 | ABMInput
 | MononobeInput
 | EffectiveRainfallInput;
 /** Correlation ID untuk mencocokkan request ↔ response */
 id: string;
}

export interface WorkerResponse {
 /** Tipe hasil atau error */
 type: WorkerResponseType;
 /** Payload hasil atau objek error */
 payload:
 | ConvolutionResult
 | ABMResult
 | MononobeResult
 | EffectiveRainfallResult
 | { error: string; originalType: WorkerMessageType };
 /** Correlation ID yang sama dengan request */
 id: string;
}

// ─── Dispatch utama ─────────────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
 const { type, payload, id } = event.data;

 try {
 switch (type) {

 // ── 1. Konvolusi HSS (superposisi matriks) ────────────────────────────
 case 'CALCULATE_CONVOLUTION': {
 const result = calculateConvolution(payload as ConvolutionInput);
 postResponse('CONVOLUTION_RESULT', result, id);
 break;
 }

 // ── 2. Distribusi Hujan ABM (Alternating Block Method) ────────────────
 case 'CALCULATE_ABM': {
 const { R24, durasiHujan, interval = 1 } = payload as ABMInput;

 const distribution = distributeRainfallABM(R24, durasiHujan, interval);
 const table = generateABMTable(R24, durasiHujan, interval);
 const totalRainfall = distribution.reduce((s, v) => s + v, 0);
 const peakIntensityIndex = distribution.indexOf(Math.max(...distribution));

 const result: ABMResult = {
 distribution,
 table,
 totalRainfall,
 peakIntensityIndex,
 };
 postResponse('ABM_RESULT', result, id);
 break;
 }

 // ── 3. Mononobe IDF Curve (batch untuk semua durasi) ──────────────────
 case 'CALCULATE_MONONOBE': {
 const { R24, durations } = payload as MononobeInput;

 if (!durations?.length) {
 throw new Error('Daftar durasi tidak boleh kosong');
 }

 const intensities = durations.map(t => calculateMononobe(R24, t));
 const result: MononobeResult = { intensities };
 postResponse('MONONOBE_RESULT', result, id);
 break;
 }

 // ── 4. Hujan Efektif (C-coefficient method) ───────────────────────────
 case 'CALCULATE_EFFECTIVE_RAINFALL': {
 const { hyetograph, koefisienC } = payload as EffectiveRainfallInput;

 const effectiveRainfall = calculateEffectiveRainfall(hyetograph, koefisienC);
 const totalEffective = effectiveRainfall.reduce((s, v) => s + v, 0);

 const result: EffectiveRainfallResult = { effectiveRainfall, totalEffective };
 postResponse('EFFECTIVE_RAINFALL_RESULT', result, id);
 break;
 }

 default: {
 // Tipe tidak dikenal — jangan crash worker, kirim error saja
 const unknownType = (event.data as WorkerMessage).type;
 postErrorResponse(`Tipe operasi tidak dikenal: ${unknownType}`, unknownType, id);
 }
 }
 } catch (error) {
 postErrorResponse(
 error instanceof Error ? error.message : 'Kesalahan tidak dikenal di Worker',
 type,
 id,
 );
 }
};

// ─── Helper functions ────────────────────────────────────────────────────────

function postResponse(
 type: WorkerResponseType,
 payload: WorkerResponse['payload'],
 id: string,
): void {
 const response: WorkerResponse = { type, payload, id };
 self.postMessage(response);
}

function postErrorResponse(
 message: string,
 originalType: WorkerMessageType | string,
 id: string,
): void {
 const response: WorkerResponse = {
 type: 'WORKER_ERROR',
 payload: { error: message, originalType: originalType as WorkerMessageType },
 id,
 };
 self.postMessage(response);
}

// Diperlukan agar TypeScript memperlakukan file ini sebagai modul
export {};
