import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 children: ReactNode;
 size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
 useEffect(() => {
 if (isOpen) {
 document.body.style.overflow = 'hidden';
 } else {
 document.body.style.overflow = 'unset';
 }
 return () => {
 document.body.style.overflow = 'unset';
 };
 }, [isOpen]);

 if (!isOpen) return null;

 const sizes = {
 sm: 'max-w-md',
 md: 'max-w-2xl',
 lg: 'max-w-4xl',
 xl: 'max-w-6xl',
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 {/* Backdrop */}
 <div
 className="absolute inset-0 bg-neutral-900/40 "
 onClick={onClose}
 />

 {/* Modal */}
 <div className={`relative glass-strong rounded-sm w-full ${sizes[size]} max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200`}>
 {/* Header */}
 {title && (
 <div className="px-6 py-4 border-b border-white/20 flex items-center justify-between">
 <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
 <button
 onClick={onClose}
 className="w-8 h-8 flex items-center justify-center rounded-sm glass hover:bg-white dark:bg-slate-900 transition-colors"
 >
 <X className="w-5 h-5 text-neutral-700" />
 </button>
 </div>
 )}

 {/* Content */}
 <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
 {children}
 </div>
 </div>
 </div>
 );
}
