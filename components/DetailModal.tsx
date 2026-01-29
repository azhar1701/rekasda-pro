
import React from 'react';
import { CalculationResult, CalculationType } from '../types';
import { Button } from './Button';

interface Props {
  isOpen: boolean;
  data: CalculationResult | null;
  onClose: () => void;
}

export const DetailModal: React.FC<Props> = ({ isOpen, data, onClose }) => {
  if (!isOpen || !data) return null;

  // Helper to format labels from camelCase/PascalCase to readable text
  const formatLabel = (key: string): string => {
    // Dictionary for specific technical terms
    const dictionary: Record<string, string> = {
      channelName: "Nama Saluran",
      regency: "Kabupaten/Kota",
      district: "Kecamatan",
      village: "Desa/Kelurahan",
      shape: "Bentuk Penampang",
      roughness: "Kekasaran Manning (n)",
      slope: "Kemiringan Dasar (S)",
      width: "Lebar Dasar (b)",
      topWidth: "Lebar Atas (B)",
      diameter: "Diameter (D)",
      depth: "Tinggi Air (h)",
      totalDepth: "Tinggi Total (H)",
      sideSlope: "Kemiringan Tebing (z)",
      runoffCoefficient: "Koefisien Limpasan (C)",
      area: "Luas DAS (A)",
      rainfallDesign: "Hujan Rencana (R24)",
      flowLength: "Panjang Alur (L)",
      catchmentSlope: "Kemiringan Lahan (S)",
      Discharge: "Debit (Q)",
      Velocity: "Kecepatan (V)",
      Froude: "Bilangan Froude (Fr)",
      FlowType: "Tipe Aliran",
      Freeboard: "Tinggi Jagaan",
      SafetyStatus: "Status Keamanan",
      ShearStress: "Tegangan Geser",
      Tc: "Waktu Konsentrasi (Tc)",
      Intensity: "Intensitas Hujan (I)"
    };

    if (dictionary[key]) return dictionary[key];

    // Fallback: insert space before capital letters
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  };

  const renderSection = (title: string, obj: any, bgClass: string = "bg-slate-50") => {
    if (!obj) return null;
    return (
      <div className={`p-4 md:p-5 rounded-2xl ${bgClass} border border-slate-100 mb-4`}>
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">
          {title}
        </h4>
        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
          {Object.entries(obj).map(([key, val]) => {
            // Skip complex objects like 'site' inside inputs as it's handled separately
            if (key === 'site' || typeof val === 'object') return null;
            return (
              <div key={key} className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-medium uppercase">{formatLabel(key)}</span>
                <span className="text-sm font-bold text-slate-800 break-words">{val?.toString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 md:p-6 flex justify-between items-start shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide ${data.type === CalculationType.MANNING ? 'bg-blue-500/20 text-blue-100' : 'bg-red-500/20 text-red-100'}`}>
                    {data.type}
                </span>
                <span className="text-slate-400 text-[10px] font-mono">{new Date(data.date).toLocaleString('id-ID')}</span>
             </div>
            <h3 className="text-xl md:text-2xl font-black leading-tight">
                {data.inputs.site?.channelName || 'Tanpa Nama Proyek'}
            </h3>
            <p className="text-sm text-slate-300 font-medium mt-1">
                {data.inputs.site?.village}, {data.inputs.site?.district}, {data.inputs.site?.regency}
            </p>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-5 md:p-6 overflow-y-auto no-scrollbar">
            
            {/* Visuals Grid */}
            {(data.location || data.photoUrl) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {data.location && (
                        <div className="bg-slate-50 p-1 rounded-2xl border border-slate-200 h-40 relative group overflow-hidden">
                             {/* Simple Static Map Placeholder */}
                            <div className="w-full h-full bg-slate-200 rounded-xl flex items-center justify-center flex-col">
                                <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span className="text-xs font-mono font-bold text-slate-500">{data.location.latitude.toFixed(5)}, {data.location.longitude.toFixed(5)}</span>
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${data.location.latitude},${data.location.longitude}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="mt-2 text-[10px] bg-white px-3 py-1 rounded-full shadow-sm font-bold text-safety-blue hover:scale-105 transition-transform"
                                >
                                    Buka Google Maps
                                </a>
                            </div>
                        </div>
                    )}
                    {data.photoUrl ? (
                        <div className="h-40 rounded-2xl overflow-hidden border border-slate-200 relative group">
                            <img src={data.photoUrl} alt="Dokumentasi" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <a href={data.photoUrl} download="dokumentasi_lapangan.jpg" className="bg-white/90 text-slate-900 px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-lg">Unduh Foto</a>
                            </div>
                        </div>
                    ) : (
                        <div className="h-40 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                             <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             <span className="text-[10px] font-bold uppercase">Tidak ada foto</span>
                        </div>
                    )}
                </div>
            )}

            {/* Main Data */}
            <div className="space-y-2">
                {renderSection("Parameter Input", data.inputs)}
                {renderSection("Hasil Analisis (Output)", data.outputs, "bg-blue-50/50")}
            </div>

            {/* Notes */}
            {data.notes && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                    <h4 className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-2">Catatan Lapangan</h4>
                    <p className="text-sm text-slate-700 italic leading-relaxed">"{data.notes}"</p>
                </div>
            )}

             {/* Footer ID */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-300 font-mono">ID Laporan: {data.id}</p>
            </div>
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
             <Button fullWidth onClick={onClose} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                Tutup Laporan
             </Button>
        </div>
      </div>
    </div>
  );
};
