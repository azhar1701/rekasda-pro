import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { WaterBalanceInputs, calculateWaterBalance, getWaterBalanceSummary, WaterBalanceResult } from '@/services/waterBalanceEngine';
import { WaterBalanceChart } from './WaterBalanceChart';
import { DependableFlowModal } from '@/components/ui/modals/DependableFlowModal';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';
import { saveWaterBalance } from '@/services/calculationService';
import { WaterBalancePilotDataLoader } from './WaterBalancePilotDataLoader';
import { SNILabel, ComplianceBadge } from '@/components/ui/data-display/ComplianceComponents';
import { WaterBalanceFormulaDisplay } from '@/components/ui/data-display/WaterBalanceFormulaDisplay';
import { Collapsible } from '@/components/ui/Collapsible';
import { Droplet, AlertTriangle, Zap } from 'lucide-react';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import {
  calculateFJMock,
  calculateWeibullDependableFlow,
  DEFAULT_ETO_INDONESIA,
  DAYS_IN_MONTH,
  MONTH_LABELS,
  type MockParams,
  type MockMonthlyInput,
  type MockMonthlyResult,
} from '@/lib/engine/fjMock';
import { KalkulatorIrigasi } from './KalkulatorIrigasi';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Location type removed in favor of ProjectContextBanner

interface Props {
  onConsultAI?: () => void;
}

export const WaterBalanceTab: React.FC<Props> = ({ onConsultAI }) => {
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);

  const [inputs, setInputs] = useState<WaterBalanceInputs>({
    population: 5000,
    agricultureArea: 100,
    domesticStandard: 100,
    irrigationDemand: 1.0,
    monthlySupply: [2.5, 2.3, 2.0, 1.8, 1.5, 1.2, 1.0, 0.9, 1.1, 1.4, 1.8, 2.2]
  });

  const [results, setResults] = useState<WaterBalanceResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const kpiCardsRef = useStaggerAnimation(50);

  // ── F.J. Mock Integration ──
  const { luasDas, hasilMock, setHasilMock, neracaFinal, setLuasDas, identitasLokasi } = useHydrologyStore();
  const [luasDasLocal, setLuasDasLocal] = useState<string>('');
  const luasDasGlobal = parseFloat(luasDas) || 0;
  // Effective value: local override → global store → 0
  const luasDasEffective = luasDasLocal !== '' ? (parseFloat(luasDasLocal) || 0) : luasDasGlobal;
  const isLuasDasOverridden = luasDasLocal !== '' && parseFloat(luasDasLocal) !== luasDasGlobal;
  const [supplyMethod, setSupplyMethod] = useState<'manual' | 'mock'>('manual');
  const [mockParams, setMockParams] = useState({
    smc: 200,
    ism: 200,
    infiltrationFactor: 0.4,
    k: 0.7,
    exposedSurface: 0.1,
  });
  const [monthlyETo, setMonthlyETo] = useState<number[]>([...DEFAULT_ETO_INDONESIA]);
  const [monthlyPrecip, setMonthlyPrecip] = useState<number[]>([
    300, 280, 250, 200, 120, 80, 60, 50, 80, 150, 220, 280,
  ]);
  const [targetProb, setTargetProb] = useState(80);
  const [mockResults, setMockResults] = useState<MockMonthlyResult[] | null>(null);
  const [mockError, setMockError] = useState<string | null>(null);
  const luasDasNum = luasDasEffective;



  useEffect(() => {
    const balanceResults = calculateWaterBalance(inputs);
    setResults(balanceResults);
    setSummary(getWaterBalanceSummary(balanceResults));
  }, [inputs]);

  const handleSupplyChange = (index: number, value: number) => {
    const newSupply = [...inputs.monthlySupply];
    newSupply[index] = value;
    setInputs({ ...inputs, monthlySupply: newSupply });
  };

  const handleUseCalculatedFlow = (flow: number[]) => {
    setInputs({ ...inputs, monthlySupply: flow });
  };

  // ── F.J. Mock Calculate Handler ──
  const handleMockCalculate = useCallback(() => {
    setMockError(null);
    try {
      if (luasDasNum <= 0) {
        setMockError('Luas DAS belum diisi. Atur di Master Data terlebih dahulu.');
        return;
      }

      const params: MockParams = {
        luasDas: luasDasNum,
        smc: mockParams.smc,
        ism: mockParams.ism,
        infiltrationFactor: mockParams.infiltrationFactor,
        k: mockParams.k,
        exposedSurface: mockParams.exposedSurface,
      };

      const data: MockMonthlyInput[] = MONTH_LABELS.map((month, i) => ({
        month,
        precipitation: monthlyPrecip[i],
        eto: monthlyETo[i],
        daysInMonth: DAYS_IN_MONTH[i],
      }));

      const results = calculateFJMock(params, data);
      setMockResults(results);

      // Extract discharge series → Weibull
      const discharges = results.map(r => r.discharge);
      const weibull = calculateWeibullDependableFlow(discharges, targetProb);

      // Apply Mock discharges as monthlySupply for Water Balance
      setInputs(prev => ({ ...prev, monthlySupply: discharges }));

      // Save to store
      setHasilMock({
        monthlyResults: results.map(r => ({
          month: r.month,
          precipitation: r.precipitation,
          eto: r.eto,
          waterSurplus: r.waterSurplus,
          baseFlow: r.baseFlow,
          directRunoff: r.directRunoff,
          totalRunoff: r.totalRunoff,
          discharge: r.discharge,
        })),
        qAndalan: weibull.qAndalan,
        probability: targetProb,
        metode: 'mock',
      });
    } catch (err: any) {
      setMockError(err.message || 'Perhitungan F.J. Mock gagal.');
    }
  }, [luasDasNum, mockParams, monthlyPrecip, monthlyETo, targetProb, setHasilMock, setInputs]);

  const totalSupply = inputs.monthlySupply.reduce((a, b) => a + b, 0);
  const totalDemand = results.reduce((a, b) => a + Number(b.totalDemand), 0);
  const netBalance = totalSupply - totalDemand;

  const handleLoadPilotData = (data: any) => {
    setInputs({
      population: data.inputs.population,
      agricultureArea: data.inputs.agricultureArea,
      domesticStandard: data.inputs.domesticStandard,
      irrigationDemand: data.inputs.irrigationDemand,
      monthlySupply: data.inputs.monthlySupply
    });
    setLoadMessage(`✓ Data pilot "${data.name}" berhasil dimuat`);
    setTimeout(() => setLoadMessage(null), 3000);
  };

  const handleSaveWaterBalance = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const { error } = await saveWaterBalance({
        projectName: identitasLokasi.namaPekerjaan || 'Untitled Project',
        monthlyInputs: { ...inputs, location: identitasLokasi },
        monthlyResults: results,
        summary
      });

      if (error) {
        setSaveMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
      } else {
        setSaveMessage({ type: 'success', text: '✓ Berhasil menyimpan neraca air!' });
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui';
      setSaveMessage({ type: 'error', text: 'Error: ' + errorMessage });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 rounded-md border border-slate-200 shadow-sm overflow-hidden min-h-[85vh]">
      {/* Fixed Shell Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-white shadow-sm z-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-50 text-pupr-blue rounded-md shrink-0">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Analisis Neraca Air</h1>
            <p className="text-sm text-slate-500 font-medium">Water Balance Analysis · SNI 6728.1:2015</p>
          </div>
        </div>
      </div>

      {/* Internal Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">

        {/* Load Message Toast */}
        {loadMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-md shadow-sm border border-slate-200 bg-blue-50 text-blue-800 flex items-center gap-3 animate-fade-in max-w-md pointer-events-none">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span className="font-medium text-sm">{loadMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">

          {/* LEFT SIDEBAR (Span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="space-y-4 pb-4">

              {/* Project Banner (SSOT) */}
              <ProjectContextBanner />

              {/* Data Pilot Loader */}
              <Collapsible title="Data Pilot & Konfigurasi" defaultOpen={true}>
                <div className="space-y-4">
                  <WaterBalancePilotDataLoader onLoad={handleLoadPilotData} />
                </div>
              </Collapsible>

              {/* Formula Display */}
              <Collapsible title="Rumus Neraca Air" defaultOpen={false}>
                <WaterBalanceFormulaDisplay />
              </Collapsible>

              {/* SECTION 1: PARAMETER GLOBAL */}
              <Collapsible title="Parameter Masukan" defaultOpen={true}>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                      Jumlah Penduduk
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={inputs.population}
                        onChange={e => setInputs({ ...inputs, population: parseFloat(e.target.value) || 0 })}
                        className="w-full h-12 px-4 pr-16 text-base bg-slate-50 border border-slate-300 rounded-md font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">jiwa</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                      Luas Lahan Irigasi
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={inputs.agricultureArea}
                        onChange={e => setInputs({ ...inputs, agricultureArea: parseFloat(e.target.value) || 0 })}
                        className="w-full h-12 px-4 pr-16 text-base bg-slate-50 border border-slate-300 rounded-md font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">Ha</span>
                    </div>
                  </div>

                  <div>
                    <SNILabel
                      label="Standar Kebutuhan Air"
                      tooltip="Standar kebutuhan air domestik berdasarkan SNI untuk perencanaan sistem penyediaan air minum"
                      sniCode="SNI 03-7065-2005"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        value={inputs.domesticStandard}
                        onChange={e => setInputs({ ...inputs, domesticStandard: parseFloat(e.target.value) || 0 })}
                        className="w-full h-12 px-4 pr-20 text-base bg-slate-50 border border-slate-300 rounded-md font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">L/org/hr</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                      Kebutuhan Irigasi
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.irrigationDemand}
                        onChange={e => setInputs({ ...inputs, irrigationDemand: parseFloat(e.target.value) || 0 })}
                        className="w-full h-12 px-4 pr-20 text-base bg-slate-50 border border-slate-300 rounded-md font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">L/s/Ha</span>
                    </div>
                  </div>
                </div>
              </Collapsible>

              {/* SECTION 2: DEBIT ANDALAN — Method Selection */}
              <Collapsible title="Ketersediaan Air (Debit Andalan)" defaultOpen={true} badge="SNI 6738:2015">

                {/* Method Toggle */}
                <div className="flex rounded-md bg-slate-100 p-1 mb-4">
                  <button
                    onClick={() => setSupplyMethod('mock')}
                    className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${supplyMethod === 'mock'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    F.J. Mock (Hujan→Aliran)
                  </button>
                  <button
                    onClick={() => setSupplyMethod('manual')}
                    className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${supplyMethod === 'manual'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Input Manual
                  </button>
                </div>

                {supplyMethod === 'mock' ? (
                  <div className="space-y-4">
                    {/* Luas DAS — SmartOverrideInput */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Luas DAS</label>
                        {isLuasDasOverridden && (
                          <button
                            onClick={() => { setLuasDasLocal(''); }}
                            className="text-[9px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reset ke Data Master
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step={0.1}
                          value={luasDasLocal !== '' ? luasDasLocal : (luasDasGlobal > 0 ? String(luasDasGlobal) : '')}
                          placeholder={luasDasGlobal > 0 ? String(luasDasGlobal) : 'Masukkan luas DAS...'}
                          onChange={e => {
                            const val = e.target.value;
                            setLuasDasLocal(val);
                            // Also sync back to global store
                            if (val !== '') setLuasDas(val);
                          }}
                          className={`w-full h-10 px-3 pr-12 text-sm bg-white rounded-md font-semibold text-right focus:ring-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isLuasDasOverridden
                            ? 'border-2 border-amber-400 focus:border-amber-500 focus:ring-amber-500/20'
                            : 'border border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                            }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">km²</span>
                      </div>
                      {luasDasGlobal > 0 && !isLuasDasOverridden && (
                        <p className="text-[9px] text-slate-400 mt-1">Dari Master Data: {luasDasGlobal} km²</p>
                      )}
                    </div>

                    {/* Mock Parameters — Compact 2-col */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'smc', label: 'SMC', unit: 'mm', step: 10 },
                        { key: 'ism', label: 'ISM', unit: 'mm', step: 10 },
                        { key: 'infiltrationFactor', label: 'IF', unit: '', step: 0.05 },
                        { key: 'k', label: 'K', unit: '', step: 0.05 },
                      ].map(({ key, label, unit, step }) => (
                        <div key={key}>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{label}</label>
                          <div className="relative">
                            <input
                              type="number"
                              step={step}
                              value={mockParams[key as keyof typeof mockParams]}
                              onChange={e => setMockParams(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                              className="w-full h-10 px-3 pr-12 text-sm bg-white border border-slate-200 rounded-md font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">{unit}</span>}
                          </div>
                        </div>
                      ))}
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">m (Exposed Surface %)</label>
                        <div className="relative">
                          <input
                            type="number"
                            step={0.01}
                            value={mockParams.exposedSurface}
                            onChange={e => setMockParams(p => ({ ...p, exposedSurface: parseFloat(e.target.value) || 0 }))}
                            className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-md font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Probability target */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Probabilitas Andalan</label>
                      <select
                        value={targetProb}
                        onChange={e => setTargetProb(Number(e.target.value))}
                        className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-md font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      >
                        <option value={80}>Q80 — Irigasi</option>
                        <option value={90}>Q90 — PLTA</option>
                        <option value={95}>Q95 — Air Baku</option>
                      </select>
                    </div>

                    {/* Monthly Precipitation input (compact) */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Curah Hujan Bulanan (mm)</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {MONTH_LABELS.map((m, i) => (
                          <div key={m} className="text-center">
                            <div className="text-[9px] font-bold text-slate-400 mb-0.5">{m}</div>
                            <input
                              type="number"
                              value={monthlyPrecip[i]}
                              onChange={e => {
                                const v = [...monthlyPrecip]; v[i] = parseFloat(e.target.value) || 0; setMonthlyPrecip(v);
                              }}
                              className="w-full h-8 px-1 text-xs bg-white border border-slate-200 rounded text-center font-mono font-semibold focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly ETo input (compact) */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">ETo Bulanan (mm)</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {MONTH_LABELS.map((m, i) => (
                          <div key={m} className="text-center">
                            <div className="text-[9px] font-bold text-slate-400 mb-0.5">{m}</div>
                            <input
                              type="number"
                              value={monthlyETo[i]}
                              onChange={e => {
                                const v = [...monthlyETo]; v[i] = parseFloat(e.target.value) || 0; setMonthlyETo(v);
                              }}
                              className="w-full h-8 px-1 text-xs bg-white border border-slate-200 rounded text-center font-mono font-semibold focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mock error */}
                    {mockError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 font-medium">
                        {mockError}
                      </div>
                    )}

                    {/* Calculate button */}
                    <button
                      onClick={handleMockCalculate}
                      disabled={luasDasNum <= 0}
                      className="w-full min-h-[44px] py-3 bg-pupr-blue text-white text-white rounded-md font-bold hover:from-blue-700 hover:to-cyan-700 active:from-blue-800 active:to-cyan-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Zap className="w-5 h-5" />
                      Hitung Ketersediaan Air (F.J. Mock)
                    </button>
                  </div>
                ) : (
                  /* Manual mode — original UI */
                  <>
                    <button
                      onClick={() => setIsCalcModalOpen(true)}
                      className="w-full min-h-[44px] py-3 bg-pupr-blue text-white text-white rounded-md font-semibold hover:from-blue-700 hover:to-cyan-700 active:from-blue-800 active:to-cyan-800 transition-all shadow-md mb-4 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Kalkulator Hujan
                    </button>

                    <div className="bg-slate-50 rounded-md p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Data Bulanan (m³/s)</span>
                        <button
                          onClick={() => setIsInputModalOpen(true)}
                          className="text-xs font-semibold text-pupr-blue hover:text-blue-700 flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {MONTHS.map((month, index) => (
                          <div key={month} className="bg-white rounded-md px-2 py-2 border border-slate-200 text-center">
                            <div className="text-[10px] font-semibold text-slate-400 uppercase">{month}</div>
                            <div className="text-sm font-bold text-slate-700 font-mono">{inputs.monthlySupply[index]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </Collapsible>

              {/* SECTION 3: KEBUTUHAN AIR & NERACA FINAL */}
              <KalkulatorIrigasi
                monthlySupply={inputs.monthlySupply}
              />
            </div>
          </div>

          {/* MAIN CONTENT (Span 7) */}
          <div className="lg:col-span-7 flex flex-col gap-6 min-h-0 page-enter">

            {/* Save Message Toast */}
            {saveMessage && (
              <div className={`absolute top-0 right-0 z-50 px-6 py-4 rounded-md shadow-sm border flex items-center gap-3 animate-fade-in pointer-events-none ${saveMessage.type === 'success' ? 'bg-emerald-50/90 backdrop-blur-md border-emerald-500 text-emerald-800' : 'bg-red-50/90 backdrop-blur-md border-red-500 text-red-800'
                }`}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {saveMessage.type === 'success' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
                <span className="font-semibold text-sm">{saveMessage.text}</span>
              </div>
            )}

            {/* F.J. Mock Results — Conditional */}
            {mockResults && hasilMock && (
              <>
                {/* Q Andalan Highlight Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-md shadow-sm border border-blue-200/60 p-6 flex items-center gap-6">
                  <div className="p-3 bg-blue-100 rounded-md shrink-0">
                    <Droplet className="w-8 h-8 text-pupr-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                      Debit Andalan Q{hasilMock.probability}
                    </div>
                    <div className="text-4xl font-bold text-pupr-blue font-mono leading-none">
                      {hasilMock.qAndalan.toFixed(4)}
                    </div>
                    <div className="text-sm font-semibold text-slate-500 mt-1">m³/s · Metode F.J. Mock</div>
                  </div>
                  <div className="text-right shrink-0">
                    <ComplianceBadge sniCode="SNI 6738:2015" />
                  </div>
                </div>

                {/* Mock Summary Table */}
                <div className="bg-white/60 backdrop-blur-xl rounded-md shadow-sm border border-white/50 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-200/50 bg-white/40">
                    <h3 className="text-sm font-bold text-slate-800">Rekap Hasil F.J. Mock (12 Bulan)</h3>
                    <p className="text-[10px] text-slate-500">Transformasi Hujan → Aliran per bulan</p>
                  </div>
                  <div className="overflow-x-auto overflow-y-auto max-h-80">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="text-left py-2.5 px-3 font-bold text-slate-600">Bulan</th>
                          <th className="text-right py-2.5 px-3 font-bold text-pupr-blue">P (mm)</th>
                          <th className="text-right py-2.5 px-3 font-bold text-orange-600">ETo (mm)</th>
                          <th className="text-right py-2.5 px-3 font-bold text-cyan-600">WS (mm)</th>
                          <th className="text-right py-2.5 px-3 font-bold text-pupr-blue">BF (mm)</th>
                          <th className="text-right py-2.5 px-3 font-bold text-pupr-blue">DRO (mm)</th>
                          <th className="text-right py-2.5 px-3 font-bold text-slate-600">TRO (mm)</th>
                          <th className="text-right py-2.5 px-3 font-bold text-blue-700 bg-blue-50/80">Q (m³/s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockResults.map((r, i) => (
                          <tr key={i} className="border-b border-slate-100 even:bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                            <td className="py-2 px-3 font-bold text-slate-700 tabular-nums tracking-tight">{r.month}</td>
                            <td className="py-2 px-3 text-right font-mono text-pupr-blue tabular-nums tracking-tight">{r.precipitation}</td>
                            <td className="py-2 px-3 text-right font-mono text-orange-600 tabular-nums tracking-tight">{r.eto}</td>
                            <td className="py-2 px-3 text-right font-mono text-cyan-600 tabular-nums tracking-tight">{r.waterSurplus}</td>
                            <td className="py-2 px-3 text-right font-mono text-pupr-blue tabular-nums tracking-tight">{r.baseFlow}</td>
                            <td className="py-2 px-3 text-right font-mono text-pupr-blue tabular-nums tracking-tight">{r.directRunoff}</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums tracking-tight">{r.totalRunoff}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-blue-700 bg-blue-50/30 tabular-nums tracking-tight">{r.discharge}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* FINAL NERACA TABLE — Conditional */}
            {neracaFinal && (
              <div className="bg-white/60 backdrop-blur-xl rounded-md shadow-sm border border-white/50 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200/50 bg-white/40 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Neraca Air Final (Surplus/Defisit)</h3>
                    <p className="text-[10px] text-slate-500">Ketersediaan − (Irigasi + Air Baku + Lingkungan)</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-md bg-pupr-blue" />
                      Surplus: {neracaFinal.filter(r => r.status === 'Surplus').length} bln
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-md bg-rose-500" />
                      Defisit: {neracaFinal.filter(r => r.status === 'Defisit').length} bln
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-80">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="text-left py-2.5 px-3 font-bold text-slate-600">Bulan</th>
                        <th className="text-right py-2.5 px-3 font-bold text-pupr-blue">Supply</th>
                        <th className="text-right py-2.5 px-3 font-bold text-pupr-blue">Irigasi</th>
                        <th className="text-right py-2.5 px-3 font-bold text-orange-600">Air Baku</th>
                        <th className="text-right py-2.5 px-3 font-bold text-pupr-blue">Lingk.</th>
                        <th className="text-right py-2.5 px-3 font-bold text-slate-600">Total</th>
                        <th className="text-right py-2.5 px-3 font-bold text-slate-800 bg-slate-100/80">Neraca</th>
                        <th className="text-center py-2.5 px-3 font-bold text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {neracaFinal.map((r, i) => (
                        <tr key={i} className={`border-b border-slate-100 transition-colors ${r.status === 'Defisit' ? 'bg-rose-50/40' : 'even:bg-slate-50/50'
                          } hover:bg-slate-100/50`}>
                          <td className="py-2 px-3 font-bold text-slate-700 tabular-nums tracking-tight">{r.month}</td>
                          <td className="py-2 px-3 text-right font-mono text-pupr-blue tabular-nums tracking-tight">{r.ketersediaan.toFixed(4)}</td>
                          <td className="py-2 px-3 text-right font-mono text-pupr-blue tabular-nums tracking-tight">{r.irigasi.toFixed(4)}</td>
                          <td className="py-2 px-3 text-right font-mono text-orange-600 tabular-nums tracking-tight">{r.airBaku.toFixed(4)}</td>
                          <td className="py-2 px-3 text-right font-mono text-pupr-blue tabular-nums tracking-tight">{r.lingkungan.toFixed(4)}</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums tracking-tight">{r.totalKebutuhan.toFixed(4)}</td>
                          <td className={`py-2 px-3 text-right font-mono font-bold bg-slate-50/50 ${r.neraca >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                            {r.neraca >= 0 ? '+' : ''}{r.neraca.toFixed(4)}
                          </td>
                          <td className="py-2 px-3 text-center tabular-nums tracking-tight">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${r.status === 'Surplus' ? 'bg-emerald-100 text-emerald-700' :
                              r.status === 'Defisit' ? 'bg-rose-100 text-rose-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Critical Month Alert */}
                {neracaFinal.some(r => r.status === 'Defisit') && (
                  <div className="px-5 py-3 bg-rose-50/60 border-t border-rose-200/50 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <p className="text-xs text-rose-800 font-medium">
                      Bulan kritis: <strong>
                        {neracaFinal.reduce((min, r) => r.neraca < min.neraca ? r : min).month}
                      </strong> dengan defisit {Math.abs(neracaFinal.reduce((min, r) => r.neraca < min.neraca ? r : min).neraca).toFixed(4)} m³/s
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* KPI CARDS — Glassmorphism */}
            <div ref={kpiCardsRef} className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3">
              <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-md shadow-sm hover:shadow-sm transition-all duration-300 p-5 group relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    Total Ketersediaan
                    <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                      Total ketersediaan air dari sumber (debit andalan)
                    </div>
                  </span>
                  <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-pupr-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-pupr-blue font-mono">{totalSupply.toFixed(1)}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">m³/s</div>
              </div>

              <div className="bg-white rounded-md shadow-sm border border-slate-200 p-5 group relative transition-all duration-fast hover:-translate-y-1 hover:shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    Total Kebutuhan
                    <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                      Total kebutuhan air domestik dan pertanian
                    </div>
                  </span>
                  <div className="w-10 h-10 rounded-md bg-orange-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-600 font-mono">{totalDemand.toFixed(1)}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">m³/s</div>
              </div>

              <div className={`bg-white rounded-md shadow-sm border-2 ${netBalance >= 0 ? 'border-emerald-300 bg-emerald-50/30' : 'border-rose-300 bg-rose-50/30'} p-5 group relative transition-all duration-fast hover:-translate-y-1 hover:shadow-sm`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    Status Neraca
                    <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                      Selisih antara ketersediaan dan kebutuhan air
                    </div>
                  </span>
                  <div className={`w-10 h-10 rounded-md ${netBalance >= 0 ? 'bg-emerald-100' : 'bg-rose-100'} flex items-center justify-center`}>
                    <svg className={`w-5 h-5 ${netBalance >= 0 ? 'text-pupr-blue' : 'text-rose-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={netBalance >= 0 ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                    </svg>
                  </div>
                </div>
                <div className={`text-3xl font-bold ${netBalance >= 0 ? 'text-pupr-blue' : 'text-rose-600'} font-mono`}>
                  {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(1)}
                </div>
                <div className={`text-xs font-semibold mt-1 ${netBalance >= 0 ? 'text-pupr-blue' : 'text-rose-600'}`}>
                  {netBalance >= 0 ? 'SURPLUS' : 'DEFISIT'}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <ComplianceBadge sniCode="SNI 19-6728.1-2002" />
                </div>
              </div>

              <div className="bg-white rounded-md shadow-sm border border-rose-200 p-5 group relative transition-all duration-fast hover:-translate-y-1 hover:shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    Bulan Kritis
                    <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                      Bulan dengan defisit air terbesar
                    </div>
                  </span>
                  <div className="w-10 h-10 rounded-md bg-rose-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-rose-600">{summary?.criticalMonth?.month || '-'}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  {summary?.criticalMonth ? `${Math.abs(summary.criticalMonth.balance).toFixed(1)} m³/s` : 'Tidak ada'}
                </div>
              </div>
            </div>

            {/* CHART SECTION */}
            <div className="bg-white/60 backdrop-blur-xl rounded-md shadow-sm border border-white/50 p-4 md:p-6 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-800">Grafik Neraca Air Bulanan</h2>
                    <ComplianceBadge sniCode="SNI 19-6728.1-2002" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Perbandingan Ketersediaan vs Kebutuhan Air</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleSaveWaterBalance}
                    disabled={isSaving}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-pupr-blue text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span className="hidden sm:inline">{isSaving ? 'Menyimpan...' : 'Simpan Neraca'}</span>
                    <span className="sm:hidden">{isSaving ? 'Simpan...' : 'Simpan'}</span>
                  </button>
                  {onConsultAI && (
                    <button
                      onClick={onConsultAI}
                      className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 active:bg-slate-900 transition-colors text-sm font-bold flex items-center justify-center gap-2 shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="hidden sm:inline">Analisis AI</span>
                      <span className="sm:hidden">AI</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="h-56 xs:h-64 sm:h-80 md:h-96">
                <WaterBalanceChart data={results} />
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200/60">
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">Catatan:</span> Perhitungan mengikuti standar <span className="font-semibold text-pupr-blue">SNI 19-6728.1-2002</span> tentang Penyusunan Neraca Sumber Daya Air pada Wilayah Sungai.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* MODALS */}
      <DependableFlowModal
        isOpen={isCalcModalOpen}
        onClose={() => setIsCalcModalOpen(false)}
        onApply={handleUseCalculatedFlow}
      />

      {
        isInputModalOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsInputModalOpen(false)}>
            <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-md shadow-sm w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Input Data Debit Bulanan</h3>
                  <p className="text-xs text-slate-500 mt-1">Ketersediaan Air (m³/s)</p>
                </div>
                <button onClick={() => setIsInputModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                {MONTHS.map((month, index) => (
                  <div key={month} className="bg-white/50 backdrop-blur-md rounded-md p-4 border border-white/60 shadow-inner">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">{month}</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.monthlySupply[index]}
                        onChange={e => handleSupplyChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full h-12 px-4 pr-16 text-lg bg-white/70 border border-slate-200 rounded-md font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">m³/s</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setIsInputModalOpen(false)}
                  className="px-6 py-3 bg-pupr-blue/90 hover:bg-pupr-blue text-white rounded-md font-semibold transition-colors shadow-md backdrop-blur-md"
                >
                  Simpan &amp; Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div >
  );
};
