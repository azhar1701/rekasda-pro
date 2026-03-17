import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Droplet, 
  Settings2, 
  Zap, 
  LayoutDashboard, 
  Database, 
  RefreshCw, 
  FileText,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { 
  calculateFJMock, 
  calculateWeibullDependableFlow,
  DEFAULT_ETO_INDONESIA,
  DAYS_IN_MONTH,
  MONTH_LABELS,
  type MockParams,
  type MockMonthlyInput,
  type MockMonthlyResult
} from '@/lib/engine/fjMock';
import { calculateWaterBalance, type WaterBalanceInputs } from '@/services/waterBalanceEngine';
import { WaterBalanceChart } from '../WaterBalanceChart';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';
import { toast } from '@/hooks/useToast';

interface Props {
  onConsultAI?: () => void;
}

export const WaterBalanceRebuild: React.FC<Props> = ({ onConsultAI }) => {
  const hydroState = useHydrologyStore();
  const { 
    luasDas, 
    setHasilMock, 
    setNeracaFinal,
    hasilMock,
    neracaFinal
  } = hydroState;

  // Local State for Inputs (Adopting Workstation Pattern)
  const [activeTab, setActiveTab] = useState<'ketersediaan' | 'kebutuhan' | 'neraca'>('ketersediaan');
  const [isCalculating, setIsCalculating] = useState(false);

  // FJ Mock Params
  const [mockParams, setMockParams] = useState({
    smc: 200,
    ism: 200,
    infiltrationFactor: 0.4,
    k: 0.7,
    exposedSurface: 0.1,
  });

  const [monthlyPrecip, setMonthlyPrecip] = useState<number[]>([
    300, 280, 250, 200, 120, 80, 60, 50, 80, 150, 220, 280,
  ]);
  
  const [monthlyETo, setMonthlyETo] = useState<number[]>([...DEFAULT_ETO_INDONESIA]);
  const [targetProb, setTargetProb] = useState(80);

  // Water Balance Parameters
  const [wbInputs, setWbInputs] = useState<WaterBalanceInputs>({
    population: 5000,
    agricultureArea: 100,
    domesticStandard: 100,
    irrigationDemand: 1.0,
    monthlySupply: Array(12).fill(0)
  });

  const luasDasNum = parseFloat(String(luasDas)) || 0;

  // Sync supply when mock results change
  useEffect(() => {
    if (hasilMock?.monthlyResults) {
      const supply = hasilMock.monthlyResults.map((r: any) => r.discharge);
      setWbInputs(prev => ({ ...prev, monthlySupply: supply }));
    }
  }, [hasilMock]);

  const handleRunSimulation = useCallback(() => {
    if (luasDasNum <= 0) {
      toast.error('Luas DAS belum valid (0). Atur di Morfometri terlebih dahulu.');
      return;
    }

    setIsCalculating(true);
    
    // Simulate high-density calculation
    setTimeout(() => {
      try {
        // 1. FJ Mock Calculation
        const params: MockParams = {
          luasDas: luasDasNum,
          ...mockParams
        };

        const data_mock: MockMonthlyInput[] = MONTH_LABELS.map((month, i) => ({
          month,
          precipitation: monthlyPrecip[i],
          eto: monthlyETo[i],
          daysInMonth: DAYS_IN_MONTH[i]
        }));

        const results_mock: MockMonthlyResult[] = calculateFJMock(params, data_mock);
        
        // 2. Weibull/Rank for Dependable Flow
        const weibullResults = calculateWeibullDependableFlow(results_mock.map(r => r.discharge), targetProb);

        // 3. Water Balance Calculation
        const currentWbInputs = { ...wbInputs, monthlySupply: results_mock.map(r => r.discharge) };
        const results = calculateWaterBalance(currentWbInputs);
        const nerdacaFinalRows = results.map(r => ({
          month: r.month,
          ketersediaan: r.supply,
          irigasi: r.agricultureDemand,
          airBaku: r.domesticDemand,
          lingkungan: r.environmentalFlow,
          totalKebutuhan: r.totalDemand,
          neraca: r.balance,
          status: r.status
        }));

        // Update Store
        setHasilMock({
          monthlyResults: results_mock,
          qAndalan: weibullResults.qAndalan,
          probability: weibullResults.probability,
          metode: 'mock',
        });
        setNeracaFinal(nerdacaFinalRows);

        toast.success('Simulasi Neraca Air Berhasil Diverifikasi.');
        setActiveTab('neraca');
      } catch (error: any) {
        toast.error(`Gagal: ${error.message}`);
      } finally {
        setIsCalculating(false);
      }
    }, 800);
  }, [luasDasNum, mockParams, monthlyPrecip, monthlyETo, targetProb, wbInputs, setHasilMock, setNeracaFinal]);

  const summary = useMemo(() => {
    if (!neracaFinal || neracaFinal.length === 0) return null;
    
    const surplusMonths = neracaFinal.filter(r => r.neraca > 0).length;
    const deficitMonths = neracaFinal.filter(r => r.neraca < 0).length;
    const criticalMonth = neracaFinal.reduce((min, r) => r.neraca < min.neraca ? r : min, neracaFinal[0]);
    
    return {
      surplusMonths,
      deficitMonths,
      criticalMonth
    };
  }, [neracaFinal]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <ProjectContextBanner />
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Navigator (Input Panels) */}
        <div className="w-full lg:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigator Analisis</h3>
            <button 
              onClick={handleRunSimulation}
              disabled={isCalculating}
              className="px-3 py-1.5 bg-pupr-blue hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              {isCalculating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-pupr-yellow" />}
              Proses
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Supply Params */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-pupr-surface border border-pupr-blue/10">
                    <Droplet className="w-3 h-3 text-pupr-blue" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">Ketersediaan (FJ Mock)</span>
                </div>
                
                <div className="space-y-3 pl-2 border-l border-slate-100">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMC (Soil Moisture Cap)</label>
                    <input 
                      type="number" 
                      value={mockParams.smc}
                      onChange={(e) => setMockParams(p => ({ ...p, smc: Number(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none px-3 py-2 text-xs font-bold tabular-nums outline-none focus:ring-1 focus:ring-pupr-blue"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faktor Infiltrasi</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={mockParams.infiltrationFactor}
                      onChange={(e) => setMockParams(p => ({ ...p, infiltrationFactor: Number(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none px-3 py-2 text-xs font-bold tabular-nums outline-none focus:ring-1 focus:ring-pupr-blue"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">K (Recession Coeff)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={mockParams.k}
                      onChange={(e) => setMockParams(p => ({ ...p, k: Number(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none px-3 py-2 text-xs font-bold tabular-nums outline-none focus:ring-1 focus:ring-pupr-blue"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Probabilitas Andalan (%)</label>
                    <input 
                      type="number" 
                      step="5"
                      value={targetProb}
                      onChange={(e) => setTargetProb(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none px-3 py-2 text-xs font-bold tabular-nums outline-none focus:ring-1 focus:ring-pupr-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Demand Params */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-orange-50 border border-orange-200">
                    <Settings2 className="w-3 h-3 text-orange-600" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">Kebutuhan Wilayah</span>
                </div>
                
                <div className="space-y-3 pl-2 border-l border-slate-100">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Penduduk (Jiwa)</label>
                    <input 
                      type="number" 
                      value={wbInputs.population}
                      onChange={(e) => setWbInputs(p => ({ ...p, population: Number(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none px-3 py-2 text-xs font-bold tabular-nums outline-none focus:ring-1 focus:ring-pupr-blue"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lahan Pertanian (Ha)</label>
                    <input 
                      type="number" 
                      value={wbInputs.agricultureArea}
                      onChange={(e) => setWbInputs(p => ({ ...p, agricultureArea: Number(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none px-3 py-2 text-xs font-bold tabular-nums outline-none focus:ring-1 focus:ring-pupr-blue"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kebutuhan Irigasi (L/s/Ha)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={wbInputs.irrigationDemand}
                      onChange={(e) => setWbInputs(p => ({ ...p, irrigationDemand: Number(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none px-3 py-2 text-xs font-bold tabular-nums outline-none focus:ring-1 focus:ring-pupr-blue"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bantuan AI (Gemini)</span>
            </div>
            <button 
              onClick={onConsultAI}
              className="w-full py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Konsultasi Parameter
            </button>
          </div>
        </div>

        {/* Right Workspace (Tabs + Results) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950">
          <div className="flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('ketersediaan')}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'ketersediaan' ? 'border-pupr-blue text-pupr-blue bg-pupr-surface' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Ketersediaan
            </button>
            <button 
              onClick={() => setActiveTab('kebutuhan')}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'kebutuhan' ? 'border-pupr-blue text-pupr-blue bg-pupr-surface' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Kebutuhan
            </button>
            <button 
              onClick={() => setActiveTab('neraca')}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'neraca' ? 'border-pupr-blue text-pupr-blue bg-pupr-surface' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Hasil Neraca
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'ketersediaan' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-150">
                <div className="flex items-center gap-2 mb-4">
                  <LayoutDashboard className="w-4 h-4 text-pupr-blue" />
                  <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Ketersediaan Air Bulanan (FJ Mock)</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-12 overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-100">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200">
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulan</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-6">Precipitasi (mm)</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-6">ETo (mm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {MONTH_LABELS.map((month, i) => (
                          <tr key={month} className="hover:bg-pupr-surface transition-colors">
                            <td className="px-4 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">{month}</td>
                            <td className="px-2 py-2">
                              <input 
                                type="number"
                                value={monthlyPrecip[i]}
                                onChange={(e) => {
                                  const newVal = [...monthlyPrecip];
                                  newVal[i] = Number(e.target.value);
                                  setMonthlyPrecip(newVal);
                                }}
                                className="w-full bg-white dark:bg-slate-900 border-none px-2 py-1 text-xs font-bold tabular-nums text-right outline-none focus:bg-slate-50 dark:focus:bg-slate-800"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                type="number"
                                value={monthlyETo[i]}
                                onChange={(e) => {
                                  const newVal = [...monthlyETo];
                                  newVal[i] = Number(e.target.value);
                                  setMonthlyETo(newVal);
                                }}
                                className="w-full bg-white dark:bg-slate-900 border-none px-2 py-1 text-xs font-bold tabular-nums text-right outline-none focus:bg-slate-50 dark:focus:bg-slate-800"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'kebutuhan' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-150">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-4 h-4 text-orange-600" />
                  <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Proyeksi Kebutuhan Air (Demand Matrix)</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {neracaFinal && neracaFinal.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-slate-800">Bulan</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-r border-slate-200 dark:border-slate-800">Air Baku (m³/s)</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-r border-slate-200 dark:border-slate-800">Irigasi (m³/s)</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-r border-slate-200 dark:border-slate-800">Pemeliharaan (m³/s)</th>
                            <th className="px-4 py-3 text-[10px] font-black text-orange-600 uppercase tracking-widest text-right bg-orange-50 dark:bg-orange-900/10">Total (m³/s)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {neracaFinal.map((row) => (
                            <tr key={row.month} className="hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors tabular-nums">
                              <td className="px-4 py-2.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase border-r border-slate-100 dark:border-slate-800">{row.month}</td>
                              <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400 text-right border-r border-slate-100 dark:border-slate-800">{Number(row.airBaku || 0).toFixed(3)}</td>
                              <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400 text-right border-r border-slate-100 dark:border-slate-800">{Number(row.irigasi || 0).toFixed(3)}</td>
                              <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400 text-right border-r border-slate-100 dark:border-slate-800">{Number(row.lingkungan || 0).toFixed(3)}</td>
                              <td className="px-4 py-2.5 text-[11px] font-black text-orange-600 text-right bg-orange-50/30 dark:bg-orange-900/5">{Number(row.totalKebutuhan || 0).toFixed(3)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-800">
                           <tr className="tabular-nums">
                             <td className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 dark:border-slate-800">Rata-Rata</td>
                             <td className="px-4 py-3 text-[11px] font-black text-slate-600 dark:text-slate-300 text-right border-r border-slate-200 dark:border-slate-800">{(neracaFinal.reduce((acc, r) => acc + (r.airBaku || 0), 0) / 12).toFixed(3)}</td>
                             <td className="px-4 py-3 text-[11px] font-black text-slate-600 dark:text-slate-300 text-right border-r border-slate-200 dark:border-slate-800">{(neracaFinal.reduce((acc, r) => acc + (r.irigasi || 0), 0) / 12).toFixed(3)}</td>
                             <td className="px-4 py-3 text-[11px] font-black text-slate-600 dark:text-slate-300 text-right border-r border-slate-200 dark:border-slate-800">{(neracaFinal.reduce((acc, r) => acc + (r.lingkungan || 0), 0) / 12).toFixed(3)}</td>
                             <td className="px-4 py-3 text-[11px] font-black text-orange-600 text-right bg-orange-50/50 dark:bg-orange-900/10">{(neracaFinal.reduce((acc, r) => acc + (r.totalKebutuhan || 0), 0) / 12).toFixed(3)}</td>
                           </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-300 gap-4">
                      <AlertTriangle className="w-12 h-12" />
                      <p className="text-[11px] font-black uppercase tracking-[0.2em]">Kebutuhan Belum Diproses</p>
                      <p className="text-[10px] text-slate-400 font-bold max-w-xs text-center uppercase tracking-wider">Klik "Proses" pada navigator untuk menghitung kebutuhan domestik dan irigasi secara volumetrik.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'neraca' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-150">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-pupr-blue" />
                  <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Ringkasan Analisis Neraca Air</h3>
                </div>

                {summary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-6 bg-white border border-slate-200">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Supply</p>
                      <p className="text-2xl font-black text-pupr-blue tabular-nums leading-none">{(neracaFinal || []).reduce((acc, r) => acc + (r.ketersediaan || 0), 0).toFixed(2)}</p>
                    </div>
                    <div className="p-6 bg-white border border-slate-200">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Kebutuhan</p>
                      <p className="text-2xl font-black text-orange-600 tabular-nums leading-none">{(neracaFinal || []).reduce((acc, r) => acc + (r.totalKebutuhan || 0), 0).toFixed(2)}</p>
                    </div>
                    <div className={`p-6 border ${summary.deficitMonths > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${summary.deficitMonths > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>Status Ketahanan</p>
                      <p className={`text-2xl font-black tabular-nums leading-none ${summary.deficitMonths > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {summary.deficitMonths > 0 ? 'DEFISIT' : 'SURPLUS'}
                      </p>
                    </div>
                    <div className="p-6 bg-slate-900 border border-slate-800">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Bulan Kritis</p>
                      <p className="text-2xl font-black text-white leading-none">{summary.criticalMonth?.month || '-'}</p>
                      {summary.criticalMonth && (
                        <p className="text-[10px] text-white/50 font-bold mt-1 tabular-nums">
                          {Math.abs(summary.criticalMonth.neraca || 0).toFixed(3)} m³/s
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Visual Chart Integration */}
                <div className="bg-white border border-slate-200 p-6 h-[400px]">
                  <WaterBalanceChart data={neracaFinal || []} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
