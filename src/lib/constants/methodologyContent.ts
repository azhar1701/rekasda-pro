/**
 * =============================================================================
 * SSOT DASAR TEORI, FORMULA MATEMATIS & METODOLOGI HIDROLOGI / HIDRAULIKA
 * Sesuai Kaidah Standar Nasional Indonesia (SNI) & Standar Teknis SDA
 * =============================================================================
 */

export interface VariableDesc {
  simbol: string;
  satuan: string;
  keterangan: string;
}

export interface MethodologyBlock {
  kode: string;
  judul: string;
  namaMetode: string;
  standarRujukan: string;
  narasiSingkat: string;
  persamaanUtama: string;
  persamaanTambahan?: string[];
  keteranganVariabel: VariableDesc[];
  batasKeberlakuan?: string;
  parameterKunci?: { label: string; value: string }[];
}

export const METHODOLOGY_CONTENT: Record<string, MethodologyBlock> = {
  // ===========================================================================
  // 1. ANALISIS FREKUENSI DISTRIBUSI GUMBEL
  // ===========================================================================
  GUMBEL: {
    kode: 'GUMBEL',
    judul: 'Distribusi Frekuensi Ekstrem Gumbel (Tipe I)',
    namaMetode: 'Metode Gumbel (Extreme Value Type I Distribution)',
    standarRujukan: 'SNI 2415:2016 Lampiran B & Soewarno (1995)',
    narasiSingkat:
      'Distribusi Gumbel adalah distribusi nilai ekstrem tipe I yang sering digunakan untuk menganalisis data curah hujan harian maksimum tahunan. Metode ini mengasumsikan nilai ekstrem tidak memiliki batas atas dengan koefisien kemencengan (Cs) teoritis bernilai Cs ≈ 1,1396 dan koefisien kepuncakan (Ck) bernilai Ck ≈ 5,4002.',
    persamaanUtama: 'X_Tr = X_bar + (K_Tr × S)',
    persamaanTambahan: [
      'K_Tr = (Y_Tr - Y_n) / S_n',
      'Y_Tr = -ln( -ln( 1 - 1/Tr ) )',
      'S = sqrt( sum( (X_i - X_bar)^2 ) / (n - 1) )'
    ],
    keteranganVariabel: [
      { simbol: 'X_Tr', satuan: 'mm', keterangan: 'Curah hujan rancangan rencana untuk kala ulang Tr tahun' },
      { simbol: 'X_bar', satuan: 'mm', keterangan: 'Nilai rata-rata curah hujan harian maksimum sampel data' },
      { simbol: 'S', satuan: 'mm', keterangan: 'Standar deviasi sampel data curah hujan' },
      { simbol: 'K_Tr', satuan: '-', keterangan: 'Faktor frekuensi Gumbel untuk kala ulang Tr' },
      { simbol: 'Y_Tr', satuan: '-', keterangan: 'Reduced variate Gumbel untuk kala ulang Tr' },
      { simbol: 'Y_n', satuan: '-', keterangan: 'Reduced mean (fungsi dari jumlah sampel n)' },
      { simbol: 'S_n', satuan: '-', keterangan: 'Reduced standard deviation (fungsi dari jumlah sampel n)' },
      { simbol: 'Tr', satuan: 'tahun', keterangan: 'Periode ulang kejadian hujan rencana (Return Period)' }
    ],
    batasKeberlakuan: 'Cocok jika Cs <= 1,14 dan Ck <= 5,40. Wajib diuji Chi-Kuadrat / Smirnov-Kolmogorov.'
  },

  // ===========================================================================
  // 2. ANALISIS FREKUENSI LOG-PEARSON TIPE III
  // ===========================================================================
  LOG_PEARSON_III: {
    kode: 'LOG_PEARSON_III',
    judul: 'Distribusi Frekuensi Log-Pearson Tipe III (LP3)',
    namaMetode: 'Metode Log-Pearson Tipe III',
    standarRujukan: 'SNI 2415:2016 Lampiran B & WRC (1981)',
    narasiSingkat:
      'Distribusi Log-Pearson Tipe III mentransformasikan data observasi ke dalam bentuk logaritma natural/basis 10 sebelum dihitung karakteristik statistiknya. Distribusi ini sangat fleksibel dan diwajibkan oleh badan hidrologi nasional (USGS & SNI) untuk analisis banjir dan hujan ekstrem dengan tingkat kemencengan data yang heterogen.',
    persamaanUtama: 'log(X_Tr) = log(X)_bar + (G × S_log)',
    persamaanTambahan: [
      'X_Tr = 10^( log(X_Tr) )',
      'S_log = sqrt( sum( (log(X_i) - log(X)_bar)^2 ) / (n - 1) )',
      'Cs = ( n × sum( (log(X_i) - log(X)_bar)^3 ) ) / ( (n - 1)(n - 2) × S_log^3 )'
    ],
    keteranganVariabel: [
      { simbol: 'X_Tr', satuan: 'mm', keterangan: 'Curah hujan rancangan periode ulang Tr hasil antilogaritma' },
      { simbol: 'log(X_Tr)', satuan: 'log(mm)', keterangan: 'Nilai logaritma curah hujan rencana kala ulang Tr' },
      { simbol: 'log(X)_bar', satuan: 'log(mm)', keterangan: 'Nilai rata-rata dari deret data terlogaritma log(X_i)' },
      { simbol: 'S_log', satuan: 'log(mm)', keterangan: 'Standar deviasi dari deret data terlogaritma' },
      { simbol: 'G', satuan: '-', keterangan: 'Faktor frekuensi tabel LP3 (fungsi dari koefisien asimetri Cs dan Tr)' },
      { simbol: 'Cs', satuan: '-', keterangan: 'Koefisien kemencengan (Skewness) deret data logaritmik' }
    ],
    batasKeberlakuan: 'Dapat digunakan untuk sebaran data dengan kemiringan tidak nol (Cs ≠ 0), fleksibel untuk data hidrologi Indonesia.'
  },

  // ===========================================================================
  // 3. ANALISIS FREKUENSI LOG-NORMAL
  // ===========================================================================
  LOG_NORMAL: {
    kode: 'LOG_NORMAL',
    judul: 'Distribusi Frekuensi Log-Normal 2-Parameter',
    namaMetode: 'Metode Log-Normal (2-Parameter)',
    standarRujukan: 'SNI 2415:2016 Lampiran B',
    narasiSingkat:
      'Distribusi Log-Normal digunakan jika variabel hidrologi setelah ditransformasikan ke bentuk logaritmik mengikuti sebaran normal baku simetris (Cs_log ≈ 0). Distribusi ini membatasi nilai minimum pada nol positif (X > 0).',
    persamaanUtama: 'Y_Tr = Y_bar + (K_Tr × S_Y)   ==>   X_Tr = 10^(Y_Tr)',
    persamaanTambahan: [
      'Y_i = log10(X_i)',
      'K_Tr = Nilai variabel reduksi Gauss standar z untuk peluang kumulatif P = 1 - 1/Tr'
    ],
    keteranganVariabel: [
      { simbol: 'X_Tr', satuan: 'mm', keterangan: 'Curah hujan rancangan kala ulang Tr' },
      { simbol: 'Y_bar', satuan: 'log(mm)', keterangan: 'Nilai rata-rata transformasi logaritma sampel data' },
      { simbol: 'S_Y', satuan: 'log(mm)', keterangan: 'Standar deviasi nilai logaritmik' },
      { simbol: 'K_Tr', satuan: '-', keterangan: 'Faktor frekuensi sebaran normal standar z_Tr' }
    ],
    batasKeberlakuan: 'Disarankan jika Cs_log ≈ 3 × Cv_log + Cv_log^3 dan sebaran logaritmik mendekati simetris.'
  },

  // ===========================================================================
  // 4. ANALISIS FREKUENSI NORMAL
  // ===========================================================================
  NORMAL: {
    kode: 'NORMAL',
    judul: 'Distribusi Frekuensi Normal (Gauss)',
    namaMetode: 'Metode Distribusi Normal Gauss',
    standarRujukan: 'SNI 2415:2016 Lampiran B',
    narasiSingkat:
      'Distribusi Normal (kurva lonceng Gauss) mengasumsikan variabel hidrologi terdistribusi simetris sempurna di sekitar nilai rerata dengan koefisien kemencengan Cs = 0 dan koefisien kepuncakan Ck = 3. Metode ini jarang cocok untuk data hujan ekstrem tahunan karena data hujan umumnya menceng ke kanan (positive skew).',
    persamaanUtama: 'X_Tr = X_bar + (K_Tr × S)',
    persamaanTambahan: [
      'K_Tr = z_Tr (Variabel acak standar Gauss untuk probabilitas P = 1 - 1/Tr)'
    ],
    keteranganVariabel: [
      { simbol: 'X_Tr', satuan: 'mm', keterangan: 'Curah hujan rancangan kala ulang Tr' },
      { simbol: 'X_bar', satuan: 'mm', keterangan: 'Rata-rata aritmatika data curah hujan' },
      { simbol: 'S', satuan: 'mm', keterangan: 'Standar deviasi data' },
      { simbol: 'K_Tr', satuan: '-', keterangan: 'Faktor frekuensi Gauss dari tabel distribusi standar' }
    ],
    batasKeberlakuan: 'Hanya valid jika data memenuhi syarat Cs ≈ 0 dan Ck ≈ 3.'
  },

  // ===========================================================================
  // 5. DEBIT BANJIR METODE RASIONAL
  // ===========================================================================
  RASIONAL: {
    kode: 'RASIONAL',
    judul: 'Analisis Debit Banjir Metode Rasional',
    namaMetode: 'Metode Rasional (Rational Method)',
    standarRujukan: 'SNI 2415:2016 Pasal 5.2 & Suripin (2004)',
    narasiSingkat:
      'Metode Rasional memperkirakan debit puncak banjir limpasan permukaan dari curah hujan maksimum yang terjadi selama durasi hujan yang sama dengan waktu konsentrasi DAS (tc). Koefisien pengaliran gabungan (C) ditentukan berdasarkan tutupan lahan dan kemiringan lereng catchment area.',
    persamaanUtama: 'Q = 0,278 × C × I × A',
    persamaanTambahan: [
      'I = (R_24 / 24) × (24 / tc)^(2/3)   [Formula Mononobe]',
      'tc = to + td = (2/3 × 3,28 × L × n / sqrt(S))^0.467 + (L_stream / (60 × V))',
      'C_gabungan = sum( C_i × A_i ) / sum( A_i )'
    ],
    keteranganVariabel: [
      { simbol: 'Q', satuan: 'm³/detik', keterangan: 'Debit banjir rancangan puncak (peak discharge)' },
      { simbol: 'C', satuan: '-', keterangan: 'Koefisien pengaliran / limpasan gabungan DAS (0 < C < 1)' },
      { simbol: 'I', satuan: 'mm/jam', keterangan: 'Intensitas hujan rata-rata selama waktu konsentrasi tc' },
      { simbol: 'A', satuan: 'km²', keterangan: 'Luas daerah aliran sungai (DAS) / Catchment Area' },
      { simbol: '0,278', satuan: '-', keterangan: 'Faktor konversi metrik: (10^6 m² / km²) × (1 m / 1000 mm) × (1 jam / 3600 s)' },
      { simbol: 'tc', satuan: 'jam', keterangan: 'Waktu konsentrasi air mengalir dari titik terjauh hingga outlet DAS' },
      { simbol: 'R_24', satuan: 'mm', keterangan: 'Curah hujan harian maksimum rencana rancangan periode ulang Tr' }
    ],
    batasKeberlakuan: 'Hanya diizinkan untuk DAS kecil dengan luas DAS <= 50 km² (SNI 2415:2016) atau DAS perkotaan <= 300 ha dengan waktu konsentrasi tc < 6 jam.'
  },

  // ===========================================================================
  // 6. DEBIT BANJIR HSS NAKAYASU
  // ===========================================================================
  HSS_NAKAYASU: {
    kode: 'HSS_NAKAYASU',
    judul: 'Hidrograf Satuan Sintetis (HSS) Nakayasu',
    namaMetode: 'HSS Nakayasu',
    standarRujukan: 'SNI 2415:2016 Pasal 6.3 & Soemarto (1995)',
    narasiSingkat:
      'Metode HSS Nakayasu adalah hidrograf satuan sintetis yang sangat populer di Indonesia untuk DAS berukuran sedang hingga luas. Metode ini membentuk kurva hidrograf banjir lengkap (lengkung naik, lengkung puncak, dan tiga tahap lengkung resesi resesi Qa, Qb, Qc) berdasarkan karakteristik geometri morfometri DAS.',
    persamaanUtama: 'Q_p = (C_A × A × R_o) / (3,6 × (0,3 × T_p + T_0.3))',
    persamaanTambahan: [
      'T_g = 0,4 + 0,058 × L   (untuk L > 15 km), atau T_g = 0,21 × L^0.7 (untuk L <= 15 km)',
      'T_r = 0,5 × T_g s/d 1,0 × T_g',
      'T_p = T_g + 0,8 × T_r',
      'T_0.3 = alpha × T_g   (alpha standar = 2,0 per SNI)'
    ],
    keteranganVariabel: [
      { simbol: 'Q_p', satuan: 'm³/detik', keterangan: 'Debit puncak hidrograf satuan sintetis' },
      { simbol: 'A', satuan: 'km²', keterangan: 'Luas daerah aliran sungai (DAS)' },
      { simbol: 'R_o', satuan: 'mm', keterangan: 'Hujan satuan efektif netto (standar = 1 mm atau durasi jam-jaman)' },
      { simbol: 'T_p', satuan: 'jam', keterangan: 'Waktu dari awal hujan hingga tercapainya debit puncak' },
      { simbol: 'T_0.3', satuan: 'jam', keterangan: 'Waktu yang dibutuhkan debit untuk turun dari Qp ke 0,3 × Qp' },
      { simbol: 'T_g', satuan: 'jam', keterangan: 'Waktu kelambatan (time lag) antara pusat hujan dan puncak hidrograf' },
      { simbol: 'L', satuan: 'km', keterangan: 'Panjang alur sungai utama dari hulu terjauh hingga outlet' },
      { simbol: 'alpha', satuan: '-', keterangan: 'Koefisien karakteristik hidrograf daerah pengaliran (standar SNI alpha = 2,0)' }
    ],
    batasKeberlakuan: 'Dapat digunakan untuk DAS berukuran sedang dan besar (A > 50 km²). Direkomendasikan kalibrasi parameter alpha terhadap hidrograf terukur.'
  },

  // ===========================================================================
  // 7. DEBIT BANJIR METODE SCS CURVE NUMBER (NRCS)
  // ===========================================================================
  SCS_CN: {
    kode: 'SCS_CN',
    judul: 'Metode Limpasan SCS Curve Number (NRCS)',
    namaMetode: 'Soil Conservation Service Curve Number (SCS-CN)',
    standarRujukan: 'USDA-NRCS National Engineering Handbook Part 630 & TR-55',
    narasiSingkat:
      'Metode SCS Curve Number memperkirakan volume dan laju limpasan langsung (direct runoff) berdasarkan nomor kurva limpasan (CN) yang mengintegrasikan grup hidrologi tanah (HSG A, B, C, D), tutupan vegetasi, tata guna lahan, serta kondisi kelembaban awal tanah (Antecedent Moisture Condition / AMC).',
    persamaanUtama: 'Q = (P - I_a)^2 / (P - I_a + S)   [untuk P > I_a, jika P <= I_a maka Q = 0]',
    persamaanTambahan: [
      'S = (25400 / CN) - 254   [dalam satuan mm]',
      'I_a = lambda × S = 0,2 × S   (retensi awal / initial abstraction)'
    ],
    keteranganVariabel: [
      { simbol: 'Q', satuan: 'mm', keterangan: 'Kedalaman limpasan permukaan langsung (Direct Runoff Depth)' },
      { simbol: 'P', satuan: 'mm', keterangan: 'Akumulasi curah hujan kotor kejadian rencana (Gross Precipitation)' },
      { simbol: 'I_a', satuan: 'mm', keterangan: 'Inisial abstraksi (intersepsi daun, genangan depresi tanah, infiltrasi awal)' },
      { simbol: 'S', satuan: 'mm', keterangan: 'Potensi retensi maksimum air oleh tanah setelah limpasan dimulai' },
      { simbol: 'CN', satuan: '-', keterangan: 'Curve Number hidrologi tanah (skala empiris 0 hingga 100)' }
    ],
    batasKeberlakuan: 'Sangat handal untuk analisis limpasan pada DAS heterogen berbasis data spasial tanah dan tutupan lahan.'
  },

  // ===========================================================================
  // 8. NERACA AIR METODE F.J. MOCK
  // ===========================================================================
  FJ_MOCK: {
    kode: 'FJ_MOCK',
    judul: 'Analisis Neraca Air Metode F.J. Mock',
    namaMetode: 'Metode Keseimbangan Air Bulanan F.J. Mock',
    standarRujukan: 'SNI 19-6728.1-2002 (Penyusunan Neraca Sumber Daya Air)',
    narasiSingkat:
      'Metode F.J. Mock adalah model hidrologi deterministik konseptual yang menghitung debit aliran sungai andalan bulanan (Q80% / Q90%) berdasarkan prinsip neraca air (water balance). Aliran sungai total diuraikan atas limpasan langsung (direct runoff), aliran dasar air tanah (baseflow), dan aliran antara (storm runoff) dengan memperhitungkan evapotranspirasi aktual dan perubahan kelembaban tanah.',
    persamaanUtama: 'Q_total = Direct_Runoff + Base_Flow + Storm_Runoff',
    persamaanTambahan: [
      'ETa = ETp - Delta_ET   [Delta_ET = ETp × (m/20) × (18 - d)]',
      'Water_Surplus (WS) = (P - ETa) + Delta_SS   [jika SMS > SMC, maka terjadi infiltrasi]',
      'Base_Flow = 0,5 × (1 + k) × I_n + k × V_{t-1}   [k = koefisien resesi air tanah]',
      'Q_andalan = Q_rerata × Probabilitas Andalan (P_80% atau P_90%)'
    ],
    keteranganVariabel: [
      { simbol: 'Q_total', satuan: 'm³/detik', keterangan: 'Debit aliran sungai total bulanan yang tersedia di outlet DAS' },
      { simbol: 'P', satuan: 'mm/bulan', keterangan: 'Presipitasi / curah hujan rata-rata DAS per bulan' },
      { simbol: 'ETp', satuan: 'mm/bulan', keterangan: 'Evapotranspirasi potensial bulanan (metode Penman-Monteith)' },
      { simbol: 'ETa', satuan: 'mm/bulan', keterangan: 'Evapotranspirasi aktual setelah koreksi kebasahan permukaan' },
      { simbol: 'SMS', satuan: 'mm', keterangan: 'Kapasitas kelembaban tanah (Soil Moisture Storage, SMC = 200 mm)' },
      { simbol: 'k', satuan: '-', keterangan: 'Faktor resesi aliran air tanah (groundwater recession factor 0,4–0,7)' },
      { simbol: 'Base_Flow', satuan: 'mm/bulan', keterangan: 'Aliran dasar dari akuifer air tanah dangkal ke badan sungai' }
    ],
    batasKeberlakuan: 'Standar baku nasional Indonesia untuk penentuan alokasi air irigasi, air baku perkotaan, dan PLTMH.'
  },

  // ===========================================================================
  // 9. ROUTING TAMPUNGAN EMBUNG
  // ===========================================================================
  ROUTING_EMBUNG: {
    kode: 'ROUTING_EMBUNG',
    judul: 'Penelusuran Banjir Tampungan (Flood Routing Embung)',
    namaMetode: 'Metode Modified Puls / Level Pool Routing',
    standarRujukan: 'Pd T-03-2005-A (Pedoman Perencanaan Embung Kecil)',
    narasiSingkat:
      'Penelusuran banjir waduk/embung (reservoir flood routing) didasarkan pada persamaan kontinuitas kekekalan massa air dalam selang waktu tertentu (delta_t). Tampungan embung bertindak meredam puncak hidrograf banjir masuk (Inflow) menjadi hidrograf keluaran (Outflow) yang lebih landai melalui pelimpah (spillway).',
    persamaanUtama: '( (I_1 + I_2) / 2 ) - ( (O_1 + O_2) / 2 ) = (S_2 - S_1) / delta_t',
    persamaanTambahan: [
      '( (2 × S_2) / delta_t + O_2 ) = (I_1 + I_2) + ( (2 × S_1) / delta_t - O_1 )',
      'O = C_d × B × H^(3/2)   [Debit pelimpah ambang bebas / Ogee]',
      'Reduksi_Puncak (%) = ( (Q_in_peak - Q_out_peak) / Q_in_peak ) × 100%'
    ],
    keteranganVariabel: [
      { simbol: 'I_1, I_2', satuan: 'm³/detik', keterangan: 'Laju aliran debit masuk (Inflow) pada awal dan akhir selang waktu delta_t' },
      { simbol: 'O_1, O_2', satuan: 'm³/detik', keterangan: 'Laju aliran debit keluar pelimpah (Outflow) pada awal dan akhir selang waktu' },
      { simbol: 'S_1, S_2', satuan: 'm³', keterangan: 'Volume tampungan air embung pada awal dan akhir selang waktu delta_t' },
      { simbol: 'delta_t', satuan: 'detik', keterangan: 'Interval langkah waktu penelusuran hidrograf (Time step)' },
      { simbol: 'C_d', satuan: '-', keterangan: 'Koefisien limpasan debit pelimpah mercu (1,8 s/d 2,2)' },
      { simbol: 'B', satuan: 'm', keterangan: 'Lebar efektif pelimpah mercu embung' },
      { simbol: 'H', satuan: 'm', keterangan: 'Tinggi energi air di atas mercu pelimpah' }
    ],
    batasKeberlakuan: 'Wajib dievaluasi terhadap debit banjir rencana Q25, Q50, atau Q100 sesuai kelas bahaya embung Pd T-03-2005-A.'
  },

  // ===========================================================================
  // 10. DESAIN HIDRAULIK SALURAN MANNING
  // ===========================================================================
  MANNING: {
    kode: 'MANNING',
    judul: 'Desain Hidraulik Saluran Terbuka (Formula Manning)',
    namaMetode: 'Persamaan Aliran Seragam Manning',
    standarRujukan: 'SNI 03-2401-1991 & Kriteria Perencanaan Irigasi KP-03',
    narasiSingkat:
      'Persamaan Manning adalah formula hidraulika standar untuk menghitung laju aliran seragam (uniform flow) pada saluran terbuka (open channel). Evaluasi mencakup pemenuhan kapasitas debit desain, pengecekan kecepatan aliran aman (mencegah erosi dan sedimentasi), serta kestabilan bilangan Froude.',
    persamaanUtama: 'Q = (1 / n) × A × R^(2/3) × S^(1/2)',
    persamaanTambahan: [
      'V = (1 / n) × R^(2/3) × S^(1/2)   ==>   Q = A × V',
      'R = A / P   [Jari-jari hidraulik: luas basah dibagi keliling basah]',
      'Fr = V / sqrt( g × D_h )   [Bilangan Froude; D_h = A / T]',
      'Fb = sqrt( c_fb × y )   [Tinggi jagaan bebas / Freeboard rekomendasi KP-03]'
    ],
    keteranganVariabel: [
      { simbol: 'Q', satuan: 'm³/detik', keterangan: 'Kapasitas debit pengaliran penampang basah saluran' },
      { simbol: 'V', satuan: 'm/detik', keterangan: 'Kecepatan aliran rata-rata penampang basah' },
      { simbol: 'n', satuan: '-', keterangan: 'Koefisien kekasaran dinding saluran Manning (contoh: beton n=0,014, tanah n=0,025)' },
      { simbol: 'A', satuan: 'm²', keterangan: 'Luas penampang basah aliran fluida' },
      { simbol: 'P', satuan: 'm', keterangan: 'Keliling basah saluran yang kontak dengan air' },
      { simbol: 'R', satuan: 'm', keterangan: 'Jari-jari hidraulik penampang saluran (A / P)' },
      { simbol: 'S', satuan: 'm/m', keterangan: 'Kemiringan memanjang dasar saluran (Bed Slope)' },
      { simbol: 'Fr', satuan: '-', keterangan: 'Bilangan Froude (Fr < 1: Subkritis, Fr = 1: Kritis, Fr > 1: Superkritis)' },
      { simbol: 'Fb', satuan: 'm', keterangan: 'Tinggi jagaan / Freeboard vertikal di atas muka air rencana' }
    ],
    batasKeberlakuan: 'Berlaku untuk aliran seragam permanen (steady uniform flow). Kecepatan alir wajib dibatasi: V_min >= 0,6 m/s (cegah sedimentasi) dan V_max <= 2,0–3,0 m/s (cegah abrasi).'
  }
};

/**
 * Helper untuk mendapatkan metodologi fallback yang aman
 */
export const getMethodology = (key: string): MethodologyBlock => {
  const normalizedKey = (key || '').toUpperCase().trim();
  if (METHODOLOGY_CONTENT[normalizedKey]) {
    return METHODOLOGY_CONTENT[normalizedKey];
  }
  
  // Fuzzy fallback mapping
  if (normalizedKey.includes('GUMBEL')) return METHODOLOGY_CONTENT.GUMBEL;
  if (normalizedKey.includes('PEARSON') || normalizedKey.includes('LP3')) return METHODOLOGY_CONTENT.LOG_PEARSON_III;
  if (normalizedKey.includes('LOG_NORMAL') || normalizedKey.includes('LOGNORMAL')) return METHODOLOGY_CONTENT.LOG_NORMAL;
  if (normalizedKey.includes('NORMAL')) return METHODOLOGY_CONTENT.NORMAL;
  if (normalizedKey.includes('RASIONAL') || normalizedKey.includes('RATIONAL')) return METHODOLOGY_CONTENT.RASIONAL;
  if (normalizedKey.includes('NAKAYASU') || normalizedKey.includes('HSS')) return METHODOLOGY_CONTENT.HSS_NAKAYASU;
  if (normalizedKey.includes('SCS') || normalizedKey.includes('CN')) return METHODOLOGY_CONTENT.SCS_CN;
  if (normalizedKey.includes('MOCK') || normalizedKey.includes('NERACA')) return METHODOLOGY_CONTENT.FJ_MOCK;
  if (normalizedKey.includes('EMBUNG') || normalizedKey.includes('ROUTING')) return METHODOLOGY_CONTENT.ROUTING_EMBUNG;
  if (normalizedKey.includes('MANNING') || normalizedKey.includes('SALURAN')) return METHODOLOGY_CONTENT.MANNING;

  // Default fallback
  return METHODOLOGY_CONTENT.RASIONAL;
};
