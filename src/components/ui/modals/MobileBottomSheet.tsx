import React, { useEffect } from 'react';

interface MobileBottomSheetProps {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 children: React.ReactNode;
 maxHeight?: string;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
 isOpen,
 onClose,
 title,
 children,
 maxHeight = '90vh'
}) => {
 useEffect(() => {
 if (isOpen) {
 document.body.style.overflow = 'hidden';
 } else {
 document.body.style.overflow = '';
 }
 return () => {
 document.body.style.overflow = '';
 };
 }, [isOpen]);

 if (!isOpen) return null;

 return (
 <>
 {/* Backdrop */}
 <div 
 className="fixed inset-0 bg-black/50 z-[100] animate-fade-in"
 onClick={onClose}
 />
 
 {/* Bottom Sheet - Mobile, Modal - Desktop */}
 <div 
 className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-[101]"
 onClick={onClose}
 >
 <div 
 className="bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-sm w-full md:max-w-2xl md:mx-4 animate-slide-up md:animate-fade-in"
 style={{ maxHeight }}
 onClick={e => e.stopPropagation()}
 >
 {/* Pull Indicator - Mobile Only */}
 <div className="md:hidden flex justify-center pt-3 pb-2">
 <div className="w-12 h-1.5 bg-slate-300 rounded-sm" />
 </div>
 
 {/* Header */}
 {title && (
 <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
 <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
 <button
 onClick={onClose}
 className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-slate-500 hover:text-slate-600 dark:text-slate-400 active:text-slate-800 dark:text-slate-200 transition-colors"
 >
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>
 )}
 
 {/* Content */}
 <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 120px)' }}>
 {children}
 </div>
 </div>
 </div>
 </>
 );
};
