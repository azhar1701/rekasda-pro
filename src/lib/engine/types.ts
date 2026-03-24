/**
 * EngineResult<T> — Pola Metadata Standar untuk Seluruh Modul Engine
 *
 * Setiap fungsi perhitungan di engine layer HARUS mengembalikan EngineResult<T>.
 * Pola ini memastikan auditabilitas, transparansi teknis, dan traceability
 * ke standar SNI yang digunakan.
 *
 * @standard SNI 2415:2016
 */

import { PRECISION } from '@/lib/constants/precision';

/**
 * Metadata rekayasa yang menyertai setiap hasil perhitungan.
 */
export interface EngineeringMetadata {
  /** Standar teknis yang digunakan (e.g., "SNI 2415:2016") */
  standard: string;
  /** Klausul atau pasal yang relevan (e.g., "Pasal 5.2") */
  clause: string;
  /** Nama metode perhitungan (e.g., "Metode Rasional") */
  method: string;
  /** Peringatan validasi (non-fatal) */
  warnings: string[];
  /** Catatan tambahan (opsional) */
  notes?: string;
  /** Pesan error jika perhitungan gagal */
  error?: string;
  /** Presisi output yang digunakan */
  precision?: Partial<typeof PRECISION>;
}

/**
 * Tipe generik untuk hasil perhitungan engine.
 * Menggabungkan data hasil dengan metadata rekayasa.
 *
 * @template T - Tipe data hasil perhitungan
 *
 * @example
 * ```typescript
 * interface ChannelCapacityData {
 *   Q: number;
 *   V: number;
 *   Fr: number;
 * }
 *
 * function calculateChannelCapacity(input: ChannelInput): EngineResult<ChannelCapacityData> {
 *   return {
 *     data: { Q: 5.234, V: 1.892, Fr: 0.654 },
 *     metadata: {
 *       standard: 'SNI 8066:2015',
 *       clause: 'Pasal 4.3',
 *       method: 'Manning Equation',
 *       warnings: [],
 *     }
 *   };
 * }
 * ```
 */
export interface EngineResult<T> {
  /** Data hasil perhitungan */
  data: T;
  /** Metadata rekayasa untuk auditabilitas */
  metadata: EngineeringMetadata;
}
