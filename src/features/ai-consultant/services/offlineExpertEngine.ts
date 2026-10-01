/**
 * =============================================================================
 * Offline Hydrology Expert Engine (SNI Compliant Knowledge Base)
 * =============================================================================
 * Berjalan 100% lokal di browser secara deterministik dan komprehensif.
 * Melayani konsultasi teori, rumus SNI, panduan desain, dan audit parameter proyek
 * tanpa ketergantungan koneksi server atau API eksternal.
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
  const qLower = (query || '').toLowerCase().trim();
  const areaNum = parseFloat(storeState?.luasDas || '0');
  const riverNum = parseFloat(storeState?.panjangSungai || '0');
  const rainNum = parseFloat(storeState?.curahHujanRencana || '0');
  const hasilSaluran = storeState?.hasilSaluran;
  const hasilBanjir = storeState?.hasilBanjir;
  const hasilNeraca = storeState?.hasilNeraca;
  const hasilEmbung = storeState?.hasilEmbung;
  const hasilFrekuensi = storeState?.hasilAnalisisFrekuensi;
  const hasilMock = storeState?.hasilMock;
  const hasilThiessen = storeState?.hasilThiessen;

  const sections: string[] = [];
  const suggestedActions: OfflineAuditResult['suggestedActions'] = [];

  // Header Note - Professional & Informative
  sections.push(`> [!NOTE]\n> **Pusat Konsultasi Ahli Hidrologi SNI (Engine Standar Nasional)**\n> Konsultasi dijawab langsung oleh Knowledge Engine Rekayasa SDA berbasis Standar Nasional Indonesia (SNI 2415:2016, SNI 03-2401-1991, SNI 19-6728.1-2002, dan Pd T-03-2005-A).`);

  // Detect query intents
  const isGreeting = /^(halo|hai|hi|hello|selamat|assalamu|pagi|siang|sore|malam|bantuan|help|siapa kamu|apa yang bisa)/i.test(qLower);
  const isSaluran = qLower.includes('saluran') || qLower.includes('manning') || qLower.includes('kecepatan') || qLower.includes('froude') || qLower.includes('jagaan') || qLower.includes('penampang') || qLower.includes('kemiringan') || qLower.includes('kekasaran') || qLower.includes('hidraulik');
  const isBanjir = qLower.includes('banjir') || qLower.includes('hss') || qLower.includes('nakayasu') || qLower.includes('snyder') || qLower.includes('scs') || qLower.includes('rasional') || qLower.includes('debit puncak') || qLower.includes('qp') || qLower.includes('waktu konsentrasi') || qLower.includes('tc');
  const isFrekuensi = qLower.includes('frekuensi') || qLower.includes('gumbel') || qLower.includes('log pearson') || qLower.includes('chi-square') || qLower.includes('smirnov') || qLower.includes('kolmogorov') || qLower.includes('kala ulang') || qLower.includes('r24') || qLower.includes('distribusi');
  const isNeraca = qLower.includes('neraca') || qLower.includes('mock') || qLower.includes('andalan') || qLower.includes('infiltrasi') || qLower.includes('evapotranspirasi') || qLower.includes('kebutuhan air') || qLower.includes('defisit') || qLower.includes('surplus') || qLower.includes('ika');
  const isEmbung = qLower.includes('embung') || qLower.includes('situ') || qLower.includes('waduk') || qLower.includes('tampungan') || qLower.includes('sedimen') || qLower.includes('pelimpah') || qLower.includes('spillway');
  const isAudit = qLower.includes('audit') || qLower.includes('cek parameter') || qLower.includes('evaluasi proyek') || qLower.includes('status data') || qLower.includes('ringkasan proyek');

  // ── INTENT 1: GREETING & OVERVIEW ──
  if (isGreeting && !isSaluran && !isBanjir && !isFrekuensi && !isNeraca && !isEmbung && !isAudit) {
    sections.push(`### Selamat Datang di Pusat Konsultasi Ahli Hidrologi RekaSDA Pro!

Saya adalah Asisten Konsultan Utama Rekayasa Sumber Daya Air yang dirancang khusus untuk memandu analisis hidrologi dan hidraulika sesuai kaidah standar teknis Indonesia.

#### Bidang Keahlian yang Dapat Anda Tanyakan:
1. **Analisis Hidrologi & Frekuensi Curah Hujan (SNI 2415:2016)**
   - Pemilihan distribusi curah hujan (Gumbel, Log Pearson III, Normal, Log-Normal).
   - Uji kecocokan *Goodness of Fit* (Chi-Square & Smirnov-Kolmogorov).
   - Presipitasi area metode Poligon Thiessen & koefisien reduksi luas (ARF).
2. **Debit Banjir Rencana & Hidrograf Satuan Sintetis (HSS)**
   - Kriteria batasan Metode Rasional ($A \\le 300\\text{ ha}$) vs HSS Nakayasu, SCS-CN, dan Snyder.
   - Penentuan parameter karakteristik $\\alpha$ Nakayasu dan waktu konsentrasi ($T_c$).
3. **Analisis Hidraulika Saluran Terbuka (SNI 03-2401-1991)**
   - Rumus Manning, Bilangan Froude ($Fr$), kriteria aliran subkritis/superkritis.
   - Kecepatan izin non-silting ($V \\ge 0.6\\text{ m/s}$) dan non-scouring ($V \\le 1.5 - 3.0\\text{ m/s}$).
   - Kriteria penampang hidrolis terbaik (*Best Hydraulic Section*) dan tinggi jagaan (*freeboard*).
4. **Neraca Air Wilayah & Ketersediaan Air (SNI 19-6728.1-2002)**
   - Pemodelan hidrologi bulanan metode F.J. Mock dan penentuan debit andalan ($Q_{80}, Q_{90}$).
   - Evaluasi surplus/defisit bulanan dan Indeks Kerapuhan Air (IKA).
5. **Perencanaan Embung & Kolam Retensi (Pd T-03-2005-A)**
   - Kapasitas tampungan mati (sedimen 20–25 tahun), tampungan efektif, dan peredaman banjir.

*Silakan tanyakan rumus, kriteria desain, atau ketik **"audit proyek"** untuk memeriksa konsistensi parameter aktif Anda.*`);

    return {
      title: 'Konsultan Ahli Hidrologi SNI',
      markdownAnswer: sections.join('\n\n'),
      suggestedActions
    };
  }

  // ── INTENT 2: HIDRAULIKA SALURAN (MANNING & SNI 03-2401-1991) ──
  if (isSaluran) {
    sections.push(`### 1. Standar Hidraulika Saluran Terbuka (SNI 03-2401-1991)

Persamaan Manning untuk pengaliran saluran terbuka:
$$Q = A \\cdot V = \\frac{1}{n} \\cdot A \\cdot R^{2/3} \\cdot S^{1/2}$$

Dimana:
- $Q$ = Debit pengaliran ($\\text{m}^3/\\text{s}$)
- $n$ = Koefisien kekasaran Manning (Saluran tanah: $0.025 - 0.030$; Pasangan batu kali: $0.020 - 0.025$; Beton halus: $0.013 - 0.015$)
- $A$ = Luas penampang basah ($\\text{m}^2$)
- $P$ = Keliling basah ($\\text{m}$), $R = A/P$ (Jari-jari hidrolis)
- $S$ = Kemiringan dasar saluran (*energy slope*)

#### Batasan Kriteria Keamanan SNI:
1. **Kecepatan Izin Aliran ($V$)**:
   - $V_{min} \\ge 0.60\\text{ m/s}$ untuk mencegah pengendapan sedimen (*self-cleansing velocity*).
   - $V_{maks} \\le 1.50\\text{ m/s}$ untuk saluran tanah biasa (mencegah gerusan / *scouring*).
   - $V_{maks} \\le 2.00 - 2.50\\text{ m/s}$ untuk pasangan batu kali (*masonry lining*).
   - $V_{maks} \\le 3.00\\text{ m/s}$ untuk beton bertulang (*reinforced concrete*).
2. **Rejim Aliran & Bilangan Froude ($Fr$)**:
   - Aliran Subkritis ($Fr < 1.0$): Tenang, stabil, direkomendasikan untuk saluran drainase primer & irigasi.
   - Aliran Superkritis ($Fr \\ge 1.0$): Aliran deras dan berisiko timbul loncatan hidraulis (*hydraulic jump*).
3. **Tinggi Jagaan Minimal ($F_b$)**:
   - Sesuai SNI 03-2401-1991: $F_b = \\sqrt{c \\cdot y}$ (dimana $c \\approx 0.5 - 0.8$ tergantung kapasitas debit).`);

    if (hasilSaluran) {
      sections.push(`#### Audit Parameter Saluran Proyek Saat Ini:
- Bentuk Penampang: **${hasilSaluran.shape}** (Material: **${hasilSaluran.materialName || 'Lining'}**)
- Kapasitas Pengaliran ($Q_{kap}$): **${hasilSaluran.dischargeCapacity.toFixed(2)} m³/s**
- Kecepatan Aliran ($V$): **${hasilSaluran.velocity.toFixed(2)} m/s** (Status: **${hasilSaluran.isVelocitySafe ? 'Aman' : 'Peringatan Kecepatan'}**)
- Bilangan Froude ($Fr$): **${hasilSaluran.froudeNumber.toFixed(2)}** (${hasilSaluran.froudeNumber < 1 ? 'Subkritis (Stabil)' : 'Superkritis (Perlu Peredam Energi)'})
- Tinggi Jagaan: Aktual **${hasilSaluran.freeboardActual.toFixed(2)} m** vs Rekomendasi SNI **${hasilSaluran.freeboardRecommended.toFixed(2)} m** (${hasilSaluran.isFreeboardSafe ? 'Aman' : 'Kurang'})`);
    }
  }

  // ── INTENT 3: DEBIT BANJIR & HSS (SNI 2415:2016) ──
  if (isBanjir) {
    sections.push(`### 2. Standar Pemodelan Debit Banjir Rencana (SNI 2415:2016)

Penentuan metode perhitungan banjir rencana didasarkan pada luas daerah aliran sungai (DAS):

#### 1. Batasan Luas DAS:
- **DAS Mikro ($\\le 300\\text{ ha}$ / $3\\text{ km}^2$)**: Diperkenankan menggunakan **Metode Rasional**:
  $$Q = 0.278 \\cdot C \\cdot I \\cdot A$$
- **DAS Menengah s/d Besar ($> 3\\text{ km}^2$)**: Wajib menggunakan **Hidrograf Satuan Sintetis (HSS Nakayasu, SCS-CN, atau Snyder)**.

#### 2. Karakteristik HSS Nakayasu:
- Puncak Hidrograf:
  $$Q_p = \\frac{C \\cdot A \\cdot R_o}{3.6 \\cdot (0.3 T_p + T_{0.3})}$$
- Waktu Menuju Puncak: $T_p = t_g + 0.8 t_r$
- Parameter $\\alpha$ (Karakteristik DAS):
  - $\\alpha = 2.0$ (Kondisi normal / standar SNI)
  - $\\alpha = 1.5$ (Bagian naik lambat, turun lambat pada DAS sangat berhutan)
  - $\\alpha = 3.0$ (Bagian naik sangat curam, umum pada DAS perkotaan / lahan kritis)`);

    if (areaNum > 0) {
      sections.push(`#### Evaluasi Luas DAS Proyek ($A = ${areaNum}\\text{ km}^2$):
- Klasifikasi: **${areaNum <= 3.0 ? 'DAS Kecil (\\le 3 km² / 300 ha) — Layak Metode Rasional' : 'DAS Menengah/Besar (> 3 km²) — Wajib Menggunakan HSS Nakayasu / SCS / Snyder'}**.`);
    }

    if (hasilBanjir) {
      sections.push(`#### Hasil Perhitungan Banjir Proyek:
- Debit Puncak ($Q_{peak}$): **${hasilBanjir.debitPuncak.toFixed(2)} m³/s**
- Waktu Puncak ($T_p$): **${hasilBanjir.waktuPuncak ? hasilBanjir.waktuPuncak.toFixed(1) : '-'} jam**
- Debit Spesifik ($q$): **${areaNum > 0 ? (hasilBanjir.debitPuncak / areaNum).toFixed(2) : '-'} m³/s/km²** (Wajar wilayah tropis Indonesia: 2.0 – 15.0 m³/s/km²).`);
    }
  }

  // ── INTENT 4: ANALISIS FREKUENSI CURAH HUJAN (SNI 2415:2016) ──
  if (isFrekuensi) {
    sections.push(`### 3. Pemilihan Distribusi Frekuensi Curah Hujan (SNI 2415:2016)

Kriteria pemilihan sebaran probabilitas statistik hidrologi di Indonesia:

| Distribusi | Syarat Koefisien Skewness ($C_s$) | Syarat Koefisien Kurtosis ($C_k$) | Karakteristik Utama |
| :--- | :--- | :--- | :--- |
| **Gumbel Type I** | $C_s \\approx 1.14$ | $C_k \\approx 5.40$ | Sebaran nilai ekstrem presipitasi maksimum |
| **Log-Pearson III**| $C_s \\ne 0$ (Fleksibel) | Bebas | Standar acuan hidrologi saat skewness signifikan |
| **Normal** | $C_s \\approx 0$ | $C_k \\approx 3.00$ | Distribusi simetris lonceng |
| **Log-Normal** | $C_s \\approx 3 C_v + C_v^3$ | $C_k \\approx 5.4 + 9C_v^2$ | Transformasi logaritmik simetris |

#### Uji Keselarasan (Goodness of Fit):
1. **Uji Smirnov-Kolmogorov**: Menguji simpangan maksimum probabilitas kumulatif horizontal $\\Delta_{maks} < \\Delta_{kritis}(\\alpha, N)$.
2. **Uji Chi-Square ($\\chi^2$)**: Menguji frekuensi teramati vs harapan pada tiap sub-kelas dengan derajat kebebasan $DK = K - (p + 1)$.`);

    if (hasilFrekuensi) {
      sections.push(`#### Hasil Analisis Frekuensi Proyek:
- Distribusi Terpilih: **${hasilFrekuensi.metodeTerpilih}**
- Status Uji Keselarasan: **${hasilFrekuensi.lulusUjiKecocokan ? 'Lulus Uji Goodness-of-Fit (Valid SNI)' : 'Perlu Evaluasi Uji'}**
- Kala Ulang Terpilih: **T = ${hasilFrekuensi.selectedKalaUlang || 25} tahun**`);
    }
  }

  // ── INTENT 5: NERACA AIR & METODE F.J. MOCK (SNI 19-6728.1-2002) ──
  if (isNeraca) {
    sections.push(`### 4. Evaluasi Neraca Air & Ketersediaan Air (SNI 19-6728.1-2002)

Metode F.J. Mock menghitung debit bulanan dari data presipitasi dan evapotranspirasi:
1. **Water Surplus ($WS$)**: $WS = (P - ET) + \\Delta S$ (jika simpanan tanah mencapai kapasitas lengas tanah / $SMC$).
2. **Direct Runoff ($DRO$) & Baseflow ($BF$)**:
   - Infiltrasi $I = WS \\cdot i$
   - Debit Aliran Permukaan $DRO = WS - I$
   - Total Debit $Q = BF + DRO$
3. **Debit Andalan**:
   - $Q_{80}$ (Probabilitas 80%): Standar keandalan air untuk kebutuhan irigasi pertanian.
   - $Q_{90} - Q_{95}$: Standar keandalan air baku air minum & industri.`);

    if (hasilNeraca || hasilMock) {
      sections.push(`#### Ringkasan Neraca Air Proyek:
- Status Keseluruhan: **${hasilNeraca ? (hasilNeraca.isSurplus ? 'SURPLUS' : 'DEFISIT') : 'Kalkulasi Mock Selesai'}**
- Debit Andalan ($Q_{andalan}$): **${hasilMock ? hasilMock.qAndalan.toFixed(3) + ' m³/s' : '-'}**
- Neraca Bersih: **${hasilNeraca ? hasilNeraca.totalSurplusDefisit.toFixed(2) + ' m³/s' : '-'}**
- Bulan Terkritis: **${hasilNeraca?.bulanKritis || '-'}**
- Indeks Kerapuhan Air (IKA): **${hasilNeraca?.waterScarcity ? hasilNeraca.waterScarcity.ikaPercent.toFixed(1) + '% (' + hasilNeraca.waterScarcity.status + ')' : '-'}**`);
    }
  }

  // ── INTENT 6: EMBUNG & RETENSI (Pd T-03-2005-A) ──
  if (isEmbung) {
    sections.push(`### 5. Kriteria Perencanaan Embung & Situ (Pd T-03-2005-A)

Kapasitas total tampungan embung terbagi atas:
1. **Tampungan Mati (*Dead Storage*)**: Volume tampungan sedimen dengan umur rencana minimum 20–25 tahun.
2. **Tampungan Efektif (*Active Storage*)**: Volume yang dimanfaatkan untuk irigasi / air baku pada musim kemarau.
3. **Tampungan Banjir (*Flood Storage*)**: Ruang tampungan sementara di atas pelimpah (*spillway*) untuk meredam debit banjir rencana (Level Pool Routing).`);

    if (hasilEmbung) {
      sections.push(`#### Hasil Desain Embung Proyek:
- Reduksi Puncak Banjir: **${hasilEmbung.reduksiPuncak.toFixed(1)}%**
- Taksiran Umur Layanan Sedimen: **${hasilEmbung.umurSedimen} tahun** (Standar minimum: 20 tahun)
- Status Keamanan: **${hasilEmbung.isAman ? 'Memenuhi Standar Keamanan' : 'Perlu Evaluasi Dimensi Pelimpah'}**`);
    }
  }

  // ── INTENT 7: PROJECT AUDIT ──
  if (isAudit || (!isGreeting && !isSaluran && !isBanjir && !isFrekuensi && !isNeraca && !isEmbung)) {
    sections.push(`### Audit Integritas Parameter Proyek Berjalan

Berikut rekapitulasi parameter hidrologi yang telah terisi pada proyek aktif:`);

    const checks: string[] = [];
    if (areaNum > 0 && riverNum > 0) {
      checks.push(`- **Morfometri DAS**: Luas = **${areaNum} km²**, Panjang Sungai = **${riverNum} km** (Tervalidasi).`);
    } else {
      checks.push(`- **Morfometri DAS**: Belum diisi. Masukkan luas DAS dan panjang sungai di modul Data Master.`);
    }

    if (rainNum > 0) {
      checks.push(`- **Curah Hujan Rencana ($R_{24}$)**: **${rainNum} mm**${hasilFrekuensi ? ` (Distribusi: ${hasilFrekuensi.metodeTerpilih})` : ''}.`);
    } else {
      checks.push(`- **Curah Hujan Rencana**: Belum ditentukan melalui modul Analisis Frekuensi.`);
    }

    if (hasilThiessen) {
      checks.push(`- **Hujan Poligon Thiessen**: Terhitung dari ${hasilThiessen.stasiunConfigs.length} stasiun hujan.`);
    }

    if (hasilBanjir) {
      checks.push(`- **Debit Banjir Rencana ($Q_{peak}$)**: **${hasilBanjir.debitPuncak.toFixed(2)} m³/s** (HSS).`);
    }

    if (hasilSaluran) {
      checks.push(`- **Kapasitas Saluran ($Q_{kap}$)**: **${hasilSaluran.dischargeCapacity.toFixed(2)} m³/s** (${hasilSaluran.isSafe ? 'Kapasitas Memadai' : 'Perlu Perbesaran'}).`);
    }

    if (hasilNeraca) {
      checks.push(`- **Neraca Air**: Status **${hasilNeraca.isSurplus ? 'Surplus' : 'Defisit'}** (Bulan Kritis: ${hasilNeraca.bulanKritis}).`);
    }

    if (hasilEmbung) {
      checks.push(`- **Embung/Situ**: Reduksi banjir **${hasilEmbung.reduksiPuncak.toFixed(1)}%**, Umur sedimen **${hasilEmbung.umurSedimen} tahun**.`);
    }

    sections.push(checks.join('\n'));
    sections.push(`\n*Tips: Anda dapat menanyakan topik hidrologi spesifik seperti "Bagaimana rumus penampang saluran terbaik?", "Kapan memakai HSS Nakayasu?", atau "Kriteria uji Chi-Square".*`);
  }

  return {
    title: 'Audit Ahli Hidrologi SNI (Offline Expert Engine)',
    markdownAnswer: sections.join('\n\n'),
    suggestedActions
  };
}
