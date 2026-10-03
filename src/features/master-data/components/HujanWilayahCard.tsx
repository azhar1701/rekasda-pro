import React, { useState, useEffect, useMemo } from 'react';
import {
  CloudRain,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { AssistantContainer } from '@/components/ui/govtech';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useHydrologyStore, type CurahHujanWilayah, type ThiessenStasiunConfig, type IsohyetConfig, type DataHujan } from '@/stores/useHydrologyStore';
import { calculateIsohyet } from '@/lib/utils/hydrology/arealRainfall';
import { calculateArealSeries, extractAnnualMaximums } from '@/utils/rainfallSeriesUtils';
import { determineRainfallMethod, inferParamsFromSpatial, MethodParams, RecommendationResult } from '@/utils/rainfallMethodSelector';
import { toast } from '@/hooks/useToast';
import { HelpTooltip } from '@/components/ui/govtech';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { SuccessCelebration } from '@/components/ui/feedback/SuccessCelebration';

export const HujanWilayahCard: React.FC = () => {
  const {
    curahHujanWilayah, setCurahHujanWilayah, stasiunList, morfometriDAS,
    fetchMultipleStationsData, setArealRainfallData, setActiveRainfallSource
  } = useHydrologyStore();

  const [metode, setMetode] = useState<'aljabar' | 'thiessen' | 'isohyet'>(curahHujanWilayah?.metode || 'aljabar');
  const [configs, setConfigs] = useState<ThiessenStasiunConfig[]>(
    curahHujanWilayah?.stasiunConfigs || []
  );
  const [isohyetalConfigs, setIsohyetalConfigs] = useState<IsohyetConfig[]>(
    curahHujanWilayah?.isohyetConfigs || []
  );
  const [isSaved, setIsSaved] = useState(false);

  const [params, setParams] = useState<MethodParams>(() =>
    inferParamsFromSpatial(morfometriDAS, stasiunList)
  );

  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { completeStep } = useOnboarding();

  useEffect(() => {
    if (curahHujanWilayah) {
      setMetode(curahHujanWilayah.metode);
      setConfigs(curahHujanWilayah.stasiunConfigs);
      setIsohyetalConfigs(curahHujanWilayah.isohyetConfigs || []);
      setIsSaved(true);
    } else {
      setMetode('aljabar');
      setConfigs([]);
      setIsohyetalConfigs([]);
      setIsSaved(false);
    }
  }, [curahHujanWilayah]);

  // Sinkronisasi parameter evaluasi ketika stasiunList atau morfometriDAS terisi/berubah
  useEffect(() => {
    const inferred = inferParamsFromSpatial(morfometriDAS, stasiunList);
    setParams(prev => ({
      ...prev,
      ...inferred,
    }));

    if (stasiunList.length > 0) {
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
      setConfigs([]);
    }
  }, [stasiunList, morfometriDAS]);

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

  const dasLuasNum = morfometriDAS?.luasDAS || 0;
  const maxTol = Math.max(0.05, 0.005 * dasLuasNum);
  const hasError = metode === 'thiessen' && bobotError > maxTol && morfometriDAS !== null;

  const handleLuasChange = (stasiunId: string, value: string) => {
    setConfigs(configs.map(c =>
      c.stasiunId === stasiunId ? { ...c, luasPengaruh: value as unknown as number } : c
    ));
    setIsSaved(false);
  };

  const handleSave = async () => {
    const safeConfigs = configsWithBobot.map(c => ({
      ...c,
      luasPengaruh: typeof c.luasPengaruh === 'string' ? parseFloat(c.luasPengaruh) || 0 : c.luasPengaruh
    }));

    const safeIsohyet = isohyetalConfigs.map(c => ({
      ...c,
      luasAntarGaris: typeof c.luasAntarGaris === 'string' ? parseFloat(c.luasAntarGaris) || 0 : c.luasAntarGaris,
      curahHujanRataRata: typeof c.curahHujanRataRata === 'string' ? parseFloat(c.curahHujanRataRata) || 0 : c.curahHujanRataRata
    }));

    try {
      let avgValue = 0;
      let amsArray: number[] = [];

      if (metode === 'thiessen' && safeConfigs.length > 0) {
        const stasiunIds = safeConfigs.map(c => c.stasiunId);
        await fetchMultipleStationsData(stasiunIds);
        const currentData = useHydrologyStore.getState().dataHujan.filter(d => stasiunIds.includes(d.stasiun_id));

        // Buat map pembobotan Thiessen
        const weightsMap: Record<string, number> = {};
        safeConfigs.forEach(cfg => {
          weightsMap[cfg.stasiunId] = totalLuasPengaruh > 0 ? (cfg.luasPengaruh / totalLuasPengaruh) : (1 / safeConfigs.length);
        });

        // Hitung deret waktu harian lengkap (365 hari/tahun) untuk DAS
        const dailyAreal = calculateArealSeries(currentData, weightsMap);
        dailyAreal.forEach(d => {
          d.stasiun_id = 'thiessen';
          d.id = `thiessen-${d.tanggal}`;
        });

        // Ekstrak Annual Maximum Series (AMS) dari deret harian DAS komposit
        const amsPoints = extractAnnualMaximums(dailyAreal);
        amsArray = amsPoints.map(p => p.value);
        avgValue = amsArray.length > 0 ? amsArray.reduce((a, b) => a + b, 0) / amsArray.length : 0;

        setArealRainfallData('thiessen', dailyAreal);
        setActiveRainfallSource('thiessen');
        toast.success(`Hujan Kawasan Thiessen (${dailyAreal.length} hari data, ${amsArray.length} thn AMS) berhasil dihitung.`);

      } else if (metode === 'isohyet' && safeIsohyet.length > 0) {
        // Kalkulasi murni P = Σ(Ai * Rata2_i) / ΣAi
        const isohyetInput = safeIsohyet.map(s => ({
          averageRainfall: s.curahHujanRataRata,
          area: s.luasAntarGaris
        }));

        avgValue = calculateIsohyet(isohyetInput);

        // Map existing annualMax if available to DataHujan format
        const arealResults: DataHujan[] = [];
        const amsBase = safeIsohyet[0]?.annualMax || [];

        const storeData = useHydrologyStore.getState().dataHujan;
        const storeYears = Array.from(new Set(storeData.map(d => new Date(d.tanggal).getFullYear()))).sort((a, b) => a - b);

        amsBase.forEach((val, idx) => {
          const year = storeYears[idx] ?? (storeYears.length > 0 ? storeYears[storeYears.length - 1] + idx + 1 : new Date().getFullYear() - amsBase.length + idx + 1);
          arealResults.push({
            id: `isohyet-${year}`,
            stasiun_id: 'isohyet',
            tanggal: `${year}-12-31`,
            curah_hujan: val
          });
        });

        amsArray = amsBase.length > 0 ? amsBase : [avgValue];

        setArealRainfallData('isohyet', arealResults.length > 0 ? arealResults : null);
        setActiveRainfallSource('isohyet');
        toast.success(`Hujan Kawasan Isohyet berhasil dihitung (Rata-rata: ${avgValue.toFixed(2)} mm).`);

      } else if (metode === 'aljabar') {
        const stasiunIds = stasiunList.map(s => s.id);
        if (stasiunIds.length > 0) {
          await fetchMultipleStationsData(stasiunIds);
          const currentData = useHydrologyStore.getState().dataHujan.filter(d => stasiunIds.includes(d.stasiun_id));

          // Bobot sama rata untuk metode rata-rata aljabar
          const weightsMap: Record<string, number> = {};
          stasiunIds.forEach(id => {
            weightsMap[id] = 1 / stasiunIds.length;
          });

          const dailyAreal = calculateArealSeries(currentData, weightsMap);
          dailyAreal.forEach(d => {
            d.stasiun_id = 'aljabar';
            d.id = `aljabar-${d.tanggal}`;
          });

          const amsPoints = extractAnnualMaximums(dailyAreal);
          amsArray = amsPoints.map(p => p.value);
          avgValue = amsArray.length > 0 ? amsArray.reduce((a, b) => a + b, 0) / amsArray.length : 0;

          setArealRainfallData('aljabar', dailyAreal);
          setActiveRainfallSource('aljabar');
          toast.success(`Hujan Kawasan Aljabar (${dailyAreal.length} hari data, ${amsArray.length} thn AMS) berhasil dihitung.`);
        }
      }

      const data: CurahHujanWilayah = {
        metode,
        stasiunConfigs: safeConfigs,
        isohyetConfigs: safeIsohyet,
        hujanRataRata: avgValue,
        hujanRataRataAMS: amsArray
      };
      await setCurahHujanWilayah(data);
      setConfigs(safeConfigs);
      setIsohyetalConfigs(safeIsohyet);
      setIsSaved(true);
      setShowCelebration(true);
      completeStep('hujan');
    } catch (err: any) {
      toast.error('Gagal menyimpan konfigurasi: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {showCelebration && (
        <SuccessCelebration
          message="Data Hujan Wilayah berhasil dihitung dan disinkronkan!"
          onComplete={() => setShowCelebration(false)}
        />
      )}
      <Card className="border border-slate-300 shadow-sm rounded-md overflow-hidden border-l-4 border-l-primary-600">
        <div className="border-b border-slate-200 bg-primary-50/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100/60 rounded-md">
              <CloudRain className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Curah Hujan Wilayah</h3>
              <p className="text-xs text-slate-600 font-medium">Metode rata-rata spasial</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <AssistantContainer title="Rekomendasi Metode Berbasis Lokasi (AI Assistant)">
            {morfometriDAS && (morfometriDAS.luasDAS > 0 || morfometriDAS.elevasi > 0) && (
              <div className="mb-4 p-2.5 bg-blue-50/80 border border-blue-200 rounded-md flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-pupr-blue uppercase tracking-tight">Parameter Spasial Terdeteksi:</span>
                  <span>Luas DAS: <strong>{morfometriDAS.luasDAS ? `${morfometriDAS.luasDAS.toLocaleString('id-ID')} km²` : '-'}</strong></span>
                  <span>•</span>
                  <span>Kemiringan: <strong>{morfometriDAS.kemiringanSungai ?? 0}%</strong></span>
                  <span>•</span>
                  <span>Elevasi: <strong>{morfometriDAS.elevasi ? `${morfometriDAS.elevasi} mdpl` : '-'}</strong></span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
                  SNI 2415:2016
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Ketersediaan Koordinat</label>
                <div className="flex gap-3 mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      checked={params.hasCoordinates}
                      onChange={() => setParams({ ...params, hasCoordinates: true })}
                      className="w-3.5 h-3.5 text-pupr-blue"
                    />
                    <span className="text-slate-700">Tersedia</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      checked={!params.hasCoordinates}
                      onChange={() => setParams({ ...params, hasCoordinates: false })}
                      className="w-3.5 h-3.5 text-pupr-blue"
                    />
                    <span className="text-slate-700">Tidak Ada</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Kondisi Topografi</label>
                <div className="flex gap-3 mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      checked={params.topography === 'flat'}
                      onChange={() => setParams({ ...params, topography: 'flat' })}
                      className="w-3.5 h-3.5 text-pupr-blue"
                    />
                    <span className="text-slate-700">Relatif Datar</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      checked={params.topography === 'varied'}
                      onChange={() => setParams({ ...params, topography: 'varied' })}
                      className="w-3.5 h-3.5 text-pupr-blue"
                    />
                    <span className="text-slate-700">Pegunungan / Bervariasi</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Distribusi Hujan</label>
                <div className="flex gap-3 mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      checked={params.distribution === 'uneven'}
                      onChange={() => setParams({ ...params, distribution: 'uneven' })}
                      className="w-3.5 h-3.5 text-pupr-blue"
                    />
                    <span className="text-slate-700">Heterogen / Bervariasi</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      checked={params.distribution === 'uniform'}
                      onChange={() => setParams({ ...params, distribution: 'uniform' })}
                      className="w-3.5 h-3.5 text-pupr-blue"
                    />
                    <span className="text-slate-700">Homogen</span>
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
                    className="w-16 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-pupr-blue tabular-nums"
                  />
                  <span className="text-[11px] text-slate-500 italic">(Terdeteksi: {stasiunList.length})</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-md mt-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hasil Analisis & Rekomendasi</h4>
                {recommendation?.sourceStandard && (
                  <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                    {recommendation.sourceStandard}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-pupr-blue mt-1">{recommendation?.method}</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{recommendation?.reason}</p>

              <button
                onClick={() => {
                  if (recommendation) {
                    let methodValue: 'aljabar' | 'thiessen' | 'isohyet' = 'aljabar';
                    if (recommendation.method === 'Metode Poligon Thiessen') methodValue = 'thiessen';
                    if (recommendation.method === 'Metode Isohyet') methodValue = 'isohyet';
                    setMetode(methodValue);

                    // Auto-inisialisasi proporsional awal Thiessen jika luasPengaruh masih 0 semua dan luasDAS ada
                    if (methodValue === 'thiessen' && configs.length > 0 && totalLuasPengaruh === 0 && morfometriDAS?.luasDAS) {
                      const equalArea = parseFloat((morfometriDAS.luasDAS / configs.length).toFixed(2));
                      setConfigs(configs.map(c => ({
                        ...c,
                        luasPengaruh: equalArea,
                        bobot: 100 / configs.length,
                      })));
                    }

                    toast.success(`${recommendation.method} diterapkan`);
                    setIsSaved(false);
                  }
                }}
                className="mt-3 px-3 py-1.5 bg-pupr-blue text-white text-xs font-bold rounded hover:bg-[#092b4d] transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Gunakan Rekomendasi
              </button>
            </div>
          </AssistantContainer>

          <div className="mb-4">
            <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
              Metode Perhitungan
              <HelpTooltip content="Pilih metode rata-rata spasial yang paling sesuai dengan densitas stasiun dan topografi DAS Anda." />
            </label>
            <div className="inline-flex border border-slate-300 rounded-md overflow-hidden">
              <button
                onClick={() => setMetode('aljabar')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all ${metode === 'aljabar'
                  ? 'bg-pupr-blue/10 text-pupr-blue border-r border-pupr-blue'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-r border-slate-300'
                  }`}
              >
                Rata-rata Aljabar
                <HelpTooltip content="Metode paling sederhana, disarankan jika topografi datar dan stasiun tersebar merata." />
              </button>
              <button
                onClick={() => setMetode('thiessen')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all ${metode === 'thiessen'
                  ? 'bg-pupr-blue/10 text-pupr-blue border-r border-pupr-blue'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-r border-slate-300'
                  }`}
              >
                Poligon Thiessen
                <HelpTooltip content="Membagi bobot berdasarkan luas pengaruh area. Membutuhkan koordinat stasiun." />
              </button>
              <button
                onClick={() => setMetode('isohyet')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all ${metode === 'isohyet'
                  ? 'bg-pupr-blue/10 text-pupr-blue'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
              >
                Garis Isohyet
                <HelpTooltip content="Metode paling akurat untuk daerah pegunungan, menggunakan kontur hujan." />
              </button>
            </div>
          </div>

          {
            metode === 'thiessen' && (
              <>
                {stasiunList.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <p className="text-sm text-amber-800">Belum ada stasiun hujan. Tambahkan stasiun terlebih dahulu.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto mb-4 border border-slate-200 rounded-md">
                      <table className="w-full text-sm">
                        <thead className="bg-pupr-blue/[0.02] border-b border-slate-200">
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
                                  className="w-full h-9 px-2 text-sm text-right border border-slate-300 rounded-md focus:ring-1 focus:ring-pupr-blue focus:border-pupr-blue tabular-nums"
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
            )
          }

          {
            metode === 'isohyet' && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-700 ">Data Luas Antar Garis Isohyet</h4>
                  <Button
                    onClick={() => setIsohyetalConfigs([...isohyetalConfigs, { id: crypto.randomUUID(), label: `Area ${isohyetalConfigs.length + 1}`, curahHujanRataRata: 0, luasAntarGaris: 0, bobot: 0 }])}
                    variant="outline"
                    className="px-3 py-1 text-xs border-pupr-blue text-pupr-blue"
                  >
                    + Tambah Area
                  </Button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-md">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-pupr-blue/[0.02] border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Label Area</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-700">AMS Hujan (mm)</th>
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
                              className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-pupr-blue"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <textarea
                              value={config.annualMax ? config.annualMax.join(', ') : config.curahHujanRataRata}
                              onChange={(e) => {
                                const val = e.target.value;
                                const nums = val.split(/[, \n]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                                const newConfigs = [...isohyetalConfigs];
                                newConfigs[idx].annualMax = nums;
                                if (nums.length > 0) newConfigs[idx].curahHujanRataRata = nums[0];
                                setIsohyetalConfigs(newConfigs);
                                setIsSaved(false);
                              }}
                              rows={1}
                              className="w-full px-2 py-1 text-xs text-right border border-slate-200 rounded focus:ring-1 focus:ring-pupr-blue font-mono"
                              placeholder="60, 70, 80..."
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
                              className="w-full h-8 px-2 text-xs text-right border border-slate-200 rounded focus:ring-1 focus:ring-pupr-blue"
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
            )
          }

          {
            metode === 'aljabar' && (
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-pupr-blue rounded-md">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong className="text-pupr-blue">Rata-rata Aljabar:</strong> Semua stasiun memiliki bobot yang sama.
                  Hujan wilayah dihitung dengan rata-rata aritmatik dari semua stasiun pengamatan yang tersedia.
                </p>
              </div>
            )
          }

          <button
            onClick={handleSave}
            disabled={hasError}
            className={`w-full px-4 py-2.5 font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${hasError
              ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500'
              : isSaved
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                : 'bg-pupr-blue hover:bg-pupr-blue/90 text-white shadow-sm'
              }`}
          >
            {isSaved ? <CheckCircle className="w-4 h-4 animate-in fade-in scale-in-90 duration-300" /> : <Save className="w-4 h-4" />}
            {hasError ? 'Perbaiki Selisih Luas Terlebih Dahulu' : isSaved ? 'Tersimpan ✓' : 'Simpan Konfigurasi'}
          </button>
        </div >
      </Card >
    </div >
  );
};
