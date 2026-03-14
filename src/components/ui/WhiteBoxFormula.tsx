import React, { useState } from 'react';
import { Calculator, X } from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface WhiteBoxFormulaProps {
 title: string;
 theoretical: string;
 substituted: string;
 result: string;
 variables?: Record<string, number>;
}

export const WhiteBoxFormula: React.FC<WhiteBoxFormulaProps> = ({
 title,
 theoretical,
 substituted,
 result,
 variables
}) => {
 const [isOpen, setIsOpen] = useState(false);

 return (
 <div className="relative inline-block">
 <button
 onClick={() => setIsOpen(!isOpen)}
 onMouseEnter={() => setIsOpen(true)}
 className="p-1.5 rounded-sm hover:bg-pupr-surface text-pupr-blue transition-colors"
 title="Lihat Rumus Perhitungan"
 >
 <Calculator className="w-4 h-4" />
 </button>

 {isOpen && (
 <>
 <div 
 className="fixed inset-0 z-40" 
 onClick={() => setIsOpen(false)}
 />
 <div className="absolute left-0 top-full mt-2 z-50 w-[480px] max-w-[90vw]">
 <div className="bg-white dark:bg-slate-900/95 border-2 border-pupr-border rounded-sm p-6 animate-in fade-in zoom-in-95 duration-200">
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-sm bg-blue-100 flex items-center justify-center">
 <Calculator className="w-4 h-4 text-pupr-blue" />
 </div>
 <h3 className="font-bold text-slate-900 dark:text-slate-100">{title}</h3>
 </div>
 <button
 onClick={() => setIsOpen(false)}
 className="p-1 hover:bg-slate-100 rounded-sm transition-colors"
 >
 <X className="w-4 h-4 text-slate-500" />
 </button>
 </div>

 <div className="space-y-4">
 <div className="p-4 bg-pupr-surface rounded-sm border border-pupr-border">
 <p className="text-xs font-semibold text-blue-900 mb-2">Rumus Teoritis:</p>
 <div className="overflow-x-auto">
 <BlockMath math={theoretical} />
 </div>
 </div>

 {variables && Object.keys(variables).length > 0 && (
 <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700">
 <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Nilai Variabel:</p>
 <div className="grid grid-cols-2 gap-2 text-xs">
 {Object.entries(variables).map(([key, value]) => (
 <div key={key} className="flex items-center gap-2">
 <InlineMath math={key} />
 <span className="text-slate-500">=</span>
 <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{value}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 <div className="p-4 bg-amber-50 rounded-sm border border-amber-200">
 <p className="text-xs font-semibold text-amber-900 mb-2">Substitusi:</p>
 <div className="overflow-x-auto">
 <BlockMath math={substituted} />
 </div>
 </div>

 <div className="p-4 bg-green-50 rounded-sm border border-green-200">
 <p className="text-xs font-semibold text-green-900 mb-2">Hasil:</p>
 <div className="overflow-x-auto">
 <BlockMath math={result} />
 </div>
 </div>
 </div>

 <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
 <p className="text-xs text-slate-500 text-center">
 💡 <strong>White Box Design:</strong> Transparansi penuh untuk validasi engineering
 </p>
 </div>
 </div>
 </div>
 </>
 )}
 </div>
 );
};
