import { computeDesignFloodHydrograph, ConvolutionResult, HydrographPoint } from '@/lib/engine/flood/convolution';

export interface FloodWorkerInput {
  unitHydrograph: HydrographPoint[];
  abmRainfall: number[];
  uhTimeStep?: number;
}

// Define the message types
export type FloodWorkerMessage = 
  | { type: 'CALCULATE_FLOOD'; payload: FloodWorkerInput; id: string }
  | { type: 'CALCULATE_BATCH_FLOOD'; payload: FloodWorkerInput[]; id: string };

export type FloodWorkerResponse = 
  | { type: 'FLOOD_RESULT'; payload: ConvolutionResult; id: string }
  | { type: 'BATCH_FLOOD_RESULT'; payload: ConvolutionResult[]; id: string }
  | { type: 'ERROR'; error: string; id: string };

self.onmessage = (e: MessageEvent<FloodWorkerMessage>) => {
  const { type, payload, id } = e.data;

  try {
    if (type === 'CALCULATE_FLOOD') {
      const result = computeDesignFloodHydrograph(
        payload.unitHydrograph, 
        payload.abmRainfall, 
        payload.uhTimeStep
      );
      self.postMessage({ type: 'FLOOD_RESULT', payload: result, id } as FloodWorkerResponse);
    } else if (type === 'CALCULATE_BATCH_FLOOD') {
      const results = payload.map(input => computeDesignFloodHydrograph(
        input.unitHydrograph, 
        input.abmRainfall, 
        input.uhTimeStep
      ));
      self.postMessage({ type: 'BATCH_FLOOD_RESULT', payload: results, id } as FloodWorkerResponse);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      error: error instanceof Error ? error.message : 'Unknown worker error', 
      id 
    } as FloodWorkerResponse);
  }
};
