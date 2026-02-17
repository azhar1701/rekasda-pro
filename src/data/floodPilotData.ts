/**
 * Data Pilot untuk Pemodelan Debit Banjir Rencana
 * ================================================
 * Data valid untuk testing dan demonstrasi aplikasi
 * Berdasarkan kondisi DAS di Indonesia
 */

export interface PilotDataRational {
  name: string;
  description: string;
  location: {
    channelName: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
    coordinates?: { lat: number; lng: number };
  };
  inputs: {
    C: number;      // Koefisien limpasan (0-1)
    A: number;      // Luas DAS (km²)
    tc: number;     // Waktu konsentrasi (menit)
    I: number;      // Intensitas hujan (mm/jam)
  };
  returnPeriods: Array<{
    period: string;
    rainfall: number;
  }>;
}

export interface PilotDataNakayasu {
  name: string;
  description: string;
  location: {
    channelName: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
    coordinates?: { lat: number; lng: number };
  };
  inputs: {
    A: number;      // Luas DAS (km²)
    L: number;      // Panjang sungai (km)
    Ro: number;     // Hujan satuan (mm)
    Alpha: number;  // Koefisien DAS (1.5-3.0)
  };
  returnPeriods: Array<{
    period: string;
    rainfall: number;
  }>;
}

// ============================================
// DATA PILOT METODE RASIONAL
// ============================================

export const rationalPilotData: PilotDataRational[] = [
  {
    name: "DAS Kecil Urban - Bandung",
    description: "DAS kecil di area perkotaan dengan tutupan lahan campuran",
    location: {
      channelName: "Saluran Cikapundung Hilir",
      kabupaten: "Kota Bandung",
      kecamatan: "Coblong",
      desa: "Dago",
      coordinates: { lat: -6.8701, lng: 107.6195 }
    },
    inputs: {
      C: 0.75,      // Urban area dengan perkerasan tinggi
      A: 2.5,       // DAS kecil 2.5 km²
      tc: 45,       // Waktu konsentrasi 45 menit
      I: 120        // Intensitas hujan tinggi
    },
    returnPeriods: [
      { period: 'Q2', rainfall: 85 },
      { period: 'Q5', rainfall: 105 },
      { period: 'Q10', rainfall: 125 },
      { period: 'Q25', rainfall: 145 },
      { period: 'Q50', rainfall: 165 },
      { period: 'Q100', rainfall: 185 }
    ]
  },
  {
    name: "DAS Pertanian - Jawa Barat",
    description: "DAS dengan dominasi lahan pertanian dan sawah",
    location: {
      channelName: "Saluran Irigasi Cimanuk",
      kabupaten: "Kabupaten Sumedang",
      kecamatan: "Jatinangor",
      desa: "Cibeusi",
      coordinates: { lat: -6.9281, lng: 107.7731 }
    },
    inputs: {
      C: 0.45,      // Lahan pertanian dengan infiltrasi baik
      A: 5.8,       // DAS sedang 5.8 km²
      tc: 60,       // Waktu konsentrasi 60 menit
      I: 95         // Intensitas sedang
    },
    returnPeriods: [
      { period: 'Q2', rainfall: 75 },
      { period: 'Q5', rainfall: 95 },
      { period: 'Q10', rainfall: 115 },
      { period: 'Q25', rainfall: 135 },
      { period: 'Q50', rainfall: 155 },
      { period: 'Q100', rainfall: 175 }
    ]
  },
  {
    name: "DAS Perumahan - Jakarta",
    description: "Kawasan perumahan padat dengan drainase terbatas",
    location: {
      channelName: "Kali Pesanggrahan",
      kabupaten: "Jakarta Selatan",
      kecamatan: "Kebayoran Lama",
      desa: "Cipulir",
      coordinates: { lat: -6.2615, lng: 106.7668 }
    },
    inputs: {
      C: 0.85,      // Area perumahan padat
      A: 1.2,       // DAS sangat kecil
      tc: 30,       // Waktu konsentrasi pendek
      I: 140        // Intensitas tinggi Jakarta
    },
    returnPeriods: [
      { period: 'Q2', rainfall: 90 },
      { period: 'Q5', rainfall: 115 },
      { period: 'Q10', rainfall: 135 },
      { period: 'Q25', rainfall: 160 },
      { period: 'Q50', rainfall: 180 },
      { period: 'Q100', rainfall: 200 }
    ]
  },
  {
    name: "DAS Hutan - Jawa Tengah",
    description: "DAS dengan tutupan hutan yang baik",
    location: {
      channelName: "Sungai Serayu Hulu",
      kabupaten: "Kabupaten Banjarnegara",
      kecamatan: "Kalibening",
      desa: "Sikapat",
      coordinates: { lat: -7.3553, lng: 109.6811 }
    },
    inputs: {
      C: 0.30,      // Hutan dengan infiltrasi sangat baik
      A: 8.5,       // DAS sedang-besar
      tc: 90,       // Waktu konsentrasi panjang
      I: 75         // Intensitas rendah
    },
    returnPeriods: [
      { period: 'Q2', rainfall: 65 },
      { period: 'Q5', rainfall: 85 },
      { period: 'Q10', rainfall: 105 },
      { period: 'Q25', rainfall: 125 },
      { period: 'Q50', rainfall: 145 },
      { period: 'Q100', rainfall: 165 }
    ]
  },
  {
    name: "DAS Industri - Bekasi",
    description: "Kawasan industri dengan perkerasan ekstensif",
    location: {
      channelName: "Kali Cakung",
      kabupaten: "Kota Bekasi",
      kecamatan: "Bekasi Timur",
      desa: "Margahayu",
      coordinates: { lat: -6.2441, lng: 107.0077 }
    },
    inputs: {
      C: 0.90,      // Kawasan industri hampir seluruhnya kedap air
      A: 3.2,       // DAS kecil-sedang
      tc: 35,       // Waktu konsentrasi pendek
      I: 135        // Intensitas tinggi
    },
    returnPeriods: [
      { period: 'Q2', rainfall: 95 },
      { period: 'Q5', rainfall: 120 },
      { period: 'Q10', rainfall: 140 },
      { period: 'Q25', rainfall: 165 },
      { period: 'Q50', rainfall: 185 },
      { period: 'Q100', rainfall: 205 }
    ]
  }
];

// ============================================
// DATA PILOT HSS NAKAYASU
// ============================================

export const nakayasuPilotData: PilotDataNakayasu[] = [
  {
    name: "DAS Citarum Hulu",
    description: "DAS besar dengan karakteristik pegunungan",
    location: {
      channelName: "Sungai Citarum",
      kabupaten: "Kabupaten Bandung",
      kecamatan: "Kertasari",
      desa: "Cibeureum",
      coordinates: { lat: -7.1447, lng: 107.5872 }
    },
    inputs: {
      A: 450,       // DAS besar 450 km²
      L: 35,        // Panjang sungai 35 km
      Ro: 85,       // Hujan efektif 85 mm
      Alpha: 2.0    // Karakteristik DAS pegunungan
    },
    returnPeriods: [
      { period: 'Q2', rainfall: 80 },
      { period: 'Q5', rainfall: 100 },
      { period: 'Q10', rainfall: 120 },
      { period: 'Q25', rainfall: 140 },
      { period: 'Q50', rainfall: 160 },
      { period: 'Q100', rainfall: 180 }
    ]
  },
  {
    name: "DAS Ciliwung Tengah",
    description: "DAS sedang dengan topografi bergelombang",
    location: {
      channelName: "Sungai Ciliwung",
      kabupaten: "Kota Depok",
      kecamatan: "Sukmajaya",
      desa: "Cisalak",
      coordinates: { lat: -6.3897, lng: 106.8317 }
    },
    inputs: {
      A: 180,       // DAS sedang 180 km²
      L: 22,        // Panjang sungai 22 km
      Ro: 95,       // Hujan efektif tinggi
      Alpha: 2.2    // Karakteristik DAS urban
    },
    returnPeriods: [
      { period: 'Q2', rainfall: 90 },
      { period: 'Q5', rainfall: 115 },
      { period: 'Q10', rainfall: 135 },
      { period: 'Q25', rainfall: 160 },
      { period: 'Q50', rainfall: 180 },
      { period: 'Q100', rainfall: 200 }
    ]
  },
  {
    name: "DAS Brantas Hulu",
    description: "DAS besar dengan karakteristik dataran tinggi",
    location: {
      channelName: "Sungai Brantas",
      kabupaten: "Kota Batu",
      kecamatan: "Batu",
      desa: "Sisir",
      coordinates: { lat: -7.8753, lng: 112.5281 }
    },
    inputs: {
      A: 620,       // DAS sangat besar 620 km²
      L: 48,        // Panjang sungai 48 km
      Ro: 75,       // Hujan efektif sedang
      Alpha: 1.8    // Karakteristik DAS dataran tinggi
    },
    returnPeriods: [
      { period: 'Q2', rainfall: 70 },
      { period: 'Q5', rainfall: 90 },
      { period: 'Q10', rainfall: 110 },
      { period: 'Q25', rainfall: 130 },
      { period: 'Q50', rainfall: 150 },
      { period: 'Q100', rainfall: 170 }
    ]
  },
  {
    name: "DAS Bengawan Solo Tengah",
    description: "DAS sangat besar dengan topografi datar",
    location: {
      channelName: "Sungai Bengawan Solo",
      kabupaten: "Kabupaten Sragen",
      kecamatan: "Sragen",
      desa: "Sragen Kulon",
      coordinates: { lat: -7.4253, lng: 111.0081 }
    },
    inputs: {
      A: 1250,      // DAS sangat besar 1250 km²
      L: 65,        // Panjang sungai 65 km
      Ro: 70,       // Hujan efektif rendah (dataran)
      Alpha: 2.5    // Karakteristik DAS dataran luas
    },
    returnPeriods: [
      { period: 'Q2', rainfall: 65 },
      { period: 'Q5', rainfall: 85 },
      { period: 'Q10', rainfall: 105 },
      { period: 'Q25', rainfall: 125 },
      { period: 'Q50', rainfall: 145 },
      { period: 'Q100', rainfall: 165 }
    ]
  },
  {
    name: "DAS Progo Hulu",
    description: "DAS pegunungan dengan lereng curam",
    location: {
      channelName: "Sungai Progo",
      kabupaten: "Kabupaten Magelang",
      kecamatan: "Salaman",
      desa: "Ngargosari",
      coordinates: { lat: -7.5281, lng: 110.1531 }
    },
    inputs: {
      A: 380,       // DAS sedang-besar 380 km²
      L: 28,        // Panjang sungai 28 km
      Ro: 100,      // Hujan efektif tinggi (pegunungan)
      Alpha: 1.7    // Karakteristik DAS pegunungan curam
    },
    returnPeriods: [
      { period: 'Q2', rainfall: 85 },
      { period: 'Q5', rainfall: 110 },
      { period: 'Q10', rainfall: 130 },
      { period: 'Q25', rainfall: 155 },
      { period: 'Q50', rainfall: 175 },
      { period: 'Q100', rainfall: 195 }
    ]
  },
  {
    name: "DAS Serayu Tengah",
    description: "DAS dengan karakteristik campuran pegunungan-dataran",
    location: {
      channelName: "Sungai Serayu",
      kabupaten: "Kabupaten Banyumas",
      kecamatan: "Purwokerto Utara",
      desa: "Grendeng",
      coordinates: { lat: -7.4153, lng: 109.2381 }
    },
    inputs: {
      A: 520,       // DAS besar 520 km²
      L: 42,        // Panjang sungai 42 km
      Ro: 80,       // Hujan efektif sedang
      Alpha: 2.1    // Karakteristik DAS campuran
    },
    returnPeriods: [
      { period: 'Q2', rainfall: 75 },
      { period: 'Q5', rainfall: 95 },
      { period: 'Q10', rainfall: 115 },
      { period: 'Q25', rainfall: 135 },
      { period: 'Q50', rainfall: 155 },
      { period: 'Q100', rainfall: 175 }
    ]
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getRationalPilotByName(name: string): PilotDataRational | undefined {
  return rationalPilotData.find(data => data.name === name);
}

export function getNakayasuPilotByName(name: string): PilotDataNakayasu | undefined {
  return nakayasuPilotData.find(data => data.name === name);
}

export function getAllRationalPilotNames(): string[] {
  return rationalPilotData.map(data => data.name);
}

export function getAllNakayasuPilotNames(): string[] {
  return nakayasuPilotData.map(data => data.name);
}
