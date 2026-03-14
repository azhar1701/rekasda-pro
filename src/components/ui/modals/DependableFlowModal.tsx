import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

interface DependableFlowModalProps {
 isOpen: boolean;
 onClose: () => void;
 onApply: (debitResults: number[]) => void;
}

export const DependableFlowModal: React.FC<DependableFlowModalProps> = ({ isOpen, onClose, onApply }) => {
 const [area, setArea] = useState<number>(100);
 const [runoffCoeff, setRunoffCoeff] = useState<number>(0.5);
 const [monthlyRain, setMonthlyRain] = useState<{ rain: number; days: number }[]>(
 Array(12).fill({ rain: 0, days: 0 }).map(() => ({ rain: 0, days: 0 }))
 );

 const handleRainChange = (index: number, field: 'rain' | 'days', value: number) => {
 const newData = [...monthlyRain];
 newData[index] = { ...newData[index], [field]: value };
 setMonthlyRain(newData);
 };

 const handleCalculate = () => {
 const results = monthlyRain.map(({ rain, days }) => {
 const intensity = days > 0 ? rain / 30 : 0;
 const debit = 0.278 * runoffCoeff * intensity * area;
 return parseFloat(debit.toFixed(2));
 });
 onApply(results);
 onClose();
 };

 return (
 <Dialog open={isOpen} onClose={onClose} className="relative z-[9999]">
 <div className="fixed inset-0 bg-black/50 " aria-hidden="true" />
 <div className="fixed inset-0 flex items-center justify-center p-4">
 <Dialog.Panel className="bg-white dark:bg-slate-900 rounded-sm w-full max-w-5xl p-6 relative max-h-[90vh] overflow-y-auto">

 {/* Header */}
 <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
 <div className="flex items-center gap-3">
 <svg className="w-7 h-7 text-pupr-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
 </svg>
 <div>
 <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Kalkulator Estimasi Debit Andalan</h3>
 <p className="text-xs text-slate-500 uppercase font-medium">Input Data Curah Hujan Bulanan</p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="text-slate-500 hover:text-slate-600 dark:text-slate-400 transition-colors"
 >
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 {/* Top Section: Global Parameters */}
 <div className="grid grid-cols-2 gap-6 mb-6 bg-slate-50 dark:bg-slate-800 rounded-sm p-5 border border-slate-200 dark:border-slate-700">
 <div>
 <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 block">Luas DAS (Daerah Aliran Sungai)</label>
 <div className="relative">
 <input
 type="number"
 value={area}
 onChange={e => setArea(parseFloat(e.target.value) || 0)}
 className="w-full h-12 px-4 pr-16 text-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
 />
 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">km²</span>
 </div>
 </div>

 <div>
 <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 block">Koefisien Limpasan (C)</label>
 <div className="relative">
 <input
 type="number"
 step="0.01"
 min="0"
 max="1"
 value={runoffCoeff}
 onChange={e => setRunoffCoeff(parseFloat(e.target.value) || 0)}
 className="w-full h-12 px-4 pr-16 text-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
 />
 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">0-1</span>
 </div>
 </div>
 </div>

 {/* Grid Section: Monthly Input */}
 <div className="mb-6">
 <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-4 flex items-center gap-2">
 <svg className="w-5 h-5 text-pupr-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
 </svg>
 Data Curah Hujan per Bulan
 </h4>
 <div className="grid grid-cols-4 gap-4">
 {MONTHS.map((month, index) => (
 <div key={month} className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-sm p-4 border border-slate-200 dark:border-slate-700 ">
 <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-3 block text-center">{month}</label>

 <div className="space-y-3">
 <div className="relative">
 <input
 type="number"
 step="0.1"
 value={monthlyRain[index].rain}
 onChange={e => handleRainChange(index, 'rain', parseFloat(e.target.value) || 0)}
 placeholder="0"
 className="w-full h-11 px-3 pr-12 text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
 />
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">mm</span>
 </div>

 <div className="relative">
 <input
 type="number"
 value={monthlyRain[index].days}
 onChange={e => handleRainChange(index, 'days', parseFloat(e.target.value) || 0)}
 placeholder="0"
 className="w-full h-11 px-3 pr-12 text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
 />
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">hari</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Footer */}
 <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
 <button
 onClick={onClose}
 className="px-6 py-3 bg-slate-100 text-slate-700 dark:text-slate-300 rounded-sm font-semibold hover:bg-slate-200 transition-colors"
 >
 Batal
 </button>
 <button
 onClick={handleCalculate}
 className="px-6 py-3 bg-blue-600 text-white rounded-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
 </svg>
 Hitung & Terapkan
 </button>
 </div>
 </Dialog.Panel>
 </div>
 </Dialog>
 );
};
