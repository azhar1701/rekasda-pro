
import React, { useState, useEffect } from 'react';
import { RUNOFF_COEFFICIENTS } from '../constants';
import { calculateRational } from '../services/calculationService';
import { RationalInputs, CalculationType } from '../types';
import { InputGroup } from './InputGroup';
import { Button } from './Button';
import { FlowInsight } from './FlowInsight';
import { SiteIdentityForm } from './SiteIdentityForm';
import { SlopeCalculator } from './SlopeCalculator';
import { HelpTooltip } from './HelpTooltip';

interface Props {
  onSave: (type: CalculationType, inputs: RationalInputs, outputs: any) => void;
  onConsultAI: (inputs: RationalInputs, outputs: any) => void;
}

export const RationalCalculator: React.FC<Props> = ({ onSave, onConsultAI }) => {
  const [inputs, setInputs] = useState<RationalInputs>({ 
    site: { channelName: '', regency: '', district: '', village: '' },
    runoffCoefficient: 0.70, 
    rainfallDesign: 120, 
    area: 0.5,
    flowLength: 0.8,
    catchmentSlope: 0.01
  });
  
  const [results, setResults] = useState<any>(null);
  const [showSlopeCalculator, setShowSlopeCalculator] = useState<boolean>(false);

  const loadPilotData = () => {
    setInputs({
      site: { channelName: 'DAS Perumahan Soreang (Pilot)', regency: 'Kab. Bandung', district: 'Soreang', village: 'Soreang' },
      runoffCoefficient: 0.75,
      rainfallDesign: 145,
      area: 0.25,
      flowLength: 0.6,
      catchmentSlope: 0.02,
    });
  };

  useEffect(() => {
    setResults(calculateRational(inputs));
  }, [inputs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pb-28">
        {/* --- LEFT COLUMN: INPUTS --- */}
        <div className="lg:col-span-5 space-y-6 lg:space-y-8 animate-slide-up">
             {/* Quick Action Mobile */}
             <div className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center lg:hidden sticky top-20 z-30">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Setup Awal</span>
                <button onClick={loadPilotData} className="bg-red-50 text-alert-red px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-100 transition-colors">Load Pilot</button>
            </div>

            <SiteIdentityForm value={inputs.site || { channelName: '', regency: '', district: '', village: '' }} onChange={s => setInputs({...inputs, site: s})} />

            <div className="bg-white p-5 md:p-8 rounded-[2rem] shadow-soft border border-slate-100 relative overflow-hidden">
                {/* Decorative Blob */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-alert-red/5 rounded-full blur-3xl"></div>

                <div className="flex justify-between items-center mb-6 md:mb-8 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-alert-red/10 flex items-center justify-center text-alert-red">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Parameter Hujan</h3>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Data Curah & DAS</p>
                        </div>
                    </div>
                    <button onClick={loadPilotData} className="hidden lg:block text-[10px] font-bold text-slate-400 hover:text-alert-red transition-colors uppercase tracking-wider">Load Pilot</button>
                </div>

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-2 gap-4 md:gap-5">
                         <InputGroup label="Luas DAS (A)" unit="km²" value={inputs.area} onChange={e => setInputs({...inputs, area: parseFloat(e.target.value)||0})} placeholder="0.50" helpText="Luas daerah aliran sungai yang berkontribusi terhadap aliran" />
                         <InputGroup label="Hujan (R24)" unit="mm" value={inputs.rainfallDesign} onChange={e => setInputs({...inputs, rainfallDesign: parseFloat(e.target.value)||0})} placeholder="100" helpText="Curah hujan rencana dalam 24 jam" />
                    </div>
                    
                    <InputGroup label="Panjang Alur (L)" unit="km" value={inputs.flowLength} onChange={e => setInputs({...inputs, flowLength: parseFloat(e.target.value)||0})} placeholder="1.5" helpText="Panjang alur utama dari hulu hingga outlet DAS" />
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <InputGroup label="Kemiringan Lahan (S)" unit="m/m" value={inputs.catchmentSlope} onChange={e => setInputs({...inputs, catchmentSlope: parseFloat(e.target.value)||0})} placeholder="0.005" helpText="Kemiringan rata-rata lahan DAS atau alur utama" />
                        </div>
                        <button 
                          onClick={() => setShowSlopeCalculator(!showSlopeCalculator)}
                          className="mt-6 p-3 text-orange-600 hover:bg-orange-50 rounded-xl transition-colors border border-orange-200 hover:border-orange-300 flex-shrink-0" 
                          title="Kalkulator Slope"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      {showSlopeCalculator && (
                        <div className="animate-slide-down">
                          <SlopeCalculator 
                            onSlopeCalculated={(slope) => setInputs({...inputs, catchmentSlope: slope})}
                            onClose={() => setShowSlopeCalculator(false)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="group">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2 group-focus-within:text-alert-red transition-colors">Koefisien Limpasan (C)</label>
                        <div className="relative">
                            <select 
                                className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-900 text-sm font-bold rounded-2xl p-4 outline-none focus:border-alert-red focus:ring-4 focus:ring-alert-red/10 transition-colors cursor-pointer"
                                value={inputs.runoffCoefficient} 
                                onChange={e => setInputs({...inputs, runoffCoefficient: parseFloat(e.target.value)})}
                            >
                                {RUNOFF_COEFFICIENTS.map((m, i) => <option key={i} value={m.value}>{m.name} (C={m.value})</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN: RESULTS --- */}
        <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-24 transition-all">
            {results && (
                <div className="animate-fade-in space-y-6">
                    <FlowInsight discharge={parseFloat(results.Discharge)} type="RATIONAL" label="Simulasi Limpasan Hujan" />
                    
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                         {/* Header Result */}
                        <div className="bg-gradient-to-br from-red-500 to-red-700 p-6 md:p-8 text-white relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
                             
                             <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-100/80">Debit Banjir Rencana (Q)</span>
                                    <HelpTooltip content="Debit puncak banjir yang diperkirakan terjadi berdasarkan curah hujan rencana" />
                                </div>
                                <div className="flex items-baseline mt-2 mb-8">
                                    <h3 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">{results.Discharge}</h3>
                                    <span className="text-lg md:text-2xl font-bold text-red-100 ml-2 md:ml-3">m³/s</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-[9px] font-black text-white/60 uppercase">Volume Est.</span>
                                            <HelpTooltip content="Estimasi total volume air yang mengalir selama kejadian banjir" />
                                        </div>
                                        <span className="text-lg md:text-xl font-bold text-white">{results.TotalVolume} <span className="text-[10px]">m³</span></span>
                                    </div>
                                    <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-[9px] font-black text-white/60 uppercase">Debit Spesifik</span>
                                            <HelpTooltip content="Debit per satuan luas DAS (m³/s/km²)" />
                                        </div>
                                        <span className="text-lg md:text-xl font-bold text-white">{results.SpecificDischarge}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 md:p-8 bg-white">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 md:gap-y-8 gap-x-4 md:gap-x-6 mb-8">
                                {[
                                    { l: 'Intensitas (I)', v: results.Intensity, u: 'mm/jam', h: 'Intensitas curah hujan berdasarkan waktu konsentrasi' },
                                    { l: 'Waktu Konsentrasi', v: results.Tc, u: 'menit', h: 'Waktu yang diperlukan air hujan untuk mencapai outlet dari titik terjauh DAS' },
                                    { l: 'Waktu Lag', v: results.LagTime, u: 'menit', h: 'Waktu antara puncak hujan dan puncak debit' },
                                    { l: 'Hujan Efektif', v: results.ExcessRain, u: 'mm', h: 'Bagian hujan yang menjadi limpasan permukaan setelah dikurangi infiltrasi' }
                                ].map((item, i) => (
                                    <div key={i}>
                                        <div className="flex items-center gap-1 mb-1.5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{item.l}</span>
                                            <HelpTooltip content={item.h} />
                                        </div>
                                        <span className="text-base md:text-lg font-bold text-slate-800">{item.v} <span className="text-[10px] text-slate-400 font-bold">{item.u}</span></span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                                <Button fullWidth variant="danger" onClick={() => onSave(CalculationType.RATIONAL, inputs, results)}>Simpan Hasil</Button>
                                <Button variant="outline" onClick={() => onConsultAI(inputs, results)} className="sm:w-auto px-8 border-2 border-red-50 text-red-600 hover:bg-red-50 hover:border-red-100">
                                    AI Review
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
