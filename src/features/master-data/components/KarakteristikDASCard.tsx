import React, { useState, useEffect } from 'react';
import { Mountain, Save, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useHydrologyStore, type MorfometriDAS } from '@/stores/useHydrologyStore';

export const KarakteristikDASCard: React.FC = () => {
  const { morfometriDAS, setMorfometriDAS } = useHydrologyStore();
  
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

  const handleSave = () => {
    const safeData = {
      luasDAS: safeA,
      panjangSungai: safeL,
      kemiringanSungai: typeof formData.kemiringanSungai === 'string' ? parseFloat(formData.kemiringanSungai) || 0 : formData.kemiringanSungai,
      elevasi: typeof formData.elevasi === 'string' ? parseFloat(formData.elevasi) || 0 : formData.elevasi,
    };
    if (safeData.luasDAS <= 0 || safeData.panjangSungai <= 0) {
      alert('Luas DAS dan Panjang Sungai harus lebih dari 0');
      return;
    }
    setMorfometriDAS(safeData);
    setIsSaved(true);
  };

  const isValid = safeA > 0 && safeL > 0;

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Mountain className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Karakteristik DAS (Morfometri)</h3>
          <p className="text-xs text-slate-500">Parameter geometri daerah aliran sungai</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Luas DAS (A)
          </label>
          <div className="relative">
              <input
              type="number"
              value={formData.luasDAS === 0 ? 0 : (formData.luasDAS ?? '')}
              onChange={(e) => handleChange('luasDAS', e.target.value)}
              className="w-full px-3 py-2 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              step="0.01"
            />
            <span className="absolute right-3 top-2.5 text-sm text-slate-500 font-medium">km²</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Panjang Sungai (L)
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.panjangSungai === 0 ? 0 : (formData.panjangSungai ?? '')}
              onChange={(e) => handleChange('panjangSungai', e.target.value)}
              className="w-full px-3 py-2 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              step="0.01"
            />
            <span className="absolute right-3 top-2.5 text-sm text-slate-500 font-medium">km</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Kemiringan Sungai (S)
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.kemiringanSungai === 0 ? 0 : (formData.kemiringanSungai ?? '')}
              onChange={(e) => handleChange('kemiringanSungai', e.target.value)}
              className="w-full px-3 py-2 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.0000"
              step="0.0001"
            />
            <span className="absolute right-3 top-2.5 text-sm text-slate-500 font-medium">m/m</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Elevasi Rata-rata
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.elevasi === 0 ? 0 : (formData.elevasi ?? '')}
              onChange={(e) => handleChange('elevasi', e.target.value)}
              className="w-full px-3 py-2 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              step="1"
            />
            <span className="absolute right-3 top-2.5 text-sm text-slate-500 font-medium">m</span>
          </div>
        </div>
      </div>

      {!isValid && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Luas DAS dan Panjang Sungai harus diisi dengan nilai &gt; 0</span>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!isValid}
        className={`w-full px-4 py-2.5 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
          !isValid
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
            : isSaved
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        <Save className="w-4 h-4" />
        {isSaved ? 'Tersimpan ✓' : 'Simpan Parameter DAS'}
      </button>
    </Card>
  );
};
