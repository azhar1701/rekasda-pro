import { LocationData } from './locationService';

export class CSVParser {
  private static data: LocationData[] | null = null;

  static async loadData(): Promise<LocationData[]> {
    if (this.data) return this.data;

    try {
      const response = await fetch('/docs/diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv');
      const csvText = await response.text();
      
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');
      
      this.data = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',');
          return {
            id: values[0],
            provinsi: values[5],
            kabupaten: values[6],
            kecamatan: values[7],
            desa: values[8],
            latitude: values[17] ? parseFloat(values[17]) : undefined,
            longitude: values[18] ? parseFloat(values[18]) : undefined,
            kodePos: values[19]
          };
        })
        .filter(item => item.provinsi === 'JAWA BARAT');

      return this.data;
    } catch (error) {
      console.error('Failed to load CSV data:', error);
      return [];
    }
  }
}