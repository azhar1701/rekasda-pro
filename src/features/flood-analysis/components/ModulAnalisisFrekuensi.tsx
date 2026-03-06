import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, CheckCircle2, XCircle, AlertTriangle, Save, Download, Upload, Clipboard, TrendingUp, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { ActionableEmptyState } from '@/components/ui/ActionableEmptyState';
import { WhiteBoxFormula } from '@/components/ui/WhiteBoxFormula';
import {
  calculateStatisticalParams,
  calculateDistributions,
  calculateGoodnessOfFit,
  selectBestMethod
} from '@/lib/utils/frequencyMath';

const METHOD_LABELS: Record<string, string> = {
  normal: 'Normal',
  lognormal: 'Log Normal',
  gumbel: 'Gumbel',
  logpearson3: 'Log Pearson III'
};

export const ModulAnalisisFrekuensi: React.FC = () => {
  const { analisisFrekuensi, setAnalisisFrekuensi, dataHujan, selectedStasiun, hasilThiessen } = useHydrologyStore();
  
  const [dataInput, setDataInput] = useState<number[]>([]);
  const [inputType, setInputType] = useState<'point' | 'areal_algebraic' | 'areal_thiessen' | 'areal_isohyet'>('point');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showAllData, setShowAllData] = useState(false);
  const [hoveredTr, setHoveredTr] = useState<number | null>(null);
  const [selectedTr, setSelectedTr] = useState<number>(25);

  const hasValidData = useMemo(() => {
    const hasEnoughData = dataHujan.length >= 10 || (hasilThiessen && hasilThiessen.hujanRataRataDAS.length >= 10);
    return hasEnoughData;
  }, [dataHujan, hasilThiessen]);

  // Workflow Sync: Default to saved Spatial Analysis method
  const savedSpatialMetode = useHydrologyStore(s => s.curahHujanWilayah?.metode);
  useEffect(() => {
    if (savedSpatialMetode === 'thiessen') setInputType('areal_thiessen');
    else if (savedSpatialMetode === 'aljabar') setInputType('areal_algebraic');
    else if (savedSpatialMetode === 'isohyet') setInputType('areal_isohyet');
  }, [savedSpatialMetode]);

  useEffect(() => {
    const spatialConfig = useHydrologyStore.getState().curahHujanWilayah;
    
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
    } else if (inputType === 'areal_thiessen' && hasilThiessen?.hujanRataRataDAS) {
      setDataInput(hasilThiessen.hujanRataRataDAS);
    } else if (inputType === 'areal_algebraic') {
      if (spatialConfig?.metode === 'aljabar' && spatialConfig.hujanRataRataAMS) {
        setDataInput(spatialConfig.hujanRataRataAMS);
      } else {
        // Fallback to local calculation if store not ready
        const years = Array.from(new Set(dataHujan.map(d => new Date(d.tanggal).getFullYear())));
        const results: number[] = [];
        years.forEach(year => {
          const yearData = dataHujan.filter(d => new Date(d.tanggal).getFullYear() === year);
          const stations = Array.from(new Set(yearData.map(d => d.stasiun_id)));
          let sum = 0;
          stations.forEach(sId => {
            const stationAnnualMax = yearData.filter(d => d.stasiun_id === sId).map(d => d.curah_hujan);
            if (stationAnnualMax.length > 0) sum += Math.max(...stationAnnualMax);
          });
          if (stations.length > 0) results.push(sum / stations.length);
        });
        setDataInput(results);
      }
    } else if (inputType === 'areal_isohyet') {
      if (spatialConfig?.metode === 'isohyet' && spatialConfig.hujanRataRataAMS) {
        setDataInput(spatialConfig.hujanRataRataAMS);
      } else if (spatialConfig?.hujanRataRata) {
         setDataInput([spatialConfig.hujanRataRata]);
      }
    }
  }, [dataHujan, selectedStasiun, inputType, hasilThiessen]);

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
    const logData = dataInput.map(x => Math.log(x));
    const log = calculateStatisticalParams(logData);
    
    const dist = calculateDistributions(asli, log, dataInput.length);
    const gof = calculateGoodnessOfFit(dataInput, dist);
    const recommended = selectBestMethod(gof);
    
    return {
      paramsAsli: asli,
      paramsLog: log,
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

  const handlePasteFromExcel = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.trim().split('\n');
      const values = lines
        .map(line => parseFloat(line.split('\t')[0]))
        .filter(v => !isNaN(v));
      if (values.length >= 10) {
        setDataInput(values);
      }
    } catch (err) {
      alert('Gagal membaca clipboard. Pastikan Anda sudah menyalin data dari Excel.');
    }
  };

  const handleCalculate = () => {
    if (!paramsAsli || !paramsLog || !distributions || !goodnessOfFit || !selectedMethod) return;
    
    const selectedDist = distributions.find(d => d.method === selectedMethod);
    if (!selectedDist) return;

    const curahHujanRencana = selectedDist.values.map(v => ({
      kalaUlang: v.Tr,
      curahHujan: v.R24,
      Tr: v.Tr,
      R24: v.R24
    }));

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
  };

  const handleExport = () => {
    if (!analisisFrekuensi) return;
    const data = JSON.stringify(analisisFrekuensi, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis-frekuensi-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const getWhiteBoxFormula = (method: string, tr: number, value: number) => {
    if (!paramsAsli) return null;

    if (method === 'gumbel') {
      const yn = 0.5236;
      const sn = 1.128;
      const ytr = tr === 2 ? 0.3665 : tr === 5 ? 1.4999 : tr === 10 ? 2.2504 : tr === 25 ? 3.1985 : tr === 50 ? 3.9019 : 4.6001;
      
      return {
        title: `Gumbel - Kala Ulang ${tr} Tahun`,
        theoretical: `X_T = \\bar{X} + \\frac{Y_T - Y_n}{S_n} \\cdot S`,
        substituted: `X_{${tr}} = ${paramsAsli.mean.toFixed(2)} + \\frac{${ytr.toFixed(4)} - ${yn.toFixed(4)}}{${sn.toFixed(3)}} \\cdot ${paramsAsli.stdDev.toFixed(2)}`,
        result: `= ${value.toFixed(2)} \\text{ mm}`,
        variables: {
          '\\bar{X}': parseFloat(paramsAsli.mean.toFixed(2)),
          'S': parseFloat(paramsAsli.stdDev.toFixed(2)),
          'Y_T': parseFloat(ytr.toFixed(4)),
          'Y_n': parseFloat(yn.toFixed(4)),
          'S_n': parseFloat(sn.toFixed(3))
        }
      };
    }
    
    return null;
  };

  if (!hasValidData) {
    return (
      <ModuleLayout
        title="Analisis Frekuensi Hujan Ekstrem"
        description="Perhitungan probabilitas hujan rencana (SNI 2415:2016)"
        icon={<BarChart3 className="w-6 h-6" />}
        iconColorClass="bg-blue-50 text-pupr-blue"
      >
        <ActionableEmptyState 
          title="Data Belum Lengkap"
          description="Lengkapi Data Master terlebih dahulu: (1) Data Curah Hujan minimal 10 tahun untuk setiap stasiun, (2) Morfometri DAS, (3) Tutupan Lahan."
        />
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout
      title="Analisis Frekuensi Hujan Ekstrem"
      description="Perhitungan probabilitas hujan rencana (SNI 2415:2016)"
      icon={<BarChart3 className="w-6 h-6" />}
      iconColorClass="bg-blue-50 text-pupr-blue"
      actions={
        isCalculated && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md font-semibold hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        )
      }
    >
    <div className="space-y-5 py-2">
      {/* TAHAP 1: Smart Data Context - Compressed Input */}
      <div className="rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="text-sm font-bold text-slate-900">Input Data Hujan</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs font-bold text-slate-700">Sumber Data:</label>
            <div className="flex gap-2">
              {[
                { id: 'point', label: 'Data Titik (Stasiun)' },
                { id: 'areal_algebraic', label: 'Rata-rata Aljabar' },
                { id: 'areal_thiessen', label: 'Poligon Thiessen' },
                { id: 'areal_isohyet', label: 'Garis Isohyet' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setInputType(opt.id as any)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${
                    inputType === opt.id 
                      ? 'bg-pupr-blue text-white border-pupr-blue' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {inputType.startsWith('areal') && (
            <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="text-[10px] text-amber-800 font-medium">
                <b>Peringatan SNI:</b> Data gabungan (Areally averaged) tidak direkomendasikan untuk Analisis Frekuensi di beberapa standar. Pastikan metodologi sesuai dengan kerangka desain Anda.
              </span>
            </div>
          )}
        {dataInput.length >= 10 && !showManualInput ? (
          <div className="space-y-3">
            {/* Data Summary Card */}
            <div className="flex items-start justify-between p-3 bg-[#0c3a66] text-white rounded-md border border-[#0c3a66] overflow-hidden shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#0d4578] rounded-md">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">
                    {dataInput.length} Tahun Data Hujan Maksimum
                  </p>
                  <p className="text-sm text-slate-300">
                    Sumber: {selectedStasiun ? `Stasiun ${selectedStasiun.nama_stasiun}` : hasilThiessen ? 'Hujan Wilayah (Thiessen)' : 'Data Master'}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-300">Min:</span>
                      <span className="text-sm font-medium text-white font-mono tabular-nums">{Math.min(...dataInput).toFixed(1)} mm</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-300">Max:</span>
                      <span className="text-sm font-medium text-white font-mono tabular-nums">{Math.max(...dataInput).toFixed(1)} mm</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-300">Rata-rata:</span>
                      <span className="text-sm font-medium text-white font-mono tabular-nums">{(dataInput.reduce((a, b) => a + b, 0) / dataInput.length).toFixed(1)} mm</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowManualInput(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
              >
                ✏️ Edit
              </button>
            </div>

            {/* Quick Preview Grid */}
            <div>
              <div className="grid grid-cols-5 gap-2">
                {dataInput.slice(0, showAllData ? dataInput.length : 10).map((val, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-md shadow-sm text-center p-3">
                    <div className="text-xs text-slate-500">Tahun {idx + 1}</div>
                    <div className="text-lg font-semibold text-slate-800 tabular-nums">{val.toFixed(1)}</div>
                  </div>
                ))}
              </div>
              {dataInput.length > 10 && (
                <button
                  onClick={() => setShowAllData(!showAllData)}
                  className="w-full mt-2 px-3 py-2 text-xs font-semibold text-[#0c3a66] hover:text-[#0d4578] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                >
                  {showAllData ? '▲ Sembunyikan' : `▼ Tampilkan Semua (${dataInput.length} data)`}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Input Data Hujan Maksimum Tahunan</h3>
                <p className="text-xs text-slate-600 mt-0.5">Masukkan minimal 10 tahun data untuk analisis frekuensi</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePasteFromExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c3a66] hover:bg-[#0d4578] text-white text-xs font-semibold rounded-md transition-colors"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  Paste Excel
                </button>
                {hasilThiessen?.hujanRataRataDAS && hasilThiessen.hujanRataRataDAS.length >= 10 && (
                  <button
                    onClick={() => { if (hasilThiessen) setDataInput(hasilThiessen.hujanRataRataDAS); setShowManualInput(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Load dari Thiessen
                  </button>
                )}
                {dataInput.length >= 10 && (
                  <button
                    onClick={() => setShowManualInput(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
                  >
                    Selesai
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <textarea
                value={dataInput.map(v => v.toFixed(2)).join('\n')}
                onChange={(e) => setDataInput(e.target.value.split('\n').map(v => parseFloat(v.trim())).filter(v => !isNaN(v)))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs focus:border-[#0c3a66] focus:ring-1 focus:ring-[#0c3a66] focus:outline-none"
                rows={10}
                placeholder="Masukkan deret data hujan maksimum tahunan (satu nilai per baris)"
              />
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold">
                <span className={dataInput.length >= 10 ? 'text-green-600' : 'text-amber-600'}>
                  {dataInput.length}/10
                </span>
              </div>
            </div>
            
            {dataInput.length > 0 && dataInput.length < 10 && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="text-xs text-amber-800">
                  Tambahkan {10 - dataInput.length} data lagi untuk memulai analisis
                </span>
              </div>
            )}
            
            {dataInput.length >= 10 && (
              <div className="p-2.5 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span className="text-xs text-green-800 font-semibold">
                  Data cukup! Klik "Selesai" untuk melanjutkan analisis
                </span>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* TAHAP 2: Grid 2 Kolom - Parameter Statistik & Uji Kecocokan */}
      {dataInput.length >= 10 && paramsAsli && paramsLog && goodnessOfFit && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Kolom Kiri: Parameter Statistik */}
          <div className="rounded-md border border-slate-300 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-900">1. Parameter Statistik</h3>
            </div>
            <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0c3a66] text-white">
                    <th className="px-3 py-2 text-left font-semibold text-sm">Parameter</th>
                    <th className="px-3 py-2 text-right font-semibold text-sm">Asli</th>
                    <th className="px-3 py-2 text-right font-semibold text-sm">Log</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 even:bg-slate-50">
                    <td className="px-3 py-2 font-medium flex items-center gap-1 tabular-nums tracking-tight">
                      Mean (X̄)
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="relative inline-block">
                          <Info className="w-3 h-3 text-slate-400 cursor-help" />
                          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                            Rata-rata data
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsAsli.mean.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsLog.mean.toFixed(4)}</td>
                  </tr>
                  <tr className="border-b border-slate-100 even:bg-slate-50">
                    <td className="px-3 py-2 font-medium tabular-nums tracking-tight">Std Dev (S)</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsAsli.stdDev.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsLog.stdDev.toFixed(4)}</td>
                  </tr>
                  <tr className="border-b border-slate-100 even:bg-slate-50">
                    <td className="px-3 py-2 font-medium tabular-nums tracking-tight">CV</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsAsli.cv.toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsLog.cv.toFixed(3)}</td>
                  </tr>
                  <tr className="border-b border-slate-100 even:bg-slate-50">
                    <td className="px-3 py-2 font-medium tabular-nums tracking-tight">Skewness (Cs)</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsAsli.cs.toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsLog.cs.toFixed(3)}</td>
                  </tr>
                  <tr className="even:bg-slate-50">
                    <td className="px-3 py-2 font-medium tabular-nums tracking-tight">Kurtosis (Ck)</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsAsli.ck.toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsLog.ck.toFixed(3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            </div>
          </div>

          {/* Kolom Kanan: Uji Kecocokan */}
          <div className="rounded-md border border-slate-300 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-900">2. Uji Kecocokan</h3>
            </div>
            <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0c3a66] text-white">
                    <th className="px-3 py-2 text-left font-semibold text-sm">Metode</th>
                    <th className="px-3 py-2 text-center font-semibold text-sm">Chi-Sq</th>
                    <th className="px-3 py-2 text-center font-semibold text-sm">K-S</th>
                    <th className="px-3 py-2 text-center font-semibold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {goodnessOfFit.map((gof) => {
                    const bothPassed = gof.chiSquare.accepted && gof.kolmogorovSmirnov.accepted;
                    const isRecommended = gof.method === recommendedMethod;
                    return (
                      <tr 
                        key={gof.method} 
                        className={`border-b border-slate-100 even:bg-slate-50 transition-all cursor-pointer hover:bg-blue-50 ${
                          isRecommended ? 'bg-blue-50/30' : ''
                        }`}
                        onClick={() => bothPassed && setSelectedMethod(gof.method)}
                        title={bothPassed ? 'Klik untuk memilih metode ini' : 'Metode ditolak'}
                      >
                        <td className="px-3 py-2 font-semibold flex items-center gap-1 tabular-nums tracking-tight">
                          {METHOD_LABELS[gof.method]}
                          {isRecommended && <span className="text-[9px] bg-pupr-blue text-white px-1 rounded">★</span>}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums tracking-tight">
                          {gof.chiSquare.accepted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums tracking-tight">
                          {gof.kolmogorovSmirnov.accepted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums tracking-tight">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded border ${
                            bothPassed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
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
        </div>
      )}

      {/* TAHAP 4: Tabel Hasil dengan Visual Hierarchy */}
      {distributions && (
        <div className="rounded-md border border-slate-300 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">3. Hujan Rencana (R₂₄)</h3>
              <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-700">Metode:</label>
              <select
                value={selectedMethod || ''}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold bg-white focus:border-[#0c3a66] focus:ring-1 focus:ring-[#0c3a66] focus:outline-none"
              >
                {distributions.map(d => (
                  <option key={d.method} value={d.method}>
                    {METHOD_LABELS[d.method]}
                    {d.method === recommendedMethod ? ' ⭐' : ''}
                  </option>
                ))}
              </select>
              {/* TAHAP 5: CTA Standardization - Tombol Simpan di Header */}
              <button
                onClick={handleCalculate}
                disabled={!selectedMethod}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  !selectedMethod
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-50'
                    : isCalculated
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                    : 'bg-[#0c3a66] hover:bg-[#0d4578] text-white shadow-sm'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                {isCalculated ? 'Tersimpan ✓' : 'Simpan'}
              </button>
            </div>
            </div>
          </div>
          <div className="p-4">

          {selectedMethod !== recommendedMethod && (
            <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="text-xs text-amber-800">
                Metode berbeda dari rekomendasi sistem ({METHOD_LABELS[recommendedMethod || '']})
              </span>
            </div>
          )}

          {/* Interactive Comparison Bar */}
          <div className="mb-4 p-3 bg-[#0c3a66] text-white rounded-md border border-[#0c3a66] overflow-hidden shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">Perbandingan Kala Ulang:</span>
              </div>
              <div className="flex gap-1">
                {[2, 5, 10, 25, 50, 100].map(tr => (
                  <button
                    key={tr}
                    onClick={() => setSelectedTr(tr)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                      selectedTr === tr 
                        ? 'bg-[#0c3a66] text-white shadow-sm' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Q{tr}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              {distributions.map(d => {
                const value = d.values.find(v => v.Tr === selectedTr)?.R24 || 0;
                const maxValue = Math.max(...distributions.map(dist => dist.values.find(v => v.Tr === selectedTr)?.R24 || 0));
                const percentage = (value / maxValue) * 100;
                const isSelected = d.method === selectedMethod;
                const isFailed = goodnessOfFit?.find(g => g.method === d.method) && 
                                 !(goodnessOfFit.find(g => g.method === d.method)!.chiSquare.accepted && 
                                   goodnessOfFit.find(g => g.method === d.method)!.kolmogorovSmirnov.accepted);
                
                return (
                  <div key={d.method} className="flex items-center gap-2">
                    <span className={`text-xs font-medium w-20 ${
                      isSelected ? 'text-yellow-400' : isFailed ? 'text-slate-500' : 'text-white'
                    }`}>
                      {METHOD_LABELS[d.method]}
                    </span>
                    <div className="flex-1 bg-slate-700/50 rounded-md h-5 overflow-hidden">
                      <div 
                        className={`h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2 ${
                          isSelected ? 'bg-yellow-400' : 
                          isFailed ? 'bg-slate-500' : 'bg-slate-300'
                        }`}
                        style={{ width: `${percentage}%` }}
                      >
                        <span className={`text-xs font-bold tabular-nums ${
                          isSelected ? 'text-slate-900' : 'text-slate-800'
                        }`}>{value.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#0c3a66] text-white">
                  <th className="px-3 py-2 text-center font-semibold text-sm">Tr</th>
                  {distributions.map(d => {
                    const isSelected = d.method === selectedMethod;
                    const isFailed = goodnessOfFit?.find(g => g.method === d.method) && 
                                     !(goodnessOfFit.find(g => g.method === d.method)!.chiSquare.accepted && 
                                       goodnessOfFit.find(g => g.method === d.method)!.kolmogorovSmirnov.accepted);
                    return (
                      <th key={d.method} className={`px-3 py-2 text-right font-semibold text-sm transition-colors ${
                        isSelected ? 'bg-[#0d4578] text-white' : isFailed ? 'text-slate-300' : 'text-white'
                      }`}>
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
                    className={`border-b border-slate-100 even:bg-slate-50 transition-all cursor-pointer ${
                      hoveredTr === tr ? 'bg-blue-50/30 scale-[1.01]' : ''
                    }`}
                    onMouseEnter={() => setHoveredTr(tr)}
                    onMouseLeave={() => setHoveredTr(null)}
                    onClick={() => setSelectedTr(tr)}
                  >
                    <td className={`px-3 py-2 text-center font-bold tabular-nums tracking-tight transition-colors ${
                      selectedTr === tr ? 'text-pupr-blue' : 'text-slate-700'
                    }`}>
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
                        <td key={d.method} className={`px-3 py-2 text-right font-mono tabular-nums tracking-tight transition-all ${
                          isSelected ? 'bg-blue-50/50 font-bold text-blue-700' : isFailed ? 'opacity-50 text-slate-400' : ''
                        }`}>
                          <div className="flex items-center justify-end gap-2">
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
      )}

      {dataInput.length < 10 && (
        <Card className="p-4 bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">Data Tidak Cukup</p>
              <p className="text-xs text-amber-800">Minimal 10 tahun data hujan diperlukan untuk analisis frekuensi yang valid.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
    </ModuleLayout>
  );
};
