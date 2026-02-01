import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CalculationResult } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ProgressiveHistoryProps {
  data: CalculationResult[];
  loading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  pageSize?: number;
  renderItem: (item: CalculationResult, index: number) => React.ReactNode;
  className?: string;
}

export const ProgressiveHistory: React.FC<ProgressiveHistoryProps> = ({
  data,
  loading,
  onLoadMore,
  hasMore = false,
  pageSize = 10,
  renderItem,
  className = ''
}) => {
  const [displayCount, setDisplayCount] = useState(pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const displayedItems = useMemo(() => {
    return data.slice(0, displayCount);
  }, [data, displayCount]);

  const canLoadMore = displayCount < data.length || hasMore;

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    
    if (displayCount < data.length) {
      // Load more from existing data
      setTimeout(() => {
        setDisplayCount(prev => Math.min(prev + pageSize, data.length));
        setIsLoadingMore(false);
      }, 300);
    } else if (onLoadMore && hasMore) {
      // Load more from server
      try {
        await onLoadMore();
      } catch (error) {
        console.error('Error loading more data:', error);
      } finally {
        setIsLoadingMore(false);
      }
    } else {
      setIsLoadingMore(false);
    }
  }, [displayCount, data.length, hasMore, onLoadMore, pageSize, isLoadingMore]);

  // Auto-load more when scrolling near bottom with throttling
  useEffect(() => {
    let throttleTimer: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        if (isLoadingMore || !canLoadMore) {
          throttleTimer = null;
          return;
        }

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;

        if (scrollTop + clientHeight >= scrollHeight - 1000) {
          handleLoadMore();
        }
        
        throttleTimer = null;
      }, 100); // Throttle to 100ms
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [handleLoadMore, canLoadMore, isLoadingMore]);

  // Reset display count when data changes
  useEffect(() => {
    setDisplayCount(pageSize);
  }, [data.length, pageSize]);

  if (loading && data.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" text="Memuat data..." />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-slate-500 font-medium">Belum ada data tersimpan</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {displayedItems.map((item, index) => (
          <div
            key={item.id}
            className="animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Load More Section */}
      {canLoadMore && (
        <div className="mt-8 text-center">
          {isLoadingMore ? (
            <LoadingSpinner text="Memuat lebih banyak..." />
          ) : (
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
            >
              Muat Lebih Banyak ({data.length - displayCount} tersisa)
            </button>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      {data.length > pageSize && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600">
            <span>Menampilkan {displayedItems.length} dari {data.length}</span>
            <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(displayedItems.length / data.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};