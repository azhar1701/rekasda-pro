
import React, { useState, useEffect } from 'react';
import { MANNING_ROUGHNESS } from '../constants';
import { calculateManning } from '../services/calculationService';
import { ManningInputs, CalculationType, ChannelShape } from '../types';
import { InputGroup } from './InputGroup';
import { Button } from './Button';
import { ChannelVisualizer } from './ChannelVisualizer';
import { FlowInsight } from './FlowInsight';
import { SiteIdentityForm } from './SiteIdentityForm';

interface Props {
  onSave: (type: CalculationType, inputs: ManningInputs, outputs: any) => void;
  onConsultAI: (inputs: ManningInputs, outputs: any) => void;
}

export const ManningCalculator: React.FC<Props> = ({ onSave, onConsultAI }) => {
  const [inputs, setInputs] = useState<ManningInputs>({
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

  // const [errors, setErrors] = useState<Partial<Record<keyof ManningInputs, string>>>({});
  const [results, setResults] = useState<any>(null);

  const loadPilotData = () => {
    setInputs({
      site: { channelName: 'Saluran Sekunder Soreang (Pilot)', regency: 'Kab. Bandung', district: 'Soreang', village: 'Soreang' },
      shape: ChannelShape.TRAPEZOID,
      roughness: 0.015,
      slope: 0.002,
      width: 1.2,
      topWidth: 2.0,
      diameter: 1.0,
      depth: 0.45,
      totalDepth: 1.0,
      sideSlope: 0.4,
    });
  };

  const updateGeometricParams = (newInputs: ManningInputs) => {
    if (newInputs.shape === ChannelShape.TRAPEZOID && newInputs.totalDepth > 0) {
      const b = newInputs.width;
      const B = newInputs.topWidth;
      const H = newInputs.totalDepth;
      newInputs.sideSlope = Math.max(0, (B - b) / (2 * H));
    }
    return newInputs;
  };

  const validate = (newInputs: ManningInputs) => {
    // const newErrors: Partial<Record<keyof ManningInputs, string>> = {};
    // if (newInputs.roughness <= 0) newErrors.roughness = "n > 0";
    // if (newInputs.slope <= 0) newErrors.slope = "S > 0";
    // setErrors(newErrors);
    // return Object.keys(newErrors).length === 0;
    return newInputs.roughness > 0 && newInputs.slope > 0;
  };

  const handleInputChange = (field: keyof ManningInputs, value: any) => {
    let updatedInputs = { ...inputs, [field]: value };
    if (field === 'width' || field === 'topWidth' || field === 'totalDepth') {
        updatedInputs = updateGeometricParams(updatedInputs);
    }
    setInputs(updatedInputs);
    validate(updatedInputs as ManningInputs);
  };

  useEffect(() => {
    if (validate(inputs)) setResults(calculateManning(inputs));
    else setResults(null);
  }, [inputs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pb-28">
      {/* --- LEFT COLUMN: INPUTS --- */}
      <div className="lg:col-span-5 space-y-6 lg:space-y-8 animate-slide-up">
        {/* Quick Action Mobile - Enhanced Visibility */}
        <div className="bg-white/95 backdrop-blur-md p-3 px-4 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 flex justify-between items-center lg:hidden sticky top-20 z-30 transition-all duration-300 ring-1 ring-slate-100">
           <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-safety-blue/10 flex items-center justify-center text-safety-blue">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div className="leading-tight">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">Aksi Cepat</span>
                  <span className="block text-xs font-bold text-slate-900">Isi Data Pilot</span>
              </div>
           </div>
           <button 
             onClick={loadPilotData} 
             className="bg-safety-blue text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-safety-blue/30 active:scale-95 hover:bg-blue-700 transition-all flex items-center gap-2"
           >
             <span>Load Data</span>
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
           </button>
        </div>

        <SiteIdentityForm value={inputs.site || { channelName: '', regency: '', district: '', village: '' }} onChange={(s) => setInputs({...inputs, site: s})} />
        
        <div className="bg-white p-5 md:p-8 rounded-[2rem] shadow-soft border border-slate-100 relative overflow-hidden">
             {/* Decorative Background Blob */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-safety-blue/5 rounded-full blur-3xl"></div>

            <div className="flex items-center gap-3 mb-6 md:mb-8 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-safety-blue/10 flex items-center justify-center text-safety-blue">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <div>
                   <h3 className="text-sm font-bold text-slate-900">Parameter Hidrolis</h3>
                   <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Dimensi Penampang</p>
                </div>
                <button onClick={loadPilotData} className="ml-auto hidden lg:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-safety-blue transition-colors uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Load Pilot
                </button>
            </div>

            <div className="space-y-6 relative z-10">
                {/* Shape Toggle */}
                <div className="p-1.5 bg-slate-100 rounded-2xl flex">
                     {[ChannelShape.TRAPEZOID, ChannelShape.CIRCULAR].map((s) => (
                         <button 
                            key={s}
                            onClick={() => handleInputChange('shape', s)}
                            className={`flex-1 py-2.5 text-[10px] md:text-xs font-bold uppercase rounded-xl transition-all duration-300 ${inputs.shape === s ? 'bg-white text-slate-900 shadow-md transform scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                            {s === ChannelShape.TRAPEZOID ? 'Trapesium' : 'Lingkaran'}
                         </button>
                     ))}
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-5">
                     {inputs.shape === ChannelShape.TRAPEZOID ? (
                         <>
                            <InputGroup label="Lebar Bawah (b)" unit="m" value={inputs.width} onChange={e => handleInputChange('width', parseFloat(e.target.value)||0)} placeholder="1.5" />
                            <InputGroup label="Lebar Atas (B)" unit="m" value={inputs.topWidth} onChange={e => handleInputChange('topWidth', parseFloat(e.target.value)||0)} placeholder="2.0" />
                            <div className="col-span-2 md:col-span-1">
                                <InputGroup label="Tinggi Total (H)" unit="m" value={inputs.totalDepth} onChange={e => handleInputChange('totalDepth', parseFloat(e.target.value)||0)} placeholder="1.5" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <InputGroup label="Tinggi Air (h)" unit="m" value={inputs.depth} onChange={e => handleInputChange('depth', parseFloat(e.target.value)||0)} placeholder="0.8" />
                            </div>
                         </>
                     ) : (
                         <div className="col-span-2 grid grid-cols-2 gap-5">
                             <InputGroup label="Diameter (D)" unit="m" value={inputs.diameter} onChange={e => handleInputChange('diameter', parseFloat(e.target.value)||0)} placeholder="1.0" />
                             <InputGroup label="Tinggi Air (h)" unit="m" value={inputs.depth} onChange={e => handleInputChange('depth', parseFloat(e.target.value)||0)} placeholder="0.8" />
                         </div>
                     )}
                </div>

                <InputGroup label="Kemiringan Dasar (S)" unit="m/m" step="0.0001" value={inputs.slope} onChange={e => handleInputChange('slope', parseFloat(e.target.value)||0)} placeholder="0.002" description="Slope memanjang saluran" />
                
                <div className="group">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2 group-focus-within:text-safety-blue transition-colors">Kekasaran Manning (n)</label>
                    <div className="relative">
                        <select 
                            className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-900 text-sm font-bold rounded-2xl p-4 outline-none focus:border-safety-blue focus:ring-4 focus:ring-safety-blue/10 transition-all cursor-pointer"
                            value={inputs.roughness} 
                            onChange={e => handleInputChange('roughness', parseFloat(e.target.value))}
                        >
                            {MANNING_ROUGHNESS.map((m, i) => <option key={i} value={m.value}>{m.name} (n={m.value})</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- RIGHT COLUMN: VISUALIZATION & RESULTS --- */}
      <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-24 transition-all">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-float p-1 relative overflow-hidden group">
              <div className="bg-slate-50/50 p-4 md:p-6 rounded-[1.8rem]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Visualisasi Penampang</h3>
                    {results && (
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${results.SafetyStatus === 'Aman' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            Status: {results.SafetyStatus}
                        </span>
                    )}
                </div>
                <ChannelVisualizer inputs={inputs} results={results} />
              </div>
          </div>

          {results && (
            <div className="animate-fade-in space-y-6">
                <FlowInsight discharge={parseFloat(results.Discharge)} velocity={parseFloat(results.Velocity)} type="MANNING" />
                
                {/* Result Dashboard Card */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                    {/* Header Result */}
                    <div className="p-6 md:p-8 pb-0 relative z-10">
                        {/* Modified flex alignment for mobile vs desktop */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Kapasitas Debit (Q)</span>
                                <div className="flex items-baseline">
                                    {/* Responsive Text Size */}
                                    <h3 className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-900">{results.Discharge}</h3>
                                    <span className="text-lg md:text-2xl font-bold text-slate-400 ml-2 md:ml-3">m³/s</span>
                                </div>
                            </div>
                            <div className="flex gap-3 mb-2 w-full md:w-auto">
                                <div className="flex-1 md:flex-none bg-slate-50 p-4 rounded-2xl border border-slate-100 text-right min-w-[110px]">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Kecepatan (V)</span>
                                    <span className="text-lg md:text-xl font-black text-slate-800">{results.Velocity} <span className="text-[10px] text-slate-400">m/s</span></span>
                                </div>
                                <div className="flex-1 md:flex-none bg-slate-50 p-4 rounded-2xl border border-slate-100 text-right min-w-[110px]">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Froude (Fr)</span>
                                    <span className={`text-lg md:text-xl font-black ${results.FlowType === 'Super-kritis' ? 'text-red-500' : 'text-green-500'}`}>{results.Froude}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Detailed Metrics Grid */}
                    <div className="p-6 md:p-8 relative z-10">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 md:gap-y-8 gap-x-4 md:gap-x-6">
                            {[
                                { label: 'Luas Basah (A)', val: results.Area, unit: 'm²' },
                                { label: 'Keliling Basah (P)', val: results.Perimeter, unit: 'm' },
                                { label: 'Jari-jari (R)', val: results.Radius, unit: 'm' },
                                { label: 'Lebar Atas (T)', val: results.TopWidth, unit: 'm' },
                                { label: 'Energi Spesifik (E)', val: results.SpecificEnergy, unit: 'm' },
                                { label: 'Tegangan Geser', val: results.ShearStress, unit: 'N/m²' },
                                { label: 'Kedalaman Kritis', val: results.CriticalDepth, unit: 'm', highlight: true },
                                { label: 'Slope Kritis', val: results.CriticalSlope, unit: '', highlight: true },
                            ].map((item, i) => (
                                <div key={i} className={`flex flex-col ${item.highlight ? 'bg-safety-blue/5 p-3 -m-3 rounded-2xl border border-safety-blue/10' : ''}`}>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">{item.label}</span>
                                    <span className={`text-base md:text-lg font-bold ${item.highlight ? 'text-safety-blue' : 'text-slate-800'}`}>
                                        {item.val} <span className="text-[10px] text-slate-400 font-bold ml-0.5">{item.unit}</span>
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 md:mt-10 pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                            <Button fullWidth onClick={() => onSave(CalculationType.MANNING, inputs, results)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}>
                                Simpan Laporan
                            </Button>
                            <Button variant="outline" onClick={() => onConsultAI(inputs, results)} className="sm:w-auto px-8 border-2 border-slate-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100">
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    Analisis AI
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
          )}
      </div>
    </div>
  );
};
