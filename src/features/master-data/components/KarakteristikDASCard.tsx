import React, { useState, useEffect, useMemo } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { HelpTooltip } from '@/components/ui/govtech';
import { useHydrologyStore, type MorfometriDAS } from '@/stores/useHydrologyStore';
import { toast } from '@/hooks/useToast';

export const KarakteristikDASCard: React.FC = () => {
  const { morfometriDAS, saveMorfometriDAS, lastResetAt } = useHydrologyStore();

  const [formData, setFormData] = useState<MorfometriDAS>({
    luasDAS: morfometriDAS?.luasDAS || 0,
    panjangSungai: morfometriDAS?.panjangSungai || 0,
    kemiringanSungai: morfometriDAS?.kemiringanSungai || 0,
    elevasi: morfometriDAS?.elevasi || 0,
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (morfometriDAS) {
      setFormData(morfometriDAS);
      if (morfometriDAS.luasDAS > 0) {
        setIsSaved(true);
      }
    }
  }, [morfometriDAS]);

  useEffect(() => {
    if (lastResetAt > 0) {
      setIsSaved(false);
    }
  }, [lastResetAt]);

  const handleChange = (field: keyof MorfometriDAS, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value as unknown as number }));
    setIsSaved(false);
  };

  const safeA = typeof formData.luasDAS === 'string' ? parseFloat(formData.luasDAS) || 0 : formData.luasDAS;
  const safeL = typeof formData.panjangSungai === 'string' ? parseFloat(formData.panjangSungai) || 0 : formData.panjangSungai;

  const logicalCheck = useMemo(() => {
    if (safeA <= 0 || safeL <= 0) return null;
    const expectedL = 1.4 * Math.pow(safeA, 0.6);
    const ratio = safeL / expectedL;
    const isLogical = ratio >= 0.5 && ratio <= 2.0;
    return {
      expectedL: expectedL.toFixed(2),
      ratio,
      isLogical,
      message: isLogical 
        ? "Konsistensi Spasial: Valid (Sesuai Hack's Law)" 
        : "Peringatan: Panjang sungai tidak lazim untuk luas DAS ini. Mohon verifikasi delineasi."
    };
  }, [safeA, safeL]);

  const handleSave = async () => {
    const safeData: MorfometriDAS = {
      luasDAS: safeA,
      panjangSungai: safeL,
      kemiringanSungai: typeof formData.kemiringanSungai === 'string' ? parseFloat(formData.kemiringanSungai) || 0 : formData.kemiringanSungai,
      elevasi: typeof formData.elevasi === 'string' ? parseFloat(formData.elevasi) || 0 : formData.elevasi,
    };
    if (safeData.luasDAS <= 0 || safeData.panjangSungai <= 0) {
      toast.warning('Luas DAS dan Panjang Sungai harus lebih dari 0.');
      return;
    }
    try {
      saveMorfometriDAS(safeData);
      setIsSaved(true);
      toast.success('Parameter DAS berhasil disimpan.');
    } catch (error) {
      console.error('Failed to save Morfometri DAS:', error);
      toast.error('Gagal menyimpan data Morfometri DAS.');
    }
  };

  const isValid = safeA > 0 && safeL > 0;

  return (
    <div className="border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
      <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue"></div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Karakteristik DAS (Morfometri)</h3>
        </div>
        <p className="text-xs text-slate-900 dark:text-slate-100 font-semibold mt-1 ml-3.5">Parameter geometri daerah aliran sungai</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Luas DAS (A) <HelpTooltip content="Luas Daerah Aliran Sungai dari hulu hingga titik pengamatan (outlet)" />
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.luasDAS === 0 ? 0 : (formData.luasDAS ?? '')}
                onChange={(e) => handleChange('luasDAS', e.target.value)}
                className="w-full h-11 px-4 pr-12 border border-slate-300 dark:border-slate-600 rounded-sm focus:ring-2 focus:ring-pupr-blue/20 focus:border-pupr-blue tabular-nums tracking-tight font-semibold"
                placeholder="0.00"
                step="0.01"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">km²</span>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Panjang Sungai (L) <HelpTooltip content="Panjang sungai utama dari titik terjauh di hulu hingga outlet" />
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.panjangSungai === 0 ? 0 : (formData.panjangSungai ?? '')}
                onChange={(e) => handleChange('panjangSungai', e.target.value)}
                className="w-full h-11 px-4 pr-12 border border-slate-300 dark:border-slate-600 rounded-sm focus:ring-2 focus:ring-pupr-blue/20 focus:border-pupr-blue tabular-nums tracking-tight font-semibold"
                placeholder="0.00"
                step="0.01"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">km</span>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Kemiringan Sungai (S) <HelpTooltip content="Perbedaan elevasi per satuan panjang sungai (m/m). Menghitung waktu konsentrasi (tc)" />
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.kemiringanSungai === 0 ? 0 : (formData.kemiringanSungai ?? '')}
                onChange={(e) => handleChange('kemiringanSungai', e.target.value)}
                className="w-full h-11 px-4 pr-12 border border-slate-300 dark:border-slate-600 rounded-sm focus:ring-2 focus:ring-pupr-blue/20 focus:border-pupr-blue tabular-nums tracking-tight font-semibold"
                placeholder="0.0000"
                step="0.0001"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">m/m</span>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Elevasi Rata-rata <HelpTooltip content="Ketinggian rata-rata DAS. Opsional, umumnya untuk koreksi suhu / orografik." />
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.elevasi === 0 ? 0 : (formData.elevasi ?? '')}
                onChange={(e) => handleChange('elevasi', e.target.value)}
                className="w-full h-11 px-4 pr-12 border border-slate-300 dark:border-slate-600 rounded-sm focus:ring-2 focus:ring-pupr-blue/20 focus:border-pupr-blue tabular-nums tracking-tight font-semibold"
                placeholder="0"
                step="1"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">m</span>
              </div>
            </div>
          </div>
        </div>

        {!isValid && (
          <div className="flex items-center gap-3 p-4 mt-6 bg-red-50 border border-red-200 text-xs text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span className="font-semibold">Luas DAS dan Panjang Sungai harus diisi dengan nilai &gt; 0</span>
          </div>
        )}

        {logicalCheck && isValid && (
          <div className={`flex items-start gap-3 p-4 mt-6 border text-xs font-medium transition-colors ${
            logicalCheck.isLogical 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${logicalCheck.isLogical ? 'text-emerald-600' : 'text-red-600'}`} />
            <div>
              <p className="font-bold uppercase tracking-wider mb-1 text-[10px]">Audit Geometri DAS</p>
              <p className="text-sm font-semibold">{logicalCheck.message}</p>
              <p className="mt-1 opacity-80 italic font-mono text-[10px]">Empiris: L ≈ 1.4 × A^0.6 (Ekspektasi: {logicalCheck.expectedL} km)</p>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!isValid}
          className={`w-full h-11 mt-6 font-bold uppercase tracking-wider text-xs rounded-sm transition-all flex items-center justify-center gap-2 ${!isValid
            ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-500'
            : isSaved
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-none'
            : 'bg-pupr-blue hover:bg-slate-900 text-white shadow-none'
          }`}
        >
          <Save className="w-4 h-4" />
          {isSaved ? 'Tersimpan ✓' : 'Simpan Parameter DAS'}
        </button>
      </div>
    </div>
  );
};
