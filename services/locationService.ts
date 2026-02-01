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
    const kabupaten = [...new Set(westJavaData.map(item => item.kabupaten))]
      .filter(k => k && k.trim() !== '') // Filter out empty values
      .sort();
    return kabupaten;
  },

  getKecamatan(kabupaten: string): string[] {
    const kecamatan = westJavaData
      .filter(item => item.kabupaten === kabupaten)
      .map(item => item.kecamatan)
      .filter(k => k && k.trim() !== ''); // Filter out empty values
    return [...new Set(kecamatan)].sort();
  },

  getDesa(kabupaten: string, kecamatan: string): string[] {
    const desa = westJavaData
      .filter(item => item.kabupaten === kabupaten && item.kecamatan === kecamatan)
      .map(item => item.desa)
      .filter(d => d && d.trim() !== ''); // Filter out empty values
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