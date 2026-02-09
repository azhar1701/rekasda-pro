import React, { useState } from 'react';
import { InputGroup } from './InputGroup';
import { Button } from './Button';

interface Props {
  onSlopeCalculated: (slope: number) => void;
  onClose: () => void;
}

export const SlopeCalculator: React.FC<Props> = ({ onSlopeCalculated, onClose }) => {
  const [elevationStart, setElevationStart] = useState<number>(0);
  const [elevationEnd, setElevationEnd] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [slope, setSlope] = useState<number | null>(null);

  const calculateSlope = () => {
    if (distance > 0) {
      const calculatedSlope = Math.abs(elevationEnd - elevationStart) / distance;
      setSlope(calculatedSlope);
    }
  };

  const useSlope = () => {
    if (slope !== null) {
      onSlopeCalculated(slope);
      onClose();
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Kalkulator Kemiringan</h3>
            <p className="text-xs text-slate-500">Hitung slope dari elevasi dan jarak</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <InputGroup 
          label="Elevasi Awal" 
          unit="m" 
          value={elevationStart} 
          onChange={e => setElevationStart(parseFloat(e.target.value) || 0)} 
          placeholder="100.0" 
        />
        <InputGroup 
          label="Elevasi Akhir" 
          unit="m" 
          value={elevationEnd} 
          onChange={e => setElevationEnd(parseFloat(e.target.value) || 0)} 
          placeholder="99.5" 
        />
        <div className="sm:col-span-2 lg:col-span-1">
          <InputGroup 
            label="Jarak Horizontal" 
            unit="m" 
            value={distance} 
            onChange={e => setDistance(parseFloat(e.target.value) || 0)} 
            placeholder="250" 
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={calculateSlope} className="flex-1">
          Hitung Kemiringan
        </Button>
      </div>

      {slope !== null && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Hasil Perhitungan</span>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-slate-900">{slope.toFixed(6)}</span>
            <span className="text-sm font-bold text-slate-400">m/m</span>
          </div>
          <Button onClick={useSlope} className="w-full">
            Gunakan Slope Ini
          </Button>
        </div>
      )}
    </div>
  );
};