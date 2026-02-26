import React, { useState, useEffect } from 'react';
import { CloudRain, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useHydrologyStore, type DataHujan } from '@/stores/useHydrologyStore';
import { useDebounce } from '@/hooks/useDebounce';

export const DataHujanInputCard: React.FC = () => {
  const { dataHujan, updateDataHujanManual, qcStatus, isQCCalculating, selectedStasiun } = useHydrologyStore();
  
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

  const handleValueChange = (id: string, value: string) => {
    setLocalData(prev => prev.map(d => d.id === id ? { ...d, curah_hujan: value as unknown as number } : d));
  };

  const handleAddRow = () => {
    const newRow: DataHujan = {
      id: crypto.randomUUID(),
      stasiun_id: selectedStasiun?.id || '',
      tanggal: new Date().toISOString().split('T')[0],
      curah_hujan: 0
    };
    setLocalData([...localData, newRow]);
  };

  const isCalculating = JSON.stringify(localData) !== JSON.stringify(debouncedData) || isQCCalculating;

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CloudRain className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Data Curah Hujan</h3>
            <p className="text-xs text-slate-500">
              {selectedStasiun ? `Stasiun: ${selectedStasiun.nama_stasiun}` : 'Pilih stasiun terlebih dahulu'}
            </p>
          </div>
        </div>
        
        {isCalculating && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-xs font-medium text-blue-700">Mengevaluasi data...</span>
          </div>
        )}
        
        {!isCalculating && qcStatus && selectedStasiun && qcStatus[selectedStasiun.id] && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            qcStatus[selectedStasiun.id].konsisten && qcStatus[selectedStasiun.id].bebasOutlier && qcStatus[selectedStasiun.id].homogen
              ? 'bg-green-50 border border-green-200'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            {qcStatus[selectedStasiun.id].konsisten && qcStatus[selectedStasiun.id].bebasOutlier && qcStatus[selectedStasiun.id].homogen ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">QC Lulus</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">QC Peringatan</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b-2 border-slate-200">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Tanggal</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-700">Curah Hujan (mm)</th>
            </tr>
          </thead>
          <tbody>
            {localData.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2">
                  <input
                    type="date"
                    value={item.tanggal}
                    onChange={(e) => setLocalData(prev => prev.map(d => d.id === item.id ? { ...d, tanggal: e.target.value } : d))}
                    className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={item.curah_hujan === 0 ? 0 : (item.curah_hujan ?? '')}
                    onChange={(e) => handleValueChange(item.id, e.target.value)}
                    className="w-full px-2 py-1 text-right border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="0.0"
                    step="0.1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleAddRow}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        + Tambah Data
      </button>

      {localData.length < 10 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>Minimal 10 tahun data</strong> diperlukan untuk Quality Control yang valid. 
            Saat ini: {localData.length} data.
          </p>
        </div>
      )}
    </Card>
  );
};
