import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);
  const [lastStatus, setLastStatus] = useState<'online' | 'offline'>(navigator.onLine ? 'online' : 'offline');

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setLastStatus('online');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setLastStatus('offline');
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-300">
        <WifiOff className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">
          Mode Offline Aktif — Data akan disimpan lokal secara otomatis
        </span>
      </div>
    );
  }

  if (showNotification && lastStatus === 'online') {
    return (
      <div className="fixed bottom-24 right-6 z-[100] bg-pupr-blue text-white p-4 rounded-sm shadow-lg border-l-4 border-pupr-yellow flex items-center gap-4 animate-in slide-in-from-bottom duration-500">
        <div className="bg-white/20 p-2 rounded-none">
          <Wifi className="w-5 h-5 text-pupr-yellow" />
        </div>
        <div>
          <p className="text-sm font-bold">Koneksi Terhubung</p>
          <p className="text-[10px] text-blue-100 uppercase tracking-tight">Menyinkronkan data ke server...</p>
        </div>
        <button 
          onClick={() => setShowNotification(false)}
          className="ml-2 p-1 hover:bg-white/10 rounded-sm transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
};
