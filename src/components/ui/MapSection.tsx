import React, { Suspense } from 'react';
import { SkeletonLoader } from './SkeletonLoader';

// Lazy load the heavy map component that relies on vendor-leaflet and @turf/turf
const WebGISPanel = React.lazy(() => import('@/features/spatial-analysis/WebGISPanel').then(m => ({ default: m.WebGISPanel })));

interface MapSectionProps {
  className?: string;
}

/**
 * MapSection acts as a lazy-loading wrapper for heavy geographic components.
 * It strictly adheres to the Flattened Design by utilizing the SkeletonLoader 
 * while the heavy Leaflet chunks (vendor-leaflet.js) download.
 */
export const MapSection: React.FC<MapSectionProps> = ({ className = '' }) => {
  return (
    <div className={`w-full h-full min-h-[400px] border border-slate-300 ${className}`}>
      <Suspense fallback={<SkeletonLoader className="w-full h-full min-h-[400px]" />}>
        <WebGISPanel />
      </Suspense>
    </div>
  );
};
