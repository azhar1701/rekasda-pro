import React, { useState, useEffect, useCallback } from 'react';
import { GeoLocationData } from '../types';

interface GPSLocationProps {
  onLocationUpdate: (location: GeoLocationData) => void;
  className?: string;
}

export const GPSLocation: React.FC<GPSLocationProps> = ({ onLocationUpdate, className = '' }) => {
  const [location, setLocation] = useState<GeoLocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy <= 5) return 'text-green-600 bg-green-100';
    if (accuracy <= 10) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAccuracyText = (accuracy: number) => {
    if (accuracy <= 5) return 'Sangat Akurat';
    if (accuracy <= 10) return 'Akurat';
    return 'Kurang Akurat';
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('GPS tidak didukung oleh browser ini');
      return;
    }

    setIsLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    };

    const successCallback = (position: GeolocationPosition) => {
      const locationData: GeoLocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };
      
      setLocation(locationData);
      onLocationUpdate(locationData);
      setIsLoading(false);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      setIsLoading(false);
      
      // Clear watch position on error to prevent battery drain
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setError('Akses lokasi ditolak. Aktifkan izin lokasi.');
          break;
        case error.POSITION_UNAVAILABLE:
          setError('Informasi lokasi tidak tersedia.');
          break;
        case error.TIMEOUT:
          setError('Timeout mendapatkan lokasi. Coba lagi.');
          break;
        default:
          setError('Terjadi kesalahan saat mendapatkan lokasi.');
          break;
      }
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
  }, [onLocationUpdate]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchId) return;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    };

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: GeoLocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        setLocation(locationData);
        onLocationUpdate(locationData);
      },
      (error) => {
        console.error('Watch position error:', error);
        // Clear watch on error
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
          setWatchId(null);
        }
      },
      options
    );

    setWatchId(id);
  }, [onLocationUpdate, watchId]);

  const stopWatching = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  useEffect(() => {
    return () => stopWatching();
  }, [stopWatching]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">Lokasi GPS</label>
        <div className="flex gap-2">
          <button
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Mencari...' : 'Dapatkan Lokasi'}
          </button>
          {location && (
            <button
              onClick={watchId ? stopWatching : startWatching}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                watchId 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {watchId ? 'Stop Tracking' : 'Track Lokasi'}
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm text-blue-700">Mendapatkan lokasi GPS...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {location && (
        <div className="p-3 bg-slate-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Koordinat</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAccuracyColor(location.accuracy)}`}>
              {getAccuracyText(location.accuracy)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Latitude:</span>
              <div className="font-mono font-medium">{location.latitude.toFixed(6)}</div>
            </div>
            <div>
              <span className="text-slate-500">Longitude:</span>
              <div className="font-mono font-medium">{location.longitude.toFixed(6)}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Akurasi: ±{location.accuracy.toFixed(1)}m</span>
            {watchId && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Tracking aktif</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};