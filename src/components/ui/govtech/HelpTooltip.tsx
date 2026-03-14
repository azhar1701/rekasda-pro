import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
 content: string;
 title?: string;
 position?: 'top' | 'bottom' | 'left' | 'right';
 className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
 content,
 title,
 position = 'top',
 className
}) => {
 const [isVisible, setIsVisible] = useState(false);
 const tooltipRef = useRef<HTMLDivElement>(null);

 // Harden: Close on click outside
 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
 setIsVisible(false);
 }
 };
 if (isVisible) {
 document.addEventListener('mousedown', handleClickOutside);
 }
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, [isVisible]);

 const positionClasses = {
 top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
 bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
 left: 'right-full top-1/2 -translate-y-1/2 mr-2',
 right: 'left-full top-1/2 -translate-y-1/2 ml-2'
 };

 const arrowClasses = {
 top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900',
 bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900',
 left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900',
 right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900'
 };

 return (
 <div className={cn("relative inline-block ml-1.5 align-middle", className)} ref={tooltipRef}>
 <button
 type="button"
 onMouseEnter={() => setIsVisible(true)}
 onMouseLeave={() => setIsVisible(false)}
 onClick={() => setIsVisible(!isVisible)}
 onFocus={() => setIsVisible(true)}
 onBlur={() => setIsVisible(false)}
 className="text-slate-500 hover:text-pupr-blue transition-colors outline-none focus:ring-2 focus:ring-pupr-blue/20 rounded-sm p-0.5"
 aria-label="Informasi bantuan"
 >
 <HelpCircle className="w-3.5 h-3.5" />
 </button>
 {isVisible && (
 <div 
 role="tooltip"
 className={cn(
 "absolute z-[100] w-64 p-3 bg-slate-900 text-white text-[11px] rounded-sm animate-in fade-in zoom-in-95 duration-200 pointer-events-none",
 positionClasses[position]
 )}
 >
 {title && <div className="font-bold border-b border-white/10 pb-1 mb-1 uppercase tracking-wider">{title}</div>}
 <div className="leading-relaxed font-medium opacity-90">{content}</div>
 <div className={cn("absolute border-4 border-transparent", arrowClasses[position])} />
 </div>
 )}
 </div>
 );
};
