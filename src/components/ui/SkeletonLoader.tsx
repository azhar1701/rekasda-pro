import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

/**
 * SkeletonLoader — Base skeleton adhering to Flattened Design.
 *
 * Rules:
 * - Solid flat colors (bg-slate-100)
 * - 1px solid border (border-slate-300)
 * - Hard opacity flash animation, no gradient pulses
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  width = '100%',
  height = '100%',
}) => {
  return (
    <div
      className={`bg-slate-100 border border-slate-300 animate-flash ${className}`}
      style={{ width, height }}
    />
  );
};

/**
 * SkeletonTable — Structural skeleton mimicking a data table layout.
 */
export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className = '',
}) => {
  return (
    <div className={`border border-slate-300 ${className}`}>
      {/* Header */}
      <div className="flex gap-px bg-slate-200 border-b-2 border-slate-300 p-2">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-slate-300 animate-flash" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={`flex gap-px p-2 border-b border-slate-200 ${
            rowIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'
          }`}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div key={colIdx} className="flex-1 h-3 bg-slate-100 animate-flash" />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonMap — Structural skeleton for the Leaflet map panel.
 */
export const SkeletonMap: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-slate-100 border border-slate-300 animate-flash min-h-[400px] flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="w-12 h-12 bg-slate-200 border border-slate-300 mx-auto mb-3 flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <p className="text-xs text-slate-400 font-mono">Loading map tiles...</p>
      </div>
    </div>
  );
};

/**
 * SkeletonChart — Structural skeleton for Recharts panels.
 */
export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-slate-100 border border-slate-300 animate-flash h-64 flex items-end justify-center gap-2 p-4 ${className}`}>
      {[40, 65, 45, 80, 55, 70, 35, 60].map((h, i) => (
        <div
          key={i}
          className="w-6 bg-slate-200 border border-slate-300 transition-none"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
};
