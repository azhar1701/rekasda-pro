import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

interface FormulaDisplayProps {
 method: 'rational' | 'haspers' | 'weduwen' | 'melchior';
}

export const FormulaDisplay: React.FC<FormulaDisplayProps> = ({ method }) => {
 const [isExpanded, setIsExpanded] = useState(false);
 const formulas = {
 rational: {
 title: 'Metode Rasional',
 formula: 'Q = 0.278 × C × I × A',
 parameters: [
 { symbol: 'Q', description: 'Debit puncak', unit: 'm³/s' },
 { symbol: 'C', description: 'Koefisien limpasan', unit: '0-1' },
 { symbol: 'I', description: 'Intensitas hujan', unit: 'mm/jam' },
 { symbol: 'A', description: 'Luas DAS', unit: 'km²' },
 { symbol: '0.278', description: 'Faktor konversi metrik', unit: '-' },
 ],
 reference: 'SNI 2415:2016 Pasal 5.2',
 validRange: 'A ≤ 3 km² (300 Ha)',
 },
 haspers: {
 title: 'Metode Haspers & Osugi',
 formula: 'Q = α × β × A^0.75 × I',
 subFormulas: [
 'α = C × (100 + A) / (100 + 1.5A)',
 'β = 120 / (120 + L/√S)',
 ],
 parameters: [
 { symbol: 'Q', description: 'Debit puncak', unit: 'm³/s' },
 { symbol: 'A', description: 'Luas DAS', unit: 'km²' },
 { symbol: 'L', description: 'Panjang sungai utama', unit: 'km' },
 { symbol: 'S', description: 'Kemiringan rata-rata', unit: 'desimal' },
 { symbol: 'I', description: 'Intensitas hujan', unit: 'mm/jam' },
 { symbol: 'α', description: 'Koefisien reduksi luas', unit: '-' },
 { symbol: 'β', description: 'Koefisien waktu konsentrasi', unit: '-' },
 ],
 reference: 'Haspers (1935), Osugi (1940)',
 validRange: '3 km² < A ≤ 100 km²',
 },
 weduwen: {
 title: 'Metode der Weduwen',
 formula: 'Q = α × β × A^0.70 × I',
 subFormulas: [
 'α = C × (120 + A) / (120 + 2A)',
 'β = 120 / (120 + 1.5L/√S)',
 ],
 parameters: [
 { symbol: 'Q', description: 'Debit puncak', unit: 'm³/s' },
 { symbol: 'A', description: 'Luas DAS', unit: 'km²' },
 { symbol: 'L', description: 'Panjang sungai utama', unit: 'km' },
 { symbol: 'S', description: 'Kemiringan rata-rata', unit: 'desimal' },
 { symbol: 'I', description: 'Intensitas hujan', unit: 'mm/jam' },
 { symbol: 'α', description: 'Koefisien reduksi luas', unit: '-' },
 { symbol: 'β', description: 'Koefisien waktu konsentrasi', unit: '-' },
 ],
 reference: 'der Weduwen (1951)',
 validRange: '3 km² < A ≤ 100 km² (pegunungan)',
 },
 melchior: {
 title: 'Metode Melchior',
 formula: 'Q = α × β × C × A^0.8 × I',
 subFormulas: [
 'α = (200 + A) / (200 + 3A)',
 'β = 120 / (120 + 2L/√S)',
 't = 0.1 × L / √S',
 ],
 parameters: [
 { symbol: 'Q', description: 'Debit puncak', unit: 'm³/s' },
 { symbol: 'C', description: 'Koefisien limpasan', unit: '0-1' },
 { symbol: 'A', description: 'Luas DAS', unit: 'km²' },
 { symbol: 'L', description: 'Panjang sungai utama', unit: 'km' },
 { symbol: 'S', description: 'Kemiringan rata-rata', unit: 'desimal' },
 { symbol: 'I', description: 'Intensitas hujan', unit: 'mm/jam' },
 { symbol: 'α', description: 'Koefisien reduksi luas', unit: '-' },
 { symbol: 'β', description: 'Koefisien waktu konsentrasi', unit: '-' },
 { symbol: 't', description: 'Waktu konsentrasi', unit: 'jam' },
 ],
 reference: 'Melchior (1960)',
 validRange: 'A > 100 km²',
 },
 };

 const data = formulas[method];

 return (
 <div className="bg-white dark:bg-slate-900 border-2 border-pupr-border rounded-sm overflow-hidden">
 {/* Header - Always Visible */}
 <button
 onClick={() => setIsExpanded(!isExpanded)}
 className="w-full px-4 py-3 flex items-center justify-between hover:bg-pupr-surface transition-colors"
 >
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center flex-shrink-0">
 <Info className="w-4 h-4 text-white" />
 </div>
 <div className="text-left">
 <h3 className="text-sm font-bold text-blue-900">{data.title}</h3>
 <p className="text-xs text-pupr-blue">{data.validRange}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-medium text-pupr-blue">Lihat Rumus</span>
 {isExpanded ? (
 <ChevronUp className="w-4 h-4 text-pupr-blue" />
 ) : (
 <ChevronDown className="w-4 h-4 text-pupr-blue" />
 )}
 </div>
 </button>

 {/* Expandable Content */}
 {isExpanded && (
 <div className="border-t-2 border-pupr-border p-4 bg-gradient-to-br from-blue-50 to-indigo-50 space-y-3">

 {/* Main Formula */}
 <div className="bg-white dark:bg-slate-900 rounded-sm p-3 border border-pupr-border">
 <p className="text-xs font-semibold text-pupr-blue mb-2">Rumus Utama:</p>
 <div className="bg-pupr-surface rounded-sm p-2 border border-pupr-border">
 <code className="text-sm font-mono font-bold text-blue-900 block text-center">
 {data.formula}
 </code>
 </div>
 </div>

 {/* Sub Formulas */}
 {'subFormulas' in data && data.subFormulas && (
 <div className="bg-white dark:bg-slate-900 rounded-sm p-3 border border-pupr-border">
 <p className="text-xs font-semibold text-pupr-blue mb-2">Rumus Pendukung:</p>
 <div className="space-y-1.5">
 {data.subFormulas.map((formula: string, index: number) => (
 <div key={index} className="bg-pupr-surface rounded-sm p-2 border border-pupr-border">
 <code className="text-xs font-mono text-blue-900 block">
 {formula}
 </code>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Parameters */}
 <div className="bg-white dark:bg-slate-900 rounded-sm p-3 border border-pupr-border">
 <p className="text-xs font-semibold text-pupr-blue mb-2">Keterangan Parameter:</p>
 <div className="space-y-1.5">
 {data.parameters.map((param, index) => (
 <div key={index} className="flex items-start gap-2 text-xs">
 <code className="font-mono font-bold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center text-xs">
 {param.symbol}
 </code>
 <span className="text-slate-700 dark:text-slate-300 flex-1 text-xs">
 = {param.description}
 </span>
 <span className="text-slate-500 font-medium text-xs">
 ({param.unit})
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* Reference */}
 <div className="bg-blue-100 rounded-sm p-2 border border-blue-300">
 <p className="text-xs text-blue-800">
 <span className="font-semibold">Referensi:</span> {data.reference}
 </p>
 </div>
 </div>
 )}
 </div>
 );
};
