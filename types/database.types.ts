// Strict Database Schema Types - Single Source of Truth
export interface CalculationRecord {
  id: string;
  site_name: string;
  calculation_type: 'manning' | 'rational';
  input_data: Record<string, any>;
  result_data: Record<string, any>;
  location: GeoLocation | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface CalculationOutputs {
  Discharge: number;
  Velocity?: number;
  Area?: number;
  [key: string]: number | string | undefined;
}

// Type Guards for Runtime Validation
export function isValidCalculationRecord(data: any): data is CalculationRecord {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.site_name === 'string' &&
    ['manning', 'rational'].includes(data.calculation_type) &&
    typeof data.input_data === 'object' &&
    typeof data.result_data === 'object'
  );
}

export function isValidGeoLocation(data: any): data is GeoLocation {
  return (
    data &&
    typeof data.latitude === 'number' &&
    typeof data.longitude === 'number' &&
    typeof data.accuracy === 'number' &&
    typeof data.timestamp === 'number'
  );
}
