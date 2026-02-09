
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { CalculationResult, GeoLocationData } from '../types';

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

  if (!isOpen || !data) return null;

  const site = (data.inputs as any)?.site;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gray-900 text-white p-5 flex justify-between items-center shrink-0">
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Konfirmasi Laporan</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {site && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="block font-black text-[10px] text-gray-400 uppercase tracking-widest mb-1">Lokasi Proyek</span>
                <p className="text-xs font-black text-gray-800">{site.channelName || 'Tanpa Nama'}</p>
                {(() => {
                  const fullAddress = [site.village, site.district, site.regency].filter(Boolean).join(', ');
                  return fullAddress && <p className="text-[10px] text-gray-500 font-bold uppercase">{fullAddress}</p>;
                })()}
              </div>
            )}

            <div className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                    <span className="block font-black text-[10px] text-gray-400 uppercase tracking-widest mb-1">Geotagging Aktif</span>
                    {loadingGeo ? (
                        <span className="text-sm text-safety-blue font-bold animate-pulse">Sinkronisasi GPS...</span>
                    ) : location ? (
                        <div className="text-sm font-mono text-gray-700">
                            <div>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</div>
                            <div className="text-[10px] text-green-600 font-black mt-1 uppercase">Sinyal GPS Akurat (±{location.accuracy.toFixed(1)}m)</div>
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
                <label className="block font-black text-[10px] text-gray-400 uppercase tracking-widest mb-2">Dokumentasi Visual</label>
                {photo ? (
                    <div className="relative h-48 w-full bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-inner group">
                        <img src={photo} alt="Site" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button onClick={() => setPhoto(null)} className="bg-red-600 text-white px-4 py-2 rounded-full font-black text-xs uppercase shadow-xl">Ganti Foto</button>
                        </div>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-200 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <p className="text-xs font-bold uppercase tracking-widest">Ketuk untuk Ambil Foto</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handlePhotoCapture} />
                    </label>
                )}
            </div>

            <div>
                <label className="block font-black text-[10px] text-gray-400 uppercase tracking-widest mb-2">Tambahkan Catatan Khusus</label>
                <textarea 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-medium focus:border-safety-blue outline-none transition-all shadow-inner" 
                    rows={3} 
                    placeholder="Misal: Kondisi sedimen tinggi, perlu normalisasi segera..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                ></textarea>
            </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white shrink-0">
            <Button fullWidth onClick={handleSave} className="py-4 text-sm shadow-xl shadow-safety-blue/30 rounded-2xl border-none">Simpan Permanen ke Database</Button>
        </div>
      </div>
    </div>
  );
};
