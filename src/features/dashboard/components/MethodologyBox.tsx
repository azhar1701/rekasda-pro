import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Info, HelpCircle } from 'lucide-react';
import { getMethodology, MethodologyBlock } from '@/lib/constants/methodologyContent';

interface MethodologyBoxProps {
  metodologiKey: string;
  defaultExpanded?: boolean;
  className?: string;
}

export const MethodologyBox: React.FC<MethodologyBoxProps> = ({
  metodologiKey,
  defaultExpanded = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const data: MethodologyBlock = getMethodology(metodologiKey);

  return (
    <div
      className={`border border-slate-200 rounded-md bg-slate-50/70 text-slate-800 text-xs mb-3 overflow-hidden transition-all duration-200 print:bg-white print:border-slate-300 print:mb-3 print:block print:overflow-visible print-avoid-break ${className}`}
    >
      {/* Header bar */}
      <div className="bg-slate-100/90 px-3 py-1.5 flex items-center justify-between border-b border-slate-200 print:bg-slate-50 print:border-slate-300">
        <div className="flex items-center gap-2 flex-wrap">
          <BookOpen className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <span className="font-bold text-slate-900 uppercase tracking-wide text-[10.5px]">
            Dasar Teori & Metodologi: {data.namaMetode}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 print:border-slate-400 print:text-slate-800 print:bg-transparent">
            {data.standarRujukan}
          </span>
        </div>

        {/* Screen-only toggle button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="no-print p-0.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded transition-colors focus:outline-none"
          title={isOpen ? 'Sembunyikan detail metodologi' : 'Tampilkan detail metodologi'}
        >
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Content body: toggleable on screen, ALWAYS visible on print */}
      <div className={`p-3 space-y-2.5 ${isOpen ? 'block' : 'hidden'} print:block print:visible print:overflow-visible`}>
        {/* Narasi singkat */}
        <p className="text-slate-700 text-[11px] leading-relaxed text-justify">
          {data.narasiSingkat}
        </p>

        {/* Kotak Persamaan Utama */}
        <div className="bg-white border border-slate-200 rounded p-2 shadow-xs print:border-slate-400 print:bg-slate-50/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Persamaan Matematis Utama:
            </span>
            <span className="text-[9px] text-slate-400 font-mono">Formula SNI</span>
          </div>
          <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200/80 text-center tracking-wide print:bg-white print:border-slate-300">
            {data.persamaanUtama}
          </div>

          {/* Persamaan turunan / tambahan */}
          {data.persamaanTambahan && data.persamaanTambahan.length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10.5px] font-mono text-slate-700 space-y-0.5 print:border-slate-200">
              <span className="text-[9.5px] font-sans font-semibold text-slate-500 block">
                Persamaan Pendukung & Parameterisasi:
              </span>
              {data.persamaanTambahan.map((pers, idx) => (
                <div key={idx} className="pl-2 border-l-2 border-blue-400 text-slate-800">
                  {pers}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabel Keterangan Variabel & Satuan */}
        {data.keteranganVariabel && data.keteranganVariabel.length > 0 && (
          <div className="border border-slate-200 rounded overflow-hidden print:overflow-visible print:border-slate-300">
            <div className="bg-slate-100/70 px-2.5 py-1 border-b border-slate-200 font-bold text-[10px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3 h-3 text-slate-500" />
              Keterangan Notasi Simbol & Satuan Teknis
            </div>
            <table className="w-full text-left text-[10.5px] border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-1 px-2.5 w-16 font-mono">Simbol</th>
                  <th className="py-1 px-2 w-20">Satuan</th>
                  <th className="py-1 px-2.5">Keterangan / Deskripsi Variabel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white print:divide-slate-200">
                {data.keteranganVariabel.map((v, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                    <td className="py-1 px-2.5 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {v.simbol}
                    </td>
                    <td className="py-1 px-2 text-slate-600 font-mono text-[10px] whitespace-nowrap">
                      {v.satuan}
                    </td>
                    <td className="py-1 px-2.5 text-slate-700 leading-snug">
                      {v.keterangan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Batas Keberlakuan / Catatan Kriteria SNI */}
        {data.batasKeberlakuan && (
          <div className="flex items-start gap-1.5 bg-amber-50/60 border border-amber-200 rounded p-2 text-[10px] text-amber-900 print:bg-white print:border-slate-300 print:text-slate-800">
            <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5 print:text-slate-600" />
            <div className="leading-snug">
              <strong className="font-bold text-amber-950 print:text-slate-900">Batas Keberlakuan & Kriteria Teknis: </strong>
              {data.batasKeberlakuan}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
