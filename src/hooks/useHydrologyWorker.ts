/**
 * useHydrologyWorker Hook
 * =======================
 * React hook for async communication with Hydrology Web Worker
 * Provides non-blocking convolution calculations with loading state
 * 
 * Usage:
 * const { calculateAsync, isCalculating, result, error } = useHydrologyWorker();
 * 
 * Standard: Enterprise Performance Engineering
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ConvolutionInput, ConvolutionResult } from '../lib/utils/convolutionUtils';
import type { WorkerMessage, WorkerResponse } from '../workers/hydrology.worker';

interface UseHydrologyWorkerReturn {
  calculateAsync: (input: ConvolutionInput) => Promise<ConvolutionResult>;
  isCalculating: boolean;
  result: ConvolutionResult | null;
  error: string | null;
}

export function useHydrologyWorker(): UseHydrologyWorkerReturn {
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<ConvolutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<Map<string, {
    resolve: (result: ConvolutionResult) => void;
    reject: (error: Error) => void;
  }>>(new Map());

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/hydrology.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Handle messages from worker
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, payload, id } = event.data;
      const pending = pendingRequestsRef.current.get(id);

      if (!pending) return;

      if (type === 'CONVOLUTION_RESULT') {
        setResult(payload as ConvolutionResult);
        setError(null);
        setIsCalculating(false);
        pending.resolve(payload as ConvolutionResult);
      } else if (type === 'CONVOLUTION_ERROR') {
        const errorMsg = (payload as { error: string }).error;
        setError(errorMsg);
        setResult(null);
        setIsCalculating(false);
        pending.reject(new Error(errorMsg));
      }

      pendingRequestsRef.current.delete(id);
    };

    // Cleanup on unmount
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Calculate convolution asynchronously
  const calculateAsync = useCallback((input: ConvolutionInput): Promise<ConvolutionResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const id = `${Date.now()}-${Math.random()}`;
      pendingRequestsRef.current.set(id, { resolve, reject });

      setIsCalculating(true);
      setError(null);

      const message: WorkerMessage = {
        type: 'CALCULATE_CONVOLUTION',
        payload: input,
        id
      };

      workerRef.current.postMessage(message);
    });
  }, []);

  return {
    calculateAsync,
    isCalculating,
    result,
    error
  };
}
