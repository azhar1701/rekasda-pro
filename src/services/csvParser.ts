import { LocationData } from './locationService';

export class CSVParser {
  private static data: LocationData[] = [];

  static async loadData(): Promise<LocationData[]> {
    if (this.data.length > 0) return this.data;

    try {
      // Try multiple possible paths for the CSV file
      const possiblePaths = [
        '/docs/diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv',
        './docs/diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv',
        '/public/docs/diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv'
      ];
      
      let response: Response | null = null;
      let lastError: Error | null = null;
      
      for (const path of possiblePaths) {
        try {
          console.log(`Trying to load CSV from: ${path}`);
          response = await fetch(path);
          if (response.ok) {
            console.log(`Successfully loaded CSV from: ${path}`);
            break;
          } else {
            console.warn(`Failed to load from ${path}: ${response.status}`);
          }
        } catch (error) {
          console.warn(`Error loading from ${path}:`, error);
          lastError = error as Error;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to load CSV from all paths. Last error: ${lastError?.message || 'Unknown error'}`);
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
        .filter((item): item is NonNullable<typeof item> => {
          return item !== null && 
                 item.provinsi === 'JAWA BARAT' && 
                 Boolean(item.kabupaten) && 
                 Boolean(item.kecamatan) && 
                 Boolean(item.desa);
        }) as LocationData[];

      this.data = parsedData;
      console.log(`Loaded ${parsedData.length} location records for Jawa Barat`);
      
      return parsedData;
    } catch (error) {
      console.error('Failed to load CSV data:', error);
      
      // Fallback: return some basic data for testing
      console.warn('Using fallback location data');
      this.data = [
        {
          id: '1',
          provinsi: 'JAWA BARAT',
          kabupaten: 'KAB. BOGOR',
          kecamatan: 'CIBINONG',
          desa: 'PONDOK RAJEG',
          latitude: -6.44385,
          longitude: 106.82049,
          kodePos: '16913'
        },
        {
          id: '2',
          provinsi: 'JAWA BARAT',
          kabupaten: 'KAB. SUKABUMI',
          kecamatan: 'PALABUHANRATU',
          desa: 'PALABUHANRATU',
          latitude: -6.90391,
          longitude: 106.9375,
          kodePos: '43341'
        },
        {
          id: '3',
          provinsi: 'JAWA BARAT',
          kabupaten: 'KAB. CIANJUR',
          kecamatan: 'CIANJUR',
          desa: 'NAGRAK',
          latitude: -6.83631,
          longitude: 107.11156,
          kodePos: '43219'
        }
      ];
      
      return this.data;
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