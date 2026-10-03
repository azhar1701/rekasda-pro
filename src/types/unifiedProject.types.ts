/**
 * =============================================================================
 * Tipe Data Skema Penyimpanan Proyek & Riwayat Terpadu (Unified Storage)
 * RekasDA Pro — Platform Rekayasa Analisis SDA & Hidrologi (SNI Compliant)
 * =============================================================================
 */

import { type HydrologyState } from '@/stores/useHydrologyStore';

export type ProjectStatus = 'DRAFT' | 'FINAL' | 'TERVERIFIKASI' | 'ARSIP';

export interface UnifiedProjectMetadata {
  id: string;
  projectCode: string;
  name: string;
  dasName: string;
  riverName?: string;
  province?: string;
  regency?: string;
  author: string;
  institution: string;
  latitude?: number | null;
  longitude?: number | null;
  status: ProjectStatus;
  schemaVersion: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedCalculationSnapshot {
  id: string;
  projectId: string;
  moduleType: 'manning' | 'flood' | 'water_balance' | 'embung' | 'frequency';
  snapshotTitle: string;
  scenarioName: string;
  inputParameters: any;
  outputResults: any;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
  photoUrl?: string | null;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

export interface UnifiedProjectEntity {
  metadata: UnifiedProjectMetadata;
  masterData: {
    identitasLokasi: HydrologyState['identitasLokasi'];
    morfometriDAS: HydrologyState['morfometriDAS'];
    tutupanLahan: HydrologyState['tutupanLahan'];
    stasiunList: HydrologyState['stasiunList'];
    curahHujanWilayah: HydrologyState['curahHujanWilayah'];
    activeRainfallSource: HydrologyState['activeRainfallSource'];
    dataHujan: HydrologyState['dataHujan'];
    arealRainfallAlgebraic?: HydrologyState['arealRainfallAlgebraic'];
    arealRainfallThiessen?: HydrologyState['arealRainfallThiessen'];
    arealRainfallIsohyet?: HydrologyState['arealRainfallIsohyet'];
  };
  analysisResults: {
    analisisFrekuensi?: HydrologyState['analisisFrekuensi'];
    curahHujanRencana?: HydrologyState['curahHujanRencana'];
    hasilARF?: HydrologyState['hasilARF'];
    distribusiHujanJamJaman?: HydrologyState['distribusiHujanJamJaman'];
    durasiHujan?: HydrologyState['durasiHujan'];
    hujanEfektif?: HydrologyState['hujanEfektif'];
    hasilBanjir?: HydrologyState['hasilBanjir'];
    hasilBanjirEmpiris?: HydrologyState['hasilBanjirEmpiris'];
    hasilBanjirHSS?: HydrologyState['hasilBanjirHSS'];
    hasilKonvolusi?: HydrologyState['hasilKonvolusi'];
    hasilNeraca?: HydrologyState['hasilNeraca'];
    hasilMock?: HydrologyState['hasilMock'];
    neracaFinal?: HydrologyState['neracaFinal'];
    hasilEmbung?: HydrologyState['hasilEmbung'];
    hasilSaluran?: HydrologyState['hasilSaluran'];
    qcResults?: HydrologyState['qcResults'];
    qcStatus?: HydrologyState['qcStatus'];
  };
  summaryMetrics?: {
    totalStations: number;
    totalDailyRecords: number;
    primaryQPeak?: number | null;
    waterBalanceStatus?: string | null;
  };
  snapshots: UnifiedCalculationSnapshot[];
}
