import React, { useState } from 'react';
import { AllCalculationsData } from '@/services/allCalculationsService';
import { TableGovTech } from '@/components/ui/TableGovTech';
import { exportToExcel } from '@/utils/excelService';
import { 
  Waves, 
  Droplets, 
  CloudRain, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck,
  Database,
  Copy,
  Check,
  FileSpreadsheet,
  ExternalLink,
  MapPin
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  data: AllCalculationsData | null;
  onClose: () => void;
}

export const AllDataDetailModal: React.FC<Props> = ({ isOpen, data, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!isOpen || !data) return null;

  const getTypeLabel = (type: string) => {
    if (type === 'manning') return 'Saluran Manning';
    if (type === 'flood') return 'Banjir Rasional';
    if (type === 'water_balance') return 'Neraca Air';
    if (type === 'embung') return 'Analisis Embung';
    return type;
  };

  const getTypeStyle = (type: string) => {
    if (type === 'manning') return { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30', icon: <Waves className="w-5 h-5 text-blue-400" /> };
    if (type === 'flood') return { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30', icon: <CloudRain className="w-5 h-5 text-red-400" /> };
    if (type === 'water_balance') return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', icon: <Droplets className="w-5 h-5 text-emerald-400" /> };
    if (type === 'embung') return { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/30', icon: <Database className="w-5 h-5 text-teal-400" /> };
    return { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30', icon: <Layers className="w-5 h-5 text-slate-400" /> };
  };

  const typeStyle = getTypeStyle(data.type);

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  const handleNavigateToModule = () => {
    const tabMap: Record<string, string> = {
      manning: '/saluran',
      flood: '/banjir',
      water_balance: '/neraca',
      embung: '/embung',
    };
    const target = tabMap[data.type] || '/saluran';
    window.dispatchEvent(new CustomEvent('navigateToTab', { detail: target }));
    onClose();
  };

  const handleExportIndividualExcel = async () => {
    setExporting(true);
    try {
      const rows: Record<string, any>[] = [];
      const d = data.data || {};

      if (data.type === 'manning') {
        const res = d.results || {};
        const inp = d.inputs || {};
        rows.push({
          Parameter: 'Debit Desain (Q)',
          Nilai: res.Discharge || '-',
          Satuan: 'm³/s'
        });
        rows.push({
          Parameter: 'Kecepatan Aliran (V)',
          Nilai: res.Velocity || '-',
          Satuan: 'm/s'
        });
        rows.push({
          Parameter: 'Luas Basah (A)',
          Nilai: res.Area || '-',
          Satuan: 'm²'
        });
        rows.push({
          Parameter: 'Jari-jari Hidrolis (R)',
          Nilai: res.Radius || '-',
          Satuan: 'm'
        });
        rows.push({
          Parameter: 'Status Keamanan',
          Nilai: res.SafetyStatus || '-',
          Satuan: '-'
        });
        rows.push({
          Parameter: 'Lebar Dasar (B)',
          Nilai: inp.bottomWidth || '-',
          Satuan: 'm'
        });
        rows.push({
          Parameter: 'Kedalaman Air (h)',
          Nilai: inp.waterDepth || '-',
          Satuan: 'm'
        });
      } else if (data.type === 'flood') {
        const res = d.results || {};
        rows.push({
          Parameter: 'Metode',
          Nilai: d.method || 'Rasional',
          Satuan: '-'
        });
        rows.push({
          Parameter: 'Debit Puncak (Qp)',
          Nilai: res.qPeak || '-',
          Satuan: 'm³/s'
        });
        rows.push({
          Parameter: 'Waktu Puncak (tc)',
          Nilai: res.tPeak || '-',
          Satuan: 'jam'
        });
        rows.push({
          Parameter: 'Volume Total',
          Nilai: res.volume || '-',
          Satuan: 'm³'
        });
        if (res.returnPeriods && Array.isArray(res.returnPeriods)) {
          res.returnPeriods.forEach((rp: any) => {
            rows.push({
              Parameter: `Debit Kala Ulang ${rp.period} Th`,
              Nilai: rp.qPeak || '-',
              Satuan: 'm³/s'
            });
          });
        }
      } else if (data.type === 'water_balance') {
        const monthly = d.monthly_results || [];
        monthly.forEach((m: any) => {
          rows.push({
            Bulan: m.month,
            Ketersediaan: m.supply,
            Kebutuhan: m.totalDemand,
            Neraca: m.balance,
            Status: m.status
          });
        });
      } else if (data.type === 'embung') {
        const inp = d.input_data || d.inputs || {};
        const res = d.result_data || d.results || {};
        rows.push({
          Parameter: 'Tipe Analisis',
          Nilai: d.analysis_type || 'Kapasitas',
          Satuan: '-'
        });
        Object.entries(res).forEach(([key, val]) => {
          if (typeof val === 'number' || typeof val === 'string') {
            rows.push({
              Parameter: key,
              Nilai: val,
              Satuan: '-'
            });
          }
        });
        Object.entries(inp).forEach(([key, val]) => {
          if (typeof val === 'number' || typeof val === 'string') {
            rows.push({
              Parameter: `Input: ${key}`,
              Nilai: val,
              Satuan: '-'
            });
          }
        });
      }

      const fileName = `Detail_${data.type}_${data.project_name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await exportToExcel(rows.length > 0 ? rows : [{ Keterangan: 'Data Kosong' }], fileName, 'Hasil Perhitungan');
    } catch (e) {
      console.error('Gagal export individual Excel:', e);
    } finally {
      setExporting(false);
    }
  };

  // --- RENDERS ---
  const renderManningDetail = () => {
    const results = data.data.results;
    if (!results) return null;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
              <Waves className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Debit Rancangan (Q)</span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">{results.Discharge}</p>
              <span className="text-sm font-bold text-slate-500">m³/s</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Kecepatan Aliran (V)</span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">{results.Velocity}</p>
              <span className="text-sm font-bold text-slate-500">m/s</span>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-5 shadow-sm border ${results.SafetyStatus === 'Aman' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {results.SafetyStatus === 'Aman' ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-rose-600" />
              )}
              <div>
                <span className={`text-xs font-bold uppercase tracking-wide block mb-1 ${results.SafetyStatus === 'Aman' ? 'text-emerald-700' : 'text-rose-700'}`}>Status Keamanan</span>
                <p className={`text-lg font-extrabold tracking-tight ${results.SafetyStatus === 'Aman' ? 'text-emerald-900' : 'text-rose-900'}`}>
                  {results.SafetyStatus}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold uppercase tracking-wide block mb-1 ${results.SafetyStatus === 'Aman' ? 'text-emerald-700' : 'text-rose-700'}`}>Tipe Aliran</span>
              <p className={`text-lg font-extrabold tracking-tight ${results.SafetyStatus === 'Aman' ? 'text-emerald-900' : 'text-rose-900'}`}>
                {results.FlowType}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Geometri Saluran
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="p-4">
              <span className="text-xs text-slate-500 block mb-1">Luas Basah (A)</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{results.Area} <span className="text-xs text-slate-500 font-normal">m²</span></span>
            </div>
            <div className="p-4">
              <span className="text-xs text-slate-500 block mb-1">Jari-jari Hidrolis (R)</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{results.Radius} <span className="text-xs text-slate-500 font-normal">m</span></span>
            </div>
            <div className="p-4">
              <span className="text-xs text-slate-500 block mb-1">Angka Froude (Fr)</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{results.Froude}</span>
            </div>
            <div className="p-4 bg-slate-50/50">
              <span className="text-xs text-slate-500 block mb-1">Tinggi Jagaan</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{results.Freeboard} <span className="text-xs text-slate-500 font-normal">m</span></span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFloodDetail = () => {
    const results = data.data.results;
    if (!results) return null;
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 rounded-xl p-5 shadow-sm border border-purple-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wide block mb-1">Metode Analisis</span>
            <span className="text-lg font-extrabold text-purple-900">{data.data.method || 'Rasional'}</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wide block mb-1">Volume Banjir</span>
            <span className="text-xl font-extrabold text-purple-900 tabular-nums">{(results.volume / 1000)?.toFixed(1)} <span className="text-sm font-bold text-purple-700">×10³ m³</span></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Debit Puncak (Q)</span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">{results.qPeak?.toFixed(2)}</p>
              <span className="text-sm font-bold text-slate-500">m³/s</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Waktu Puncak (tc)</span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">{results.tPeak?.toFixed(2)}</p>
              <span className="text-sm font-bold text-slate-500">jam</span>
            </div>
          </div>
        </div>

        {results.returnPeriods && results.returnPeriods.length > 0 && (
          <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-slate-400" />
                Debit Kala Ulang
              </h3>
            </div>
            <TableGovTech 
              columns={[
                { key: 'period', label: 'Kala Ulang', align: 'left' },
                { key: 'qPeak', label: 'Debit Puncak (m³/s)', align: 'right', numeric: true },
              ]}
              data={results.returnPeriods.map((rp: any) => ({
                period: rp.period,
                qPeak: rp.qPeak?.toFixed(2)
              }))}
              stickyHeader={false}
              zebraStripe={true}
            />
          </div>
        )}
      </div>
    );
  };

  const renderWaterBalanceDetail = () => {
    const totalSupply = data.data.monthly_inputs?.monthlySupply?.reduce((a: number, b: number) => a + b, 0) || 0;
    const summary = data.data.summary;
    const monthlyResults = data.data.monthly_results || [];
    const netBalance = totalSupply - monthlyResults.reduce((sum: number, r: any) => sum + parseFloat(r.totalDemand || 0), 0);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Total Ketersediaan</span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">{totalSupply.toFixed(1)}</p>
              <span className="text-sm font-bold text-slate-500">m³/s</span>
            </div>
          </div>
          <div className={`rounded-xl p-5 shadow-sm border ${netBalance >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <span className={`text-xs font-bold uppercase tracking-wide block mb-1 ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Status Neraca Tahunan</span>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-extrabold tracking-tight tabular-nums ${netBalance >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(1)}
              </p>
              <span className={`text-sm font-bold ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>m³/s</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
            <span className="text-xs text-slate-500 block mb-1 font-bold">Bulan Surplus</span>
            <span className="text-2xl font-bold text-emerald-600 tabular-nums">{summary?.surplusMonths || 0}</span>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
            <span className="text-xs text-slate-500 block mb-1 font-bold">Bulan Defisit</span>
            <span className="text-2xl font-bold text-rose-600 tabular-nums">{summary?.deficitMonths || 0}</span>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl shadow-sm text-center">
            <span className="text-xs text-orange-700 block mb-1 font-bold">Bulan Kritis</span>
            <span className="text-2xl font-bold text-orange-900">{summary?.criticalMonth?.month || '-'}</span>
          </div>
        </div>

        {monthlyResults.length > 0 && (
          <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Neraca Bulanan
              </h3>
            </div>
            <TableGovTech 
              columns={[
                { key: 'month', label: 'Bulan', align: 'left' },
                { key: 'supply', label: 'Andalan (m³/s)', align: 'right', numeric: true },
                { key: 'demand', label: 'Kebutuhan (m³/s)', align: 'right', numeric: true },
                { key: 'balance', label: 'Neraca (m³/s)', align: 'right', numeric: true },
                { key: 'status', label: 'Status', align: 'center' },
              ]}
              data={monthlyResults.map((r: any) => ({
                month: r.month,
                supply: parseFloat(r.supply || 0).toFixed(2),
                demand: parseFloat(r.totalDemand || 0).toFixed(2),
                balance: parseFloat(r.balance || 0).toFixed(2),
                status: (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    r.status === 'Surplus' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {r.status}
                  </span>
                )
              }))}
              stickyHeader={false}
              zebraStripe={true}
            />
          </div>
        )}
      </div>
    );
  };

  const renderEmbungDetail = () => {
    const embungData = data.data || {};
    const analysisType = embungData.analysis_type || 'capacity';
    const res = embungData.result_data || embungData.results || {};
    const inp = embungData.input_data || embungData.inputs || {};

    const analysisTypeLabels: Record<string, string> = {
      capacity: 'Kapasitas Tampungan (Sequent Peak / Rippl)',
      routing: 'Penelusuran Banjir (Level-Pool Routing)',
      water_balance: 'Pola Operasi & Neraca Air Embung',
      sedimentation: 'Analisis Usia & Laju Sedimentasi'
    };

    return (
      <div className="space-y-6">
        <div className="bg-teal-50 rounded-xl p-5 shadow-sm border border-teal-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wide block mb-1">Tipe Analisis Embung</span>
            <span className="text-base sm:text-lg font-extrabold text-teal-950">
              {analysisTypeLabels[analysisType] || analysisType}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wide block mb-1">Standar Desain</span>
            <span className="text-xs font-bold px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full">
              Pd T-03-2005-A / SNI
            </span>
          </div>
        </div>

        {/* Primary Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Tampungan Efektif</span>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {res.effectiveStorage ? Number(res.effectiveStorage).toLocaleString('id-ID') : (res.storageRequired ? Number(res.storageRequired).toLocaleString('id-ID') : '-')}
              </p>
              <span className="text-xs font-bold text-slate-500">m³</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Tampungan Mati (Dead)</span>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {res.deadStorage ? Number(res.deadStorage).toLocaleString('id-ID') : (res.sedimentStorage ? Number(res.sedimentStorage).toLocaleString('id-ID') : '-')}
              </p>
              <span className="text-xs font-bold text-slate-500">m³</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Total Kapasitas Desain</span>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-extrabold text-teal-700 tracking-tight tabular-nums">
                {res.totalCapacity ? Number(res.totalCapacity).toLocaleString('id-ID') : (res.grossStorage ? Number(res.grossStorage).toLocaleString('id-ID') : '-')}
              </p>
              <span className="text-xs font-bold text-slate-500">m³</span>
            </div>
          </div>
        </div>

        {/* Supplementary Metrics */}
        {(res.peakInflow || res.peakOutflow || res.attenuationPercent !== undefined || res.maxWaterLevel) && (
          <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Waves className="w-4 h-4 text-teal-600" />
                Parameter Hidraulik & Penelusuran Banjir
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              <div className="p-4">
                <span className="text-xs text-slate-500 block mb-1">Inflow Puncak (Qin)</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {res.peakInflow ? Number(res.peakInflow).toFixed(2) : '-'} <span className="text-xs text-slate-500 font-normal">m³/s</span>
                </span>
              </div>
              <div className="p-4">
                <span className="text-xs text-slate-500 block mb-1">Outflow Puncak (Qout)</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {res.peakOutflow ? Number(res.peakOutflow).toFixed(2) : '-'} <span className="text-xs text-slate-500 font-normal">m³/s</span>
                </span>
              </div>
              <div className="p-4">
                <span className="text-xs text-slate-500 block mb-1">Reduksi Puncak</span>
                <span className="text-base font-bold text-emerald-600 tabular-nums">
                  {res.attenuationPercent !== undefined ? `${Number(res.attenuationPercent).toFixed(1)}%` : '-'}
                </span>
              </div>
              <div className="p-4 bg-slate-50/50">
                <span className="text-xs text-slate-500 block mb-1">Muka Air Maksimum</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {res.maxWaterLevel ? Number(res.maxWaterLevel).toFixed(2) : '-'} <span className="text-xs text-slate-500 font-normal">m DPL</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Input Parameters Preview */}
        {Object.keys(inp).length > 0 && (
          <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                Parameter Input Perancangan
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 text-xs">
              {Object.entries(inp).slice(0, 9).map(([key, val]) => (
                <div key={key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase truncate" title={key}>{key}</span>
                  <span className="font-semibold text-slate-800 text-xs truncate block">
                    {typeof val === 'object' ? JSON.stringify(val).substring(0, 24) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 px-6 py-5 shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            {typeStyle.icon}
          </div>

          <div className="flex items-start justify-between relative z-10">
            <div className="pr-12">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                  {typeStyle.icon}
                  {getTypeLabel(data.type)}
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {data.location && (
                  <span className="text-slate-400 text-xs flex items-center gap-1 font-medium bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {data.location.latitude && data.location.longitude 
                      ? `${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}`
                      : 'Ada Koordinat'}
                  </span>
                )}
                {data.isLocalOnly && (
                  <span className="text-amber-300 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    Lokal
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {data.project_name || 'Detail Proyek Tanpa Nama'}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              title="Tutup Modal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1 space-y-6">
          {data.type === 'manning' && renderManningDetail()}
          {data.type === 'flood' && renderFloodDetail()}
          {data.type === 'water_balance' && renderWaterBalanceDetail()}
          {data.type === 'embung' && renderEmbungDetail()}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJSON}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
              title="Salin Data JSON ke Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copied ? 'Tersalin!' : 'Salin JSON'}
            </button>

            <button
              onClick={handleExportIndividualExcel}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
              title="Unduh Lembar Excel untuk Analisis Ini"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              {exporting ? 'Mengunduh...' : 'Export Excel'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNavigateToModule}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              title="Buka Data ini di Modul Perhitungan Terkait"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka di Modul
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

