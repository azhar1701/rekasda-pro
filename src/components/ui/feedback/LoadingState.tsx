import React from 'react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Memuat data...', 
  size = 'md' 
}) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`${sizes[size]} relative flex items-center justify-center`}>
        {/* Formal GovTech Loading Indicator (Pulsing Square) */}
        <div className="absolute inset-0 bg-slate-200 rounded-md animate-pulse"></div>
        <div className="absolute inset-0 border-2 border-pupr-blue rounded-md border-t-transparent animate-spin"></div>
      </div>
      {message && (
        <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>
      )}
    </div>
  );
};
