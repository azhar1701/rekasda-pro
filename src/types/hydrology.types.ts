export interface StasiunHidrologi {
  id: string;
  nama_stasiun: string;
  koordinat_x: number | null;
  koordinat_y: number | null;
  elevasi: number | null;
  keterangan: string | null;
  created_at?: string;
}

export interface DataHujan {
  id: string;
  stasiun_id: string;
  tanggal: string; 
  curah_hujan: number; 
  created_at?: string;
}

export interface ThiessenStasiunConfig {
  stasiunId: string;
  namaStasiun: string;
  luasPengaruh: number;  
  bobot: number;         
}

export interface IsohyetConfig {
  id: string;
  label: string; 
  curahHujanRataRata: number; 
  luasAntarGaris: number; 
  bobot: number; 
  annualMax?: number[];
}

export interface HasilThiessen {
  stasiunConfigs: ThiessenStasiunConfig[];
  totalLuas: number;
  hujanRataRataDAS: number[];  
}

export interface HasilARF {
  arfValue: number;           
  arfOverride: number | null; 
  hujanTitik: number;         
  hujanDAS: number;           
}

export interface DesignRainfallValue {
  Tr: number;    
  R24: number;   
  kalaUlang: number;
  curahHujan: number;
}

export interface HasilAnalisisFrekuensi {
  metodeTerpilih: string;
  lulusUjiKecocokan: boolean;
  curahHujanRencana: DesignRainfallValue[];
  selectedKalaUlang: number | null;
  qcResults?: QualityControlResults;
}

export interface QCStatus {
  konsisten: boolean;
  bebasOutlier: boolean;
  homogen: boolean;
}

export interface QualityControlResults {
  [stasiunId: string]: {
    konsistensi: { isPassed: boolean; method: 'RAPS' | 'DoubleMass'; rapsValue?: number; threshold?: number; message: string; };
    homogenitas: { isPassed: boolean; method: 'F-Test' | 'T-Test'; fValue?: number; tValue?: number; criticalValue?: number; message: string; };
    outlier: { isPassed: boolean; method: 'Grubbs-Beck' | 'Rosner'; outlierIndices: number[]; message: string; };
    overallPassed: boolean;
  } | any;
  overallPassed?: boolean;
}

export interface LandCoverParameters {
  C?: number;
  CN?: number;
  phiIndex?: number;
  method: 'C' | 'CN' | 'PhiIndex';
  description?: string;
}

export interface MorfometriDAS {
  luasDAS: number;           
  panjangSungai: number;     
  kemiringanSungai: number;  
  elevasi: number;           
}

export interface TutupanLahanItem {
  id: string;
  jenis: string;
  luas: number;    
  nilaiC: number;  
  nilaiCN: number; 
}

export interface TutupanLahan {
  items: TutupanLahanItem[];
  koefisienPengaliranGabungan: number; 
  curveNumberGabungan: number;         
  totalLuas: number;                   
}

export interface CurahHujanWilayah {
  metode: 'aljabar' | 'thiessen' | 'isohyet';
  stasiunConfigs: ThiessenStasiunConfig[];
  isohyetConfigs?: IsohyetConfig[];
  hujanRataRata: number; 
  hujanRataRataAMS?: number[];
}

export interface AnalisisFrekuensi {
  parameterStatistik: {
    asli: { mean: number; stdDev: number; cv: number; cs: number; ck: number };
    log: { mean: number; stdDev: number; cv: number; cs: number; ck: number };
  } | null;
  hasilDistribusi: Array<{
    method: string;
    values: DesignRainfallValue[];
  }> | null;
  ujiKecocokan: Array<{
    method: string;
    chiSquare: { statistic: number; critical: number; accepted: boolean };
    kolmogorovSmirnov: { statistic: number; critical: number; accepted: boolean };
  }> | null;
  metodeTerpilih: string | null;
  dataHujanInput: number[];
}

export interface EffectiveRainfallResult {
  totalRainfall: number;
  effectiveRainfall: number;
  losses: number;
  method: string;
  hourlyDistribution?: number[];
}

export interface HasilBanjir {
  debitPuncak: number;
  hidrograf: { time: number; inflow: number }[];
  method?: string;
}

export interface HSSComparisonResult {
  method: string;
  Qp: number;
  Tp: number;
  Tb: number;
  hydrograph: { time: number; discharge: number }[];
  color: string;
}

export interface HasilKonvolusi {
  floodHydrograph: { time: number; discharge: number }[];
  peakDischarge: number;
  timeToPeak: number;
  totalVolume: number;
  componentHydrographs: { time: number; discharge: number }[][];
}

export interface HasilNeraca {
  isSurplus: boolean;
  totalSurplusDefisit: number;
  bulanKritis: string;
  chartData: { bulan: string; ketersediaan: number; kebutuhan: number; neraca: number; }[];
}

export interface HasilEmbung {
  isAman: boolean;
  reduksiPuncak: number; 
  umurSedimen: number;
}

export interface HasilMock {
  monthlyResults: {
    month: string;
    precipitation: number;
    eto: number;
    waterSurplus: number;
    baseFlow: number;
    directRunoff: number;
    totalRunoff: number;
    discharge: number;
    daysInMonth: number;
  }[];
  qAndalan: number;
  probability: number;
  metode: 'mock' | 'manual' | 'weibull';
}

export interface NeracaFinalRow {
  month: string;
  ketersediaan: number;
  irigasi: number;
  airBaku: number;
  lingkungan: number;
  totalKebutuhan: number;
  neraca: number;
  status: 'Surplus' | 'Defisit' | 'Seimbang';
}

export interface IdentitasLokasi {
  namaPekerjaan: string;
  namaDAS: string;
  namaSungai: string;
  provinsi: string;
  kabupaten: string;
  koordinat: { lat: number | null; lng: number | null; };
}
