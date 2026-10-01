/**
 * useAIContext — Context-Aware AI Ingestion Hook
 * ================================================
 * Monitors useHydrologyStore + active tab to construct a dynamic
 * "Invisible System Context" string injected into every AI prompt.
 *
 * Also generates smart suggestion chips based on state anomalies.
 *
 * @module useAIContext
 */

import { useMemo } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';

// ─── Types ──────────────────────────────────────────────────────────

export type ActiveModule =
  | 'SALURAN'
  | 'BANJIR'
  | 'NERACA'
  | 'EMBUNG'
  | 'MASTER'
  | 'HISTORY'
  | 'AI'
  | 'EXEC';

export interface SuggestionChip {
  /** Unique key */
  id: string;
  /** Display text for the chip */
  label: string;
  /** Full prompt to inject if user clicks */
  prompt: string;
  /** Severity: info | warning | critical */
  severity: 'info' | 'warning' | 'critical';
  /** Icon hint (emoji fallback) */
  icon: string;
}

export interface AIContextResult {
  /** The invisible system context string to prepend to every AI prompt */
  systemContext: string;
  /** Dynamic suggestion chips based on current state */
  suggestionChips: SuggestionChip[];
  /** Short summary of current module for UI badges */
  moduleSummary: string;
  /** Whether there are actionable issues */
  hasIssues: boolean;
  /** Structured list of what data is currently available to AI */
  dataStatus: { label: string; isLoaded: boolean }[];

}

// ─── Module Label Map ───────────────────────────────────────────────

const MODULE_LABELS: Record<ActiveModule, string> = {
  SALURAN: 'Modul Analisis Saluran (Manning)',
  BANJIR: 'Modul Analisis Banjir Rencana',
  NERACA: 'Modul Neraca Air (F.J. Mock)',
  EMBUNG: 'Modul Perencanaan Embung',
  MASTER: 'Modul Data Master Hidrologi',
  HISTORY: 'Riwayat Perhitungan',
  AI: 'Konsultan AI',
  EXEC: 'Laporan Eksekutif',
};

// ─── Hook ───────────────────────────────────────────────────────────

export function useAIContext(activeTab: ActiveModule): AIContextResult {
  // Subscribe to relevant slices of the Zustand store
  const luasDas = useHydrologyStore((s) => s.luasDas);
  const panjangSungai = useHydrologyStore((s) => s.panjangSungai);
  const curahHujanRencana = useHydrologyStore((s) => s.curahHujanRencana);
  const hasilThiessen = useHydrologyStore((s) => s.hasilThiessen);
  const hasilARF = useHydrologyStore((s) => s.hasilARF);
  const hasilAnalisisFrekuensi = useHydrologyStore((s) => s.hasilAnalisisFrekuensi);
  const hasilBanjir = useHydrologyStore((s) => s.hasilBanjir);
  const hasilKonvolusi = useHydrologyStore((s) => s.hasilKonvolusi);
  const hasilNeraca = useHydrologyStore((s) => s.hasilNeraca);
  const hasilEmbung = useHydrologyStore((s) => s.hasilEmbung);
  const hasilSaluran = useHydrologyStore((s) => s.hasilSaluran);
  const hasilMock = useHydrologyStore((s) => s.hasilMock);
  const neracaFinal = useHydrologyStore((s) => s.neracaFinal);
  const isBanjirDirty = useHydrologyStore((s) => s.isBanjirDirty);
  const isNeracaDirty = useHydrologyStore((s) => s.isNeracaDirty);
  const durasiHujan = useHydrologyStore((s) => s.durasiHujan);
  const distribusiHujanJamJaman = useHydrologyStore((s) => s.distribusiHujanJamJaman);

  return useMemo(() => {
    // ── 1. Build Invisible System Context ──
    const contextParts: string[] = [];

    contextParts.push(`[SYSTEM — Invisible Context for AI]`);
    contextParts.push(`User saat ini berada di: ${MODULE_LABELS[activeTab]}.`);

    // Fundamental parameters
    const areaNum = parseFloat(luasDas);
    const riverNum = parseFloat(panjangSungai);
    const rainNum = parseFloat(curahHujanRencana);

    if (areaNum > 0) contextParts.push(`Luas DAS = ${areaNum} km².`);
    if (riverNum > 0) contextParts.push(`Panjang Sungai Utama = ${riverNum} km.`);
    if (rainNum > 0) contextParts.push(`Curah Hujan Rencana (R₂₄) = ${rainNum} mm.`);

    // Thiessen
    if (hasilThiessen) {
      contextParts.push(`Metode Thiessen: ${hasilThiessen.stasiunConfigs.length} stasiun, Total Luas = ${hasilThiessen.totalLuas} km².`);
    }

    // ARF
    if (hasilARF) {
      contextParts.push(`ARF = ${hasilARF.arfValue.toFixed(3)}, Hujan Titik = ${hasilARF.hujanTitik} mm, Hujan DAS = ${hasilARF.hujanDAS} mm.`);
    }

    // Frequency Analysis
    if (hasilAnalisisFrekuensi) {
      contextParts.push(`Distribusi Terpilih: ${hasilAnalisisFrekuensi.metodeTerpilih}. Lulus Uji: ${hasilAnalisisFrekuensi.lulusUjiKecocokan ? 'YA' : 'TIDAK'}.`);
      if (hasilAnalisisFrekuensi.selectedKalaUlang) {
        const match = hasilAnalisisFrekuensi.curahHujanRencana.find(
          (v) => v.kalaUlang === hasilAnalisisFrekuensi.selectedKalaUlang
        );
        if (match) {
          contextParts.push(`Kala Ulang Terpilih: T=${match.kalaUlang} tahun → R₂₄ = ${match.curahHujan} mm.`);
        }
      }
    }

    // Flood
    if (hasilBanjir) {
      contextParts.push(`Debit Puncak Banjir (Qp) = ${hasilBanjir.debitPuncak.toFixed(2)} m³/s.`);
    }

    // Convolution
    if (hasilKonvolusi) {
      contextParts.push(`Konvolusi DFH: Qp = ${hasilKonvolusi.peakDischarge.toFixed(2)} m³/s, Tp = ${hasilKonvolusi.timeToPeak.toFixed(1)} jam, Volume = ${(hasilKonvolusi.totalVolume / 1000).toFixed(1)} ribu m³.`);
    }

    // Rainfall distribution
    if (distribusiHujanJamJaman && distribusiHujanJamJaman.length > 0) {
      contextParts.push(`Distribusi Jam-jaman (${durasiHujan} jam): [${distribusiHujanJamJaman.map(v => v.toFixed(1)).join(', ')}] mm.`);
    }

    // F.J. Mock
    if (hasilMock) {
      contextParts.push(`F.J. Mock: Metode = ${hasilMock.metode}, Q Andalan = ${hasilMock.qAndalan.toFixed(3)} m³/s (P${hasilMock.probability}%).`);
      const deficitMonths = hasilMock.monthlyResults.filter((m) => m.waterSurplus <= 0);
      if (deficitMonths.length > 0) {
        contextParts.push(`Bulan KERING (WS ≤ 0): ${deficitMonths.map((m) => m.month).join(', ')}.`);
      }
    }

    // Neraca Air
    if (hasilNeraca) {
      contextParts.push(`Neraca Air: ${hasilNeraca.isSurplus ? 'SURPLUS' : 'DEFISIT'} total = ${hasilNeraca.totalSurplusDefisit.toFixed(1)} m³/s. Bulan Kritis = ${hasilNeraca.bulanKritis}.`);
      const deficitData = hasilNeraca.chartData.filter((d) => d.neraca < 0);
      if (deficitData.length > 0) {
        contextParts.push(`Bulan DEFISIT: ${deficitData.map((d) => `${d.bulan} (${d.neraca.toFixed(1)})`).join(', ')}.`);
      }
    }

    // Neraca Final
    if (neracaFinal) {
      const criticalMonths = neracaFinal.filter((r) => r.status === 'Defisit');
      if (criticalMonths.length > 0) {
        contextParts.push(`Neraca Final — ${criticalMonths.length} bulan DEFISIT: ${criticalMonths.map((r) => `${r.month} (${r.neraca.toFixed(2)})`).join(', ')}.`);
      }
    }

    // Embung
    if (hasilEmbung) {
      contextParts.push(`Embung: ${hasilEmbung.isAman ? 'AMAN' : 'TIDAK AMAN'}. Reduksi Puncak = ${hasilEmbung.reduksiPuncak}%. Umur Sedimen = ${hasilEmbung.umurSedimen} tahun.`);
    }

    // Saluran Terbuka
    if (hasilSaluran) {
      contextParts.push(`Saluran: Tipe ${hasilSaluran.shape}, Kapasitas = ${hasilSaluran.dischargeCapacity.toFixed(3)} m³/s, Kecepatan = ${hasilSaluran.velocity.toFixed(2)} m/s, Rezim = ${hasilSaluran.flowRegime} (Fr = ${hasilSaluran.froudeNumber.toFixed(2)}), Status = ${hasilSaluran.isSafe ? 'AMAN' : 'OVERTOPPING'}, Kecepatan = ${hasilSaluran.velocityStatus}.`);
    }

    // Dirty state warnings
    if (isBanjirDirty) {
      contextParts.push(`⚠️ WARNING: Parameter banjir telah diubah tetapi belum di-rekalkulasi (isBanjirDirty = true).`);
    }
    if (isNeracaDirty) {
      contextParts.push(`⚠️ WARNING: Parameter neraca air telah diubah tetapi belum di-rekalkulasi (isNeracaDirty = true).`);
    }

    contextParts.push(`Jawab pertanyaan user berdasarkan data di atas. Jika user bertanya tentang parameter yang belum ada datanya, sarankan user untuk melengkapi input terlebih dahulu.`);

    const systemContext = contextParts.join('\n');

    // ── 2. Build Smart Suggestion Chips ──
    const chips: SuggestionChip[] = [];

    // Dirty state chips
    if (isBanjirDirty) {
      chips.push({
        id: 'dirty-banjir',
        label: 'Kenapa ada peringatan Integritas Data?',
        prompt: 'Saya melihat peringatan integritas data pada modul banjir. Apa yang harus saya lakukan untuk memperbarui hasil perhitungan?',
        severity: 'warning',
        icon: '⚠️',
      });
    }

    if (isNeracaDirty) {
      chips.push({
        id: 'dirty-neraca',
        label: 'Mengapa neraca air saya perlu diperbarui?',
        prompt: 'Parameter neraca air saya telah berubah. Jelaskan dampak perubahan parameter terhadap hasil neraca air dan langkah yang harus saya lakukan.',
        severity: 'warning',
        icon: '🔄',
      });
    }

    // Module-specific chips
    switch (activeTab) {
      case 'BANJIR':
        if (!hasilAnalisisFrekuensi) {
          chips.push({
            id: 'no-freq',
            label: 'Bagaimana cara memilih distribusi frekuensi?',
            prompt: 'Saya belum melakukan analisis frekuensi. Jelaskan cara memilih distribusi yang tepat (Normal, Log Normal, Gumbel, Log Pearson III) sesuai SNI 2415:2016.',
            severity: 'info',
            icon: '📊',
          });
        }
        if (hasilBanjir && hasilBanjir.debitPuncak > 100) {
          chips.push({
            id: 'high-flood',
            label: `Debit puncak ${hasilBanjir.debitPuncak.toFixed(0)} m³/s, apakah wajar?`,
            prompt: `Debit puncak banjir yang saya hitung adalah ${hasilBanjir.debitPuncak.toFixed(2)} m³/s untuk DAS ${luasDas} km². Apakah nilai ini wajar? Bandingkan dengan metode empiris dan berikan rekomendasi.`,
            severity: 'info',
            icon: '🌊',
          });
        }
        if (hasilKonvolusi) {
          chips.push({
            id: 'interpret-dfh',
            label: 'Interpretasi Hidrograf Banjir Rencana',
            prompt: `Interpretasikan hasil konvolusi hidrograf banjir rencana saya: Qp = ${hasilKonvolusi.peakDischarge.toFixed(2)} m³/s, Tp = ${hasilKonvolusi.timeToPeak.toFixed(1)} jam, Volume = ${(hasilKonvolusi.totalVolume / 1000).toFixed(1)} ribu m³. Apa implikasi desainnya?`,
            severity: 'info',
            icon: '📈',
          });
        }
        break;

      case 'NERACA':
        if (hasilNeraca && !hasilNeraca.isSurplus) {
          chips.push({
            id: 'deficit-solution',
            label: `Solusi defisit air bulan ${hasilNeraca.bulanKritis}`,
            prompt: `Neraca air menunjukkan defisit pada bulan ${hasilNeraca.bulanKritis} sebesar ${hasilNeraca.totalSurplusDefisit.toFixed(1)} m³/s. Berikan strategi pengelolaan air untuk mengatasi defisit ini sesuai kaidah rekayasa sumber daya air.`,
            severity: 'critical',
            icon: '🚨',
          });
        }
        if (hasilMock) {
          chips.push({
            id: 'mock-params',
            label: 'Apakah parameter Mock saya sudah optimal?',
            prompt: `Evaluasi parameter F.J. Mock yang saya gunakan: Q Andalan = ${hasilMock.qAndalan.toFixed(3)} m³/s pada P${hasilMock.probability}%. Apakah parameter infiltrasi dan koefisien resesi sudah sesuai untuk kondisi DAS ${luasDas} km²?`,
            severity: 'info',
            icon: '🔧',
          });
        }
        if (neracaFinal) {
          const defCount = neracaFinal.filter((r) => r.status === 'Defisit').length;
          if (defCount > 3) {
            chips.push({
              id: 'many-deficit',
              label: `${defCount} bulan defisit — perlu embung?`,
              prompt: `Neraca air final menunjukkan ${defCount} bulan defisit. Apakah diperlukan pembangunan embung atau waduk untuk menampung air? Berikan analisis kelayakan awal.`,
              severity: 'critical',
              icon: '🏗️',
            });
          }
        }
        break;

      case 'EMBUNG':
        if (hasilEmbung) {
          if (!hasilEmbung.isAman) {
            chips.push({
              id: 'embung-unsafe',
              label: 'Embung tidak aman — apa solusinya?',
              prompt: 'Hasil perhitungan embung menunjukkan status TIDAK AMAN. Apa langkah-langkah yang harus diambil untuk memperbaiki desain embung ini?',
              severity: 'critical',
              icon: '❌',
            });
          }
          chips.push({
            id: 'embung-sediment',
            label: `Umur sedimen ${hasilEmbung.umurSedimen} tahun, cukup?`,
            prompt: `Umur sedimen embung dihitung ${hasilEmbung.umurSedimen} tahun. Apakah ini memadai untuk perencanaan jangka panjang? Berikan rekomendasi pengelolaan sedimen.`,
            severity: 'info',
            icon: '⏳',
          });
        }
        break;

      case 'SALURAN':
        if (hasilSaluran) {
          if (!hasilSaluran.isSafe) {
            chips.push({
              id: 'saluran-unsafe',
              label: 'Saluran overtopping — apa solusinya?',
              prompt: `Kapasitas saluran (${hasilSaluran.dischargeCapacity.toFixed(3)} m³/s) lebih kecil dari debit rencana (${hasilSaluran.designDischarge ? hasilSaluran.designDischarge.toFixed(3) : '?'} m³/s). Apa langkah teknis perbesaran dimensi atau peningkatan kemiringan sesuai SNI 03-3424-1994?`,
              severity: 'critical',
              icon: '❌',
            });
          }
          if (!hasilSaluran.isVelocitySafe) {
            chips.push({
              id: 'saluran-velocity',
              label: `Kecepatan ${hasilSaluran.velocity.toFixed(2)} m/s — ${hasilSaluran.velocityStatus}`,
              prompt: `Aliran saluran terdeteksi ${hasilSaluran.velocityStatus} dengan kecepatan ${hasilSaluran.velocity.toFixed(2)} m/s. Bagaimana rekomendasi proteksi dinding atau penyesuaian kemiringan?`,
              severity: 'warning',
              icon: '⚠️',
            });
          }
        }
        chips.push({
          id: 'manning-froude',
          label: 'Bagaimana mengatasi aliran superkritis?',
          prompt: 'Angka Froude saluran saya > 1 (superkritis). Jelaskan cara meredam energi atau mengubahnya menjadi subkritis dengan mengatur dimensi saluran, kemiringan, atau kolam olak sesuai SNI.',
          severity: 'warning',
          icon: '⚡',
        });
        chips.push({
          id: 'manning-optimal',
          label: 'Dimensi penampang hidrolis terbaik (Best Section)',
          prompt: `Jelaskan kriteria penampang hidrolis terbaik (Best Hydraulic Section) untuk saluran trapesium dan persegi panjang, serta cara menentukan perbandingan b/h optimum.`,
          severity: 'info',
          icon: '📏',
        });
        break;

      case 'MASTER':
        chips.push({
          id: 'data-quality',
          label: 'Tips meningkatkan kualitas data hujan',
          prompt: 'Berikan tips untuk meningkatkan kualitas data curah hujan stasiun untuk analisis frekuensi yang lebih akurat, termasuk cara mendeteksi dan menangani data outlier.',
          severity: 'info',
          icon: '💡',
        });
        break;
    }

    // Generic helpful chips
    if (areaNum > 0 && chips.length < 4) {
      chips.push({
        id: 'das-review',
        label: 'Review parameter DAS saya',
        prompt: `Review parameter DAS saya: Luas = ${luasDas} km², Panjang Sungai = ${panjangSungai} km, Curah Hujan Rencana = ${curahHujanRencana} mm. Apakah parameter ini konsisten dan masuk akal?`,
        severity: 'info',
        icon: '🔍',
      });
    }

    const moduleSummary = MODULE_LABELS[activeTab] || 'Modul Tidak Diketahui';
    const hasIssues = chips.some((c) => c.severity === 'critical' || c.severity === 'warning');

    const dataStatus = [
      { label: 'Morfometri DAS', isLoaded: areaNum > 0 && riverNum > 0 },
      { label: 'Hujan Rencana', isLoaded: rainNum > 0 },
      { label: 'Analisis Frekuensi', isLoaded: !!hasilAnalisisFrekuensi },
      { label: 'Hujan Wilayah (Thiessen)', isLoaded: !!hasilThiessen },
      { label: 'Analisis Banjir (HSS)', isLoaded: !!hasilBanjir },
      { label: 'Neraca Air (Mock)', isLoaded: !!hasilMock },
      { label: 'Desain Embung', isLoaded: !!hasilEmbung },
    ];

    return {
      systemContext,
      suggestionChips: chips.slice(0, 4), // Max 4 chips
      moduleSummary,
      hasIssues,
      dataStatus,
    };
  }, [
    activeTab, luasDas, panjangSungai, curahHujanRencana,
    hasilThiessen, hasilARF, hasilAnalisisFrekuensi,
    hasilBanjir, hasilKonvolusi, hasilNeraca, hasilEmbung,
    hasilMock, neracaFinal, isBanjirDirty, isNeracaDirty,
    durasiHujan, distribusiHujanJamJaman,
  ]);
}
