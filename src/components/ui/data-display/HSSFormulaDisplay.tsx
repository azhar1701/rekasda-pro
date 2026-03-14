import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

interface HSSFormulaDisplayProps {
 method: 'nakayasu' | 'gamma1' | 'snyder';
}

export const HSSFormulaDisplay: React.FC<HSSFormulaDisplayProps> = ({ method }) => {
 const [isExpanded, setIsExpanded] = useState(false);

 const formulas = {
 nakayasu: {
 title: 'HSS Nakayasu',
 formulas: [
 { label: 'Time Lag', formula: 'Tg = 0.4 + 0.058 × L' },
 { label: 'Waktu Puncak', formula: 'Tp = Tg + 0.8 × Tr' },
 { label: 'Waktu Menurun', formula: 'T0.3 = α × Tg' },
 { label: 'Debit Puncak', formula: 'Qp = (A × Ro) / (3.6 × (0.3Tp + T0.3))' },
 { label: 'Waktu Dasar', formula: 'Tb = Tp + 2.5 × T0.3' },
 ],
 hydrograph: [
 { phase: 'Rising Limb (0 < t ≤ Tp)', formula: 'Qt = Qp × (t/Tp)^2.4' },
 { phase: 'Recession Limb (t > Tp)', formula: 'Qt = Qp × 0.3^((t-Tp)/T0.3)' },
 ],
 parameters: [
 { symbol: 'Qp', description: 'Debit puncak', unit: 'm³/s' },
 { symbol: 'A', description: 'Luas DAS', unit: 'km²' },
 { symbol: 'L', description: 'Panjang sungai utama', unit: 'km' },
 { symbol: 'Ro', description: 'Hujan satuan efektif', unit: 'mm' },
 { symbol: 'Tr', description: 'Durasi hujan satuan', unit: 'jam' },
 { symbol: 'Tg', description: 'Time lag', unit: 'jam' },
 { symbol: 'Tp', description: 'Waktu puncak', unit: 'jam' },
 { symbol: 'T0.3', description: 'Waktu menurun', unit: 'jam' },
 { symbol: 'α', description: 'Koefisien DAS', unit: '1.5-3.0' },
 ],
 reference: 'SNI 2415:2016 Pasal 6.3',
 validRange: 'A > 3 km²',
 },
 gamma1: {
 title: 'HSS Gamma I',
 formulas: [
 { label: 'Waktu Konsentrasi', formula: 'Tc = 0.43 × (L / √S)^0.467' },
 { label: 'Waktu Puncak', formula: 'Tp = 0.5 × Tc' },
 { label: 'Debit Puncak', formula: 'Qp = (0.18 × A × Ro) / Tp' },
 { label: 'Waktu Dasar', formula: 'Tb = 27.4132 × Tp^0.1457 × SF^-0.0986 × Qp^0.2381' },
 ],
 hydrograph: [
 { phase: 'Rising Limb (0 < t ≤ Tp)', formula: 'Qt = Qp × (t/Tp)^2.5' },
 { phase: 'Recession Limb (Tp < t ≤ Tb)', formula: 'Qt = Qp × ((Tb-t)/(Tb-Tp))^1.5' },
 ],
 parameters: [
 { symbol: 'Qp', description: 'Debit puncak', unit: 'm³/s' },
 { symbol: 'A', description: 'Luas DAS', unit: 'km²' },
 { symbol: 'L', description: 'Panjang sungai utama', unit: 'km' },
 { symbol: 'Ro', description: 'Hujan satuan efektif', unit: 'mm' },
 { symbol: 'SF', description: 'Source Factor', unit: 'dimensionless' },
 { symbol: 'Tc', description: 'Waktu konsentrasi', unit: 'jam' },
 { symbol: 'Tp', description: 'Waktu puncak', unit: 'jam' },
 { symbol: 'Tb', description: 'Waktu dasar', unit: 'jam' },
 { symbol: 'S', description: 'Kemiringan DAS', unit: 'm/m' },
 ],
 reference: 'Sri Harto (1993)',
 validRange: 'DAS kecil-menengah',
 },
 snyder: {
 title: 'HSS Snyder',
 formulas: [
 { label: 'Time Lag', formula: 'tpR = Ct × (L × Lc)^0.3' },
 { label: 'Durasi Hujan', formula: 'tr = tpR / 5.5' },
 { label: 'Waktu Puncak', formula: 'Tp = tpR + 0.25 × tr' },
 { label: 'Debit Puncak', formula: 'Qp = (2.78 × Cp × A × Ro) / Tp' },
 { label: 'Waktu Dasar', formula: 'Tb = 5 × Tp' },
 ],
 hydrograph: [
 { phase: 'Rising Limb (0 < t ≤ Tp)', formula: 'Qt = Qp × (t/Tp)^2.0' },
 { phase: 'Recession Limb (Tp < t ≤ Tb)', formula: 'Qt = Qp × ((Tb-t)/(Tb-Tp))^1.2' },
 ],
 parameters: [
 { symbol: 'Qp', description: 'Debit puncak', unit: 'm³/s' },
 { symbol: 'A', description: 'Luas DAS', unit: 'km²' },
 { symbol: 'L', description: 'Panjang sungai utama', unit: 'km' },
 { symbol: 'Lc', description: 'Jarak ke titik berat DAS', unit: 'km' },
 { symbol: 'Ro', description: 'Hujan satuan efektif', unit: 'mm' },
 { symbol: 'Ct', description: 'Koefisien time lag', unit: '0.4-0.8' },
 { symbol: 'Cp', description: 'Koefisien debit puncak', unit: '0.4-0.8' },
 { symbol: 'Tp', description: 'Waktu puncak', unit: 'jam' },
 { symbol: 'Tb', description: 'Waktu dasar', unit: 'jam' },
 ],
 reference: 'Snyder (1938)',
 validRange: 'DAS besar',
 },
 };

 const data = formulas[method];

 return (
 <div className="bg-white dark:bg-slate-900 border-2 border-teal-200 rounded-sm overflow-hidden">
 {/* Header - Always Visible */}
 <button
 onClick={() => setIsExpanded(!isExpanded)}
 className="w-full px-4 py-3 flex items-center justify-between hover:bg-teal-50 transition-colors"
 >
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 bg-teal-600 rounded-sm flex items-center justify-center flex-shrink-0">
 <Info className="w-4 h-4 text-white" />
 </div>
 <div className="text-left">
 <h3 className="text-sm font-bold text-teal-900">{data.title}</h3>
 <p className="text-xs text-teal-600">{data.validRange}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-medium text-teal-700">Lihat Rumus</span>
 {isExpanded ? (
 <ChevronUp className="w-4 h-4 text-teal-600" />
 ) : (
 <ChevronDown className="w-4 h-4 text-teal-600" />
 )}
 </div>
 </button>

 {/* Expandable Content */}
 {isExpanded && (
 <div className="border-t-2 border-teal-200 p-4 bg-gradient-to-br from-teal-50 to-cyan-50 space-y-3">
 {/* Main Formulas */}
 <div className="bg-white dark:bg-slate-900 rounded-sm p-3 border border-teal-200">
 <p className="text-xs font-semibold text-teal-700 mb-2">Persamaan Utama:</p>
 <div className="space-y-1.5">
 {data.formulas.map((item, index) => (
 <div key={index}>
 <p className="text-xs font-medium text-teal-800 mb-1">{item.label}:</p>
 <div className="bg-teal-50 rounded-sm p-2 border border-teal-200">
 <code className="text-xs font-mono text-teal-900 block">
 {item.formula}
 </code>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Hydrograph Equations */}
 {('hydrograph' in data && data.hydrograph) && (
 <div className="bg-white dark:bg-slate-900 rounded-sm p-3 border border-teal-200">
 <p className="text-xs font-semibold text-teal-700 mb-2">Kurva Hidrograf:</p>
 <div className="space-y-1.5">
 {data.hydrograph.map((item: { phase: string; formula: string }, index: number) => (
 <div key={index}>
 <p className="text-xs font-medium text-teal-800 mb-1">{item.phase}:</p>
 <div className="bg-teal-50 rounded-sm p-2 border border-teal-200">
 <code className="text-xs font-mono text-teal-900 block">
 {item.formula}
 </code>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Parameters */}
 {data.parameters.length > 0 && (
 <div className="bg-white dark:bg-slate-900 rounded-sm p-3 border border-teal-200">
 <p className="text-xs font-semibold text-teal-700 mb-2">Keterangan Parameter:</p>
 <div className="space-y-1.5">
 {data.parameters.map((param, index) => (
 <div key={index} className="flex items-start gap-2 text-xs">
 <code className="font-mono font-bold text-teal-900 bg-teal-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center text-xs">
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
 )}

 {/* Reference */}
 <div className="bg-teal-100 rounded-sm p-2 border border-teal-300">
 <p className="text-xs text-teal-800">
 <span className="font-semibold">Referensi:</span> {data.reference}
 </p>
 </div>
 </div>
 )}
 </div>
 );
};
