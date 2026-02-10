
import React, { useState, useEffect, useCallback } from 'react';
import { MANNING_ROUGHNESS } from '../constants';
import { calculateManning } from '../services/calculationService';
import { ManningInputs, CalculationType, ChannelShape } from '../types';
import { InputGroup } from './InputGroup';
import { Button } from './Button';
import { ChannelVisualizer } from './ChannelVisualizer';
import { FlowInsight } from './FlowInsight';
import { SiteIdentityForm } from './SiteIdentityForm';
import { SlopeCalculator } from './SlopeCalculator';
import { HelpTooltip } from './HelpTooltip';
import { Card } from './ui/Card';
import { Alert } from './ui/Alert';

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
  const [showSlopeCalculator, setShowSlopeCalculator] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const newErrors: Record<string, string> = {};
    if (newInputs.roughness <= 0) newErrors.roughness = "Manning coefficient must be > 0";
    if (newInputs.slope <= 0) newErrors.slope = "Slope must be > 0";
    if (newInputs.slope > 0.1) newErrors.slope = "Slope seems unusually high (> 0.1)";
    if (newInputs.shape === ChannelShape.TRAPEZOID) {
      if (newInputs.width <= 0) newErrors.width = "Bottom width must be > 0";
      if (newInputs.depth <= 0) newErrors.depth = "Water depth must be > 0";
    } else {
      if (newInputs.diameter <= 0) newErrors.diameter = "Diameter must be > 0";
      if (newInputs.depth <= 0 || newInputs.depth > newInputs.diameter) 
        newErrors.depth = "Water depth must be between 0 and diameter";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ManningInputs, value: any) => {
    let updatedInputs = { ...inputs, [field]: value };
    if (field === 'width' || field === 'topWidth' || field === 'totalDepth') {
        updatedInputs = updateGeometricParams(updatedInputs);
    }
    setInputs(updatedInputs);
    validate(updatedInputs as ManningInputs);
  };

  const handleSiteChange = useCallback((site: any) => {
    setInputs(prev => ({ ...prev, site }));
  }, []);

  useEffect(() => {
    if (validate(inputs)) setResults(calculateManning(inputs));
    else setResults(null);
  }, [inputs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pb-28">
      {/* --- LEFT COLUMN: INPUTS --- */}
      <div className="lg:col-span-5 space-y-6 lg:space-y-8 animate-slide-up">
        {/* Quick Action Mobile - Enhanced Visibility */}
        <div className="bg-white/95 backdrop-blur-md p-3 px-4 rounded-xl shadow-card border border-slate-200 flex justify-between items-center lg:hidden sticky top-20 z-30 transition-all duration-300 ring-1 ring-slate-100">
           <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-teal-600/10 flex items-center justify-center text-teal-600">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div className="leading-tight">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">Quick Action</span>
                  <span className="block text-xs font-bold text-slate-900">Load Pilot Data</span>
              </div>
           </div>
           <button 
             onClick={loadPilotData} 
             className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase shadow-card active:scale-95 hover:bg-teal-700 transition-all flex items-center gap-2"
           >
             <span>Load</span>
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
           </button>
        </div>

        <SiteIdentityForm value={inputs.site || { channelName: '', regency: '', district: '', village: '' }} onChange={handleSiteChange} />
        
        <div className="bg-white p-5 md:p-8 rounded-xl shadow-card border border-slate-200 relative overflow-hidden">
             {/* Decorative Background Blob */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-600/5 rounded-full blur-3xl"></div>

            <div className="flex items-center gap-3 mb-6 md:mb-8 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-teal-600/10 flex items-center justify-center text-teal-600">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <div>
                   <h3 className="text-sm font-bold text-slate-900">Geometri Saluran</h3>
                   <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Parameter Penampang Melintang</p>
                </div>
                <button onClick={loadPilotData} className="ml-auto hidden lg:flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-teal-600 transition-colors uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-teal-50">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Load Pilot
                </button>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="mb-6">
                <Alert 
                  type="error" 
                  title="Validation Errors"
                  message={Object.values(errors).join(', ')}
                />
              </div>
            )}

            <div className="space-y-6 relative z-10">
                {/* Shape Toggle */}
                <div className="p-1.5 bg-slate-100 rounded-lg flex">
                     {[ChannelShape.TRAPEZOID, ChannelShape.CIRCULAR].map((s) => (
                         <button 
                            key={s}
                            onClick={() => handleInputChange('shape', s)}
                            className={`flex-1 py-2.5 text-[10px] md:text-xs font-bold uppercase rounded-lg transition-all duration-300 ${inputs.shape === s ? 'bg-white text-teal-600 shadow-soft font-semibold' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                            {s === ChannelShape.TRAPEZOID ? 'Trapesium' : 'Lingkaran'}
                         </button>
                     ))}
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-5">
                     {inputs.shape === ChannelShape.TRAPEZOID ? (
                         <>
                            <InputGroup label="Lebar Bawah (b)" unit="m" value={inputs.width} onChange={e => handleInputChange('width', parseFloat(e.target.value)||0)} placeholder="1.5" helpText="Lebar dasar saluran pada bagian bawah" />
                            <InputGroup label="Lebar Atas (B)" unit="m" value={inputs.topWidth} onChange={e => handleInputChange('topWidth', parseFloat(e.target.value)||0)} placeholder="2.0" helpText="Lebar saluran pada permukaan air" />
                            <div className="col-span-2 md:col-span-1">
                                <InputGroup label="Tinggi Total (H)" unit="m" value={inputs.totalDepth} onChange={e => handleInputChange('totalDepth', parseFloat(e.target.value)||0)} placeholder="1.5" helpText="Tinggi total saluran dari dasar ke puncak" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <InputGroup label="Tinggi Air (h)" unit="m" value={inputs.depth} onChange={e => handleInputChange('depth', parseFloat(e.target.value)||0)} placeholder="0.8" helpText="Kedalaman air dalam saluran" />
                            </div>
                         </>
                     ) : (
                         <div className="col-span-2 grid grid-cols-2 gap-5">
                             <InputGroup label="Diameter (D)" unit="m" value={inputs.diameter} onChange={e => handleInputChange('diameter', parseFloat(e.target.value)||0)} placeholder="1.0" helpText="Diameter pipa/saluran lingkaran" />
                             <InputGroup label="Tinggi Air (h)" unit="m" value={inputs.depth} onChange={e => handleInputChange('depth', parseFloat(e.target.value)||0)} placeholder="0.8" helpText="Kedalaman air dalam pipa" />
                         </div>
                     )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <InputGroup label="Kemiringan Dasar (S)" unit="m/m" step="0.0001" value={inputs.slope} onChange={e => handleInputChange('slope', parseFloat(e.target.value)||0)} placeholder="0.002" description="Slope memanjang saluran" helpText="Kemiringan dasar saluran dalam arah aliran (rise/run)" />
                    </div>
                    <button 
                      onClick={() => setShowSlopeCalculator(!showSlopeCalculator)}
                      className="mt-6 p-3 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200 hover:border-teal-300" 
                      title="Slope Calculator"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  {showSlopeCalculator && (
                    <div className="animate-slide-down">
                      <SlopeCalculator 
                        onSlopeCalculated={(slope) => handleInputChange('slope', slope)}
                        onClose={() => setShowSlopeCalculator(false)}
                      />
                    </div>
                  )}
                </div>
                
                <div className="group">
                    <label htmlFor="select-roughness" className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2 group-focus-within:text-teal-600 transition-colors">Kekasaran Manning (n)</label>
                    <div className="relative">
                        <select
                            id="select-roughness"
                            name="roughness"
                            className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-900 text-sm font-bold rounded-lg p-4 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all cursor-pointer"
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
          <Card className="overflow-hidden">
              <div className="bg-slate-50 p-4 md:p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Tampilan Penampang Melintang</h3>
                    {results && (
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${results.SafetyStatus === 'Safe' ? 'bg-emerald-100 text-emerald-700' : 'bg-error/20 text-error'}`}>
                            Status: {results.SafetyStatus}
                        </span>
                    )}
                </div>
                <ChannelVisualizer inputs={inputs} results={results} />
              </div>
          </Card>

          {results && (
            <div className="animate-fade-in space-y-6">
                <FlowInsight discharge={parseFloat(results.Discharge)} velocity={parseFloat(results.Velocity)} type="MANNING" />
                
                {/* Result Dashboard Card */}
                <Card className="overflow-hidden">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                    {/* Header Result */}
                    <div className="p-6 md:p-8 pb-0 relative z-10">
                        {/* Title with Reference Badge */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Kapasitas Debit (Q)</span>
                                <HelpTooltip content="Volume air yang mengalir per satuan waktu melalui penampang saluran" />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                                    Ref: KP-03 Irigasi & SNI 03-2414-1991
                                </span>
                            </div>
                        </div>
                        
                        {/* Modified flex alignment for mobile vs desktop */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <div className="flex items-baseline">
                                    {/* Responsive Text Size */}
                                    <h3 className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-900">{results.Discharge}</h3>
                                    <span className="text-lg md:text-2xl font-bold text-slate-400 ml-2 md:ml-3">m³/s</span>
                                </div>
                            </div>
                            <div className="flex gap-3 mb-2 w-full md:w-auto">
                                <div className="flex-1 md:flex-none bg-slate-50 p-4 rounded-lg border border-slate-200 text-right min-w-[110px]">
                                    <div className="flex items-center justify-end gap-1 mb-1">
                                        <span className="text-[9px] font-black text-slate-500 uppercase">Kecepatan Aliran (V)</span>
                                        <HelpTooltip content="Kecepatan rata-rata aliran air dalam saluran" />
                                    </div>
                                    <span className="text-lg md:text-xl font-black text-slate-800">{results.Velocity} <span className="text-[10px] text-slate-400">m/s</span></span>
                                </div>
                                <div className="flex-1 md:flex-none bg-slate-50 p-4 rounded-lg border border-slate-200 text-right min-w-[110px]">
                                    <div className="flex items-center justify-end gap-1 mb-1">
                                        <span className="text-[9px] font-black text-slate-500 uppercase">Bilangan Froude (Fr)</span>
                                        <HelpTooltip content="Bilangan Froude menunjukkan tipe aliran: <1 subkritis, >1 superkritis" />
                                    </div>
                                    <span className={`text-lg md:text-xl font-black ${results.FlowType === 'Supercritical' ? 'text-error' : 'text-emerald-600'}`}>{results.Froude}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Detailed Metrics Grid */}
                    <div className="p-6 md:p-8 relative z-10">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 md:gap-y-8 gap-x-4 md:gap-x-6">
                            {[
                                { label: 'Luas Penampang Basah (A)', val: results.Area, unit: 'm²', help: 'Luas penampang yang bersentuhan dengan air' },
                                { label: 'Keliling Basah (P)', val: results.Perimeter, unit: 'm', help: 'Panjang keliling yang bersentuhan dengan air' },
                                { label: 'Jari-jari Hidrolis (R)', val: results.Radius, unit: 'm', help: 'Jari-jari hidrolis = Luas basah / Keliling basah' },
                                { label: 'Lebar Atas (T)', val: results.TopWidth, unit: 'm', help: 'Lebar permukaan air di bagian atas' },
                                { label: 'Energi Spesifik (E)', val: results.SpecificEnergy, unit: 'm', help: 'Total energi per satuan berat relatif terhadap dasar saluran' },
                                { label: 'Tegangan Geser Dasar', val: results.ShearStress, unit: 'N/m²', help: 'Gaya geser yang bekerja pada dasar dan dinding saluran' },
                                { label: 'Kedalaman Kritis (yc)', val: results.CriticalDepth, unit: 'm', highlight: true, help: 'Kedalaman air pada kondisi aliran kritis (Fr=1)' },
                                { label: 'Kemiringan Kritis (Ic)', val: results.CriticalSlope, unit: '', highlight: true, help: 'Kemiringan minimum untuk aliran kritis' },
                            ].map((item, i) => (
                                <div key={i} className={`flex flex-col ${item.highlight ? 'bg-teal-600/5 p-3 -m-3 rounded-lg border border-teal-600/10' : ''}`}>
                                    <div className="flex items-center gap-1 mb-1.5">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{item.label}</span>
                                        <HelpTooltip content={item.help} />
                                    </div>
                                    <span className={`text-base md:text-lg font-bold ${item.highlight ? 'text-teal-600' : 'text-slate-800'}`}>
                                        {item.val} <span className="text-[10px] text-slate-400 font-bold ml-0.5">{item.unit}</span>
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 md:mt-10 pt-8 border-t border-slate-200 flex flex-col sm:flex-row gap-4">
                            <Button fullWidth variant="primary" onClick={() => onSave(CalculationType.MANNING, inputs, results)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}>
                                Simpan Laporan
                            </Button>
                            <Button variant="outline" onClick={() => onConsultAI(inputs, results)} className="sm:w-auto px-8">
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    Analisis AI
                                </span>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
          )}
      </div>
    </div>
  );
};
