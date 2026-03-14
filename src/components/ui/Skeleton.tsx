import React from 'react';

interface SkeletonProps {
 className?: string;
 variant?: 'text' | 'rectangular' | 'circular';
 width?: string;
 height?: string;
 count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
 className = '',
 variant = 'rectangular',
 width,
 height,
 count = 1
}) => {
 const baseClass = "animate-pulse bg-slate-200";
 
 const variantClass = {
 text: "h-4 rounded",
 rectangular: "rounded-sm",
 circular: "rounded-sm"
 };

 const style = {
 width: width || (variant === 'circular' ? '40px' : '100%'),
 height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '80px')
 };

 if (count > 1) {
 return (
 <div className="space-y-3">
 {Array.from({ length: count }).map((_, idx) => (
 <div 
 key={idx}
 className={`${baseClass} ${variantClass[variant]} ${className}`}
 style={style}
 />
 ))}
 </div>
 );
 }

 return (
 <div 
 className={`${baseClass} ${variantClass[variant]} ${className}`}
 style={style}
 />
 );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ 
 rows = 5, 
 cols = 4 
}) => {
 return (
 <div className="border border-pupr-border rounded-sm overflow-hidden">
 {/* Header */}
 <div className="bg-pupr-blue p-4 border-b border-pupr-border">
 <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
 {Array.from({ length: cols }).map((_, idx) => (
 <Skeleton key={idx} height="20px" />
 ))}
 </div>
 </div>
 {/* Rows */}
 <div className="divide-y divide-pupr-border">
 {Array.from({ length: rows }).map((_, rowIdx) => (
 <div key={rowIdx} className="p-4">
 <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
 {Array.from({ length: cols }).map((_, colIdx) => (
 <Skeleton key={colIdx} height="16px" />
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 );
};

export const SkeletonCard: React.FC = () => {
 return (
 <div className="bg-white dark:bg-slate-900 border border-pupr-border rounded-sm p-6 space-y-4">
 <Skeleton height="24px" width="60%" />
 <Skeleton height="16px" width="40%" />
 <div className="space-y-2 mt-4">
 <Skeleton height="12px" />
 <Skeleton height="12px" />
 <Skeleton height="12px" width="80%" />
 </div>
 </div>
 );
};
