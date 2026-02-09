
import React, { useState, useEffect, useCallback } from 'react';
import { RUNOFF_COEFFICIENTS } from '../constants';
import { calculateRational } from '../services/calculationService';
import { RationalInputs, CalculationType } from '../types';
import { InputGroup } from './InputGroup';
import { Button } from './Button';
import { FlowInsight } from './FlowInsight';
import { SiteIdentityForm } from './SiteIdentityForm';
import { SlopeCalculator } from './SlopeCalculator';
import { HelpTooltip } from './HelpTooltip';
import { Card } from './ui/Card';

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

  const handleSiteChange = useCallback((site: any) => {
    setInputs(prev => ({ ...prev, site }));
  }, []);

  useEffect(() => {
    setResults(calculateRational(inputs));
  }, [inputs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pb-28">
        {/* --- LEFT COLUMN: INPUTS --- */}
        <div className="lg:col-span-5 space-y-6 lg:space-y-8 animate-slide-up">
             {/* Quick Action Mobile */}
             <div className="bg-white/95 backdrop-blur-md p-3 px-4 rounded-xl shadow-card border border-slate-200 flex justify-between items-center lg:hidden sticky top-20 z-30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600/10 flex items-center justify-center text-emerald-600">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-900 tracking-widest">Load Pilot Data</span>
                </div>
                <button onClick={loadPilotData} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-700 transition-colors">Load</button>
            </div>

            <SiteIdentityForm value={inputs.site || { channelName: '', regency: '', district: '', village: '' }} onChange={handleSiteChange} />

            <Card
              title="Parameter Curah Hujan"
              description="Data DAS & Hujan Rencana"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
              }
            >
              <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 md:gap-5">
                         <InputGroup label="Luas DAS (A)" unit="km²" value={inputs.area} onChange={e => setInputs({...inputs, area: parseFloat(e.target.value)||0})} placeholder="0.50" helpText="Luas Daerah Aliran Sungai yang berkontribusi pada aliran" />
                         <InputGroup label="Hujan Rencana" unit="mm" value={inputs.rainfallDesign} onChange={e => setInputs({...inputs, rainfallDesign: parseFloat(e.target.value)||0})} placeholder="100" helpText="Curah hujan rancangan 24 jam" />
                    </div>
                    
                    <InputGroup label="Panjang Alur Aliran (L)" unit="km" value={inputs.flowLength} onChange={e => setInputs({...inputs, flowLength: parseFloat(e.target.value)||0})} placeholder="1.5" helpText="Panjang saluran utama dari sumber hingga outlet" />
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <InputGroup label="Kemiringan Lahan (S)" unit="m/m" value={inputs.catchmentSlope} onChange={e => setInputs({...inputs, catchmentSlope: parseFloat(e.target.value)||0})} placeholder="0.005" helpText="Rata-rata kemiringan DAS atau saluran utama" />
                        </div>
                        <button 
                          onClick={() => setShowSlopeCalculator(!showSlopeCalculator)}
                          className="mt-6 p-3 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200 hover:border-teal-300 flex-shrink-0" 
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
                            onSlopeCalculated={(slope) => setInputs({...inputs, catchmentSlope: slope})}
                            onClose={() => setShowSlopeCalculator(false)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="group">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2 group-focus-within:text-emerald-600 transition-colors">Koefisien Limpasan (C)</label>
                        <div className="relative">
                            <select 
                                className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-900 text-sm font-bold rounded-lg p-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-colors cursor-pointer"
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
                    
                    <div>
                      <button onClick={loadPilotData} className="w-full text-teal-600 hover:text-teal-700 text-sm font-bold uppercase tracking-wider py-2 px-3 rounded-lg hover:bg-teal-50 transition-colors">
                        ↻ Load Pilot Data
                      </button>
                    </div>
              </div>
            </Card>
        </div>

        {/* --- RIGHT COLUMN: RESULTS --- */}
        <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-24 transition-all">
            {results && (
                <div className="animate-fade-in space-y-6">
                    <FlowInsight discharge={parseFloat(results.Discharge)} type="RATIONAL" label="Estimasi Debit Banjir" />
                    
                    <Card className="overflow-hidden">
                         {/* Header Result */}
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 md:p-8 text-white relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
                             
                             <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/80">Debit Banjir Rencana (Q)</span>
                                    <HelpTooltip content="Debit puncak yang diperkirakan dari peristiwa curah hujan rancangan" />
                                </div>
                                <div className="flex items-baseline mt-2 mb-8">
                                    <h3 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">{results.Discharge}</h3>
                                    <span className="text-lg md:text-2xl font-bold text-emerald-100 ml-2 md:ml-3">m³/s</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/20 backdrop-blur-md p-4 rounded-lg border border-white/10">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-[9px] font-black text-white/60 uppercase">Volume Est.</span>
                                            <HelpTooltip content="Volume total yang diperkirakan selama peristiwa banjir" />
                                        </div>
                                        <span className="text-lg md:text-xl font-bold text-white">{results.TotalVolume} <span className="text-[10px]">m³</span></span>
                                    </div>
                                    <div className="bg-black/20 backdrop-blur-md p-4 rounded-lg border border-white/10">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-[9px] font-black text-white/60 uppercase">Debit Spesifik</span>
                                            <HelpTooltip content="Debit per unit luas daerah aliran (m³/s/km²)" />
                                        </div>
                                        <span className="text-lg md:text-xl font-bold text-white">{results.SpecificDischarge}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 md:p-8 bg-white">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 md:gap-y-8 gap-x-4 md:gap-x-6 mb-8">
                                {[
                                    { l: 'Intensitas Hujan (I)', v: results.Intensity, u: 'mm/h', h: 'Intensitas curah hujan berdasarkan waktu konsentrasi' },
                                    { l: 'Waktu Konsentrasi', v: results.Tc, u: 'menit', h: 'Waktu perjalanan air dari titik terjauh ke outlet' },
                                    { l: 'Waktu Tunda', v: results.LagTime, u: 'menit', h: 'Waktu antara puncak hujan dan puncak debit' },
                                    { l: 'Hujan Efektif', v: results.ExcessRain, u: 'mm', h: 'Bagian curah hujan yang menjadi aliran permukaan (setelah infiltrasi)' }
                                ].map((item, i) => (
                                    <div key={i}>
                                        <div className="flex items-center gap-1 mb-1.5">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{item.l}</span>
                                            <HelpTooltip content={item.h} />
                                        </div>
                                        <span className="text-base md:text-lg font-bold text-slate-800">{item.v} <span className="text-[10px] text-slate-400 font-bold">{item.u}</span></span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row gap-4">
                                <Button fullWidth variant="primary" onClick={() => onSave(CalculationType.RATIONAL, inputs, results)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}>Simpan Hasil</Button>
                                <Button variant="outline" onClick={() => onConsultAI(inputs, results)} className="sm:w-auto px-8">
                                    Konsultasi AI
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
