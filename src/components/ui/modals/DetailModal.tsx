
import React from 'react';
import { Dialog } from '@headlessui/react';
import { CalculationResult, CalculationType } from '@/types/types';
import { Button } from '@/components/ui/forms/Button';

interface Props {
 isOpen: boolean;
 data: CalculationResult | null;
 onClose: () => void;
}

export const DetailModal: React.FC<Props> = ({ isOpen, data, onClose }) => {
 if (!data) return null;

 const formatLabel = (key: string): string => {
 // Dictionary for specific technical terms
 const dictionary: Record<string, string> = {
 channelName: "Nama Saluran",
 regency: "Kabupaten/Kota",
 district: "Kecamatan",
 village: "Desa/Kelurahan",
 shape: "Bentuk Penampang",
 roughness: "Koefisien Kekasaran (n)",
 slope: "Kemiringan Saluran (S)",
 width: "Lebar Dasar (b)",
 topWidth: "Lebar Atas (B)",
 diameter: "Diameter (D)",
 depth: "Tinggi Muka Air (h)",
 totalDepth: "Tinggi Total (H)",
 sideSlope: "Kemiringan Tebing (z)",
 runoffCoefficient: "Koefisien Limpasan (C)",
 area: "Luas DAS (A)",
 rainfallDesign: "Hujan Rencana (R24)",
 flowLength: "Panjang Alur (L)",
 catchmentSlope: "Kemiringan Lahan (S)",
 Discharge: "Kapasitas Debit (Q)",
 Velocity: "Kecepatan Aliran (V)",
 Froude: "Bilangan Froude (Fr)",
 FlowType: "Tipe Aliran",
 Freeboard: "Tinggi Jagaan",
 SafetyStatus: "Status Keamanan",
 ShearStress: "Tegangan Geser Dasar",
 Area: "Luas Penampang Basah (A)",
 Perimeter: "Keliling Basah (P)",
 Radius: "Jari-jari Hidrolis (R)",
 TopWidth: "Lebar Atas (T)",
 SpecificEnergy: "Energi Spesifik (E)",
 CriticalDepth: "Kedalaman Kritis (yc)",
 CriticalSlope: "Kemiringan Kritis (Ic)",
 Tc: "Waktu Konsentrasi (Tc)",
 Intensity: "Intensitas Hujan (I)"
 };

 if (dictionary[key]) return dictionary[key];

 // Fallback: insert space before capital letters
 return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
 };

 const renderSection = (title: string, obj: any, bgClass: string = "bg-slate-50 dark:bg-slate-800") => {
 if (!obj) return null;
 return (
 <div className={`p-4 md:p-5 rounded-sm ${bgClass} border border-slate-100 mb-4`}>
 <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
 {title}
 </h4>
 <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
 {Object.entries(obj).map(([key, val]) => {
 // Skip complex objects and photoUrl
 if (key === 'site' || key === 'photoUrl' || typeof val === 'object') return null;
 return (
 <div key={key} className="flex flex-col">
 <span className="text-[10px] text-slate-500 font-medium uppercase truncate">{formatLabel(key)}</span>
 <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate" title={val?.toString()}>{val?.toString()}</span>
 </div>
 );
 })}
 </div>
 </div>
 );
 };

 return (
 <Dialog open={isOpen && !!data} onClose={onClose} className="relative z-[100]">
 <div className="fixed inset-0" aria-hidden="true" />
 <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4">
 <Dialog.Panel className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] overflow-hidden max-h-[90vh] flex flex-col">
 {/* Header */}
 <div className="bg-slate-900 text-white p-5 md:p-6 flex justify-between items-start shrink-0 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-white dark:bg-slate-900 rounded-sm blur-2xl -translate-y-10 translate-x-10"></div>
 <div className="relative z-10">
 <div className="flex items-center gap-2 mb-2">
 <span className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-wide ${data?.type === CalculationType.MANNING ? 'bg-pupr-surface0/20 text-blue-100' : 'bg-red-500/20 text-red-100'}`}>
 {data?.type}
 </span>
 <span className="text-slate-500 text-[10px] font-mono">{data?.date ? new Date(data.date).toLocaleString('id-ID') : '-'}</span>
 </div>
 <h3 className="text-xl md:text-2xl font-extrabold leading-tight">
 {data?.inputs?.site?.channelName || 'Tanpa Nama Proyek'}
 </h3>
 {(() => {
 const fullAddress = [data?.inputs?.site?.village, data?.inputs?.site?.district, data?.inputs?.site?.regency].filter(Boolean).join(', ');
 return fullAddress && <p className="text-sm text-slate-300 font-medium mt-1">{fullAddress}</p>;
 })()}
 </div>
 <button onClick={onClose} className="bg-white dark:bg-slate-900 hover:bg-white dark:bg-slate-900 text-white p-2 rounded-sm transition-colors z-10">
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
 </button>
 </div>

 {/* Scrollable Content */}
 <div className="p-5 md:p-6 overflow-y-auto no-scrollbar">

 {/* Visuals Grid */}
 {(data?.location || data?.photoUrl) && (
 <div className={`grid gap-4 mb-6 ${data?.location && data?.photoUrl ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
 {data?.location && (
 <div className="bg-slate-50 dark:bg-slate-800 p-1 rounded-sm border border-slate-200 dark:border-slate-700 h-40 relative group overflow-hidden">
 {/* Simple Static Map Placeholder */}
 <div className="w-full h-full bg-slate-200 rounded-sm flex items-center justify-center flex-col">
 <svg className="w-8 h-8 text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
 <span className="text-xs font-mono font-bold text-slate-500">{data.location.latitude.toFixed(5)}, {data.location.longitude.toFixed(5)}</span>
 <a
 href={`https://www.google.com/maps/search/?api=1&query=${data.location.latitude},${data.location.longitude}`}
 target="_blank"
 rel="noreferrer"
 className="mt-2 text-[10px] bg-white dark:bg-slate-900 px-3 py-1 rounded-sm font-bold text-safety-blue transition-transform"
 >
 Buka Google Maps
 </a>
 </div>
 </div>
 )}
 {data?.photoUrl && (
 <div className="h-48 md:h-40 rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
 <img src={data.photoUrl} alt="Dokumentasi" className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
 <a href={data.photoUrl} download="dokumentasi_lapangan.jpg" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-1 rounded-sm text-[10px] font-bold uppercase ">Unduh Foto</a>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Main Data */}
 <div className="space-y-2">
 {renderSection("Data Masukan", data?.inputs)}
 {renderSection("Hasil Analisis", data?.outputs, "bg-pupr-surface/50")}
 </div>

 {/* Notes */}
 {data?.notes && (
 <div className="mt-6 p-4 bg-yellow-50 rounded-sm border border-yellow-100">
 <h4 className="text-[10px] font-extrabold text-yellow-600 uppercase tracking-widest mb-2">Catatan Lapangan</h4>
 <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">"{data.notes}"</p>
 </div>
 )}

 {/* Footer ID */}
 <div className="mt-8 pt-4 border-t border-slate-100 text-center">
 <p className="text-[10px] text-slate-300 font-mono">ID Laporan: {data?.id}</p>
 </div>
 </div>

 {/* Footer Actions */}
 <div className="p-4 border-t border-slate-100 bg-white dark:bg-slate-900 shrink-0">
 <Button fullWidth onClick={onClose} variant="outline" className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-500">
 Tutup Detail
 </Button>
 </div>
 </Dialog.Panel>
 </div>
 </Dialog>
 );
};
