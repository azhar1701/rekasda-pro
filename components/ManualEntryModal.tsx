
import React, { useState, useCallback } from 'react';
import { Button } from './Button';
import { InputGroup } from './InputGroup';
import { SiteIdentityForm } from './SiteIdentityForm';
import { CalculationType, ChannelShape, ManningInputs, RationalInputs, CalculationResult } from '../types';
import { calculateManning, calculateRational } from '../services/calculationService';
import { MANNING_ROUGHNESS, RUNOFF_COEFFICIENTS } from '../constants';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
            <div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Input Data Baru</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manual Entry ke Database</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            
            {/* Type Selector */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex">
                <button 
                    onClick={() => setActiveType(CalculationType.MANNING)}
                    className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl transition-all ${activeType === CalculationType.MANNING ? 'bg-white text-safety-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Saluran (Manning)
                </button>
                <button 
                    onClick={() => setActiveType(CalculationType.RATIONAL)}
                    className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl transition-all ${activeType === CalculationType.RATIONAL ? 'bg-white text-alert-red shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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
                    
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Parameter Teknis</h4>
                        
                        <div className="flex gap-2 mb-4">
                             {[ChannelShape.TRAPEZOID, ChannelShape.CIRCULAR].map((s) => (
                                 <button 
                                    key={s}
                                    onClick={() => setManningInputs({...manningInputs, shape: s})}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl border ${manningInputs.shape === s ? 'bg-safety-blue text-white border-safety-blue' : 'bg-white text-slate-500 border-slate-200'}`}
                                 >
                                    {s === ChannelShape.TRAPEZOID ? 'Trapesium' : 'Lingkaran'}
                                 </button>
                             ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {manningInputs.shape === ChannelShape.TRAPEZOID ? (
                                <>
                                    <InputGroup label="Lebar Bawah (b)" value={manningInputs.width} onChange={e => setManningInputs({...manningInputs, width: parseFloat(e.target.value)||0})} />
                                    <InputGroup label="Tinggi Air (h)" value={manningInputs.depth} onChange={e => setManningInputs({...manningInputs, depth: parseFloat(e.target.value)||0})} />
                                </>
                            ) : (
                                <>
                                    <InputGroup label="Diameter (D)" value={manningInputs.diameter} onChange={e => setManningInputs({...manningInputs, diameter: parseFloat(e.target.value)||0})} />
                                    <InputGroup label="Tinggi Air (h)" value={manningInputs.depth} onChange={e => setManningInputs({...manningInputs, depth: parseFloat(e.target.value)||0})} />
                                </>
                            )}
                            <InputGroup label="Kemiringan Dasar (S)" value={manningInputs.slope} onChange={e => setManningInputs({...manningInputs, slope: parseFloat(e.target.value)||0})} />
                            
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kekasaran (n)</label>
                                <select 
                                    className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl p-3 outline-none"
                                    value={manningInputs.roughness} 
                                    onChange={e => setManningInputs({...manningInputs, roughness: parseFloat(e.target.value)})}
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

                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Parameter Hidrologi</h4>
                        <div className="grid grid-cols-2 gap-4">
                             <InputGroup label="Luas DAS (A)" unit="km²" value={rationalInputs.area} onChange={e => setRationalInputs({...rationalInputs, area: parseFloat(e.target.value)||0})} />
                             <InputGroup label="Hujan (R24)" unit="mm" value={rationalInputs.rainfallDesign} onChange={e => setRationalInputs({...rationalInputs, rainfallDesign: parseFloat(e.target.value)||0})} />
                             <InputGroup label="Panjang (L)" unit="km" value={rationalInputs.flowLength} onChange={e => setRationalInputs({...rationalInputs, flowLength: parseFloat(e.target.value)||0})} />
                            <InputGroup label="Kemiringan Lahan (S)" unit="-" value={rationalInputs.catchmentSlope} onChange={e => setRationalInputs({...rationalInputs, catchmentSlope: parseFloat(e.target.value)||0})} />
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Koefisien (C)</label>
                            <select 
                                className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl p-3 outline-none"
                                value={rationalInputs.runoffCoefficient} 
                                onChange={e => setRationalInputs({...rationalInputs, runoffCoefficient: parseFloat(e.target.value)})}
                            >
                                {RUNOFF_COEFFICIENTS.map((m, i) => <option key={i} value={m.value}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-white shrink-0">
             <Button fullWidth onClick={handleSave} className="shadow-xl">
                Simpan ke Database
             </Button>
        </div>
      </div>
    </div>
  );
};
