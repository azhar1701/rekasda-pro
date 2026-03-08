import React, { useState } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { MasterDataSelector } from '@/features/master-data/components/MasterDataSelector';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { CloudRain, Calculator, Activity, TrendingUp, CheckCircle, XCircle, Droplets, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from '@/hooks/useToast';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';
import { performQualityControl } from '@/services/qualityControlService';
import { calculateEffectiveRainfallByC, getRecommendedC } from '@/services/effectiveRainfallService';
import { calculateAllHSS } from '@/services/hssComparisonService';
import { calculateMononobeIntensity, calculateRationalPeak } from '@/lib/utils/hydrology/runoff';

type MethodType = 'rasional' | 'haspers' | 'nakayasu';

interface FloodAnalysisTabProps {
  onSave?: (type: any, inputs: any, outputs: any) => void;
  onConsultAI?: () => void;
}

export const FloodAnalysisTab: React.FC<FloodAnalysisTabProps> = ({ onConsultAI }) => {
  const [method, setMethod] = useState<MethodType>('rasional');
  const [isCalculating, setIsCalculating] = useState(false);
  const [localChartData, setLocalChartData] = useState<{ time: number, inflow: number }[]>([]);
  const [landUse, setLandUse] = useState('Perumahan');
  const [showQC, setShowQC] = useState(false);
  const [showEffective, setShowEffective] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const {
    setHasilBanjir,
    luasDas,
    setLuasDas,
    panjangSungai,
    setPanjangSungai,
    curahHujanRencana,
    setCurahHujanRencana,
    isBanjirDirty,
    qcResults,
    setQCResults,
    effectiveRainfall,
    setEffectiveRainfall,
    hssComparisonResults,
    setHSSComparisonResults,
    setLandCoverParams
  } = useHydrologyStore();

  const handleQC = () => {
    const mockData = [45, 67, 89, 34, 56, 78, 90, 43, 55, 72];
    const results = performQualityControl(mockData);
    setQCResults({ '_default': results });
    setShowQC(true);
    toast.success(results.overallPassed ? 'Data lolos QC' : 'Data tidak lolos QC');
  };

  const handleEffectiveRainfall = () => {
    if (!curahHujanRencana) {
      toast.error('Masukkan hujan rencana terlebih dahulu');
      return;
    }
    const C = getRecommendedC(landUse);
    setLandCoverParams({ C, method: 'C', description: landUse });
    const result = calculateEffectiveRainfallByC(parseFloat(curahHujanRencana), C);
    setEffectiveRainfall(result);
    setShowEffective(true);
    toast.success('Hujan efektif dihitung');
  };

  const handleCompareHSS = async () => {
    if (!effectiveRainfall || !luasDas || !panjangSungai) {
      toast.error('Lengkapi parameter terlebih dahulu');
      return;
    }
    setIsCalculating(true);
    try {
      const results = await calculateAllHSS({
        effectiveRainfall: effectiveRainfall.effectiveRainfall,
        A: parseFloat(luasDas),
        L: parseFloat(panjangSungai),
      });
      setHSSComparisonResults(results);
      setShowComparison(true);
      toast.success(`${results.length} metode HSS dibandingkan`);
    } catch (error) {
      toast.error('Gagal membandingkan metode HSS');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculate = () => {
    if (!luasDas || isNaN(parseFloat(luasDas))) {
      toast.error('Silakan masukkan nilai Luas DAS yang valid.');
      return;
    }

    if (!curahHujanRencana || isNaN(parseFloat(curahHujanRencana))) {
      toast.error('Silakan masukkan nilai Hujan Rencana (R24).');
      return;
    }

    setIsCalculating(true);

    setTimeout(() => {
      const area = parseFloat(luasDas);
      const R24 = parseFloat(curahHujanRencana);
      const C = getRecommendedC(landUse);

      // Default tc (time of concentration) assumed 2 hours for mock-to-real transition
      // In production, tc should be calculated from L and S (Kirpich etc)
      const tc = 2.0;
      const intensity = calculateMononobeIntensity(R24, tc);
      const peak = method === 'rasional'
        ? calculateRationalPeak(C, intensity, area)
        : method === 'haspers' ? area * 3.1 : area * 1.8;

      // Generate a synthetic hydrograph based on the peak
      // For Rational Method, we often use a simplified duration or triangular shape
      const mockHydrograph = [];
      const duration = Math.ceil(tc * 3); // Base time approx 3 * tc

      for (let i = 0; i <= duration; i++) {
        let val = 0;
        if (i <= tc) {
          val = (peak / tc) * i; // Rising limb
        } else {
          val = peak * Math.exp(-0.5 * (i - tc)); // Falling limb (Recession)
        }

        mockHydrograph.push({
          time: i,
          inflow: Number(val.toFixed(2))
        });
      }

      setLocalChartData(mockHydrograph);

      setHasilBanjir({
        debitPuncak: Number(peak.toFixed(2)),
        hidrograf: mockHydrograph
      });

      setIsCalculating(false);
      toast.success(`Simulasi ${method.toUpperCase()} selesai. Debit Puncak: ${peak.toFixed(2)} m³/s`);
    }, 800);
  };

  const handleConsultAIFromButton = () => {
    onConsultAI?.();
  };

  return (
    <ModuleLayout
      title="Analisis Debit Banjir Rencana"
      description="Perhitungan hidrograf banjir dengan integrasi Master Data Dinamis."
      icon={<CloudRain className="w-6 h-6" />}
      iconColorClass="bg-blue-50 text-pupr-blue"
      actions={
        <Button
          variant="outline"
          size="sm"
          className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 font-bold"
          onClick={handleConsultAIFromButton}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Audit dengan AI
        </Button>
      }
    >
      <div className="h-full relative grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 page-enter">
        {/* KOLOM KIRI (Input - col-span-5) */}
        <div className="md:col-span-5 flex flex-col gap-5">
          <div className="bg-white/60 backdrop-blur border border-white/60 rounded-md shadow-sm p-5 space-y-6">

            {/* QC Section */}
            <div className="bg-blue-50/50 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                  1. Quality Control
                </label>
                <Button size="sm" variant="outline" onClick={handleQC}>
                  Uji QC
                </Button>
              </div>
              {showQC && qcResults && (() => {
                const firstKey = Object.keys(qcResults)[0];
                const firstResult = firstKey ? qcResults[firstKey] : null;
                if (!firstResult) return null;
                return (
                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center gap-2 ${firstResult.konsistensi.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                      {firstResult.konsistensi.isPassed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>Konsistensi</span>
                    </div>
                    <div className={`flex items-center gap-2 ${firstResult.homogenitas.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                      {firstResult.homogenitas.isPassed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>Homogenitas</span>
                    </div>
                    <div className={`flex items-center gap-2 ${firstResult.outlier.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                      {firstResult.outlier.isPassed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>Outlier</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Effective Rainfall Section */}
            <div className="bg-green-50/50 rounded-md p-4 space-y-3">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">
                2. Hujan Efektif
              </label>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Hujan Rencana (mm)"
                  value={curahHujanRencana}
                  onChange={(e) => setCurahHujanRencana(e.target.value)}
                  className="text-sm"
                />
                <select
                  value={landUse}
                  onChange={(e) => setLandUse(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="Hutan">Hutan (C=0.15)</option>
                  <option value="Perumahan">Perumahan (C=0.50)</option>
                  <option value="Perkotaan Padat">Perkotaan Padat (C=0.85)</option>
                </select>
                <Button size="sm" className="w-full" onClick={handleEffectiveRainfall}>
                  <Droplets className="w-4 h-4 mr-2" />
                  Hitung
                </Button>
              </div>
              {showEffective && effectiveRainfall && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded">
                    <div className="text-slate-500">Total</div>
                    <div className="font-bold">{effectiveRainfall.totalRainfall.toFixed(1)} mm</div>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <div className="text-slate-500">Efektif</div>
                    <div className="font-bold text-green-600">{effectiveRainfall.effectiveRainfall.toFixed(1)} mm</div>
                  </div>
                </div>
              )}
            </div>

            {/* HSS Comparison Section */}
            <div className="bg-amber-50/50 rounded-md p-4 space-y-3">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">
                3. Perbandingan HSS
              </label>
              <Input
                type="number"
                placeholder="Panjang Sungai (km)"
                value={panjangSungai}
                onChange={(e) => setPanjangSungai(e.target.value)}
                className="text-sm"
              />
              <Button size="sm" className="w-full" onClick={handleCompareHSS} disabled={isCalculating}>
                <Activity className="w-4 h-4 mr-2" />
                Bandingkan Metode
              </Button>
            </div>

            <hr className="border-slate-100" />

            {/* Master Data Selector */}
            <div>
              <MasterDataSelector />
            </div>

            <hr className="border-slate-100" />

            {/* Method Selector */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                Metode Analisis
              </label>
              <Tabs value={method} onValueChange={(val: string) => setMethod(val as MethodType)}>
                <SegmentedControl
                  items={[
                    { value: 'rasional', label: 'Rasional', icon: <TrendingUp className="w-4 h-4" /> },
                    { value: 'haspers', label: 'Haspers', icon: <Activity className="w-4 h-4" /> },
                    { value: 'nakayasu', label: 'HSS Nakayasu', icon: <CloudRain className="w-4 h-4" /> }
                  ]}
                />
              </Tabs>
            </div>

            {/* Parameter Input */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                Parameter DAS
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Masukkan Luas Catchment Area..."
                  value={luasDas}
                  onChange={(e) => setLuasDas(e.target.value)}
                  className="pl-4 pr-12 py-6 text-lg rounded-md border-slate-200 bg-white shadow-inner font-semibold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  km²
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button
                className="w-full py-6 rounded-md font-bold text-base shadow-sm shadow-blue-500/20 bg-pupr-blue hover:bg-blue-700 transition-all"
                onClick={handleCalculate}
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-md animate-pulse bg-slate-200 rounded-md"></div>
                    Memproses Simulasi...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Hitung Hidrograf
                  </div>
                )}
              </Button>
            </div>

          </div>
        </div>

        {/* KOLOM KANAN (Visualisasi - col-span-7) */}
        <div className="md:col-span-7 flex flex-col min-h-[400px]">
          <DependencyWarningBanner module="banjir" />
          <div className={`flex-1 bg-white/60 backdrop-blur border ${isBanjirDirty ? 'border-amber-200 shadow-amber-500/10' : 'border-white/60'} rounded-md shadow-sm p-5 flex flex-col transition-all duration-300`}>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-pupr-blue" />
              Kurva Hidrograf Banjir
            </h3>

            <div className="flex-1 bg-slate-50/50 rounded-md border border-slate-100 p-4 border-dashed relative">
              {showComparison && hssComparisonResults && hssComparisonResults.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="time"
                        type="number"
                        domain={[0, 'auto']}
                        tick={{ fontSize: 12, fill: '#64748B' }}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Waktu (jam)', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#64748B' }}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Debit (m³/s)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${value.toFixed(2)} m³/s`, 'Debit']}
                      />
                      <Legend />
                      {hssComparisonResults.map((result) => (
                        <Line
                          key={result.method}
                          data={result.hydrograph}
                          type="monotone"
                          dataKey="discharge"
                          stroke={result.color}
                          strokeWidth={2}
                          dot={false}
                          name={result.method}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2 text-left">Metode</th>
                          <th className="p-2 text-right">Qp (m³/s)</th>
                          <th className="p-2 text-right">Tp (jam)</th>
                          <th className="p-2 text-right">Tb (jam)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hssComparisonResults.map((result) => (
                          <tr key={result.method} className="border-b">
                            <td className="p-2 tabular-nums tracking-tight">
                              <span className="inline-block w-3 h-3 rounded-md mr-2" style={{ backgroundColor: result.color }} />
                              {result.method}
                            </td>
                            <td className="p-2 text-right font-mono tabular-nums tracking-tight">{result.Qp.toFixed(2)}</td>
                            <td className="p-2 text-right font-mono tabular-nums tracking-tight">{result.Tp.toFixed(2)}</td>
                            <td className="p-2 text-right font-mono tabular-nums tracking-tight">{result.Tb.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : localChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={localChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value} m³/s`, 'Debit (Q)']}
                      labelFormatter={(label) => `Jam ke-${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="inflow"
                      stroke="#3B82F6"
                      strokeWidth={4}
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#2563EB' }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-md flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-blue-300" />
                  </div>
                  <p className="text-slate-500 font-medium">Belum ada simulasi.</p>
                  <p className="text-sm text-slate-400 mt-1 max-w-xs">Pilih stasiun, masukkan Luas DAS, dan klik Hitung untuk melihat kurva hidrograf.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
};
