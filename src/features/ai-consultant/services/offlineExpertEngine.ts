/**
 * =============================================================================
 * Offline Hydrology Expert Engine (SNI Compliant Fallback)
 * =============================================================================
 * Berjalan 100% offline di browser saat koneksi internet terputus
 * atau layanan Edge Function AI Gemini sedang tidak dapat dijangkau.
 * =============================================================================
 */

export interface OfflineAuditResult {
  title: string;
  markdownAnswer: string;
  suggestedActions?: {
    label: string;
    description: string;
    paramKey: string;
    suggestedValue: any;
  }[];
}

export function generateOfflineExpertAnalysis(query: string, storeState: any): OfflineAuditResult {
  const qLower = query.toLowerCase();
  const areaNum = parseFloat(storeState.luasDas || '0');
  const riverNum = parseFloat(storeState.panjangSungai || '0');
  const rainNum = parseFloat(storeState.curahHujanRencana || '0');
  const hasilSaluran = storeState.hasilSaluran;
  const hasilBanjir = storeState.hasilBanjir;
  const hasilNeraca = storeState.hasilNeraca;
  const hasilEmbung = storeState.hasilEmbung;
  const hasilFrekuensi = storeState.hasilAnalisisFrekuensi;

  const sections: string[] = [];
  const suggestedActions: OfflineAuditResult['suggestedActions'] = [];

  sections.push(`> [!NOTE]\n> **Mode Offline Ahli Hidrologi SNI Diaktifkan**\n> Analisis teknis disusun secara deterministik oleh Engine Aturan Hidrologi RekaSDA Pro berdasarkan parameter aktif Anda.`);

  // 1. EVALUASI BANJIR / RATIONAL / HSS
  if (qLower.includes('banjir') || qLower.includes('debit') || qLower.includes('rasional') || qLower.includes('hss') || qLower.includes('qp') || areaNum > 0) {
    sections.push(`### 1. Evaluasi Debit Banjir Rencana (SNI 2415:2016)`);
    
    if (areaNum > 3.0) {
      sections.push(`- **Batasan Luas DAS**: Luas DAS terdata **${areaNum} km² (${(areaNum * 100).toFixed(0)} ha)**. Sesuai ketentuan **SNI 2415:2016 Pasal 5.1**, Metode Rasional **hanya diperkenankan untuk DAS $\\le 300$ ha ($3\\text{ km}^2$)**.`);
      sections.push(`- **Rekomendasi Ahli**: Wajib menggunakan **Hidrograf Satuan Sintetis (HSS Nakayasu / SCS-CN / Snyder)** untuk pemodelan debit banjir puncak pada DAS ini.`);
    } else if (areaNum > 0 && areaNum <= 3.0) {
      sections.push(`- **Batasan Luas DAS**: Luas DAS sebesar **${areaNum} km² (${(areaNum * 100).toFixed(0)} ha)** berada dalam batas aman untuk penerapan Metode Rasional ($Q = 0.278 \\cdot C \\cdot I \\cdot A$).`);
    }

    if (hasilBanjir) {
      const qPeak = Number(hasilBanjir.debitPuncak || 0);
      sections.push(`- **Debit Puncak Terhitung**: $Q_{peak} = ${qPeak.toFixed(2)}\\text{ m}^3/\\text{s}$ (Waktu puncak: ${Number(hasilBanjir.waktuPuncak || 0).toFixed(1)} jam).`);
      if (areaNum > 0) {
        const specificQ = qPeak / areaNum;
        sections.push(`- **Debit Spesifik ($q$)**: $q = ${specificQ.toFixed(2)}\\text{ m}^3/\\text{s/km}^2$. Nilai wajar debit spesifik di wilayah tropis Indonesia umumnya berkisar antara $2.0 - 15.0\\text{ m}^3/\\text{s/km}^2$ tergantung morfometri DAS.`);
      }
    }

    if (rainNum > 0) {
      sections.push(`- **Curah Hujan Rancangan**: $R_{24} = ${rainNum}\\text{ mm}$${hasilFrekuensi ? ` (Distribusi: **${hasilFrekuensi.metodeTerpilih}**)` : ''}.`);
    }

    if (riverNum > 0) {
      sections.push(`- **Panjang Alur Utama**: $L = ${riverNum}\\text{ km}$.`);
    }
  }

  // 2. EVALUASI SALURAN TERBUKA (MANNING / HIDRAULIKA)
  if (qLower.includes('saluran') || qLower.includes('manning') || qLower.includes('kecepatan') || qLower.includes('froude') || qLower.includes('jagaan') || hasilSaluran) {
    sections.push(`### 2. Evaluasi Hidraulik Saluran Terbuka (SNI 03-2401-1991)`);
    
    if (hasilSaluran) {
      const v = hasilSaluran.velocity;
      const fr = hasilSaluran.froudeNumber;
      const qKap = hasilSaluran.dischargeCapacity;
      const freeboardAct = hasilSaluran.freeboardActual;
      const freeboardRec = hasilSaluran.freeboardRecommended;

      sections.push(`- **Kapasitas vs Rencana**: Kapasitas pengaliran $Q_{kap} = ${qKap.toFixed(2)}\\text{ m}^3/\\text{s}$ (Bentuk: **${hasilSaluran.shape}**). Status: **${hasilSaluran.isSafe ? 'Kapasitas Memadai' : 'Rawan Limpasan / Kurang'}**.`);
      
      // Kecepatan
      if (v < 0.6) {
        sections.push(`- **Bahaya Sedimentasi**: Kecepatan aliran $V = ${v.toFixed(2)}\\text{ m/s} < 0.60\\text{ m/s}$ (Batas self-cleansing velocity). Saluran rentan terhadap endapan lumpur.`);
      } else if (v > 2.0 && hasilSaluran.materialName?.toLowerCase().includes('tanah')) {
        sections.push(`- **Bahaya Gerusan (Scouring)**: Kecepatan aliran $V = ${v.toFixed(2)}\\text{ m/s}$ melebihi batas tahanan gesek saluran tanah ($1.5\\text{ m/s}$). Diperlukan perkuatan tebing (lining batu kali atau beton).`);
      } else {
        sections.push(`- **Kecepatan Aliran**: $V = ${v.toFixed(2)}\\text{ m/s}$ berada dalam batas aman kestabilan alur.`);
      }

      // Rejim Aliran (Froude)
      if (fr >= 1.0) {
        sections.push(`- **Rejim Aliran Superkritis ($Fr = ${fr.toFixed(2)} \\ge 1.0$)**: Aliran sangat cepat dan rentan menimbulkan loncatan hidraulis (*hydraulic jump*). Disarankan memperlandai kemiringan alur atau memperlebar penampang.`);
      } else {
        sections.push(`- **Rejim Aliran Subkritis ($Fr = ${fr.toFixed(2)} < 1.0$)**: Karakteristik aliran tenang dan stabil sesuai kriteria saluran irigasi & drainase primer.`);
      }

      // Tinggi Jagaan
      if (freeboardAct < freeboardRec) {
        sections.push(`- **Peringatan Tinggi Jagaan**: Tinggi jagaan aktual (${freeboardAct.toFixed(2)} m) lebih kecil dari rekomendasi SNI (${freeboardRec.toFixed(2)} m).`);
      } else {
        sections.push(`- **Tinggi Jagaan**: Jagaan aktual (${freeboardAct.toFixed(2)} m) memenuhi standar keselamatan limpasan.`);
      }
    } else {
      sections.push(`- Parameter saluran belum diinput. Buka modul Saluran untuk menghitung debit Manning.`);
    }
  }

  // 3. EVALUASI NERACA AIR & KETERSEDIAAN (SNI 19-6728.1-2002)
  if (qLower.includes('neraca') || qLower.includes('andalan') || qLower.includes('defisit') || qLower.includes('kritis') || qLower.includes('irigasi') || hasilNeraca) {
    sections.push(`### 3. Evaluasi Neraca Air Wilayah (SNI 19-6728.1-2002)`);

    if (hasilNeraca) {
      sections.push(`- **Status Neraca**: Total ${hasilNeraca.isSurplus ? 'SURPLUS' : 'DEFISIT'} dengan neraca bersih sebesar **${hasilNeraca.totalSurplusDefisit.toFixed(1)} m³/s**.`);
      sections.push(`- **Bulan Kritis**: Terjadi pada bulan **${hasilNeraca.bulanKritis || 'Agustus'}**.`);
      if (hasilNeraca.waterScarcity) {
        sections.push(`- **Indeks Kerapuhan Air (IKA)**: ${hasilNeraca.waterScarcity.ikaPercent.toFixed(1)}% (${hasilNeraca.waterScarcity.status}).`);
      }
    } else {
      sections.push(`- Data neraca air belum lengkap. Masukkan curah hujan andalan dan kebutuhan air irigasi di modul Neraca.`);
    }
  }

  // 4. EVALUASI SITU & EMBUNG (Pd T-03-2005-A)
  if (qLower.includes('embung') || qLower.includes('waduk') || qLower.includes('tampungan') || qLower.includes('sedimen') || hasilEmbung) {
    sections.push(`### 4. Evaluasi Situ & Embung (Pd T-03-2005-A)`);

    if (hasilEmbung) {
      sections.push(`- **Efektivitas Reduksi Banjir**: Meredam debit puncak sebesar **${hasilEmbung.reduksiPuncak.toFixed(1)}%**.`);
      sections.push(`- **Taksiran Umur Layanan Sedimen**: **${hasilEmbung.umurSedimen} tahun** (Standar minimum operasional Pd T-03-2005-A adalah 20–25 tahun).`);
      sections.push(`- **Status Keamanan**: **${hasilEmbung.isAman ? 'Memenuhi Syarat' : 'Perlu Evaluasi Elevasi Pelimpah'}**.`);
    } else {
      sections.push(`- Data embung belum diproses. Buka modul Embung untuk analisis kapasitas dan penelusuran banjir.`);
    }
  }

  // Rekomendasi Umum jika pertanyaan tidak spesifik
  if (sections.length <= 1) {
    sections.push(`### Ringkasan Teknis Umum`);
    sections.push(`Sistem hidrologi RekaSDA Pro mengadopsi integrasi bertingkat:`);
    sections.push(`1. **Hulu**: Analisis Frekuensi ($R_{24}$) & Penentuan Debit Banjir Rancangan ($Q_{peak}$).`);
    sections.push(`2. **Tengah**: Penampungan & Retensi (Situ/Embung) serta Neraca Air Wilayah.`);
    sections.push(`3. **Hilir**: Pengaliran aman melalui Saluran Terbuka Manning.`);
    sections.push(`Silakan ajukan pertanyaan spesifik seperti: *"Apakah debit puncak banjir saya wajar?"*, *"Bagaimana status keamanan saluran saya?"*, atau *"Jelaskan hasil neraca air"*.`);
  }

  return {
    title: 'Audit Ahli Hidrologi SNI (Offline Expert Engine)',
    markdownAnswer: sections.join('\n\n'),
    suggestedActions
  };
}
