import React, { useState, useEffect } from 'react';
import { locationService } from '../services/locationService';

interface LocationSelectorProps {
  onLocationChange: (location: {
    kabupaten: string;
    kecamatan: string;
    desa: string;
    coordinates?: { latitude: number; longitude: number };
  }) => void;
  initialValues?: {
    kabupaten?: string;
    kecamatan?: string;
    desa?: string;
  };
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ 
  onLocationChange, 
  initialValues 
}) => {
  const [selectedKabupaten, setSelectedKabupaten] = useState(initialValues?.kabupaten || '');
  const [selectedKecamatan, setSelectedKecamatan] = useState(initialValues?.kecamatan || '');
  const [selectedDesa, setSelectedDesa] = useState(initialValues?.desa || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kabupatenList, setKabupatenList] = useState<string[]>([]);
  const [kecamatanList, setKecamatanList] = useState<string[]>([]);
  const [desaList, setDesaList] = useState<string[]>([]);

  useEffect(() => {
    const initData = async () => {
      try {
        setError(null);
        console.log('Initializing location data...');
        await locationService.init();
        const kabupatenData = locationService.getKabupaten();
        console.log('Loaded kabupaten data:', kabupatenData.length, 'items');
        setKabupatenList(kabupatenData);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing location data:', error);
        setError(`Gagal memuat data lokasi: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (selectedKabupaten) {
      setKecamatanList(locationService.getKecamatan(selectedKabupaten));
    } else {
      setKecamatanList([]);
    }
  }, [selectedKabupaten]);

  useEffect(() => {
    if (selectedKabupaten && selectedKecamatan) {
      setDesaList(locationService.getDesa(selectedKabupaten, selectedKecamatan));
    } else {
      setDesaList([]);
    }
  }, [selectedKabupaten, selectedKecamatan]);

  const handleKabupatenChange = (value: string) => {
    setSelectedKabupaten(value);
    setSelectedKecamatan('');
    setSelectedDesa('');
  };

  const handleKecamatanChange = (value: string) => {
    setSelectedKecamatan(value);
    setSelectedDesa('');
  };

  const handleDesaChange = (value: string) => {
    setSelectedDesa(value);
    
    if (value && selectedKabupaten && selectedKecamatan) {
      const locationData = locationService.getLocationData(selectedKabupaten, selectedKecamatan, value);
      onLocationChange({
        kabupaten: selectedKabupaten,
        kecamatan: selectedKecamatan,
        desa: value,
        coordinates: locationData ? {
          latitude: locationData.latitude!,
          longitude: locationData.longitude!
        } : undefined
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Kabupaten/Kota */}
      <div>
        <label htmlFor="select-kabupaten" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          Kabupaten/Kota
        </label>
        <select
          id="select-kabupaten"
          name="kabupaten"
          value={selectedKabupaten}
          onChange={(e) => handleKabupatenChange(e.target.value)}
          disabled={loading || error !== null}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">
            {loading ? 'Loading...' : error ? 'Error loading data' : 'Pilih Kabupaten/Kota'}
          </option>
          {!error && kabupatenList.map((kabupaten) => (
            <option key={kabupaten} value={kabupaten}>
              {kabupaten}
            </option>
          ))}
        </select>
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Kecamatan */}
      <div>
        <label htmlFor="select-kecamatan" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          Kecamatan
        </label>
        <select
          id="select-kecamatan"
          name="kecamatan"
          value={selectedKecamatan}
          onChange={(e) => handleKecamatanChange(e.target.value)}
          disabled={!selectedKabupaten}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">Pilih Kecamatan</option>
          {kecamatanList.map((kecamatan) => (
            <option key={kecamatan} value={kecamatan}>
              {kecamatan}
            </option>
          ))}
        </select>
      </div>

      {/* Desa/Kelurahan */}
      <div>
        <label htmlFor="select-desa" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          Desa/Kelurahan
        </label>
        <select
          id="select-desa"
          name="desa"
          value={selectedDesa}
          onChange={(e) => handleDesaChange(e.target.value)}
          disabled={!selectedKecamatan}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">Pilih Desa/Kelurahan</option>
          {desaList.map((desa) => (
            <option key={desa} value={desa}>
              {desa}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};