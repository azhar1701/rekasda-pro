
import React, { useState, useEffect, useRef } from 'react';
import { WEST_JAVA_LOCATIONS } from '../constants';
import { SiteIdentity, GeoLocationData } from '../types';
import { InputGroup } from './InputGroup';

interface Props {
  value: SiteIdentity;
  onChange: (value: SiteIdentity) => void;
}

export const SiteIdentityForm: React.FC<Props> = ({ value, onChange }) => {
  const [loadingGps, setLoadingGps] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value.location) {
      getGps();
    }
  }, []);

  const getGps = () => {
    setLoadingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: GeoLocationData = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp
          };
          onChange({ ...value, location: loc });
          setLoadingGps(false);
        },
        (err) => {
          console.error("GPS Error", err);
          setLoadingGps(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...value, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const regencies = Object.keys(WEST_JAVA_LOCATIONS);
  const districts = value.regency ? Object.keys(WEST_JAVA_LOCATIONS[value.regency] || {}) : [];
  const villages = (value.regency && value.district) ? (WEST_JAVA_LOCATIONS[value.regency][value.district] || []) : [];

  return (
    <div className="bg-white p-5 md:p-8 rounded-[2rem] shadow-soft border border-slate-100 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-field-green/10 flex items-center justify-center text-field-green">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <div>
            <h3 className="text-sm font-bold text-slate-900">Identitas Lokasi</h3>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Data Proyek & Dokumentasi</p>
        </div>
      </div>

      <InputGroup 
        label="Nama Saluran / Sungai" 
        placeholder="Contoh: Saluran Sekunder Citarum"
        value={value.channelName}
        onChange={(e) => onChange({ ...value, channelName: e.target.value })}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
            { label: 'Kabupaten/Kota', val: value.regency, options: regencies, action: (v:string) => onChange({ ...value, regency: v, district: '', village: '' }) },
            { label: 'Kecamatan', val: value.district, options: districts, action: (v:string) => onChange({ ...value, district: v, village: '' }), disabled: !value.regency },
            { label: 'Desa/Kelurahan', val: value.village, options: villages, action: (v:string) => onChange({ ...value, village: v }), disabled: !value.district }
        ].map((field, idx) => (
            <div key={idx} className="group">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-2 group-focus-within:text-safety-blue transition-colors">{field.label}</label>
                <div className="relative">
                    <select 
                        disabled={field.disabled}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-900 text-sm font-bold rounded-2xl px-4 py-3.5 outline-none focus:border-safety-blue focus:ring-4 focus:ring-safety-blue/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        value={field.val}
                        onChange={(e) => field.action(e.target.value)}
                    >
                        <option value="">Pilih...</option>
                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={getGps}
          className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition-all group relative overflow-hidden ${value.location ? 'border-field-green/30 bg-field-green/5' : 'border-slate-200 hover:border-field-green hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <svg className={`w-5 h-5 ${value.location ? 'text-field-green' : 'text-slate-400 group-hover:text-field-green'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
            <span className={`text-[10px] font-black uppercase tracking-widest ${value.location ? 'text-field-green' : 'text-slate-500'}`}>Geotagging</span>
          </div>
          {loadingGps ? (
            <span className="text-[10px] font-bold text-field-green animate-pulse uppercase mt-1">Mencari Koordinat...</span>
          ) : value.location ? (
            <span className="text-[10px] font-mono font-bold text-slate-700 mt-1">{value.location.latitude.toFixed(4)}, {value.location.longitude.toFixed(4)}</span>
          ) : (
            <span className="text-[10px] font-medium text-slate-400 mt-1">Ketuk untuk GPS</span>
          )}
        </button>

        <button 
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition-all group relative overflow-hidden ${value.photoUrl ? 'border-safety-blue/30 bg-safety-blue/5' : 'border-slate-200 hover:border-safety-blue hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <svg className={`w-5 h-5 ${value.photoUrl ? 'text-safety-blue' : 'text-slate-400 group-hover:text-safety-blue'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className={`text-[10px] font-black uppercase tracking-widest ${value.photoUrl ? 'text-safety-blue' : 'text-slate-500'}`}>Dokumentasi</span>
          </div>
           {value.photoUrl ? (
            <span className="text-[10px] font-bold text-safety-blue uppercase mt-1">Foto Tersimpan</span>
          ) : (
            <span className="text-[10px] font-medium text-slate-400 mt-1">Ketuk untuk Foto</span>
          )}
          <input type="file" capture="environment" accept="image/*" ref={fileInputRef} className="hidden" onChange={handlePhoto} />
        </button>
      </div>

      {value.photoUrl && (
        <div className="relative w-full h-40 rounded-3xl overflow-hidden border border-slate-200 shadow-md group">
          <img src={value.photoUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
          <button onClick={() => onChange({ ...value, photoUrl: undefined })} className="absolute top-3 right-3 bg-white text-red-500 p-2 rounded-full shadow-lg hover:bg-red-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};
