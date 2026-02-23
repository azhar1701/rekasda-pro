// Strict Database Schema Types - Single Source of Truth
export interface CalculationRecord {
  id: string;
  user_id?: string | null;
  site_name: string;
  calculation_type: 'manning' | 'rational' | 'water-balance';
  input_data: Record<string, any>;
  result_data: Record<string, any>;
  location: GeoLocation | null;
  geo_location?: string | null; // PostGIS hex representation or Point format
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

export interface Document {
  id: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  source_url?: string;
  created_at: string;
}

export interface DocumentEmbedding {
  id: string;
  document_id: string;
  embedding: number[];
  content_chunk: string;
  metadata: Record<string, any>;
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
    ['manning', 'rational', 'water-balance'].includes(data.calculation_type) &&
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
