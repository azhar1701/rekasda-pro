import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, AlertTriangle, Save, CheckCircle } from 'lucide-react';
import { HelpTooltip } from '@/components/ui/govtech';
import { useHydrologyStore, type TutupanLahan, type TutupanLahanItem } from '@/stores/useHydrologyStore';
import { toast } from '@/hooks/useToast';

export const TutupanLahanCard: React.FC = () => {
 const { tutupanLahan, saveTutupanLahan, morfometriDAS, lastResetAt } = useHydrologyStore();

 const [items, setItems] = useState<TutupanLahanItem[]>(
 tutupanLahan?.items || [
 { id: crypto.randomUUID(), jenis: 'Hutan', luas: 0, nilaiC: 0.2, nilaiCN: 55 },
 ]
 );
 const [isSaved, setIsSaved] = useState(false);

 useEffect(() => {
 if (tutupanLahan) {
 setItems(tutupanLahan.items);
 // Only set isSaved if it's not empty
 if (tutupanLahan.items.length > 0 && tutupanLahan.totalLuas > 0) {
 setIsSaved(true);
 }
 }
 }, [tutupanLahan]);

 // Handle Global Reset
 useEffect(() => {
 if (lastResetAt > 0) {
 setIsSaved(false);
 }
 }, [lastResetAt]);

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
 toast.error('Gagal menyimpan data Tutupan Lahan.');
 }
 };

  return (
    <div className="border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
      <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analisis Tutupan Lahan</h3>
          </div>
          <p className="text-xs text-slate-900 dark:text-slate-100 font-semibold mt-1 ml-3.5">Koefisien pengaliran dan curve number</p>
        </div>
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-4 h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:border-pupr-blue hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-wider font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah
        </button>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto mb-6 bg-white border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">Jenis Tutupan Lahan</th>
                <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">Luas (km²)</th>
                <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  <div className="flex items-center justify-end gap-1.5 min-w-[80px]">
                    Koef. C 
                    <HelpTooltip content="Koefisien Pengaliran (C) untuk Metode Rasional (0-1)" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  <div className="flex items-center justify-end gap-1.5 min-w-[50px]">
                    CN 
                    <HelpTooltip content="Curve Number untuk Metode SCS (0-100)" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-slate-500 uppercase tracking-wider text-[10px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-800 transition-colors even:bg-slate-50/50">
                  <td className="px-4 py-3 tabular-nums tracking-tight">
                    <input
                      type="text"
                      value={item.jenis}
                      onChange={(e) => handleChange(item.id, 'jenis', e.target.value)}
                      className="w-full h-11 px-3 text-xs border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-pupr-blue/20 focus:border-pupr-blue font-semibold"
                      placeholder="Contoh: Hutan"
                    />
                  </td>
                  <td className="px-4 py-3 tabular-nums tracking-tight">
                    <input
                      type="number"
                      value={item.luas === 0 ? 0 : (item.luas ?? '')}
                      onChange={(e) => handleChange(item.id, 'luas', e.target.value)}
                      className="w-full h-11 px-3 text-xs text-right border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-pupr-blue/20 focus:border-pupr-blue tabular-nums font-semibold"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </td>
                  <td className="px-4 py-3 tabular-nums tracking-tight">
                    <input
                      type="number"
                      value={item.nilaiC === 0 ? 0 : (item.nilaiC ?? '')}
                      onChange={(e) => handleChange(item.id, 'nilaiC', e.target.value)}
                      className="w-full h-11 px-3 text-xs text-right border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-pupr-blue/20 focus:border-pupr-blue tabular-nums font-semibold"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      max="1"
                    />
                  </td>
                  <td className="px-4 py-3 tabular-nums tracking-tight">
                    <input
                      type="number"
                      value={item.nilaiCN === 0 ? 0 : (item.nilaiCN ?? '')}
                      onChange={(e) => handleChange(item.id, 'nilaiCN', e.target.value)}
                      className="w-full h-11 px-3 text-xs text-right border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-pupr-blue/20 focus:border-pupr-blue tabular-nums font-semibold"
                      placeholder="0"
                      step="1"
                      min="0"
                      max="100"
                    />
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums tracking-tight">
                    <button
                      onClick={() => handleRemoveRow(item.id)}
                      disabled={items.length === 1}
                      className="w-11 h-11 inline-flex items-center justify-center text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Luas Tutupan</p>
            <p className="text-2xl font-light text-slate-900 dark:text-slate-100 tabular-nums">{totalLuas.toFixed(2)} <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">km²</span></p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">C Gabungan (Weighted)</p>
            <p className="text-2xl font-light text-pupr-blue tabular-nums">{cGabungan.toFixed(3)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CN Gabungan (Weighted)</p>
            <p className="text-2xl font-light text-pupr-blue tabular-nums">{cnGabungan.toFixed(1)}</p>
          </div>
        </div>

        {hasError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[10px] font-bold text-red-900 uppercase tracking-wider">Peringatan: Selisih Luas DAS</p>
              <p className="text-xs text-red-700 mt-1 font-semibold">
                Total luas tutupan lahan ({totalLuas.toFixed(2)} km²) tidak sama dengan Luas DAS ({morfometriDAS?.luasDAS.toFixed(2)} km²).
                Selisih: <strong>{luasError.toFixed(2)} km²</strong>
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={hasError}
          className={`w-full h-11 uppercase tracking-wider text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${hasError
            ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-500'
            : isSaved
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-none'
            : 'bg-pupr-blue hover:bg-blue-800 text-white shadow-none'
          }`}
        >
          {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {hasError ? 'Perbaiki Selisih Luas Terlebih Dahulu' : isSaved ? 'Tersimpan ✓' : 'Simpan Tutupan Lahan'}
        </button>
      </div>
    </div>
  );
};
