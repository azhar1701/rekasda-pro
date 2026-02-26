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
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [hoveredTr, setHoveredTr] = useState<number | null>(null);
  const [selectedTr, setSelectedTr] = useState<number>(25);

  const hasValidData = useMemo(() => {
    const hasEnoughData = dataHujan.length >= 10 || (hasilThiessen && hasilThiessen.hujanRataRataDAS.length >= 10);
    return hasEnoughData;
  }, [dataHujan, hasilThiessen]);

  useEffect(() => {
    if (dataHujan.length > 0) {
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
        if (annualMax.length >= 10) {
          setDataInput(annualMax);
        } else {
          setDataInput([]);
        }
      } else {
        setDataInput([]);
      }
    }
  }, [dataHujan, selectedStasiun]);

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
    
    setAnalisisFrekuensi({
      parameterStatistik: { asli: paramsAsli, log: paramsLog },
      hasilDistribusi: distributions,
      ujiKecocokan: goodnessOfFit,
      metodeTerpilih: selectedMethod,
      dataHujanInput: dataInput
    });
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
        iconColorClass="bg-blue-50 text-blue-600"
      >
        <ActionableEmptyState 
          title="Data Belum Lengkap"
          description="Lengkapi Data Master terlebih dahulu: (1) Data Curah Hujan minimal 10 tahun, (2) Morfometri DAS, (3) Tutupan Lahan."
        />
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout
      title="Analisis Frekuensi Hujan Ekstrem"
      description="Perhitungan probabilitas hujan rencana (SNI 2415:2016)"
      icon={<BarChart3 className="w-6 h-6" />}
      iconColorClass="bg-blue-50 text-blue-600"
      actions={
        isCalculated && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        )
      }
    >
    <div className="space-y-5 py-2">
      {/* TAHAP 1: Smart Data Context - Compressed Input */}
      <Card className="p-4 bg-white border border-slate-200">
        {dataInput.length >= 10 && !showManualInput ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  ✅ Sumber Data: {dataInput.length} Tahun {selectedStasiun ? `dari ${selectedStasiun.nama_stasiun}` : '(Hujan Wilayah)'}
                </p>
                <p className="text-xs text-slate-600 font-mono">
                  Range: {Math.min(...dataInput).toFixed(1)} - {Math.max(...dataInput).toFixed(1)} mm
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowManualInput(true)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ✏️ Edit Manual
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Input Data Hujan Maksimum Tahunan</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePasteFromExcel}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  Paste Excel
                </button>
                {hasilThiessen?.hujanRataRataDAS?.length > 0 && (
                  <button
                    onClick={() => { setDataInput(hasilThiessen.hujanRataRataDAS); setShowManualInput(false); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Load DAS
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={dataInput.join(', ')}
              onChange={(e) => setDataInput(e.target.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v)))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
              rows={2}
              placeholder="Masukkan data hujan (mm), pisahkan dengan koma"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Jumlah: <strong>{dataInput.length}</strong> (min. 10 tahun)
            </p>
          </>
        )}
      </Card>

      {/* TAHAP 2: Grid 2 Kolom - Parameter Statistik & Uji Kecocokan */}
      {dataInput.length >= 10 && paramsAsli && paramsLog && goodnessOfFit && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Kolom Kiri: Parameter Statistik */}
          <Card className="p-5 bg-white border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">1. Parameter Statistik</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700">Parameter</th>
                    <th className="px-2 py-2 text-right font-semibold text-slate-700">Asli</th>
                    <th className="px-2 py-2 text-right font-semibold text-slate-700">Log</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="px-2 py-1.5 font-medium flex items-center gap-1">
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
                    <td className="px-2 py-1.5 text-right font-mono">{paramsAsli.mean.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right font-mono">{paramsLog.mean.toFixed(4)}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-2 py-1.5 font-medium">Std Dev (S)</td>
                    <td className="px-2 py-1.5 text-right font-mono">{paramsAsli.stdDev.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right font-mono">{paramsLog.stdDev.toFixed(4)}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-2 py-1.5 font-medium">CV</td>
                    <td className="px-2 py-1.5 text-right font-mono">{paramsAsli.cv.toFixed(3)}</td>
                    <td className="px-2 py-1.5 text-right font-mono">{paramsLog.cv.toFixed(3)}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-2 py-1.5 font-medium">Skewness (Cs)</td>
                    <td className="px-2 py-1.5 text-right font-mono">{paramsAsli.cs.toFixed(3)}</td>
                    <td className="px-2 py-1.5 text-right font-mono">{paramsLog.cs.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5 font-medium">Kurtosis (Ck)</td>
                    <td className="px-2 py-1.5 text-right font-mono">{paramsAsli.ck.toFixed(3)}</td>
                    <td className="px-2 py-1.5 text-right font-mono">{paramsLog.ck.toFixed(3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Kolom Kanan: Uji Kecocokan */}
          <Card className="p-5 bg-white border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">2. Uji Kecocokan</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700">Metode</th>
                    <th className="px-2 py-2 text-center font-semibold text-slate-700">Chi-Sq</th>
                    <th className="px-2 py-2 text-center font-semibold text-slate-700">K-S</th>
                    <th className="px-2 py-2 text-center font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {goodnessOfFit.map((gof) => {
                    const bothPassed = gof.chiSquare.accepted && gof.kolmogorovSmirnov.accepted;
                    const isRecommended = gof.method === recommendedMethod;
                    return (
                      <tr 
                        key={gof.method} 
                        className={`border-b border-slate-100 transition-all cursor-pointer hover:bg-slate-50 ${
                          isRecommended ? 'bg-blue-50/30' : ''
                        }`}
                        onClick={() => bothPassed && setSelectedMethod(gof.method)}
                        title={bothPassed ? 'Klik untuk memilih metode ini' : 'Metode ditolak'}
                      >
                        <td className="px-2 py-1.5 font-semibold flex items-center gap-1">
                          {METHOD_LABELS[gof.method]}
                          {isRecommended && <span className="text-[9px] bg-blue-600 text-white px-1 rounded">★</span>}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {gof.chiSquare.accepted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {gof.kolmogorovSmirnov.accepted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                            bothPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
          </Card>
        </div>
      )}

      {/* TAHAP 4: Tabel Hasil dengan Visual Hierarchy */}
      {distributions && (
        <Card className="p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">3. Hujan Rencana (R₂₄)</h3>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-700">Metode:</label>
              <select
                value={selectedMethod || ''}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
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
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !selectedMethod
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : isCalculated
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                {isCalculated ? 'Tersimpan ✓' : 'Simpan'}
              </button>
            </div>
          </div>

          {selectedMethod !== recommendedMethod && (
            <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="text-xs text-amber-800">
                Metode berbeda dari rekomendasi sistem ({METHOD_LABELS[recommendedMethod || '']})
              </span>
            </div>
          )}

          {/* Interactive Comparison Bar */}
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-700">Perbandingan Kala Ulang:</span>
              </div>
              <div className="flex gap-1">
                {[2, 5, 10, 25, 50, 100].map(tr => (
                  <button
                    key={tr}
                    onClick={() => setSelectedTr(tr)}
                    className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${
                      selectedTr === tr 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-slate-600 hover:bg-blue-100'
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
                    <span className={`text-[10px] font-semibold w-20 ${
                      isSelected ? 'text-blue-700' : isFailed ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {METHOD_LABELS[d.method]}
                    </span>
                    <div className="flex-1 bg-slate-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1.5 ${
                          isSelected ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                          isFailed ? 'bg-slate-300' : 'bg-gradient-to-r from-slate-400 to-slate-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-[9px] font-bold text-white">{value.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-center font-semibold text-slate-700">Tr</th>
                  {distributions.map(d => {
                    const isSelected = d.method === selectedMethod;
                    const isFailed = goodnessOfFit?.find(g => g.method === d.method) && 
                                     !(goodnessOfFit.find(g => g.method === d.method)!.chiSquare.accepted && 
                                       goodnessOfFit.find(g => g.method === d.method)!.kolmogorovSmirnov.accepted);
                    return (
                      <th key={d.method} className={`px-3 py-2 text-right font-semibold transition-colors ${
                        isSelected ? 'bg-blue-50/50 text-blue-700' : isFailed ? 'text-slate-400' : 'text-slate-700'
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
                    className={`border-b border-slate-100 transition-all cursor-pointer ${
                      hoveredTr === tr ? 'bg-blue-50/30 scale-[1.01]' : ''
                    }`}
                    onMouseEnter={() => setHoveredTr(tr)}
                    onMouseLeave={() => setHoveredTr(null)}
                    onClick={() => setSelectedTr(tr)}
                  >
                    <td className={`px-3 py-2 text-center font-bold transition-colors ${
                      selectedTr === tr ? 'text-blue-600' : 'text-slate-700'
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
                        <td key={d.method} className={`px-3 py-2 text-right font-mono transition-all ${
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
        </Card>
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
