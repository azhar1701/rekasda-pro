import React, { useState, useEffect } from 'react';
import { getAllCalculations, deleteCalculationById, AllCalculationsData } from '@/services/allCalculationsService';
import { HistoryMap } from './HistoryMap';
import { CalculationType, ChannelShape } from '@/types/types';
import { manningPilotData } from '@/data/manningPilotData';
import { rationalPilotData, nakayasuPilotData } from '@/data/floodPilotData';
import { waterBalancePilotData } from '@/data/waterBalancePilotData';

type ViewMode = 'LIST' | 'MAP';

interface Props {
  onViewDetail?: (item: AllCalculationsData) => void;
  onConsultAI?: (item: AllCalculationsData) => void;
  onMapDetail?: (item: any) => void;
}

export const AllDataTab: React.FC<Props> = ({ onViewDetail, onConsultAI, onMapDetail }) => {
  const [data, setData] = useState<AllCalculationsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await getAllCalculations();
    setData(result);
    setLoading(false);
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

  const getTypeLabel = (type: string) => {
    if (type === 'manning') return 'Saluran';
    if (type === 'flood') return 'Banjir';
    if (type === 'water_balance') return 'Neraca Air';
    return type;
  };

  const getTypeColor = (type: string) => {
    if (type === 'manning') return 'bg-teal-50 text-teal-700';
    if (type === 'flood') return 'bg-purple-50 text-purple-700';
    if (type === 'water_balance') return 'bg-blue-50 text-blue-700';
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

  // Default coordinates for items without location
  const defaultCoordinates = [
    { latitude: -6.2088, longitude: 106.8456 },
    { latitude: -7.2575, longitude: 112.7521 },
    { latitude: -6.9175, longitude: 107.6191 },
    { latitude: -7.7956, longitude: 110.3695 },
    { latitude: -6.9932, longitude: 110.4203 },
    { latitude: -8.6500, longitude: 115.2167 },
  ];

  // Convert to CalculationResult format for map
  const dbMapData = data.map((item, index) => {
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
    
    if (!location || !location.latitude || !location.longitude) {
      const defaultCoord = defaultCoordinates[index % defaultCoordinates.length];
      location = {
        latitude: defaultCoord.latitude + (Math.random() - 0.5) * 0.1,
        longitude: defaultCoord.longitude + (Math.random() - 0.5) * 0.1
      };
    }
    
    return {
      id: item.id,
      type: item.type === 'manning' ? CalculationType.MANNING : CalculationType.RATIONAL,
      date: item.created_at,
      inputs: { 
        site: { 
          channelName: item.project_name,
          regency: item.data?.inputs?.site?.regency || item.data?.inputs?.site?.kabupaten || '',
          district: item.data?.inputs?.site?.district || item.data?.inputs?.site?.kecamatan || '',
          village: item.data?.inputs?.site?.village || item.data?.inputs?.site?.desa || ''
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
    const velocity = (1 / roughness) * Math.pow(hydraulicRadius, 2/3) * Math.pow(slope, 0.5);
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Database Proyek</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Kelola dan analisis riwayat perhitungan</p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="flex gap-2 p-2 bg-slate-100 rounded-xl">
          <button 
            onClick={() => setViewMode('LIST')}
            className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'LIST' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Daftar
          </button>
          <button 
            onClick={() => setViewMode('MAP')}
            className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'MAP' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Peta
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-600 mb-6">Belum ada data tersimpan</p>
        </div>
      ) : (
        <>
          {viewMode === 'MAP' ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-5">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 sm:mb-4">Peta Lokasi Proyek</h2>
              <HistoryMap data={mapData} onViewDetail={onMapDetail} />
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <p className="text-[10px] sm:text-xs text-slate-500">{mapData.length} lokasi terdata ({dbMapData.length} database + {pilotMapData.length} pilot)</p>
                <div className="flex gap-2 text-[10px] sm:text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Manning
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    Banjir
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    Neraca
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {data.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-5 border border-slate-200 hover:border-slate-300 transition-colors flex flex-col h-full">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(item.type)}`}>
                        {getTypeLabel(item.type)}
                      </div>
                      <button 
                        onClick={() => handleDelete(item.type, item.id)} 
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{item.project_name}</h3>
                    <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(item.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                    </p>
                    
                    <div className="mb-6 p-3 bg-slate-50 rounded-lg">
                      <span className="text-xs text-slate-500 block mb-1">
                        {item.type === 'water_balance' ? 'Total Supply' : 'Debit'}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">{getMainValue(item)}</span>
                        <span className="text-sm text-slate-500">m³/s</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-auto">
                    <button 
                      onClick={() => onViewDetail?.(item)} 
                      className="w-full py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Lihat Detail
                    </button>
                    <button 
                      onClick={() => onConsultAI?.(item)} 
                      className="w-full py-2.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      Analisis AI
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
