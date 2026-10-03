import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  WaterBalanceInputs,
  calculateWaterBalance,
  getWaterBalanceSummary,
  WaterBalanceResult,
  WaterBalanceSummary,
  DEFAULT_MONTHS,
} from '@/services/waterBalanceEngine';
import { WaterBalanceChart } from './WaterBalanceChart';
import { WaterBalanceKpiGrid } from './WaterBalanceKpiGrid';
import { SequentPeakCard } from './SequentPeakCard';
import { WaterBalanceWhiteBox } from './WaterBalanceWhiteBox';
import { DependableFlowModal } from '@/components/ui/modals/DependableFlowModal';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';
import { saveWaterBalance } from '@/services/calculationService';
import { SNILabel, ComplianceBadge } from '@/components/ui/data-display/ComplianceComponents';
import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';
import { Collapsible } from '@/components/ui/Collapsible';
import { Droplet, AlertTriangle, Zap, Download, Sparkles } from 'lucide-react';
import { useHydrologyStore, type DataHujan } from '@/stores/useHydrologyStore';
import {
  DEFAULT_ETO_INDONESIA,
  DAYS_IN_MONTH,
  MONTH_LABELS,
  calculateFJMock,
  calculateWeibullDependableFlow,
  calculateMultiYearFJMock,
  type MockParams,
  type MockMonthlyInput,
  type MockMonthlyResult,
  type MonthlyDependableFlowResult,
  type MultiYearFJMockInput,
} from '@/lib/engine/fjMock';
import { aggregateMonthlyRainfall, type MultiYearMonthlyRainfall } from '@/utils/rainfallSeriesUtils';
import { KalkulatorIrigasi } from './KalkulatorIrigasi';
import { toast } from '@/hooks/useToast';

interface Props {
  onConsultAI?: () => void;
  onNavigateToEmbung?: () => void;
}

export const WaterBalanceTab: React.FC<Props> = ({ onConsultAI, onNavigateToEmbung }) => {
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [inputs, setInputs] = useState<WaterBalanceInputs>({
    population: 5000,
    agricultureArea: 100,
    domesticStandard: 100,
    irrigationDemand: 1.0,
    monthlySupply: [2.5, 2.3, 2.0, 1.8, 1.5, 1.2, 1.0, 0.9, 1.1, 1.4, 1.8, 2.2],
  });

  const [results, setResults] = useState<WaterBalanceResult[]>([]);
  const [summary, setSummary] = useState<WaterBalanceSummary | null>(null);

  // ── F.J. Mock & Hydrology Store Integration ──
  const {
    luasDas,
    hasilMock,
    setHasilMock,
    setNeracaFinal,
    setHasilNeraca,
    setLuasDas,
    identitasLokasi,
    dataHujan,
    selectedStasiun,
    arealRainfallThiessen,
    arealRainfallAlgebraic,
  } = useHydrologyStore();

  const [luasDasLocal, setLuasDasLocal] = useState<string>('');
  const luasDasGlobal = parseFloat(luasDas) || 0;
  const luasDasEffective = luasDasLocal !== '' ? (parseFloat(luasDasLocal) || 0) : luasDasGlobal;
  const isLuasDasOverridden = luasDasLocal !== '' && parseFloat(luasDasLocal) !== luasDasGlobal;

  useEffect(() => {
    if (!luasDas) {
      setLuasDasLocal('');
    }
  }, [luasDas]);

  const [supplyMethod, setSupplyMethod] = useState<'manual' | 'mock'>('manual');
  const [rainSource, setRainSource] = useState<'master_station' | 'master_thiessen' | 'manual'>('master_station');
  const [mockParams, setMockParams] = useState({
    smc: 200,
    ism: 200,
    infiltrationFactor: 0.4,
    k: 0.7,
    exposedSurface: 0.1,
  });
  const [monthlyETo] = useState<number[]>([...DEFAULT_ETO_INDONESIA]);
  const [monthlyPrecip, setMonthlyPrecip] = useState<number[]>([
    300, 280, 250, 200, 120, 80, 60, 50, 80, 150, 220, 280,
  ]);
  const [targetProb, setTargetProb] = useState(80);
  const [mockResults, setMockResults] = useState<MockMonthlyResult[] | null>(null);
  const [multiYearMockResult, setMultiYearMockResult] = useState<MonthlyDependableFlowResult | null>(null);
  const [mockError, setMockError] = useState<string | null>(null);
  const luasDasNum = luasDasEffective;

  // Derive multi-year rainfall from Master Data or Thiessen
  const multiYearRainfall: MultiYearMonthlyRainfall | null = useMemo(() => {
    let dataset: DataHujan[] = [];
    if (rainSource === 'master_station') {
      if (selectedStasiun) {
        dataset = dataHujan.filter(d => d.stasiun_id === selectedStasiun.id);
      } else {
        dataset = dataHujan;
      }
    } else if (rainSource === 'master_thiessen') {
      dataset = arealRainfallThiessen || arealRainfallAlgebraic || [];
    }
    if (!dataset || dataset.length === 0) return null;
    try {
      const agg = aggregateMonthlyRainfall(dataset);
      return agg.years.length > 0 ? agg : null;
    } catch {
      return null;
    }
  }, [rainSource, selectedStasiun, dataHujan, arealRainfallThiessen, arealRainfallAlgebraic]);

  // Sync monthlyPrecip from multiYearRainfall average when available in master mode
  useEffect(() => {
    if (rainSource !== 'manual' && multiYearRainfall && multiYearRainfall.averageMonthly.length === 12) {
      setMonthlyPrecip(multiYearRainfall.averageMonthly.map((v: number) => Math.round(v * 10) / 10));
    }
  }, [rainSource, multiYearRainfall]);

  // ── Core Water Balance Computation Engine ──
  useEffect(() => {
    try {
      const balanceResults = calculateWaterBalance(inputs);
      setResults(balanceResults);
      const sum = getWaterBalanceSummary(balanceResults);
      setSummary(sum);

      // Harmonize with Store for downstream modules (Embung, AI context, etc.)
      const neracaFinalRows = balanceResults.map(r => ({
        month: r.month,
        ketersediaan: r.supply,
        irigasi: r.agricultureDemand,
        airBaku: r.domesticDemand + (r.industrialDemand || 0),
        lingkungan: r.environmentalFlow,
        totalKebutuhan: r.totalDemand,
        neraca: r.balance,
        status: r.status,
      }));

      setNeracaFinal(neracaFinalRows);

      setHasilNeraca({
        isSurplus: sum.netBalance >= 0,
        totalSurplusDefisit: sum.netBalance,
        bulanKritis: sum.criticalMonth?.month || '-',
        chartData: balanceResults.map(r => ({
          bulan: r.month,
          ketersediaan: r.supply,
          kebutuhan: r.totalDemand,
          neraca: r.balance,
        })),
        waterScarcity: {
          ikaPercent: sum.waterScarcity.ikaPercent,
          status: sum.waterScarcity.status,
          description: sum.waterScarcity.description,
          badgeColor: sum.waterScarcity.badgeColor,
        },
        storageRequiredM3: sum.storageRequiredM3,
        storageRequiredJutaM3: sum.storageRequiredJutaM3,
        monthlySupply: balanceResults.map(r => r.supply),
        monthlyDemand: balanceResults.map(r => r.totalDemand),
      });
    } catch (err: any) {
      console.error('Water Balance calculation error:', err);
    }
  }, [inputs, setNeracaFinal, setHasilNeraca]);

  const handleSupplyChange = (index: number, value: number) => {
    const newSupply = [...inputs.monthlySupply];
    newSupply[index] = value;
    setInputs(prev => ({ ...prev, monthlySupply: newSupply }));
  };

  const handleUseCalculatedFlow = (flow: number[]) => {
    setInputs(prev => ({ ...prev, monthlySupply: flow }));
  };

  // ── Receive Dynamic KP-01 Irrigation Demand ──
  const handleDemandCalculated = useCallback((drSeries: number[], _rawWaterM3s: number) => {
    setInputs(prev => ({
      ...prev,
      dynamicIrrigationDemand: drSeries,
    }));
  }, []);

  // ── F.J. Mock Calculate Handler ──
  const [isMockCalculating, setIsMockCalculating] = useState(false);

  const handleMockCalculate = useCallback(() => {
    setMockError(null);
    setIsMockCalculating(true);

    setTimeout(() => {
      try {
        if (luasDasNum <= 0) {
          setMockError('Luas DAS belum diisi. Atur di Master Data terlebih dahulu.');
          setIsMockCalculating(false);
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

        if (rainSource !== 'manual' && multiYearRainfall && multiYearRainfall.years.length >= 2) {
          // Multi-year continuous simulation per SNI 6738:2015 & KP-01
          const yearsData: MultiYearFJMockInput[] = multiYearRainfall.years.map(yr => ({
            year: yr,
            monthlyPrecip: multiYearRainfall.monthlyByYear[yr] || new Array(12).fill(0),
            monthlyETo: monthlyETo,
          }));

          const myRes = calculateMultiYearFJMock(params, yearsData, targetProb);
          setMultiYearMockResult(myRes);

          // Update Water Balance monthly supply with 12 monthly Q80 values
          setInputs(prev => ({ ...prev, monthlySupply: myRes.monthlyQAndalan }));

          // Show the latest year in detailed monthly simulation table
          const latestYr = multiYearRainfall.years[multiYearRainfall.years.length - 1];
          const latestYearResults = myRes.continuousResults.filter(r => r.year === latestYr);
          setMockResults(latestYearResults);

          // Save to store
          setHasilMock({
            monthlyResults: latestYearResults.map((r: MockMonthlyResult) => ({
              month: r.month,
              precipitation: r.precipitation,
              eto: r.eto,
              waterSurplus: r.waterSurplus,
              baseFlow: r.baseFlow,
              directRunoff: r.directRunoff,
              totalRunoff: r.totalRunoff,
              discharge: r.discharge,
              daysInMonth: r.daysInMonth,
            })),
            qAndalan: myRes.monthlyQAndalan.reduce((a, b) => a + b, 0) / 12,
            probability: targetProb,
            metode: 'mock',
            monthlyQAndalan: myRes.monthlyQAndalan,
            monthlyRAndalan: myRes.monthlyRAndalan,
            yearsCount: myRes.yearsCount,
          });
          toast.success(`F.J. Mock multi-tahun berhasil dihitung (${myRes.yearsCount} tahun data).`);
        } else {
          // Single-year fallback calculation
          const data_mock: MockMonthlyInput[] = MONTH_LABELS.map((month, i) => ({
            month,
            precipitation: monthlyPrecip[i],
            eto: monthlyETo[i],
            daysInMonth: DAYS_IN_MONTH[i],
          }));

          const results_mock = calculateFJMock(params, data_mock);
          const dischargeSeries = results_mock.map((r: MockMonthlyResult) => r.discharge);
          const weibullResults = calculateWeibullDependableFlow(dischargeSeries, targetProb);

          setMockResults(results_mock);
          setMultiYearMockResult(null);

          // Apply Mock discharges as monthlySupply for Water Balance
          setInputs(prev => ({ ...prev, monthlySupply: dischargeSeries }));

          // Save to store
          setHasilMock({
            monthlyResults: results_mock.map((r: MockMonthlyResult) => ({
              month: r.month,
              precipitation: r.precipitation,
              eto: r.eto,
              waterSurplus: r.waterSurplus,
              baseFlow: r.baseFlow,
              directRunoff: r.directRunoff,
              totalRunoff: r.totalRunoff,
              discharge: r.discharge,
              daysInMonth: r.daysInMonth,
            })),
            qAndalan: weibullResults.qAndalan,
            probability: weibullResults.probability,
            metode: 'mock',
            monthlyQAndalan: dischargeSeries,
            monthlyRAndalan: monthlyPrecip,
            yearsCount: 1,
          });
          toast.success('F.J. Mock berhasil dihitung.');
        }
      } catch (err: any) {
        setMockError(err.message || 'Perhitungan F.J. Mock gagal.');
      } finally {
        setIsMockCalculating(false);
      }
    }, 100);
  }, [luasDasNum, mockParams, monthlyPrecip, monthlyETo, targetProb, rainSource, multiYearRainfall, setHasilMock, setInputs]);

  const totalSupply = inputs.monthlySupply.reduce((a, b) => a + b, 0);
  const totalDemand = results.reduce((a, b) => a + Number(b.totalDemand), 0);
  const netBalance = totalSupply - totalDemand;

  const handleExportCsv = () => {
    if (!results || results.length === 0) return;
    const headers = [
      'Bulan',
      'Ketersediaan (m3/s)',
      'Irigasi DR (m3/s)',
      'Air Baku (m3/s)',
      'Debit Lingkungan (m3/s)',
      'Total Kebutuhan (m3/s)',
      'Neraca (m3/s)',
      'Status',
    ];
    const rows = results.map(r => [
      r.month,
      r.supply.toFixed(4),
      r.agricultureDemand.toFixed(4),
      (r.domesticDemand + (r.industrialDemand || 0)).toFixed(4),
      r.environmentalFlow.toFixed(4),
      r.totalDemand.toFixed(4),
      r.balance.toFixed(4),
      r.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Neraca_Air_${identitasLokasi.namaDAS || 'REKASDA'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data Neraca Air berhasil diekspor ke CSV.');
  };

  const handleSaveWaterBalance = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const { error } = await saveWaterBalance({
        projectName: identitasLokasi.namaPekerjaan || 'Untitled Project',
        monthlyInputs: { ...inputs, location: identitasLokasi },
        monthlyResults: results,
        summary,
      });

      if (error) {
        setSaveMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
      } else {
        setSaveMessage({ type: 'success', text: '✓ Berhasil menyimpan neraca air ke database!' });
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui';
      setSaveMessage({ type: 'error', text: 'Error: ' + errorMessage });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 rounded-md border border-slate-200 shadow-sm overflow-hidden min-h-[85vh]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white shadow-sm z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-pupr-blue rounded-md shrink-0">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Analisis Neraca Air Terpadu</h1>
            <p className="text-xs text-slate-500 font-medium">
              SNI 19-6728.1-2002 · SNI 6738:2015 · Kriteria Perencanaan Irigasi KP-01
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-sm flex items-center gap-1.5 transition-colors shadow-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
          <button
            type="button"
            onClick={handleSaveWaterBalance}
            disabled={isSaving}
            className="px-4 py-2 bg-pupr-blue hover:bg-blue-700 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-none"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Neraca'}
          </button>
          {onConsultAI && (
            <button
              type="button"
              onClick={onConsultAI}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 transition-colors shadow-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Analisis AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Internal Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* LEFT SIDEBAR: Inputs & Parameters (Span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="space-y-4 pb-4">
              
              {/* Project Banner (SSOT) */}
              <ProjectContextBanner />

              {/* Formula Accordion */}
              <FormulaAccordion
                title="Neraca Air Wilayah Sungai"
                subtitle="SNI 19-6728.1-2002 & SNI 6738:2015"
                theme="emerald"
                formulas={[
                  { label: "Persamaan Neraca Air", math: "Q_{neraca} = Q_{andalan} - (D_{irigasi} + D_{baku} + Q_{lingkungan})" },
                  { label: "Kebutuhan Irigasi (KP-01)", math: "DR = \\frac{NFR \\cdot A}{e \\cdot 86.4}" },
                  { label: "Indeks Kekritisan Air (IKA)", math: "IKA = \\frac{\\sum Kebutuhan}{\\sum Ketersediaan} \\times 100\\%" },
                  { label: "Debit Pemeliharaan Sungai", math: "Q_{lingkungan} = 10\\% \\times Q_{andalan}" }
                ]}
                parameters={[
                  { symbol: "Q_{andalan}", description: "Debit andalan sumber air (Q80 F.J. Mock / AWLR)", unit: "m³/s" },
                  { symbol: "D_{irigasi}", description: "Kebutuhan pengambilan irigasi (Diversion Requirement)", unit: "m³/s" },
                  { symbol: "D_{baku}", description: "Kebutuhan air baku domestik & industri", unit: "m³/s" },
                  { symbol: "Q_{lingkungan}", description: "Aliran pemeliharaan sungai (UU 17/2019 Ps. 22)", unit: "m³/s" },
                  { symbol: "NFR", description: "Net Field Requirement tanaman", unit: "mm/hari" },
                  { symbol: "e", description: "Efisiensi penyaluran irigasi (KP-01 typical 0.65)", unit: "rasio" }
                ]}
                reference="SNI 19-6728.1-2002 & Kriteria Perencanaan Irigasi KP-01"
              />

              {/* SECTION 1: GLOBAL WATER DEMAND PARAMETERS */}
              <Collapsible title="Parameter Kebutuhan Air (Baku & Irigasi)" defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                      Jumlah Penduduk
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={inputs.population}
                        onChange={e => setInputs({ ...inputs, population: parseFloat(e.target.value) || 0 })}
                        className="w-full h-10 px-3 pr-14 text-sm bg-white border border-slate-200 rounded font-semibold text-right focus:border-blue-500 outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">jiwa</span>
                    </div>
                  </div>

                  <div>
                    <SNILabel
                      label="Standar Kebutuhan Air"
                      tooltip="Standar kebutuhan air domestik perkotaan/pedesaan sesuai SNI 03-7065-2005"
                      sniCode="SNI 03-7065-2005"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        value={inputs.domesticStandard}
                        onChange={e => setInputs({ ...inputs, domesticStandard: parseFloat(e.target.value) || 0 })}
                        className="w-full h-10 px-3 pr-16 text-sm bg-white border border-slate-200 rounded font-semibold text-right focus:border-blue-500 outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">L/org/hr</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                      Luas Lahan Irigasi
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={inputs.agricultureArea}
                        onChange={e => setInputs({ ...inputs, agricultureArea: parseFloat(e.target.value) || 0 })}
                        className="w-full h-10 px-3 pr-12 text-sm bg-white border border-slate-200 rounded font-semibold text-right focus:border-blue-500 outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">Ha</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block flex items-center justify-between">
                      <span>Status Engine Irigasi</span>
                      {inputs.dynamicIrrigationDemand && (
                        <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded">
                          KP-01 Dinamis Aktif
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.irrigationDemand}
                        onChange={e => setInputs({ ...inputs, irrigationDemand: parseFloat(e.target.value) || 0 })}
                        disabled={!!inputs.dynamicIrrigationDemand}
                        className="w-full h-10 px-3 pr-16 text-sm bg-white border border-slate-200 rounded font-semibold text-right focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">L/s/Ha</span>
                    </div>
                    {inputs.dynamicIrrigationDemand && (
                      <p className="text-[9px] text-slate-400 mt-1">
                        Kebutuhan irigasi dihitung otomatis dari matriks pola tanam KP-01 di bawah.
                      </p>
                    )}
                  </div>
                </div>
              </Collapsible>

              {/* SECTION 2: DEBIT ANDALAN / KETERSREDIAAN AIR */}
              <Collapsible title="Ketersediaan Air (Debit Andalan)" defaultOpen={true} badge="SNI 6738:2015">
                {/* Method Toggle */}
                <div className="flex rounded-md bg-slate-100 p-1 mb-3">
                  <button
                    type="button"
                    onClick={() => setSupplyMethod('mock')}
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition-all ${
                      supplyMethod === 'mock' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    F.J. Mock (Hujan→Aliran)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplyMethod('manual')}
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition-all ${
                      supplyMethod === 'manual' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Input Manual 12 Bulan
                  </button>
                </div>

                {supplyMethod === 'mock' ? (
                  <div className="space-y-3">
                    {/* Luas DAS */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Luas DAS</label>
                        {isLuasDasOverridden && (
                          <button
                            type="button"
                            onClick={() => setLuasDasLocal('')}
                            className="text-[9px] font-bold text-amber-600 hover:text-amber-700"
                          >
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
                            if (val !== '') setLuasDas(val);
                          }}
                          className={`w-full h-10 px-3 pr-12 text-sm bg-white rounded font-semibold text-right outline-none ${
                            isLuasDasOverridden ? 'border-2 border-amber-400' : 'border border-slate-200'
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">km²</span>
                      </div>
                    </div>

                    {/* Mock Parameters */}
                    <div className="grid grid-cols-2 gap-2">
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
                              className="w-full h-9 px-2 pr-10 text-xs bg-white border border-slate-200 rounded font-semibold text-right outline-none"
                            />
                            {unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">{unit}</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Probability & Rain Source */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Probabilitas Q</label>
                        <select
                          value={targetProb}
                          onChange={e => setTargetProb(Number(e.target.value))}
                          className="w-full h-9 px-2 text-xs bg-white border border-slate-200 rounded font-semibold outline-none"
                        >
                          <option value={80}>Q80 — Irigasi</option>
                          <option value={90}>Q90 — PLTA</option>
                          <option value={95}>Q95 — Air Baku</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sumber Hujan</label>
                        <select
                          value={rainSource}
                          onChange={e => setRainSource(e.target.value as any)}
                          className="w-full h-9 px-2 text-xs bg-white border border-slate-200 rounded font-semibold outline-none"
                        >
                          <option value="master_station">Stasiun Master</option>
                          <option value="master_thiessen">Wilayah Thiessen</option>
                          <option value="manual">Manual 12 Bulan</option>
                        </select>
                      </div>
                    </div>

                    {mockError && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                        {mockError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleMockCalculate}
                      disabled={isMockCalculating}
                      className="w-full min-h-[38px] py-2 bg-pupr-blue hover:bg-blue-700 active:bg-blue-800 text-white rounded font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                      <span>{isMockCalculating ? 'Menghitung F.J. Mock...' : 'Hitung Debit Andalan F.J. Mock'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Nilai pasokan air bulanan (m³/s):</span>
                      <button
                        type="button"
                        onClick={() => setIsInputModalOpen(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                      >
                        Edit Cepat
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {DEFAULT_MONTHS.map((m, i) => (
                        <div key={m} className="bg-white border border-slate-200 p-1.5 rounded text-center">
                          <span className="text-[9px] font-bold text-slate-400 block">{m}</span>
                          <span className="text-xs font-mono font-bold text-slate-700">
                            {inputs.monthlySupply[i]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Collapsible>

              {/* SECTION 3: KALKULATOR IRIGASI DINAMIS KP-01 */}
              <KalkulatorIrigasi
                monthlySupply={inputs.monthlySupply}
                monthlyRAndalan={multiYearMockResult?.monthlyRAndalan ?? hasilMock?.monthlyRAndalan}
                initialPopulation={inputs.population}
                initialAgricultureArea={inputs.agricultureArea}
                initialDomesticStandard={inputs.domesticStandard}
                onDemandCalculated={handleDemandCalculated}
              />
            </div>
          </div>

          {/* MAIN CONTENT: Results, Chart, Sequent Peak, Table (Span 7) */}
          <div className="lg:col-span-7 flex flex-col gap-5 min-h-0 page-enter">
            {saveMessage && (
              <div className={`p-3 rounded border text-xs font-semibold flex items-center gap-2 ${
                saveMessage.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                {saveMessage.text}
              </div>
            )}

            {/* 1. Engineering KPI Grid with IKA Badge */}
            <WaterBalanceKpiGrid
              summary={summary}
              totalSupply={totalSupply}
              totalDemand={totalDemand}
              netBalance={netBalance}
            />

            {/* 2. Main Composed Chart */}
            <div className="bg-white rounded-sm border border-slate-300 p-4 md:p-6 shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">Grafik Neraca Air Bulanan</h2>
                    <ComplianceBadge sniCode="SNI 19-6728.1-2002" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Perbandingan Ketersediaan (Q80) vs Total Kebutuhan (KP-01 + Air Baku + Debit Lingkungan)
                  </p>
                </div>
              </div>
              <div className="h-64 sm:h-80 md:h-96">
                <WaterBalanceChart data={results} />
              </div>
            </div>

            {/* 3. Sequent Peak Reservoir Storage Sizing & Embung Linkage */}
            <SequentPeakCard
              results={results}
              summary={summary}
              onNavigateToEmbung={onNavigateToEmbung}
            />

            {/* 4. Unified Final Water Balance Table */}
            <div className="bg-white rounded-sm border border-slate-300 overflow-hidden shadow-none">
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Tabel Rincian Neraca Air Wilayah Sungai
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Alokasi Ketersediaan (Supply) − Kebutuhan Sektoral (Irigasi + Domestik + Industri + Lingkungan)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    Surplus: {results.filter(r => r.status === 'Surplus').length} bln
                  </span>
                  <span className="flex items-center gap-1 text-rose-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                    Defisit: {results.filter(r => r.status === 'Defisit').length} bln
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="text-left py-2.5 px-3 font-bold text-slate-600">Bulan</th>
                      <th className="text-right py-2.5 px-3 font-bold text-pupr-blue">Q Supply</th>
                      <th className="text-right py-2.5 px-3 font-bold text-teal-700">Irigasi (DR)</th>
                      <th className="text-right py-2.5 px-3 font-bold text-orange-600">Air Baku</th>
                      <th className="text-right py-2.5 px-3 font-bold text-blue-600">Q Lingk.</th>
                      <th className="text-right py-2.5 px-3 font-bold text-slate-700">Total Demand</th>
                      <th className="text-right py-2.5 px-3 font-bold text-slate-800 bg-slate-100">Neraca</th>
                      <th className="text-center py-2.5 px-3 font-bold text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr
                        key={i}
                        className={`border-b border-slate-100 transition-colors ${
                          r.status === 'Defisit' ? 'bg-rose-50/50' : 'even:bg-slate-50/40'
                        } hover:bg-slate-100/50`}
                      >
                        <td className="py-2 px-3 font-bold text-slate-700">{r.month}</td>
                        <td className="py-2 px-3 text-right font-mono text-pupr-blue font-semibold">{r.supply.toFixed(4)}</td>
                        <td className="py-2 px-3 text-right font-mono text-teal-700">{r.agricultureDemand.toFixed(4)}</td>
                        <td className="py-2 px-3 text-right font-mono text-orange-600">
                          {(r.domesticDemand + (r.industrialDemand || 0)).toFixed(4)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-blue-600">{r.environmentalFlow.toFixed(4)}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">{r.totalDemand.toFixed(4)}</td>
                        <td
                          className={`py-2 px-3 text-right font-mono font-bold bg-slate-50/50 ${
                            r.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {r.balance >= 0 ? '+' : ''}{r.balance.toFixed(4)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              r.status === 'Surplus'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'Defisit'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Critical Alert Banner */}
              {summary && summary.deficitMonths > 0 && (
                <div className="px-5 py-3 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      Bulan kritis defisit air: <strong>{summary.criticalMonth.month}</strong> dengan kekurangan{' '}
                      <strong>{Math.abs(summary.criticalMonth.balance).toFixed(4)} m³/s</strong>.
                    </span>
                  </div>
                  <span className="font-bold text-rose-700 text-[11px]">
                    Kapasitas Embung Diperlukan: {summary.storageRequiredJutaM3.toFixed(3)} Juta m³
                  </span>
                </div>
              )}
            </div>

            {/* 5. White-Box KaTeX Mathematical Transparency Drawer */}
            <WaterBalanceWhiteBox results={results} />

            {/* 6. F.J. Mock Simulation Summary (Conditional) */}
            {mockResults && hasilMock && (
              <div className="bg-white rounded-sm border border-slate-300 overflow-hidden shadow-none">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {multiYearMockResult
                        ? `Simulasi Transformasi Hujan-Aliran F.J. Mock (Tahun ${multiYearRainfall?.years[multiYearRainfall.years.length - 1]})`
                        : 'Rekap Simulasi F.J. Mock Bulanan'}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Komponen Water Surplus, Baseflow, Direct Runoff, dan Total Discharge
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-700">
                    Q{hasilMock.probability} Rerata = {hasilMock.qAndalan.toFixed(3)} m³/s
                  </span>
                </div>
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="text-left py-2 px-3 font-bold text-slate-600">Bulan</th>
                        <th className="text-right py-2 px-3 font-bold text-pupr-blue">P (mm)</th>
                        <th className="text-right py-2 px-3 font-bold text-orange-600">ETo (mm)</th>
                        <th className="text-right py-2 px-3 font-bold text-cyan-600">WS (mm)</th>
                        <th className="text-right py-2 px-3 font-bold text-pupr-blue">BF (mm)</th>
                        <th className="text-right py-2 px-3 font-bold text-pupr-blue">DRO (mm)</th>
                        <th className="text-right py-2 px-3 font-bold text-slate-700">TRO (mm)</th>
                        <th className="text-right py-2 px-3 font-bold text-blue-700 bg-blue-50/80">Q (m³/s)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockResults.map((r, i) => (
                        <tr key={i} className="border-b border-slate-100 even:bg-slate-50/40 hover:bg-slate-100/50">
                          <td className="py-1.5 px-3 font-bold text-slate-700">{r.month}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-pupr-blue">{r.precipitation}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-orange-600">{r.eto}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-cyan-600">{r.waterSurplus}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-pupr-blue">{r.baseFlow}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-pupr-blue">{r.directRunoff}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-semibold">{r.totalRunoff}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-blue-700 bg-blue-50/30">
                            {r.discharge}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Manual Monthly Supply Modal */}
      {isInputModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70"
          onClick={() => setIsInputModalOpen(false)}
        >
          <div
            className="bg-white border border-slate-300 rounded-sm w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto shadow-none"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Input Data Debit Pasokan Bulanan</h3>
                <p className="text-xs text-slate-500 mt-1">Ketersediaan Air Sumber (m³/s)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInputModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {DEFAULT_MONTHS.map((month, index) => (
                <div key={month} className="bg-slate-50 rounded p-3 border border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                    {month}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={inputs.monthlySupply[index]}
                      onChange={e => handleSupplyChange(index, parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3 pr-14 text-base bg-white border border-slate-300 rounded font-semibold text-right tabular-nums focus:border-blue-500 outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      m³/s
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsInputModalOpen(false)}
                className="px-6 py-2.5 bg-pupr-blue hover:bg-blue-700 text-white rounded font-bold text-xs transition-colors shadow-none"
              >
                Simpan &amp; Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Dependable Flow Modal */}
      <DependableFlowModal
        isOpen={isCalcModalOpen}
        onClose={() => setIsCalcModalOpen(false)}
        onApply={handleUseCalculatedFlow}
      />
    </div>
  );
};
