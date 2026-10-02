import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useHydrologyStore, type StasiunHidrologi, type DataHujan } from '@/stores/useHydrologyStore';
import { Button } from '@/components/ui/Button';
import {
  CloudRain,
  Plus,
  Upload,
  MapPin,
  Calendar,
  Activity,
  ChevronDown,
  Download,
  Sparkles,
  Edit2,
  Trash2,
  Wand2,
  Database,
} from 'lucide-react';

import { runFullQC } from '@/lib/utils/qc/dataQualityMath';
import { calculateStationCompleteness } from '@/lib/utils/qc/dailyCompletenessMath';
import { supabase } from '@/lib/api/supabase';
import { DataQualityDashboard } from '@/components/ui/DataQualityDashboard';
import { parseExcelData, exportHidrologiTemplate } from '@/utils/excelService';
import { parseRainfallValue } from '@/lib/sanitizer/rainfallSanitizer';
import { toast } from '@/hooks/useToast';

import { DailyRainfallMatrix } from './DailyRainfallMatrix';
import { StationModal } from './modals/StationModal';
import { BulkPasteModal } from './modals/BulkPasteModal';
import { ManualEntryModal } from './modals/ManualEntryModal';
import { InfillModal } from './modals/InfillModal';

export const MasterHidrologiTab: React.FC = () => {
  const {
    stasiunList,
    selectedStasiun,
    dataHujan,
    isLoading,
    fetchStasiun,
    addStasiun,
    importDataHujanBatch,
    selectStasiun,
    seedInitialStations,
    updateStasiun,
    deleteStasiun,
    deleteDataHujanByYear,
    updateDataHujanSingle,
    activeRainfallSource,
    arealRainfallAlgebraic,
    arealRainfallThiessen,
    arealRainfallIsohyet,
  } = useHydrologyStore();

  // Paginated helper: ambil SEMUA data hujan untuk satu stasiun tanpa terpotong batas 1000-baris Supabase
  const fetchAllStationRecords = async (stasiunId: string): Promise<DataHujan[]> => {
    // Gunakan data dari state (sudah paginasi oleh fetchDataHujan di store) jika ini stasiun aktif
    if (selectedStasiun && stasiunId === selectedStasiun.id) {
      return dataHujan;
    }
    // Fallback lokal (mode offline)
    if (!supabase) {
      return dataHujan.filter((d) => d.stasiun_id === stasiunId);
    }
    // Fetch berpaging untuk stasiun non-aktif dari Supabase
    let allRecords: DataHujan[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    while (hasMore) {
      const { data: chunk, error } = await supabase
        .from('master_data_hujan')
        .select('id, stasiun_id, tanggal, curah_hujan, is_infilled')
        .eq('stasiun_id', stasiunId)
        .order('tanggal', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw new Error(`Gagal memuat data stasiun ${stasiunId}: ${error.message}`);
      if (chunk && chunk.length > 0) {
        allRecords = [...allRecords, ...(chunk as DataHujan[])];
        hasMore = chunk.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }
    return allRecords;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Modal States
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<StasiunHidrologi | null>(null);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isInfillModalOpen, setIsInfillModalOpen] = useState(false);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualCellInfo, setManualCellInfo] = useState<{ dateStr: string; currentVal: number | null }>({
    dateStr: '',
    currentVal: null,
  });

  const [showModalQC, setShowModalQC] = useState(false);
  const [selectedQCStations, setSelectedQCStations] = useState<string[]>([]);
  const [isQCLoading, setIsQCLoading] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchStasiun();
  }, [fetchStasiun]);

  useEffect(() => {
    if (stasiunList.length > 0 && !selectedStasiun) {
      selectStasiun(stasiunList[0]);
    }
  }, [stasiunList, selectedStasiun, selectStasiun]);

  // Data display filtered by active rainfall source
  const displayData = useMemo(() => {
    if (activeRainfallSource === 'aljabar') return arealRainfallAlgebraic || [];
    if (activeRainfallSource === 'thiessen') return arealRainfallThiessen || [];
    if (activeRainfallSource === 'isohyet') return arealRainfallIsohyet || [];

    if (!selectedStasiun) return [];
    return dataHujan.filter((d) => d.stasiun_id === selectedStasiun.id);
  }, [activeRainfallSource, arealRainfallAlgebraic, arealRainfallThiessen, arealRainfallIsohyet, dataHujan, selectedStasiun]);

  const availableYears = useMemo(() => {
    if (!displayData || displayData.length === 0) return [new Date().getFullYear()];
    const years = new Set(displayData.map((d) => parseInt(d.tanggal.split('-')[0], 10)));
    return Array.from(years)
      .filter((y) => !isNaN(y))
      .sort((a, b) => b - a);
  }, [displayData]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Excel File Ingestion with Unified Sanitizer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStasiun) return;

    const confirmed = window.confirm(
      `Import file Excel ke stasiun "${selectedStasiun.nama_stasiun}"?\n\nFile: ${file.name}`
    );
    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const jsonData = await parseExcelData<{ Tanggal?: string; 'Curah Hujan (mm)'?: any; col1?: string; col2?: any }>(data, 4);

      const sanitizedRecords: Omit<DataHujan, 'id' | 'created_at'>[] = [];
      let extremeCount = 0;

      jsonData.forEach((row) => {
        const rawDate = row.Tanggal || row.col1;
        const rawRain = row['Curah Hujan (mm)'] !== undefined ? row['Curah Hujan (mm)'] : row.col2;

        if (!rawDate) return;

        const { val, error } = parseRainfallValue(rawRain);
        if (error || val === null) return;

        if (val > 300) extremeCount++;

        sanitizedRecords.push({
          stasiun_id: selectedStasiun.id,
          tanggal: String(rawDate).trim(),
          curah_hujan: val,
        });
      });

      if (sanitizedRecords.length === 0) {
        toast.warning('Tidak ada data curah hujan valid yang ditemukan pada file Excel.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (extremeCount > 0) {
        toast.warning(`Perhatian: Terdeteksi ${extremeCount} data curah hujan sangat lebat (> 300 mm/hari).`);
      }

      await importDataHujanBatch(sanitizedRecords);
      toast.success(`Berhasil mengimpor ${sanitizedRecords.length} data curah hujan.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal membaca file Excel. Pastikan format sesuai template.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = async () => {
    if (!selectedStasiun) {
      toast.warning('Pilih stasiun terlebih dahulu.');
      return;
    }
    await exportHidrologiTemplate(selectedStasiun.nama_stasiun);
  };

  const handleDeleteYear = async () => {
    if (!selectedStasiun) return;
    const confirmed = window.confirm(
      `⚠️ PERINGATAN INTEGRITAS DATA:\nAnda yakin ingin menghapus SELURUH data hujan untuk stasiun ${selectedStasiun.nama_stasiun} pada tahun ${selectedYear}?\n\nTindakan ini tidak dapat dibatalkan!`
    );
    if (confirmed) {
      try {
        await deleteDataHujanByYear(selectedStasiun.id, selectedYear);
        toast.success(`Data tahun ${selectedYear} berhasil dihapus.`);
      } catch (err: any) {
        toast.error(err.message || 'Gagal menghapus data tahun ini.');
      }
    }
  };

  const handleDeleteStation = async (stasiun: StasiunHidrologi) => {
    const confirmed = window.confirm(
      `⚠️ PERINGATAN PENGHAPUSAN STASIUN:\nMenghapus stasiun "${stasiun.nama_stasiun}" akan menghapus seluruh data curah hujan historis yang terhubung secara permanen!\n\nLanjutkan penghapusan stasiun ini?`
    );
    if (confirmed) {
      try {
        await deleteStasiun(stasiun.id);
        toast.success(`Stasiun "${stasiun.nama_stasiun}" berhasil dihapus.`);
      } catch (err: any) {
        toast.error(err.message || 'Gagal menghapus stasiun.');
      }
    }
  };

  // Open interactive manual entry modal on cell click
  const handleCellClick = (dateStr: string, currentVal: number | null) => {
    if (!selectedStasiun) return;
    setManualCellInfo({ dateStr, currentVal });
    setIsManualModalOpen(true);
  };

  const annualMaximums = useMemo(() => {
    if (!displayData || displayData.length === 0) return [];
    const maxByYear: Record<number, number> = {};
    displayData.forEach((row) => {
      const [yyyy] = row.tanggal.split('-');
      const y = parseInt(yyyy, 10);
      if (!maxByYear[y] || row.curah_hujan > maxByYear[y]) {
        maxByYear[y] = row.curah_hujan;
      }
    });
    return Object.entries(maxByYear)
      .map(([year, curah_hujan]) => ({ tahun: parseInt(year, 10), curah_hujan }))
      .sort((a, b) => b.tahun - a.tahun);
  }, [displayData]);

  const handleHubungkanDistribusi = () => {
    if (annualMaximums.length === 0) {
      toast.warning('Tidak ada data maksimum tahunan untuk dihubungkan.');
      return;
    }
    const annualMaxArray = annualMaximums.map((m) => m.curah_hujan);
    useHydrologyStore.setState({
      hasilThiessen: {
        stasiunConfigs: [],
        totalLuas: 0,
        hujanRataRataDAS: annualMaxArray,
      },
    });
    toast.success('Data hujan maksimum berhasil dihubungkan ke modul Analisis Frekuensi.');
  };

  const isCloudConnected = !!supabase;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner: Status & Action Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">Master Data Curah Hujan Harian</h2>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isCloudConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {isCloudConnected ? 'Cloud Supabase Terhubung' : 'Penyimpanan Lokal Aktif'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Basis data primer time-series hidrologi SNI dengan validasi batas fisik terpadu.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stasiunList.length >= 1 && (
            <Button
              onClick={() => {
                setSelectedQCStations(stasiunList.map((s) => s.id));
                setShowModalQC(true);
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Activity className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Quality Control (QC)
            </Button>
          )}

          <Button onClick={downloadTemplate} variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
            Template Excel
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={handleFileUpload}
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedStasiun}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Import Excel
          </Button>

          <Button
            onClick={() => setIsBulkModalOpen(true)}
            disabled={!selectedStasiun}
            size="sm"
            className="text-xs bg-blue-700 hover:bg-blue-800 text-white"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
            Bulk / OCR PDF
          </Button>
        </div>
      </div>

      {/* Main Grid: Station Selector (Left) & Rainfall Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Station List */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-700" />
              <h3 className="font-bold text-slate-800 text-sm">Daftar Stasiun Hujan</h3>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {stasiunList.length}
              </span>
            </div>
            <Button
              onClick={() => {
                setEditingStation(null);
                setIsStationModalOpen(true);
              }}
              size="sm"
              className="text-xs bg-blue-700 hover:bg-blue-800 text-white h-8 px-2.5"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Stasiun
            </Button>
          </div>

          <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1">
            {stasiunList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-500">
                <CloudRain className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium">Belum ada stasiun pengamatan.</p>
                <Button
                  onClick={async () => {
                    await seedInitialStations();
                    toast.success('Berhasil memuat stasiun pilot.');
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                  Muat Stasiun Pilot
                </Button>
              </div>
            ) : (
              stasiunList.map((stasiun) => {
                const isActive = selectedStasiun?.id === stasiun.id;
                return (
                  <div
                    key={stasiun.id}
                    onClick={() => selectStasiun(stasiun)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isActive ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                          />
                          <h4 className="font-bold text-sm text-slate-800 truncate">
                            {stasiun.nama_stasiun}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 truncate">
                          {stasiun.keterangan || 'Pos Pengamatan Hujan'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStation(stasiun);
                            setIsStationModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-white rounded transition-colors"
                          title="Edit Stasiun"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStation(stasiun);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                          title="Hapus Stasiun"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Elevasi:</span>
                        <span className="font-semibold font-mono">
                          {stasiun.elevasi !== null ? `${stasiun.elevasi} mdpl` : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Koordinat:</span>
                        <span className="font-semibold font-mono truncate block">
                          {stasiun.koordinat_y !== null && stasiun.koordinat_x !== null
                            ? `${stasiun.koordinat_y.toFixed(2)}, ${stasiun.koordinat_x.toFixed(2)}`
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Daily Rainfall Matrix */}
        <div className="lg:col-span-8 flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {!selectedStasiun ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <CloudRain className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 text-base">Belum Ada Stasiun Terpilih</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Pilih stasiun pada panel sebelah kiri untuk menampilkan dan mengelola data curah hujan.
              </p>
            </div>
          ) : (
            <>
              {/* Matrix Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-blue-700" />
                    <h3 className="font-bold text-slate-800 text-sm">
                      Matriks Curah Hujan Harian (31 x 12)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Stasiun: <span className="font-semibold text-slate-700">{selectedStasiun.nama_stasiun}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Year Selector */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-slate-300 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-600">Tahun:</span>
                    <div className="relative">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                        className="appearance-none bg-transparent font-bold text-slate-800 pr-5 pl-1 py-0.5 cursor-pointer outline-none font-mono"
                      >
                        {availableYears.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Actions */}
                  <Button
                    onClick={() => setIsInfillModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                  >
                    <Wand2 className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                    Isi Kosong
                  </Button>

                  <Button
                    onClick={() => {
                      setManualCellInfo({ dateStr: '', currentVal: null });
                      setIsManualModalOpen(true);
                    }}
                    size="sm"
                    className="text-xs bg-blue-700 hover:bg-blue-800 text-white h-8"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Input Hari
                  </Button>

                  <div className="h-5 w-px bg-slate-300 mx-0.5" />

                  <Button
                    onClick={handleDeleteYear}
                    disabled={dataHujan.length === 0}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Hapus Tahun Ini
                  </Button>
                </div>
              </div>

              {/* Matrix Content */}
              <div className="p-4 sm:p-6 bg-slate-50/30 flex-1 overflow-auto">
                <DailyRainfallMatrix
                  data={displayData}
                  year={selectedYear}
                  onCellClick={handleCellClick}
                  onOpenInfillModal={() => setIsInfillModalOpen(true)}
                />

                {/* Annual Maximum Summary Table */}
                {annualMaximums.length > 0 && (
                  <div className="mt-6 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Rekapitulasi Hujan Maksimum Tahunan ({annualMaximums.length} Tahun)
                      </span>
                      <Button
                        onClick={handleHubungkanDistribusi}
                        size="sm"
                        className="text-xs h-7 bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <Activity className="w-3 h-3 mr-1" />
                        Hubungkan ke Analisis Frekuensi
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                            {annualMaximums.slice(0, 15).map((m) => (
                              <th key={m.tahun} className="py-2 px-2.5 text-center font-bold border-r border-slate-200">
                                {m.tahun}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {annualMaximums.slice(0, 15).map((m) => (
                              <td
                                key={m.tahun}
                                className="py-2.5 px-2.5 text-center font-bold text-blue-700 tabular-nums border-r border-slate-200 font-mono"
                              >
                                {m.curah_hujan.toFixed(1)}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Quality Control Widget */}
              {dataHujan.length >= 10 && (
                <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                  <DataQualityDashboard />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <StationModal
        isOpen={isStationModalOpen}
        onClose={() => {
          setIsStationModalOpen(false);
          setEditingStation(null);
        }}
        editingStation={editingStation}
        isLoading={isLoading}
        onSave={async (payload) => {
          if (editingStation) {
            await updateStasiun(editingStation.id, payload);
            toast.success(`Stasiun "${payload.nama_stasiun}" berhasil diperbarui.`);
          } else {
            await addStasiun(payload);
            toast.success(`Stasiun "${payload.nama_stasiun}" berhasil ditambahkan.`);
          }
        }}
      />

      {selectedStasiun && (
        <>
          <BulkPasteModal
            isOpen={isBulkModalOpen}
            onClose={() => setIsBulkModalOpen(false)}
            stasiunId={selectedStasiun.id}
            stasiunName={selectedStasiun.nama_stasiun}
            onImport={async (records, onProgress) => {
              await importDataHujanBatch(records, onProgress);
            }}
          />

          <ManualEntryModal
            isOpen={isManualModalOpen}
            onClose={() => setIsManualModalOpen(false)}
            stasiunId={selectedStasiun.id}
            stasiunName={selectedStasiun.nama_stasiun}
            initialDate={manualCellInfo.dateStr}
            initialValue={manualCellInfo.currentVal}
            isLoading={isLoading}
            onSave={async (stasiunId, tanggal, curah_hujan) => {
              await updateDataHujanSingle(stasiunId, tanggal, curah_hujan);
              toast.success(`Data tanggal ${tanggal} (${curah_hujan} mm) berhasil disimpan.`);
            }}
          />

          <InfillModal
            isOpen={isInfillModalOpen}
            onClose={() => setIsInfillModalOpen(false)}
            targetStation={selectedStasiun}
            allStations={stasiunList}
            dataHujan={dataHujan}
            onApplyInfill={async (infilledRecords) => {
              await importDataHujanBatch(infilledRecords);
              toast.success(`Berhasil menerapkan ${infilledRecords.length} data hasil estimasi.`);
            }}
          />
        </>
      )}

      {/* QC Modal */}
      {showModalQC && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Quality Control Hidrologi (SNI)</h3>
                  <p className="text-xs text-slate-500">Uji Konsistensi (RAPS), Outlier (Grubbs-Beck), & Homogenitas</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Pilih stasiun hujan yang akan diuji validitas datanya sebelum digunakan dalam Analisis Frekuensi:
              </p>
              <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3">
                {stasiunList.map((stasiun) => (
                  <label
                    key={stasiun.id}
                    className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer p-1.5 hover:bg-slate-50 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedQCStations.includes(stasiun.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQCStations([...selectedQCStations, stasiun.id]);
                        } else {
                          setSelectedQCStations(selectedQCStations.filter((id) => id !== stasiun.id));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold">{stasiun.nama_stasiun}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowModalQC(false)}
                disabled={isQCLoading}
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={isQCLoading || selectedQCStations.length === 0}
                onClick={async () => {
                  setIsQCLoading(true);
                  try {
                    const newQcStatus: Record<string, { konsisten: boolean; bebasOutlier: boolean; homogen: boolean; dataLevel?: any; dataYearsCount?: number }> = {};
                    const newQcResults: Record<string, any> = {};
                    const newDailyCompleteness: Record<string, any> = {};
                    let globalMinYear = Infinity;
                    let globalMaxYear = -Infinity;

                    for (const stasiunId of selectedQCStations) {
                      // Fase 2: gunakan helper berpaging — tidak terpotong limit 1000 baris Supabase
                      const records = await fetchAllStationRecords(stasiunId);

                      // Fase 4: evaluasi kelengkapan data harian (WMO No. 168)
                      const stn = stasiunList.find((s) => s.id === stasiunId);
                      const completeness = calculateStationCompleteness(records, stasiunId, stn?.nama_stasiun);
                      newDailyCompleteness[stasiunId] = completeness;

                      const maxByYear: Record<number, number> = {};

                      records.forEach((row) => {
                        const y = parseInt(row.tanggal.split('-')[0], 10);
                        if (isNaN(y)) return;
                        const val = Number(row.curah_hujan) || 0;
                        if (!maxByYear[y] || val > maxByYear[y]) {
                          maxByYear[y] = val;
                        }
                      });

                      const annualMax = Object.entries(maxByYear)
                        .map(([yr, val]) => ({ tahun: parseInt(yr, 10), hujan: val }))
                        .sort((a, b) => a.tahun - b.tahun);

                      const yearCount = annualMax.length;

                      // Fase 3: ambang batas berjenjang sesuai SNI 2415:2016
                      if (yearCount < 5) {
                        // Kurang dari 5 tahun: blokir mutlak
                        toast.warning(`Stasiun ini memiliki ${yearCount} tahun data — terlalu sedikit untuk analisis QC (minimum 5 tahun).`);
                        continue;
                      }

                      if (yearCount >= 5) {
                        const result = runFullQC(annualMax);
                        newQcStatus[stasiunId] = {
                          konsisten: result.isKonsisten,
                          bebasOutlier: result.isBebasOutlier,
                          homogen: result.isHomogen,
                          dataLevel: result.dataLevel,
                          dataYearsCount: result.dataYearsCount,
                        };
                        newQcResults[stasiunId] = result;

                        // Kumpulkan rentang tahun global untuk DataQualityDashboard
                        const minY = annualMax[0].tahun;
                        const maxY = annualMax[annualMax.length - 1].tahun;
                        if (minY < globalMinYear) globalMinYear = minY;
                        if (maxY > globalMaxYear) globalMaxYear = maxY;

                        if (yearCount < 10) {
                          toast.warning(`Stasiun ini memiliki ${yearCount} tahun data (< 10 tahun SNI). Hasil QC bersifat indikatif.`);
                        }
                      }
                    }

                    if (Object.keys(newQcStatus).length > 0) {
                      useHydrologyStore.getState().setQCStatus(newQcStatus);
                      useHydrologyStore.getState().setQCResults(newQcResults);
                      useHydrologyStore.getState().setDailyCompleteness(newDailyCompleteness);
                      // Fase 2: perbarui rentangTahun di store agar DataQualityDashboard header akurat
                      if (isFinite(globalMinYear) && isFinite(globalMaxYear)) {
                        useHydrologyStore.setState({ rentangTahun: { min: globalMinYear, max: globalMaxYear } });
                      }
                      toast.success(
                        `Analisis QC berhasil dihitung untuk ${Object.keys(newQcStatus).length} stasiun.`
                      );
                    } else {
                      toast.warning('Tidak ada stasiun dengan data yang mencukupi untuk QC (minimal 5 tahun data).');
                    }
                    setShowModalQC(false);
                  } catch (err: any) {
                    console.error('[QC Error]', err);
                    toast.error(`Gagal menjalankan Quality Control: ${err?.message || 'Terjadi kesalahan tak terduga.'}`);
                  } finally {
                    setIsQCLoading(false);
                  }
                }}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                Jalankan Pengujian QC
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MasterHidrologiTab;
