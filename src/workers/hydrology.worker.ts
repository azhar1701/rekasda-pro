/**
 * Hydrology Web Worker
 * =====================
 * Offload CPU-intensive convolution calculations to background thread
 * Prevents UI freezing during matrix superposition operations
 * 
 * Standard: Enterprise Performance Engineering
 */

import { calculateConvolution, type ConvolutionInput, type ConvolutionResult } from '../lib/utils/convolutionUtils';

export interface WorkerMessage {
  type: 'CALCULATE_CONVOLUTION';
  payload: ConvolutionInput;
  id: string;
}

export interface WorkerResponse {
  type: 'CONVOLUTION_RESULT' | 'CONVOLUTION_ERROR';
  payload: ConvolutionResult | { error: string };
  id: string;
}

// Listen for messages from main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;

  try {
    if (type === 'CALCULATE_CONVOLUTION') {
      // Execute heavy computation in background
      const result = calculateConvolution(payload);

      // Send result back to main thread
      const response: WorkerResponse = {
        type: 'CONVOLUTION_RESULT',
        payload: result,
        id
      };
      self.postMessage(response);
    }
  } catch (error) {
    // Send error back to main thread
    const response: WorkerResponse = {
      type: 'CONVOLUTION_ERROR',
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      id
    };
    self.postMessage(response);
  }
};

// Export empty object for TypeScript module resolution
export {};
