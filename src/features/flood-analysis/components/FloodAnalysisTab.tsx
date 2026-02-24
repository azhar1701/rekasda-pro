import React, { useState } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { MasterDataSelector } from '@/features/master-data/components/MasterDataSelector';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { CloudRain, Calculator, Activity, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from '@/hooks/useToast';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';

type MethodType = 'rasional' | 'haspers' | 'nakayasu';

interface FloodAnalysisTabProps {
  onSave?: (type: any, inputs: any, outputs: any) => void;
  onConsultAI?: () => void;
}

export const FloodAnalysisTab: React.FC<FloodAnalysisTabProps> = () => {
  const [method, setMethod] = useState<MethodType>('rasional');
  const [isCalculating, setIsCalculating] = useState(false);
  const [localChartData, setLocalChartData] = useState<{ time: number, inflow: number }[]>([]);

  const { setHasilBanjir, luasDas, setLuasDas, isBanjirDirty } = useHydrologyStore();

  const handleCalculate = () => {
    if (!luasDas || isNaN(parseFloat(luasDas))) {
      toast.error('Silakan masukkan nilai Luas DAS yang valid.');
      return;
    }

    setIsCalculating(true);

    // Mock Calculation for Hydrograph based on Luas DAS & Method
    setTimeout(() => {
      const area = parseFloat(luasDas);
      const peak = method === 'rasional' ? area * 2.5 : method === 'haspers' ? area * 3.1 : area * 1.8;

      // Generate mock hydrograph curve
      const mockHydrograph = [];
      for (let i = 0; i <= 10; i++) {
        let val = 0;
        if (i <= 3) val = (peak / 3) * i; // Rising limb
        else val = peak * Math.exp(-0.4 * (i - 3)); // Falling limb

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
      toast.success('Hidrograf banjir disinkronisasikan ke Modul Embung.');
    }, 800);
  };

  return (
    <ModuleLayout
      title="Analisis Debit Banjir Rencana"
      description="Perhitungan hidrograf banjir dengan integrasi Master Data Dinamis."
      icon={<CloudRain className="w-6 h-6" />}
      iconColorClass="bg-blue-50 text-blue-600"
    >
      <div className="h-full relative grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 page-enter">
        {/* KOLOM KIRI (Input - col-span-5) */}
        <div className="md:col-span-5 flex flex-col gap-5">
          <div className="bg-white/60 backdrop-blur border border-white/60 rounded-2xl shadow-sm p-5 space-y-6">

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
                  className="pl-4 pr-12 py-6 text-lg rounded-xl border-slate-200 bg-white shadow-inner font-semibold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  km²
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button
                className="w-full py-6 rounded-xl font-bold text-base shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 transition-all"
                onClick={handleCalculate}
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
          <div className={`flex-1 bg-white/60 backdrop-blur border ${isBanjirDirty ? 'border-amber-200 shadow-amber-500/10' : 'border-white/60'} rounded-2xl shadow-sm p-5 flex flex-col transition-all duration-300`}>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-blue-500" />
              Kurva Hidrograf Banjir
            </h3>

            <div className="flex-1 bg-slate-50/50 rounded-xl border border-slate-100 p-4 border-dashed relative">
              {localChartData.length > 0 ? (
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
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
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
