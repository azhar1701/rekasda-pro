import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface GlobalErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

export const GlobalErrorFallback: React.FC<GlobalErrorFallbackProps> = ({ error }) => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white max-w-lg w-full rounded-md shadow-lg border border-slate-200 overflow-hidden border-t-4 border-[#f2c114]">
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-[#0c3a66] text-center mt-4">
            Terjadi Gangguan Sistem
          </h1>

          {/* Message */}
          <p className="text-sm text-slate-600 text-center mt-2 leading-relaxed">
            Mohon maaf, sistem RekaSDA mengalami kendala teknis saat memproses data. 
            Silakan muat ulang halaman atau hubungi administrator jika masalah berlanjut.
          </p>

          {/* Technical Details (Progressive Disclosure) */}
          <details className="mt-4">
            <summary className="text-xs text-slate-500 cursor-pointer text-center hover:text-slate-700 transition-colors">
              Lihat Detail Teknis
            </summary>
            <div className="bg-slate-100 p-3 rounded text-xs font-mono text-slate-700 overflow-x-auto mt-2 border border-slate-200">
              <p className="font-semibold text-red-600 mb-1">Error Message:</p>
              <p className="whitespace-pre-wrap break-words">{error.message}</p>
              {error.stack && (
                <>
                  <p className="font-semibold text-red-600 mt-3 mb-1">Stack Trace:</p>
                  <pre className="whitespace-pre-wrap text-[10px] leading-tight">{error.stack}</pre>
                </>
              )}
            </div>
          </details>

          {/* Call to Action Buttons */}
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={handleReload}
              className="px-6 py-2.5 bg-[#0c3a66] hover:bg-[#0d4578] text-white text-sm font-semibold rounded-md transition-colors shadow-sm"
            >
              Muat Ulang Halaman
            </button>
            <button
              onClick={handleGoHome}
              className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-md border border-slate-300 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              RekaSDA Pro v1.1 · Kementerian PUPR
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
