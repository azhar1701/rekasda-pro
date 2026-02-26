import React from 'react';
import { FolderOpen, ArrowRight } from 'lucide-react';

interface ActionableEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const ActionableEmptyState: React.FC<ActionableEmptyStateProps> = ({
  title = 'Data Hujan Wilayah Belum Tersedia',
  description = 'Sistem membutuhkan data curah hujan tahunan untuk melakukan perhitungan statistik ekstrem.',
  actionLabel = 'Kembali ke Master Data',
  onAction
}) => {
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      const event = new CustomEvent('navigateToTab', { detail: 'MASTER' });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[500px] p-6">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
            <FolderOpen className="w-10 h-10 text-slate-400" />
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
          
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            {description}
          </p>

          <button
            onClick={handleAction}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200/50"
          >
            <span>👉 {actionLabel}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              <strong>Langkah Selanjutnya:</strong> Lengkapi data curah hujan wilayah di menu Master Data terlebih dahulu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
