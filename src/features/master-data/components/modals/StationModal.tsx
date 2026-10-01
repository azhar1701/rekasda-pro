import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { MapPin, X, AlertCircle } from 'lucide-react';
import type { StasiunHidrologi } from '@/stores/useHydrologyStore';

interface StationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<StasiunHidrologi, 'id' | 'created_at'>) => Promise<void>;
  editingStation?: StasiunHidrologi | null;
  isLoading?: boolean;
}

export const StationModal: React.FC<StationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingStation,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    nama_stasiun: '',
    koordinat_x: '',
    koordinat_y: '',
    elevasi: '',
    keterangan: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (editingStation) {
      setFormData({
        nama_stasiun: editingStation.nama_stasiun || '',
        koordinat_x: editingStation.koordinat_x !== null ? String(editingStation.koordinat_x) : '',
        koordinat_y: editingStation.koordinat_y !== null ? String(editingStation.koordinat_y) : '',
        elevasi: editingStation.elevasi !== null ? String(editingStation.elevasi) : '',
        keterangan: editingStation.keterangan || '',
      });
    } else {
      setFormData({
        nama_stasiun: '',
        koordinat_x: '',
        koordinat_y: '',
        elevasi: '',
        keterangan: '',
      });
    }
    setValidationError(null);
  }, [editingStation, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.nama_stasiun.trim()) {
      setValidationError('Nama stasiun wajib diisi.');
      return;
    }

    const lon = formData.koordinat_x ? parseFloat(formData.koordinat_x.replace(',', '.')) : null;
    const lat = formData.koordinat_y ? parseFloat(formData.koordinat_y.replace(',', '.')) : null;
    const elev = formData.elevasi ? parseFloat(formData.elevasi.replace(',', '.')) : null;

    // Validasi geografis dasar wilayah Indonesia
    if (lon !== null && (lon < 95 || lon > 141)) {
      setValidationError('Bujur (Longitude) harus berada dalam batas Indonesia (95° - 141° BT).');
      return;
    }
    if (lat !== null && (lat < -11 || lat > 6)) {
      setValidationError('Lintang (Latitude) harus berada dalam batas Indonesia (-11° LS sampai 6° LU).');
      return;
    }

    try {
      await onSave({
        nama_stasiun: formData.nama_stasiun.trim(),
        koordinat_x: lon,
        koordinat_y: lat,
        elevasi: elev,
        keterangan: formData.keterangan.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Gagal menyimpan stasiun');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {editingStation ? 'Edit Stasiun Hidrologi' : 'Tambah Stasiun Baru'}
              </h3>
              <p className="text-xs text-slate-500">Master pos pengamatan curah hujan</p>
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
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{validationError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Stasiun <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nama_stasiun}
              onChange={(e) => setFormData({ ...formData, nama_stasiun: e.target.value })}
              placeholder="Contoh: Stasiun Cikupa"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bujur / Longitude (° BT)
              </label>
              <input
                type="text"
                value={formData.koordinat_x}
                onChange={(e) => setFormData({ ...formData, koordinat_x: e.target.value })}
                placeholder="Contoh: 108.2145"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lintang / Latitude (° LS)
              </label>
              <input
                type="text"
                value={formData.koordinat_y}
                onChange={(e) => setFormData({ ...formData, koordinat_y: e.target.value })}
                placeholder="Contoh: -7.4212"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Elevasi Pos (mdpl)
            </label>
            <input
              type="text"
              value={formData.elevasi}
              onChange={(e) => setFormData({ ...formData, elevasi: e.target.value })}
              placeholder="Contoh: 350"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan Tambahan
            </label>
            <textarea
              rows={2}
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder="Contoh: Pos penakar tipe Hellmann / Manual OBS"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : (editingStation ? 'Simpan Perubahan' : 'Tambah Stasiun')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
