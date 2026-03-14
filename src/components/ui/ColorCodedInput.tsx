import React from 'react';
import { Lock, RotateCcw } from 'lucide-react';

interface ColorCodedInputProps {
 label: string;
 value: number | string;
 unit?: string;
 isReadOnly?: boolean;
 isEdited?: boolean;
 onChange?: (value: number) => void;
 onReset?: () => void;
 formula?: string;
}

export const ColorCodedInput: React.FC<ColorCodedInputProps> = ({
 label,
 value,
 unit,
 isReadOnly = false,
 isEdited = false,
 onChange,
 onReset,
 formula
}) => {
 return (
 <div className="space-y-1">
 <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
 {label}
 {formula && <span className="text-slate-500 font-normal">({formula})</span>}
 </label>
 
 <div className="relative flex items-center gap-2">
 <div className="relative flex-1">
 <input
 type="number"
 value={value}
 onChange={(e) => onChange?.(parseFloat(e.target.value))}
 readOnly={isReadOnly}
 step="0.001"
 className={`w-full px-3 py-2 rounded-sm font-mono text-sm transition-all ${
 isReadOnly
 ? 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
 : isEdited
 ? 'bg-yellow-50 text-yellow-900 border-2 border-yellow-400 focus:ring-2 focus:ring-yellow-500'
 : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
 }`}
 />
 {isReadOnly && (
 <div className="absolute right-3 top-1/2 -translate-y-1/2">
 <Lock className="w-3.5 h-3.5 text-slate-500" />
 </div>
 )}
 </div>
 
 {unit && (
 <span className="text-sm font-medium text-slate-500 min-w-[40px]">{unit}</span>
 )}
 
 {isEdited && onReset && (
 <button
 onClick={onReset}
 className="p-2 rounded-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors"
 title="Reset ke nilai asli"
 >
 <RotateCcw className="w-4 h-4" />
 </button>
 )}
 </div>
 
 {isReadOnly && (
 <p className="text-xs text-slate-500">🔒 Nilai dari Master Data (SSOT)</p>
 )}
 {isEdited && (
 <p className="text-xs text-yellow-700">⚠️ Nilai telah diubah manual</p>
 )}
 </div>
 );
};
