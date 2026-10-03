import React, { useState, useEffect, useMemo } from 'react';
import { Trees, Plus, Trash2, AlertTriangle, Save, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useHydrologyStore, type TutupanLahan, type TutupanLahanItem } from '@/stores/useHydrologyStore';
import { toast } from '@/hooks/useToast';

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
    } else {
      setItems([
        { id: crypto.randomUUID(), jenis: 'Hutan', luas: 0, nilaiC: 0.2, nilaiCN: 55 },
      ]);
      setIsSaved(false);
    }
  }, [tutupanLahan]);

  const { totalLuas, cGabungan, cnGabungan, luasError, maxTolerance } = useMemo(() => {
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
    const maxTolerance = Math.max(0.05, 0.005 * dasLuas);

    return {
      totalLuas: total,
      cGabungan: cWeighted,
      cnGabungan: cnWeighted,
      luasError: error,
      maxTolerance,
    };
  }, [items, morfometriDAS]);

  const hasError = morfometriDAS !== null && (morfometriDAS.luasDAS || 0) > 0 && luasError > maxTolerance;

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
      toast.error('Gagal menyimpan data Tutupan Lahan.');
    }
  };

  const handleNormalizeArea = () => {
    const targetDAS = morfometriDAS?.luasDAS || 0;
    if (targetDAS <= 0 || totalLuas <= 0) return;
    const factor = targetDAS / totalLuas;
    const normalized = items.map(item => ({
      ...item,
      luas: Number(((item.luas || 0) * factor).toFixed(3))
    }));
    setItems(normalized);
    setIsSaved(false);
    toast.info('Luas tutupan lahan berhasil dinormalisasi agar tepat sama dengan Luas DAS.');
  };

  return (
    <Card className="border border-slate-300 shadow-sm rounded-md overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded">
            <Trees className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Analisis Tutupan Lahan</h3>
            <p className="text-xs text-slate-600 font-medium">Koefisien pengaliran dan curve number</p>
          </div>
        </div>
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-md transition-colors"
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
                      className="w-full py-1 px-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Contoh: Hutan"
                    />
                  </td>
                  <td className="px-3 py-2 tabular-nums tracking-tight">
                    <input
                      type="number"
                      value={item.luas === 0 ? 0 : (item.luas ?? '')}
                      onChange={(e) => handleChange(item.id, 'luas', e.target.value)}
                      className="w-full py-1 px-2 text-sm text-right border border-slate-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 tabular-nums"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </td>
                  <td className="px-3 py-2 tabular-nums tracking-tight">
                    <input
                      type="number"
                      value={item.nilaiC === 0 ? 0 : (item.nilaiC ?? '')}
                      onChange={(e) => handleChange(item.id, 'nilaiC', e.target.value)}
                      className="w-full py-1 px-2 text-sm text-right border border-slate-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 tabular-nums"
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
                      className="w-full py-1 px-2 text-sm text-right border border-slate-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 tabular-nums"
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
            <p className="text-lg font-bold text-primary-700 tabular-nums">{cGabungan.toFixed(3)}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <p className="text-xs text-slate-600 font-medium mb-1">CN Gabungan (Weighted)</p>
            <p className="text-lg font-bold text-primary-700 tabular-nums">{cnGabungan.toFixed(1)}</p>
          </div>
        </div>

        {hasError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Peringatan: Selisih Luas DAS Melebihi Toleransi (0.5%)</p>
                <p className="text-xs text-red-700 mt-1">
                  Total luas ({totalLuas.toFixed(2)} km²) berbeda dari Luas DAS ({morfometriDAS?.luasDAS.toFixed(2)} km²).
                  Selisih: <strong>{luasError.toFixed(2)} km²</strong> (Batas: &plusmn;{maxTolerance.toFixed(2)} km²).
                </p>
              </div>
            </div>
            <button
              onClick={handleNormalizeArea}
              type="button"
              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded border border-red-300 self-start sm:self-center shrink-0 transition-colors"
            >
              Normalisasikan Luas ke 100%
            </button>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={hasError}
          className={`w-full px-4 py-2.5 font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${hasError
              ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500'
              : isSaved
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-primary-700 hover:bg-primary-800 text-white'
            }`}
        >
          {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {hasError ? 'Perbaiki Selisih Luas Terlebih Dahulu' : isSaved ? 'Tersimpan ✓' : 'Simpan Tutupan Lahan'}
        </button>
      </div>
    </Card>
  );
};
