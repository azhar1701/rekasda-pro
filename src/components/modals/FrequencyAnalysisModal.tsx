import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, Download, Save, AlertTriangle, Shield } from 'lucide-react';
import { DataInputTable } from './FrequencyAnalysisModal/DataInputTable';
import { StatCard } from './FrequencyAnalysisModal/StatCard';
import { calculateStatistics, performFrequencyAnalysis, type DistributionMethod } from '@/lib/engine/statistics/frequency';
import { validateDistributionFit } from '@/lib/engine/statistics/goodnessOfFit';
import { useHydrologyStore, type HasilAnalisisFrekuensi } from '@/stores/useHydrologyStore';
import { calculatePMP } from '@/lib/engine/rainfallAnalysis';

export interface RainfallDataPoint {
  year: number;
  value: number;
}

export type { DistributionMethod };

interface FrequencyAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectValue?: (period: number, value: number) => void;
}

export const FrequencyAnalysisModal: React.FC<FrequencyAnalysisModalProps> = ({
  isOpen,
  onClose,
  onSelectValue
}) => {
  const [data, setData] = useState<RainfallDataPoint[]>([
    { year: 2014, value: 80 },
    { year: 2015, value: 95 },
    { year: 2016, value: 110 },
    { year: 2017, value: 125 },
    { year: 2018, value: 140 },
    { year: 2019, value: 155 },
    { year: 2020, value: 170 },
    { year: 2021, value: 185 }
  ]);
  const [method, setMethod] = useState<DistributionMethod>('gumbel');
  const [statistics, setStatistics] = useState<any>(null);
  const [goodnessOfFit, setGoodnessOfFit] = useState<any>(null);
  const [results, setResults] = useState<any>(null);

  // Track which rows were manually edited (for amber border)
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set());
  // Track whether data was autofilled from store
  const [isAutofilled, setIsAutofilled] = useState(false);

  // PMP toggle
  const [showPMP, setShowPMP] = useState(false);

  // ── Global Store ──
  const dataHujan = useHydrologyStore(s => s.dataHujan);
  const selectedStasiun = useHydrologyStore(s => s.selectedStasiun);
  const setHasilAnalisisFrekuensi = useHydrologyStore(s => s.setHasilAnalisisFrekuensi);

  // ── Extract Annual Maximum from Master Data ──
  const annualMaxData = useMemo(() => {
    if (!dataHujan || dataHujan.length === 0) return [];

    // Group by year, find daily max per year
    const byYear = new Map<number, number>();
    dataHujan.forEach(d => {
      const year = new Date(d.tanggal).getFullYear();
      const current = byYear.get(year) || 0;
      if (d.curah_hujan > current) {
        byYear.set(year, d.curah_hujan);
      }
    });

    return Array.from(byYear.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
  }, [dataHujan]);

  const canAutofill = annualMaxData.length > 0 && selectedStasiun !== null;

  // ── Autofill Handler ──
  const handleAutofill = useCallback(() => {
    if (annualMaxData.length === 0) return;
    setData(annualMaxData);
    setEditedRows(new Set());
    setIsAutofilled(true);
  }, [annualMaxData]);

  // ── Hybrid data handler ──
  const handleDataChange = useCallback((newData: RainfallDataPoint[]) => {
    // Detect which rows changed vs autofill
    if (isAutofilled) {
      const newEdited = new Set(editedRows);
      newData.forEach((row, i) => {
        const original = annualMaxData.find(d => d.year === row.year);
        if (original && original.value !== row.value) {
          newEdited.add(i);
        }
      });
      setEditedRows(newEdited);
    }
    setData(newData);
  }, [isAutofilled, editedRows, annualMaxData]);

  // ── Analysis calculation ──
  useEffect(() => {
    if (data.length >= 3) {
      try {
        const values = data.map(d => d.value);
        const stats = calculateStatistics(values);
        const fit = validateDistributionFit(values, method);
        const analysis = performFrequencyAnalysis({ data: values, returnPeriods: [2, 5, 10, 25, 50, 100] }, method);

        setStatistics(stats);
        setGoodnessOfFit(fit);
        setResults(analysis);
      } catch (error) {
        const values = data.map(d => d.value);
        const stats = calculateStatistics(values);
        setStatistics(stats);
        setGoodnessOfFit(null);
        setResults(null);
      }
    }
  }, [data, method]);

  // ── Save to Global Store ──
  const handleSaveToStore = useCallback(() => {
    if (!results || !goodnessOfFit) return;

    const hasil: HasilAnalisisFrekuensi = {
      metodeTerpilih: method === 'logpearson3' ? 'Log-Pearson III'
        : method === 'gumbel' ? 'Gumbel'
          : method === 'lognormal' ? 'Log-Normal'
            : 'Normal',
      lulusUjiKecocokan: goodnessOfFit.isValid,
      curahHujanRencana: results.designValues.map((item: any) => ({
        kalaUlang: item.returnPeriod,
        curahHujan: Number(item.designValue.toFixed(2)),
      })),
      selectedKalaUlang: null,
    };

    setHasilAnalisisFrekuensi(hasil);
    onClose();
  }, [results, goodnessOfFit, method, setHasilAnalisisFrekuensi, onClose]);

  if (!isOpen) return null;

  const canSave = results && goodnessOfFit;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto relative z-10" onClick={(e) => e.stopPropagation()}>

        {/* Header (Fixed) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Analisis Frekuensi Hujan</h2>
            {selectedStasiun && (
              <p className="text-xs text-slate-500 mt-0.5">
                Stasiun: <span className="font-semibold text-blue-600">{selectedStasiun.nama_stasiun}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">

            {/* Left Column - Data Input */}
            <div className="col-span-12 md:col-span-5 space-y-3">
              {/* Autofill Button */}
              {canAutofill && (
                <button
                  onClick={handleAutofill}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 hover:border-blue-300"
                >
                  <Download className="w-4 h-4" />
                  Tarik Data Maksimum Tahunan dari Master Data
                </button>
              )}

              {/* Autofill status */}
              {isAutofilled && editedRows.size > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {editedRows.size} baris diedit manual
                </div>
              )}

              <DataInputTable
                data={data}
                onChange={handleDataChange}
                editedRows={editedRows}
              />
            </div>

            {/* Right Column - Analysis & Results */}
            <div className="col-span-12 md:col-span-7 flex flex-col gap-4">

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Jumlah Data" value={data.length.toString()} />
                <StatCard label="Rata-rata" value={statistics?.mean?.toFixed(2) || '0.00'} />
                <StatCard label="Std Deviasi" value={statistics?.stdDev?.toFixed(2) || '0.00'} />
                <StatCard label="Skewness (Cs)" value={statistics?.cs?.toFixed(3) || '0.000'} />
              </div>

              {/* Validation Alert - Compact */}
              {data.length < 10 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 font-medium text-sm">⚠️</span>
                    <span className="text-amber-800 text-sm font-medium">
                      Data minimal 10 tahun. Saat ini: {data.length} tahun.
                    </span>
                  </div>
                </div>
              )}

              {/* Goodness of Fit - Compact */}
              {goodnessOfFit && (
                <div className={`border rounded-lg p-3 ${goodnessOfFit.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${goodnessOfFit.isValid ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <span className={`text-sm font-medium ${goodnessOfFit.isValid ? 'text-emerald-900' : 'text-amber-900'}`}>
                        Uji Kecocokan: {goodnessOfFit.isValid ? 'LULUS' : 'PERINGATAN'}
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className={`px-2 py-1 rounded ${goodnessOfFit.chiSquare.isAccepted ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        χ²: {goodnessOfFit.chiSquare.isAccepted ? '✓' : '✗'}
                      </span>
                      <span className={`px-2 py-1 rounded ${goodnessOfFit.kolmogorovSmirnov.isAccepted ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        KS: {goodnessOfFit.kolmogorovSmirnov.isAccepted ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Method & Results Panel */}
              <div className="xl:col-span-2 space-y-6">
                {/* Method Selection - Compact Segmented Control */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">Metode Distribusi</h3>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {method === 'logpearson3' ? 'Log-Pearson III' : method === 'gumbel' ? 'Gumbel' : method === 'lognormal' ? 'Log-Normal' : 'Normal'}
                    </span>
                  </div>
                  <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                    {[
                      { display: 'Log-Pearson III', value: 'logpearson3' as DistributionMethod },
                      { display: 'Gumbel', value: 'gumbel' as DistributionMethod },
                      { display: 'Normal', value: 'normal' as DistributionMethod }
                    ].map((methodOption) => (
                      <button
                        key={methodOption.value}
                        onClick={() => setMethod(methodOption.value)}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${method === methodOption.value
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                          }`}
                      >
                        {methodOption.display}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results - Compact */}
                {results && (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">Hasil Analisis Frekuensi</h3>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {results.designValues.length} nilai
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-slate-700 border-b">Kala Ulang</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-700 border-b">Intensitas (mm)</th>
                            <th className="px-3 py-2 text-center font-medium text-slate-700 border-b">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.designValues.map((item: any) => (
                            <tr key={item.returnPeriod} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Q{item.returnPeriod}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="font-semibold text-teal-600">
                                  {item.designValue.toFixed(2)}
                                </span>
                                <span className="text-slate-500 ml-1">mm</span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => {
                                    onSelectValue?.(item.returnPeriod, item.designValue);
                                    onClose();
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-teal-600 hover:bg-teal-50 rounded border border-teal-200 hover:border-teal-300"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Pilih
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── PMP Toggle ─── */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowPMP(!showPMP)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all ${showPMP
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-300'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Hitung PMP / CMB (Infrastruktur Risiko Tinggi)
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${showPMP ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                    {showPMP ? 'AKTIF' : 'OFF'}
                  </span>
                </button>

                {showPMP && data.length >= 3 && (() => {
                  try {
                    const pmpResult = calculatePMP(data.map(d => d.value));
                    return (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-4 h-4 text-rose-600" />
                          <h4 className="text-sm font-bold text-rose-800">Curah Hujan Maksimum Boleh Jadi (PMP)</h4>
                        </div>
                        <div className="text-xs text-rose-600 mb-3">Metode Hershfield · PMP = X̄ + Kn × Sn</div>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-white rounded-lg p-2 text-center border border-rose-100">
                            <p className="text-[10px] font-semibold text-slate-400">Mean (X̄)</p>
                            <p className="text-sm font-black text-slate-800">{pmpResult.mean}</p>
                            <p className="text-[10px] text-slate-400">mm</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-rose-100">
                            <p className="text-[10px] font-semibold text-slate-400">Std Dev (Sn)</p>
                            <p className="text-sm font-black text-slate-800">{pmpResult.stdDev}</p>
                            <p className="text-[10px] text-slate-400">mm</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-rose-100">
                            <p className="text-[10px] font-semibold text-slate-400">Kn</p>
                            <p className="text-sm font-black text-indigo-600">{pmpResult.kn}</p>
                            <p className="text-[10px] text-slate-400">faktor</p>
                          </div>
                          <div className="bg-rose-100 rounded-lg p-2 text-center border border-rose-200">
                            <p className="text-[10px] font-bold text-rose-500">PMP</p>
                            <p className="text-lg font-black text-rose-700">{pmpResult.pmp}</p>
                            <p className="text-[10px] text-rose-400">mm</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-rose-500 mt-2">
                          Gunakan nilai PMP untuk desain infrastruktur risiko tinggi (bendungan, spillway).
                        </p>
                      </div>
                    );
                  } catch {
                    return (
                      <div className="text-xs text-rose-500 p-2">Data tidak cukup untuk perhitungan PMP.</div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Save & Close */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Pilih nilai untuk digunakan dalam perhitungan
            </div>
            <div className="flex items-center gap-3">
              {/* Save All to Store */}
              <button
                onClick={handleSaveToStore}
                disabled={!canSave}
                className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl text-sm transition-all ${canSave
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/40'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
              >
                <Save className="w-4 h-4" />
                Simpan & Gunakan untuk Modul Banjir
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
