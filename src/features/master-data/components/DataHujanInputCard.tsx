import React, { useState, useEffect, useMemo } from 'react';
import { CloudRain, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { useHydrologyStore, type DataHujan } from '@/stores/useHydrologyStore';
import { useDebounce } from '@/hooks/useDebounce';

export const DataHujanInputCard: React.FC = () => {
  const { dataHujan, updateDataHujanManual, selectedStasiun } = useHydrologyStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localData, setLocalData] = useState<DataHujan[]>(dataHujan);
  const debouncedData = useDebounce(localData, 700);

  useEffect(() => {
    setLocalData(dataHujan);
  }, [dataHujan]);

  useEffect(() => {
    if (debouncedData.length > 0) {
      const cleanedData = debouncedData.map(d => ({
        ...d,
        curah_hujan: typeof d.curah_hujan === 'string' ? (d.curah_hujan === '' ? 0 : parseFloat(d.curah_hujan) || 0) : d.curah_hujan
      }));
      if (JSON.stringify(cleanedData) !== JSON.stringify(dataHujan)) {
        updateDataHujanManual(cleanedData);
      }
    }
  }, [debouncedData]);

  const stats = useMemo(() => {
    const values = localData.map(d => typeof d.curah_hujan === 'number' ? d.curah_hujan : parseFloat(String(d.curah_hujan)) || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { min, max, avg, count: values.length };
  }, [localData]);

  const handleValueChange = (id: string, value: string) => {
    setLocalData(prev => prev.map(d => d.id === id ? { ...d, curah_hujan: value as unknown as number } : d));
  };

  return (
    <div className="border border-slate-300 rounded-md shadow-sm bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-blue-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0c3a66] rounded-md">
              <CloudRain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">15 Tahun Data Hujan Maksimum</h3>
              <p className="text-xs text-slate-600">
                Sumber: {selectedStasiun?.nama_stasiun || 'Stasiun Stasiun Cikampak'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            <Edit className="w-4 h-4 text-[#0c3a66]" />
            <span className="text-sm font-medium text-slate-700">Edit</span>
          </button>
        </div>
      </div>

      {/* Body - Preview Mode */}
      <div className="p-4">
        {/* Statistics */}
        <div className="flex items-center gap-6 mb-4 text-sm">
          <div>
            <span className="text-slate-600">Min: </span>
            <span className="font-bold text-slate-900 tabular-nums">{stats.min.toFixed(1)}</span>
            <span className="text-slate-500 ml-1">mm</span>
          </div>
          <div>
            <span className="text-slate-600">Max: </span>
            <span className="font-bold text-slate-900 tabular-nums">{stats.max.toFixed(1)}</span>
            <span className="text-slate-500 ml-1">mm</span>
          </div>
          <div>
            <span className="text-slate-600">Rata-rata: </span>
            <span className="font-bold text-slate-900 tabular-nums">{stats.avg.toFixed(1)}</span>
            <span className="text-slate-500 ml-1">mm</span>
          </div>
        </div>

        {/* Grid Preview - First 10 */}
        <div className="grid grid-cols-5 gap-3 mb-3">
          {localData.slice(0, 10).map((item, idx) => {
            // const year = item.tanggal ? new Date(item.tanggal).getFullYear() : idx + 1;
            const value = typeof item.curah_hujan === 'number' ? item.curah_hujan : parseFloat(String(item.curah_hujan)) || 0;
            return (
              <div key={item.id} className="border border-slate-200 rounded-md p-3 bg-slate-50">
                <div className="text-xs text-slate-600 mb-1">Tahun {idx + 1}</div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">{value.toFixed(1)}</div>
              </div>
            );
          })}
        </div>

        {/* Expand Button */}
        {localData.length > 10 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 text-sm text-[#0c3a66] font-medium hover:bg-slate-50 rounded-md border border-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Sembunyikan
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                +{localData.length - 10} data lainnya
              </>
            )}
          </button>
        )}

        {/* Expanded Table */}
        {isExpanded && (
          <div className="mt-4 border border-slate-300 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#0c3a66] text-white">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Tahun</th>
                  <th className="px-3 py-2 text-left font-semibold">Tanggal</th>
                  <th className="px-3 py-2 text-right font-semibold">Curah Hujan (mm)</th>
                </tr>
              </thead>
              <tbody>
                {localData.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-200 even:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700 tabular-nums tracking-tight">Tahun {idx + 1}</td>
                    <td className="px-3 py-2 tabular-nums tracking-tight">
                      <input
                        type="date"
                        value={item.tanggal}
                        onChange={(e) => setLocalData(prev => prev.map(d => d.id === item.id ? { ...d, tanggal: e.target.value } : d))}
                        className="w-full px-2 py-1 border border-slate-300 rounded-md focus:border-[#0c3a66] focus:ring-1 focus:ring-[#0c3a66] focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 tabular-nums tracking-tight">
                      <input
                        type="number"
                        value={item.curah_hujan === 0 ? 0 : (item.curah_hujan ?? '')}
                        onChange={(e) => handleValueChange(item.id, e.target.value)}
                        className="w-full px-2 py-1 text-right tabular-nums border border-slate-300 rounded-md focus:border-[#0c3a66] focus:ring-1 focus:ring-[#0c3a66] focus:outline-none"
                        placeholder="0.0"
                        step="0.1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
