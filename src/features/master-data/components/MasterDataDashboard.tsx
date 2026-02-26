import { CheckCircle2, XCircle, Edit2, MapPin, Droplets, BarChart3, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useMemo, useState } from 'react';
import { mockQCResults, mockMorfometriDAS, mockTutupanLahan, mockCurahHujanWilayah, mockDataHujan } from '../data/mockData';

interface MasterDataDashboardProps {
  onNavigateToSection?: (section: 'qc' | 'morfometri' | 'tutupan' | 'hujan') => void;
}

export function MasterDataDashboard({ onNavigateToSection }: MasterDataDashboardProps) {
  const [demoMode, setDemoMode] = useState(false);
  
  const {
    qcResults: storeQCResults,
    morfometriDAS: storeMorfometri,
    tutupanLahan: storeTutupan,
    curahHujanWilayah: storeHujan,
    dataHujan: storeDataHujan,
  } = useHydrologyStore();

  const qcResults = demoMode ? mockQCResults : storeQCResults;
  const morfometriDAS = demoMode ? mockMorfometriDAS : storeMorfometri;
  const tutupanLahan = demoMode ? mockTutupanLahan : storeTutupan;
  const curahHujanWilayah = demoMode ? mockCurahHujanWilayah : storeHujan;
  const dataHujan = demoMode ? mockDataHujan : storeDataHujan;

  // Memoized computations
  const yearRange = useMemo(() => {
    if (!dataHujan || dataHujan.length === 0) return null;
    const years = dataHujan.map(d => new Date(d.tanggal).getFullYear());
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    return `${minYear} - ${maxYear}`;
  }, [dataHujan]);

  const rainfallChartData = useMemo(() => {
    if (!curahHujanWilayah?.stasiunConfigs) return [];
    return curahHujanWilayah.stasiunConfigs
      .map((item, idx) => ({
        tahun: item.namaStasiun || `Stasiun ${idx + 1}`,
        hujan: Number(item.bobot.toFixed(2)),
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
      {/* Demo Mode Toggle */}
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            {demoMode ? <Eye className="w-5 h-5 text-indigo-600" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Mode Demo</h3>
            <p className="text-xs text-gray-600">Tampilkan contoh data untuk preview dashboard</p>
          </div>
        </div>
        <button
          onClick={() => setDemoMode(!demoMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            demoMode ? 'bg-indigo-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              demoMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: QC Status */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm rounded-2xl p-5 relative">
        <button
          onClick={() => onNavigateToSection?.('qc')}
          className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 transition-colors"
          aria-label="Edit Quality Control"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Status Kualitas Data</h3>
        </div>

        {qcStatus ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Konsistensi RAPS</span>
              {qcStatus.rapsValid ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  <XCircle className="w-3 h-3" /> Tidak Valid
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Outlier Grubbs</span>
              {qcStatus.grubbsValid ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  <XCircle className="w-3 h-3" /> Outlier Terdeteksi
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Homogenitas</span>
              {qcStatus.homogeneityValid ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  <XCircle className="w-3 h-3" /> Tidak Valid
                </span>
              )}
            </div>

            {yearRange && (
              <div className="pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Rentang Data: {yearRange}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <AlertTriangle className="w-8 h-8 mb-2" />
            <p className="text-sm">Belum ada hasil QC</p>
          </div>
        )}
      </div>

      {/* Card 2: Morfometri DAS */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm rounded-2xl p-5 relative">
        <button
          onClick={() => onNavigateToSection?.('morfometri')}
          className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 transition-colors"
          aria-label="Edit Morfometri"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Morfometri DAS</h3>
        </div>

        {morfometriDAS?.luasDAS ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Luas DAS</p>
              <p className="text-3xl font-bold text-gray-800">
                {morfometriDAS.luasDAS.toFixed(2)}
                <span className="text-sm font-normal text-gray-500 ml-2">km²</span>
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Panjang Sungai</p>
              <p className="text-2xl font-bold text-gray-800">
                {(morfometriDAS.panjangSungai || 0).toFixed(2)}
                <span className="text-sm font-normal text-gray-500 ml-2">km</span>
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Kemiringan Dasar Sungai</p>
              <p className="text-2xl font-bold text-gray-800">
                {(morfometriDAS.kemiringanSungai || 0).toFixed(4)}
                <span className="text-sm font-normal text-gray-500 ml-2">m/m</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <AlertTriangle className="w-8 h-8 mb-2" />
            <p className="text-sm">Belum ada data morfometri</p>
          </div>
        )}
      </div>

      {/* Card 3: Koefisien Limpasan */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm rounded-2xl p-5 relative">
        <button
          onClick={() => onNavigateToSection?.('tutupan')}
          className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 transition-colors"
          aria-label="Edit Tutupan Lahan"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Koefisien Limpasan</h3>
        </div>

        {tutupanLahan?.koefisienPengaliranGabungan != null ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">C Gabungan (Rasional)</p>
              <p className="text-3xl font-bold text-blue-600">
                {tutupanLahan.koefisienPengaliranGabungan.toFixed(3)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">CN Komposit (SCS)</p>
              <p className="text-3xl font-bold text-green-600">
                {(tutupanLahan.curveNumberGabungan || 0).toFixed(1)}
              </p>
            </div>

            {landCoverStats && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <p className="text-xs text-gray-500 mb-2">Proporsi Tutupan Lahan</p>
                {landCoverStats.bars.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="truncate">{item.name}</span>
                      <span className="ml-2">{item.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <AlertTriangle className="w-8 h-8 mb-2" />
            <p className="text-sm">Belum ada data tutupan lahan</p>
          </div>
        )}
      </div>

      {/* Card 4: Curah Hujan Wilayah (Full Width) */}
      <div className="md:col-span-3 bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm rounded-2xl p-5 relative">
        <button
          onClick={() => onNavigateToSection?.('hujan')}
          className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 transition-colors"
          aria-label="Edit Curah Hujan Wilayah"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Rekap Curah Hujan Wilayah</h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Metode Terpilih: <span className="font-medium text-blue-600">{metodeName}</span>
        </p>

        {rainfallChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={rainfallChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="tahun" 
                tick={{ fontSize: 12 }} 
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                stroke="#6b7280" 
                label={{ 
                  value: 'Hujan (mm)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fontSize: 12 } 
                }} 
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px' 
                }}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
                formatter={(value: number) => [`${value.toFixed(2)} mm`, 'Hujan Wilayah']}
              />
              <Bar dataKey="hujan" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <AlertTriangle className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">Belum ada data curah hujan wilayah</p>
            <p className="text-xs mt-1">Silakan lengkapi data di tab Curah Hujan Wilayah</p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
