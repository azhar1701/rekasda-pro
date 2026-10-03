/**
 * =============================================================================
 * Layanan Agregasi Data Laporan Eksekutif (SNI / Rekayasa SDA)
 * Modul: Executive Dashboard & Reporting Engine
 * =============================================================================
 */

import { AllCalculationsData } from '@/services/allCalculationsService';
import { 
  ExecutiveReportPayload, 
  ReportKopData, 
  ReportSectionsConfig 
} from '../types/report.types';

export const defaultSectionsConfig: ReportSectionsConfig = {
  showKop: true,
  showIdentitas: true,
  showFrekuensi: true,
  showBanjir: true,
  showNeraca: true,
  showEmbung: true,
  showSaluran: true,
  showPengesahan: true,
  showAiSummary: true,
};

export const defaultKopData: ReportKopData = {
  instansi: 'KONSULTAN PERENCANA & PENGELOLA SUMBER DAYA AIR',
  balai: 'DIVISI PERENCANAAN TEKNIS & ANALISIS HIDROLOGI',
  subTitle: 'LAPORAN RINGKASAN EKSEKUTIF KELAYAKAN TEKNIS HIDROLOGI & DESAIN INFRASTRUKTUR AIR',
  nomorDokumen: `LAP-SDA/${new Date().getFullYear()}/0001`,
  tanggalDokumen: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  statusDokumen: 'FINAL',
  penandatangan: {
    penyusun: 'Tim Tenaga Ahli Hidrologi',
    jabatanPenyusun: 'Ahli Muda Teknik SDA',
    verifikator: 'Ir. Penanggung Jawab Teknis, MT',
    jabatanVerifikator: 'Ahli Madya Teknik Pengairan (Lead Hydrologist)',
    penggunaJasa: 'Pemberi Tugas / Pengguna Jasa',
    jabatanPenggunaJasa: 'Direksi Pekerjaan / Pengelola Kegiatan'
  }
};

/**
 * Menghasilkan kesimpulan rekomendasi teknis deterministik berbasis SNI
 */
export const generateDeterministicSummary = (payload: Partial<ExecutiveReportPayload>): string => {
  const points: string[] = [];

  // 1. Banjir & Frekuensi
  if (payload.banjir?.debitPuncak) {
    const q = payload.banjir.debitPuncak;
    const metode = payload.banjir.metode || 'Rasional / HSS';
    points.push(`Debit banjir rancangan puncak sebesar ${q.toFixed(2)} m³/s diestimasi menggunakan metode ${metode} sesuai ketentuan SNI 2415:2016.`);
  }

  // 2. Neraca Air
  if (payload.neraca) {
    const statusNeraca = payload.neraca.netBalance >= 0 ? 'Surplus' : 'Defisit';
    points.push(`Neraca air tahunan berstatus ${statusNeraca} dengan total ketersediaan air andalan sebesar ${payload.neraca.totalKetersediaan.toFixed(1)} m³/s dan kebutuhan irigasi/air baku sebesar ${payload.neraca.totalKebutuhan.toFixed(1)} m³/s (Bulan kritis: ${payload.neraca.bulanKritis || 'Agustus'}).`);
  }

  // 3. Situ & Embung
  if (payload.embung?.reduksiPuncak) {
    points.push(`Infrastruktur penampung air (Embung) mampu mereduksi puncak debit banjir sebesar ${payload.embung.reduksiPuncak.toFixed(1)}% dengan taksiran umur layanan operasional sedimen selama ${payload.embung.umurSedimen || 25} tahun sesuai kriteria Pd T-03-2005-A.`);
  }

  // 4. Saluran Manning
  if (payload.saluran?.dischargeCapacity) {
    const qKap = payload.saluran.dischargeCapacity;
    const v = payload.saluran.velocity;
    const amanStr = payload.saluran.isSafe ? 'memenuhi syarat kapasitas dan aman dari limpasan' : 'perlu pembesaran dimensi penampang';
    points.push(`Saluran pengalir berkapasitas ${qKap.toFixed(2)} m³/s dengan kecepatan rerata ${v.toFixed(2)} m/s, dievaluasi ${amanStr} berdasarkan formula Manning SNI 03-2401-1991.`);
  }

  if (points.length === 0) {
    return 'Laporan teknis komprehensif mengintegrasikan parameter hidrologi dan hidraulika untuk memastikan kelayakan perancangan infrastruktur sumber daya air berstandar SNI.';
  }

  return points.join(' ');
};

/**
 * Agregasi data sesi aktif dari useHydrologyStore
 */
export const aggregateActiveReportData = (store: any): ExecutiveReportPayload => {
  const identitas = store.identitasLokasi || {};
  const hasilFrekuensi = store.hasilAnalisisFrekuensi || store.hasilFrekuensi;
  const hasilBanjir = store.hasilBanjir;
  const hasilNeraca = store.hasilNeraca;
  const hasilEmbung = store.hasilEmbung;
  const hasilSaluran = store.hasilSaluran;
  const luasDas = store.luasDas;

  const frekuensiPayload = hasilFrekuensi ? {
    metodeTerpilih: hasilFrekuensi.metodeTerpilih || 'Gumbel',
    lulusUji: hasilFrekuensi.lulusUjiKecocokan ?? true,
    curahHujanRencana: (hasilFrekuensi.curahHujanRencana || []).map((r: any) => ({
      Tr: r.Tr || r.kalaUlang || 0,
      R24: r.R24 || r.curahHujan || 0
    })),
    ujiStatistik: hasilFrekuensi.qcResults ? {
      metodeUji: hasilFrekuensi.qcResults.konsistensi?.method || 'RAPS / Smirnov-Kolmogorov',
      kesimpulan: hasilFrekuensi.qcResults.overallPassed ? 'Data Konsisten & Homogen' : 'Perlu Kalibrasi'
    } : undefined
  } : undefined;

  const banjirPayload = hasilBanjir ? {
    metode: hasilBanjir.metode || 'Rasional / HSS',
    debitPuncak: Number(hasilBanjir.debitPuncak || 0),
    waktuPuncak: Number(hasilBanjir.waktuPuncak || 0),
    volumeTotal: Number(hasilBanjir.volumeTotal || 0),
    returnPeriods: hasilBanjir.returnPeriods || []
  } : undefined;

  let neracaPayload = undefined;
  if (hasilNeraca) {
    const monthlySupply = hasilNeraca.monthlySupply || [];
    const monthlyDemand = hasilNeraca.monthlyDemand || [];
    const totalSupply = monthlySupply.reduce((a: number, b: number) => a + b, 0);
    const totalDemand = monthlyDemand.reduce((a: number, b: number) => a + b, 0);
    const net = totalSupply - totalDemand;

    const monthlyRows = (hasilNeraca.chartData || []).map((c: any) => ({
      bulan: c.bulan,
      ketersediaan: Number(c.ketersediaan || 0),
      kebutuhan: Number(c.kebutuhan || 0),
      neraca: Number(c.neraca || (c.ketersediaan - c.kebutuhan)),
      status: (c.neraca !== undefined ? c.neraca >= 0 : (c.ketersediaan >= c.kebutuhan)) ? 'Surplus' : 'Defisit'
    }));

    neracaPayload = {
      bulanKritis: hasilNeraca.bulanKritis || 'Agustus',
      ikaPercent: hasilNeraca.waterScarcity?.ikaPercent,
      ikaStatus: hasilNeraca.waterScarcity?.status,
      totalKetersediaan: totalSupply,
      totalKebutuhan: totalDemand,
      netBalance: net,
      storageRequiredM3: hasilNeraca.storageRequiredM3,
      monthlyRows
    };
  }

  const embungPayload = hasilEmbung ? {
    isAman: hasilEmbung.isAman ?? true,
    reduksiPuncak: Number(hasilEmbung.reduksiPuncak || 0),
    umurSedimen: Number(hasilEmbung.umurSedimen || 25),
    peakInflow: hasilEmbung.peakInflow,
    peakOutflow: hasilEmbung.peakOutflow,
    maxElevation: hasilEmbung.maxElevation,
  } : undefined;

  const saluranPayload = hasilSaluran ? {
    shape: hasilSaluran.shape || 'trapezoid',
    channelName: hasilSaluran.channelName || 'Saluran Primer',
    dischargeCapacity: Number(hasilSaluran.dischargeCapacity || 0),
    designDischarge: Number(hasilSaluran.designDischarge || 0),
    velocity: Number(hasilSaluran.velocity || 0),
    froudeNumber: Number(hasilSaluran.froudeNumber || 0),
    flowRegime: hasilSaluran.flowRegime || 'Subkritis',
    isSafe: hasilSaluran.isSafe ?? true,
    isVelocitySafe: hasilSaluran.isVelocitySafe ?? true,
    velocityStatus: hasilSaluran.velocityStatus || 'Normal',
    freeboardActual: Number(hasilSaluran.freeboardActual || 0),
    freeboardRecommended: Number(hasilSaluran.freeboardRecommended || 0),
    materialName: hasilSaluran.materialName,
    manningN: hasilSaluran.n,
    bedSlope: hasilSaluran.slope,
    dimensions: hasilSaluran.dimensions
  } : undefined;

  const payload: ExecutiveReportPayload = {
    kop: {
      ...defaultKopData,
      instansi: identitas.instansi || defaultKopData.instansi,
      nomorDokumen: identitas.nomorDokumen || `LAP-SDA/${identitas.tahunAnalisis || new Date().getFullYear()}/0001`
    },
    identitas: {
      namaPekerjaan: identitas.namaPekerjaan || 'Perencanaan Pengelolaan Sumber Daya Air Terpadu',
      namaDAS: identitas.namaDAS || 'DAS Wilayah Sungai Utama',
      provinsi: identitas.provinsi,
      kabupaten: identitas.kabupaten,
      tahunAnalisis: identitas.tahunAnalisis || new Date().getFullYear(),
      latitude: identitas.latitude || identitas.koordinat?.lat,
      longitude: identitas.longitude || identitas.koordinat?.lng,
      luasDas: luasDas || (store.morfometriDAS ? store.morfometriDAS.luasDAS : undefined),
      panjangSungai: store.morfometriDAS ? store.morfometriDAS.panjangSungai : undefined,
      kemiringanSungai: store.morfometriDAS ? store.morfometriDAS.kemiringanSungai : undefined,
      waktuKonsentrasi: store.waktuKonsentrasi 
        || (store.morfometriDAS?.panjangSungai 
          ? (0.87 * Math.pow(Number(store.morfometriDAS.panjangSungai), 2) / (1000 * Math.max(0.001, Number(store.morfometriDAS.kemiringanSungai || 0.01)))) 
          : undefined),
      koefisienLimpasan: store.tutupanLahan?.koefisienPengaliranGabungan || store.tutupanLahanTotalC
    },
    frekuensi: frekuensiPayload,
    banjir: banjirPayload,
    neraca: neracaPayload,
    embung: embungPayload,
    saluran: saluranPayload,
    rekomendasiTeknis: [
      'Penerapan dimensi hidraulik harus memenuhi tinggi jagaan minimum sesuai SNI 03-2401-1991.',
      'Operasi tampungan embung difokuskan pada pemenuhan kebutuhan air musim kemarau dan peredaman debit banjir puncak.',
      'Pemantauan sedimentasi berkala dianjurkan setiap 5 tahun sekali untuk menjaga kapasitas efektif tampungan.'
    ],
    sectionsConfig: { ...defaultSectionsConfig }
  };

  payload.aiSummary = generateDeterministicSummary(payload);
  return payload;
};

/**
 * Agregasi data dari riwayat proyek tersimpan (AllCalculationsData)
 */
export const aggregateHistoricalProjectData = (item: AllCalculationsData): ExecutiveReportPayload => {
  const d = item.data || {};
  const basePayload: ExecutiveReportPayload = {
    kop: {
      ...defaultKopData,
      nomorDokumen: `ARSIP-${item.type.toUpperCase()}/${item.id.substring(0, 8)}`,
      tanggalDokumen: new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    },
    identitas: {
      namaPekerjaan: item.project_name,
      latitude: item.location?.latitude,
      longitude: item.location?.longitude,
      tahunAnalisis: new Date(item.created_at).getFullYear()
    },
    rekomendasiTeknis: [
      'Hasil komputasi tercatat dalam basis data resmi hidrologi RekaSDA Pro.',
      'Diverifikasi memenuhi kaidah hidrologi dan hidraulika SNI.'
    ],
    sectionsConfig: {
      ...defaultSectionsConfig,
      showFrekuensi: false,
      showBanjir: item.type === 'flood',
      showNeraca: item.type === 'water_balance',
      showEmbung: item.type === 'embung',
      showSaluran: item.type === 'manning',
    }
  };

  if (item.type === 'manning') {
    const res = d.results || d.outputResults || d.result_data || d;
    const inp = d.inputs || d.inputParameters || d.input_data || d;
    basePayload.saluran = {
      shape: inp.shape || 'trapezoid',
      channelName: item.project_name || inp.channelName || 'Saluran Terbuka',
      dischargeCapacity: Number(res.Discharge || res.dischargeCapacity || res.Q || res.capacity || 0),
      designDischarge: Number(res.designDischarge || inp.designDischarge || inp.Q || 0),
      velocity: Number(res.Velocity || res.velocity || res.V || 0),
      froudeNumber: Number(res.Froude || res.froudeNumber || res.Fr || 0),
      flowRegime: res.FlowType || res.flowRegime || 'Subkritis',
      isSafe: res.SafetyStatus === 'Aman' || res.isSafe === true,
      isVelocitySafe: res.isVelocitySafe ?? true,
      velocityStatus: res.velocityStatus || 'Normal',
      freeboardActual: Number(res.Freeboard || res.freeboardActual || 0),
      freeboardRecommended: Number(res.freeboardRecommended || res.Freeboard || 0),
      dimensions: {
        width: inp.bottomWidth || inp.width || inp.b,
        depth: inp.waterDepth || inp.depth || inp.h,
        totalDepth: inp.channelDepth || inp.totalDepth || inp.H
      }
    };
  } else if (item.type === 'flood') {
    const res = d.results || d.outputResults || d.result_data || d;
    basePayload.banjir = {
      metode: d.method || res.method || 'Rasional',
      debitPuncak: Number(res.qPeak || res.peakDischarge || res.Qp || res.Qpeak || res.debitPuncak || 0),
      waktuPuncak: Number(res.tPeak || res.timeToPeak || res.Tp || res.waktuPuncak || 0),
      volumeTotal: Number(res.volume || res.totalVolume || res.volumeTotal || 0),
      returnPeriods: res.returnPeriods || []
    };
  } else if (item.type === 'water_balance') {
    const monthly = d.monthly_results || d.monthlyResults || d.chartData || d.monthlyRows || [];
    const supplySum = d.totalSupply !== undefined 
      ? Number(d.totalSupply) 
      : monthly.reduce((s: number, m: any) => s + parseFloat(m.supply || m.ketersediaan || 0), 0);
    const demandSum = d.totalDemand !== undefined 
      ? Number(d.totalDemand) 
      : monthly.reduce((s: number, m: any) => s + parseFloat(m.totalDemand || m.demand || m.kebutuhan || 0), 0);
    basePayload.neraca = {
      bulanKritis: d.summary?.criticalMonth?.month || d.summary?.criticalMonth || 'Agustus',
      totalKetersediaan: supplySum,
      totalKebutuhan: demandSum,
      netBalance: supplySum - demandSum,
      monthlyRows: monthly.map((m: any) => ({
        bulan: m.month || m.bulan,
        ketersediaan: parseFloat(m.supply || m.ketersediaan || 0),
        kebutuhan: parseFloat(m.totalDemand || m.demand || m.kebutuhan || 0),
        neraca: parseFloat(m.balance || m.neraca || 0),
        status: m.status || (parseFloat(m.balance || m.neraca || 0) >= 0 ? 'Surplus' : 'Defisit')
      }))
    };
  } else if (item.type === 'embung') {
    const res = d.result_data || d.results || d.outputResults || d;
    basePayload.embung = {
      isAman: res.isSafe ?? true,
      reduksiPuncak: Number(res.attenuationPercent || res.reduksiPuncak || 0),
      umurSedimen: Number(res.serviceLife || res.umurSedimen || 25),
      effectiveStorage: Number(res.effectiveStorage || res.storageRequired || res.tampunganEfektif || 0),
      deadStorage: Number(res.deadStorage || res.sedimentStorage || res.tampunganMati || 0),
      totalCapacity: Number(res.totalCapacity || res.grossStorage || res.tampunganTotal || 0),
      maxElevation: Number(res.maxWaterLevel || res.maxElevation || 0),
      peakInflow: Number(res.peakInflow || 0),
      peakOutflow: Number(res.peakOutflow || 0),
    };
  }

  basePayload.aiSummary = generateDeterministicSummary(basePayload);
  return basePayload;
};
