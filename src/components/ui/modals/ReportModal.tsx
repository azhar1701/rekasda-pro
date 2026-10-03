
import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '@/components/ui/forms/Button';
import { CalculationResult, GeoLocationData } from '@/types/common.types';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { FolderGit2, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  data: Partial<CalculationResult> | null;
  onClose: () => void;
  onConfirmSave: (finalData: CalculationResult) => void;
}

export const ReportModal: React.FC<Props> = ({ isOpen, data, onClose, onConfirmSave }) => {
  const { currentProjectId, currentProjectCode, currentProjectName } = useHydrologyStore();
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoLocationData | null>(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [notes, setNotes] = useState('');
  const [scenarioName, setScenarioName] = useState('Kondisi Eksisting (Desain)');

  useEffect(() => {
    if (isOpen && data) {
      // Use data from the calculator if available
      setPhoto(data.photoUrl || null);
      setLocation(data.location || null);
      setNotes(data.notes || '');
      setScenarioName((data as any).scenarioName || 'Kondisi Eksisting (Desain)');

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
      notes: notes,
      scenarioName: scenarioName.trim() || 'Kondisi Eksisting',
      projectId: currentProjectId || undefined
    };
    onConfirmSave(finalRecord);
  };

  const site = data?.inputs ? (data.inputs as any).site : null;

  if (!isOpen || !data) return null;

  return (
    <Dialog open={isOpen && !!data} onClose={onClose} className="relative z-[100]">
      <div className="fixed inset-0" aria-hidden="true" />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4">
        <Dialog.Panel className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-gray-900 text-white p-5 flex justify-between items-center shrink-0">
            <h3 className="text-xl font-extrabold italic uppercase tracking-tighter">Konfirmasi Laporan</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Unified Project & Scenario Card */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[#0c3a66] font-extrabold text-[10px] uppercase tracking-wider">
                  <FolderGit2 className="w-3.5 h-3.5 text-[#0c3a66]" />
                  <span>Proyek Penampung</span>
                </div>
                {currentProjectCode ? (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                    {currentProjectCode}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    Otomatis Tertaut
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 truncate">
                {currentProjectName || 'Proyek Analisis Hidrologi Terpadu'}
              </p>

              <div className="mt-3 pt-2.5 border-t border-blue-100">
                <label className="block text-[10px] font-extrabold text-[#0c3a66] uppercase tracking-wider mb-1">
                  Nama Skenario / Alternatif Desain
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="Contoh: Skenario Q25 Penampang Trapesium"
                    className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-lg border border-blue-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0c3a66]"
                  />
                  <Layers className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>

            {site && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="block font-extrabold text-[10px] text-gray-400 uppercase tracking-widest mb-1">Lokasi Proyek</span>
                <p className="text-xs font-extrabold text-gray-800">{site.channelName || 'Tanpa Nama'}</p>
                {(() => {
                  const fullAddress = [site.village, site.district, site.regency].filter(Boolean).join(', ');
                  return fullAddress && <p className="text-[10px] text-gray-500 font-bold uppercase">{fullAddress}</p>;
                })()}
              </div>
            )}

            <div className="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="block font-extrabold text-[10px] text-gray-400 uppercase tracking-widest mb-1">Geotagging Aktif</span>
                {loadingGeo ? (
                  <span className="text-sm text-safety-blue font-bold animate-pulse">Sinkronisasi GPS...</span>
                ) : location ? (
                  <div className="text-sm font-mono text-gray-700">
                    <div>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</div>
                    <div className="text-[10px] text-green-600 font-extrabold mt-1 uppercase">Sinyal GPS Akurat (±{location.accuracy.toFixed(1)}m)</div>
                  </div>
                ) : (
                  <span className="text-red-500 text-sm font-bold">GPS Tidak Terdeteksi</span>
                )}
              </div>
              <button onClick={getLocation} className="p-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm text-safety-blue active:bg-gray-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>

            <div>
              <label className="block font-extrabold text-[10px] text-gray-400 uppercase tracking-widest mb-2">Dokumentasi Visual</label>
              {photo ? (
                <div className="relative h-48 w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner group">
                  <img src={photo} alt="Site" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => setPhoto(null)} className="bg-red-600 text-white px-4 py-2 rounded-full font-extrabold text-xs uppercase shadow-xl">Ganti Foto</button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <p className="text-xs font-bold uppercase tracking-widest">Ketuk untuk Ambil Foto</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handlePhotoCapture} />
                </label>
              )}
            </div>

            <div>
              <label className="block font-extrabold text-[10px] text-gray-400 uppercase tracking-widest mb-2">Tambahkan Catatan Khusus</label>
              <textarea
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 text-sm font-medium focus:border-safety-blue outline-none transition-all shadow-inner"
                rows={3}
                placeholder="Misal: Kondisi sedimen tinggi, perlu normalisasi segera..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-white shrink-0">
            <Button fullWidth onClick={handleSave} className="py-4 text-sm shadow-xl shadow-safety-blue/30 rounded-xl border-none">Simpan Permanen ke Database</Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
