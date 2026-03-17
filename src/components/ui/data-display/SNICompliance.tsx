import React from 'react';
import { cn } from '@/lib/utils';

interface SNIBadgeProps {
  standard: string;
  description?: string;
  size?: 'sm' | 'md';
}

export const SNIBadge: React.FC<SNIBadgeProps> = ({ 
  standard, 
  description,
  size = 'sm' 
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5';
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 font-medium rounded-sm",
        sizeClasses
      )}
      title={description}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      {standard}
    </span>
  );
};

interface SNIFooterProps {
  standard: string;
  title: string;
  className?: string;
}

export const SNIFooter: React.FC<SNIFooterProps> = ({ standard, title, className }) => {
  return (
    <div className={cn("mt-6 pt-4 border-t border-slate-200 dark:border-slate-700", className)}>
      <p className="text-xs text-slate-500 flex items-center gap-2">
        <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>Perhitungan ini mengacu pada standar <strong className="font-semibold text-slate-700 dark:text-slate-300">{standard}</strong> {title}.</span>
      </p>
    </div>
  );
};

interface SNITooltipLabelProps {
  label: string;
  tooltip: string;
  sniRef?: string;
  className?: string;
}

export const SNITooltipLabel: React.FC<SNITooltipLabelProps> = ({ 
  label, 
  tooltip,
  sniRef,
  className
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <div className="group relative">
        <svg className="w-4 h-4 text-slate-500 hover:text-teal-600 cursor-help transition-colors" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64">
          <div className="bg-slate-900 text-white text-xs rounded-sm p-3 ">
            <p className="mb-1">{tooltip}</p>
            {sniRef && (
              <p className="text-teal-300 font-semibold mt-2 pt-2 border-t border-slate-700">
                📘 {sniRef}
              </p>
            )}
            <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
