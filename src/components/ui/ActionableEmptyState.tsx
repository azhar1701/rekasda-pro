import React from 'react';
import { FolderOpen, ArrowRight } from 'lucide-react';
import { ButtonGovTech } from './ButtonGovTech';

interface ActionableEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const ActionableEmptyState: React.FC<ActionableEmptyStateProps> = ({
  title = 'Data Belum Lengkap',
  description = 'Sistem membutuhkan input data tambahan melaui Master Data sebelum dapat memproses modul ini.',
  actionLabel = 'Lengkapi di Master Data',
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
    <div className="flex items-center justify-center min-h-[400px] p-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-md w-full">
        <div className="bg-white border border-slate-300 rounded-md p-8 text-center shadow-sm border-l-4 border-l-pupr-yellow">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-pupr-surface flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-pupr-blue/40" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>

          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            {description}
          </p>

          <ButtonGovTech
            onClick={handleAction}
            variant="pupr-primary"
            fullWidth
            className="shadow-md"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </ButtonGovTech>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 font-medium">
              <strong>Tip:</strong> Pastikan semua stasiun hujan dan koordinat DAS sudah diisi dengan benar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
