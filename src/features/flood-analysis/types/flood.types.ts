export interface HydrographDataPoint {
 time: number;
 discharge: number;
}

export interface FloodAnalysisData {
 qPeak: number;
 tPeak: number;
 volume: number;
 hydrograph: HydrographDataPoint[];
}
