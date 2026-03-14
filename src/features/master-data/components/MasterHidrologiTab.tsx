import React, { useEffect, useState, useRef } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Button } from '@/components/ui/Button';
import { CloudRain, Plus, Upload, MapPin, Calendar, Activity, ChevronDown, X, Download, Sparkles, AlertCircle, Edit2, Trash2 } from 'lucide-react';

import { supabase } from '@/lib/api/supabase';
import { DataQualityDashboard } from '@/components/ui/DataQualityDashboard';
import { parseExcelData, exportHidrologiTemplate } from '@/utils/excelService';
import { Wand2 } from 'lucide-react';
import { detectAnomalies, infillRainfallData } from '@/services/qualityControlService';
import { extractRainfallFromPdf } from '@/services/geminiService';
import { toast } from '@/hooks/useToast';
import { runFullQC } from '@/lib/utils/qc/dataQualityMath';
import { calculateStationHealth } from '@/lib/utils/qc/dataHealthMath';

import { DailyRainfallMatrix } from './DailyRainfallMatrix';


export const MasterHidrologiTab: React.FC = () => {
 const {
 stasiunList,
 selectedStasiun,
 dataHujan,
 isLoading,
 error,
 fetchStasiun,
 fetchMultipleStationsData,
 addStasiun,
 addDataHujan,
 importDataHujanBatch,
 selectStasiun,
 updateDataHujanManual,
 seedInitialStations,
 updateStasiun,
 deleteStasiun,
 deleteDataHujanByYear,
 updateDataHujanSingle,
 activeRainfallSource,
 arealRainfallAlgebraic,
 arealRainfallThiessen,
 arealRainfallIsohyet,
 stationHealth,
 setStationHealth,
 setQCStatus,
 setQCResults,
 setStasiunAmsData,
 stasiunAmsData
 } = useHydrologyStore();

 const fileInputRef = useRef<HTMLInputElement>(null);
 const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
 const [showModalStasiun, setShowModalStasiun] = useState(false);
 const [editingStasiunId, setEditingStasiunId] = useState<string | null>(null);
 const [showModalHujan, setShowModalHujan] = useState(false);
 const [formStasiun, setFormStasiun] = useState({
 nama_stasiun: '',
 koordinat_x: '',
 koordinat_y: '',
 elevasi: '',
 keterangan: ''
 });
 const [formHujan, setFormHujan] = useState({
 tanggal: '',
 curah_hujan: ''
 });
 const [isInfilling, setIsInfilling] = useState(false);
 const [showModalBulk, setShowModalBulk] = useState(false);
 const [bulkRawText, setBulkRawText] = useState('');
 const [bulkYear, setBulkYear] = useState<number>(new Date().getFullYear());
 const [bulkPreview, setBulkPreview] = useState<any[] | null>(null);
 const [isProcessingOcr, setIsProcessingOcr] = useState(false);
 const ocrFileInputRef = useRef<HTMLInputElement>(null);

 // QC Modal States
 const [showModalQC, setShowModalQC] = useState(false);
 const [selectedQCStations, setSelectedQCStations] = useState<string[]>([]);
 const [qcProgress, setQCProgress] = useState<{ current: number, total: number, station: string } | null>(null);
 const [qcSummary, setQcSummary] = useState<Record<string, any> | null>(null);
 const [isQCLoading, setIsQCLoading] = useState(false);

 const parseBulkRainfall = (text: string, year: number): any[] => {
 const lines = text.trim().split('\n');
 const records: any[] = [];

 lines.forEach((line) => {
 const parts = line.trim().split(/\s+/);
 if (parts.length < 2) return;

 const day = parseInt(parts[0], 10);
 if (isNaN(day) || day < 1 || day > 31) return;

 const values = parts.slice(1);
 values.forEach((val, monthIdx) => {
 if (monthIdx >= 12) return;

 let rainfall: number | null = null;
 if (val === '-' || val === 'NR' || val === '') {
 rainfall = null;
 } else {
 const parsed = parseFloat(val.replace(',', '.'));
 if (!isNaN(parsed)) {
 rainfall = parsed;
 }
 }

 if (rainfall !== null) {
 const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
 const d = new Date(dateStr);
 if (d.getFullYear() === year && d.getMonth() === monthIdx && d.getDate() === day) {
 records.push({
 stasiun_id: selectedStasiun?.id,
 tanggal: dateStr,
 curah_hujan: rainfall
 });
 }
 }
 });
 });
 return records;
 };

 const handleBulkPreview = () => {
 const result = parseBulkRainfall(bulkRawText, bulkYear);
 setBulkPreview(result);
 };

 const handleBulkSave = async () => {
 if (!bulkPreview || bulkPreview.length === 0 || !selectedStasiun) return;
 try {
 await importDataHujanBatch(bulkPreview);
 toast.success(`Berhasil mengimpor ${bulkPreview.length} data harian.`);
 setShowModalBulk(false);
 setBulkRawText('');
 setBulkPreview(null);
 } catch (err) {
 console.error(err);
 toast.error('Gagal menyimpan data bulk.');
 }
 };

 const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file || !selectedStasiun) return;

 setIsProcessingOcr(true);
 try {
 const reader = new FileReader();
 reader.onload = async (event) => {
 const base64 = event.target?.result as string;
 try {
 const matrix = await extractRainfallFromPdf(base64, bulkYear);
 if (matrix) {
 const records: any[] = [];
 matrix.forEach((row, dayIdx) => {
 row.forEach((val, monthIdx) => {
 if (val !== null && val !== undefined) {
 const day = dayIdx + 1;
 const month = monthIdx + 1;
 const dateStr = `${bulkYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
 const d = new Date(dateStr);
 if (d.getFullYear() === bulkYear && d.getMonth() === monthIdx && d.getDate() === day) {
 records.push({
 stasiun_id: selectedStasiun.id,
 tanggal: dateStr,
 curah_hujan: val
 });
 }
 }
 });
 });
 setBulkPreview(records);
 toast.success(`AI berhasil mengekstrak ${records.length} data curah hujan.`);
 } else {
 toast.error('AI gagal mengekstrak data. Pastikan file PDF berisi tabel curah hujan.');
 }
 } catch (err) {
 console.error(err);
 toast.error('Terjadi kesalahan saat memproses OCR.');
 } finally {
 setIsProcessingOcr(false);
 }
 };
 reader.readAsDataURL(file);
 } catch (err) {
 console.error(err);
 setIsProcessingOcr(false);
 }
 if (ocrFileInputRef.current) ocrFileInputRef.current.value = '';
 };

 useEffect(() => {
 fetchStasiun();
 }, [fetchStasiun]);

 // AUTO-FETCH: Ensure data is loaded if a station is restored from persistence
 useEffect(() => {
 if (selectedStasiun && dataHujan.length === 0) {
 fetchMultipleStationsData([selectedStasiun.id]);
 }
 }, [selectedStasiun, fetchMultipleStationsData, dataHujan.length]);

 useEffect(() => {
 if (dataHujan.length >= 10) {
 updateDataHujanManual(dataHujan);
 }
 }, [dataHujan, updateDataHujanManual]);

 const displayData = React.useMemo(() => {
 if (activeRainfallSource === 'aljabar') return arealRainfallAlgebraic || [];
 if (activeRainfallSource === 'thiessen') return arealRainfallThiessen || [];
 if (activeRainfallSource === 'isohyet') return arealRainfallIsohyet || [];

 // Default: Titik (Point) data filtered by selected station
 if (!selectedStasiun) return [];
 return dataHujan.filter(d => d.stasiun_id === selectedStasiun.id);
 }, [activeRainfallSource, arealRainfallAlgebraic, arealRainfallThiessen, arealRainfallIsohyet, dataHujan, selectedStasiun]);

 const availableYears = React.useMemo(() => {
 const years = new Set(displayData.map(d => {
 const y = parseInt(d.tanggal.split('-')[0], 10);
 return y;
 }));
 const yearList = Array.from(years).filter(y => !isNaN(y)).sort((a, b) => b - a);
 
 // Only fallback to current year if there is absolutely no data for any year
 if (yearList.length === 0) return [new Date().getFullYear()];
 return yearList;
 }, [displayData]);

 useEffect(() => {
 // Auto-select the latest available year if current selectedYear is not in the list
 if (availableYears.length > 0) {
 const latestYear = availableYears[0];
 if (!availableYears.includes(selectedYear)) {
 setSelectedYear(latestYear);
 }
 }
 }, [availableYears, selectedYear]);

 const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
 const year = parseInt(e.target.value, 10);
 setSelectedYear(year);
 };

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file || !selectedStasiun) return;

 const confirmed = confirm(
 `Import data ke stasiun: ${selectedStasiun.nama_stasiun}\n\n` +
 `File: ${file.name}\n\n` +
 `Lanjutkan?`
 );

 if (!confirmed) {
 if (fileInputRef.current) fileInputRef.current.value = '';
 return;
 }

 try {
 const data = await file.arrayBuffer();
 const jsonData = await parseExcelData<{ Tanggal: string; 'Curah Hujan (mm)': number }>(data, 4);

 const dataList = jsonData
 .filter(row => row.Tanggal && row['Curah Hujan (mm)'] !== undefined)
 .map(row => ({
 stasiun_id: selectedStasiun.id,
 tanggal: row.Tanggal,
 curah_hujan: row['Curah Hujan (mm)'] || 0
 }));

 if (dataList.length === 0) {
 toast.warning('Tidak ada data valid di file Excel.');
 if (fileInputRef.current) fileInputRef.current.value = '';
 return;
 }

 await importDataHujanBatch(dataList);
 toast.success(`Berhasil import ${dataList.length} data ke stasiun ${selectedStasiun.nama_stasiun}`);
 } catch (err) {
 console.error(err);
 toast.error('Gagal import file. Pastikan format sesuai template.');
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



 const handleInfillData = async () => {
 if (!selectedStasiun || stasiunList.length < 2) {
 toast.warning('Dibutuhkan minimal 2 stasiun untuk melakukan infilling (IDW).');
 return;
 }
 setIsInfilling(true);

 try {
 // 1. Fetch data for all stations to have reference data
 const otherStationIds = stasiunList.map(s => s.id);
 // Temporarily fetch all to ensure we have neighbors
 let allReferenceData: any[] = [];
 if (supabase) {
 const { data, error } = await supabase
 .from('master_data_hujan')
 .select('*')
 .in('stasiun_id', otherStationIds);
 if (error) throw error;
 allReferenceData = data || [];
 }

 // 2. Prepare reference objects
 const referenceStations = stasiunList
 .filter(s => s.id !== selectedStasiun.id)
 .map(s => ({
 stasiun: s,
 data: allReferenceData.filter(rd => rd.stasiun_id === s.id)
 }));

 // 3. Detect Anomalies first to know what to fill
 const dataWithAnomalies = detectAnomalies(dataHujan);

 // 4. Perform Infilling
 const filledData = infillRainfallData(
 selectedStasiun,
 dataWithAnomalies,
 referenceStations
 );

 // 5. Update local store and sync to Supabase
 updateDataHujanManual(filledData);
 
 // 6. Push metadata to Supabase automatically
 await useHydrologyStore.getState().syncRainfallMetadata();
 
 toast.success('Berhasil mengisi data kosong dan mensinkronkan metadata ke cloud.');
 } catch (error) {
 console.error('Error infilling data:', error);
 toast.error('Gagal mengisi data kosong.');
 } finally {
 setIsInfilling(false);
 }
 };

 const handleDeleteYear = async () => {
 if (!selectedStasiun) return;
 const confirmed = window.confirm(`⚠️ PERINGATAN: Anda yakin ingin menghapus SEMUA data hujan untuk stasiun ${selectedStasiun.nama_stasiun} pada tahun ${selectedYear}?
Tindakan ini tidak dapat dibatalkan!`);
 if (confirmed) {
 try {
 await deleteDataHujanByYear(selectedStasiun.id, selectedYear);
 
 // CRITICAL FIX: Refresh health and AMS data after deletion
 const { dataHujan: updatedData } = useHydrologyStore.getState();
 const filteredData = updatedData.filter(d => d.stasiun_id === selectedStasiun.id);
 
 const newHealth = { ...stationHealth };
 const newAmsData = { ...stasiunAmsData };
 
 if (filteredData.length > 0) {
 newHealth[selectedStasiun.id] = calculateStationHealth(filteredData);
 
 const maxByYear: Record<number, number> = {};
 filteredData.forEach(row => {
 const y = parseInt(row.tanggal.split('-')[0], 10);
 if (!maxByYear[y] || row.curah_hujan > maxByYear[y]) maxByYear[y] = row.curah_hujan;
 });
 newAmsData[selectedStasiun.id] = Object.entries(maxByYear)
 .map(([year, hujan]) => ({ tahun: parseInt(year), hujan }))
 .sort((a, b) => a.tahun - b.tahun);
 } else {
 delete newHealth[selectedStasiun.id];
 delete newAmsData[selectedStasiun.id];
 }
 
 setStationHealth(newHealth);
 setStasiunAmsData(newAmsData);
 
 toast.success(`Data tahun ${selectedYear} berhasil dihapus dan status stasiun diperbarui.`);
 } catch (err) {
 console.error(err);
 toast.error('Gagal menghapus data.');
 }
 }
 };

 const handleCellClick = async (dateStr: string, currentVal: number | null) => {
 if (!selectedStasiun) return;
 const newValStr = window.prompt(`Masukkan Curah Hujan untuk ${dateStr}:`, currentVal !== null ? currentVal.toString() : '0');
 if (newValStr !== null) {
 const newVal = parseFloat(newValStr);
 if (!isNaN(newVal) && newVal >= 0) {
 try {
 await updateDataHujanSingle(selectedStasiun.id, dateStr, newVal);
 } catch (err) {
 console.error(err);
 toast.error('Gagal mengupdate data.');
 }
 } else {
 toast.warning('Nilai tidak valid. Masukkan angka positif.');
 }
 }
 };

 const annualMaximums = React.useMemo(() => {
 if (!displayData || displayData.length === 0) return [];
 const maxByYear: Record<number, number> = {};
 displayData.forEach(row => {
 const [yyyy] = row.tanggal.split('-');
 const y = parseInt(yyyy, 10);
 if (!maxByYear[y] || row.curah_hujan > maxByYear[y]) {
 maxByYear[y] = row.curah_hujan;
 }
 });
 return Object.entries(maxByYear)
 .map(([y, val]) => ({ tahun: parseInt(y, 10), curah_hujan: val }))
 .sort((a, b) => b.tahun - a.tahun);
 }, [displayData]);


 return (
 <div className="space-y-6">
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm flex items-start gap-3">
 <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
 <div>
 <h4 className="font-bold text-sm">Terjadi Kesalahan</h4>
 <p className="text-sm mt-1">{error}</p>
 </div>
 </div>
 )}
 <div className="flex justify-between items-center">
 <div>
 <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Database Master Stasiun</h2>
 <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Kelola daftar stasiun dan data hujan historis secara terpusat</p>
 </div>
 <div className="flex gap-3">
 <Button
 onClick={() => {
 setSelectedQCStations([]);
 setQcSummary(null);
 setQCProgress(null);
 setShowModalQC(true);
 }}
 variant="outline"
 className="rounded-sm font-bold bg-white dark:bg-slate-900 border-pupr-blue text-pupr-blue hover:bg-pupr-surface"
 >
 <Sparkles className="w-4 h-4 mr-2" />
 Audit & Hubungkan ke Distribusi
 </Button>
 <Button onClick={downloadTemplate} disabled={!selectedStasiun} variant="outline" className="rounded-sm font-bold bg-white dark:bg-slate-900 border-teal-200 text-teal-700 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed">
 <Download className="w-4 h-4 mr-2" />
 Download Template
 </Button>
 {selectedStasiun && (
 <>
 <input
 ref={fileInputRef}
 type="file"
 accept=".xlsx,.xls"
 onChange={handleFileUpload}
 className="hidden"
 />
 <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-sm font-bold bg-white dark:bg-slate-900 border-teal-200 text-teal-700 hover:bg-teal-50">
 <Upload className="w-4 h-4 mr-2" />
 Import Excel
 </Button>
 <Button onClick={() => setShowModalBulk(true)} variant="outline" className="rounded-sm font-bold bg-white dark:bg-slate-900 border-teal-200 text-teal-700 hover:bg-teal-50">
 <Activity className="w-4 h-4 mr-2" />
 Bulk Paste
 </Button>
 </>
 )}
 <Button onClick={() => {
 setEditingStasiunId(null);
 setFormStasiun({ nama_stasiun: '', koordinat_x: '', koordinat_y: '', elevasi: '', keterangan: '' });
 setShowModalStasiun(true);
 }} className="rounded-sm font-bold bg-pupr-blue hover:bg-teal-700 shadow-teal-500/20">
 <Plus className="w-4 h-4 mr-2" />
 Tambah Stasiun
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[850px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm mt-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-300 dark:divide-slate-700 rounded-none">
 <div className="lg:col-span-3 flex flex-col overflow-y-auto max-h-[1400px] bg-slate-50 dark:bg-slate-900">
 <div className="p-4 border-b border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex justify-between items-center sticky top-0 z-10">
 <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2">
 <MapPin className="w-5 h-5 text-pupr-blue" />
 Daftar Stasiun
 </h3>
 <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-sm">{stasiunList.length} Total</span>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-3">
 {isLoading && stasiunList.length === 0 ? (
 <div className="flex justify-center items-center h-40">
 <div className="animate-pulse bg-slate-200 rounded-sm h-8 w-8 border-b-2 border-teal-600"></div>
 </div>
 ) : (
 stasiunList.map((stasiun) => {
 const isActive = selectedStasiun?.id === stasiun.id;
 const status = useHydrologyStore.getState().qcStatus?.[stasiun.id];
 const health = useHydrologyStore.getState().stationHealth?.[stasiun.id];
 
 // Logic for Health Badge
 let healthColor = 'bg-slate-100 text-slate-500';
 let healthLabel = 'No Audit';
 
 if (status) {
 const passedCount = [status.konsisten, status.bebasOutlier, status.homogen].filter(Boolean).length;
 if (passedCount === 3) {
 healthColor = 'bg-emerald-500 text-white ';
 healthLabel = '🟢 Healthy';
 } else if (passedCount >= 1) {
 healthColor = 'bg-amber-500 text-white ';
 healthLabel = '🟡 Caution';
 } else {
 healthColor = 'bg-red-500 text-white ';
 healthLabel = '🔴 Unstable';
 }
 }

 return (
 <div
 key={stasiun.id}
 className={`group p-4 rounded-sm border transition-all duration-75 transform ] ${isActive
 ? 'bg-pupr-surface/50 border-pupr-blue '
 : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-teal-300 hover: text-slate-700 dark:text-slate-300'
 }`}
 >
 <div className="flex justify-between items-start">
 <div className="flex flex-col gap-1">
 <h4 className={`font-bold text-[15px] ${isActive ? 'text-pupr-blue' : 'text-slate-800 dark:text-slate-200'}`}>
 {stasiun.nama_stasiun}
 </h4>
 <div className="flex gap-1.5 flex-wrap">
 <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm w-fit tracking-tighter ${healthColor}`}>
 {healthLabel}
 </span>
 {health && (
 <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm w-fit tracking-tighter ${
 health.healthScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 
 health.healthScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
 }`}>
 Score: {health.healthScore}
 </span>
 )}
 </div>
 </div>
 <div className="flex gap-1">
 <button
 onClick={(e) => {
 e.stopPropagation();
 selectStasiun(stasiun);
 }}
 className={`p-1.5 rounded-sm ${isActive ? 'bg-pupr-blue text-white' : 'hover:bg-slate-100 text-slate-500'}`}
 title="Lihat Matriks Data"
 >
 <CloudRain className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setEditingStasiunId(stasiun.id);
 setFormStasiun({
 nama_stasiun: stasiun.nama_stasiun,
 koordinat_x: stasiun.koordinat_x?.toString() || '',
 koordinat_y: stasiun.koordinat_y?.toString() || '',
 elevasi: stasiun.elevasi?.toString() || '',
 keterangan: stasiun.keterangan || ''
 });
 setShowModalStasiun(true);
 }}
 className="p-1.5 rounded-sm hover:bg-slate-100 text-slate-500"
 title="Edit Stasiun"
 >
 <Edit2 className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={async (e) => {
 e.stopPropagation();
 if (window.confirm(`Apakah Anda yakin ingin menghapus stasiun ${stasiun.nama_stasiun}?`)) {
 try {
 await deleteStasiun(stasiun.id);
 } catch (err) {
 console.error(err);
 toast.error('Gagal menghapus stasiun.');
 }
 }
 }}
 className="p-1.5 rounded-sm hover:bg-red-50 text-red-500"
 title="Hapus Stasiun"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-2 mt-3">
 {health && health.periodStart ? (
 <div className="col-span-2 text-[10px] bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 mb-1">
 <div className="flex justify-between font-bold text-slate-500">
 <span>PERIODE DATA</span>
 <span>GAP: {health.missingPercentage}%</span>
 </div>
 <div className="text-slate-700 dark:text-slate-300 font-black mt-0.5">
 {health.periodStart} — {health.periodEnd} ({((health.periodEnd!) - (health.periodStart || 0)) + 1} Tahun)
 </div>
 </div>
 ) : null}
 <div className="text-xs px-2 py-1.5 rounded-sm bg-slate-50 dark:bg-slate-800 border border-slate-100">
 <span className="block text-[9px] uppercase tracking-wider mb-0.5 opacity-80 text-slate-500">Elevasi</span>
 <span className="font-semibold font-mono text-slate-700 dark:text-slate-300">{stasiun.elevasi} m</span>
 </div>
 <div className="text-xs px-2 py-1.5 rounded-sm bg-slate-50 dark:bg-slate-800 border border-slate-100">
 <span className="block text-[9px] uppercase tracking-wider mb-0.5 opacity-80 text-slate-500">Koordinat</span>
 <span className="font-semibold font-mono truncate text-slate-700 dark:text-slate-300">
 {stasiun.koordinat_y?.toFixed(2)}, {stasiun.koordinat_x?.toFixed(2)}
 </span>
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>

 <div className="lg:col-span-9 flex flex-col bg-white dark:bg-slate-900 rounded-none">
 {!selectedStasiun ? (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
 <div className="w-24 h-24 mb-6 bg-white dark:bg-slate-900 border border-teal-100 rounded-sm flex items-center justify-center">
 <Activity className="w-10 h-10 text-pupr-blue" />
 </div>
 <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Belum Ada Stasiun Terpilih</h3>
 <p className="text-sm text-slate-500 max-w-sm mb-6">
 Silakan pilih salah satu stasiun hujan di panel sebelah kiri atau muat stasiun pilot untuk mulai mengelola data.
 </p>
 {stasiunList.length === 0 && (
 <Button
 onClick={async () => {
 if (window.confirm('Muat stasiun pilot? Database akan dibersihkan terlebih dahulu untuk mencegah duplikasi.')) {
 // Professional Grade Cleanup: Remove potential orphans first
 if (supabase) {
 await supabase.from('master_stasiun').delete().neq('id', '00000000-0000-0000-0000-000000000000');
 }
 await seedInitialStations();
 toast.success('Daftar stasiun pilot berhasil dimuat ulang.');
 }
 }}
 className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
 >
 <Sparkles className="w-4 h-4 mr-2" />
 Muat Stasiun Pilot
 </Button>
 )} </div>
 ) : (
 <>
 <div className="p-5 border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 flex flex-wrap justify-between items-center gap-4">
 <div>
 <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2">
 <CloudRain className="w-5 h-5 text-pupr-blue" />
 Data Curah Hujan
 </h3>
 <p className="text-xs text-slate-500 font-medium mt-0.5">
 Stasiun: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedStasiun.nama_stasiun}</span>
 </p>
 </div>

 <div className="flex items-center gap-2">
 <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-sm border border-slate-200 dark:border-slate-700 ">
 <Calendar className="w-4 h-4 text-slate-500" />
 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">Tahun</span>
 <div className="relative">
 <select
 value={selectedYear}
 onChange={handleYearChange}
 className="appearance-none bg-transparent border-none text-sm font-bold text-slate-800 dark:text-slate-200 pr-6 pl-1 py-1 focus:ring-0 cursor-pointer outline-none"
 >
 {availableYears.map(year => (
 <option key={year} value={year}>{year}</option>
 ))}
 </select>
 <ChevronDown className="w-4 h-4 text-slate-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
 </div>
 </div>


 <Button onClick={handleInfillData} disabled={isInfilling || !selectedStasiun} size="sm" variant="outline" className="rounded-sm border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800">
 <Wand2 className={`w-4 h-4 mr-1 ${isInfilling ? 'animate-pulse' : ''}`} />
 <span className="hidden sm:inline">{isInfilling ? 'Memproses...' : 'Isi Kosong'}</span>
 </Button>
 <Button onClick={handleDeleteYear} disabled={!selectedStasiun || dataHujan.length === 0} size="sm" variant="outline" className="rounded-sm border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
 <Trash2 className="w-4 h-4 mr-1" />
 <span className="hidden sm:inline">Hapus Data Tahun Ini</span>
 </Button>
 <Button onClick={() => setShowModalHujan(true)} size="sm" className="rounded-sm bg-pupr-blue hover:bg-teal-700">
 <Plus className="w-4 h-4 mr-1" />
 <span className="hidden sm:inline">Tambah Data</span>
 </Button>
 </div>
 </div>

 <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 p-4 sm:p-5 relative pb-16">
 {isLoading && (
 <div className="absolute inset-0 bg-white dark:bg-slate-900 flex items-center justify-center z-10">
 <div className="animate-pulse bg-slate-200 rounded-sm h-10 w-10 border-4 border-slate-200 dark:border-slate-700 border-t-teal-600"></div>
 </div>
 )}

 <DailyRainfallMatrix data={displayData} year={selectedYear} onCellClick={handleCellClick} />

 {annualMaximums.length > 0 && (
 <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
 <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
 <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">
 Rekapitulasi Hujan Maksimum {
 activeRainfallSource === 'aljabar' ? '(Aljabar)' :
 activeRainfallSource === 'thiessen' ? '(Thiessen)' :
 activeRainfallSource === 'isohyet' ? '(Isohyet)' :
 'Tahunan'
 }
 </h4>
 </div>
 <div className="p-0 overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-slate-100 border-b border-slate-200 dark:border-slate-700">
 {annualMaximums.map(m => (
 <th key={m.tahun} className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-center text-xs font-bold text-slate-600 dark:text-slate-400">{m.tahun}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 <tr>
 {annualMaximums.map(m => (
 <td key={m.tahun} className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center font-bold text-pupr-blue tabular-nums">
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

 {dataHujan.length >= 10 && (
 <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900">
 <DataQualityDashboard />
 </div>
 )}
 </>
 )}
 </div>
 </div>

 {showModalStasiun && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
 <div className="bg-white dark:bg-slate-900 rounded-sm max-w-md w-full p-6">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{editingStasiunId ? 'Edit Stasiun' : 'Tambah Stasiun Baru'}</h3>
 <button onClick={() => {
 setShowModalStasiun(false);
 setEditingStasiunId(null);
 }} className="text-slate-500 hover:text-slate-600 dark:text-slate-400">
 <X className="w-5 h-5" />
 </button>
 </div>
 <form onSubmit={async (e) => {
 e.preventDefault();
 try {
 const payload = {
 nama_stasiun: formStasiun.nama_stasiun,
 koordinat_x: formStasiun.koordinat_x ? parseFloat(formStasiun.koordinat_x) : null,
 koordinat_y: formStasiun.koordinat_y ? parseFloat(formStasiun.koordinat_y) : null,
 elevasi: formStasiun.elevasi ? parseFloat(formStasiun.elevasi) : null,
 keterangan: formStasiun.keterangan || null
 };
 if (editingStasiunId) {
 await updateStasiun(editingStasiunId, payload);
 } else {
 await addStasiun(payload);
 }
 setShowModalStasiun(false);
 setEditingStasiunId(null);
 setFormStasiun({ nama_stasiun: '', koordinat_x: '', koordinat_y: '', elevasi: '', keterangan: '' });
 } catch (err) {
 console.error(err);
 }
 }} className="space-y-4">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Stasiun *</label>
 <input
 type="text"
 required
 value={formStasiun.nama_stasiun}
 onChange={(e) => setFormStasiun(prev => ({ ...prev, nama_stasiun: e.target.value }))}
 className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
 placeholder="Stasiun Cikampak"
 />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Longitude</label>
 <input
 type="number"
 step="any"
 value={formStasiun.koordinat_x}
 onChange={(e) => setFormStasiun(prev => ({ ...prev, koordinat_x: e.target.value }))}
 className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
 placeholder="106.7562"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Latitude</label>
 <input
 type="number"
 step="any"
 value={formStasiun.koordinat_y}
 onChange={(e) => setFormStasiun(prev => ({ ...prev, koordinat_y: e.target.value }))}
 className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
 placeholder="-6.5872"
 />
 </div>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Elevasi (m)</label>
 <input
 type="number"
 step="any"
 value={formStasiun.elevasi}
 onChange={(e) => setFormStasiun(prev => ({ ...prev, elevasi: e.target.value }))}
 className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
 placeholder="250"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Keterangan</label>
 <textarea
 value={formStasiun.keterangan}
 onChange={(e) => setFormStasiun(prev => ({ ...prev, keterangan: e.target.value }))}
 className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
 rows={2}
 placeholder="Tipe Manual. Terawat baik."
 />
 </div>
 <div className="flex gap-3 pt-2">
 <Button type="button" onClick={() => {
 setShowModalStasiun(false);
 setEditingStasiunId(null);
 }} variant="outline" className="flex-1 rounded-sm">
 Batal
 </Button>
 <Button type="submit" disabled={isLoading} className="flex-1 rounded-sm bg-pupr-blue hover:bg-teal-700">
 {isLoading ? 'Menyimpan...' : 'Simpan'}
 </Button>
 </div>
 </form>
 </div>
 </div>
 )}

 {showModalHujan && selectedStasiun && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
 <div className="bg-white dark:bg-slate-900 rounded-sm max-w-md w-full p-6">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Tambah Data Curah Hujan</h3>
 <button onClick={() => setShowModalHujan(false)} className="text-slate-500 hover:text-slate-600 dark:text-slate-400">
 <X className="w-5 h-5" />
 </button>
 </div>
 <form onSubmit={async (e) => {
 e.preventDefault();
 try {
 await addDataHujan({
 stasiun_id: selectedStasiun.id,
 tanggal: formHujan.tanggal,
 curah_hujan: parseFloat(formHujan.curah_hujan)
 });
 setShowModalHujan(false);
 setFormHujan({ tanggal: '', curah_hujan: '' });
 } catch (err) {
 console.error(err);
 }
 }} className="space-y-4">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tanggal *</label>
 <input
 type="date"
 required
 value={formHujan.tanggal}
 onChange={(e) => setFormHujan(prev => ({ ...prev, tanggal: e.target.value }))}
 className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Curah Hujan (mm) *</label>
 <input
 type="number"
 step="0.1"
 required
 value={formHujan.curah_hujan}
 onChange={(e) => setFormHujan(prev => ({ ...prev, curah_hujan: e.target.value }))}
 className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
 placeholder="0.0"
 />
 </div>
 <div className="bg-teal-50 border border-teal-200 rounded-sm p-3">
 <p className="text-xs text-teal-700">
 <span className="font-bold">Stasiun:</span> {selectedStasiun.nama_stasiun}
 </p>
 </div>
 <div className="flex gap-3 pt-2">
 <Button type="button" onClick={() => setShowModalHujan(false)} variant="outline" className="flex-1 rounded-sm">
 Batal
 </Button>
 <Button type="submit" disabled={isLoading} className="flex-1 rounded-sm bg-pupr-blue hover:bg-teal-700">
 {isLoading ? 'Menyimpan...' : 'Simpan'}
 </Button>
 </div>
 </form>
 </div>
 </div>
 )}

 {showModalBulk && selectedStasiun && (
 <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4 sm:p-10">
 <div className="bg-white dark:bg-slate-900 rounded-sm max-w-6xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-slate-300 dark:border-slate-600 animate-in fade-in zoom-in duration-200">
 <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-pupr-blue rounded-sm flex items-center justify-center ">
 <Activity className="w-6 h-6 text-pupr-blue" />
 </div>
 <div>
 <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">Bulk Input Curah Hujan</h3>
 <p className="text-xs text-slate-500 font-medium">Otomasi OCR PDF & Manual Paste Matriks 31x12</p>
 </div>
 </div>
 <button
 onClick={() => setShowModalBulk(false)}
 className="p-2.5 hover:bg-red-50 hover:text-red-500 rounded-sm transition-all text-slate-500 group"
 >
 <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
 </button>
 </div>

 <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-10 flex-1 overflow-hidden bg-white dark:bg-slate-900">
 <div className="flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar">
 <div className="flex items-center gap-4 bg-slate-100 p-3 rounded-sm border border-slate-200 dark:border-slate-700">
 <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tahun Target:</label>
 <input
 type="number"
 value={bulkYear}
 onChange={(e) => setBulkYear(parseInt(e.target.value))}
 className="w-28 px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-sm font-bold font-mono focus:ring-4 focus:ring-pupr-blue/10 focus:border-pupr-blue outline-none transition-all"
 />
 </div>

 <div className="relative group">
 <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 group-hover:border-pupr-blue rounded-sm bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center gap-4 transition-all hover:bg-pupr-blue/[0.02]">
 <div className="w-20 h-20 rounded-sm bg-white dark:bg-slate-900 border border-slate-100 flex items-center justify-center text-pupr-blue group- transition-transform">
 <CloudRain className="w-10 h-10" />
 </div>
 <div className="text-center">
 <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Otomasi PDF OCR</p>
 <p className="text-xs text-slate-500 mt-2 max-w-[280px] leading-relaxed">Unggah laporan BBWS (31x12). AI akan mengekstrak angka secara otomatis.</p>
 </div>
 <input
 ref={ocrFileInputRef}
 type="file"
 accept=".pdf"
 className="hidden"
 onChange={handlePdfUpload}
 />
 <Button
 onClick={() => ocrFileInputRef.current?.click()}
 disabled={isProcessingOcr}
 className="bg-pupr-blue hover:bg-slate-900 text-white w-full py-7 rounded-sm font-extrabold text-sm shadow-pupr-blue/20"
 >
 {isProcessingOcr ? (
 <>
 <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
 PROSES OCR AKTIF...
 </>
 ) : (
 <>
 <Upload className="w-5 h-5 mr-3" />
 UNGGAH PDF SEKARANG
 </>
 )}
 </Button>
 </div>
 </div>

 <div className="relative py-2">
 <div className="absolute inset-0 flex items-center">
 <span className="w-full border-t-2 border-slate-100"></span>
 </div>
 <div className="relative flex justify-center text-[11px] uppercase tracking-widest">
 <span className="bg-white dark:bg-slate-900 px-4 text-slate-500 font-extrabold italic">Atau Manual Paste</span>
 </div>
 </div>

 <textarea
 className="min-h-[160px] w-full p-5 font-mono text-[11px] border-2 border-slate-200 dark:border-slate-700 rounded-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none resize-none bg-slate-50 dark:bg-slate-800 transition-all leading-relaxed"
 placeholder="Paste teks baris 1-31 di sini jika ingin input manual..."
 value={bulkRawText}
 onChange={(e) => setBulkRawText(e.target.value)}
 />
 <Button
 onClick={handleBulkPreview}
 variant="outline"
 className="text-slate-600 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-800 hover:bg-slate-800 hover:text-white font-bold py-5 rounded-sm transition-all"
 >
 Pratinjau Data Manual
 </Button>
 </div>

 <div className="flex flex-col gap-4 overflow-hidden border-l border-slate-100 pl-4">
 <div className="flex justify-between items-center bg-slate-800 text-white px-4 py-3 rounded-sm ">
 <h4 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
 <Activity className="w-4 h-4 text-teal-400" />
 Hasil Parsing
 </h4>
 <span className="text-xs font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded">
 {bulkPreview?.length || 0} Data Terdeteksi
 </span>
 </div>

 <div className="flex-1 overflow-auto border-2 border-slate-100 rounded-sm bg-slate-50 dark:bg-slate-800 custom-scrollbar">
 {bulkPreview ? (
 <table className="w-full text-[11px] border-collapse">
 <thead className="bg-slate-200 sticky top-0 z-10">
 <tr>
 <th className="p-3 border-b border-slate-300 dark:border-slate-600 text-left font-extrabold text-slate-600 dark:text-slate-400">TANGGAL</th>
 <th className="p-3 border-b border-slate-300 dark:border-slate-600 text-right font-extrabold text-slate-600 dark:text-slate-400">CH (MM)</th>
 </tr>
 </thead>
 <tbody>
 {bulkPreview.slice(0, 200).map((row, idx) => (
 <tr key={idx} className="border-b border-slate-100 hover:bg-pupr-blue/[0.03] transition-colors">
 <td className="p-3 border-r border-slate-100 font-mono text-slate-600 dark:text-slate-400">{row.tanggal}</td>
 <td className="p-3 text-right font-bold text-pupr-blue tabular-nums text-sm">
 {row.curah_hujan.toFixed(1)}
 </td>
 </tr>
 ))}
 {bulkPreview.length > 200 && (
 <tr>
 <td colSpan={2} className="p-4 text-center text-slate-500 italic bg-white dark:bg-slate-900 font-medium">
 ... Menampilkan 200 dari {bulkPreview.length} baris data
 </td>
 </tr>
 )}
 </tbody>
 </table>
 ) : (
 <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 opacity-60">
 <Activity className="w-12 h-12 stroke-[1.5]" />
 <p className="text-sm font-medium">Belum ada data untuk diproses</p>
 </div>
 )}
 </div>

 <div className="pt-2">
 <Button
 onClick={handleBulkSave}
 disabled={!bulkPreview || bulkPreview.length === 0 || isLoading}
 className="w-full bg-pupr-blue hover:bg-slate-900 text-white py-8 rounded-sm font-extrabold text-base shadow-pupr-blue/30 disabled:opacity-50 disabled: transition-all "
 >
 {isLoading ? (
 <span className="flex items-center gap-2">
 <Activity className="w-5 h-5 animate-spin" />
 MENYIMPAN DATA...
 </span>
 ) : (
 'KONFIRMASI & SIMPAN KE DATABASE'
 )}
 </Button>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Audit & Selection Modal */}
 {showModalQC && (
 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
 <div className="bg-white dark:bg-slate-900 rounded-sm max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
 <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
 <div className="flex items-center gap-3">
 <Sparkles className="w-5 h-5 text-pupr-yellow" />
 <h3 className="text-sm font-black uppercase tracking-widest">Audit & Seleksi Project</h3>
 </div>
 <button onClick={() => setShowModalQC(false)} className="text-white/60 hover:text-white">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-6">
 <p className="text-xs text-slate-500 font-medium mb-4">Pilih stasiun dari database master untuk diaudit kesehatannya dan dihubungkan ke analisis statistik project.</p>
 
 <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 mb-6 custom-scrollbar">
 {!qcSummary ? (
 stasiunList.map((stasiun) => {
 const isSelected = selectedQCStations.includes(stasiun.id);
 return (
 <div
 key={stasiun.id}
 onClick={() => {
 if (isSelected) {
 setSelectedQCStations(prev => prev.filter(id => id !== stasiun.id));
 } else {
 setSelectedQCStations(prev => [...prev, stasiun.id]);
 }
 }}
 className={`flex items-center justify-between p-3 rounded-sm border-2 cursor-pointer transition-all ${
 isSelected ? 'border-pupr-blue bg-pupr-surface' : 'border-slate-100 hover:border-slate-200 dark:border-slate-700'
 }`}
 >
 <div className="flex items-center gap-3">
 <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
 isSelected ? 'bg-pupr-blue border-pupr-blue' : 'border-slate-300 dark:border-slate-600'
 }`}>
 {isSelected && <Activity className="w-3 h-3 text-white" />}
 </div>
 <div>
 <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">{stasiun.nama_stasiun}</span>
 </div>
 </div>
 </div>
 );
 })
 ) : (
 <div className="border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden bg-slate-50 dark:bg-slate-800">
 <table className="w-full text-[10px]">
 <thead className="bg-slate-100 border-b border-slate-200 dark:border-slate-700 font-bold">
 <tr>
 <th className="px-3 py-2 text-left">Stasiun</th>
 <th className="px-3 py-2 text-center">Konsisten</th>
 <th className="px-3 py-2 text-center">Outlier</th>
 <th className="px-3 py-2 text-center">Homogen</th>
 </tr>
 </thead>
 <tbody>
 {Object.entries(qcSummary).map(([id, status]: [string, any]) => {
 const stasiun = stasiunList.find(s => s.id === id);
 return (
 <tr key={id} className="border-b border-slate-100 bg-white dark:bg-slate-900">
 <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300">{stasiun?.nama_stasiun}</td>
 <td className="px-3 py-2 text-center">{status.konsisten ? '✅' : '❌'}</td>
 <td className="px-3 py-2 text-center">{status.bebasOutlier ? '✅' : '❌'}</td>
 <td className="px-3 py-2 text-center">{status.homogen ? '✅' : '❌'}</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>

 <div className="flex gap-3">
 <Button
 onClick={() => {
 setShowModalQC(false);
 setQcSummary(null);
 setQCProgress(null);
 }}
 variant="outline"
 className="flex-1 rounded-sm"
 >
 {qcSummary ? 'Tutup' : 'Batal'}
 </Button>
 {!qcSummary ? (
 <Button
 disabled={isQCLoading || selectedQCStations.length === 0}
 onClick={async () => {
 setIsQCLoading(true);
 try {
 const newQcStatus: Record<string, any> = {};
 const newQcResults: Record<string, any> = {};
 const newHealth: Record<string, any> = { ...stationHealth };
 const newAmsData: Record<string, any> = { ...stasiunAmsData };

 await Promise.all(selectedQCStations.map(async (stasiunId, index) => {
 const stasiunObj = stasiunList.find(s => s.id === stasiunId);
 setQCProgress({ current: index + 1, total: selectedQCStations.length, station: stasiunObj?.nama_stasiun || 'Unknown' });

 let allData: any[] = [];
 let hasMore = true;
 let page = 0;
 const pageSize = 1000;

 while (hasMore && supabase) {
 const { data, error } = await supabase
 .from('master_data_hujan')
 .select('tanggal, curah_hujan')
 .eq('stasiun_id', stasiunId)
 .order('tanggal', { ascending: true })
 .range(page * pageSize, (page + 1) * pageSize - 1);

 if (error) throw error;
 if (data && data.length > 0) {
 allData = [...allData, ...data];
 if (data.length < pageSize) hasMore = false;
 else page++;
 } else {
 hasMore = false;
 }
 }

 if (allData.length > 0) {
 newHealth[stasiunId] = calculateStationHealth(allData);
 const maxByYear: Record<number, number> = {};
 allData.forEach(row => {
 const y = parseInt(row.tanggal.split('-')[0], 10);
 const val = row.curah_hujan || 0;
 if (!maxByYear[y] || val > maxByYear[y]) maxByYear[y] = val;
 });

 const annualMax = Object.entries(maxByYear)
 .map(([year, hujan]) => ({ tahun: parseInt(year), hujan }))
 .sort((a, b) => a.tahun - b.tahun);
 
 newAmsData[stasiunId] = annualMax;

 if (annualMax.length >= 10) {
 const result = runFullQC(annualMax);
 newQcStatus[stasiunId] = {
 konsisten: result.isKonsisten,
 bebasOutlier: result.isBebasOutlier,
 homogen: result.isHomogen,
 };
 newQcResults[stasiunId] = result;
 }
 }
 }));

 setQCStatus(newQcStatus);
 setQCResults(newQcResults);
 setStasiunAmsData(newAmsData);
 setStationHealth(newHealth);
 setQcSummary(newQcStatus);
 toast.success('Audit Data Selesai.');
 } catch (err: any) {
 toast.error('Gagal audit: ' + err.message);
 } finally {
 setIsQCLoading(false);
 setQCProgress(null);
 }
 }}
 className="flex-1 rounded-sm bg-pupr-blue hover:bg-teal-700"
 >
 {isQCLoading ? (
 <span className="flex items-center gap-2">
 <Activity className="w-4 h-4 animate-spin" />
 Proses: {qcProgress?.current}/{qcProgress?.total}
 </span>
 ) : 'Jalankan Audit & QC'}
 </Button>
 ) : (
 <Button
 onClick={() => setShowModalQC(false)}
 className="flex-1 rounded-sm bg-emerald-600 hover:bg-emerald-700"
 >
 Lanjutkan ke Distribusi
 </Button>
 )}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
