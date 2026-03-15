import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer aria-label="Informasi RekaSDA Pro" className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 py-3 px-6 mt-auto z-10 relative">
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-4">
          <span className="font-bold text-pupr-blue tracking-wider">RekaSDA Pro v1.1.0</span>
          <span className="hidden md:inline text-slate-300 dark:text-slate-700">•</span>
          <span className="hidden md:inline font-medium">© {new Date().getFullYear()} Hak Cipta Dilindungi</span>
        </div>
        <div className="flex items-center gap-4 font-medium">
          <a href="#" className="hover:text-pupr-blue transition-colors">Pusat Bantuan</a>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <a href="#" className="hover:text-pupr-blue transition-colors">Referensi SNI 2415:2016</a>
        </div>
      </div>
    </footer>
  );
};
