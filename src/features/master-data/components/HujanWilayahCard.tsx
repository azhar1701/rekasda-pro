import React, { useState, useEffect, useMemo } from 'react';
import { CloudRain, AlertCircle, Save, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useHydrologyStore, type CurahHujanWilayah, type ThiessenStasiunConfig } from '@/stores/useHydrologyStore';

export const HujanWilayahCard: React.FC = () => {
  const { curahHujanWilayah, setCurahHujanWilayah, stasiunList, morfometriDAS } = useHydrologyStore();
  
  const [metode, setMetode] = useState<'aljabar' | 'thiessen'>(curahHujanWilayah?.metode || 'aljabar');
  const [configs, setConfigs] = useState<ThiessenStasiunConfig[]>(
    curahHujanWilayah?.stasiunConfigs || []
  );
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (curahHujanWilayah) {
      setMetode(curahHujanWilayah.metode);
      setConfigs(curahHujanWilayah.stasiunConfigs);
      setIsSaved(true);
    }
  }, [curahHujanWilayah]);

  useEffect(() => {
    if (stasiunList.length > 0 && configs.length === 0) {
      setConfigs(
        stasiunList.map(s => ({
          stasiunId: s.id,
          namaStasiun: s.nama_stasiun,
          luasPengaruh: 0,
          bobot: 0,
        }))
      );
    }
  }, [stasiunList]);

  const { totalLuasPengaruh, bobotError } = useMemo(() => {
    const total = configs.reduce((sum, c) => sum + (typeof c.luasPengaruh === 'string' ? parseFloat(c.luasPengaruh) || 0 : c.luasPengaruh), 0);
    const dasLuas = morfometriDAS?.luasDAS || 0;
    const error = dasLuas > 0 ? Math.abs(total - dasLuas) : 0;
    
    return {
      totalLuasPengaruh: total,
      bobotError: error,
    };
  }, [configs, morfometriDAS]);

  const configsWithBobot = useMemo(() => {
    return configs.map(c => {
      const safeluas = typeof c.luasPengaruh === 'string' ? parseFloat(c.luasPengaruh) || 0 : c.luasPengaruh;
      return {
        ...c,
        bobot: totalLuasPengaruh > 0 ? (safeluas / totalLuasPengaruh) * 100 : 0,
      }
    });
  }, [configs, totalLuasPengaruh]);

  const hasError = metode === 'thiessen' && bobotError > 0.01 && morfometriDAS !== null;

  const handleLuasChange = (stasiunId: string, value: string) => {
    setConfigs(configs.map(c => 
      c.stasiunId === stasiunId ? { ...c, luasPengaruh: value as unknown as number } : c
    ));
    setIsSaved(false);
  };

  const handleSave = () => {
    const safeConfigs = configsWithBobot.map(c => ({
      ...c,
      luasPengaruh: typeof c.luasPengaruh === 'string' ? parseFloat(c.luasPengaruh) || 0 : c.luasPengaruh
    }));
    const data: CurahHujanWilayah = {
      metode,
      stasiunConfigs: safeConfigs,
      hujanRataRata: 0,
    };
    setCurahHujanWilayah(data);
    setConfigs(safeConfigs);
    setIsSaved(true);
  };

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-cyan-100 rounded-lg">
          <CloudRain className="w-5 h-5 text-cyan-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Curah Hujan Wilayah</h3>
          <p className="text-xs text-slate-500">Metode rata-rata spasial</p>
        </div>
      </div>

      {/* Method Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">Metode Perhitungan</label>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setMetode('aljabar')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              metode === 'aljabar'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rata-rata Aljabar
          </button>
          <button
            onClick={() => setMetode('thiessen')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              metode === 'thiessen'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Poligon Thiessen
          </button>
        </div>
      </div>

      {/* Thiessen Configuration */}
      {metode === 'thiessen' && (
        <>
          {stasiunList.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-800">Belum ada stasiun hujan. Tambahkan stasiun terlebih dahulu.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b-2 border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Stasiun</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-700">Luas Pengaruh (km²)</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-700">Bobot (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configsWithBobot.map((config) => (
                      <tr key={config.stasiunId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-900">{config.namaStasiun}</td>
                        <td className="px-3 py-2">
                            <input
                              type="number"
                              value={config.luasPengaruh === 0 ? 0 : (config.luasPengaruh ?? '')}
                              onChange={(e) => handleLuasChange(config.stasiunId, e.target.value)}
                              className="w-full px-2 py-1 text-right border border-slate-300 rounded focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="inline-flex items-center px-2 py-1 bg-cyan-100 text-cyan-800 rounded font-medium">
                            {config.bobot.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Luas Pengaruh:</span>
                  <span className="text-lg font-bold text-slate-900">{totalLuasPengaruh.toFixed(2)} km²</span>
                </div>
                {morfometriDAS && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                    <span className="text-sm text-slate-600">Luas DAS:</span>
                    <span className="text-sm font-semibold text-slate-700">{morfometriDAS.luasDAS.toFixed(2)} km²</span>
                  </div>
                )}
              </div>

              {/* Error Warning */}
              {hasError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">Peringatan: Selisih Luas Pengaruh</p>
                    <p className="text-xs text-red-700 mt-1">
                      Total luas pengaruh ({totalLuasPengaruh.toFixed(2)} km²) harus sama dengan Luas DAS ({morfometriDAS?.luasDAS.toFixed(2)} km²).
                      Selisih: <strong>{bobotError.toFixed(2)} km²</strong>
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Aljabar Info */}
      {metode === 'aljabar' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Rata-rata Aljabar:</strong> Semua stasiun memiliki bobot yang sama. 
            Hujan wilayah = (Σ Hujan Stasiun) / Jumlah Stasiun
          </p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={hasError}
        className={`w-full px-4 py-2.5 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
          hasError
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
            : isSaved
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-cyan-600 hover:bg-cyan-700 text-white'
        }`}
      >
        {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {hasError ? 'Perbaiki Selisih Luas Terlebih Dahulu' : isSaved ? 'Tersimpan ✓' : 'Simpan Konfigurasi Hujan Wilayah'}
      </button>
    </Card>
  );
};
