
import React, { useState, useEffect, useCallback } from 'react';
import { calculateRational } from '@/services/calculationService';
import { RationalInputs, CalculationType } from '@/types/types';
import { InputGroup } from './InputGroup';
import { Button } from '@/components/ui/Button';
import { CardLegacy as Card, CardContent } from '@/components/ui/CardNew';
import { PageHeader, PageContent, Section } from '@/components/ui/Layout';
import { FlowInsight } from './FlowInsight';
import { SiteIdentityForm } from './SiteIdentityForm';
import { SlopeCalculator } from './SlopeCalculator';
import { HelpTooltip } from './HelpTooltip';
import { RunoffCoefficientInput } from './RunoffCoefficientInput';
import { SNIBadge, SNIFooter, SNITooltipLabel } from '@/components/ui/SNICompliance';

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
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Metode Rasional"
        subtitle="Perhitungan debit banjir menggunakan metode rasional untuk DAS kecil"
        icon={<span className="text-2xl">☔</span>}
      />

      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - INPUTS (33%) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Section title="Tindakan Cepat">
              <div className="flex gap-2">
                <button 
                  onClick={loadPilotData}
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                  Load Pilot
                </button>
              </div>
            </Section>

            {/* Site Identity */}
            <Section title="Identitas Lokasi">
              <Card>
                <CardContent>
                  <SiteIdentityForm value={inputs.site || { channelName: '', regency: '', district: '', village: '' }} onChange={handleSiteChange} />
                </CardContent>
              </Card>
            </Section>

            {/* Parameter Section */}
            <Section title="Parameter DAS & Hujan">
              <Card>
                <CardContent>
                  <div className="space-y-4">
                    {/* Grid for area and rainfall */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <SNITooltipLabel 
                          label="Luas DAS (A)" 
                          tooltip="Luas Daerah Aliran Sungai dalam km². Metode Rasional disarankan untuk DAS < 5000 Ha (50 km²)."
                          sniRef="SNI 2415:2016"
                        />
                        <InputGroup label="" unit="km²" value={inputs.area} onChange={e => setInputs({...inputs, area: parseFloat(e.target.value)||0})} placeholder="0.50" />
                      </div>
                      <div>
                        <SNITooltipLabel 
                          label="Hujan Rencana" 
                          tooltip="Curah hujan 24 jam untuk periode ulang tertentu (2-100 tahun)."
                          sniRef="SNI 2415:2016"
                        />
                        <InputGroup label="" unit="mm" value={inputs.rainfallDesign} onChange={e => setInputs({...inputs, rainfallDesign: parseFloat(e.target.value)||0})} placeholder="100" />
                      </div>
                    </div>
                    
                    {/* Flow Length */}
                    <div>
                      <SNITooltipLabel 
                        label="Panjang Alur Aliran (L)" 
                        tooltip="Panjang saluran utama dari titik terjauh hingga outlet."
                      />
                      <InputGroup label="" unit="km" value={inputs.flowLength} onChange={e => setInputs({...inputs, flowLength: parseFloat(e.target.value)||0})} placeholder="1.5" />
                    </div>
                    
                    {/* Slope with calculator */}
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <SNITooltipLabel 
                            label="Kemiringan Lahan (S)" 
                            tooltip="Rata-rata kemiringan DAS dalam m/m. Mempengaruhi waktu konsentrasi dan kecepatan aliran."
                          />
                          <InputGroup label="" unit="m/m" value={inputs.catchmentSlope} onChange={e => setInputs({...inputs, catchmentSlope: parseFloat(e.target.value)||0})} placeholder="0.005" />
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
                        <div className="mt-3">
                          <SlopeCalculator 
                            onSlopeCalculated={(slope) => setInputs({...inputs, catchmentSlope: slope})}
                            onClose={() => setShowSlopeCalculator(false)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Runoff Coefficient */}
                    <div>
                      <SNITooltipLabel 
                        label="Koefisien Pengaliran (C)" 
                        tooltip="Nilai referensi berdasarkan Permen PU No. 12/PRT/M/2014 & Suripin (2004). Rentang: 0.15 (hutan) - 0.95 (aspal)."
                        sniRef="Permen PU 12/2014"
                      />
                      <RunoffCoefficientInput
                        value={inputs.runoffCoefficient}
                        onChange={(value) => setInputs({...inputs, runoffCoefficient: value || 0.70})}
                        required={true}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Section>
          </div>

          {/* RIGHT COLUMN - VISUALIZATION & RESULTS (67%) */}
          <div className="lg:col-span-2 space-y-6">
            {results && (
              <div className="animate-fade-in space-y-6">
                {/* Flow Insight */}
                <FlowInsight discharge={parseFloat(results.Discharge)} type="RATIONAL" label="Estimasi Debit Banjir" />
                
                {/* Result Card */}
                <Card className="overflow-hidden">
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 md:p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
                    
                    <div className="relative z-10">
                      {/* Title */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/80">Debit Banjir Rencana (Q)</span>
                          <HelpTooltip content="Debit puncak dari peristiwa hujan rancangan" />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <svg className="w-4 h-4 text-teal-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                          <SNIBadge standard="SNI 2415:2016" description="Metode Rasional sesuai SNI 2415:2016" />
                        </div>
                      </div>
                      
                      {/* Main value */}
                      <div className="flex items-baseline">
                        <h3 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">{results.Discharge}</h3>
                        <span className="text-lg md:text-2xl font-bold text-emerald-100 ml-2 md:ml-3">m³/s</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Details Section */}
                  <div className="p-6 md:p-8">
                    {/* Secondary metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase">Volume Est.</span>
                          <HelpTooltip content="Volume total selama banjir" />
                        </div>
                        <span className="text-lg font-bold text-slate-800">{results.TotalVolume} <span className="text-[10px] text-slate-400">m³</span></span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase">Debit Spesifik</span>
                          <HelpTooltip content="Debit per unit luas (m³/s/km²)" />
                        </div>
                        <span className="text-lg font-bold text-slate-800">{results.SpecificDischarge}</span>
                      </div>
                    </div>

                    {/* Detailed parameters */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b border-slate-200">
                      {[
                        { l: 'Intensitas Hujan (I)', v: results.Intensity, u: 'mm/h', h: 'Intensitas curah hujan' },
                        { l: 'Waktu Konsentrasi', v: results.Tc, u: 'menit', h: 'Waktu perjalanan air ke outlet' },
                        { l: 'Waktu Tunda', v: results.LagTime, u: 'menit', h: 'Lag time antara puncak hujan dan debit' },
                        { l: 'Hujan Efektif', v: results.ExcessRain, u: 'mm', h: 'Curah hujan yang menjadi aliran' }
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

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button fullWidth variant="primary" onClick={() => onSave(CalculationType.RATIONAL, inputs, results)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        Simpan Hasil
                      </Button>
                      <Button variant="outline" onClick={() => onConsultAI(inputs, results)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Konsultasi AI
                      </Button>
                    </div>

                    {/* SNI Compliance Footer */}
                    <SNIFooter 
                      standard="SNI 2415:2016" 
                      title="Tata Cara Perhitungan Debit Banjir Rencana"
                    />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </PageContent>
    </div>
  );
};
