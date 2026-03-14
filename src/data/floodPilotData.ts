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
 C: number; // Koefisien limpasan (0-1)
 A: number; // Luas DAS (km²)
 tc: number; // Waktu konsentrasi (menit)
 I: number; // Intensitas hujan (mm/jam)
 };
 returnPeriods: Array<{
 period: string;
 rainfall: number;
 }>;
}

export interface PilotDataModifiedRational {
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
 A: number; // Luas DAS (km²)
 L: number; // Panjang sungai (km)
 S: number; // Kemiringan (%)
 I: number; // Intensitas hujan (mm/jam)
 C?: number; // Koefisien limpasan (untuk Melchior)
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
 A: number; // Luas DAS (km²)
 L: number; // Panjang sungai (km)
 Ro: number; // Hujan satuan (mm)
 Alpha: number; // Koefisien DAS (1.5-3.0)
 };
 returnPeriods: Array<{
 period: string;
 rainfall: number;
 }>;
}

export interface PilotDataGamma1 {
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
 A: number; // Luas DAS (km²)
 L: number; // Panjang sungai (km)
 Ro: number; // Hujan satuan (mm)
 SF: number; // Source Factor
 Tc?: number; // Waktu konsentrasi (jam) - opsional
 };
 returnPeriods: Array<{
 period: string;
 rainfall: number;
 }>;
}

export interface PilotDataSnyder {
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
 A: number; // Luas DAS (km²)
 L: number; // Panjang sungai (km)
 Lc: number; // Jarak ke centroid (km)
 Ro: number; // Hujan satuan (mm)
 Ct: number; // Koefisien Ct (0.4-0.8)
 Cp: number; // Koefisien Cp (0.4-0.8)
 };
 returnPeriods: Array<{
 period: string;
 rainfall: number;
 }>;
}

// ============================================
// DATA PILOT METODE RASIONAL
// ============================================
// Sesuai SNI 2415:2016 Pasal 3.1: A ≤ 3 km² (300 Ha)

export const rationalPilotData: PilotDataRational[] = [
 {
 name: "DAS Kecil Urban - Bandung",
 description: "DAS kecil di area perkotaan dengan pemukiman padat (SNI Compliant: A ≤ 3 km²)",
 location: {
 channelName: "Saluran Cikapundung Hilir",
 kabupaten: "Kota Bandung",
 kecamatan: "Coblong",
 desa: "Dago",
 coordinates: { lat: -6.8701, lng: 107.6195 }
 },
 inputs: {
 C: 0.70, // Pemukiman Padat (Suripin 2004)
 A: 1.8, // DAS kecil 1.8 km² (SESUAI SNI: ≤ 3 km²)
 tc: 45, // Waktu konsentrasi 45 menit
 I: 120 // Intensitas hujan tinggi
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
 name: "DAS Komersial - Jakarta",
 description: "Kawasan pusat kota dengan area komersial (SNI Compliant: A ≤ 3 km²)",
 location: {
 channelName: "Kali Pesanggrahan",
 kabupaten: "Jakarta Selatan",
 kecamatan: "Kebayoran Lama",
 desa: "Cipulir",
 coordinates: { lat: -6.2615, lng: 106.7668 }
 },
 inputs: {
 C: 0.85, // Pusat Kota/Kawasan Komersial (Permen PU 12/2014)
 A: 0.8, // DAS sangat kecil (SESUAI SNI: ≤ 3 km²)
 tc: 30, // Waktu konsentrasi pendek
 I: 140 // Intensitas tinggi Jakarta
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
 name: "DAS Jalan Aspal - Bekasi",
 description: "Kawasan dengan dominasi jalan aspal dan perkerasan (SNI Compliant: A ≤ 3 km²)",
 location: {
 channelName: "Kali Cakung",
 kabupaten: "Kota Bekasi",
 kecamatan: "Bekasi Timur",
 desa: "Margahayu",
 coordinates: { lat: -6.2441, lng: 107.0077 }
 },
 inputs: {
 C: 0.95, // Jalan Aspal (Permen PU 12/2014)
 A: 1.5, // DAS kecil (SESUAI SNI: ≤ 3 km²)
 tc: 35, // Waktu konsentrasi pendek
 I: 135 // Intensitas tinggi
 },
 returnPeriods: [
 { period: 'Q2', rainfall: 95 },
 { period: 'Q5', rainfall: 120 },
 { period: 'Q10', rainfall: 140 },
 { period: 'Q25', rainfall: 165 },
 { period: 'Q50', rainfall: 185 },
 { period: 'Q100', rainfall: 205 }
 ]
 },
 {
 name: "DAS Pertanian - Jawa Barat",
 description: "DAS kecil dengan dominasi lahan pertanian (SNI Compliant: A ≤ 3 km²)",
 location: {
 channelName: "Saluran Irigasi Cimanuk",
 kabupaten: "Kabupaten Sumedang",
 kecamatan: "Jatinangor",
 desa: "Cibeusi",
 coordinates: { lat: -6.9281, lng: 107.7731 }
 },
 inputs: {
 C: 0.30, // Lahan Pertanian (Suripin 2004)
 A: 2.5, // DAS kecil (SESUAI SNI: ≤ 3 km²)
 tc: 50, // Waktu konsentrasi sedang
 I: 95 // Intensitas sedang
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
 name: "DAS Pemukiman Sedang - Semarang",
 description: "DAS dengan pemukiman sedang dan ruang terbuka (SNI Compliant: A ≤ 3 km²)",
 location: {
 channelName: "Kali Garang Hilir",
 kabupaten: "Kota Semarang",
 kecamatan: "Tembalang",
 desa: "Sendangmulyo",
 coordinates: { lat: -7.0511, lng: 110.4381 }
 },
 inputs: {
 C: 0.50, // Pemukiman Sedang (Suripin 2004)
 A: 1.2, // DAS kecil (SESUAI SNI: ≤ 3 km²)
 tc: 40, // Waktu konsentrasi sedang
 I: 110 // Intensitas sedang-tinggi
 },
 returnPeriods: [
 { period: 'Q2', rainfall: 80 },
 { period: 'Q5', rainfall: 100 },
 { period: 'Q10', rainfall: 120 },
 { period: 'Q25', rainfall: 140 },
 { period: 'Q50', rainfall: 160 },
 { period: 'Q100', rainfall: 180 }
 ]
 }
];

// ============================================
// DATA PILOT HSS NAKAYASU
// ============================================
// Sesuai SNI 2415:2016 Pasal 3.1: A > 3 km² (300 Ha)

export const nakayasuPilotData: PilotDataNakayasu[] = [
 {
 name: "DAS Citarum Hulu",
 description: "DAS besar dengan karakteristik pegunungan (SNI Compliant: A > 3 km²)",
 location: {
 channelName: "Sungai Citarum",
 kabupaten: "Kabupaten Bandung",
 kecamatan: "Kertasari",
 desa: "Cibeureum",
 coordinates: { lat: -7.1447, lng: 107.5872 }
 },
 inputs: {
 A: 450, // DAS besar 450 km² (SESUAI SNI: > 3 km²)
 L: 35, // Panjang sungai 35 km
 Ro: 80, // Hujan efektif rencana (mm) - dari analisis frekuensi
 Alpha: 2.0 // Karakteristik DAS pegunungan
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
 description: "DAS sedang dengan topografi bergelombang (SNI Compliant: A > 3 km²)",
 location: {
 channelName: "Sungai Ciliwung",
 kabupaten: "Kota Depok",
 kecamatan: "Sukmajaya",
 desa: "Cisalak",
 coordinates: { lat: -6.3897, lng: 106.8317 }
 },
 inputs: {
 A: 180, // DAS sedang 180 km² (SESUAI SNI: > 3 km²)
 L: 22, // Panjang sungai 22 km
 Ro: 90, // Hujan efektif rencana (mm) - dari analisis frekuensi
 Alpha: 2.2 // Karakteristik DAS urban
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
 description: "DAS besar dengan karakteristik dataran tinggi (SNI Compliant: A > 3 km²)",
 location: {
 channelName: "Sungai Brantas",
 kabupaten: "Kota Batu",
 kecamatan: "Batu",
 desa: "Sisir",
 coordinates: { lat: -7.8753, lng: 112.5281 }
 },
 inputs: {
 A: 620, // DAS sangat besar 620 km² (SESUAI SNI: > 3 km²)
 L: 48, // Panjang sungai 48 km
 Ro: 70, // Hujan efektif rencana (mm) - dari analisis frekuensi
 Alpha: 1.8 // Karakteristik DAS dataran tinggi
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
 description: "DAS sangat besar dengan topografi datar (SNI Compliant: A > 3 km²)",
 location: {
 channelName: "Sungai Bengawan Solo",
 kabupaten: "Kabupaten Sragen",
 kecamatan: "Sragen",
 desa: "Sragen Kulon",
 coordinates: { lat: -7.4253, lng: 111.0081 }
 },
 inputs: {
 A: 1250, // DAS sangat besar 1250 km² (SESUAI SNI: > 3 km²)
 L: 65, // Panjang sungai 65 km
 Ro: 65, // Hujan efektif rencana (mm) - dari analisis frekuensi
 Alpha: 2.5 // Karakteristik DAS dataran luas
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
 description: "DAS pegunungan dengan lereng curam (SNI Compliant: A > 3 km²)",
 location: {
 channelName: "Sungai Progo",
 kabupaten: "Kabupaten Magelang",
 kecamatan: "Salaman",
 desa: "Ngargosari",
 coordinates: { lat: -7.5281, lng: 110.1531 }
 },
 inputs: {
 A: 380, // DAS sedang-besar 380 km² (SESUAI SNI: > 3 km²)
 L: 28, // Panjang sungai 28 km
 Ro: 85, // Hujan efektif rencana (mm) - dari analisis frekuensi
 Alpha: 1.7 // Karakteristik DAS pegunungan curam
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
 description: "DAS dengan karakteristik campuran pegunungan-dataran (SNI Compliant: A > 3 km²)",
 location: {
 channelName: "Sungai Serayu",
 kabupaten: "Kabupaten Banyumas",
 kecamatan: "Purwokerto Utara",
 desa: "Grendeng",
 coordinates: { lat: -7.4153, lng: 109.2381 }
 },
 inputs: {
 A: 520, // DAS besar 520 km² (SESUAI SNI: > 3 km²)
 L: 42, // Panjang sungai 42 km
 Ro: 75, // Hujan efektif rencana (mm) - dari analisis frekuensi
 Alpha: 2.1 // Karakteristik DAS campuran
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
// DATA PILOT METODE HASPERS & OSUGI
// ============================================
// Untuk DAS 3-100 km²

export const haspersPilotData: PilotDataModifiedRational[] = [
 {
 name: "DAS Cikapundung Tengah",
 description: "DAS menengah dengan topografi bergelombang (3-100 km²)",
 location: {
 channelName: "Sungai Cikapundung",
 kabupaten: "Kabupaten Bandung Barat",
 kecamatan: "Lembang",
 desa: "Wangunharja",
 coordinates: { lat: -6.8147, lng: 107.6181 }
 },
 inputs: { A: 25, L: 12, S: 2.5, I: 110 },
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
 name: "DAS Cisadane Hulu",
 description: "DAS sedang dengan kemiringan moderat (3-100 km²)",
 location: {
 channelName: "Sungai Cisadane",
 kabupaten: "Kota Bogor",
 kecamatan: "Bogor Barat",
 desa: "Cilendek",
 coordinates: { lat: -6.5897, lng: 106.7731 }
 },
 inputs: { A: 45, L: 18, S: 1.8, I: 105 },
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
 name: "DAS Kali Bekasi",
 description: "DAS urban-rural dengan drainase campuran (3-100 km²)",
 location: {
 channelName: "Kali Bekasi",
 kabupaten: "Kabupaten Bekasi",
 kecamatan: "Tambun Selatan",
 desa: "Setia Asih",
 coordinates: { lat: -6.2681, lng: 107.0531 }
 },
 inputs: { A: 68, L: 22, S: 1.2, I: 115 },
 returnPeriods: [
 { period: 'Q2', rainfall: 85 },
 { period: 'Q5', rainfall: 105 },
 { period: 'Q10', rainfall: 125 },
 { period: 'Q25', rainfall: 145 },
 { period: 'Q50', rainfall: 165 },
 { period: 'Q100', rainfall: 185 }
 ]
 }
];

// ============================================
// DATA PILOT METODE DER WEDUWEN
// ============================================
// Untuk DAS 3-100 km²

export const weduwenPilotData: PilotDataModifiedRational[] = [
 {
 name: "DAS Cimanuk Hulu",
 description: "DAS pegunungan dengan lereng curam (3-100 km²)",
 location: {
 channelName: "Sungai Cimanuk",
 kabupaten: "Kabupaten Garut",
 kecamatan: "Wanaraja",
 desa: "Sukamaju",
 coordinates: { lat: -7.1781, lng: 107.9281 }
 },
 inputs: { A: 35, L: 15, S: 3.2, I: 120 },
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
 name: "DAS Citanduy Tengah",
 description: "DAS dengan topografi berbukit (3-100 km²)",
 location: {
 channelName: "Sungai Citanduy",
 kabupaten: "Kabupaten Ciamis",
 kecamatan: "Banjar",
 desa: "Balokang",
 coordinates: { lat: -7.3681, lng: 108.5381 }
 },
 inputs: { A: 52, L: 20, S: 2.1, I: 100 },
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
 name: "DAS Cipunagara",
 description: "DAS dataran tinggi dengan vegetasi sedang (3-100 km²)",
 location: {
 channelName: "Sungai Cipunagara",
 kabupaten: "Kabupaten Subang",
 kecamatan: "Cijambe",
 desa: "Cibogo",
 coordinates: { lat: -6.5531, lng: 107.7631 }
 },
 inputs: { A: 78, L: 25, S: 1.5, I: 95 },
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
// DATA PILOT METODE MELCHIOR
// ============================================
// Untuk DAS > 100 km²

export const melchiorPilotData: PilotDataModifiedRational[] = [
 {
 name: "DAS Citarum Tengah",
 description: "DAS besar dengan karakteristik dataran (> 100 km²)",
 location: {
 channelName: "Sungai Citarum",
 kabupaten: "Kabupaten Purwakarta",
 kecamatan: "Jatiluhur",
 desa: "Jatimekar",
 coordinates: { lat: -6.5281, lng: 107.3631 }
 },
 inputs: { A: 280, L: 42, S: 0.8, I: 90, C: 0.55 },
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
 name: "DAS Cimanuk Hilir",
 description: "DAS sangat besar dengan topografi datar (> 100 km²)",
 location: {
 channelName: "Sungai Cimanuk",
 kabupaten: "Kabupaten Indramayu",
 kecamatan: "Patrol",
 desa: "Sukahaji",
 coordinates: { lat: -6.7031, lng: 108.2131 }
 },
 inputs: { A: 450, L: 65, S: 0.5, I: 85, C: 0.48 },
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
 name: "DAS Serayu Hilir",
 description: "DAS besar dengan karakteristik dataran rendah (> 100 km²)",
 location: {
 channelName: "Sungai Serayu",
 kabupaten: "Kabupaten Cilacap",
 kecamatan: "Majenang",
 desa: "Sindangkasih",
 coordinates: { lat: -7.2981, lng: 108.7631 }
 },
 inputs: { A: 620, L: 78, S: 0.6, I: 80, C: 0.42 },
 returnPeriods: [
 { period: 'Q2', rainfall: 60 },
 { period: 'Q5', rainfall: 80 },
 { period: 'Q10', rainfall: 100 },
 { period: 'Q25', rainfall: 120 },
 { period: 'Q50', rainfall: 140 },
 { period: 'Q100', rainfall: 160 }
 ]
 }
];

// ============================================
// DATA PILOT HSS GAMMA I
// ============================================
// Untuk DAS kecil-menengah (Sri Harto, 1993)

export const gamma1PilotData: PilotDataGamma1[] = [
 {
 name: "DAS Kecil Pegunungan - Gamma I",
 description: "DAS kecil dengan karakteristik pegunungan (HSS Gamma I)",
 location: {
 channelName: "Sungai Cikapundung",
 kabupaten: "Kabupaten Bandung",
 kecamatan: "Parongpong",
 desa: "Cihideung",
 coordinates: { lat: -6.8281, lng: 107.5831 }
 },
 inputs: { A: 85, L: 18, Ro: 80, SF: 1.0 },
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
 name: "DAS Menengah Urban - Gamma I",
 description: "DAS menengah dengan karakteristik urban (HSS Gamma I)",
 location: {
 channelName: "Kali Pesanggrahan",
 kabupaten: "Jakarta Barat",
 kecamatan: "Kembangan",
 desa: "Meruya Utara",
 coordinates: { lat: -6.1881, lng: 106.7381 }
 },
 inputs: { A: 120, L: 24, Ro: 90, SF: 1.2 },
 returnPeriods: [
 { period: 'Q2', rainfall: 90 },
 { period: 'Q5', rainfall: 115 },
 { period: 'Q10', rainfall: 135 },
 { period: 'Q25', rainfall: 160 },
 { period: 'Q50', rainfall: 180 },
 { period: 'Q100', rainfall: 200 }
 ]
 }
];

// ============================================
// DATA PILOT HSS SNYDER
// ============================================
// Untuk DAS besar (Snyder, 1938)

export const snyderPilotData: PilotDataSnyder[] = [
 {
 name: "DAS Besar Dataran - Snyder",
 description: "DAS besar dengan karakteristik dataran (HSS Snyder)",
 location: {
 channelName: "Sungai Citarum",
 kabupaten: "Kabupaten Karawang",
 kecamatan: "Tegalwaru",
 desa: "Wadas",
 coordinates: { lat: -6.3531, lng: 107.3081 }
 },
 inputs: { A: 850, L: 58, Lc: 29, Ro: 65, Ct: 0.6, Cp: 0.6 },
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
 name: "DAS Sangat Besar - Snyder",
 description: "DAS sangat besar dengan topografi kompleks (HSS Snyder)",
 location: {
 channelName: "Sungai Bengawan Solo",
 kabupaten: "Kabupaten Bojonegoro",
 kecamatan: "Bojonegoro",
 desa: "Kadipaten",
 coordinates: { lat: -7.1531, lng: 111.8831 }
 },
 inputs: { A: 1580, L: 82, Lc: 41, Ro: 60, Ct: 0.7, Cp: 0.65 },
 returnPeriods: [
 { period: 'Q2', rainfall: 60 },
 { period: 'Q5', rainfall: 80 },
 { period: 'Q10', rainfall: 100 },
 { period: 'Q25', rainfall: 120 },
 { period: 'Q50', rainfall: 140 },
 { period: 'Q100', rainfall: 160 }
 ]
 }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getRationalPilotByName(name: string): PilotDataRational | undefined {
 return rationalPilotData.find(data => data.name === name);
}

export function getHaspersPilotByName(name: string): PilotDataModifiedRational | undefined {
 return haspersPilotData.find(data => data.name === name);
}

export function getWeduwenPilotByName(name: string): PilotDataModifiedRational | undefined {
 return weduwenPilotData.find(data => data.name === name);
}

export function getMelchiorPilotByName(name: string): PilotDataModifiedRational | undefined {
 return melchiorPilotData.find(data => data.name === name);
}

export function getNakayasuPilotByName(name: string): PilotDataNakayasu | undefined {
 return nakayasuPilotData.find(data => data.name === name);
}

export function getGamma1PilotByName(name: string): PilotDataGamma1 | undefined {
 return gamma1PilotData.find(data => data.name === name);
}

export function getSnyderPilotByName(name: string): PilotDataSnyder | undefined {
 return snyderPilotData.find(data => data.name === name);
}

export function getAllRationalPilotNames(): string[] {
 return rationalPilotData.map(data => data.name);
}

export function getAllHaspersPilotNames(): string[] {
 return haspersPilotData.map(data => data.name);
}

export function getAllWeduwenPilotNames(): string[] {
 return weduwenPilotData.map(data => data.name);
}

export function getAllMelchiorPilotNames(): string[] {
 return melchiorPilotData.map(data => data.name);
}

export function getAllNakayasuPilotNames(): string[] {
 return nakayasuPilotData.map(data => data.name);
}

export function getAllGamma1PilotNames(): string[] {
 return gamma1PilotData.map(data => data.name);
}

export function getAllSnyderPilotNames(): string[] {
 return snyderPilotData.map(data => data.name);
}
