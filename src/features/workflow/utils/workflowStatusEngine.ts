import { HydrologyState } from '@/stores/useHydrologyStore';

export type ModuleId =
  | 'identitas'
  | 'hujan'
  | 'spasial'
  | 'tutupan'
  | 'qc'
  | 'thiessen'
  | 'satelit'
  | 'frekuensi'
  | 'arf'
  | 'distribusi'
  | 'banjir'
  | 'neraca'
  | 'embung'
  | 'saluran'
  | 'dashboard'
  | 'ai'
  | 'ekspor';

export type WorkflowPhase = 'input' | 'pre' | 'engine' | 'module' | 'output';

export type ModuleStatus =
  | 'Selesai'
  | 'Siap Dihitung'
  | 'Siap Diisi'
  | 'Siap Disimulasi'
  | 'Siap Didesain'
  | 'Menunggu Data'
  | 'Tersedia'
  | 'Peringatan';

export type ModuleStatusType = 'success' | 'ready' | 'pending' | 'warning';

export interface ModulePrerequisite {
  name: string;
  isMet: boolean;
}

export interface ModuleWorkflowInfo {
  id: ModuleId;
  label: string;
  shortName: string;
  phase: WorkflowPhase;
  phaseLabel: string;
  order: number;
  status: ModuleStatus;
  statusType: ModuleStatusType;
  metricSummary: string;
  targetTab: string;
  description: string;
  algorithm: string;
  inputs: string[];
  outputs: string[];
  prerequisites: ModulePrerequisite[];
  sniReference?: string;
}

export interface WorkflowProgressSummary {
  totalModules: number;
  completedModules: number;
  readyModules: number;
  pendingModules: number;
  warningModules: number;
  percentage: number;
  nextRecommended: ModuleWorkflowInfo | null;
  phaseProgress: Record<WorkflowPhase, { completed: number; total: number }>;
}

export function getStoredCalculations(): {
  history: any[];
  embung: any[];
} {
  if (typeof window === 'undefined') return { history: [], embung: [] };
  try {
    const history = JSON.parse(localStorage.getItem('hydrofield_history') || '[]');
    const embung = JSON.parse(localStorage.getItem('embung_projects') || '[]');
    return {
      history: Array.isArray(history) ? history : [],
      embung: Array.isArray(embung) ? embung : [],
    };
  } catch {
    return { history: [], embung: [] };
  }
}

export function computeWorkflowStatus(hydroState: HydrologyState): {
  modules: Record<ModuleId, ModuleWorkflowInfo>;
  moduleList: ModuleWorkflowInfo[];
  summary: WorkflowProgressSummary;
} {
  const { history, embung } = getStoredCalculations();
  const hasSavedManning = history.some((item) => item?.type === 'manning');
  const hasSavedFlood = history.some((item) => item?.type === 'flood');
  const hasSavedNeraca = history.some((item) => item?.type === 'neraca');
  const hasSavedEmbung = embung.length > 0;

  // Base metadata definitions
  const definitions: Record<ModuleId, Omit<ModuleWorkflowInfo, 'status' | 'statusType' | 'metricSummary' | 'prerequisites'>> = {
    identitas: {
      id: 'identitas',
      label: 'Identitas Proyek & Lokasi (Form)',
      shortName: 'Identitas Proyek',
      phase: 'input',
      phaseLabel: 'Input Dasar',
      order: 1,
      targetTab: '/master?tab=identitas',
      description: 'Data identitas proyek, nama pekerjaan, dan koordinat wilayah DAS.',
      algorithm: 'Form input terverifikasi → Simpan ke Local Storage & Cloud Supabase',
      inputs: ['Nama Proyek', 'Wilayah Administratif', 'Titik Koordinat'],
      outputs: ['identitasLokasi'],
      sniReference: 'KemenPUPR Pedoman Desain Hidrologi',
    },
    hujan: {
      id: 'hujan',
      label: 'Data Hujan Multi-Sumber (Excel/OCR)',
      shortName: 'Data Curah Hujan',
      phase: 'input',
      phaseLabel: 'Input Dasar',
      order: 2,
      targetTab: '/master?tab=data-hujan',
      description: 'Ingestion data deret waktu hujan via Excel/CSV, Matrix Ingestion, atau AI OCR.',
      algorithm: 'Multi-source ingestion, deduplikasi tanggal, validasi data numerik',
      inputs: ['File Excel/CSV Hujan', 'PDF OCR Scan', 'Input Manual'],
      outputs: ['stasiunList', 'dataHujan'],
      sniReference: 'SNI 2415:2016',
    },
    spasial: {
      id: 'spasial',
      label: 'Karakteristik & Spasial DAS',
      shortName: 'Parameter Spasial',
      phase: 'input',
      phaseLabel: 'Input Dasar',
      order: 3,
      targetTab: '/master?tab=parameter-spasial',
      description: 'Morfometri fisik DAS (Luas A, Panjang Sungai L, Kemiringan S).',
      algorithm: 'Delineasi DEM otomatis / Input morfometri terukur',
      inputs: ['Luas DAS (km²)', 'Panjang Sungai (km)', 'Elevasi & Kemiringan'],
      outputs: ['morfometriDAS'],
      sniReference: 'SNI 2415:2016 Tata Cara Perhitungan Banjir Rencana',
    },
    tutupan: {
      id: 'tutupan',
      label: 'Tutupan Lahan (Parameter C / CN)',
      shortName: 'Tata Guna Lahan',
      phase: 'input',
      phaseLabel: 'Input Dasar',
      order: 4,
      targetTab: '/master?tab=parameter-spasial',
      description: 'Karakteristik pengaliran permukaan, koefisien C runoff terbobot, atau Curve Number.',
      algorithm: 'C_gabungan = Σ(Ci × Ai) / ΣAi',
      inputs: ['Tipe Guna Lahan', 'Luas per Tipe'],
      outputs: ['tutupanLahan', 'landCoverParams'],
      sniReference: 'SNI 2415:2016 Koefisien Pengaliran Runoff',
    },
    qc: {
      id: 'qc',
      label: 'Quality Control (QC Data Hujan)',
      shortName: 'Quality Control Data',
      phase: 'pre',
      phaseLabel: 'Pre-Proses',
      order: 5,
      targetTab: '/master?tab=data-hujan',
      description: 'Uji outlier (Grubbs-Beck), uji konsistensi (RAPS), dan uji homogenitas (F-Test / T-Test).',
      algorithm: 'Grubbs-Beck Outlier, Rescaled Adjusted Partial Sums (RAPS)',
      inputs: ['dataHujan tahunan'],
      outputs: ['qcResults', 'Status Verifikasi Data'],
      sniReference: 'SNI 2415:2016 Bab Uji Kualitas Data Hujan',
    },
    thiessen: {
      id: 'thiessen',
      label: 'Curah Hujan Wilayah (Thiessen)',
      shortName: 'Hujan Wilayah (CHw)',
      phase: 'pre',
      phaseLabel: 'Pre-Proses',
      order: 6,
      targetTab: '/frekuensi',
      description: 'Perhitungan curah hujan rata-rata wilayah menggunakan Polygon Thiessen atau Isohyet.',
      algorithm: 'CHw = Σ (CH_stasiun × Luas_pengaruh) / Luas_total_DAS',
      inputs: ['dataHujan tervalidasi', 'Luas pengaruh stasiun'],
      outputs: ['hasilThiessen', 'curahHujanWilayah'],
      sniReference: 'SNI 2415:2016 Metode Poligon Thiessen',
    },
    satelit: {
      id: 'satelit',
      label: 'Infilling Data (CHIRPS Satelit)',
      shortName: 'Infilling Data CHIRPS',
      phase: 'pre',
      phaseLabel: 'Pre-Proses',
      order: 7,
      targetTab: '/master?tab=data-hujan',
      description: 'Ekstraksi hujan satelit CHIRPS global dan pengisian otomatis data curah hujan yang hilang.',
      algorithm: 'CHIRPS API & Interpolasi Spasial Rekonstruksi Deret Waktu',
      inputs: ['Koordinat DAS', 'Rentang Tahun'],
      outputs: ['dataHujanInfilled'],
      sniReference: 'WMO No. 168 Hydrological Data Infilling',
    },
    frekuensi: {
      id: 'frekuensi',
      label: 'Analisis Frekuensi Curah Hujan',
      shortName: 'Analisis Frekuensi',
      phase: 'engine',
      phaseLabel: 'Mesin Analisis',
      order: 8,
      targetTab: '/frekuensi',
      description: 'Penentuan curah hujan rencana kala ulang Tr (2, 5, 10, 25, 50, 100 tahun) dengan uji kecocokan distribusi.',
      algorithm: 'Gumbel, Log Pearson III, Normal, Log Normal, Uji Chi-Square & Smirnov-Kolmogorov',
      inputs: ['Hujan Maksimum Tahunan (AMS)'],
      outputs: ['hasilAnalisisFrekuensi', 'curahHujanRencana'],
      sniReference: 'SNI 2415:2016 Distribusi Probabilitas Ekstrem',
    },
    arf: {
      id: 'arf',
      label: 'Areal Reduction Factor (ARF)',
      shortName: 'Koreksi ARF Wilayah',
      phase: 'engine',
      phaseLabel: 'Mesin Analisis',
      order: 9,
      targetTab: '/frekuensi',
      description: 'Faktor reduksi luas untuk mengoreksi hujan titik stasiun menjadi hujan wilayah DAS luas.',
      algorithm: 'ARF = 1 - 0.048 × A^0.5 (atau rumus empiris standar SNI)',
      inputs: ['curahHujanRencana', 'morfometriDAS.luasDAS'],
      outputs: ['hasilARF'],
      sniReference: 'SNI 2415:2016 Reduksi Luas Curah Hujan Rencana',
    },
    distribusi: {
      id: 'distribusi',
      label: 'Distribusi Jam-jaman & Hujan Efektif',
      shortName: 'Distribusi Jam-jaman',
      phase: 'engine',
      phaseLabel: 'Mesin Analisis',
      order: 10,
      targetTab: '/banjir',
      description: 'Disagregasi hujan harian ke jam-jaman (Mononobe / Alternating Block Method) dan perhitungan hujan efektif.',
      algorithm: 'Mononobe: Rt = (R24/t) × (t/T)^(2/3), Hujan Efektif = Rt × C',
      inputs: ['hasilARF', 'landCoverParams.C', 'durasiHujan'],
      outputs: ['distribusiHujanJamJaman', 'hujanEfektif'],
      sniReference: 'Metode Mononobe & SNI 2415:2016',
    },
    banjir: {
      id: 'banjir',
      label: 'Banjir Rencana (HSS Terintegrasi)',
      shortName: 'Banjir Rencana HSS',
      phase: 'module',
      phaseLabel: 'Modul Desain',
      order: 11,
      targetTab: '/banjir',
      description: 'Pemodelan hidrograf debit banjir rencana menggunakan HSS Nakayasu, SCS, Snyder, dan Gama I.',
      algorithm: 'Konvolusi Hidrograf Satuan Sintetis: Q(t) = Σ [U(t - τ) × Pe(τ)]',
      inputs: ['hujanEfektif', 'morfometriDAS (A, L, S)'],
      outputs: ['hasilBanjir', 'hssComparisonResults'],
      sniReference: 'SNI 2415:2016 Tata Cara Perhitungan Banjir Rencana',
    },
    neraca: {
      id: 'neraca',
      label: 'Neraca Air (FJ Mock)',
      shortName: 'Neraca Air FJ Mock',
      phase: 'module',
      phaseLabel: 'Modul Desain',
      order: 12,
      targetTab: '/neraca',
      description: 'Simulasi ketersediaan air bulanan metode Dr. F.J. Mock dan analisis surplus/defisit sumber daya air.',
      algorithm: 'Soil Moisture Balance → Ketersediaan Air Bulanan → Debit Andalan Q80%',
      inputs: ['Hujan Bulanan Wilayah', 'Evapotranspirasi Potensial ETo', 'Karakteristik Tanah'],
      outputs: ['hasilMock', 'neracaFinal'],
      sniReference: 'SNI 19-6728.1-2002 Penyusunan Neraca Sumber Daya Air',
    },
    embung: {
      id: 'embung',
      label: 'Perencanaan Embung & Kolam Retensi',
      shortName: 'Perencanaan Embung',
      phase: 'module',
      phaseLabel: 'Modul Desain',
      order: 13,
      targetTab: '/embung',
      description: 'Dimensi tampungan, penelusuran banjir waduk (flood routing), dan desain hidraulik pelimpah embung.',
      algorithm: 'Standard Reservoir Routing (Modified Puls) & Spillway Hydraulic Design',
      inputs: ['Debit Banjir Masuk (Inflow Qp)', 'Karakteristik Tampungan (H-V Curve)', 'Kebutuhan Air'],
      outputs: ['hasilEmbung', 'Kapasitas Tampungan Efektif'],
      sniReference: 'Pedoman Teknis Desain Embung Kecil PUPR',
    },
    saluran: {
      id: 'saluran',
      label: 'Kapasitas Saluran (Manning)',
      shortName: 'Kapasitas Saluran',
      phase: 'module',
      phaseLabel: 'Modul Desain',
      order: 14,
      targetTab: '/saluran',
      description: 'Dimensi hidraulik saluran terbuka, kecepatan aliran, bilangan Froude, dan tinggi jagaan (freeboard).',
      algorithm: 'Manning Formula: Q = (1/n) × A × R^(2/3) × S^(1/2)',
      inputs: ['Debit Rencana Q', 'Kemiringan S', 'Koefisien Kekasaran n', 'Geometri Saluran'],
      outputs: ['hasilSaluran', 'Dimensi Saluran Aman'],
      sniReference: 'Pd T-02-2004-A Saluran Drainase Terbuka',
    },
    dashboard: {
      id: 'dashboard',
      label: 'Dashboard Eksekutif',
      shortName: 'Dashboard Eksekutif',
      phase: 'output',
      phaseLabel: 'Output & Rekomendasi',
      order: 15,
      targetTab: '/exec',
      description: 'Tampilan terintegrasi ringkasan parameter, grafik hidrograf, neraca air, dan status kepatuhan teknis SNI.',
      algorithm: 'Agregasi KPI lintas modul & visualisasi multi-dimensi',
      inputs: ['Seluruh Hasil Perhitungan Modul'],
      outputs: ['Executive Summary KPI'],
      sniReference: 'Standar Pelaporan Teknis Ditjen SDA PUPR',
    },
    ai: {
      id: 'ai',
      label: 'Konsultan AI Hidrologi (Gemini)',
      shortName: 'AI Consultant',
      phase: 'output',
      phaseLabel: 'Output & Rekomendasi',
      order: 16,
      targetTab: '/ai',
      description: 'Konsultan kecerdasan buatan berbasis Gemini dengan aturan heuristik offline SNI untuk review desain hidrologi.',
      algorithm: 'Offline Heuristic Rule Engine + Gemini LLM Technical Advisor',
      inputs: ['State Kalkulasi Aktif', 'Parameter Desain'],
      outputs: ['Rekomendasi Teknis SNI', 'Validasi Batas Aman'],
      sniReference: 'Standar Keamanan Desain Hidraulik Nasional',
    },
    ekspor: {
      id: 'ekspor',
      label: 'Ekspor Laporan (PDF / Excel)',
      shortName: 'Ekspor Dokumen Laporan',
      phase: 'output',
      phaseLabel: 'Output & Rekomendasi',
      order: 17,
      targetTab: '/exec',
      description: 'Penerbitan buku laporan teknis resmi dalam format PDF standar instansi dan lembar kerja spreadsheet Excel.',
      algorithm: 'Client-side PDF compilation (jsPDF/html2canvas) & ExcelJS generator',
      inputs: ['Seluruh data proyek', 'Hasil analisis numerik & grafik'],
      outputs: ['Buku Laporan Teknis PDF', 'Buku Ukur & Lembar Kerja Excel'],
      sniReference: 'Format Laporan Standar Konsultansi SDA',
    },
  };

  const modules: Record<ModuleId, ModuleWorkflowInfo> = {} as any;

  // 1. Identitas
  const isIdentitasDone = Boolean(hydroState.identitasLokasi?.namaPekerjaan);
  modules.identitas = {
    ...definitions.identitas,
    status: isIdentitasDone ? 'Selesai' : 'Siap Diisi',
    statusType: isIdentitasDone ? 'success' : 'ready',
    metricSummary: isIdentitasDone
      ? `${hydroState.identitasLokasi?.namaPekerjaan} ${hydroState.identitasLokasi?.namaDAS ? `(${hydroState.identitasLokasi.namaDAS})` : ''}`
      : 'Form identitas proyek siap diisi',
    prerequisites: [{ name: 'Formulir Identitas & Wilayah', isMet: isIdentitasDone }],
  };

  // 2. Data Hujan
  const rainCount = hydroState.dataHujan?.length || 0;
  const stationCount = hydroState.stasiunList?.length || 0;
  const isHujanDone = rainCount > 0;
  modules.hujan = {
    ...definitions.hujan,
    status: isHujanDone ? 'Selesai' : 'Siap Diisi',
    statusType: isHujanDone ? 'success' : 'ready',
    metricSummary: isHujanDone
      ? `${stationCount} Pos Stasiun, ${rainCount} Baris Data Harian`
      : 'Belum ada data hujan diinputkan',
    prerequisites: [{ name: 'Input Stasiun & Data Harian', isMet: isHujanDone }],
  };

  // 3. Spasial
  const luasDas = hydroState.morfometriDAS?.luasDAS || 0;
  const panjangSungai = hydroState.morfometriDAS?.panjangSungai || 0;
  const isSpasialDone = luasDas > 0;
  modules.spasial = {
    ...definitions.spasial,
    status: isSpasialDone ? 'Selesai' : 'Menunggu Data',
    statusType: isSpasialDone ? 'success' : 'pending',
    metricSummary: isSpasialDone
      ? `A = ${luasDas.toLocaleString('id-ID')} km², L = ${panjangSungai.toLocaleString('id-ID')} km`
      : 'Memerlukan parameter luas & panjang DAS',
    prerequisites: [{ name: 'Luas DAS & Panjang Sungai', isMet: isSpasialDone }],
  };

  // 4. Tutupan Lahan
  const cValue = hydroState.tutupanLahan?.koefisienPengaliranGabungan ?? hydroState.landCoverParams?.C;
  const isTutupanDone = cValue !== undefined && cValue > 0;
  modules.tutupan = {
    ...definitions.tutupan,
    status: isTutupanDone ? 'Selesai' : 'Menunggu Data',
    statusType: isTutupanDone ? 'success' : 'pending',
    metricSummary: isTutupanDone
      ? `Koefisien C Runoff = ${cValue.toFixed(2)}`
      : 'Belum ditentukan koefisien C',
    prerequisites: [{ name: 'Data Guna Lahan / Nilai C', isMet: isTutupanDone }],
  };

  // 5. QC Data
  const hasQcResults = Boolean(hydroState.qcResults || hydroState.isQCOverridden);
  const isQcOverride = Boolean(hydroState.isQCOverridden);
  let qcStatus: ModuleStatus = 'Menunggu Data';
  let qcStatusType: ModuleStatusType = 'pending';
  let qcSummary = 'Memerlukan data hujan untuk diuji';

  if (hasQcResults) {
    if (isQcOverride) {
      qcStatus = 'Selesai';
      qcStatusType = 'success';
      qcSummary = 'QC Disetujui (Override Validasi)';
    } else {
      qcStatus = 'Selesai';
      qcStatusType = 'success';
      qcSummary = 'Uji Konsistensi & Outlier Lulus';
    }
  } else if (isHujanDone) {
    qcStatus = 'Siap Dihitung';
    qcStatusType = 'ready';
    qcSummary = 'Data siap untuk uji kelayakan SNI';
  }

  modules.qc = {
    ...definitions.qc,
    status: qcStatus,
    statusType: qcStatusType,
    metricSummary: qcSummary,
    prerequisites: [
      { name: 'Data Hujan Harian', isMet: isHujanDone },
      { name: 'Uji Kelayakan Data (RAPS/Grubbs)', isMet: hasQcResults },
    ],
  };

  // 6. Thiessen
  const hasThiessen = Boolean(hydroState.hasilThiessen?.stasiunConfigs?.length || hydroState.curahHujanWilayah);
  const isThiessenReady = isHujanDone && (stationCount > 0 || luasDas > 0);
  modules.thiessen = {
    ...definitions.thiessen,
    status: hasThiessen ? 'Selesai' : isThiessenReady ? 'Siap Dihitung' : 'Menunggu Data',
    statusType: hasThiessen ? 'success' : isThiessenReady ? 'ready' : 'pending',
    metricSummary: hasThiessen
      ? `CHw Wilayah Terhitung (${hydroState.hasilThiessen?.stasiunConfigs?.length || 1} Stasiun)`
      : isThiessenReady
      ? 'Siap dihitung poligon bobot Thiessen'
      : 'Menunggu data hujan & stasiun',
    prerequisites: [
      { name: 'Data Hujan Lengkap', isMet: isHujanDone },
      { name: 'Stasiun Pengaruh Wilayah', isMet: stationCount > 0 },
    ],
  };

  // 7. Satelit
  const hasCoordinates = Boolean(hydroState.identitasLokasi?.koordinat?.lat && hydroState.identitasLokasi?.koordinat?.lng);
  modules.satelit = {
    ...definitions.satelit,
    status: isHujanDone ? 'Selesai' : hasCoordinates ? 'Siap Diisi' : 'Menunggu Data',
    statusType: isHujanDone ? 'success' : hasCoordinates ? 'ready' : 'pending',
    metricSummary: isHujanDone
      ? 'Deret waktu hujan telah terisi lengkap'
      : hasCoordinates
      ? 'Koordinat siap untuk ekstraksi satelit CHIRPS'
      : 'Opsional: Menunggu koordinat proyek',
    prerequisites: [{ name: 'Koordinat Geografis DAS', isMet: hasCoordinates }],
  };

  // 8. Frekuensi
  const hasFrekuensi = Boolean(hydroState.hasilAnalisisFrekuensi?.curahHujanRencana?.length || hydroState.analisisFrekuensi?.hasilDistribusi);
  const isFrekuensiReady = hasThiessen || isHujanDone;
  modules.frekuensi = {
    ...definitions.frekuensi,
    status: hasFrekuensi ? 'Selesai' : isFrekuensiReady ? 'Siap Dihitung' : 'Menunggu Data',
    statusType: hasFrekuensi ? 'success' : isFrekuensiReady ? 'ready' : 'pending',
    metricSummary: hasFrekuensi
      ? `Rencana Tr 2-100th (${hydroState.hasilAnalisisFrekuensi?.metodeTerpilih || 'Log Pearson III'})`
      : isFrekuensiReady
      ? 'Siap dihitung distribusi curah hujan rencana'
      : 'Menunggu data curah hujan wilayah',
    prerequisites: [
      { name: 'Curah Hujan Wilayah Maksimum', isMet: isFrekuensiReady },
      { name: 'Uji Distribusi Probabilitas SNI', isMet: hasFrekuensi },
    ],
  };

  // 9. ARF
  const hasARF = Boolean(hydroState.hasilARF);
  const isARFReady = hasFrekuensi && isSpasialDone;
  modules.arf = {
    ...definitions.arf,
    status: hasARF ? 'Selesai' : isARFReady ? 'Siap Dihitung' : 'Menunggu Data',
    statusType: hasARF ? 'success' : isARFReady ? 'ready' : 'pending',
    metricSummary: hasARF
      ? `ARF = ${(hydroState.hasilARF?.arfOverride ?? hydroState.hasilARF?.arfValue ?? 1).toFixed(2)}`
      : isARFReady
      ? 'Siap dihitung faktor reduksi luas DAS'
      : 'Menunggu hujan rencana & luas DAS',
    prerequisites: [
      { name: 'Hujan Rencana Frekuensi', isMet: hasFrekuensi },
      { name: 'Luas DAS Morfometri', isMet: isSpasialDone },
    ],
  };

  // 10. Distribusi Jam-jaman
  const hasDistribusi = Boolean(hydroState.distribusiHujanJamJaman && hydroState.hujanEfektif);
  const isDistribusiReady = (hasARF || hasFrekuensi) && isTutupanDone;
  modules.distribusi = {
    ...definitions.distribusi,
    status: hasDistribusi ? 'Selesai' : isDistribusiReady ? 'Siap Dihitung' : 'Menunggu Data',
    statusType: hasDistribusi ? 'success' : isDistribusiReady ? 'ready' : 'pending',
    metricSummary: hasDistribusi
      ? 'Pola Jam-jaman Mononobe & Hujan Efektif Siap'
      : isDistribusiReady
      ? 'Siap dipecah menjadi pola jam-jaman'
      : 'Menunggu hujan rencana & koefisien C',
    prerequisites: [
      { name: 'Hujan Rencana Terkoreksi', isMet: hasARF || hasFrekuensi },
      { name: 'Koefisien Pengaliran C', isMet: isTutupanDone },
    ],
  };

  // 11. Banjir Rencana
  const hasFloodResult = Boolean(hydroState.hasilBanjir || hydroState.hasilKonvolusi || hasSavedFlood);
  const isFloodReady = (hasDistribusi || hasFrekuensi) && isSpasialDone;
  const floodPeak = hydroState.hasilBanjir?.debitPuncak ?? hydroState.hasilKonvolusi?.peakDischarge;
  modules.banjir = {
    ...definitions.banjir,
    status: hasFloodResult ? 'Selesai' : isFloodReady ? 'Siap Disimulasi' : 'Menunggu Data',
    statusType: hasFloodResult ? 'success' : isFloodReady ? 'ready' : 'pending',
    metricSummary: hasFloodResult
      ? `Qp = ${(floodPeak || 0).toFixed(2)} m³/s (Hidrograf HSS)`
      : isFloodReady
      ? 'Siap simulasi konvolusi hidrograf banjir'
      : 'Menunggu parameter DAS & hujan efektif',
    prerequisites: [
      { name: 'Morfometri DAS (A, L)', isMet: isSpasialDone },
      { name: 'Hujan Efektif / Rencana', isMet: hasDistribusi || hasFrekuensi },
    ],
  };

  // 12. Neraca Air
  const hasNeracaResult = Boolean(hydroState.hasilMock || hydroState.neracaFinal || hasSavedNeraca);
  const isNeracaReady = hasThiessen || isHujanDone;
  const qAndalan = hydroState.hasilMock?.qAndalan;
  modules.neraca = {
    ...definitions.neraca,
    status: hasNeracaResult ? 'Selesai' : isNeracaReady ? 'Siap Disimulasi' : 'Menunggu Data',
    statusType: hasNeracaResult ? 'success' : isNeracaReady ? 'ready' : 'pending',
    metricSummary: hasNeracaResult
      ? `Debit Andalan Q80% = ${(qAndalan ?? 0).toFixed(2)} m³/s`
      : isNeracaReady
      ? 'Siap simulasi neraca air bulanan FJ Mock'
      : 'Menunggu data hujan bulanan',
    prerequisites: [{ name: 'Hujan Bulanan Wilayah', isMet: isNeracaReady }],
  };

  // 13. Embung
  const hasEmbungResult = Boolean(hydroState.hasilEmbung || hasSavedEmbung);
  const isEmbungReady = hasFloodResult || isFloodReady;
  modules.embung = {
    ...definitions.embung,
    status: hasEmbungResult ? 'Selesai' : isEmbungReady ? 'Siap Didesain' : 'Menunggu Data',
    statusType: hasEmbungResult ? 'success' : isEmbungReady ? 'ready' : 'pending',
    metricSummary: hasEmbungResult
      ? 'Dimensi Pelimpah & Volume Tampung Selesai'
      : isEmbungReady
      ? 'Siap desain tampungan & pelimpah embung'
      : 'Menunggu debit banjir rencana',
    prerequisites: [{ name: 'Debit Puncak Banjir Rencana', isMet: hasFloodResult }],
  };

  // 14. Saluran Manning
  const hasChannelResult = Boolean(hydroState.hasilSaluran || hasSavedManning);
  const isChannelReady = hasFloodResult;
  const channelQ = hydroState.hasilSaluran?.dischargeCapacity ?? hydroState.hasilSaluran?.designDischarge;
  modules.saluran = {
    ...definitions.saluran,
    status: hasChannelResult ? 'Selesai' : isChannelReady ? 'Siap Didesain' : 'Siap Diisi',
    statusType: hasChannelResult ? 'success' : isChannelReady ? 'ready' : 'ready',
    metricSummary: hasChannelResult
      ? `Kapasitas Saluran: Q = ${(channelQ ?? 0).toFixed(2)} m³/s (Manning)`
      : isChannelReady
      ? 'Debit banjir siap dialirkan ke desain saluran'
      : 'Siap input dimensi & kemiringan saluran',
    prerequisites: [{ name: 'Debit Rencana / Geometri Saluran', isMet: isChannelReady || true }],
  };

  // 15. Dashboard Eksekutif
  const hasAnyResult = hasFloodResult || hasNeracaResult || hasChannelResult || hasEmbungResult || history.length > 0;
  modules.dashboard = {
    ...definitions.dashboard,
    status: hasAnyResult ? 'Tersedia' : 'Menunggu Data',
    statusType: hasAnyResult ? 'success' : 'pending',
    metricSummary: hasAnyResult
      ? 'Seluruh rekapitulasi analisis siap ditinjau'
      : 'Menunggu minimal 1 hasil analisis modul',
    prerequisites: [{ name: 'Kalkulasi Modul Analisis Selesai', isMet: hasAnyResult }],
  };

  // 16. AI Konsultan
  modules.ai = {
    ...definitions.ai,
    status: 'Tersedia',
    statusType: 'success',
    metricSummary: 'Penasihat cerdas SNI & validasi teknis aktif',
    prerequisites: [{ name: 'Engine Aturan Heuristik & Gemini AI', isMet: true }],
  };

  // 17. Ekspor Laporan
  modules.ekspor = {
    ...definitions.ekspor,
    status: hasAnyResult ? 'Tersedia' : 'Menunggu Data',
    statusType: hasAnyResult ? 'success' : 'pending',
    metricSummary: hasAnyResult
      ? 'Ekspor PDF teknis & Excel buku ukur siap'
      : 'Menunggu hasil kalkulasi modul',
    prerequisites: [{ name: 'Hasil Perhitungan Siap Cetak', isMet: hasAnyResult }],
  };

  const moduleList = Object.values(modules).sort((a, b) => a.order - b.order);

  // Compute overall progress summary
  let completedModules = 0;
  let readyModules = 0;
  let pendingModules = 0;
  let warningModules = 0;

  const phaseProgress: Record<WorkflowPhase, { completed: number; total: number }> = {
    input: { completed: 0, total: 0 },
    pre: { completed: 0, total: 0 },
    engine: { completed: 0, total: 0 },
    module: { completed: 0, total: 0 },
    output: { completed: 0, total: 0 },
  };

  for (const mod of moduleList) {
    phaseProgress[mod.phase].total += 1;
    if (mod.status === 'Selesai' || mod.status === 'Tersedia') {
      completedModules += 1;
      phaseProgress[mod.phase].completed += 1;
    } else if (mod.statusType === 'ready') {
      readyModules += 1;
    } else if (mod.statusType === 'warning') {
      warningModules += 1;
    } else {
      pendingModules += 1;
    }
  }

  const totalModules = moduleList.length;
  const percentage = Math.round((completedModules / totalModules) * 100);

  // Find next recommended module: the first module in order that is 'ready', or needs input
  const nextRecommended =
    moduleList.find((m) => m.statusType === 'ready' && m.status !== 'Selesai' && m.status !== 'Tersedia') ||
    moduleList.find((m) => m.status !== 'Selesai' && m.status !== 'Tersedia') ||
    modules.dashboard;

  return {
    modules,
    moduleList,
    summary: {
      totalModules,
      completedModules,
      readyModules,
      pendingModules,
      warningModules,
      percentage,
      nextRecommended,
      phaseProgress,
    },
  };
}
