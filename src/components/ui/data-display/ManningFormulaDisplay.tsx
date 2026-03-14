import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export const ManningFormulaDisplay: React.FC = () => {
 const [isExpanded, setIsExpanded] = useState(false);

 return (
 <div className="bg-white dark:bg-slate-900 border-2 border-emerald-200 rounded-sm overflow-hidden">
 {/* Header */}
 <button
 onClick={() => setIsExpanded(!isExpanded)}
 className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-50 transition-colors"
 >
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 bg-emerald-600 rounded-sm flex items-center justify-center flex-shrink-0">
 <Info className="w-4 h-4 text-white" />
 </div>
 <div className="text-left">
 <h3 className="text-sm font-bold text-emerald-900">Persamaan Manning</h3>
 <p className="text-xs text-emerald-600">SNI 03-3424-1994</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-medium text-emerald-700">Lihat Rumus</span>
 {isExpanded ? (
 <ChevronUp className="w-4 h-4 text-emerald-600" />
 ) : (
 <ChevronDown className="w-4 h-4 text-emerald-600" />
 )}
 </div>
 </button>

 {/* Expandable Content */}
 {isExpanded && (
 <div className="border-t-2 border-emerald-200 p-4 bg-gradient-to-br from-emerald-50 to-green-50 space-y-3">
 {/* Main Formula */}
 <div className="bg-white dark:bg-slate-900 rounded-sm p-3 border border-emerald-200">
 <p className="text-xs font-semibold text-emerald-700 mb-2">Rumus Utama:</p>
 <div className="bg-emerald-50 rounded-sm p-2 border border-emerald-200">
 <code className="text-sm font-mono font-bold text-emerald-900 block text-center">
 Q = (1/n) × A × R^(2/3) × S^(1/2)
 </code>
 </div>
 </div>

 {/* Supporting Formulas */}
 <div className="bg-white dark:bg-slate-900 rounded-sm p-3 border border-emerald-200">
 <p className="text-xs font-semibold text-emerald-700 mb-2">Rumus Pendukung:</p>
 <div className="space-y-1.5">
 <div className="bg-emerald-50 rounded-sm p-2 border border-emerald-200">
 <code className="text-xs font-mono text-emerald-900 block">
 R = A / P (Jari-jari hidrolis)
 </code>
 </div>
 <div className="bg-emerald-50 rounded-sm p-2 border border-emerald-200">
 <code className="text-xs font-mono text-emerald-900 block">
 V = Q / A (Kecepatan aliran)
 </code>
 </div>
 <div className="bg-emerald-50 rounded-sm p-2 border border-emerald-200">
 <code className="text-xs font-mono text-emerald-900 block">
 Fr = V / √(g × D) (Bilangan Froude)
 </code>
 </div>
 </div>
 </div>

 {/* Parameters */}
 <div className="bg-white dark:bg-slate-900 rounded-sm p-3 border border-emerald-200">
 <p className="text-xs font-semibold text-emerald-700 mb-2">Keterangan Parameter:</p>
 <div className="space-y-1.5">
 <div className="flex items-start gap-2 text-xs">
 <code className="font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">Q</code>
 <span className="text-slate-700 dark:text-slate-300 flex-1">= Debit aliran</span>
 <span className="text-slate-500 font-medium">(m³/s)</span>
 </div>
 <div className="flex items-start gap-2 text-xs">
 <code className="font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">n</code>
 <span className="text-slate-700 dark:text-slate-300 flex-1">= Koefisien kekasaran Manning</span>
 <span className="text-slate-500 font-medium">(0.01-0.05)</span>
 </div>
 <div className="flex items-start gap-2 text-xs">
 <code className="font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">A</code>
 <span className="text-slate-700 dark:text-slate-300 flex-1">= Luas penampang basah</span>
 <span className="text-slate-500 font-medium">(m²)</span>
 </div>
 <div className="flex items-start gap-2 text-xs">
 <code className="font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">R</code>
 <span className="text-slate-700 dark:text-slate-300 flex-1">= Jari-jari hidrolis</span>
 <span className="text-slate-500 font-medium">(m)</span>
 </div>
 <div className="flex items-start gap-2 text-xs">
 <code className="font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">P</code>
 <span className="text-slate-700 dark:text-slate-300 flex-1">= Keliling basah</span>
 <span className="text-slate-500 font-medium">(m)</span>
 </div>
 <div className="flex items-start gap-2 text-xs">
 <code className="font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">S</code>
 <span className="text-slate-700 dark:text-slate-300 flex-1">= Kemiringan dasar saluran</span>
 <span className="text-slate-500 font-medium">(m/m)</span>
 </div>
 <div className="flex items-start gap-2 text-xs">
 <code className="font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">V</code>
 <span className="text-slate-700 dark:text-slate-300 flex-1">= Kecepatan aliran</span>
 <span className="text-slate-500 font-medium">(m/s)</span>
 </div>
 <div className="flex items-start gap-2 text-xs">
 <code className="font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">Fr</code>
 <span className="text-slate-700 dark:text-slate-300 flex-1">= Bilangan Froude</span>
 <span className="text-slate-500 font-medium">(-)</span>
 </div>
 </div>
 </div>

 {/* Reference */}
 <div className="bg-emerald-100 rounded-sm p-2 border border-emerald-300">
 <p className="text-xs text-emerald-800">
 <span className="font-semibold">Referensi:</span> SNI 03-3424-1994 (Tata Cara Perencanaan Drainase Permukaan Jalan)
 </p>
 </div>
 </div>
 )}
 </div>
 );
};
