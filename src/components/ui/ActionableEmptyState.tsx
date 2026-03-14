import React from 'react';
import { FolderOpen, ArrowRight } from 'lucide-react';
import { Button } from './Button';

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
 <div className="flex items-center justify-center min-h-[400px] p-6 animate-in fade-in zoom-in-95 duration-75">
 <div className="max-w-md w-full">
 <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm p-8 text-center border-l-4 border-l-pupr-yellow">
 <div className="w-16 h-16 mx-auto mb-6 rounded-sm bg-pupr-surface flex items-center justify-center">
 <FolderOpen className="w-8 h-8 text-pupr-blue/40" />
 </div>

 <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>

 <p className="text-sm text-slate-500 mb-8 leading-relaxed">
 {description}
 </p>

      <Button
        onClick={handleAction}
        variant="pupr-primary"
        fullWidth
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

 <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
 <p className="text-xs text-slate-500 font-medium">
 <strong>Tip:</strong> Pastikan semua stasiun hujan dan koordinat DAS sudah diisi dengan benar.
 </p>
 </div>
 </div>
 </div>
 </div>
 );
};
