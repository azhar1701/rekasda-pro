import React, { useState, useEffect, useMemo } from 'react';
import { getAllCalculations, deleteCalculationById, AllCalculationsData } from '@/services/allCalculationsService';
import { HistoryMap } from './HistoryMap';
import { CalculationType, ChannelShape } from '@/types/types';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/services/api.service';
import { getCurrentLocation } from '@/lib/utils/geolocation';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Database, MapPin, Eye, Bot, Trash2, List, Search, Clock, Map as MapIcon, RefreshCw } from 'lucide-react';
import { TableGovTech } from '@/components/ui/TableGovTech';
import { toast } from '@/hooks/useToast';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';

type ViewMode = 'LIST' | 'MAP';

interface Props {
  onViewDetail?: (item: AllCalculationsData) => void;
  onConsultAI?: (item: AllCalculationsData) => void;
  onMapDetail?: (item: any) => void;
}

export const AllDataTab: React.FC<Props> = ({ onViewDetail, onMapDetail }) => {
  const [data, setData] = useState<AllCalculationsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [focusItemId, setFocusItemId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await getAllCalculations();
    setData(result);
    setLoading(false);
  };

  // --- Derived Metrics for Top Strip ---
  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const types = data.map(d => d.type);
    const manningCount = types.filter(t => t === 'manning').length;
    const floodCount = types.filter(t => t === 'flood').length;
    const wbCount = types.filter(t => t === 'water_balance').length;
    
    const dates = data.map(d => new Date(d.created_at).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    return {
      total: data.length,
      manningCount,
      floodCount,
      wbCount,
      dateRange: `${minDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} - ${maxDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`
    };
  }, [data]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter(item => 
      item.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  // Rest of helper functions (getTypeLabel, getTypeColor, getMainValue, etc.) kept for logic
  const getTypeLabel = (type: string) => {
    if (type === 'manning') return 'Saluran';
    if (type === 'flood') return 'Banjir';
    if (type === 'water_balance') return 'Neraca';
    return type;
  };

  const getTypeColor = (type: string) => {
    if (type === 'manning') return 'text-pupr-blue border-blue-200 bg-blue-50';
    if (type === 'flood') return 'text-rose-600 border-rose-200 bg-rose-50';
    if (type === 'water_balance') return 'text-emerald-600 border-emerald-200 bg-emerald-50';
    return 'text-slate-500 border-slate-200 bg-slate-50';
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

  const handleSearchNearby = async () => {
    setIsSearchingNearby(true);
    try {
      const pos = await getCurrentLocation();
      const response = await apiService.findNearbyCalculations(pos.latitude, pos.longitude, 10000);
      if (response.status === 'success' && response.data) {
        const nearbyItems: AllCalculationsData[] = response.data.map((item: any) => ({
          id: item.id,
          type: item.calculation_type === 'manning' ? 'manning' : 'flood',
          project_name: item.site_name,
          created_at: item.created_at,
          data: { inputs: item.input_data, results: item.result_data },
          location: item.location
        }));
        if (nearbyItems.length === 0) {
          toast.info('Tidak ditemukan perhitungan lain dalam radius 10km.');
        } else {
          setData(nearbyItems);
        }
      }
    } catch (error) {
      toast.error('Gagal mencari lokasi. Pastikan izin lokasi aktif.');
    } finally { setIsSearchingNearby(false); }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!window.confirm('Hapus data ini?')) return;
    const { error } = await deleteCalculationById(type, id);
    if (error) toast.error('Gagal menghapus: ' + error.message);
    else loadData();
  };

  // --- Map Data Processing (Corrected to match CalculationResult type) ---
  const mapData = useMemo(() => {
    return data.filter(item => {
      let loc = item.location || (item.type === 'manning' && item.data?.inputs?.site?.location) || 
                (item.type === 'flood' && (item.data?.inputs?.location || item.data?.inputs?.site?.location)) ||
                (item.type === 'water_balance' && item.data?.monthly_inputs?.location);
      return loc && loc.latitude && loc.longitude;
    }).map(item => {
      const loc = item.location || (item.type === 'manning' && item.data?.inputs?.site?.location) || 
                  (item.type === 'flood' && (item.data?.inputs?.location || item.data?.inputs?.site?.location)) ||
                  (item.type === 'water_balance' && item.data?.monthly_inputs?.location);
      
      const calcType: CalculationType = item.type === 'manning' ? CalculationType.MANNING : 
                        item.type === 'water_balance' ? CalculationType.WATER_BALANCE : 
                        CalculationType.RATIONAL;

      return {
        id: item.id,
        type: calcType,
        date: item.created_at,
        inputs: { 
          site: { channelName: item.project_name },
          // Fill required properties to satisfy type system
          shape: ChannelShape.TRAPEZOID,
          roughness: 0,
          slope: 0,
          width: 0,
          topWidth: 0,
          diameter: 0,
          depth: 0,
          totalDepth: 0,
          sideSlope: 0,
          // Rational specific
          runoffCoefficient: 0,
          area: 0,
          rainfallDesign: 0,
          flowLength: 0,
          catchmentSlope: 0
        } as any, // Cast to any temporarily to bypass the strict union check while maintaining enough structure for the map
        outputs: { Discharge: getMainValue(item) },
        location: { latitude: loc.latitude, longitude: loc.longitude, accuracy: 10, timestamp: Date.now() }
      };
    });
  }, [data]);

  const tableColumns = [
    { key: 'date', label: 'Tanggal', align: 'left' as const },
    { key: 'project', label: 'Identitas Proyek', align: 'left' as const },
    { key: 'type', label: 'Modul', align: 'center' as const },
    { key: 'value', label: 'Nilai Utama', align: 'right' as const, numeric: true },
    { key: 'actions', label: 'Aksi', align: 'center' as const }
  ];

  const tableData = filteredData.map((item) => ({
    date: (
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-slate-900 tabular-nums">
          {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
        <span className="text-[9px] text-slate-400 font-medium tabular-nums">
          {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    ),
    type: (
      <span className={`inline-flex px-2 py-0.5 rounded-sm text-[9px] font-black tracking-widest uppercase border ${getTypeColor(item.type)}`}>
        {getTypeLabel(item.type)}
      </span>
    ),
    project: (
      <div className="flex flex-col max-w-[280px]">
        <span className="font-bold text-slate-800 truncate leading-tight tracking-tight" title={item.project_name}>{item.project_name}</span>
        <span className="text-[9px] text-slate-400 uppercase font-black tracking-tighter truncate mt-0.5">ID: {item.id.split('-')[0]}</span>
      </div>
    ),
    value: (
      <div className="flex items-baseline justify-end gap-1.5">
        <span className="font-black text-slate-900 tabular-nums text-sm">{getMainValue(item)}</span>
        <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">m³/s</span>
      </div>
    ),
    actions: (
      <div className="flex items-center justify-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
        <button onClick={() => { setViewMode('MAP'); setTimeout(() => setFocusItemId(item.id), 100); }} className="p-1.5 text-slate-400 hover:text-pupr-blue hover:bg-white border border-transparent hover:border-slate-200 transition-all" title="Lihat Peta">
          <MapPin className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onViewDetail?.(item)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all" title="Detail">
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => handleDelete(item.type, item.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all" title="Hapus">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }));

  return (
    <ModuleLayout
      title="Riwayat Audit"
      description="Database hasil perhitungan dan pemodelan hidrologi"
      icon={<Clock className="w-6 h-6" />}
    >
      <div className="space-y-8 pb-12 page-enter relative z-10">
        <ProjectContextBanner />

        {/* --- Top Metrics Summary Strip --- */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-b border-slate-200 dark:border-slate-800 pb-8">
            <div className="space-y-1">
              <p className="text-4xl font-light text-slate-900 tracking-tighter tabular-nums">{stats.total}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Catatan</p>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-light text-pupr-blue tracking-tighter tabular-nums">{stats.manningCount}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model Saluran</p>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-light text-rose-600 tracking-tighter tabular-nums">{stats.floodCount}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analisis Banjir</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800 mt-2">{stats.dateRange}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rentang Data</p>
            </div>
          </div>
        )}

        {/* --- Main Workstation Body --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Sidebar Controls */}
          <aside className="lg:col-span-1 space-y-10">
            {/* View Selection */}
            <section className="space-y-4">
              <header className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue" />
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tampilan</h3>
              </header>
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => setViewMode('LIST')}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-all rounded-sm border ${viewMode === 'LIST' ? 'bg-pupr-blue text-white border-pupr-blue shadow-lg shadow-blue-500/10' : 'text-slate-600 border-transparent hover:bg-slate-100'}`}
                >
                  <List className="w-4 h-4" />
                  Daftar Tabel
                </button>
                <button 
                  onClick={() => setViewMode('MAP')}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-all rounded-sm border ${viewMode === 'MAP' ? 'bg-pupr-blue text-white border-pupr-blue shadow-lg shadow-blue-500/10' : 'text-slate-600 border-transparent hover:bg-slate-100'}`}
                >
                  <MapIcon className="w-4 h-4" />
                  Peta Spasial
                </button>
              </div>
            </section>

            {/* Filter/Search */}
            <section className="space-y-4">
              <header className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue" />
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pencarian</h3>
              </header>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Nama Proyek..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 focus:outline-none focus:border-pupr-blue transition-colors rounded-sm font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  fullWidth 
                  className="justify-start gap-3 rounded-sm text-xs font-bold border-slate-200"
                  onClick={loadData}
                  disabled={loading}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Segarkan Database
                </Button>
                <Button 
                  variant="secondary" 
                  fullWidth 
                  className="justify-start gap-3 rounded-sm text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100"
                  onClick={handleSearchNearby}
                  disabled={isSearchingNearby}
                >
                  <MapPin className={`w-3.5 h-3.5 ${isSearchingNearby ? 'animate-pulse' : ''}`} />
                  {isSearchingNearby ? 'Mencari...' : 'Cari di Sekitar'}
                </Button>
              </div>
            </section>

            {/* AI Insight Shortcut */}
            <section className="bg-indigo-50 border border-indigo-100 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">AI Consultant</span>
              </div>
              <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">Klik icon robot pada baris data untuk melakukan audit otomatis berbasis regulasi SNI.</p>
            </section>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3 min-h-[500px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-pupr-blue rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Data...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 border border-dashed border-slate-200 text-center rounded-sm">
                <Database className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Database Nihil</h3>
                <p className="text-xs text-slate-500 max-w-[240px] mt-2">Belum ada catatan yang sesuai dengan filter atau database masih kosong.</p>
              </div>
            ) : viewMode === 'LIST' ? (
              <div className="bg-white border border-slate-200 shadow-sm animate-in fade-in duration-300">
                <TableGovTech
                  columns={tableColumns}
                  data={tableData}
                  stickyHeader={true}
                  zebraStripe={false}
                />
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-white border border-slate-200 p-4 shadow-sm h-[600px]">
                  <HistoryMap data={mapData} onViewDetail={onMapDetail} focusItemId={focusItemId} />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  <span>Legend: GIS Analysis Plot</span>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Manning</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Flood</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Balance</span>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ModuleLayout>
  );
};
