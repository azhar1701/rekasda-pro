/**
 * Water Balance Engine — Demand Calculation & Balance Analysis
 *
 * Logika perhitungan keseimbangan air yang diekstrak dari
 * WaterBalanceAnalysis.tsx untuk memisahkan business logic dari UI.
 *
 * @standard SNI 19-6728.1-2002
 */

import { roundEng } from '@/lib/utils/precision';
import { PRECISION } from '@/lib/constants/precision';
import type { EngineResult } from '@/lib/engine/types';

// ─── Types ──────────────────────────────────────────────────────────

export interface WaterDemandInput {
  /** Jumlah penduduk (jiwa) */
  population: number;
  /** Standar kebutuhan domestik (L/orang/hari) */
  domesticStandard: number;
  /** Luas pertanian (ha) */
  agricultureArea: number;
  /** Kebutuhan irigasi langsung (m³/s) */
  irrigationDemand: number;
}

export interface WaterDemandResult {
  /** Kebutuhan domestik (m³/s) */
  domesticDemand: number;
  /** Kebutuhan pertanian (m³/s) */
  agricultureDemand: number;
  /** Kebutuhan irigasi (m³/s) */
  irrigationDemand: number;
  /** Total kebutuhan (m³/s) */
  totalDemand: number;
}

export interface MonthlyBalance {
  supply: number;
  demand: number;
  balance: number;
}

export interface WaterBalanceInput {
  demand: WaterDemandInput;
  /** Ketersediaan air bulanan (m³/s) — 12 elemen (Jan-Des) */
  monthlySupply: number[];
}

export interface WaterBalanceResult {
  demandBreakdown: WaterDemandResult;
  monthlyBalance: MonthlyBalance[];
  avgBalance: number;
  minBalance: number;
  maxBalance: number;
  criticalMonths: MonthlyBalance[];
}

// ─── Demand Calculation ─────────────────────────────────────────────

/**
 * Hitung kebutuhan air berdasarkan parameter populasi dan pertanian.
 *
 * Formula:
 * - Domestik: (populasi × standar) / (24 × 3600) / 1000  → L/hari ke m³/s
 * - Pertanian: (luas × 2.5) / (365 × 24 × 3600)          → m³/ha/hari ke m³/s
 *
 * @param input - Parameter kebutuhan air
 * @returns Rincian kebutuhan air
 */
export function calculateWaterDemand(input: WaterDemandInput): WaterDemandResult {
  const domesticDemand = (input.population * input.domesticStandard) / (24 * 3600) / 1000;
  const agricultureDemand = (input.agricultureArea * 2.5) / (365 * 24 * 3600);
  const totalDemand = domesticDemand + agricultureDemand + input.irrigationDemand;

  return {
    domesticDemand: roundEng(domesticDemand, PRECISION.discharge),
    agricultureDemand: roundEng(agricultureDemand, PRECISION.discharge),
    irrigationDemand: roundEng(input.irrigationDemand, PRECISION.discharge),
    totalDemand: roundEng(totalDemand, PRECISION.discharge),
  };
}

// ─── Balance Analysis ───────────────────────────────────────────────

/**
 * Analisis keseimbangan air bulanan.
 * Menghitung surplus/defisit per bulan dan mengidentifikasi bulan kritis.
 *
 * @param input - Data kebutuhan dan ketersediaan air
 * @returns EngineResult dengan analisis keseimbangan lengkap
 */
export function analyzeWaterBalance(
  input: WaterBalanceInput
): EngineResult<WaterBalanceResult> {
  const warnings: string[] = [];

  if (input.monthlySupply.length !== 12) {
    warnings.push(`Jumlah data bulanan (${input.monthlySupply.length}) tidak sama dengan 12 bulan`);
  }

  const demandBreakdown = calculateWaterDemand(input.demand);
  const totalDemand = demandBreakdown.totalDemand;

  const monthlyBalance: MonthlyBalance[] = input.monthlySupply.map((supply) => ({
    supply: roundEng(supply, PRECISION.discharge),
    demand: totalDemand,
    balance: roundEng(supply - totalDemand, PRECISION.discharge),
  }));

  const balances = monthlyBalance.map(m => m.balance);
  const avgBalance = roundEng(balances.reduce((sum, b) => sum + b, 0) / balances.length, PRECISION.discharge);
  const minBalance = roundEng(Math.min(...balances), PRECISION.discharge);
  const maxBalance = roundEng(Math.max(...balances), PRECISION.discharge);
  const criticalMonths = monthlyBalance.filter(m => m.balance < 0);

  if (criticalMonths.length > 0) {
    warnings.push(`Terdeteksi ${criticalMonths.length} bulan kritis dengan defisit air`);
  }

  return {
    data: {
      demandBreakdown,
      monthlyBalance,
      avgBalance,
      minBalance,
      maxBalance,
      criticalMonths,
    },
    metadata: {
      standard: 'SNI 19-6728.1-2002',
      clause: 'Analisis Keseimbangan Air',
      method: 'Neraca Air Bulanan',
      warnings,
      precision: { discharge: PRECISION.discharge },
    },
  };
}
