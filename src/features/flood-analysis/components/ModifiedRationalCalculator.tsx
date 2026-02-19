import React, { useState, useMemo } from 'react';
import { calculateDesignFloodIndo, compareAllMethods, ModifiedRationalInput } from '@/lib/engine';
import { Info, AlertTriangle, TrendingUp } from 'lucide-react';

export const ModifiedRationalCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<ModifiedRationalInput>({
    luasDasKm2: 50,
    panjangSungaiUtamaKm: 15,
    kemiringanSungai: 0.01,
    curahHujanHarianMaksimum: 120,
    koefisienPengaliran: 0.7,
  });

  const result = useMemo(() => {
    try {
      return calculateDesignFloodIndo(inputs);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Error perhitungan' };
    }
  }, [inputs]);

  const comparison = useMemo(() => {
    try {
      return compareAllMethods(inputs);
    } catch {
      return null;
    }
  }, [inputs]);

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-5">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Modified Rational Methods</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Metode Haspers & Osugi, der Weduwen, Melchior</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Parameter DAS</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Luas DAS (km²)</label>
                  <input
                    type="number"
                    value={inputs.luasDasKm2}
                    onChange={e => setInputs({...inputs, luasDasKm2: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Panjang Sungai (km)</label>
                  <input
                    type="number"
                    value={inputs.panjangSungaiUtamaKm}
                    onChange={e => setInputs({...inputs, panjangSungaiUtamaKm: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Kemiringan (m/m)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={inputs.kemiringanSungai}
                    onChange={e => setInputs({...inputs, kemiringanSungai: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">R₂₄ (mm)</label>
                  <input
                    type="number"
                    value={inputs.curahHujanHarianMaksimum}
                    onChange={e => setInputs({...inputs, curahHujanHarianMaksimum: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Koef. Pengaliran (C)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.koefisienPengaliran || 0.7}
                    onChange={e => setInputs({...inputs, koefisienPengaliran: parseFloat(e.target.value) || 0.7})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-4">
            {'error' in result ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-red-900 mb-1">Error</h3>
                    <p className="text-xs text-red-800">{result.error}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Area Analysis */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-blue-900 mb-1">Analisis Area</h3>
                      <p className="text-xs text-blue-800">
                        Kategori: <strong>{result.areaAnalysis.category}</strong> ({result.areaAnalysis.area.toFixed(2)} km²)
                      </p>
                      <p className="text-xs text-blue-800 mt-1">{result.areaAnalysis.recommendation}</p>
                    </div>
                  </div>
                </div>

                {/* Recommended Method */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Metode Rekomendasi: {result.recommended.method.replace(/_/g, ' ')}</h2>
                    <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">PRIMARY</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Qpeak</span>
                      <span className="text-2xl font-bold text-teal-600">{result.recommended.qPeak.toFixed(2)}</span>
                      <span className="text-xs text-slate-400 ml-1">m³/s</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <span className="text-xs text-slate-500 uppercase font-bold block mb-1">tc</span>
                      <span className="text-2xl font-bold text-blue-600">{result.recommended.tc.toFixed(2)}</span>
                      <span className="text-xs text-slate-400 ml-1">jam</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <span className="text-xs text-slate-500 uppercase font-bold block mb-1">C</span>
                      <span className="text-2xl font-bold text-purple-600">{result.recommended.C.toFixed(3)}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <span className="text-xs text-slate-500 uppercase font-bold block mb-1">I</span>
                      <span className="text-2xl font-bold text-orange-600">{result.recommended.intensity.toFixed(1)}</span>
                      <span className="text-xs text-slate-400 ml-1">mm/jam</span>
                    </div>
                  </div>

                  {result.recommended.warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          {result.recommended.warnings.map((w, i) => (
                            <p key={i} className="text-xs text-amber-800">{w}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                    <strong>Formula:</strong> {result.recommended.metadata.formula}
                    {result.recommended.metadata.iterations && (
                      <span className="ml-2">(Iterasi: {result.recommended.metadata.iterations})</span>
                    )}
                  </div>
                </div>

                {/* Comparison Table */}
                {comparison && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-slate-600" />
                      <h2 className="text-lg font-bold text-slate-800">Perbandingan Semua Metode</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="text-left py-2.5 px-3 font-bold text-slate-700 text-xs uppercase">Metode</th>
                            <th className="text-right py-2.5 px-3 font-bold text-slate-700 text-xs uppercase">Qpeak (m³/s)</th>
                            <th className="text-right py-2.5 px-3 font-bold text-slate-700 text-xs uppercase">tc (jam)</th>
                            <th className="text-right py-2.5 px-3 font-bold text-slate-700 text-xs uppercase">C</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-2.5 px-3 font-bold text-slate-900">Haspers & Osugi</td>
                            <td className="py-2.5 px-3 text-right font-bold text-teal-600">{comparison.haspers.qPeak.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right">{comparison.haspers.tc.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right">{comparison.haspers.C.toFixed(3)}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-2.5 px-3 font-bold text-slate-900">der Weduwen</td>
                            <td className="py-2.5 px-3 text-right font-bold text-teal-600">{comparison.derWeduwen.qPeak.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right">{comparison.derWeduwen.tc.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right">{comparison.derWeduwen.C.toFixed(3)}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-slate-900">Melchior</td>
                            <td className="py-2.5 px-3 text-right font-bold text-teal-600">{comparison.melchior.qPeak.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right">{comparison.melchior.tc.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right">{comparison.melchior.C.toFixed(3)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Range Qpeak</span>
                        <span className="text-sm font-bold text-slate-800">
                          {comparison.comparison.qPeakRange.min.toFixed(2)} - {comparison.comparison.qPeakRange.max.toFixed(2)} m³/s
                        </span>
                        <span className="text-xs text-slate-500 block mt-1">Δ = {comparison.comparison.qPeakRange.diff.toFixed(2)} m³/s</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Range tc</span>
                        <span className="text-sm font-bold text-slate-800">
                          {comparison.comparison.tcRange.min.toFixed(2)} - {comparison.comparison.tcRange.max.toFixed(2)} jam
                        </span>
                        <span className="text-xs text-slate-500 block mt-1">Δ = {comparison.comparison.tcRange.diff.toFixed(2)} jam</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
