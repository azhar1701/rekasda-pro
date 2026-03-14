import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface SuccessCelebrationProps {
 message: string;
 duration?: number;
 onComplete?: () => void;
}

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
 message,
 duration = 4000,
 onComplete
}) => {
 const [isVisible, setIsVisible] = useState(true);

 useEffect(() => {
 const timer = setTimeout(() => {
 setIsVisible(false);
 setTimeout(() => onComplete?.(), 500);
 }, duration);

 return () => clearTimeout(timer);
 }, [duration, onComplete]);

 if (!isVisible) return null;

 return (
 <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[11000] animate-in slide-in-from-top-4 duration-75">
 <div className="bg-white dark:bg-slate-900 border-2 border-green-500 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.1)] px-6 py-4 flex items-center gap-4 border-l-[12px]">
 <div className="bg-green-100 p-2 rounded-sm animate-bounce">
 <CheckCircle2 className="w-6 h-6 text-green-600" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg tracking-tight">Capaian Baru!</h4>
 <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
 </div>
 <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{message}</p>
 </div>
 </div>
 </div>
 );
};
