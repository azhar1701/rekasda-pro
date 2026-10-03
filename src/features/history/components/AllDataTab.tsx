import React, { useState, useEffect, useMemo } from 'react';
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
import { exportToExcel } from '@/utils/excelService';
import {
  Database,
  MapPin,
  Eye,
  Bot,
  Trash2,
  Search,
  Download,
  RefreshCw,
  Waves,
  CloudRain,
  Droplets,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Cloud,
  HardDrive,
  FolderGit2,
  Layers,
  ArrowUpRight,
  FolderOpen
} from 'lucide-react';
import { TableGovTech } from '@/components/ui/TableGovTech';
import { toast } from '@/hooks/useToast';
import { useHydrologyStore } from '@/stores/useHydrologyStore';

type ViewMode = 'LIST' | 'MAP';
type ModuleFilter = 'ALL' | 'manning' | 'flood' | 'water_balance' | 'embung';

interface Props {
  onViewDetail?: (item: AllCalculationsData) => void;
  onConsultAI?: (item: AllCalculationsData) => void;
  onMapDetail?: (item: any) => void;
}

export const AllDataTab: React.FC<Props> = ({ onViewDetail, onConsultAI, onMapDetail }) => {
  const { currentProjectId, currentProjectCode, currentProjectName } = useHydrologyStore();
  const [data, setData] = useState<AllCalculationsData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSearchingNearby, setIsSearchingNearby] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [focusItemId, setFocusItemId] = useState<string | undefined>(undefined);

  // Project Filter Scope: 'PROJECT' (skenario proyek aktif) vs 'ALL' (semua arsip global)
  const [projectScope, setProjectScope] = useState<'PROJECT' | 'ALL'>('ALL');

  useEffect(() => {
    if (currentProjectId) {
      setProjectScope('PROJECT');
    } else {
      setProjectScope('ALL');
    }
  }, [currentProjectId]);

  // Search, Filter & Pagination states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<ModuleFilter>('ALL');
  const [showPilotData, setShowPilotData] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<AllCalculationsData | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllCalculations();
      setData(result);
    } catch (e) {
      console.error('Failed to load calculations:', e);
      toast.error('Gagal memuat data riwayat');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchNearby = async () => {
    setIsSearchingNearby(true);
    try {
      const pos = await getCurrentLocation();
      const response = await apiService.findNearbyCalculations(pos.latitude, pos.longitude, 10000); // 10km radius

      if (response.status === 'success' && response.data) {
        const nearbyItems: AllCalculationsData[] = response.data.map((item: any) => ({
          id: item.id,
          type: item.calculation_type === 'manning' ? 'manning' : 'flood',
          project_name: item.site_name,
          created_at: item.created_at,
          data: {
            inputs: item.input_data,
            results: item.result_data
          },
          location: item.location,
          isLocalOnly: false
        }));

        if (nearbyItems.length === 0) {
          toast.info('Tidak ditemukan perhitungan lain dalam radius 10km.');
        } else {
          setData(nearbyItems);
          toast.success(`Ditemukan ${nearbyItems.length} perhitungan dalam radius 10km.`);
        }
      }
    } catch (error) {
      console.error('Search nearby failed', error);
      toast.error('Gagal mencari lokasi. Pastikan izin lokasi browser aktif.');
    } finally {
      setIsSearchingNearby(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await deleteCalculationById(deleteTarget.type, deleteTarget.id);
      if (error) {
        toast.error('Gagal menghapus: ' + error.message);
      } else {
        toast.success(`Data proyek "${deleteTarget.project_name}" berhasil dihapus.`);
        setDeleteTarget(null);
        loadData();
      }
    } catch (err: any) {
      toast.error('Error saat menghapus: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShowOnMap = (item: AllCalculationsData) => {
    setViewMode('MAP');
    setTimeout(() => {
      setFocusItemId(item.id);
    }, 150);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'manning': return 'Saluran Manning';
      case 'flood': return 'Analisis Banjir';
      case 'water_balance': return 'Neraca Air';
      case 'embung': return 'Embung / Situ';
      default: return type;
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'manning': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'flood': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'water_balance': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'embung': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getMainValue = (item: AllCalculationsData): string => {
    if (item.type === 'manning') {
      const q = item.data.results?.Discharge || item.data.results?.discharge;
      return q ? (typeof q === 'number' ? q.toFixed(3) : String(q)) : '-';
    } else if (item.type === 'flood') {
      const q = item.data.results?.qPeak || item.data.results?.peakDischarge || item.data.results?.Discharge;
      return q ? (typeof q === 'number' ? q.toFixed(3) : parseFloat(q).toFixed(3)) : '-';
    } else if (item.type === 'water_balance') {
      const monthlySupply = item.data.monthly_inputs?.monthlySupply || item.data.inputs?.monthlySupply;
      if (Array.isArray(monthlySupply)) {
        const total = monthlySupply.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
        return total.toFixed(2);
      }
      return '-';
    } else if (item.type === 'embung') {
      const cap = item.data.result_data?.capacityResult?.requiredCapacity ||
        item.data.results?.requiredCapacity ||
        item.data.results?.effectiveStorage ||
        item.data.result_data?.zoning?.effectiveStorage;
      return cap ? (typeof cap === 'number' ? cap.toLocaleString('id-ID') : String(cap)) : '-';
    }
    return '-';
  };

  const getMainUnit = (type: string): string => {
    return type === 'embung' ? 'm³' : 'm³/s';
  };

  // Convert to CalculationResult format for map
  const dbMapData = useMemo(() => {
    return data
      .filter(item => {
        let loc = item.location;
        if (!loc && item.type === 'manning') loc = item.data?.inputs?.site?.location;
        if (!loc && item.type === 'flood') loc = item.data?.inputs?.location || item.data?.inputs?.site?.location;
        if (!loc && item.type === 'water_balance') loc = item.data?.monthly_inputs?.location;
        if (!loc && item.type === 'embung') loc = item.data?.input_data?.location || item.data?.inputs?.location;
        return loc && loc.latitude && loc.longitude && !isNaN(loc.latitude) && !isNaN(loc.longitude);
      })
      .map((item) => {
        const loc = item.location ||
          (item.type === 'manning' && item.data?.inputs?.site?.location) ||
          (item.type === 'flood' && (item.data?.inputs?.location || item.data?.inputs?.site?.location)) ||
          (item.type === 'water_balance' && item.data?.monthly_inputs?.location) ||
          (item.type === 'embung' && (item.data?.input_data?.location || item.data?.inputs?.location));

        const calcType: CalculationType =
          item.type === 'manning' ? CalculationType.MANNING :
          item.type === 'water_balance' ? CalculationType.WATER_BALANCE :
          item.type === 'embung' ? CalculationType.EMBUNG :
          CalculationType.RATIONAL;

        const regency =
          item.data?.inputs?.site?.regency ||
          item.data?.inputs?.site?.kabupaten ||
          item.data?.inputs?.regency ||
          item.data?.inputs?.kabupaten ||
          item.data?.monthly_inputs?.regency ||
          item.data?.monthly_inputs?.kabupaten ||
          '';

        return {
          id: item.id,
          type: calcType,
          date: item.created_at,
          inputs: {
            site: {
              channelName: item.project_name,
              regency,
              district: '',
              village: ''
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
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: 10,
            timestamp: Date.now()
          }
        };
      });
  }, [data]);

  // Pilot mock data for demonstrations
  const pilotMapData = useMemo(() => {
    return [
      ...manningPilotData.map((pilot, idx) => ({
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
        outputs: { Discharge: '4.85' },
        location: pilot.location.coordinates ? {
          latitude: pilot.location.coordinates.lat,
          longitude: pilot.location.coordinates.lng,
          accuracy: 10,
          timestamp: Date.now()
        } : undefined
      })),
      ...rationalPilotData.map((pilot, idx) => ({
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
        outputs: { Discharge: '12.40' },
        location: pilot.location.coordinates ? {
          latitude: pilot.location.coordinates.lat,
          longitude: pilot.location.coordinates.lng,
          accuracy: 10,
          timestamp: Date.now()
        } : undefined
      })),
      ...waterBalancePilotData.map((pilot, idx) => ({
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
        outputs: { Discharge: '18.50' },
        location: pilot.location.coordinates ? {
          latitude: pilot.location.coordinates.lat,
          longitude: pilot.location.coordinates.lng,
          accuracy: 10,
          timestamp: Date.now()
        } : undefined
      }))
    ].filter(item => item.location);
  }, []);

  const mapData = useMemo(() => {
    return showPilotData ? [...dbMapData, ...pilotMapData] : dbMapData;
  }, [showPilotData, dbMapData, pilotMapData]);

  // Statistics KPIs
  const stats = useMemo(() => {
    const total = data.length;
    const manningCount = data.filter(d => d.type === 'manning').length;
    const floodCount = data.filter(d => d.type === 'flood').length;
    const waterCount = data.filter(d => d.type === 'water_balance').length;
    const embungCount = data.filter(d => d.type === 'embung').length;
    const localCount = data.filter(d => d.isLocalOnly).length;
    return { total, manningCount, floodCount, waterCount, embungCount, localCount };
  }, [data]);

  const projectSnapshotCount = useMemo(() => {
    if (!currentProjectId) return 0;
    return data.filter(d => d.projectId === currentProjectId).length;
  }, [data, currentProjectId]);

  // Filtered & Searched Data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 0. Project scope filter (Skenario Proyek Aktif vs Global)
      if (projectScope === 'PROJECT' && currentProjectId) {
        if (item.projectId !== currentProjectId) {
          return false;
        }
      }
      // 1. Module filter
      if (selectedModule !== 'ALL' && item.type !== selectedModule) {
        return false;
      }
      // 2. Search query filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = (item.project_name || '').toLowerCase().includes(query);
        const scenarioMatch = (item.scenarioName || '').toLowerCase().includes(query);
        const codeMatch = (item.projectCode || '').toLowerCase().includes(query);
        const typeMatch = getTypeLabel(item.type).toLowerCase().includes(query);
        const dateMatch = new Date(item.created_at).toLocaleDateString('id-ID').toLowerCase().includes(query);
        return nameMatch || scenarioMatch || codeMatch || typeMatch || dateMatch;
      }
      return true;
    });
  }, [data, projectScope, currentProjectId, selectedModule, searchTerm]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  // Memuat parameter skenario langsung ke modul aktif
  const handleApplyScenario = (item: AllCalculationsData) => {
    let targetPath = '/saluran';
    if (item.type === 'flood') targetPath = '/banjir';
    else if (item.type === 'water_balance') targetPath = '/neraca';
    else if (item.type === 'embung') targetPath = '/embung';

    try {
      sessionStorage.setItem('rekasda_active_scenario', JSON.stringify({
        id: item.id,
        type: item.type,
        scenarioName: item.scenarioName,
        data: item.data,
        location: item.location
      }));

      window.dispatchEvent(new CustomEvent('loadCalculationScenario', { detail: item }));
      window.dispatchEvent(new CustomEvent('navigateToTab', { detail: targetPath }));

      toast.success(`Parameter skenario "${item.scenarioName || item.project_name}" berhasil disiapkan di modul!`);
    } catch (err) {
      console.error('Gagal menerapkan skenario:', err);
      toast.error('Gagal menerapkan skenario.');
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      toast.warning('Tidak ada data untuk diekspor');
      return;
    }

    const exportRows = filteredData.map((item, idx) => ({
      No: idx + 1,
      Tanggal: new Date(item.created_at).toLocaleDateString('id-ID'),
      'Kode Proyek': item.projectCode || '-',
      'Nama Proyek': item.project_name,
      'Skenario Desain': item.scenarioName || 'Kondisi Eksisting',
      Modul: getTypeLabel(item.type),
      'Nilai Utama': getMainValue(item),
      Satuan: getMainUnit(item.type),
      'Penyimpanan': item.isLocalOnly ? 'Lokal (Offline)' : 'Cloud Supabase'
    }));

    await exportToExcel(exportRows, `Rekasda_Riwayat_Perhitungan_${new Date().toISOString().slice(0, 10)}`, 'Riwayat');
    toast.success('File Excel berhasil diunduh!');
  };

  // Table Columns
  const tableColumns = [
    { key: 'date', label: 'Tanggal', align: 'left' as const },
    { key: 'project', label: 'Proyek & Skenario', align: 'left' as const },
    { key: 'type', label: 'Modul', align: 'left' as const },
    { key: 'value', label: 'Kapasitas / Debit', align: 'right' as const, numeric: true },
    { key: 'sync', label: 'Penyimpanan', align: 'center' as const },
    { key: 'actions', label: 'Aksi Rekayasa', align: 'center' as const }
  ];

  const tableData = paginatedData.map((item) => ({
    date: (
      <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    ),
    project: (
      <div className="max-w-[260px] truncate" title={item.project_name}>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-800 text-xs truncate">{item.project_name}</span>
          {item.projectCode && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-900 border border-blue-200 shrink-0 font-bold">
              {item.projectCode}
            </span>
          )}
        </div>
        {item.scenarioName && (
          <div className="flex items-center gap-1 mt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 max-w-[240px] truncate">
              <Layers className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
              <span className="truncate">{item.scenarioName}</span>
            </span>
          </div>
        )}
      </div>
    ),
    type: (
      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border whitespace-nowrap ${getTypeBadgeStyle(item.type)}`}>
        {getTypeLabel(item.type)}
      </span>
    ),
    value: (
      <div className="flex items-baseline justify-end gap-1.5 whitespace-nowrap">
        <span className="font-bold text-slate-900 font-mono text-xs tabular-nums tracking-tight">{getMainValue(item)}</span>
        <span className="text-[10px] text-slate-400 font-semibold uppercase">{getMainUnit(item.type)}</span>
      </div>
    ),
    sync: item.isLocalOnly ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Tersimpan secara offline di browser lokal">
        <HardDrive className="w-3 h-3" />
        Lokal
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Tersimpan di Cloud Database Supabase">
        <Cloud className="w-3 h-3" />
        Cloud
      </span>
    ),
    actions: (
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => handleApplyScenario(item)}
          className="h-8 w-8 flex items-center justify-center text-teal-700 hover:bg-teal-50 rounded transition-colors"
          title="Terapkan Parameter Skenario ke Modul Kerja"
          aria-label="Terapkan Skenario"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleShowOnMap(item)}
          className="h-8 w-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Tampilkan di Peta"
          aria-label="Tampilkan di Peta"
        >
          <MapPin className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onViewDetail?.(item)}
          className="h-8 w-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded transition-colors"
          title="Lihat Rincian Analisis"
          aria-label="Lihat Rincian Analisis"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onConsultAI?.(item)}
          className="h-8 w-8 flex items-center justify-center text-purple-600 hover:bg-purple-50 rounded transition-colors"
          title="Konsultasi AI Engineering"
          aria-label="Konsultasi AI Engineering"
        >
          <Bot className="w-3.5 h-3.5" />
        </button>
        <div className="h-4 w-px bg-slate-200 mx-0.5" />
        <button
          onClick={() => setDeleteTarget(item)}
          className="h-8 w-8 flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded transition-colors"
          title="Hapus Rekaman"
          aria-label="Hapus Rekaman"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }));

  return (
    <ModuleLayout
      title="Riwayat Perhitungan Hidrologi & Hidraulika"
      description="Arsip rekayasa terintegrasi: Saluran Manning, Analisis Banjir, Neraca Air, dan Embung/Situ"
      icon={<Database className="w-6 h-6" />}
      iconColorClass="bg-blue-50 text-pupr-blue"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={filteredData.length === 0}
            className="h-8 text-xs font-semibold border-slate-300 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Ekspor Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading || isSearchingNearby}
            className="h-8 text-xs font-semibold border-slate-300 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleSearchNearby}
            disabled={loading || isSearchingNearby}
            className="h-8 text-xs font-semibold bg-pupr-blue hover:bg-teal-700 text-white"
          >
            <MapPin className="w-3.5 h-3.5 mr-1" />
            {isSearchingNearby ? 'Mencari...' : 'Cari di Sekitar'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Unified Project Context Banner */}
        {currentProjectId ? (
          <div className="bg-gradient-to-r from-[#0c3a66] via-blue-900 to-indigo-900 text-white p-4 rounded-xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <FolderGit2 className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200">
                    Proyek Aktif Terhubung
                  </span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-800 text-amber-300 border border-blue-600">
                    {currentProjectCode || 'PRJ'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {currentProjectName || 'Proyek Analisis Hidrologi Terpadu'}
                </h3>
              </div>
            </div>

            {/* Scope Switcher: Skenario Proyek Aktif vs Semua Riwayat Global */}
            <div className="flex items-center bg-blue-950/70 p-1 rounded-lg border border-blue-700/60 w-full md:w-auto">
              <button
                type="button"
                onClick={() => {
                  setProjectScope('PROJECT');
                  setCurrentPage(1);
                }}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  projectScope === 'PROJECT'
                    ? 'bg-amber-400 text-blue-950 shadow-sm'
                    : 'text-blue-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Skenario Proyek Ini ({projectSnapshotCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProjectScope('ALL');
                  setCurrentPage(1);
                }}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  projectScope === 'ALL'
                    ? 'bg-amber-400 text-blue-950 shadow-sm'
                    : 'text-blue-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Semua Riwayat Global ({data.length})</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Belum ada Proyek Aktif terpilih di Lembar Kerja.</strong> Menampilkan seluruh arsip riwayat global.
              </span>
            </div>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openProjectModal'));
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors self-start sm:self-auto shrink-0 shadow-xs"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Buka Katalog Proyek</span>
            </button>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-pupr-blue">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Total Arsip</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-slate-900 tabular-nums">{stats.total}</span>
                <span className="text-[10px] text-slate-400">proyek</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Saluran Manning</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-blue-900 tabular-nums">{stats.manningCount}</span>
                <span className="text-[10px] text-slate-400">rekaman</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Analisis Banjir</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-rose-900 tabular-nums">{stats.floodCount}</span>
                <span className="text-[10px] text-slate-400">rekaman</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Neraca & Embung</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-teal-900 tabular-nums">{stats.waterCount + stats.embungCount}</span>
                <span className="text-[10px] text-slate-400">rekaman</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters & View Toggle */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama proyek, lokasi, atau tanggal..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 pl-9 pr-3 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-pupr-blue focus:border-pupr-blue"
            />
          </div>

          {/* Module filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: `Semua (${stats.total})` },
              { id: 'manning', label: `Saluran (${stats.manningCount})` },
              { id: 'flood', label: `Banjir (${stats.floodCount})` },
              { id: 'water_balance', label: `Neraca (${stats.waterCount})` },
              { id: 'embung', label: `Embung (${stats.embungCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedModule(tab.id as ModuleFilter);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md whitespace-nowrap transition-colors ${
                  selectedModule === tab.id
                    ? 'bg-pupr-blue text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-md shrink-0">
            <button
              onClick={() => setViewMode('LIST')}
              className={`py-1 px-3 rounded text-xs font-bold transition-all ${
                viewMode === 'LIST' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daftar
            </button>
            <button
              onClick={() => setViewMode('MAP')}
              className={`py-1 px-3 rounded text-xs font-bold transition-all ${
                viewMode === 'MAP' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Peta
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 bg-white rounded-lg border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pupr-blue mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">Memuat data riwayat perhitungan...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-slate-200 text-center p-6">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Database className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              {searchTerm || selectedModule !== 'ALL' ? 'Data Tidak Ditemukan' : 'Belum Ada Riwayat Perhitungan'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchTerm || selectedModule !== 'ALL'
                ? 'Tidak ada rekaman yang sesuai dengan kata kunci atau filter modul yang dipilih.'
                : 'Mulai lakukan perhitungan di modul Saluran, Banjir, Neraca Air, atau Embung untuk menyimpan hasil rekayasa di sini.'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'MAP' ? (
              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sebaran Geografis Lokasi Proyek</h3>
                    <p className="text-[11px] text-slate-500">
                      {mapData.length} lokasi berkoordinat GPS ({dbMapData.length} proyek aktif{showPilotData ? ` + ${pilotMapData.length} contoh pilot` : ''})
                    </p>
                  </div>

                  {/* Toggle show pilot mock data */}
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    <input
                      type="checkbox"
                      checked={showPilotData}
                      onChange={(e) => setShowPilotData(e.target.checked)}
                      className="rounded text-pupr-blue focus:ring-pupr-blue h-3.5 w-3.5"
                    />
                    <span className="font-semibold text-[11px]">Tampilkan Data Contoh (Pilot)</span>
                  </label>
                </div>

                <HistoryMap data={mapData} onViewDetail={onMapDetail} focusItemId={focusItemId} />

                {/* Map Legend */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></span>
                      Saluran Manning
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></span>
                      Analisis Banjir
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
                      Neraca Air
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]"></span>
                      Embung / Situ
                    </span>
                  </div>
                  <span className="text-slate-400 text-[10px]">*Klik pin peta untuk melihat ringkasan debit dan membuka analisis lengkap</span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <TableGovTech
                  columns={tableColumns}
                  data={tableData}
                  stickyHeader={true}
                  zebraStripe={true}
                />

                {/* Table Footer with Pagination */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
                  <div>
                    Menampilkan <strong>{paginatedData.length}</strong> dari <strong>{filteredData.length}</strong> total rekaman
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Halaman Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <span className="px-3 py-1 font-semibold text-slate-800">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Halaman Selanjutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal (GovTech Standard) */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Rekaman</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Apakah Anda yakin ingin menghapus data perhitungan proyek <strong>"{deleteTarget.project_name}"</strong> ({getTypeLabel(deleteTarget.type)})? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="h-8 text-xs font-semibold"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="h-8 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
};

export default AllDataTab;
