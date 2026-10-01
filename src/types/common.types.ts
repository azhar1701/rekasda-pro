export enum CalculationType {
  MANNING = 'MANNING',
  RATIONAL = 'RATIONAL',
  WATER_BALANCE = 'WATER_BALANCE',
  EMBUNG = 'EMBUNG'
}

export enum ChannelShape {
  TRAPEZOID = 'TRAPEZOID',
  CIRCULAR = 'CIRCULAR',
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

export interface CalculationResult {
  id: string;
  type: CalculationType;
  date: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, number | string>;
  location?: GeoLocationData;
  photoUrl?: string;
  notes?: string;
  saved?: boolean;
}
