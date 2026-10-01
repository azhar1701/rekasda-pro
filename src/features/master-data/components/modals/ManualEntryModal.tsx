import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Calendar, X, AlertCircle } from 'lucide-react';
import { parseRainfallValue, RAINFALL_LIMITS } from '@/lib/sanitizer/rainfallSanitizer';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stasiunId: string;
  stasiunName: string;
  initialDate?: string;
  initialValue?: number | null;
  onSave: (stasiunId: string, tanggal: string, curah_hujan: number) => Promise<void>;
  isLoading?: boolean;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  stasiunId,
  stasiunName,
  initialDate = '',
  initialValue = null,
  onSave,
  isLoading = false,
}) => {
  const [tanggal, setTanggal] = useState(initialDate);
  const [curahHujanStr, setCurahHujanStr] = useState(
    initialValue !== null && initialValue !== undefined ? String(initialValue) : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    setTanggal(initialDate || new Date().toISOString().split('T')[0]);
    setCurahHujanStr(initialValue !== null && initialValue !== undefined ? String(initialValue) : '');
    setError(null);
    setWarning(null);
  }, [initialDate, initialValue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWarning(null);

    if (!tanggal) {
      setError('Tanggal pencatatan wajib dipilih.');
      return;
    }

    const { val, warning: sanitizeWarning, error: sanitizeError } = parseRainfallValue(curahHujanStr);
    if (sanitizeError) {
      setError(sanitizeError);
      return;
    }
    if (val === null) {
      setError('Masukkan angka curah hujan yang valid (misal: 0 atau 12.5).');
      return;
    }

    if (sanitizeWarning) {
      setWarning(sanitizeWarning);
    }

    try {
      await onSave(stasiunId, tanggal, val);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data curah hujan');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Input / Edit Data Harian</h3>
              <p className="text-xs text-slate-500">
                Stasiun: <span className="font-semibold text-slate-700">{stasiunName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {warning && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{warning}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Pengamatan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tinggi Curah Hujan (mm) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={curahHujanStr}
                onChange={(e) => setCurahHujanStr(e.target.value)}
                placeholder="Contoh: 0 atau 24.5"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none pr-12"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 select-none">
                mm
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Gunakan angka 0 untuk hari tanpa hujan. Batas fisik: 0 - {RAINFALL_LIMITS.MAX_PHYSICAL} mm.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
