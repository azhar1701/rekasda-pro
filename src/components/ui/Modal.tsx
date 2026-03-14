import { ReactNode, useEffect, useId, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 children: ReactNode;
 size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
 const titleId = useId();
 const modalRef = useRef<HTMLDivElement>(null);
 const previousFocusRef = useRef<HTMLElement | null>(null);

 const handleKeyDown = useCallback((e: KeyboardEvent) => {
  if (e.key === 'Escape') {
   onClose();
   return;
  }

  if (e.key === 'Tab' && modalRef.current) {
   const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
   );
   
   if (focusableElements.length === 0) return;

   const firstElement = focusableElements[0];
   const lastElement = focusableElements[focusableElements.length - 1];

   if (e.shiftKey) {
    if (document.activeElement === firstElement) {
     lastElement.focus();
     e.preventDefault();
    }
   } else {
    if (document.activeElement === lastElement) {
     firstElement.focus();
     e.preventDefault();
    }
   }
  }
 }, [onClose]);

 useEffect(() => {
  if (isOpen) {
   previousFocusRef.current = document.activeElement as HTMLElement;
   document.body.style.overflow = 'hidden';
   document.addEventListener('keydown', handleKeyDown);
   
   // Focus the modal or first focusable element
   if (modalRef.current) {
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
     'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
     focusableElements[0].focus();
    } else {
     modalRef.current.focus();
    }
   }
  } else {
   document.body.style.overflow = 'unset';
   document.removeEventListener('keydown', handleKeyDown);
   if (previousFocusRef.current) {
    previousFocusRef.current.focus();
   }
  }

  return () => {
   document.body.style.overflow = 'unset';
   document.removeEventListener('keydown', handleKeyDown);
  };
 }, [isOpen, handleKeyDown]);

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
  aria-hidden="true"
  />

  {/* Modal */}
  <div 
   ref={modalRef}
   role="dialog"
   aria-modal="true"
   aria-labelledby={title ? titleId : undefined}
   tabIndex={-1}
   className={`relative glass-strong rounded-sm w-full ${sizes[size]} max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200`}
  >
  {/* Header */}
  {title && (
  <div className="px-6 py-4 border-b border-white/20 flex items-center justify-between">
   <h2 id={titleId} className="text-xl font-bold text-neutral-900">{title}</h2>
   <button
   type="button"
   onClick={onClose}
   aria-label="Tutup dialog"
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
