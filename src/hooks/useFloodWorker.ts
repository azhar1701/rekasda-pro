import { useEffect, useRef, useState } from 'react';
import { ConvolutionResult } from '@/lib/engine/flood/convolution';
import type { FloodWorkerMessage, FloodWorkerResponse, FloodWorkerInput } from '@/workers/floodWorker';

export const useFloodWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL('../workers/floodWorker.ts', import.meta.url), {
      type: 'module'
    });

    setIsWorkerReady(true);

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const calculateFloodAsync = (input: FloodWorkerInput): Promise<ConvolutionResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) return reject('Worker not ready');

      const id = Math.random().toString(36).substr(2, 9);
      const message: FloodWorkerMessage = {
        type: 'CALCULATE_FLOOD',
        payload: input,
        id
      };

      const handleMessage = (e: MessageEvent<FloodWorkerResponse>) => {
        if (e.data.id === id) {
          workerRef.current?.removeEventListener('message', handleMessage);
          if (e.data.type === 'FLOOD_RESULT') {
            resolve(e.data.payload);
          } else if (e.data.type === 'ERROR') {
            reject(e.data.error);
          }
        }
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.postMessage(message);
    });
  };

  const calculateBatchFloodAsync = (inputs: FloodWorkerInput[]): Promise<ConvolutionResult[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) return reject('Worker not ready');

      const id = Math.random().toString(36).substr(2, 9);
      const message: FloodWorkerMessage = {
        type: 'CALCULATE_BATCH_FLOOD',
        payload: inputs,
        id
      };

      const handleMessage = (e: MessageEvent<FloodWorkerResponse>) => {
        if (e.data.id === id) {
          workerRef.current?.removeEventListener('message', handleMessage);
          if (e.data.type === 'BATCH_FLOOD_RESULT') {
            resolve(e.data.payload);
          } else if (e.data.type === 'ERROR') {
            reject(e.data.error);
          }
        }
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.postMessage(message);
    });
  };

  return {
    isWorkerReady,
    calculateFloodAsync,
    calculateBatchFloodAsync
  };
};
