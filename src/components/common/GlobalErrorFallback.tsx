import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Copy, CheckCheck } from 'lucide-react';

interface GlobalErrorFallbackProps {
 error: Error;
 resetErrorBoundary?: () => void;
 componentStack?: string | null;
}

/** Format tanggal/waktu standar ISO 8601 lokal WIB */
function formatTimestamp(): string {
 return new Date().toLocaleString('id-ID', {
 timeZone: 'Asia/Jakarta',
 year: 'numeric',
 month: '2-digit',
 day: '2-digit',
 hour: '2-digit',
 minute: '2-digit',
 second: '2-digit',
 });
}

/** Generate kode insiden 8 karakter untuk referensi dukungan teknis */
function generateIncidentId(): string {
 const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export const GlobalErrorFallback: React.FC<GlobalErrorFallbackProps> = ({
 error,
 resetErrorBoundary,
 componentStack,
}) => {
 const [isDetailOpen, setIsDetailOpen] = useState(false);
 const [copied, setCopied] = useState(false);

 // Stable incident ID & timestamp — dibuat sekali saat render error
 const [incidentId] = useState(() => generateIncidentId());
 const [timestamp] = useState(() => formatTimestamp());

 const handleGoHome = () => {
 window.location.href = '/';
 };

 const handleReset = () => {
 if (resetErrorBoundary) {
 resetErrorBoundary();
 }
 };

 const technicalReport = [
 `Kode Insiden : ${incidentId}`,
 `Waktu : ${timestamp}`,
 `Halaman : ${window.location.pathname}`,
 `Error : ${error.message}`,
 componentStack ? `Komponen :\n${componentStack.trim()}` : '',
 error.stack ? `Stack Trace :\n${error.stack}` : '',
 ]
 .filter(Boolean)
 .join('\n\n');

 const handleCopyReport = () => {
 navigator.clipboard.writeText(technicalReport).then(() => {
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 });
 };

 return (
 <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-800 p-4">
 {/* Card utama dengan garis atas pupr-yellow — identitas institusional */}
 <div
 className="bg-white dark:bg-slate-900 max-w-xl w-full rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
 style={{ borderTop: '4px solid #f2c114' }}
 >
 <div className="p-8">

 {/* Ikon peringatan */}
 <div className="flex justify-center">
 <div className="w-16 h-16 rounded-sm bg-red-50 border border-red-100 flex items-center justify-center">
 <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
 </div>
 </div>

 {/* Judul formal institusional */}
 <h1 className="text-xl font-bold text-pupr-blue text-center mt-4 tracking-tight">
 Terjadi Gangguan Sistem
 </h1>
 <p className="text-xs text-slate-500 text-center mt-1 font-mono tabular-nums">
 Kode Insiden: <span className="font-semibold text-slate-700 dark:text-slate-300">{incidentId}</span>
 &nbsp;·&nbsp;{timestamp} WIB
 </p>

 {/* Pesan formal */}
 <p className="text-sm text-slate-600 dark:text-slate-400 text-center mt-4 leading-relaxed">
 Sistem <strong className="text-pupr-blue">RekaSDA</strong> mengalami kendala teknis
 yang tidak terduga saat memproses permintaan. Silakan coba muat ulang halaman.
 Jika masalah berlanjut, catat kode insiden di atas dan hubungi administrator sistem.
 </p>

 {/* Divider */}
 <div className="border-t border-slate-100 my-5" />

 {/* Tombol aksi utama */}
 <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
 <button
 onClick={handleReset}
 className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-pupr-blue hover:bg-pupr-blue active:bg-[#0b3060] text-white text-sm font-semibold rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-pupr-blue focus:ring-offset-2"
 >
 <RefreshCw className="w-4 h-4" aria-hidden="true" />
 Muat Ulang
 </button>
 <button
 onClick={handleGoHome}
 className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 active:bg-slate-100 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-sm border border-slate-300 dark:border-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
 >
 <Home className="w-4 h-4" aria-hidden="true" />
 Beranda
 </button>
 </div>

 {/* Log teknis (progressive disclosure) */}
 <div className="mt-5">
 <button
 onClick={() => setIsDetailOpen(prev => !prev)}
 className="flex items-center justify-center gap-1.5 w-full text-xs text-slate-500 hover:text-slate-600 dark:text-slate-400 transition-colors py-1"
 aria-expanded={isDetailOpen}
 >
 {isDetailOpen
 ? <><ChevronUp className="w-3.5 h-3.5" />Sembunyikan Detail Teknis</>
 : <><ChevronDown className="w-3.5 h-3.5" />Lihat Detail Teknis</>
 }
 </button>

 {isDetailOpen && (
 <div className="mt-2 relative">
 <pre className="bg-slate-900 text-slate-200 text-[10px] leading-relaxed font-mono p-4 rounded-sm overflow-x-auto max-h-64 whitespace-pre-wrap break-words border border-slate-700">
 {technicalReport}
 </pre>
 {/* Tombol salin laporan untuk dikirim ke admin */}
 <button
 onClick={handleCopyReport}
 className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] rounded transition-colors"
 title="Salin laporan"
 >
 {copied
 ? <><CheckCheck className="w-3 h-3" />Tersalin</>
 : <><Copy className="w-3 h-3" />Salin</>
 }
 </button>
 </div>
 )}
 </div>

 {/* Footer institusional */}
 <div className="mt-5 pt-4 border-t border-slate-100">
 <p className="text-[11px] text-slate-500 text-center">
 RekaSDA Pro v1.1&nbsp;·&nbsp;Direktorat Jenderal Sumber Daya Air&nbsp;·&nbsp;Kementerian PUPR
 </p>
 </div>

 </div>
 </div>
 </div>
 );
};
