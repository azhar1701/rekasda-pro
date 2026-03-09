import React from 'react';
import { Dialog } from '@headlessui/react';
import { CalculationResult, CalculationType } from '@/types/types';
import { Button } from '@/components/ui/Button';
import { X, MapPin, Download, Info, Calendar, Clock, ExternalLink } from 'lucide-react';

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

  const renderSection = (title: string, obj: any, bgClass: string = "bg-slate-50/50") => {
    if (!obj) return null;
    return (
      <div className={`p-4 md:p-5 rounded-2xl ${bgClass} border border-slate-100 mb-4`}>
        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Info className="w-3 h-3" />
          {title}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
          {Object.entries(obj).map(([key, val]) => {
            // Skip complex objects and photoUrl
            if (key === 'site' || key === 'photoUrl' || typeof val === 'object') return null;
            return (
              <div key={key} className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase truncate tracking-tight">{formatLabel(key)}</span>
                <span className="text-sm font-extrabold text-slate-800 truncate tabular-nums" title={val?.toString()}>{val?.toString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen && !!data} onClose={onClose} className="relative z-[100]">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4">
        <Dialog.Panel className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200" role="dialog" aria-modal="true" aria-labelledby="detail-modal-title">
          {/* Header */}
          <div className="bg-pupr-blue text-white p-6 md:p-8 flex justify-between items-start shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-[0.1em] shadow-sm ${data?.type === CalculationType.MANNING ? 'bg-blue-500/20 text-blue-100 border border-blue-400/20' : 'bg-rose-500/20 text-rose-100 border border-rose-400/20'}`}>
                  {data?.type}
                </span>
                <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-bold uppercase tracking-wider">
                  <Calendar className="w-3 h-3" />
                  {data?.date ? new Date(data.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  <span className="mx-1">•</span>
                  <Clock className="w-3 h-3" />
                  {data?.date ? new Date(data.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </div>
              </div>
              <h3 id="detail-modal-title" className="text-2xl md:text-3xl font-extrabold italic leading-none tracking-tighter uppercase">
                {data?.inputs?.site?.channelName || 'Tanpa Nama Proyek'}
              </h3>
              {(() => {
                const fullAddress = [data?.inputs?.site?.village, data?.inputs?.site?.district, data?.inputs?.site?.regency].filter(Boolean).join(', ');
                return fullAddress && <p className="text-sm text-white/70 font-bold uppercase tracking-tight mt-2">{fullAddress}</p>;
              })()}
            </div>
            <button onClick={onClose} aria-label="Tutup" className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-2xl transition-all z-10 hover:scale-110 active:scale-95">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar bg-slate-50/30">

            {/* Visuals Grid */}
            {(data?.location || data?.photoUrl) && (
              <div className={`grid gap-5 mb-8 ${data?.location && data?.photoUrl ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {data?.location && (
                  <div className="bg-white p-1 rounded-2xl border border-slate-200 h-44 relative group overflow-hidden shadow-sm">
                    <div className="w-full h-full bg-slate-100 rounded-[1.25rem] flex items-center justify-center flex-col p-4">
                      <MapPin className="w-10 h-10 text-pupr-blue mb-3 opacity-40" />
                      <span className="text-sm font-mono font-extrabold text-slate-800 tabular-nums bg-white px-3 py-1.5 rounded-xl shadow-sm">
                        {data.location.latitude.toFixed(6)}, {data.location.longitude.toFixed(6)}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${data.location.latitude},${data.location.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 text-[10px] bg-pupr-blue px-4 py-2 rounded-xl shadow-lg shadow-pupr-blue/20 font-extrabold text-white hover:scale-105 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-widest"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Google Maps
                      </a>
                    </div>
                  </div>
                )}
                {data?.photoUrl && (
                  <div className="h-44 rounded-2xl overflow-hidden border border-slate-200 relative group shadow-sm">
                    <img src={data.photoUrl} alt="Dokumentasi Visual Lapangan" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-pupr-blue/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <a href={data.photoUrl} download={`dokumentasi-${data.id}.jpg`} className="bg-white text-pupr-blue px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                        <Download className="w-4 h-4" />
                        Unduh Foto
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main Data */}
            <div className="space-y-4">
              {renderSection("Data Masukan (Inputs)", data?.inputs)}
              {renderSection("Hasil Analisis (Outputs)", data?.outputs, "bg-white shadow-sm")}
            </div>

            {/* Notes */}
            {data?.notes && (
              <div className="mt-8 p-5 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm">
                <h4 className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" />
                  Catatan Lapangan
                </h4>
                <p className="text-sm text-slate-700 italic leading-relaxed font-medium">"{data.notes}"</p>
              </div>
            )}

            {/* Footer ID */}
            <div className="mt-10 pt-6 border-t border-slate-100 text-center opacity-30">
              <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest">ID Laporan Lacak: {data?.id}</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 bg-white shrink-0">
            <Button onClick={onClose} variant="secondary" className="w-full h-12 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-all active:scale-[0.98]">
              Tutup Detail Laporan
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
