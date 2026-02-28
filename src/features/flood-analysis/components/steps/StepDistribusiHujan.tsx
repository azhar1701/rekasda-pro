import React, { useState, useEffect } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { generateABMTable, calculateEffectiveRainfall } from '@/lib/utils/hydrologyMath';
import { HyetographChart } from '@/components/ui/HyetographChart';
import { IDFChart } from '@/components/ui/IDFChart';
import { Calculator, CloudRain } from 'lucide-react';

export const StepDistribusiHujan: React.FC = () => {
  const { 
    hasilAnalisisFrekuensi, 
    tutupanLahan,
    durasiHujan,
    distribusiHujanJamJaman,
    setDurasiHujan,
    setDistribusiHujanJamJaman,
    setHujanEfektif
  } = useHydrologyStore();

  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    if (distribusiHujanJamJaman && distribusiHujanJamJaman.length > 0) {
      setCalculated(true);
    }
  }, [distribusiHujanJamJaman]);

  const R24 = hasilAnalisisFrekuensi?.curahHujanRencana.find(
    v => v.kalaUlang === hasilAnalisisFrekuensi.selectedKalaUlang
  )?.curahHujan || 0;
  
  const C = tutupanLahan?.koefisienPengaliranGabungan || 0.65;

  const abmTable = React.useMemo(() => {
    if (R24 === 0) return [];
    return generateABMTable(R24, durasiHujan, 1);
  }, [R24, durasiHujan]);

  const hujanEfektifArray = React.useMemo(() => {
    if (abmTable.length === 0) return [];
    const hietograf = abmTable.map(row => row.hyetograph);
    return calculateEffectiveRainfall(hietograf, C);
  }, [abmTable, C]);

  const chartData = React.useMemo(() => {
    return abmTable.map((row, i) => ({
      jam: row.t,
      losses: Number((row.hyetograph - hujanEfektifArray[i]).toFixed(2)),
      efektif: Number(hujanEfektifArray[i].toFixed(2))
    }));
  }, [abmTable, hujanEfektifArray]);

  const handleCalculate = () => {
    const hietograf = abmTable.map(row => row.hyetograph);
    setDistribusiHujanJamJaman(hietograf);
    setHujanEfektif(hujanEfektifArray);
    setCalculated(true);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-300 rounded-md p-4">
        <div className="flex items-center gap-2 mb-4">
          <CloudRain className="w-5 h-5 text-[#0c3a66]" />
          <h3 className="text-sm font-bold text-slate-900">Distribusi Hujan Jam-jaman (IDF + ABM)</h3>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">R24 (mm)</label>
            <input 
              type="text" 
              value={R24.toFixed(2)} 
              disabled 
              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm tabular-nums text-right"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi (jam)</label>
            <input 
              type="number" 
              value={durasiHujan} 
              onChange={(e) => setDurasiHujan(Number(e.target.value))}
              min="2"
              max="24"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm tabular-nums text-right"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Koef. C</label>
            <input 
              type="text" 
              value={C.toFixed(3)} 
              disabled 
              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm tabular-nums text-right"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="w-full px-4 py-2 bg-[#0c3a66] hover:bg-[#0d4578] text-white text-sm font-semibold rounded flex items-center justify-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          Hitung Distribusi ABM
        </button>
      </div>

      {calculated && abmTable.length > 0 && (
        <>
          <div className="bg-white border border-slate-300 rounded-md p-4">
            <h4 className="text-xs font-bold text-slate-900 mb-3">Kurva IDF (Intensity-Duration-Frequency)</h4>
            <IDFChart 
              curahHujanRencana={hasilAnalisisFrekuensi?.curahHujanRencana || []} 
              selectedKalaUlang={hasilAnalisisFrekuensi?.selectedKalaUlang ?? undefined}
              maxDuration={Math.max(durasiHujan, 12)} 
            />
          </div>

          <div className="bg-white border border-slate-300 rounded-md p-4">
            <h4 className="text-xs font-bold text-slate-900 mb-3">Tabel Perhitungan ABM</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0c3a66] text-white">
                    <th className="px-2 py-2 text-center">t (jam)</th>
                    <th className="px-2 py-2 text-right">I (mm/jam)</th>
                    <th className="px-2 py-2 text-right">X (mm)</th>
                    <th className="px-2 py-2 text-right">ΔX (mm)</th>
                    <th className="px-2 py-2 text-right">ΔX (%)</th>
                    <th className="px-2 py-2 text-right">Hietograf (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {abmTable.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-2 py-1.5 text-center tabular-nums">{row.t}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.I.toFixed(2)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.X.toFixed(2)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.deltaX.toFixed(2)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.deltaXPercent.toFixed(2)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-semibold">{row.hyetograph.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-300 rounded-md p-4">
            <h4 className="text-xs font-bold text-slate-900 mb-3">Hyetograph & Hujan Efektif</h4>
            <HyetographChart data={chartData} />
          </div>
        </>
      )}

      {calculated && abmTable.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-900">✓ Distribusi Hujan Selesai</p>
              <p className="text-xs text-green-700 mt-1">
                Total Hujan Efektif: {hujanEfektifArray.reduce((a, b) => a + b, 0).toFixed(2)} mm
              </p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('completeStep', { detail: 1 }))}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
            >
              Lanjut ke HSS →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
