
export enum CalculationType {
  MANNING = 'MANNING',
  RATIONAL = 'RATIONAL',
  WATER_BALANCE = 'WATER_BALANCE',
  EMBUNG = 'EMBUNG'
}

export type ExtendedCalculationType = CalculationType;

export enum ChannelShape {
  TRAPEZOID = 'TRAPEZOID', 
  CIRCULAR = 'CIRCULAR'    
}

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface SiteIdentity {
  channelName: string;
  regency: string;
  district: string;
  village: string;
  location?: GeoLocationData;
  photoUrl?: string;
}

export interface ManningInputs {
  site?: SiteIdentity;
  shape: ChannelShape; 
  roughness: number; 
  slope: number; 
  width: number; 
  topWidth: number; // Lebar Atas Fisik
  diameter: number; 
  depth: number; 
  totalDepth: number; 
  sideSlope: number; 
}

export interface RationalInputs {
  site?: SiteIdentity;
  runoffCoefficient: number; 
  area: number; 
  rainfallDesign: number; 
  flowLength: number; 
  catchmentSlope: number; 
}

export interface CalculationResult {
  id: string;
  type: ExtendedCalculationType;
  date: string;
  inputs: ManningInputs | RationalInputs;
  outputs: Record<string, number | string>;
  location?: GeoLocationData;
  photoUrl?: string; 
  notes?: string;
  saved?: boolean;
}

export interface RoughnessMaterial {
  name: string;
  value: number;
  category: string;
}

export interface RunoffSurface {
  name: string;
  value: number;
  category: string;
}
