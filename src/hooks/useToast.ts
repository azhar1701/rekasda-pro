import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
 id: string;
 message: string;
 type: ToastType;
 duration?: number;
}

let toastListeners: ((toast: Toast) => void)[] = [];

export const useToast = () => {
 const [toasts, setToasts] = useState<Toast[]>([]);

 const show = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
 const id = `toast-${Date.now()}-${Math.random()}`;
 const toast: Toast = { id, message, type, duration };
 
 setToasts(prev => [...prev, toast]);
 toastListeners.forEach(listener => listener(toast));

 if (duration > 0) {
 setTimeout(() => {
 setToasts(prev => prev.filter(t => t.id !== id));
 }, duration);
 }
 }, []);

 const dismiss = useCallback((id: string) => {
 setToasts(prev => prev.filter(t => t.id !== id));
 }, []);

 return { toasts, show, dismiss };
};

export const toast = {
 success: (message: string) => {
 toastListeners.forEach(listener => 
 listener({ id: `toast-${Date.now()}`, message, type: 'success', duration: 4000 })
 );
 },
 error: (message: string) => {
 toastListeners.forEach(listener => 
 listener({ id: `toast-${Date.now()}`, message, type: 'error', duration: 5000 })
 );
 },
 warning: (message: string) => {
 toastListeners.forEach(listener => 
 listener({ id: `toast-${Date.now()}`, message, type: 'warning', duration: 4000 })
 );
 },
 info: (message: string) => {
 toastListeners.forEach(listener => 
 listener({ id: `toast-${Date.now()}`, message, type: 'info', duration: 3000 })
 );
 },
 subscribe: (listener: (toast: Toast) => void) => {
 toastListeners.push(listener);
 return () => {
 toastListeners = toastListeners.filter(l => l !== listener);
 };
 }
};
