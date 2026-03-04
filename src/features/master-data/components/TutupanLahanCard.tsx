import React, { useState, useEffect, useMemo } from 'react';
import { Trees, Plus, Trash2, AlertTriangle, Save, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useHydrologyStore, type TutupanLahan, type TutupanLahanItem } from '@/stores/useHydrologyStore';

export const TutupanLahanCard: React.FC = () => {
  const { tutupanLahan, saveTutupanLahan, morfometriDAS } = useHydrologyStore();
  
  const [items, setItems] = useState<TutupanLahanItem[]>(
    tutupanLahan?.items || [
      { id: crypto.randomUUID(), jenis: 'Hutan', luas: 0, nilaiC: 0.2, nilaiCN: 55 },
    ]
  );
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (tutupanLahan) {
      setItems(tutupanLahan.items);
      setIsSaved(true);
    }
  }, [tutupanLahan]);

  const { totalLuas, cGabungan, cnGabungan, luasError } = useMemo(() => {
    const safeItems = items.map(i => ({
      ...i,
      luas: typeof i.luas === 'string' ? parseFloat(i.luas) || 0 : i.luas,
      nilaiC: typeof i.nilaiC === 'string' ? parseFloat(i.nilaiC) || 0 : i.nilaiC,
      nilaiCN: typeof i.nilaiCN === 'string' ? parseFloat(i.nilaiCN) || 0 : i.nilaiCN,
    }));
    const total = safeItems.reduce((sum, item) => sum + item.luas, 0);
    const cWeighted = total > 0 ? safeItems.reduce((sum, item) => sum + (item.nilaiC * item.luas), 0) / total : 0;
    const cnWeighted = total > 0 ? safeItems.reduce((sum, item) => sum + (item.nilaiCN * item.luas), 0) / total : 0;
    
    const dasLuas = morfometriDAS?.luasDAS || 0;
    const error = dasLuas > 0 ? Math.abs(total - dasLuas) : 0;
    
    return {
      totalLuas: total,
      cGabungan: cWeighted,
      cnGabungan: cnWeighted,
      luasError: error,
    };
  }, [items, morfometriDAS]);

  const hasError = luasError > 0.01 && morfometriDAS !== null;

  const handleAddRow = () => {
    setItems([...items, { id: crypto.randomUUID(), jenis: '', luas: 0, nilaiC: 0, nilaiCN: 0 }]);
    setIsSaved(false);
  };

  const handleRemoveRow = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
      setIsSaved(false);
    }
  };

  const handleChange = (id: string, field: keyof TutupanLahanItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value as unknown as number } : item
    ));
    setIsSaved(false);
  };

  const handleSave = async () => {
    const safeItems = items.map(i => ({
      ...i,
      luas: typeof i.luas === 'string' ? parseFloat(i.luas) || 0 : i.luas,
      nilaiC: typeof i.nilaiC === 'string' ? parseFloat(i.nilaiC) || 0 : i.nilaiC,
      nilaiCN: typeof i.nilaiCN === 'string' ? parseFloat(i.nilaiCN) || 0 : i.nilaiCN,
    }));
    const data: TutupanLahan = {
      items: safeItems,
      koefisienPengaliranGabungan: cGabungan,
      curveNumberGabungan: cnGabungan,
      totalLuas,
    };
    try {
      await saveTutupanLahan(data);
      setItems(safeItems);
      setIsSaved(true);
    } catch (error) {
      console.error('Failed to save Tutupan Lahan:', error);
      alert('Gagal menyimpan data Tutupan Lahan');
    }
  };

  return (
    <Card className="border border-slate-300 shadow-sm rounded-md overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0c3a66]/10 rounded">
            <Trees className="w-5 h-5 text-[#0c3a66]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Analisis Tutupan Lahan</h3>
            <p className="text-xs text-slate-600 font-medium">Koefisien pengaliran dan curve number</p>
          </div>
        </div>
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-slate-300 hover:border-[#0c3a66] hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah
        </button>
      </div>

      <div className="p-4">
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-300">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Jenis Tutupan Lahan</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-700">Luas (km²)</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-700">Koef. C</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-700">CN</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 tabular-nums tracking-tight">
                  <input
                    type="text"
                    value={item.jenis}
                    onChange={(e) => handleChange(item.id, 'jenis', e.target.value)}
                    className="w-full py-1 px-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#0c3a66] focus:border-[#0c3a66]"
                    placeholder="Contoh: Hutan"
                  />
                </td>
                <td className="px-3 py-2 tabular-nums tracking-tight">
                  <input
                    type="number"
                    value={item.luas === 0 ? 0 : (item.luas ?? '')}
                    onChange={(e) => handleChange(item.id, 'luas', e.target.value)}
                    className="w-full py-1 px-2 text-sm text-right border border-slate-300 rounded-md focus:ring-1 focus:ring-[#0c3a66] focus:border-[#0c3a66] tabular-nums"
                    placeholder="0.00"
                    step="0.01"
                  />
                </td>
                <td className="px-3 py-2 tabular-nums tracking-tight">
                  <input
                    type="number"
                    value={item.nilaiC === 0 ? 0 : (item.nilaiC ?? '')}
                    onChange={(e) => handleChange(item.id, 'nilaiC', e.target.value)}
                    className="w-full py-1 px-2 text-sm text-right border border-slate-300 rounded-md focus:ring-1 focus:ring-[#0c3a66] focus:border-[#0c3a66] tabular-nums"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                </td>
                <td className="px-3 py-2 tabular-nums tracking-tight">
                  <input
                    type="number"
                    value={item.nilaiCN === 0 ? 0 : (item.nilaiCN ?? '')}
                    onChange={(e) => handleChange(item.id, 'nilaiCN', e.target.value)}
                    className="w-full py-1 px-2 text-sm text-right border border-slate-300 rounded-md focus:ring-1 focus:ring-[#0c3a66] focus:border-[#0c3a66] tabular-nums"
                    placeholder="0"
                    step="1"
                    min="0"
                    max="100"
                  />
                </td>
                <td className="px-3 py-2 text-center tabular-nums tracking-tight">
                  <button
                    onClick={() => handleRemoveRow(item.id)}
                    disabled={items.length === 1}
                    className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
          <p className="text-xs text-slate-600 font-medium mb-1">Total Luas Tutupan</p>
          <p className="text-lg font-bold text-slate-900 tabular-nums">{totalLuas.toFixed(2)} <span className="text-sm font-normal text-slate-500">km²</span></p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
          <p className="text-xs text-slate-600 font-medium mb-1">C Gabungan (Weighted)</p>
          <p className="text-lg font-bold text-[#0c3a66] tabular-nums">{cGabungan.toFixed(3)}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
          <p className="text-xs text-slate-600 font-medium mb-1">CN Gabungan (Weighted)</p>
          <p className="text-lg font-bold text-[#0c3a66] tabular-nums">{cnGabungan.toFixed(1)}</p>
        </div>
      </div>

      {hasError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">Peringatan: Selisih Luas DAS</p>
            <p className="text-xs text-red-700 mt-1">
              Total luas tutupan lahan ({totalLuas.toFixed(2)} km²) tidak sama dengan Luas DAS ({morfometriDAS?.luasDAS.toFixed(2)} km²).
              Selisih: <strong>{luasError.toFixed(2)} km²</strong>
            </p>
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={hasError}
        className={`w-full px-4 py-2.5 font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
          hasError
            ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500'
            : isSaved
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-[#0c3a66] hover:bg-[#0d4578] text-white'
        }`}
      >
        {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {hasError ? 'Perbaiki Selisih Luas Terlebih Dahulu' : isSaved ? 'Tersimpan ✓' : 'Simpan Tutupan Lahan'}
      </button>
      </div>
    </Card>
  );
};
