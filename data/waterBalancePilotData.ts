/**
 * Data Pilot untuk Analisis Neraca Air
 * =====================================
 * Data valid untuk testing dan demonstrasi aplikasi
 * Berdasarkan kondisi DAS di Indonesia
 */

export interface PilotDataWaterBalance {
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
    population: number;
    agricultureArea: number;
    domesticStandard: number;
    irrigationDemand: number;
    monthlySupply: number[];
  };
}

export const waterBalancePilotData: PilotDataWaterBalance[] = [
  {
    name: "DAS Citarum - Surplus Tinggi",
    description: "DAS dengan ketersediaan air melimpah sepanjang tahun",
    location: {
      channelName: "Sungai Citarum Hulu",
      kabupaten: "Kabupaten Bandung",
      kecamatan: "Kertasari",
      desa: "Cibeureum",
      coordinates: { lat: -7.1447, lng: 107.5872 }
    },
    inputs: {
      population: 15000,
      agricultureArea: 250,
      domesticStandard: 120,
      irrigationDemand: 1.2,
      monthlySupply: [3.5, 3.2, 2.8, 2.5, 2.2, 1.8, 1.5, 1.4, 1.6, 2.0, 2.5, 3.0]
    }
  },
  {
    name: "DAS Ciliwung - Defisit Musim Kemarau",
    description: "DAS urban dengan defisit air di musim kemarau",
    location: {
      channelName: "Sungai Ciliwung Tengah",
      kabupaten: "Kota Depok",
      kecamatan: "Sukmajaya",
      desa: "Cisalak",
      coordinates: { lat: -6.3897, lng: 106.8317 }
    },
    inputs: {
      population: 25000,
      agricultureArea: 150,
      domesticStandard: 150,
      irrigationDemand: 1.5,
      monthlySupply: [2.8, 2.5, 2.2, 1.8, 1.5, 1.0, 0.8, 0.7, 0.9, 1.3, 1.8, 2.3]
    }
  },
  {
    name: "DAS Brantas - Pertanian Intensif",
    description: "DAS dengan kebutuhan irigasi tinggi untuk pertanian",
    location: {
      channelName: "Sungai Brantas Tengah",
      kabupaten: "Kabupaten Mojokerto",
      kecamatan: "Sooko",
      desa: "Canggu",
      coordinates: { lat: -7.5531, lng: 112.4281 }
    },
    inputs: {
      population: 12000,
      agricultureArea: 400,
      domesticStandard: 100,
      irrigationDemand: 1.8,
      monthlySupply: [3.0, 2.7, 2.4, 2.0, 1.7, 1.3, 1.0, 0.9, 1.1, 1.5, 2.0, 2.5]
    }
  },
  {
    name: "DAS Serayu - Keseimbangan Optimal",
    description: "DAS dengan neraca air yang seimbang",
    location: {
      channelName: "Sungai Serayu Hilir",
      kabupaten: "Kabupaten Cilacap",
      kecamatan: "Kesugihan",
      desa: "Karangpucung",
      coordinates: { lat: -7.7531, lng: 109.0281 }
    },
    inputs: {
      population: 8000,
      agricultureArea: 180,
      domesticStandard: 110,
      irrigationDemand: 1.3,
      monthlySupply: [2.2, 2.0, 1.8, 1.5, 1.3, 1.0, 0.9, 0.8, 1.0, 1.3, 1.7, 2.0]
    }
  },
  {
    name: "DAS Progo - Populasi Tinggi",
    description: "DAS dengan kebutuhan domestik tinggi",
    location: {
      channelName: "Sungai Progo Tengah",
      kabupaten: "Kabupaten Sleman",
      kecamatan: "Mlati",
      desa: "Sendangadi",
      coordinates: { lat: -7.7281, lng: 110.3531 }
    },
    inputs: {
      population: 35000,
      agricultureArea: 120,
      domesticStandard: 140,
      irrigationDemand: 1.1,
      monthlySupply: [2.5, 2.3, 2.0, 1.7, 1.4, 1.1, 0.9, 0.8, 1.0, 1.4, 1.8, 2.2]
    }
  },
  {
    name: "DAS Bengawan Solo - Kritis Kemarau",
    description: "DAS besar dengan defisit kritis di musim kemarau",
    location: {
      channelName: "Bengawan Solo Hilir",
      kabupaten: "Kabupaten Gresik",
      kecamatan: "Kebomas",
      desa: "Randuagung",
      coordinates: { lat: -7.1781, lng: 112.6281 }
    },
    inputs: {
      population: 20000,
      agricultureArea: 300,
      domesticStandard: 130,
      irrigationDemand: 1.6,
      monthlySupply: [2.0, 1.8, 1.5, 1.2, 0.9, 0.6, 0.5, 0.4, 0.6, 1.0, 1.5, 1.8]
    }
  }
];

export function getWaterBalancePilotByName(name: string): PilotDataWaterBalance | undefined {
  return waterBalancePilotData.find(data => data.name === name);
}

export function getAllWaterBalancePilotNames(): string[] {
  return waterBalancePilotData.map(data => data.name);
}
