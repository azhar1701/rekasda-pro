import React, { useState, useEffect } from 'react';
import { locationService } from '@/services/locationService';
import { SelectWithSearch } from '@/components/ui/SelectWithSearch';

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
      const allKecamatan = locationService.getKecamatan(selectedKabupaten);
      setKecamatanList(allKecamatan.filter(k => k !== 'BELUM TERIDENTIFIKASI'));
    } else {
      setKecamatanList([]);
    }
  }, [selectedKabupaten]);

  useEffect(() => {
    if (selectedKabupaten && selectedKecamatan) {
      const allDesa = locationService.getDesa(selectedKabupaten, selectedKecamatan);
      setDesaList(allDesa.filter(d => d !== 'BELUM TERIDENTIFIKASI'));
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
    <div className="space-y-3">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      
      <SelectWithSearch
        label="Kabupaten/Kota"
        options={kabupatenList.filter(k => k !== 'BELUM TERIDENTIFIKASI').map(k => ({ value: k, label: k }))}
        value={selectedKabupaten}
        onChange={handleKabupatenChange}
        placeholder={loading ? 'Memuat...' : 'Pilih Kabupaten/Kota'}
        disabled={loading || error !== null}
      />

      <SelectWithSearch
        label="Kecamatan"
        options={kecamatanList.map(k => ({ value: k, label: k }))}
        value={selectedKecamatan}
        onChange={handleKecamatanChange}
        placeholder="Pilih Kecamatan"
        disabled={!selectedKabupaten}
      />

      <SelectWithSearch
        label="Desa/Kelurahan"
        options={desaList.map(d => ({ value: d, label: d }))}
        value={selectedDesa}
        onChange={handleDesaChange}
        placeholder="Pilih Desa/Kelurahan"
        disabled={!selectedKecamatan}
      />
    </div>
  );
};