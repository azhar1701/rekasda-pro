
import React, { useState, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '@/components/ui/forms/Button';
import { InputGroup } from '@/components/ui/forms/InputGroup';
import { SiteIdentityForm } from '@/components/common/SiteIdentityForm';
import { CalculationType, ChannelShape, ManningInputs, RationalInputs, CalculationResult } from '@/types/types';
import { calculateManning, calculateRational } from '@/services/calculationService';
import { MANNING_ROUGHNESS, RUNOFF_COEFFICIENTS } from '@/constants';

interface Props {
 isOpen: boolean;
 onClose: () => void;
 onSave: (record: CalculationResult) => void;
}

export const ManualEntryModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
 const [activeType, setActiveType] = useState<CalculationType>(CalculationType.MANNING);

 // Default States
 const [manningInputs, setManningInputs] = useState<ManningInputs>({
 site: { channelName: '', regency: '', district: '', village: '' },
 shape: ChannelShape.TRAPEZOID,
 roughness: 0.025,
 slope: 0.001,
 width: 2.0,
 topWidth: 2.5,
 diameter: 1.0,
 depth: 1.0,
 totalDepth: 1.5,
 sideSlope: 0.1666,
 });

 const [rationalInputs, setRationalInputs] = useState<RationalInputs>({
 site: { channelName: '', regency: '', district: '', village: '' },
 runoffCoefficient: 0.70,
 rainfallDesign: 120,
 area: 0.5,
 flowLength: 0.8,
 catchmentSlope: 0.01
 });

 const handleManningFormChange = useCallback((site: any) => {
 setManningInputs(prev => ({ ...prev, site }));
 }, []);

 const handleRationalFormChange = useCallback((site: any) => {
 setRationalInputs(prev => ({ ...prev, site }));
 }, []);

 const handleSave = () => {
 const timestamp = Date.now();
 let result: CalculationResult;

 if (activeType === CalculationType.MANNING) {
 const outputs = calculateManning(manningInputs);
 result = {
 id: `manual-manning-${timestamp}`,
 type: CalculationType.MANNING,
 date: new Date().toISOString(),
 inputs: manningInputs,
 outputs: outputs,
 location: manningInputs.site?.location,
 photoUrl: manningInputs.site?.photoUrl,
 notes: 'Input Manual Database'
 };
 } else {
 const outputs = calculateRational(rationalInputs);
 result = {
 id: `manual-rational-${timestamp}`,
 type: CalculationType.RATIONAL,
 date: new Date().toISOString(),
 inputs: rationalInputs,
 outputs: outputs,
 location: rationalInputs.site?.location,
 photoUrl: rationalInputs.site?.photoUrl,
 notes: 'Input Manual Database'
 };
 }

 onSave(result);
 onClose();
 };

 return (
 <Dialog open={isOpen} onClose={onClose} className="relative z-[100]">
 <div className="fixed inset-0" aria-hidden="true" />
 <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4">
 <Dialog.Panel className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-sm overflow-hidden max-h-[90vh] flex flex-col">
 {/* Header */}
 <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
 <div>
 <h3 className="text-xl font-extrabold italic uppercase tracking-tighter">Input Data Baru</h3>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Manual Entry ke Database</p>
 </div>
 <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
 </div>

 {/* Content */}
 <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

 {/* Type Selector */}
 <div className="bg-slate-100 p-1.5 rounded-sm flex">
 <button
 onClick={() => setActiveType(CalculationType.MANNING)}
 className={`flex-1 py-3 text-xs font-bold uppercase rounded-sm transition-all ${activeType === CalculationType.MANNING ? 'bg-white dark:bg-slate-900 text-safety-blue ' : 'text-slate-500 hover:text-slate-600 dark:text-slate-400'}`}
 >
 Saluran (Manning)
 </button>
 <button
 onClick={() => setActiveType(CalculationType.RATIONAL)}
 className={`flex-1 py-3 text-xs font-bold uppercase rounded-sm transition-all ${activeType === CalculationType.RATIONAL ? 'bg-white dark:bg-slate-900 text-alert-red ' : 'text-slate-500 hover:text-slate-600 dark:text-slate-400'}`}
 >
 Banjir (Rational)
 </button>handleManningFormChange
 </div>

 {/* Forms */}
 {activeType === CalculationType.MANNING ? (
 <div className="space-y-6 animate-fade-in">
 <SiteIdentityForm
 value={manningInputs.site || { channelName: '', regency: '', district: '', village: '' }}
 onChange={handleManningFormChange}
 />

 <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 space-y-4">
 <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Parameter Teknis</h4>

 <div className="flex gap-2 mb-4">
 {[ChannelShape.TRAPEZOID, ChannelShape.CIRCULAR].map((s) => (
 <button
 key={s}
 onClick={() => setManningInputs({ ...manningInputs, shape: s })}
 className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-sm border ${manningInputs.shape === s ? 'bg-safety-blue text-white border-safety-blue' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}
 >
 {s === ChannelShape.TRAPEZOID ? 'Trapesium' : 'Lingkaran'}
 </button>
 ))}
 </div>

 <div className="grid grid-cols-2 gap-4">
 {manningInputs.shape === ChannelShape.TRAPEZOID ? (
 <>
 <InputGroup id="input-manual-trapezoid-width" name="width" label="Lebar Bawah (b)" value={manningInputs.width} onChange={e => setManningInputs({ ...manningInputs, width: parseFloat(e.target.value) || 0 })} />
 <InputGroup id="input-manual-trapezoid-depth" name="depth" label="Tinggi Air (h)" value={manningInputs.depth} onChange={e => setManningInputs({ ...manningInputs, depth: parseFloat(e.target.value) || 0 })} />
 </>
 ) : (
 <>
 <InputGroup id="input-manual-circular-diameter" name="diameter" label="Diameter (D)" value={manningInputs.diameter} onChange={e => setManningInputs({ ...manningInputs, diameter: parseFloat(e.target.value) || 0 })} />
 <InputGroup id="input-manual-circular-depth" name="depth" label="Tinggi Air (h)" value={manningInputs.depth} onChange={e => setManningInputs({ ...manningInputs, depth: parseFloat(e.target.value) || 0 })} />
 </>
 )}
 <InputGroup id="input-manual-slope" name="slope" label="Kemiringan Dasar (S)" value={manningInputs.slope} onChange={e => setManningInputs({ ...manningInputs, slope: parseFloat(e.target.value) || 0 })} />

 <div className="group">
 <label htmlFor="select-manual-roughness" className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kekasaran (n)</label>
 <select
 id="select-manual-roughness"
 name="roughness"
 className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-sm p-3 outline-none"
 value={manningInputs.roughness}
 onChange={e => setManningInputs({ ...manningInputs, roughness: parseFloat(e.target.value) })}
 >
 {MANNING_ROUGHNESS.map((m, i) => <option key={i} value={m.value}>{m.name}</option>)}
 </select>
 </div>
 </div>
 </div>
 </div>
 ) : (
 <div className="space-y-6 animate-fade-in">
 <SiteIdentityForm
 value={rationalInputs.site || { channelName: '', regency: '', district: '', village: '' }}
 onChange={handleRationalFormChange}
 />

 <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 space-y-4">
 <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Parameter Hidrologi</h4>
 <div className="grid grid-cols-2 gap-4">
 <InputGroup id="input-manual-area" name="area" label="Luas DAS (A)" unit="km²" value={rationalInputs.area} onChange={e => setRationalInputs({ ...rationalInputs, area: parseFloat(e.target.value) || 0 })} />
 <InputGroup id="input-manual-rainfall" name="rainfallDesign" label="Hujan (R24)" unit="mm" value={rationalInputs.rainfallDesign} onChange={e => setRationalInputs({ ...rationalInputs, rainfallDesign: parseFloat(e.target.value) || 0 })} />
 <InputGroup id="input-manual-flow-length" name="flowLength" label="Panjang (L)" unit="km" value={rationalInputs.flowLength} onChange={e => setRationalInputs({ ...rationalInputs, flowLength: parseFloat(e.target.value) || 0 })} />
 <InputGroup id="input-manual-catchment-slope" name="catchmentSlope" label="Kemiringan Lahan (S)" unit="-" value={rationalInputs.catchmentSlope} onChange={e => setRationalInputs({ ...rationalInputs, catchmentSlope: parseFloat(e.target.value) || 0 })} />
 </div>
 <div className="group">
 <label htmlFor="select-manual-runoff" className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Koefisien (C)</label>
 <select
 id="select-manual-runoff"
 name="runoffCoefficient"
 className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-sm p-3 outline-none"
 value={rationalInputs.runoffCoefficient}
 onChange={e => setRationalInputs({ ...rationalInputs, runoffCoefficient: parseFloat(e.target.value) })}
 >
 {RUNOFF_COEFFICIENTS.map((m, i) => <option key={i} value={m.value}>{m.name}</option>)}
 </select>
 </div>
 </div>
 </div>
 )}
 </div>

 <div className="p-5 border-t border-slate-100 bg-white dark:bg-slate-900 shrink-0">
 <Button fullWidth onClick={handleSave} className="">
 Simpan ke Database
 </Button>
 </div>
 </Dialog.Panel>
 </div>
 </Dialog>
 );
};
