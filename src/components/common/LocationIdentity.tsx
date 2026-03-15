import React, { useState, useRef, useEffect } from 'react';
import { locationService } from '@/services/locationService';
import { SelectWithSearch } from '@/components/ui/forms/SelectWithSearch';

interface LocationData {
 channelName: string;
 kabupaten: string;
 kecamatan: string;
 desa: string;
 coordinates?: { lat: number; lng: number };
 photoUrl?: string;
}

interface Props {
 onLocationChange?: (data: LocationData) => void;
}

export const LocationIdentity: React.FC<Props> = ({ onLocationChange }) => {
 const [data, setData] = useState<LocationData>({
 channelName: '',
 kabupaten: '',
 kecamatan: '',
 desa: ''
 });
 const [loadingGps, setLoadingGps] = useState(false);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [gpsError, setGpsError] = useState<string | null>(null);
 const [kabupatenList, setKabupatenList] = useState<string[]>([]);
 const [kecamatanList, setKecamatanList] = useState<string[]>([]);
 const [desaList, setDesaList] = useState<string[]>([]);
 const fileInputRef = useRef<HTMLInputElement>(null);

 useEffect(() => {
 const initData = async () => {
 try {
 setError(null);
 await locationService.init();
 const kabupatenData = locationService.getKabupaten();
 setKabupatenList(kabupatenData);
 setLoading(false);
 } catch (error) {
 console.error('Error initializing location data:', error);
 setError('Gagal memuat data lokasi');
 setLoading(false);
 }
 };
 initData();
 }, []);

 useEffect(() => {
 if (data.kabupaten) {
 const allKecamatan = locationService.getKecamatan(data.kabupaten);
 setKecamatanList(allKecamatan.filter(k => k !== 'BELUM TERIDENTIFIKASI'));
 } else {
 setKecamatanList([]);
 }
 }, [data.kabupaten]);

 useEffect(() => {
 if (data.kabupaten && data.kecamatan) {
 const allDesa = locationService.getDesa(data.kabupaten, data.kecamatan);
 setDesaList(allDesa.filter(d => d !== 'BELUM TERIDENTIFIKASI'));
 } else {
 setDesaList([]);
 }
 }, [data.kabupaten, data.kecamatan]);

 const updateData = (updates: Partial<LocationData>) => {
 const newData = { ...data, ...updates };
 setData(newData);
 onLocationChange?.(newData);

 if (updates.desa && newData.kabupaten && newData.kecamatan) {
 const locationData = locationService.getLocationData(newData.kabupaten, newData.kecamatan, updates.desa);
 if (locationData && locationData.latitude && locationData.longitude) {
 setData(prev => ({
 ...prev,
 coordinates: {
 lat: locationData.latitude!,
 lng: locationData.longitude!
 }
 }));
 }
 }
 };

 const handleKabupatenChange = (value: string) => {
 updateData({ kabupaten: value, kecamatan: '', desa: '' });
 };

 const handleKecamatanChange = (value: string) => {
 updateData({ kecamatan: value, desa: '' });
 };

 const handleDesaChange = (value: string) => {
 updateData({ desa: value });
 };

 const handleGeotagging = () => {
 setLoadingGps(true);
 setGpsError(null);
 if ('geolocation' in navigator) {
 navigator.geolocation.getCurrentPosition(
 (pos) => {
 updateData({
 coordinates: {
 lat: pos.coords.latitude,
 lng: pos.coords.longitude
 }
 });
 setLoadingGps(false);
 },
 (err) => {
 const sanitizedMessage = `GPS Error: ${err.code}`;
 console.error(sanitizedMessage);
 setGpsError('Gagal mengambil lokasi GPS. Pastikan izin lokasi diaktifkan.');
 setLoadingGps(false);
 },
 { enableHighAccuracy: true, timeout: 5000 }
 );
 } else {
 setGpsError('Browser tidak mendukung Geolocation');
 setLoadingGps(false);
 }
 };

 const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onloadend = () => {
 updateData({ photoUrl: reader.result as string });
 };
 reader.readAsDataURL(file);
 }
 };

 return (
 <div className="space-y-4">
 {/* Header */}
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-sm bg-emerald-50 flex items-center justify-center">
 <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
 </svg>
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Identitas Lokasi</h3>
 <p className="text-xs text-slate-500">Data Proyek & Dokumentasi</p>
 </div>
 </div>

 {/* Input Nama Saluran */}
 <div>
 <label className="block text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wide mb-2">
 Nama Saluran / Sungai
 </label>
 <input
 type="text"
 value={data.channelName}
 onChange={(e) => updateData({ channelName: e.target.value })}
 placeholder="Contoh: Saluran Sekunder Citarum"
 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium rounded-sm p-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
 />
 </div>

 {/* Dropdown Wilayah */}
 <div className="space-y-3">
 {error && (
 <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700">
 {error}
 </div>
 )}
 
 <SelectWithSearch
 label="Kabupaten/Kota"
 options={kabupatenList.filter(k => k !== 'BELUM TERIDENTIFIKASI').map(k => ({ value: k, label: k }))}
 value={data.kabupaten}
 onChange={handleKabupatenChange}
 placeholder={loading ? 'Memuat...' : 'Pilih Kabupaten/Kota'}
 disabled={loading || error !== null}
 />

 <SelectWithSearch
 label="Kecamatan"
 options={kecamatanList.map(k => ({ value: k, label: k }))}
 value={data.kecamatan}
 onChange={handleKecamatanChange}
 placeholder="Pilih Kecamatan"
 disabled={!data.kabupaten}
 />

 <SelectWithSearch
 label="Desa/Kelurahan"
 options={desaList.map(d => ({ value: d, label: d }))}
 value={data.desa}
 onChange={handleDesaChange}
 placeholder="Pilih Desa/Kelurahan"
 disabled={!data.kecamatan}
 />
 </div>

 {/* Action Buttons Grid 2 Kolom */}
 <div className="grid grid-cols-2 gap-3 mt-4">
 {/* Tombol Geotagging */}
 <button
 onClick={handleGeotagging}
 disabled={loadingGps}
 className="flex flex-col items-center justify-center p-4 min-h-[88px] border-2 border-dashed border-emerald-300 rounded-sm hover:bg-emerald-50 transition-colors disabled:opacity-50"
 >
 <svg className="w-5 h-5 text-emerald-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
 </svg>
 <span className="text-xs font-bold text-emerald-600">
 {loadingGps ? 'Mencari...' : 'Geotagging'}
 </span>
 {data.coordinates && (
 <span className="text-[10px] text-slate-500 mt-1">
 {data.coordinates.lat.toFixed(4)}, {data.coordinates.lng.toFixed(4)}
 </span>
 )}
 </button>

 {/* Tombol Dokumentasi */}
 <button
 onClick={() => fileInputRef.current?.click()}
 className="flex flex-col items-center justify-center p-4 min-h-[88px] border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-sm hover:bg-slate-50 dark:bg-slate-800 transition-colors"
 >
 <svg className="w-5 h-5 text-slate-600 dark:text-slate-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
 </svg>
 <span className="text-xs font-bold text-slate-600 dark:text-slate-500">Dokumentasi</span>
 {data.photoUrl && (
 <span className="text-[10px] text-emerald-600 mt-1">✓ Foto Tersimpan</span>
 )}
 <input
 ref={fileInputRef}
 type="file"
 accept="image/*"
 onChange={handlePhotoUpload}
 className="hidden"
 />
 </button>
 </div>

 {/* GPS Error Message */}
 {gpsError && (
 <div className="bg-red-50 border border-red-200 rounded-sm p-3 flex items-start gap-2">
 <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 <span className="text-xs text-red-700">{gpsError}</span>
 </div>
 )}

 {/* Preview Foto */}
 {data.photoUrl && (
 <div className="relative rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700">
 <img src={data.photoUrl} alt="Dokumentasi" className="w-full h-32 object-cover" />
 <button
 onClick={() => updateData({ photoUrl: undefined })}
 className="absolute top-2 right-2 bg-white dark:bg-slate-900 text-red-500 p-1.5 rounded-sm hover:bg-red-50"
 >
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>
 )}
 </div>
 );
};
