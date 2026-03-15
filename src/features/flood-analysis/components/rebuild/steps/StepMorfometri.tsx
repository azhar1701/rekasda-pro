import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Mountain, Droplets, Info, Save } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { toast } from '@/hooks/useToast';

interface StepMorfometriProps {
 onComplete: () => void;
 isCompleted: boolean;
}

export const StepMorfometri: React.FC<StepMorfometriProps> = ({ onComplete }) => {
 const {
 morfometriDAS,
 tutupanLahan,
 updateMorfometriDAS,
 setLuasDas,
 setPanjangSungai
 } = useHydrologyStore();

 const [localA, setLocalA] = useState(morfometriDAS?.luasDAS.toString() || '');
 const [localL, setLocalL] = useState(morfometriDAS?.panjangSungai.toString() || '');
 const [localS, setLocalS] = useState(morfometriDAS?.kemiringanSungai.toString() || '0.01');

 const compositeC = tutupanLahan?.koefisienPengaliranGabungan || 0.65;
 const compositeCN = tutupanLahan?.curveNumberGabungan || 75;

 const handleSave = () => {
 const A = parseFloat(localA);
 const L = parseFloat(localL);
 const S = parseFloat(localS);

 if (isNaN(A) || A <= 0) return toast.error('Luas DAS harus valid');
 if (isNaN(L) || L <= 0) return toast.error('Panjang Sungai harus valid');

 updateMorfometriDAS({
 luasDAS: A,
 panjangSungai: L,
 kemiringanSungai: S,
 elevasi: 0 // Default or omit if it was unused
 });

 setLuasDas(localA);
 setPanjangSungai(localL);

 toast.success('Data Morfometri DAS diperbarui');
 onComplete();
 };

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-75">
 <div className="bg-pupr-surface border border-pupr-border rounded-sm p-4 flex items-start gap-3">
 <Info className="w-5 h-5 text-pupr-blue mt-0.5" />
 <div className="text-sm text-slate-700 dark:text-slate-300">
 <p className="font-bold mb-1 text-pupr-blue">Informasi Morfometri DAS</p>
 <p>Langkah ini memastikan karakteristik fisik DAS yang digunakan dalam perhitungan banjir sudah benar. Data dapat ditarik otomatis dari Master Data atau di-override di sini.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm">
 <div className="flex items-center gap-3 mb-5">
 <div className="p-2 bg-slate-100 rounded-sm">
 <Mountain className="w-5 h-5 text-slate-600 dark:text-slate-500" />
 </div>
 <h3 className="font-bold text-slate-900 dark:text-slate-100">Dimensi Utama DAS</h3>
 </div>

 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Luas DAS (A)</label>
 <div className="relative">
 <input
 type="number"
 value={localA}
 onChange={(e) => setLocalA(e.target.value)}
 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm font-bold tabular-nums focus:ring-1 focus:ring-pupr-blue focus:outline-none"
 placeholder="0.00"
 />
 <span className="absolute right-3 top-2 text-slate-500 font-semibold text-sm">km²</span>
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Panjang Sungai Utama (L)</label>
 <div className="relative">
 <input
 type="number"
 value={localL}
 onChange={(e) => setLocalL(e.target.value)}
 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm font-bold tabular-nums focus:ring-1 focus:ring-pupr-blue focus:outline-none"
 placeholder="0.00"
 />
 <span className="absolute right-3 top-2 text-slate-500 font-semibold text-sm">km</span>
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kemiringan Sungai (S)</label>
 <div className="relative">
 <input
 type="number"
 value={localS}
 onChange={(e) => setLocalS(e.target.value)}
 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm font-bold tabular-nums focus:ring-1 focus:ring-pupr-blue focus:outline-none"
 placeholder="0.01"
 step="0.001"
 />
 <span className="absolute right-3 top-2 text-slate-500 font-semibold text-sm">m/m</span>
 </div>
 </div>
 </div>
 </Card>

 <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm">
 <div className="flex items-center gap-3 mb-5">
 <div className="p-2 bg-green-50 rounded-sm">
 <Droplets className="w-5 h-5 text-green-600" />
 </div>
 <h3 className="font-bold text-slate-900 dark:text-slate-100">Koefisien Runoff (Composite)</h3>
 </div>

 <div className="space-y-4">
 <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
 <div className="flex justify-between items-center mb-1">
 <span className="text-xs font-bold text-slate-500 uppercase">Koefisien C Gabungan</span>
 <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">{compositeC.toFixed(3)}</span>
 </div>
 <div className="w-full bg-slate-200 h-1.5 rounded-sm overflow-hidden">
 <div
 className="bg-pupr-blue h-full"
 style={{ width: `${compositeC * 100}%` }}
 />
 </div>
 <p className="text-[10px] text-slate-500 mt-2 italic">Dikalibrasi berdasarkan tutupan lahan DAS</p>
 </div>

 <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
 <div className="flex justify-between items-center mb-1">
 <span className="text-xs font-bold text-slate-500 uppercase">Curve Number (CN)</span>
 <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">{compositeCN.toFixed(1)}</span>
 </div>
 <div className="w-full bg-slate-200 h-1.5 rounded-sm overflow-hidden">
 <div
 className="bg-green-600 h-full"
 style={{ width: `${compositeCN}%` }}
 />
 </div>
 <p className="text-[10px] text-slate-500 mt-2 italic">Untuk metode HSS SCS / NRCS</p>
 </div>
 </div>

 <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-500">
 <Save className="w-3 h-3" />
 <span>Perubahan di sini akan mempengaruhi seluruh tahap analisis banjir.</span>
 </div>
 </Card>
 </div>

 <div className="flex justify-end">
 <button
 onClick={handleSave}
 className="px-8 py-3 bg-pupr-blue hover:bg-pupr-blue text-white font-bold rounded-sm hover: transition-all flex items-center gap-2"
 >
 Simpan Karakteristik & Lanjut →
 </button>
 </div>
 </div>
 );
};
