import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '@/components/ui/Button';
import { CalculationResult, GeoLocationData } from '@/types/common.types';
import { X, MapPin, Camera, Trash2, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  data: Partial<CalculationResult> | null;
  onClose: () => void;
  onConfirmSave: (finalData: CalculationResult) => void;
}

export const ReportModal: React.FC<Props> = ({ isOpen, data, onClose, onConfirmSave }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoLocationData | null>(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [notes, setNotes] = useState('');

  if (!data) return null;

  useEffect(() => {
    if (isOpen && data) {
      // Use data from the calculator if available
      setPhoto(data.photoUrl || null);
      setLocation(data.location || null);
      setNotes(data.notes || '');

      // Only trigger auto-gps if not already captured
      if (!data.location) {
        getLocation();
      }
    }
  }, [isOpen, data]);

  const getLocation = () => {
    setLoadingGeo(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
          setLoadingGeo(false);
        },
        (error) => {
          console.error("Geo Error", error);
          setLoadingGeo(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLoadingGeo(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!data) return;

    const finalRecord: CalculationResult = {
      ...(data as CalculationResult),
      id: Date.now().toString(),
      date: new Date().toISOString(),
      location: location || undefined,
      photoUrl: photo || undefined,
      notes: notes
    };
    onConfirmSave(finalRecord);
  };

  const site = data?.inputs ? (data.inputs as any).site : null;

  return (
    <Dialog open={isOpen && !!data} onClose={onClose} className="relative z-[100]">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4">
        <Dialog.Panel className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
          <div className="bg-pupr-blue text-white p-5 flex justify-between items-center shrink-0">
            <h3 id="report-modal-title" className="text-xl font-extrabold italic uppercase tracking-tighter">Konfirmasi Laporan</h3>
            <button onClick={onClose} aria-label="Tutup" className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {site && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block font-extrabold text-[10px] text-slate-400 uppercase tracking-widest mb-1">Lokasi Proyek</span>
                <p className="text-sm font-extrabold text-slate-800">{site.channelName || 'Tanpa Nama'}</p>
                {(() => {
                  const fullAddress = [site.village, site.district, site.regency].filter(Boolean).join(', ');
                  return fullAddress && <p className="text-[10px] text-slate-500 font-bold uppercase">{fullAddress}</p>;
                })()}
              </div>
            )}

            <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="block font-extrabold text-[10px] text-slate-400 uppercase tracking-widest mb-1">Geotagging Aktif</span>
                {loadingGeo ? (
                  <span className="text-sm text-pupr-blue font-bold animate-pulse">Sinkronisasi GPS...</span>
                ) : location ? (
                  <div className="text-sm font-mono text-slate-700 tabular-nums">
                    <div>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</div>
                    <div className="text-[10px] text-emerald-600 font-extrabold mt-1 uppercase">Sinyal GPS Akurat (±{location.accuracy.toFixed(1)}m)</div>
                  </div>
                ) : (
                  <span className="text-rose-500 text-sm font-bold">GPS Tidak Terdeteksi</span>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={getLocation}
                aria-label="Refresh lokasi GPS"
                className="rounded-xl border-slate-200 text-pupr-blue hover:text-pupr-blue hover:bg-slate-50"
              >
                <MapPin className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-2">
              <label className="block font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Dokumentasi Visual</label>
              {photo ? (
                <div className="relative h-48 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner group">
                  <img src={photo} alt="Site" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPhoto(null)}
                      className="rounded-full font-extrabold text-xs uppercase shadow-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Ganti Foto
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group">
                  <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-pupr-blue transition-colors">
                    <Camera className="w-10 h-10 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <p className="text-xs font-bold uppercase tracking-widest">Ketuk untuk Ambil Foto</p>
                  </div>
                  <input type="file" title="Ambil Foto" className="hidden" accept="image/*" capture="environment" onChange={handlePhotoCapture} />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Catatan Khusus</label>
              <textarea
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-medium focus:border-pupr-blue focus:bg-white outline-none transition-all shadow-inner placeholder:text-slate-300"
                rows={3}
                placeholder="Misal: Kondisi sedimen tinggi, perlu normalisasi segera..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-white shrink-0">
            <Button
              className="w-full h-14 rounded-2xl text-base shadow-xl shadow-pupr-blue/10 font-extrabold transition-all active:scale-[0.98]"
              onClick={handleSave}
            >
              <Save className="w-5 h-5 mr-3" />
              Simpan Permanen ke Database
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
