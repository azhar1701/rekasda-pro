import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Sparkles, X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { infillMissingData } from '@/lib/utils/spatialMath';
import type { StasiunHidrologi, DataHujan } from '@/stores/useHydrologyStore';

interface InfillModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStation: StasiunHidrologi;
  allStations: StasiunHidrologi[];
  dataHujan: DataHujan[];
  onApplyInfill: (infilledRecords: Omit<DataHujan, 'id' | 'created_at'>[]) => Promise<void>;
}

export const InfillModal: React.FC<InfillModalProps> = ({
  isOpen,
  onClose,
  targetStation,
  allStations,
  dataHujan,
  onApplyInfill,
}) => {
  const [method, setMethod] = useState<'idw' | 'normal_ratio'>('idw');
  const [isProcessing, setIsProcessing] = useState(false);
  const [infillSummary, setInfillSummary] = useState<{ count: number; items: Omit<DataHujan, 'id' | 'created_at'>[] } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Cek ketersediaan koordinat untuk stasiun acuan
  const neighborStations = allStations.filter(
    (s) => s.id !== targetStation.id && s.koordinat_x !== null && s.koordinat_y !== null
  );

  const handleSimulateInfill = () => {
    setErrorMessage(null);

    if (neighborStations.length === 0) {
      setErrorMessage(
        'Tidak ada stasiun tetangga dengan koordinat spasial lengkap untuk melakukan interpolasi.'
      );
      return;
    }

    const infilledItems: Omit<DataHujan, 'id' | 'created_at'>[] = [];

    dataHujan.forEach((item) => {
      if (
        item.curah_hujan === null ||
        item.curah_hujan === undefined ||
        String(item.curah_hujan).trim() === '-' ||
        String(item.curah_hujan).trim() === ''
      ) {
        const infillResult = infillMissingData(
          targetStation,
          allStations,
          dataHujan,
          item.tanggal,
          method
        );

        if (infillResult && infillResult.value >= 0) {
          const infilledVal = parseFloat(infillResult.value.toFixed(1));
          infilledItems.push({
            stasiun_id: targetStation.id,
            tanggal: item.tanggal,
            curah_hujan: infilledVal,
            is_infilled: true,
          });
        }
      }
    });

    if (infilledItems.length === 0) {
      setErrorMessage('Tidak ditemukan data kosong yang dapat diestimasi dari stasiun sekitar.');
      return;
    }

    setInfillSummary({
      count: infilledItems.length,
      items: infilledItems,
    });
  };

  const handleExecuteApply = async () => {
    if (!infillSummary || infillSummary.items.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await onApplyInfill(infillSummary.items);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menerapkan data hasil infilling');
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Infilling Data Curah Hujan</h3>
              <p className="text-xs text-slate-500">
                Stasiun Target: <span className="font-semibold text-slate-700">{targetStation.nama_stasiun}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <Info className="w-4 h-4 text-blue-700 shrink-0" />
              <span>Prinsip Interpolasi Spasial (SNI Hidrologi)</span>
            </div>
            <p>
              Data kosong / sensor tidak aktif diisi berdasarkan stasiun pengamatan tetangga yang berada dalam radius korelasi.
            </p>
            <p className="text-blue-700 font-medium">
              Stasiun tetangga berkoordinat valid: {neighborStations.length} stasiun
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Metode Infilling</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all ${
                  method === 'idw'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="infillMethod"
                    value="idw"
                    checked={method === 'idw'}
                    onChange={() => {
                      setMethod('idw');
                      setInfillSummary(null);
                    }}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-xs">Inverse Distance (IDW)</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 pl-5">
                  Berbobot kuadrat jarak spasial antar pos pengamatan.
                </span>
              </label>

              <label
                className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all ${
                  method === 'normal_ratio'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="infillMethod"
                    value="normal_ratio"
                    checked={method === 'normal_ratio'}
                    onChange={() => {
                      setMethod('normal_ratio');
                      setInfillSummary(null);
                    }}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-xs">Normal Ratio Method</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 pl-5">
                  Berbobot rasio hujan rata-rata tahunan pos acuan.
                </span>
              </label>
            </div>
          </div>

          {/* Hasil Simulasi */}
          {infillSummary && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Estimasi Berhasil Dihitung
                </span>
                <span className="bg-emerald-200/80 px-2 py-0.5 rounded-full text-emerald-800">
                  {infillSummary.count} Titik Data Terisi
                </span>
              </div>
              <p className="text-emerald-700 text-[11px]">
                Data ini akan ditandai dengan flag <em>is_infilled = true</em> untuk transparansi audit rekayasa.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
            Batal
          </Button>

          <div className="flex gap-2">
            {!infillSummary ? (
              <Button type="button" size="sm" onClick={handleSimulateInfill} disabled={isProcessing}>
                Hitung Infilling
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleExecuteApply}
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isProcessing ? 'Menerapkan...' : `Terapkan & Simpan (${infillSummary.count} Data)`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
