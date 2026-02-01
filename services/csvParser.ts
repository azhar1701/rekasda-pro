import { LocationData } from './locationService';

export class CSVParser {
  private static data: LocationData[] | null = null;

  static async loadData(): Promise<LocationData[]> {
    if (this.data) return this.data;

    try {
      const response = await fetch('/docs/diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      const parsedData = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = this.parseCSVLine(line);
          
          if (values.length < 20) {
            return null;
          }
          
          return {
            id: values[0]?.trim() || '',
            provinsi: values[5]?.trim() || '',
            kabupaten: values[6]?.trim() || '',
            kecamatan: values[7]?.trim() || '',
            desa: values[8]?.trim() || '',
            latitude: values[17] && values[17].trim() ? parseFloat(values[17].trim()) : undefined,
            longitude: values[18] && values[18].trim() ? parseFloat(values[18].trim()) : undefined,
            kodePos: values[19]?.trim() || ''
          };
        })
        .filter((item): item is LocationData => {
          return item !== null && 
                 item.provinsi === 'JAWA BARAT' && 
                 Boolean(item.kabupaten) && 
                 Boolean(item.kecamatan) && 
                 Boolean(item.desa);
        });

      this.data = parsedData;
      console.log(`Loaded ${this.data.length} location records for Jawa Barat`);
      
      return this.data;
    } catch (error) {
      console.error('Failed to load CSV data:', error);
      return [];
    }
  }
  
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }
}