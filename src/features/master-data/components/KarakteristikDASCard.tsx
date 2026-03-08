import React, { useState, useEffect } from 'react';
import { Mountain, Save, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useHydrologyStore, type MorfometriDAS } from '@/stores/useHydrologyStore';
import { toast } from '@/hooks/useToast';

export const KarakteristikDASCard: React.FC = () => {
  const { morfometriDAS, saveMorfometriDAS } = useHydrologyStore();

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
      setIsSaved(true);
    }
  }, [morfometriDAS]);

  const handleChange = (field: keyof MorfometriDAS, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value as unknown as number }));
    setIsSaved(false);
  };

  const safeA = typeof formData.luasDAS === 'string' ? parseFloat(formData.luasDAS) || 0 : formData.luasDAS;
  const safeL = typeof formData.panjangSungai === 'string' ? parseFloat(formData.panjangSungai) || 0 : formData.panjangSungai;

  const handleSave = async () => {
    const safeData = {
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
      await saveMorfometriDAS(safeData);
      setIsSaved(true);
    } catch (error) {
      console.error('Failed to save Morfometri DAS:', error);
      toast.error('Gagal menyimpan data Morfometri DAS.');
    }
  };

  const isValid = safeA > 0 && safeL > 0;

  return (
    <Card className="border border-slate-300 shadow-sm rounded-md overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pupr-blue/10 rounded">
            <Mountain className="w-5 h-5 text-pupr-blue" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Karakteristik DAS (Morfometri)</h3>
            <p className="text-xs text-slate-600 font-medium">Parameter geometri daerah aliran sungai</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Luas DAS (A)
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.luasDAS === 0 ? 0 : (formData.luasDAS ?? '')}
                onChange={(e) => handleChange('luasDAS', e.target.value)}
                className="w-full px-3 py-2 pr-12 border border-slate-300 rounded-md focus:ring-1 focus:ring-pupr-blue focus:border-pupr-blue tabular-nums tracking-tight"
                placeholder="0.00"
                step="0.01"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-sm text-slate-500 font-medium">km²</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Panjang Sungai (L)
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.panjangSungai === 0 ? 0 : (formData.panjangSungai ?? '')}
                onChange={(e) => handleChange('panjangSungai', e.target.value)}
                className="w-full px-3 py-2 pr-12 border border-slate-300 rounded-md focus:ring-1 focus:ring-pupr-blue focus:border-pupr-blue tabular-nums tracking-tight"
                placeholder="0.00"
                step="0.01"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-sm text-slate-500 font-medium">km</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Kemiringan Sungai (S)
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.kemiringanSungai === 0 ? 0 : (formData.kemiringanSungai ?? '')}
                onChange={(e) => handleChange('kemiringanSungai', e.target.value)}
                className="w-full px-3 py-2 pr-12 border border-slate-300 rounded-md focus:ring-1 focus:ring-pupr-blue focus:border-pupr-blue tabular-nums tracking-tight"
                placeholder="0.0000"
                step="0.0001"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-sm text-slate-500 font-medium">m/m</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Elevasi Rata-rata
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.elevasi === 0 ? 0 : (formData.elevasi ?? '')}
                onChange={(e) => handleChange('elevasi', e.target.value)}
                className="w-full px-3 py-2 pr-12 border border-slate-300 rounded-md focus:ring-1 focus:ring-pupr-blue focus:border-pupr-blue tabular-nums tracking-tight"
                placeholder="0"
                step="1"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-sm text-slate-500 font-medium">m</span>
              </div>
            </div>
          </div>
        </div>

        {!isValid && (
          <div className="flex items-center gap-2 p-3 mt-4 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Luas DAS dan Panjang Sungai harus diisi dengan nilai &gt; 0</span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!isValid}
          className={`w-full mt-4 px-4 py-2.5 font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${!isValid
              ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500'
              : isSaved
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-pupr-blue hover:bg-pupr-blue/90 text-white'
            }`}
        >
          <Save className="w-4 h-4" />
          {isSaved ? 'Tersimpan ✓' : 'Simpan Parameter DAS'}
        </button>
      </div>
    </Card>
  );
};
