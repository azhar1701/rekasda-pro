// Location data service for West Java regions
export interface LocationData {
  id: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  latitude?: number;
  longitude?: number;
  kodePos?: string;
}

import { CSVParser } from './csvParser';

let westJavaData: LocationData[] = [];

export const locationService = {
  async init() {
    westJavaData = await CSVParser.loadData();
  },

  getKabupaten(): string[] {
    const kabupaten = [...new Set(westJavaData.map(item => item.kabupaten))];
    return kabupaten.sort();
  },

  getKecamatan(kabupaten: string): string[] {
    const kecamatan = westJavaData
      .filter(item => item.kabupaten === kabupaten)
      .map(item => item.kecamatan);
    return [...new Set(kecamatan)].sort();
  },

  getDesa(kabupaten: string, kecamatan: string): string[] {
    const desa = westJavaData
      .filter(item => item.kabupaten === kabupaten && item.kecamatan === kecamatan)
      .map(item => item.desa);
    return [...new Set(desa)].sort();
  },

  getLocationData(kabupaten: string, kecamatan: string, desa: string): LocationData | null {
    return westJavaData.find(item => 
      item.kabupaten === kabupaten && 
      item.kecamatan === kecamatan && 
      item.desa === desa
    ) || null;
  }
};