import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart3, CheckCircle2, XCircle, AlertTriangle, Save, Download, Clipboard, TrendingUp, Info } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { ActionableEmptyState } from '@/components/ui/ActionableEmptyState';
import { WhiteBoxFormula } from '@/components/ui/WhiteBoxFormula';
import { toast } from '@/hooks/useToast';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { SuccessCelebration } from '@/components/ui/feedback/SuccessCelebration';
import { HelpTooltip } from '@/components/ui/govtech';
import {
  calculateStatisticalParams,
  calculateDistributions,
  calculateGoodnessOfFit,
  selectBestMethod,
} from '@/lib/utils/frequencyMath';

const METHOD_LABELS: Record<string, string> = {
  normal: 'Normal',
  lognormal: 'Log Normal',
  gumbel: 'Gumbel',
  logpearson3: 'Log Pearson III'
};

export const ModulAnalisisFrekuensi: React.FC = () => {
  const {
    analisisFrekuensi, setAnalisisFrekuensi, dataHujan, selectedStasiun,
    activeRainfallSource, arealRainfallAlgebraic, arealRainfallThiessen, arealRainfallIsohyet
  } = useHydrologyStore();

  const [dataInput, setDataInput] = useState<number[]>([]);
  const [inputType, setInputType] = useState<'point' | 'areal_algebraic' | 'areal_thiessen' | 'areal_isohyet'>('point');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showAllData, setShowAllData] = useState(false);
  const [hoveredTr, setHoveredTr] = useState<number | null>(null);
  const [selectedTr, setSelectedTr] = useState<number>(25);
  const [showCelebration, setShowCelebration] = useState(false);
  const { completeStep } = useOnboarding();

  const hasValidData = useMemo(() => {
    const hasEnoughPointData = dataHujan.length >= 10;
    const hasEnoughArealData = (arealRainfallAlgebraic?.length || 0) >= 10 ||
      (arealRainfallThiessen?.length || 0) >= 10 ||
      (arealRainfallIsohyet?.length || 0) >= 10;
    return hasEnoughPointData || hasEnoughArealData;
  }, [dataHujan, arealRainfallAlgebraic, arealRainfallThiessen, arealRainfallIsohyet]);

  useEffect(() => {
    if (activeRainfallSource === 'thiessen') setInputType('areal_thiessen');
    else if (activeRainfallSource === 'aljabar') setInputType('areal_algebraic');
    else if (activeRainfallSource === 'isohyet') setInputType('areal_isohyet');
    else setInputType('point');
  }, [activeRainfallSource]);

  useEffect(() => {
    if (inputType === 'point' && dataHujan.length > 0) {
      const stasiunData = selectedStasiun
        ? dataHujan.filter(d => d.stasiun_id === selectedStasiun.id)
        : dataHujan;
      if (stasiunData.length > 0) {
        const byYear = new Map<number, number>();
        stasiunData.forEach(d => {
          const year = new Date(d.tanggal).getFullYear();
          const current = byYear.get(year) || 0;
          if (d.curah_hujan > current) byYear.set(year, d.curah_hujan);
        });
        const annualMax = Array.from(byYear.values());
        if (annualMax.length >= 1) setDataInput(annualMax);
        else setDataInput([]);
      } else {
        setDataInput([]);
      }
    } else if (inputType === 'areal_thiessen') {
      setDataInput(arealRainfallThiessen?.map(d => d.curah_hujan) || []);
    } else if (inputType === 'areal_algebraic') {
      setDataInput(arealRainfallAlgebraic?.map(d => d.curah_hujan) || []);
    } else if (inputType === 'areal_isohyet') {
      setDataInput(arealRainfallIsohyet?.map(d => d.curah_hujan) || []);
    }
  }, [dataHujan, selectedStasiun, inputType, arealRainfallAlgebraic, arealRainfallThiessen, arealRainfallIsohyet]);

  useEffect(() => {
    if (analisisFrekuensi) {
      setDataInput(analisisFrekuensi.dataHujanInput);
      setSelectedMethod(analisisFrekuensi.metodeTerpilih);
      setIsCalculated(true);
    }
  }, [analisisFrekuensi]);

  const { paramsAsli, paramsLog, distributions, goodnessOfFit, recommendedMethod } = useMemo(() => {
    if (dataInput.length < 10) {
      return { paramsAsli: null, paramsLog: null, distributions: null, goodnessOfFit: null, recommendedMethod: null };
    }
    const asli = calculateStatisticalParams(dataInput);
    const logData = dataInput.map(x => Math.log10(Math.max(x, 1e-10)));
    const log = calculateStatisticalParams(logData);
    const dist = calculateDistributions(dataInput);
    const gof = calculateGoodnessOfFit(dataInput, dist);
    const recommended = selectBestMethod(gof);
    return {
      paramsAsli: { mean: asli.mean, stdDev: asli.stdDev, cv: asli.cv, cs: asli.cs, ck: asli.ck },
      paramsLog: { mean: log.mean, stdDev: log.stdDev, cv: log.cv, cs: log.cs, ck: log.ck },
      distributions: dist,
      goodnessOfFit: gof,
      recommendedMethod: recommended
    };
  }, [dataInput]);

  useEffect(() => {
    if (recommendedMethod && !selectedMethod) {
      setSelectedMethod(recommendedMethod);
    }
  }, [recommendedMethod, selectedMethod]);

  const handlePasteFromExcel = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.trim().split('\n');
      const values = lines.map(line => parseFloat(line.split('\t')[0])).filter(v => !isNaN(v));
      if (values.length >= 10) setDataInput(values);
    } catch {
      toast.error('Gagal membaca clipboard. Pastikan Anda sudah menyalin data dari Excel.');
    }
  }, []);

  const handleCalculate = useCallback(() => {
    if (!paramsAsli || !paramsLog || !distributions || !goodnessOfFit || !selectedMethod) return;
    const selectedDist = distributions.find(d => d.method === selectedMethod);
    if (!selectedDist) return;
    const curahHujanRencana = selectedDist.values.map(v => ({ kalaUlang: v.Tr, curahHujan: v.R24, Tr: v.Tr, R24: v.R24 }));
    setAnalisisFrekuensi({
      parameterStatistik: { asli: paramsAsli, log: paramsLog },
      hasilDistribusi: distributions,
      ujiKecocokan: goodnessOfFit,
      metodeTerpilih: selectedMethod,
      dataHujanInput: dataInput
    });
    const { setHasilAnalisisFrekuensi, setSelectedKalaUlang } = useHydrologyStore.getState();
    setHasilAnalisisFrekuensi({
      metodeTerpilih: selectedMethod,
      lulusUjiKecocokan: goodnessOfFit.find(g => g.method === selectedMethod)?.chiSquare.accepted || false,
      curahHujanRencana,
      selectedKalaUlang: 25
    });
    setSelectedKalaUlang(25);
    setIsCalculated(true);
    setShowCelebration(true);
    completeStep('frekuensi');
    toast.success('Hasil analisis frekuensi berhasil disimpan');
  }, [paramsAsli, paramsLog, distributions, goodnessOfFit, selectedMethod, dataInput, setAnalisisFrekuensi, completeStep]);

  const handleExport = useCallback(() => {
    if (!analisisFrekuensi) return;
    const data = JSON.stringify(analisisFrekuensi, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis-frekuensi-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }, [analisisFrekuensi]);

  const getWhiteBoxFormula = (method: string, tr: number, value: number) => {
    if (!paramsAsli) return null;
    if (method === 'gumbel') {
      const yn = 0.5236;
      const sn = 1.128;
      const ytr = tr === 2 ? 0.3665 : tr === 5 ? 1.4999 : tr === 10 ? 2.2504 : tr === 25 ? 3.1985 : tr === 50 ? 3.9019 : 4.6001;
      return {
        title: `Gumbel - Kala Ulang ${tr} Tahun`,
        theoretical: `X_T = \\\\bar{X} + \\\\frac{Y_T - Y_n}{S_n} \\\\cdot S`,
        substituted: `X_{${tr}} = ${paramsAsli.mean.toFixed(2)} + \\\\frac{${ytr.toFixed(4)} - ${yn.toFixed(4)}}{${sn.toFixed(3)}} \\\\cdot ${paramsAsli.stdDev.toFixed(2)}`,
        result: `= ${value.toFixed(2)} \\\\text{ mm}`,
        variables: {
          '\\\\bar{X}': parseFloat(paramsAsli.mean.toFixed(2)),
          'S': parseFloat(paramsAsli.stdDev.toFixed(2)),
          'Y_T': parseFloat(ytr.toFixed(4)),
          'Y_n': parseFloat(yn.toFixed(4)),
          'S_n': parseFloat(sn.toFixed(3))
        }
      };
    }
    return null;
  };

  const sourceName = useMemo(() => {
    if (inputType === 'areal_thiessen') return 'Hujan Wilayah (Poligon Thiessen)';
    if (inputType === 'areal_algebraic') return 'Hujan Wilayah (Rata-rata Aljabar)';
    if (inputType === 'areal_isohyet') return 'Hujan Wilayah (Garis Isohyet)';
    return selectedStasiun ? `Stasiun ${selectedStasiun.nama_stasiun}` : 'Data Titik';
  }, [inputType, selectedStasiun]);

  // ══════════════════════════════════════════════════
  // EMPTY STATE
  // ══════════════════════════════════════════════════
  if (!hasValidData) {
    return (
      <div className="space-y-8 p-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
          <div>
            <h2 className="text-3xl font-medium text-[#1e293b] tracking-tight">Analisis Frekuensi Hujan</h2>
            <p className="text-sm text-slate-500 mt-1">Perhitungan probabilitas hujan rencana — SNI 2415:2016</p>
          </div>
        </div>
        <ActionableEmptyState
          title="Data Belum Lengkap"
          description="Lengkapi Data Master terlebih dahulu: (1) Data Curah Hujan minimal 10 tahun untuk setiap stasiun, (2) Morfometri DAS, (3) Tutupan Lahan."
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════
  return (
    <div className="space-y-8 p-1">
      {showCelebration && (
        <SuccessCelebration
          message="Analisis Frekuensi Hujan Ekstrem (SNI 2415:2016) berhasil diselesaikan!"
          onComplete={() => setShowCelebration(false)}
        />
      )}

      {/* ── Page Header (MasterHidrologiTab pattern) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl font-medium text-[#1e293b] tracking-tight">Analisis Frekuensi Hujan</h2>
          <p className="text-sm text-slate-500 mt-1">Perhitungan probabilitas hujan rencana — SNI 2415:2016</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isCalculated && (
            <button onClick={handleExport} className="rounded-sm font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50 border-2 h-10 px-4 flex items-center gap-2 text-sm transition-colors">
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          )}
        </div>
      </div>

      {/* ── Split-Pane Container (MasterHidrologiTab pattern) ── */}
      <div className="flex flex-col lg:flex-row gap-0 bg-white border border-slate-200 min-h-[600px]">

        {/* ════ Left Column: Data Navigator ════ */}
        <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col border-r border-slate-200 self-stretch">
          {/* Section Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pupr-blue"></span>
              DATA INPUT
              <span className="ml-auto bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] tabular-nums font-bold">{dataInput.length} thn</span>
            </h3>
          </div>

          {/* Source Selector */}
          <div className="p-4 border-b border-slate-100">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 block">SUMBER DATA</label>
            <div className="flex flex-wrap gap-1.5">
              {([
                { id: 'point', label: 'Data Titik' },
                { id: 'areal_algebraic', label: 'Aljabar' },
                { id: 'areal_thiessen', label: 'Thiessen' },
                { id: 'areal_isohyet', label: 'Isohyet' }
              ] as const).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setInputType(opt.id)}
                  className={`px-2.5 py-1.5 text-[10px] font-bold rounded-sm border transition-all ${inputType === opt.id
                    ? 'bg-pupr-blue text-white border-pupr-blue'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data Content Area */}
          <div className="flex-1 overflow-y-auto">
            {dataInput.length >= 10 && !showManualInput ? (
              <div className="divide-y divide-slate-100">
                {/* Summary Block */}
                <div className="p-4 bg-pupr-blue text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                      <span className="text-xs font-bold">{dataInput.length} Tahun Data</span>
                    </div>
                    <button
                      onClick={() => setShowManualInput(true)}
                      className="text-[10px] font-bold text-white/70 hover:text-white bg-white/10 px-2 py-1 rounded-sm transition-colors"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                  <p className="text-[10px] text-white/70 font-medium mb-3">{sourceName}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-white/50 uppercase tracking-tighter font-black">MIN</span>
                      <span className="tabular-nums font-bold text-sm">{Math.min(...dataInput).toFixed(1)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-white/50 uppercase tracking-tighter font-black">MAX</span>
                      <span className="tabular-nums font-bold text-sm">{Math.max(...dataInput).toFixed(1)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-white/50 uppercase tracking-tighter font-black">MEAN</span>
                      <span className="tabular-nums font-bold text-sm">{(dataInput.reduce((a, b) => a + b, 0) / dataInput.length).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Data Preview Grid */}
                <div className="p-4">
                  <div className="grid grid-cols-5 gap-1.5">
                    {dataInput.slice(0, showAllData ? dataInput.length : 10).map((val, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 text-center py-2 px-1">
                        <div className="text-[8px] text-slate-400 font-black uppercase">T{idx + 1}</div>
                        <div className="text-sm font-black text-pupr-blue tabular-nums tracking-tight">{val.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                  {dataInput.length > 10 && (
                    <button
                      onClick={() => setShowAllData(!showAllData)}
                      className="w-full mt-2 px-3 py-2 text-[10px] font-bold text-pupr-blue hover:bg-slate-50 border border-slate-200 rounded-sm transition-colors"
                    >
                      {showAllData ? '▲ Sembunyikan' : `▼ Tampilkan Semua (${dataInput.length})`}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">Input Manual</h4>
                  <div className="flex items-center gap-2">
                    <button onClick={handlePasteFromExcel} className="flex items-center gap-1 px-2.5 py-1.5 bg-pupr-blue hover:bg-pupr-blue/90 text-white text-[10px] font-bold rounded-sm transition-colors">
                      <Clipboard className="w-3 h-3" />
                      Paste
                    </button>
                    {dataInput.length >= 10 && (
                      <button onClick={() => setShowManualInput(false)} className="px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-sm transition-colors">
                        Selesai
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    value={dataInput.map(v => v.toFixed(2)).join('\n')}
                    onChange={(e) => setDataInput(e.target.value.split('\n').map(v => parseFloat(v.trim())).filter(v => !isNaN(v)))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm font-mono text-xs focus:border-pupr-blue focus:ring-1 focus:ring-pupr-blue focus:outline-none tabular-nums"
                    rows={10}
                    placeholder="Masukkan data (satu nilai per baris)"
                  />
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-white border border-slate-100 rounded text-[9px] font-black tabular-nums">
                    <span className={dataInput.length >= 10 ? 'text-emerald-600' : 'text-amber-600'}>{dataInput.length}/10</span>
                  </div>
                </div>
                {dataInput.length > 0 && dataInput.length < 10 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-sm flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span className="text-[10px] text-amber-800 font-medium">Tambahkan {10 - dataInput.length} data lagi</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ════ Right Column: Analysis Workspace ════ */}
        <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col self-stretch bg-slate-50/30 overflow-hidden">
          {dataInput.length < 10 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 mb-6 bg-white border border-slate-100 rounded-sm flex items-center justify-center">
                <BarChart3 className="w-10 h-10 text-pupr-blue" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Data Belum Cukup</h3>
              <p className="text-sm text-slate-500 max-w-sm">Minimal 10 tahun data hujan maksimum tahunan diperlukan untuk analisis frekuensi yang valid.</p>
            </div>
          ) : (
            <>
              {/* Workspace Header */}
              <div className="flex flex-col bg-white border-b border-slate-200">
                <div className="p-5 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-pupr-blue" />
                      Hasil Analisis
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Sumber: <span className="font-bold text-slate-700">{sourceName}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-sm border border-slate-200">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Metode</span>
                      <select
                        value={selectedMethod || ''}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="appearance-none bg-transparent border-none text-sm font-bold text-slate-800 pr-2 pl-1 py-0.5 focus:ring-0 cursor-pointer outline-none"
                      >
                        {distributions?.map(d => (
                          <option key={d.method} value={d.method}>
                            {METHOD_LABELS[d.method]}{d.method === recommendedMethod ? ' ⭐' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleCalculate}
                      disabled={!selectedMethod}
                      className={`rounded-sm font-bold h-10 px-4 flex items-center gap-2 text-sm transition-all ${!selectedMethod
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isCalculated
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-pupr-blue hover:bg-slate-900 text-white'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      {isCalculated ? 'Tersimpan ✓' : 'Simpan & Gunakan'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Analysis Content */}
              <div className="flex-1 bg-slate-50/50 p-4 sm:p-5 overflow-y-auto space-y-6">

                {/* Section A+B: Grid Parameter Statistik & Uji Kecocokan */}
                {paramsAsli && paramsLog && goodnessOfFit && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 border border-slate-200 bg-white overflow-hidden">
                    {/* A: Parameter Statistik */}
                    <div className="border-b xl:border-b-0 xl:border-r border-slate-200">
                      <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-pupr-blue"></span>
                          PARAMETER STATISTIK
                        </h4>
                      </div>
                      <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-slate-100/50 border-b border-slate-200">
                              <th className="py-2 px-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-tighter">Parameter</th>
                              <th className="py-2 px-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-tighter">Asli</th>
                              <th className="py-2 px-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-tighter">Log</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { label: 'Mean (X̄)', asli: paramsAsli.mean.toFixed(2), log: paramsLog.mean.toFixed(4) },
                              { label: 'Std Dev (S)', asli: paramsAsli.stdDev.toFixed(2), log: paramsLog.stdDev.toFixed(4) },
                              { label: 'CV', asli: paramsAsli.cv.toFixed(3), log: paramsLog.cv.toFixed(3) },
                              { label: 'Skewness (Cs)', asli: paramsAsli.cs.toFixed(3), log: paramsLog.cs.toFixed(3) },
                              { label: 'Kurtosis (Ck)', asli: paramsAsli.ck.toFixed(3), log: paramsLog.ck.toFixed(3) },
                            ].map((row) => (
                              <tr key={row.label} className="border-b border-slate-100 hover:bg-slate-50/80">
                                <td className="py-2.5 px-3 font-medium text-slate-700 text-xs">{row.label}</td>
                                <td className="py-2.5 px-3 text-right font-black text-pupr-blue tabular-nums tracking-tight">{row.asli}</td>
                                <td className="py-2.5 px-3 text-right font-black text-pupr-blue tabular-nums tracking-tight">{row.log}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* B: Uji Kecocokan */}
                    <div>
                      <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-pupr-blue"></span>
                          UJI KECOCOKAN
                        </h4>
                      </div>
                      <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-slate-100/50 border-b border-slate-200">
                              <th className="py-2 px-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-tighter">Metode</th>
                              <th className="py-2 px-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-tighter">Chi-Sq</th>
                              <th className="py-2 px-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-tighter">K-S</th>
                              <th className="py-2 px-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-tighter">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {goodnessOfFit.map((gof) => {
                              const bothPassed = gof.chiSquare.accepted && gof.kolmogorovSmirnov.accepted;
                              const isRecommended = gof.method === recommendedMethod;
                              return (
                                <tr
                                  key={gof.method}
                                  className={`border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50/80 ${isRecommended ? 'bg-blue-50/30' : ''}`}
                                  onClick={() => bothPassed && setSelectedMethod(gof.method)}
                                >
                                  <td className="py-2.5 px-3 font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                    {METHOD_LABELS[gof.method]}
                                    {isRecommended && <span className="text-[9px] bg-pupr-blue text-white px-1 rounded font-black">★</span>}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {gof.chiSquare.accepted
                                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                      : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {gof.kolmogorovSmirnov.accepted
                                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                      : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-sm border ${bothPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                      {bothPassed ? 'PASS' : 'FAIL'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section C: Hujan Rencana */}
                {distributions && (
                  <div className="border border-slate-200 bg-white overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pupr-blue"></span>
                        HUJAN RENCANA (R₂₄)
                        <HelpTooltip content="Sistem merekomendasikan metode terbaik berdasarkan Uji Chi-Square dan Kolmogorov-Smirnov." />
                      </h4>
                    </div>

                    <div className="p-4 sm:p-5">
                      {/* Audit Trail */}
                      <div className="mb-4 flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-sm">
                        <div className="flex items-center gap-3">
                          <Info className="h-4 w-4 text-pupr-blue flex-shrink-0" />
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Sumber Data</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-700">{sourceName}</span>
                              <span className="px-1.5 py-0.5 bg-pupr-blue text-white text-[8px] font-black rounded-sm uppercase tracking-wider">SNI</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedMethod !== recommendedMethod && (
                        <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-sm flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span className="text-[10px] text-amber-800 font-medium">
                            Metode berbeda dari rekomendasi sistem ({METHOD_LABELS[recommendedMethod || '']})
                          </span>
                        </div>
                      )}

                      {/* Interactive Comparison Bar */}
                      <div className="mb-6 p-5 bg-gradient-to-br from-pupr-blue to-slate-800 text-white rounded-sm border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-all duration-700"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-yellow-400" />
                            <div>
                              <span className="text-sm font-bold text-white block">Perbandingan Kala Ulang</span>
                              <span className="text-[9px] text-slate-300 uppercase tracking-wider font-black">Visualisasi (mm)</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 p-1 bg-black/20 rounded-sm border border-white/5">
                            {[2, 5, 10, 25, 50, 100].map(tr => (
                              <button
                                key={tr}
                                onClick={() => setSelectedTr(tr)}
                                className={`px-2.5 py-1 text-[10px] font-black rounded-sm transition-all ${selectedTr === tr
                                  ? 'bg-yellow-400 text-pupr-blue'
                                  : 'text-slate-300 hover:text-white hover:bg-white/10'
                                }`}
                              >
                                Q{tr}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3 relative z-10">
                          {distributions.map(d => {
                            const value = d.values.find(v => v.Tr === selectedTr)?.R24 || 0;
                            const maxValue = Math.max(...distributions.map(dist => dist.values.find(v => v.Tr === selectedTr)?.R24 || 0));
                            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                            const isSelected = d.method === selectedMethod;
                            const isFailed = goodnessOfFit?.find(g => g.method === d.method) &&
                              !(goodnessOfFit.find(g => g.method === d.method)!.chiSquare.accepted &&
                                goodnessOfFit.find(g => g.method === d.method)!.kolmogorovSmirnov.accepted);
                            return (
                              <div key={d.method} className="space-y-1">
                                <div className="flex justify-between items-end px-0.5">
                                  <span className={`text-[10px] font-black tracking-tight ${isSelected ? 'text-yellow-400' : isFailed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                    {METHOD_LABELS[d.method]}
                                    {isFailed && <span className="ml-1 text-[8px] font-black px-1 py-0.5 bg-red-500/20 text-red-300 rounded-sm">FAIL</span>}
                                    {isSelected && <span className="ml-1 text-[8px] font-black px-1 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-sm">SELECTED</span>}
                                  </span>
                                  <span className={`text-[10px] font-mono font-black tabular-nums ${isSelected ? 'text-yellow-400' : 'text-slate-300'}`}>
                                    {value.toFixed(1)} mm
                                  </span>
                                </div>
                                <div className="bg-white/5 rounded-sm h-2 overflow-hidden border border-white/5">
                                  <div
                                    className={`h-full rounded-sm transition-all duration-700 ${isSelected ? 'bg-gradient-to-r from-yellow-500 to-yellow-300' : isFailed ? 'bg-slate-600' : 'bg-gradient-to-r from-slate-500 to-slate-400'}`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Results Table */}
                      <div className="border border-slate-200 overflow-hidden bg-white">
                        <div className="p-0 overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-slate-100/50 border-b border-slate-200">
                                <th className="py-2 px-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-tighter tabular-nums">Tr</th>
                                {distributions.map(d => {
                                  const isSelected = d.method === selectedMethod;
                                  const isFailed = goodnessOfFit?.find(g => g.method === d.method) &&
                                    !(goodnessOfFit.find(g => g.method === d.method)!.chiSquare.accepted &&
                                      goodnessOfFit.find(g => g.method === d.method)!.kolmogorovSmirnov.accepted);
                                  return (
                                    <th key={d.method} className={`py-2 px-3 text-right text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'text-pupr-blue' : isFailed ? 'text-slate-300' : 'text-slate-500'}`}>
                                      {METHOD_LABELS[d.method]}
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {[2, 5, 10, 25, 50, 100].map(tr => (
                                <tr
                                  key={tr}
                                  className={`border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50/80 ${hoveredTr === tr ? 'bg-blue-50/30' : ''}`}
                                  onMouseEnter={() => setHoveredTr(tr)}
                                  onMouseLeave={() => setHoveredTr(null)}
                                  onClick={() => setSelectedTr(tr)}
                                >
                                  <td className={`py-3 px-3 text-center font-black tabular-nums tracking-tight ${selectedTr === tr ? 'text-pupr-blue' : 'text-slate-700'}`}>
                                    Q{tr}
                                  </td>
                                  {distributions.map(d => {
                                    const value = d.values.find(v => v.Tr === tr);
                                    const isSelected = d.method === selectedMethod;
                                    const isFailed = goodnessOfFit?.find(g => g.method === d.method) &&
                                      !(goodnessOfFit.find(g => g.method === d.method)!.chiSquare.accepted &&
                                        goodnessOfFit.find(g => g.method === d.method)!.kolmogorovSmirnov.accepted);
                                    const formula = isSelected ? getWhiteBoxFormula(d.method, tr, value?.R24 || 0) : null;
                                    return (
                                      <td key={d.method} className={`py-3 px-3 text-right tabular-nums tracking-tight transition-all ${isSelected ? 'font-black text-pupr-blue text-base' : isFailed ? 'opacity-40 text-slate-400' : 'font-bold text-slate-700'}`}>
                                        <div className="flex items-center justify-end gap-1.5">
                                          <span>{value?.R24.toFixed(2)}</span>
                                          {formula && <WhiteBoxFormula {...formula} />}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
