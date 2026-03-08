import { CheckCircle2, XCircle, Edit2, MapPin, Droplets, BarChart3, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';
import { useMemo } from 'react';

interface MasterDataDashboardProps {
  onNavigateToSection?: (section: 'qc' | 'morfometri' | 'tutupan' | 'hujan') => void;
}

export function MasterDataDashboard({ onNavigateToSection }: MasterDataDashboardProps) {
  const {
    qcResults: storeQCResults,
    morfometriDAS: storeMorfometri,
    tutupanLahan: storeTutupan,
    curahHujanWilayah: storeHujan,
    dataHujan: storeDataHujan,
  } = useHydrologyStore();

  const qcResults = storeQCResults;
  const morfometriDAS = storeMorfometri;
  const tutupanLahan = storeTutupan;
  const curahHujanWilayah = storeHujan;
  const dataHujan = storeDataHujan;

  // Memoized computations
  const yearRange = useMemo(() => {
    if (!dataHujan || dataHujan.length === 0) return null;
    const years = dataHujan.map(d => new Date(d.tanggal).getFullYear());
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    return `${minYear} - ${maxYear}`;
  }, [dataHujan]);

  const rainfallChartData = useMemo(() => {
    // Priority 1: Use actual historical annual average rainfall from Thiessen result
    const thiessenResults = useHydrologyStore.getState().hasilThiessen;
    if (thiessenResults?.hujanRataRataDAS && thiessenResults.hujanRataRataDAS.length > 0) {
      return thiessenResults.hujanRataRataDAS.map((val, idx) => ({
        tahun: `Data ${idx + 1}`,
        hujan: Number(val.toFixed(2)),
      }));
    }

    // Priority 2: Fallback to weights if no historical data processed yet
    if (!curahHujanWilayah?.stasiunConfigs) return [];
    return curahHujanWilayah.stasiunConfigs
      .map((item, idx) => ({
        tahun: item.namaStasiun || `Stasiun ${idx + 1}`,
        hujan: Number(item.bobot.toFixed(2)),
        isWeight: true
      }));
  }, [curahHujanWilayah]);


  const landCoverStats = useMemo(() => {
    if (!tutupanLahan?.items || tutupanLahan.items.length === 0) return null;

    const totalArea = tutupanLahan.items.reduce((sum, item) => sum + (item.luas || 0), 0);
    if (totalArea === 0) return null;

    const bars = tutupanLahan.items
      .map(item => ({
        name: item.jenis || 'Unknown',
        luas: item.luas || 0,
        percentage: ((item.luas || 0) / totalArea) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    return { totalArea, bars };
  }, [tutupanLahan]);

  const qcStatus = useMemo(() => {
    if (!qcResults) return null;

    // qcResults is now Record<string, QualityControlResults>
    const entries = Object.values(qcResults);
    if (entries.length === 0) return null;

    // Aggregate across all stations
    const rapsValid = entries.every(r => r.konsistensi?.isPassed ?? false);
    const grubbsValid = entries.every(r => r.outlier?.isPassed ?? false);
    const homogeneityValid = entries.every(r => r.homogenitas?.isPassed ?? false);

    return {
      rapsValid,
      grubbsValid,
      homogeneityValid,
      allValid: rapsValid && grubbsValid && homogeneityValid,
    };
  }, [qcResults]);

  const metodeName = useMemo(() => {
    if (!curahHujanWilayah?.metode) return 'Belum dipilih';
    const stationCount = curahHujanWilayah.stasiunConfigs?.length || 0;
    const method = curahHujanWilayah.metode === 'thiessen' ? 'Poligon Thiessen' : 'Rata-rata Aljabar';
    return stationCount > 0 ? `${method} (${stationCount} Stasiun)` : method;
  }, [curahHujanWilayah]);

  return (
    <div className="space-y-4 p-6">
      <ProjectContextBanner />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: QC Status */}
        <div className="bg-white border border-slate-300 shadow-sm rounded-md overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-pupr-blue" />
              <h3 className="font-semibold text-slate-800 text-sm">Status Kualitas Data</h3>
            </div>
            <button
              onClick={() => onNavigateToSection?.('qc')}
              className="text-slate-400 hover:text-pupr-blue transition-colors"
              aria-label="Edit Quality Control"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4">
            {qcStatus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Konsistensi RAPS</span>
                  {qcStatus.rapsValid ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md">
                      <XCircle className="w-3 h-3" /> Tidak Valid
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Outlier Grubbs</span>
                  {qcStatus.grubbsValid ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md">
                      <XCircle className="w-3 h-3" /> Outlier Terdeteksi
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Homogenitas</span>
                  {qcStatus.homogeneityValid ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md">
                      <XCircle className="w-3 h-3" /> Tidak Valid
                    </span>
                  )}
                </div>

                {yearRange && (
                  <div className="pt-3 border-t border-gray-100">
                    <span className="text-xs text-slate-500 tabular-nums font-medium">Rentang Data: {yearRange}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <AlertTriangle className="w-8 h-8 mb-2 text-pupr-blue/50" />
                <p className="text-sm">Belum ada hasil QC</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Morfometri DAS */}
        <div className="bg-white border border-slate-300 shadow-sm rounded-md overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-pupr-blue" />
              <h3 className="font-semibold text-slate-800 text-sm">Morfometri DAS</h3>
            </div>
            <button
              onClick={() => onNavigateToSection?.('morfometri')}
              className="text-slate-400 hover:text-pupr-blue transition-colors"
              aria-label="Edit Morfometri"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4">
            {morfometriDAS?.luasDAS ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium">Luas DAS</p>
                  <p className="text-3xl font-bold text-slate-800 tabular-nums">
                    {morfometriDAS.luasDAS.toFixed(2)}
                    <span className="text-sm font-normal text-slate-500 ml-2">km²</span>
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium">Panjang Sungai</p>
                  <p className="text-2xl font-bold text-slate-800 tabular-nums">
                    {(morfometriDAS.panjangSungai || 0).toFixed(2)}
                    <span className="text-sm font-normal text-slate-500 ml-2">km</span>
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium">Kemiringan Dasar Sungai</p>
                  <p className="text-2xl font-bold text-slate-800 tabular-nums">
                    {(morfometriDAS.kemiringanSungai || 0).toFixed(4)}
                    <span className="text-sm font-normal text-slate-500 ml-2">m/m</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <AlertTriangle className="w-8 h-8 mb-2 text-pupr-blue/50" />
                <p className="text-sm">Belum ada data morfometri</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Koefisien Limpasan */}
        <div className="bg-white border border-slate-300 shadow-sm rounded-md overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-pupr-blue" />
              <h3 className="font-semibold text-slate-800 text-sm">Koefisien Limpasan</h3>
            </div>
            <button
              onClick={() => onNavigateToSection?.('tutupan')}
              className="text-slate-400 hover:text-pupr-blue transition-colors"
              aria-label="Edit Tutupan Lahan"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4">
            {tutupanLahan?.koefisienPengaliranGabungan != null ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium">C Gabungan (Rasional)</p>
                  <p className="text-3xl font-bold text-pupr-blue tabular-nums">
                    {tutupanLahan.koefisienPengaliranGabungan.toFixed(3)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium">CN Komposit (SCS)</p>
                  <p className="text-3xl font-bold text-green-600 tabular-nums">
                    {(tutupanLahan.curveNumberGabungan || 0).toFixed(1)}
                  </p>
                </div>

                {landCoverStats && (
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <p className="text-xs text-slate-600 mb-2 font-semibold">Proporsi Tutupan Lahan</p>
                    {landCoverStats.bars.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs text-slate-700 mb-1">
                          <span className="truncate font-medium">{item.name}</span>
                          <span className="ml-2 tabular-nums font-semibold">{item.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded h-2">
                          <div
                            className="bg-pupr-blue h-2 rounded transition-all"
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <AlertTriangle className="w-8 h-8 mb-2 text-pupr-blue/50" />
                <p className="text-sm">Belum ada data tutupan lahan</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Curah Hujan Wilayah (Full Width) */}
        <div className="md:col-span-3 bg-white border border-slate-300 shadow-sm rounded-md overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-pupr-blue" />
              <h3 className="font-semibold text-slate-800 text-sm">Rekap Curah Hujan Wilayah</h3>
            </div>
            <button
              onClick={() => onNavigateToSection?.('hujan')}
              className="text-slate-400 hover:text-pupr-blue transition-colors"
              aria-label="Edit Curah Hujan Wilayah"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4">
            <div className="flex flex-wrap gap-4 mb-4">
              <p className="text-sm text-slate-700">
                Metode Terpilih: <span className="font-semibold text-pupr-blue">{metodeName}</span>
              </p>
              {curahHujanWilayah?.hujanRataRata && (
                <p className="text-sm text-slate-700">
                  Rerata DAS: <span className="font-bold text-teal-600">{curahHujanWilayah.hujanRataRata.toFixed(2)} mm</span>
                </p>
              )}
            </div>


            {rainfallChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={rainfallChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis
                    dataKey="tahun"
                    tick={{ fontSize: 12, fill: '#475569' }}
                    stroke="#94a3b8"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#475569' }}
                    stroke="#94a3b8"
                    label={{
                      value: 'Hujan (mm)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12, fill: '#475569' }
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px'
                    }}
                    labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                    formatter={(value: number, _name: any, props: any) => [
                      `${value.toFixed(2)} ${props.payload.isWeight ? '(% Bobot)' : 'mm'}`,
                      props.payload.isWeight ? 'Bobot Kontribusi' : 'Hujan Wilayah'
                    ]}
                  />

                  <Bar dataKey="hujan" fill="#0c3a66" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <AlertTriangle className="w-12 h-12 mb-3 text-pupr-blue/50" />
                <p className="text-sm font-medium">Belum ada data curah hujan wilayah</p>
                <p className="text-xs mt-1">Silakan lengkapi data di tab Curah Hujan Wilayah</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
