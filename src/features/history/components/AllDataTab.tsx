import React, { useState, useEffect } from 'react';
import { getAllCalculations, deleteCalculationById, AllCalculationsData } from '@/services/allCalculationsService';
import { HistoryMap } from './HistoryMap';
import { CalculationType, ChannelShape } from '@/types/types';
import { manningPilotData } from '@/data/manningPilotData';
import { rationalPilotData } from '@/data/floodPilotData';
import { waterBalancePilotData } from '@/data/waterBalancePilotData';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/services/api.service';
import { getCurrentLocation } from '@/lib/utils/geolocation';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Database } from 'lucide-react';

type ViewMode = 'LIST' | 'MAP';

interface Props {
  onViewDetail?: (item: AllCalculationsData) => void;
  onConsultAI?: (item: AllCalculationsData) => void;
  onMapDetail?: (item: any) => void;
}

export const AllDataTab: React.FC<Props> = ({ onViewDetail, onConsultAI, onMapDetail }) => {
  const [data, setData] = useState<AllCalculationsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [focusItemId, setFocusItemId] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await getAllCalculations();
    setData(result);
    setLoading(false);
  };

  const handleSearchNearby = async () => {
    setIsSearchingNearby(true);
    try {
      const pos = await getCurrentLocation();
      const response = await apiService.findNearbyCalculations(pos.latitude, pos.longitude, 10000); // 10km radius

      if (response.status === 'success' && response.data) {
        // Map new schema to display format
        const nearbyItems: AllCalculationsData[] = response.data.map((item: any) => ({
          id: item.id,
          type: item.calculation_type === 'manning' ? 'manning' : 'flood',
          project_name: item.site_name,
          created_at: item.created_at,
          data: {
            inputs: item.input_data,
            results: item.result_data
          },
          location: item.location
        }));

        if (nearbyItems.length === 0) {
          alert('Tidak ditemukan perhitungan lain dalam radius 10km.');
        } else {
          setData(nearbyItems);
        }
      }
    } catch (error) {
      console.error('Search nearby failed', error);
      alert('Gagal mencari lokasi. Pastikan izin lokasi aktif.');
    } finally {
      setIsSearchingNearby(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!window.confirm('Hapus data ini?')) return;

    const { error } = await deleteCalculationById(type, id);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      loadData();
    }
  };

  const handleShowOnMap = (item: AllCalculationsData) => {
    setViewMode('MAP');
    // Set focus after view mode changes
    setTimeout(() => {
      setFocusItemId(item.id);
    }, 100);
  };

  const getTypeLabel = (type: string) => {
    if (type === 'manning') return 'Saluran';
    if (type === 'flood') return 'Banjir';
    if (type === 'water_balance') return 'Neraca Air';
    return type;
  };

  const getTypeColor = (type: string) => {
    if (type === 'manning') return 'bg-blue-100 text-blue-700';
    if (type === 'flood') return 'bg-red-100 text-red-700';
    if (type === 'water_balance') return 'bg-green-100 text-green-700';
    return 'bg-slate-50 text-slate-700';
  };

  const getMainValue = (item: AllCalculationsData) => {
    if (item.type === 'manning') {
      return item.data.results?.Discharge || '-';
    } else if (item.type === 'flood') {
      return item.data.results?.qPeak?.toFixed(2) || '-';
    } else if (item.type === 'water_balance') {
      const totalSupply = item.data.monthly_inputs?.monthlySupply?.reduce((a: number, b: number) => a + b, 0);
      return totalSupply?.toFixed(1) || '-';
    }
    return '-';
  };

  // Convert to CalculationResult format for map - ONLY items with valid GPS
  const dbMapData = data
    .filter(item => {
      // Check if item has valid location
      let location = item.location;

      if (!location && item.type === 'manning' && item.data?.inputs?.site?.location) {
        location = item.data.inputs.site.location;
      }

      if (!location && item.type === 'flood') {
        location = item.data?.inputs?.location || item.data?.inputs?.site?.location;
      }

      if (!location && item.type === 'water_balance' && item.data?.monthly_inputs?.location) {
        location = item.data.monthly_inputs.location;
      }

      // Only include if has valid GPS coordinates
      return location && location.latitude && location.longitude;
    })
    .map((item) => {
      const location = item.location ||
        (item.type === 'manning' && item.data?.inputs?.site?.location) ||
        (item.type === 'flood' && (item.data?.inputs?.location || item.data?.inputs?.site?.location)) ||
        (item.type === 'water_balance' && item.data?.monthly_inputs?.location);

      const calcType: CalculationType = item.type === 'manning' ? CalculationType.MANNING :
        item.type === 'water_balance' ? CalculationType.WATER_BALANCE :
          CalculationType.RATIONAL;

      // Extract location details based on type
      let regency = '';
      let district = '';
      let village = '';

      if (item.type === 'manning') {
        regency = item.data?.inputs?.site?.regency || item.data?.inputs?.site?.kabupaten || '';
        district = item.data?.inputs?.site?.district || item.data?.inputs?.site?.kecamatan || '';
        village = item.data?.inputs?.site?.village || item.data?.inputs?.site?.desa || '';
      } else if (item.type === 'flood') {
        regency = item.data?.inputs?.regency || item.data?.inputs?.kabupaten || '';
        district = item.data?.inputs?.district || item.data?.inputs?.kecamatan || '';
        village = item.data?.inputs?.village || item.data?.inputs?.desa || '';
      } else if (item.type === 'water_balance') {
        regency = item.data?.monthly_inputs?.regency || item.data?.monthly_inputs?.kabupaten || '';
        district = item.data?.monthly_inputs?.district || item.data?.monthly_inputs?.kecamatan || '';
        village = item.data?.monthly_inputs?.village || item.data?.monthly_inputs?.desa || '';
      }

      return {
        id: item.id,
        type: calcType,
        date: item.created_at,
        inputs: {
          site: {
            channelName: item.project_name,
            regency,
            district,
            village
          },
          shape: ChannelShape.TRAPEZOID,
          roughness: 0,
          slope: 0,
          width: 0,
          topWidth: 0,
          diameter: 0,
          depth: 0,
          totalDepth: 0,
          sideSlope: 0
        },
        outputs: { Discharge: getMainValue(item) },
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: 10,
          timestamp: Date.now()
        }
      };
    });

  // Helper function to calculate Manning discharge
  const calculateManningDischarge = (inputs: any) => {
    const { width, depth, slope, roughness, sideSlope } = inputs;
    const area = width * depth + sideSlope * depth * depth;
    const wettedPerimeter = width + 2 * depth * Math.sqrt(1 + sideSlope * sideSlope);
    const hydraulicRadius = area / wettedPerimeter;
    const velocity = (1 / roughness) * Math.pow(hydraulicRadius, 2 / 3) * Math.pow(slope, 0.5);
    const discharge = area * velocity;
    return discharge.toFixed(2);
  };

  // Helper function to calculate Rational discharge
  const calculateRationalDischarge = (inputs: any) => {
    const { C, A, I } = inputs;
    const discharge = (0.00278 * C * I * A);
    return discharge.toFixed(2);
  };

  // Add pilot data to map
  const pilotMapData = [
    ...manningPilotData.map((pilot, idx) => {
      const discharge = calculateManningDischarge(pilot.inputs);
      return {
        id: `pilot-manning-${idx}`,
        type: CalculationType.MANNING,
        date: new Date().toISOString(),
        inputs: {
          site: {
            channelName: pilot.location.channelName,
            regency: pilot.location.kabupaten,
            district: pilot.location.kecamatan,
            village: pilot.location.desa
          },
          ...pilot.inputs
        },
        outputs: { Discharge: discharge },
        location: pilot.location.coordinates ? {
          latitude: pilot.location.coordinates.lat,
          longitude: pilot.location.coordinates.lng,
          accuracy: 10,
          timestamp: Date.now()
        } : undefined
      };
    }),
    ...rationalPilotData.map((pilot, idx) => {
      const discharge = calculateRationalDischarge(pilot.inputs);
      return {
        id: `pilot-rational-${idx}`,
        type: CalculationType.RATIONAL,
        date: new Date().toISOString(),
        inputs: {
          site: {
            channelName: pilot.location.channelName,
            regency: pilot.location.kabupaten,
            district: pilot.location.kecamatan,
            village: pilot.location.desa
          },
          shape: ChannelShape.TRAPEZOID,
          roughness: 0,
          slope: 0,
          width: 0,
          topWidth: 0,
          diameter: 0,
          depth: 0,
          totalDepth: 0,
          sideSlope: 0
        },
        outputs: { Discharge: discharge },
        location: pilot.location.coordinates ? {
          latitude: pilot.location.coordinates.lat,
          longitude: pilot.location.coordinates.lng,
          accuracy: 10,
          timestamp: Date.now()
        } : undefined
      };
    }),
    ...waterBalancePilotData.map((pilot, idx) => {
      const totalSupply = pilot.inputs.monthlySupply.reduce((a, b) => a + b, 0);
      return {
        id: `pilot-water-${idx}`,
        type: CalculationType.WATER_BALANCE,
        date: new Date().toISOString(),
        inputs: {
          site: {
            channelName: pilot.location.channelName,
            regency: pilot.location.kabupaten,
            district: pilot.location.kecamatan,
            village: pilot.location.desa
          },
          shape: ChannelShape.TRAPEZOID,
          roughness: 0,
          slope: 0,
          width: 0,
          topWidth: 0,
          diameter: 0,
          depth: 0,
          totalDepth: 0,
          sideSlope: 0
        },
        outputs: { Discharge: totalSupply.toFixed(1) },
        location: pilot.location.coordinates ? {
          latitude: pilot.location.coordinates.lat,
          longitude: pilot.location.coordinates.lng,
          accuracy: 10,
          timestamp: Date.now()
        } : undefined
      };
    })
  ].filter(item => item.location);

  const mapData = [...dbMapData, ...pilotMapData];

  return (
    <ModuleLayout
      title="Daftar Proyek"
      description="Database riwayat perhitungan RekaSDA"
      icon={<Database className="w-6 h-6" />}
      iconColorClass="bg-indigo-50 text-indigo-600"
    >
      <div className="space-y-6 pb-6 page-enter relative z-10">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading || isSearchingNearby}
              className="rounded-xl font-bold text-xs"
            >
              <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSearchNearby}
              disabled={loading || isSearchingNearby}
              className="rounded-xl font-bold text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100"
            >
              <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {isSearchingNearby ? 'Mencari...' : 'Cari di Sekitar'}
            </Button>
          </div>

          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setViewMode('LIST')}
              className={`flex-1 sm:flex-none py-1.5 px-4 rounded-lg text-xs font-bold transition-all ${viewMode === 'LIST' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Daftar
            </button>
            <button
              onClick={() => setViewMode('MAP')}
              className={`flex-1 sm:flex-none py-1.5 px-4 rounded-lg text-xs font-bold transition-all ${viewMode === 'MAP' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Peta
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-inner text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 rotate-3 shadow-sm border border-white">
              <Database className="w-10 h-10 text-indigo-400 -rotate-3" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Database Kosong</h3>
            <p className="text-sm text-slate-500 max-w-sm">Belum ada riwayat perhitungan yang tersimpan. Mulai buat perhitungan di modul terkait untuk melihat datanya di sini.</p>
          </div>
        ) : (
          <>
            {viewMode === 'MAP' ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-5">
                <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 sm:mb-4">Peta Lokasi Proyek</h2>
                <HistoryMap data={mapData} onViewDetail={onMapDetail} focusItemId={focusItemId} />
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <p className="text-[10px] sm:text-xs text-slate-500">{mapData.length} lokasi terdata ({dbMapData.length} database + {pilotMapData.length} pilot)</p>
                  <div className="flex gap-3 text-[10px] sm:text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></span>
                      Saluran Manning
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></span>
                      Banjir Rasional
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
                      Neraca Air
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {data.map((item) => (
                  <div key={item.id} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-5 hover:border-indigo-300/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/50 to-transparent rounded-bl-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase shadow-sm border border-white/50 ${getTypeColor(item.type)}`}>
                          {getTypeLabel(item.type)}
                        </div>
                        <button
                          onClick={() => handleDelete(item.type, item.id)}
                          className="p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors z-10"
                          title="Hapus"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 leading-tight group-hover:text-indigo-900 transition-colors">{item.project_name}</h3>
                      <p className="text-[11px] font-medium text-slate-500 mb-5 flex items-center gap-1.5 uppercase tracking-wide">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>

                      <div className="mb-6 p-4 bg-gradient-to-br from-white/80 to-white/40 border border-white/60 shadow-inner rounded-xl group-hover:bg-white transition-colors duration-300">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                          {item.type === 'water_balance' ? 'Total Ketersediaan' : item.type === 'flood' ? 'Debit Puncak' : 'Kapasitas Saluran'}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-slate-800 tracking-tight font-mono">{getMainValue(item)}</span>
                          <span className="text-sm font-semibold text-slate-400">m³/s</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-auto z-10">
                      <button
                        onClick={() => handleShowOnMap(item)}
                        className="w-full py-2.5 text-[13px] font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center gap-2 border border-blue-100/50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Peta
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onViewDetail?.(item)}
                          className="w-full py-2.5 text-[13px] font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm rounded-xl transition-all"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => onConsultAI?.(item)}
                          className="w-full py-2.5 text-[13px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/50 hover:bg-indigo-100 rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          AI
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ModuleLayout>
  );
};
