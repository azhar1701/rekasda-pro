import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, CheckCircle2, XCircle, AlertTriangle, Save, Download, Upload, ChevronDown, ChevronUp, Clipboard } from 'lucide-react';
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ params: true, gof: false, results: true });

  const hasValidData = useMemo(() => {
    // Check if we have minimum 10 years of data either from a selected point station OR computed areal rainfall
    // FREQUENCY ANALYSIS only needs RAIN data to start. Morphometry is needed later for Flood.
    const hasEnoughData = dataHujan.length >= 10 || (hasilThiessen && hasilThiessen.hujanRataRataDAS.length >= 10);
    return hasEnoughData;
  }, [dataHujan, hasilThiessen]);

  useEffect(() => {
    if (dataHujan.length > 0) {
      // Filter by selected station if applicable
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
          setDataInput([]); // Reset if not enough
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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
        iconColorClass="bg-purple-50 text-purple-600"
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
      iconColorClass="bg-purple-50 text-purple-600"
      actions={
        isCalculated && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        )
      }
    >
    <div className="space-y-6 py-2">
      {dataInput.length > 0 && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-sm text-indigo-900">
            <strong>📊 Sumber Data Terdeteksi:</strong> {dataInput.length} tahun Annual Maximum Series (AMS) 
            {selectedStasiun ? ` dari Stasiun ${selectedStasiun.nama_stasiun}` : ' (Hujan Wilayah/DAS)'}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Workflow Analisis</h2>
            <p className="text-xs text-slate-600">4 Distribusi × 2 Uji Kecocokan</p>
          </div>
        </div>
        {isCalculated && (
          <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-bold rounded-lg">
            ✓ Tersimpan
          </span>
        )}
      </div>

      <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-900">Data Hujan Maksimum Tahunan</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePasteFromExcel}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              title="Paste data dari Excel (TSV format)"
            >
              <Clipboard className="w-4 h-4" />
              📋 Paste dari Excel
            </button>
            {hasilThiessen && hasilThiessen.hujanRataRataDAS && hasilThiessen.hujanRataRataDAS.length > 0 && (
              <button
                onClick={() => {
                  setDataInput(hasilThiessen.hujanRataRataDAS);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                title="Gunakan Hujan Rata-rata DAS (Thiessen)"
              >
                <Upload className="w-4 h-4" />
                Load Hujan Wilayah (DAS)
              </button>
            )}
            {dataHujan.length > 0 && (
              <button
                onClick={() => {
                  const byYear = new Map<number, number>();
                  dataHujan.forEach(d => {
                    const year = new Date(d.tanggal).getFullYear();
                    const current = byYear.get(year) || 0;
                    if (d.curah_hujan > current) byYear.set(year, d.curah_hujan);
                  });
                  setDataInput(Array.from(byYear.values()));
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                title="Gunakan Hujan Titik (Stasiun Terpilih)"
              >
                <Upload className="w-4 h-4" />
                Load Hujan Stasiun Terpilih
              </button>
            )}
          </div>
        </div>
        <textarea
          value={dataInput.join(', ')}
          onChange={(e) => setDataInput(e.target.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v)))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
          rows={3}
          placeholder="Masukkan data hujan (mm), pisahkan dengan koma"
        />
        <p className="text-xs text-slate-500 mt-2">
          Jumlah data: <strong>{dataInput.length} tahun</strong> (minimal 10 tahun)
          {selectedStasiun && ` • Stasiun: ${selectedStasiun.nama_stasiun}`}
        </p>
      </Card>

      {dataInput.length >= 10 && paramsAsli && paramsLog && (
        <>
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
            <button
              onClick={() => toggleSection('params')}
              className="w-full flex items-center justify-between mb-4 hover:bg-slate-50 -m-2 p-2 rounded-lg transition-colors"
            >
              <h3 className="text-lg font-bold text-slate-900">1. Parameter Statistik</h3>
              {expandedSections.params ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.params && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Parameter</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">Data Asli</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">Data Log</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium">Mean (X̄)</td>
                    <td className="px-3 py-2 text-right font-mono">{paramsAsli.mean.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono">{paramsLog.mean.toFixed(4)}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium">Std Dev (S)</td>
                    <td className="px-3 py-2 text-right font-mono">{paramsAsli.stdDev.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono">{paramsLog.stdDev.toFixed(4)}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium">CV</td>
                    <td className="px-3 py-2 text-right font-mono">{paramsAsli.cv.toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono">{paramsLog.cv.toFixed(3)}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium">Skewness (Cs)</td>
                    <td className="px-3 py-2 text-right font-mono">{paramsAsli.cs.toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono">{paramsLog.cs.toFixed(3)}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium">Kurtosis (Ck)</td>
                    <td className="px-3 py-2 text-right font-mono">{paramsAsli.ck.toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono">{paramsLog.ck.toFixed(3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            )}
          </Card>

          {goodnessOfFit && (
            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
              <button
                onClick={() => toggleSection('gof')}
                className="w-full flex items-center justify-between mb-4 hover:bg-slate-50 -m-2 p-2 rounded-lg transition-colors"
              >
                <h3 className="text-lg font-bold text-slate-900">2. Uji Kecocokan (Goodness of Fit)</h3>
                {expandedSections.gof ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {expandedSections.gof && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b-2 border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Metode</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700">Chi-Square</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700">Kolmogorov-Smirnov</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goodnessOfFit.map((gof) => {
                      const bothPassed = gof.chiSquare.accepted && gof.kolmogorovSmirnov.accepted;
                      return (
                        <tr key={gof.method} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-3 py-2 font-semibold">{METHOD_LABELS[gof.method]}</td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {gof.chiSquare.accepted ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className="text-xs font-mono">
                                {gof.chiSquare.statistic.toFixed(2)} / {gof.chiSquare.critical.toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {gof.kolmogorovSmirnov.accepted ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className="text-xs font-mono">
                                {gof.kolmogorovSmirnov.statistic.toFixed(3)} / {gof.kolmogorovSmirnov.critical.toFixed(3)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              bothPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {bothPassed ? 'DITERIMA' : 'DITOLAK'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}
            </Card>
          )}

          {distributions && (
            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
              <button
                onClick={() => toggleSection('results')}
                className="w-full flex items-center justify-between mb-4 hover:bg-slate-50 -m-2 p-2 rounded-lg transition-colors"
              >
                <h3 className="text-lg font-bold text-slate-900">3. Hujan Rencana (R₂₄)</h3>
                {expandedSections.results ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {expandedSections.results && (
              <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">Metode Terpilih:</label>
                  <select
                    value={selectedMethod || ''}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold"
                  >
                    {distributions.map(d => (
                      <option key={d.method} value={d.method}>
                        {METHOD_LABELS[d.method]}
                        {d.method === recommendedMethod ? ' (Rekomendasi)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedMethod !== recommendedMethod && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    Anda memilih metode berbeda dari rekomendasi sistem. Pastikan keputusan ini berdasarkan analisis engineering.
                  </span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b-2 border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700">Kala Ulang (Tr)</th>
                      {distributions.map(d => (
                        <th key={d.method} className={`px-3 py-2 text-right font-semibold ${
                          d.method === selectedMethod ? 'bg-blue-100 text-blue-900' : 'text-slate-700'
                        }`}>
                          {METHOD_LABELS[d.method]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[2, 5, 10, 25, 50, 100].map(tr => (
                      <tr key={tr} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 text-center font-bold">Q{tr}</td>
                        {distributions.map(d => {
                          const value = d.values.find(v => v.Tr === tr);
                          const formula = d.method === selectedMethod ? getWhiteBoxFormula(d.method, tr, value?.R24 || 0) : null;
                          return (
                            <td key={d.method} className={`px-3 py-2 text-right font-mono ${
                              d.method === selectedMethod ? 'bg-blue-50 font-bold text-blue-900' : ''
                            }`}>
                              <div className="flex items-center justify-end gap-2">
                                <span>{value?.R24.toFixed(2)} mm</span>
                                {formula && d.method === selectedMethod && (
                                  <WhiteBoxFormula {...formula} />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
              )}
            </Card>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCalculate}
              disabled={!selectedMethod}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                !selectedMethod
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : isCalculated
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
              }`}
            >
              <Save className="w-6 h-6" />
              {isCalculated ? 'Tersimpan ✓' : 'Simpan Hasil Analisis'}
            </button>
            {isCalculated && (
              <button
                onClick={() => window.location.hash = '#banjir'}
                className="px-6 py-4 rounded-xl font-bold text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all"
              >
                Lanjut ke Modul Banjir →
              </button>
            )}
          </div>
        </>
      )}

      {dataInput.length < 10 && (
        <Card className="p-6 bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Data Tidak Cukup</p>
              <p className="text-sm text-amber-800">Minimal 10 tahun data hujan diperlukan untuk analisis frekuensi yang valid.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
    </ModuleLayout>
  );
};
