import React, { useState, useEffect, useMemo } from 'react';
import { CloudRain, AlertCircle, Save, CheckCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useHydrologyStore, type CurahHujanWilayah, type ThiessenStasiunConfig, type IsohyetConfig } from '@/stores/useHydrologyStore';
import { calculateIsohyetAverage } from '@/lib/engine/rainfallAnalysis';
import { determineRainfallMethod, MethodParams, RecommendationResult } from '@/utils/rainfallMethodSelector';

export const HujanWilayahCard: React.FC = () => {
  const { curahHujanWilayah, setCurahHujanWilayah, stasiunList, morfometriDAS } = useHydrologyStore();
  
  const [metode, setMetode] = useState<'aljabar' | 'thiessen' | 'isohyet'>(curahHujanWilayah?.metode || 'aljabar');
  const [configs, setConfigs] = useState<ThiessenStasiunConfig[]>(
    curahHujanWilayah?.stasiunConfigs || []
  );
  const [isohyetalConfigs, setIsohyetalConfigs] = useState<IsohyetConfig[]>(
    curahHujanWilayah?.isohyetConfigs || []
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  
  const [params, setParams] = useState<MethodParams>({
    hasCoordinates: true,
    topography: 'flat',
    distribution: 'uniform',
    stationCount: stasiunList.length,
  });

  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);

  useEffect(() => {
    if (curahHujanWilayah) {
      setMetode(curahHujanWilayah.metode);
      setConfigs(curahHujanWilayah.stasiunConfigs);
      setIsohyetalConfigs(curahHujanWilayah.isohyetConfigs || []);
      setIsSaved(true);
    }
  }, [curahHujanWilayah]);

  useEffect(() => {
    if (stasiunList.length > 0) {
      setParams(prev => ({ ...prev, stationCount: stasiunList.length }));
      setConfigs(prevConfigs => {
        // Sinkronisasi configs dengan stasiunList terbaru
        const newConfigs = stasiunList.map(s => {
          const existing = prevConfigs.find(c => c.stasiunId === s.id);
          if (existing) {
            return { ...existing, namaStasiun: s.nama_stasiun };
          }
          return {
            stasiunId: s.id,
            namaStasiun: s.nama_stasiun,
            luasPengaruh: 0,
            bobot: 0,
          };
        });
        return newConfigs;
      });
    } else {
      setParams(prev => ({ ...prev, stationCount: 0 }));
      setConfigs([]);
    }
  }, [stasiunList]);

  useEffect(() => {
    setRecommendation(determineRainfallMethod(params));
  }, [params]);

  const { totalLuasPengaruh, bobotError } = useMemo(() => {
    const total = configs.reduce((sum, c) => sum + (typeof c.luasPengaruh === 'string' ? parseFloat(c.luasPengaruh) || 0 : c.luasPengaruh), 0);
    const dasLuas = morfometriDAS?.luasDAS || 0;
    const error = dasLuas > 0 ? Math.abs(total - dasLuas) : 0;
    
    return {
      totalLuasPengaruh: total,
      bobotError: error,
    };
  }, [configs, morfometriDAS]);

  const configsWithBobot = useMemo(() => {
    return configs.map(c => {
      const safeluas = typeof c.luasPengaruh === 'string' ? parseFloat(c.luasPengaruh) || 0 : c.luasPengaruh;
      return {
        ...c,
        bobot: totalLuasPengaruh > 0 ? (safeluas / totalLuasPengaruh) * 100 : 0,
      }
    });
  }, [configs, totalLuasPengaruh]);

  const hasError = metode === 'thiessen' && bobotError > 0.01 && morfometriDAS !== null;

  const handleLuasChange = (stasiunId: string, value: string) => {
    setConfigs(configs.map(c => 
      c.stasiunId === stasiunId ? { ...c, luasPengaruh: value as unknown as number } : c
    ));
    setIsSaved(false);
  };

  const handleSave = () => {
    const safeConfigs = configsWithBobot.map(c => ({
      ...c,
      luasPengaruh: typeof c.luasPengaruh === 'string' ? parseFloat(c.luasPengaruh) || 0 : c.luasPengaruh
    }));

    const safeIsohyet = isohyetalConfigs.map(c => ({
      ...c,
      luasAntarGaris: typeof c.luasAntarGaris === 'string' ? parseFloat(c.luasAntarGaris) || 0 : c.luasAntarGaris,
      curahHujanRataRata: typeof c.curahHujanRataRata === 'string' ? parseFloat(c.curahHujanRataRata) || 0 : c.curahHujanRataRata
    }));

    let avgValue = 0;
    if (metode === 'thiessen' && safeConfigs.length > 0) {
      // Logic derived from ThiessenCalculator
      avgValue = safeConfigs.reduce((sum, c) => sum + (c.bobot/100 * (configs.find(oc => oc.stasiunId === c.stasiunId)?.luasPengaruh || 0)), 0);
    } else if (metode === 'isohyet' && safeIsohyet.length > 0) {
      avgValue = calculateIsohyetAverage(safeIsohyet);
    }

    const data: CurahHujanWilayah = {
      metode,
      stasiunConfigs: safeConfigs,
      isohyetConfigs: safeIsohyet,
      hujanRataRata: avgValue,
    };
    setCurahHujanWilayah(data);
    setConfigs(safeConfigs);
    setIsohyetalConfigs(safeIsohyet);
    setIsSaved(true);
  };

  const handleApplyRecommendation = () => {
    if (recommendation) {
      let methodValue: 'aljabar' | 'thiessen' | 'isohyet' = 'aljabar';
      if (recommendation.method === 'Metode Poligon Thiessen') methodValue = 'thiessen';
      if (recommendation.method === 'Metode Isohyet') methodValue = 'isohyet';
      
      setMetode(methodValue);
      setIsAssistantOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border border-slate-300 shadow-sm rounded-md overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0c3a66]/10 rounded">
              <CloudRain className="w-5 h-5 text-[#0c3a66]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Curah Hujan Wilayah</h3>
              <p className="text-xs text-slate-600 font-medium">Metode rata-rata spasial</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <button 
              onClick={() => setIsAssistantOpen(!isAssistantOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 hover:bg-amber-100 transition-colors w-full justify-between"
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-[#f2c114]" />
                Asisten Penentuan Metode (Semi-Auto AI)
              </div>
              {isAssistantOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isAssistantOpen && (
              <div className="mt-3 p-4 border border-slate-200 rounded-md bg-slate-50 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Ketersediaan Koordinat</label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={params.hasCoordinates}
                          onChange={() => setParams({ ...params, hasCoordinates: true })}
                          className="w-3.5 h-3.5 text-[#0c3a66]"
                        />
                        <span className="text-sm text-slate-700">Tersedia</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!params.hasCoordinates}
                          onChange={() => setParams({ ...params, hasCoordinates: false })}
                          className="w-3.5 h-3.5 text-[#0c3a66]"
                        />
                        <span className="text-sm text-slate-700">Tidak Ada</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Kondisi Topografi</label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={params.topography === 'flat'}
                          onChange={() => setParams({ ...params, topography: 'flat' })}
                          className="w-3.5 h-3.5 text-[#0c3a66]"
                        />
                        <span className="text-sm text-slate-700">Relatif Datar</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={params.topography === 'varied'}
                          onChange={() => setParams({ ...params, topography: 'varied' })}
                          className="w-3.5 h-3.5 text-[#0c3a66]"
                        />
                        <span className="text-sm text-slate-700">Bervariasi</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Penyebaran Hujan</label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={params.distribution === 'uniform'}
                          onChange={() => setParams({ ...params, distribution: 'uniform' })}
                          className="w-3.5 h-3.5 text-[#0c3a66]"
                        />
                        <span className="text-sm text-slate-700">Merata</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={params.distribution === 'uneven'}
                          onChange={() => setParams({ ...params, distribution: 'uneven' })}
                          className="w-3.5 h-3.5 text-[#0c3a66]"
                        />
                        <span className="text-sm text-slate-700">Tidak Merata</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Jumlah Stasiun</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={params.stationCount}
                        onChange={(e) => setParams({ ...params, stationCount: parseInt(e.target.value) || 0 })}
                        className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-[#0c3a66] tabular-nums"
                      />
                      <span className="text-xs text-slate-500 italic">(Terdeteksi: {stasiunList.length})</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-amber-200 p-3 rounded-md border-l-4 border-l-[#f2c114]">
                  <h4 className="text-xs font-bold text-amber-900 uppercase mb-1">Rekomendasi Terdeteksi</h4>
                  <p className="text-sm font-bold text-[#0c3a66]">{recommendation?.method}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{recommendation?.reason}</p>
                  <button 
                    onClick={handleApplyRecommendation}
                    className="mt-3 px-3 py-1.5 bg-[#0c3a66] text-white text-xs font-bold rounded hover:bg-[#092b4d] transition-all flex items-center gap-2"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Terapkan Rekomendasi
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Metode Perhitungan</label>
            <div className="inline-flex border border-slate-300 rounded-md overflow-hidden">
              <button
                onClick={() => setMetode('aljabar')}
                className={`px-4 py-2 text-sm font-semibold transition-all ${
                  metode === 'aljabar'
                    ? 'bg-[#0c3a66]/10 text-[#0c3a66] border-r border-[#0c3a66]'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-r border-slate-300'
                }`}
              >
                Rata-rata Aljabar
              </button>
              <button
                onClick={() => setMetode('thiessen')}
                className={`px-4 py-2 text-sm font-semibold transition-all ${
                  metode === 'thiessen'
                    ? 'bg-[#0c3a66]/10 text-[#0c3a66] border-r border-[#0c3a66]'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-r border-slate-300'
                }`}
              >
                Poligon Thiessen
              </button>
              <button
                onClick={() => setMetode('isohyet')}
                className={`px-4 py-2 text-sm font-semibold transition-all ${
                  metode === 'isohyet'
                    ? 'bg-[#0c3a66]/10 text-[#0c3a66]'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Garis Isohyet
              </button>
            </div>
          </div>

          {metode === 'thiessen' && (
            <>
              {stasiunList.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-800">Belum ada stasiun hujan. Tambahkan stasiun terlebih dahulu.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 border-b border-slate-300">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Stasiun</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Luas Pengaruh (km²)</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Bobot (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {configsWithBobot.map((config) => (
                          <tr key={config.stasiunId} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-900 tabular-nums tracking-tight">{config.namaStasiun}</td>
                            <td className="px-3 py-2 tabular-nums tracking-tight">
                              <input
                                type="number"
                                value={config.luasPengaruh === 0 ? 0 : (config.luasPengaruh ?? '')}
                                onChange={(e) => handleLuasChange(config.stasiunId, e.target.value)}
                                className="w-full py-1 px-2 text-sm text-right border border-slate-300 rounded-md focus:ring-1 focus:ring-[#0c3a66] focus:border-[#0c3a66] tabular-nums"
                                placeholder="0.00"
                                step="0.01"
                              />
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums tracking-tight">
                              <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 rounded font-semibold text-xs tabular-nums">
                                {config.bobot.toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 font-medium">Total Luas Pengaruh:</span>
                      <span className="text-lg font-bold text-slate-900 tabular-nums">{totalLuasPengaruh.toFixed(2)} km²</span>
                    </div>
                    {morfometriDAS && (
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                        <span className="text-sm text-slate-600 font-medium">Luas DAS:</span>
                        <span className="text-sm font-semibold text-slate-700 tabular-nums">{morfometriDAS.luasDAS.toFixed(2)} km²</span>
                      </div>
                    )}
                  </div>

                  {hasError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900">Peringatan: Selisih Luas Pengaruh</p>
                        <p className="text-xs text-red-700 mt-1">
                          Total luas pengaruh ({totalLuasPengaruh.toFixed(2)} km²) harus sama dengan Luas DAS ({morfometriDAS?.luasDAS.toFixed(2)} km²).
                          Selisih: <strong>{bobotError.toFixed(2)} km²</strong>
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {metode === 'isohyet' && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700 font-formal">Data Luas Antar Garis Isohyet</h4>
                <Button 
                  onClick={() => setIsohyetalConfigs([...isohyetalConfigs, { id: crypto.randomUUID(), label: `Area ${isohyetalConfigs.length + 1}`, curahHujanRataRata: 0, luasAntarGaris: 0, bobot: 0 }])}
                  variant="outline"
                  className="px-3 py-1 text-xs border-[#0c3a66] text-[#0c3a66]"
                >
                  + Tambah Area
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Label Area</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-700">Rerata Hujan (mm)</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-700">Luas (km²)</th>
                      <th className="px-3 py-2 text-center text-slate-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isohyetalConfigs.map((config, idx) => (
                      <tr key={config.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-2 py-2">
                          <input 
                            value={config.label} 
                            onChange={(e) => {
                              const newConfigs = [...isohyetalConfigs];
                              newConfigs[idx].label = e.target.value;
                              setIsohyetalConfigs(newConfigs);
                              setIsSaved(false);
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-[#0c3a66]"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input 
                            type="number"
                            value={config.curahHujanRataRata === 0 ? '' : config.curahHujanRataRata}
                            onChange={(e) => {
                              const newConfigs = [...isohyetalConfigs];
                              newConfigs[idx].curahHujanRataRata = e.target.value as any;
                              setIsohyetalConfigs(newConfigs);
                              setIsSaved(false);
                            }}
                            className="w-full px-2 py-1 text-xs text-right border border-slate-200 rounded focus:ring-1 focus:ring-[#0c3a66]"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input 
                            type="number"
                            value={config.luasAntarGaris === 0 ? '' : config.luasAntarGaris}
                            onChange={(e) => {
                              const newConfigs = [...isohyetalConfigs];
                              newConfigs[idx].luasAntarGaris = e.target.value as any;
                              setIsohyetalConfigs(newConfigs);
                              setIsSaved(false);
                            }}
                            className="w-full px-2 py-1 text-xs text-right border border-slate-200 rounded focus:ring-1 focus:ring-[#0c3a66]"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button 
                            onClick={() => {
                              setIsohyetalConfigs(isohyetalConfigs.filter((_, i) => i !== idx));
                              setIsSaved(false);
                            }}
                            className="text-red-500 hover:text-red-700 font-bold p-1"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                    {isohyetalConfigs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-slate-500 italic text-xs">
                          Belum ada data area isohyet. Tambahkan data area melalui peta atau input manual.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {metode === 'aljabar' && (
            <div className="mb-4 p-3 bg-blue-50 border-l-4 border-[#0c3a66] rounded-md">
              <p className="text-sm text-slate-700 leading-relaxed">
                <strong className="text-[#0c3a66]">Rata-rata Aljabar:</strong> Semua stasiun memiliki bobot yang sama. 
                Hujan wilayah dihitung dengan rata-rata aritmatik dari semua stasiun pengamatan yang tersedia.
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={hasError}
            className={`w-full px-4 py-2.5 font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
              hasError
                ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500'
                : isSaved
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                : 'bg-[#0c3a66] hover:bg-[#0d4578] text-white shadow-sm'
            }`}
          >
            {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {hasError ? 'Perbaiki Selisih Luas Terlebih Dahulu' : isSaved ? 'Tersimpan ✓' : 'Simpan Konfigurasi'}
          </button>
        </div>
      </Card>
    </div>
  );
};
