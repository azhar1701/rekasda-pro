import React, { useState } from 'react';
import { InputGroup } from '@/components/ui/forms/InputGroup';

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
 <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-4 space-y-4 mt-3">
 <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-sm bg-teal-50 flex items-center justify-center">
 <svg className="w-4 h-4 text-pupr-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
 </svg>
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Kalkulator Kemiringan</h3>
 <p className="text-xs text-slate-500">Hitung slope dari elevasi dan jarak</p>
 </div>
 </div>
 <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-600 dark:text-slate-500 rounded transition-colors">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 <div className="space-y-3">
 <InputGroup
 label="Elevasi Awal" 
 unit="m" 
 value={elevationStart} 
 onChange={e => setElevationStart(parseFloat(e.target.value) || 0)} 
 placeholder="100.0"
 helpText="Ketinggian titik awal saluran"
 />
 <InputGroup
 label="Elevasi Akhir" 
 unit="m" 
 value={elevationEnd} 
 onChange={e => setElevationEnd(parseFloat(e.target.value) || 0)} 
 placeholder="99.5"
 helpText="Ketinggian titik akhir saluran"
 />
 <InputGroup
 label="Jarak Horizontal" 
 unit="m" 
 value={distance} 
 onChange={e => setDistance(parseFloat(e.target.value) || 0)} 
 placeholder="250"
 helpText="Jarak horizontal antara dua titik"
 />
 </div>

 <button
 onClick={calculateSlope}
 className="w-full px-4 py-2.5 bg-pupr-blue text-white rounded-sm hover:bg-teal-700 transition-colors font-semibold text-sm"
 >
 Hitung Kemiringan
 </button>

 {slope !== null && (
 <div className="bg-teal-50 border border-teal-200 rounded-sm p-4">
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">Hasil Perhitungan</span>
 <svg className="w-4 h-4 text-pupr-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
 </svg>
 </div>
 <div className="flex items-baseline gap-2 mb-3">
 <span className="text-2xl font-bold text-teal-900">{slope.toFixed(6)}</span>
 <span className="text-sm font-bold text-pupr-blue">m/m</span>
 </div>
 <button
 onClick={useSlope}
 className="w-full px-4 py-2 bg-pupr-blue text-white rounded-sm hover:bg-teal-700 transition-colors font-semibold text-sm"
 >
 Gunakan Nilai Ini
 </button>
 </div>
 )}
 </div>
 );
};