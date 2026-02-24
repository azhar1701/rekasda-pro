import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WaterBalanceInputs, calculateWaterBalance, getWaterBalanceSummary, WaterBalanceResult } from '@/services/waterBalanceEngine';
import { WaterBalanceChart } from './WaterBalanceChart';
import { DependableFlowModal } from '@/components/ui/modals/DependableFlowModal';
import { LocationIdentity } from '@/components/common/LocationIdentity';
import { saveWaterBalance } from '@/services/calculationService';
import { WaterBalancePilotDataLoader } from './WaterBalancePilotDataLoader';
import { SNILabel, ComplianceBadge } from '@/components/ui/data-display/ComplianceComponents';
import { WaterBalanceFormulaDisplay } from '@/components/ui/data-display/WaterBalanceFormulaDisplay';
import { Collapsible } from '@/components/ui/Collapsible';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Droplet } from 'lucide-react';

import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

interface LocationData {
  channelName: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  coordinates?: { lat: number; lng: number };
  photoUrl?: string;
}

interface Props {
  onConsultAI?: () => void;
}

export const WaterBalanceTab: React.FC<Props> = ({ onConsultAI }) => {
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);

  const [inputs, setInputs] = useState<WaterBalanceInputs>({
    population: 5000,
    agricultureArea: 100,
    domesticStandard: 100,
    irrigationDemand: 1.0,
    monthlySupply: [2.5, 2.3, 2.0, 1.8, 1.5, 1.2, 1.0, 0.9, 1.1, 1.4, 1.8, 2.2]
  });

  const [results, setResults] = useState<WaterBalanceResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const kpiCardsRef = useStaggerAnimation(50);



  useEffect(() => {
    const balanceResults = calculateWaterBalance(inputs);
    setResults(balanceResults);
    setSummary(getWaterBalanceSummary(balanceResults));
  }, [inputs]);

  const handleSupplyChange = (index: number, value: number) => {
    const newSupply = [...inputs.monthlySupply];
    newSupply[index] = value;
    setInputs({ ...inputs, monthlySupply: newSupply });
  };

  const handleUseCalculatedFlow = (flow: number[]) => {
    setInputs({ ...inputs, monthlySupply: flow });
  };

  const totalSupply = inputs.monthlySupply.reduce((a, b) => a + b, 0);
  const totalDemand = results.reduce((a, b) => a + Number(b.totalDemand), 0);
  const netBalance = totalSupply - totalDemand;

  const handleLoadPilotData = (data: any) => {
    setInputs({
      population: data.inputs.population,
      agricultureArea: data.inputs.agricultureArea,
      domesticStandard: data.inputs.domesticStandard,
      irrigationDemand: data.inputs.irrigationDemand,
      monthlySupply: data.inputs.monthlySupply
    });
    setLocationData({
      channelName: data.location.channelName,
      kabupaten: data.location.kabupaten,
      kecamatan: data.location.kecamatan,
      desa: data.location.desa,
      coordinates: data.location.coordinates
    });
    setLoadMessage(`✓ Data pilot "${data.name}" berhasil dimuat`);
    setTimeout(() => setLoadMessage(null), 3000);
  };

  const handleSaveWaterBalance = async () => {
    const projectName = locationData?.channelName;
    if (!projectName) {
      setSaveMessage({ type: 'error', text: 'Mohon isi Nama Saluran di Identitas Lokasi terlebih dahulu' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    try {
      const { error } = await saveWaterBalance({
        projectName,
        monthlyInputs: { ...inputs, location: locationData },
        monthlyResults: results,
        summary
      });

      if (error) {
        setSaveMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
      } else {
        setSaveMessage({ type: 'success', text: '✓ Berhasil menyimpan neraca air!' });
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui';
      setSaveMessage({ type: 'error', text: 'Error: ' + errorMessage });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModuleLayout
      title="Analisis Neraca Air"
      description="Water Balance Analysis Dashboard • SNI 6728.1:2015"
      icon={<Droplet className="w-6 h-6" />}
      iconColorClass="bg-blue-50 text-blue-600"
    >
      {/* Load Message Toast */}
      {loadMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-2xl shadow-lg border border-slate-200 bg-blue-50 text-blue-800 flex items-center gap-3 animate-fade-in max-w-md pointer-events-none">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <span className="font-medium text-sm">{loadMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">

        {/* LEFT SIDEBAR (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="lg:sticky lg:top-0 lg:h-full lg:overflow-y-auto lg:pr-2 space-y-4 pb-4">

            {/* Data Pilot & Location Identity - Combined */}
            <Collapsible title="Data Pilot & Identitas Lokasi" defaultOpen={true}>
              <div className="space-y-4">
                <WaterBalancePilotDataLoader onLoad={handleLoadPilotData} />
                <div className="border-t border-white/20 pt-4">
                  <LocationIdentity onLocationChange={setLocationData} />
                </div>
              </div>
            </Collapsible>

            {/* Formula Display */}
            <Collapsible title="Rumus Neraca Air" defaultOpen={false}>
              <WaterBalanceFormulaDisplay />
            </Collapsible>

            {/* SECTION 1: PARAMETER GLOBAL */}
            <Collapsible title="Parameter Masukan" defaultOpen={true}>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                    Jumlah Penduduk
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={inputs.population}
                      onChange={e => setInputs({ ...inputs, population: parseFloat(e.target.value) || 0 })}
                      className="w-full h-12 px-4 pr-16 text-base bg-slate-50 border border-slate-300 rounded-lg font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">jiwa</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                    Luas Lahan Irigasi
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={inputs.agricultureArea}
                      onChange={e => setInputs({ ...inputs, agricultureArea: parseFloat(e.target.value) || 0 })}
                      className="w-full h-12 px-4 pr-16 text-base bg-slate-50 border border-slate-300 rounded-lg font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">Ha</span>
                  </div>
                </div>

                <div>
                  <SNILabel
                    label="Standar Kebutuhan Air"
                    tooltip="Standar kebutuhan air domestik berdasarkan SNI untuk perencanaan sistem penyediaan air minum"
                    sniCode="SNI 03-7065-2005"
                  />
                  <div className="relative">
                    <input
                      type="number"
                      value={inputs.domesticStandard}
                      onChange={e => setInputs({ ...inputs, domesticStandard: parseFloat(e.target.value) || 0 })}
                      className="w-full h-12 px-4 pr-20 text-base bg-slate-50 border border-slate-300 rounded-lg font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">L/org/hr</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                    Kebutuhan Irigasi
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={inputs.irrigationDemand}
                      onChange={e => setInputs({ ...inputs, irrigationDemand: parseFloat(e.target.value) || 0 })}
                      className="w-full h-12 px-4 pr-20 text-base bg-slate-50 border border-slate-300 rounded-lg font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">L/s/Ha</span>
                  </div>
                </div>
              </div>
            </Collapsible>

            {/* SECTION 2: DEBIT ANDALAN */}
            <Collapsible title="Debit Andalan" defaultOpen={true} badge="SNI 6738:2015">

              <button
                onClick={() => setIsCalcModalOpen(true)}
                className="w-full min-h-[44px] py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 active:from-blue-800 active:to-cyan-800 transition-all shadow-md mb-4 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Kalkulator Hujan
              </button>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Data Bulanan (m³/s)</span>
                  <button
                    onClick={() => setIsInputModalOpen(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((month, index) => (
                    <div key={month} className="bg-white rounded-md px-2 py-2 border border-slate-200 text-center">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">{month}</div>
                      <div className="text-sm font-bold text-slate-700 font-mono">{inputs.monthlySupply[index]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Collapsible>
          </div>
        </div>

        {/* MAIN CONTENT (Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6 min-h-0 page-enter">

          {/* Save Message Toast */}
          {saveMessage && (
            <div className={`absolute top-0 right-0 z-50 px-6 py-4 rounded-lg shadow-lg border flex items-center gap-3 animate-fade-in pointer-events-none ${saveMessage.type === 'success' ? 'bg-emerald-50/90 backdrop-blur-md border-emerald-500 text-emerald-800' : 'bg-red-50/90 backdrop-blur-md border-red-500 text-red-800'
              }`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {saveMessage.type === 'success' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
              <span className="font-semibold text-sm">{saveMessage.text}</span>
            </div>
          )}

          {/* KPI CARDS */}
          <div ref={kpiCardsRef} className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3">
            <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-5 group relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  Total Ketersediaan
                  <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                    Total ketersediaan air dari sumber (debit andalan)
                  </div>
                </span>
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600 font-mono">{totalSupply.toFixed(1)}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">m³/s</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group relative transition-all duration-fast hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  Total Kebutuhan
                  <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                    Total kebutuhan air domestik dan pertanian
                  </div>
                </span>
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-600 font-mono">{totalDemand.toFixed(1)}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">m³/s</div>
            </div>

            <div className={`bg-white rounded-xl shadow-sm border-2 ${netBalance >= 0 ? 'border-emerald-300 bg-emerald-50/30' : 'border-rose-300 bg-rose-50/30'} p-5 group relative transition-all duration-fast hover:-translate-y-1 hover:shadow-lg`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  Status Neraca
                  <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                    Selisih antara ketersediaan dan kebutuhan air
                  </div>
                </span>
                <div className={`w-10 h-10 rounded-lg ${netBalance >= 0 ? 'bg-emerald-100' : 'bg-rose-100'} flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={netBalance >= 0 ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                  </svg>
                </div>
              </div>
              <div className={`text-3xl font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'} font-mono`}>
                {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(1)}
              </div>
              <div className={`text-xs font-semibold mt-1 ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netBalance >= 0 ? 'SURPLUS' : 'DEFISIT'}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <ComplianceBadge sniCode="SNI 19-6728.1-2002" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-rose-200 p-5 group relative transition-all duration-fast hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  Bulan Kritis
                  <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                    Bulan dengan defisit air terbesar
                  </div>
                </span>
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-rose-600">{summary?.criticalMonth?.month || '-'}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">
                {summary?.criticalMonth ? `${Math.abs(summary.criticalMonth.balance).toFixed(1)} m³/s` : 'Tidak ada'}
              </div>
            </div>
          </div>

          {/* CHART SECTION */}
          <div className="bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-4 md:p-6 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">Grafik Neraca Air Bulanan</h2>
                  <ComplianceBadge sniCode="SNI 19-6728.1-2002" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Perbandingan Ketersediaan vs Kebutuhan Air</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleSaveWaterBalance}
                  disabled={isSaving}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span className="hidden sm:inline">{isSaving ? 'Menyimpan...' : 'Simpan Neraca'}</span>
                  <span className="sm:hidden">{isSaving ? 'Simpan...' : 'Simpan'}</span>
                </button>
                {onConsultAI && (
                  <button
                    onClick={onConsultAI}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 active:bg-slate-900 transition-colors text-sm font-bold flex items-center justify-center gap-2 shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="hidden sm:inline">Analisis AI</span>
                    <span className="sm:hidden">AI</span>
                  </button>
                )}
              </div>
            </div>
            <div className="h-56 xs:h-64 sm:h-80 md:h-96">
              <WaterBalanceChart data={results} />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200/60">
              <p className="text-xs text-slate-600">
                <span className="font-semibold">Catatan:</span> Perhitungan mengikuti standar <span className="font-semibold text-blue-600">SNI 19-6728.1-2002</span> tentang Penyusunan Neraca Sumber Daya Air pada Wilayah Sungai.
              </p>
            </div>
          </div>

          {/* TABLE SECTION - Collapsible */}
          <Collapsible title="Tabel Detail Bulanan" defaultOpen={true} badge="12 Bulan">
            <p className="text-xs text-slate-500 mb-4">Data lengkap neraca air per bulan</p>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[400px] border border-white/50 rounded-xl relative shadow-inner bg-white/40 backdrop-blur-md">
              <table className="w-full">
                <thead className="bg-slate-50/80 backdrop-blur-md border-b border-white/50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wide">Bulan</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-blue-600 uppercase tracking-wide">Debit Andalan</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wide">Domestik</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wide">Irigasi</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-emerald-600 uppercase tracking-wide">Debit Lingkungan</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-orange-600 uppercase tracking-wide">Total Demand</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wide">Neraca</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${row.balance < 0 ? 'bg-rose-50/30' : ''} even:bg-slate-50/50 hover:bg-slate-100/50 transition-colors`}>
                      <td className="py-3 px-4 font-bold text-slate-700">{row.month}</td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-600 font-mono">{row.supply}</td>
                      <td className="py-3 px-4 text-right text-slate-600 font-mono">{row.domesticDemand}</td>
                      <td className="py-3 px-4 text-right text-slate-600 font-mono">{row.agricultureDemand}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-mono">{row.environmentalFlow}</td>
                      <td className="py-3 px-4 text-right font-semibold text-orange-600 font-mono">{row.totalDemand}</td>
                      <td className={`py-3 px-4 text-right font-bold font-mono ${row.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {row.balance >= 0 ? '+' : ''}{row.balance}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${row.status === 'Surplus' ? 'bg-emerald-100 text-emerald-700' :
                          row.status === 'Defisit' ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: Card View */}
            <div className="md:hidden space-y-3">
              {results.map((row, i) => (
                <div key={i} className={`p-4 rounded-lg border space-y-3 ${row.balance < 0 ? 'bg-rose-50/30 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900">{row.month}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${row.status === 'Surplus' ? 'bg-emerald-100 text-emerald-700' :
                      row.status === 'Defisit' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                      {row.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-1">Supply</div>
                      <div className="font-bold text-blue-600">{row.supply} m³/s</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-1">Total Demand</div>
                      <div className="font-bold text-orange-600">{row.totalDemand} m³/s</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-1">Domestik</div>
                      <div className="font-semibold text-slate-700">{row.domesticDemand} m³/s</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-1">Pertanian</div>
                      <div className="font-semibold text-slate-700">{row.agricultureDemand} m³/s</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-1">Debit Lingkungan</div>
                      <div className="font-semibold text-emerald-700">{row.environmentalFlow} m³/s</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-xs text-slate-500 font-medium mb-1">Neraca</div>
                    <div className={`text-lg font-bold ${row.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.balance >= 0 ? '+' : ''}{row.balance} m³/s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Collapsible>
        </div>
      </div >

      {/* MODALS */}
      < DependableFlowModal
        isOpen={isCalcModalOpen}
        onClose={() => setIsCalcModalOpen(false)}
        onApply={handleUseCalculatedFlow}
      />

      {
        isInputModalOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsInputModalOpen(false)}>
            <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Input Data Debit Bulanan</h3>
                  <p className="text-xs text-slate-500 mt-1">Ketersediaan Air (m³/s)</p>
                </div>
                <button onClick={() => setIsInputModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                {MONTHS.map((month, index) => (
                  <div key={month} className="bg-white/50 backdrop-blur-md rounded-lg p-4 border border-white/60 shadow-inner">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">{month}</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.monthlySupply[index]}
                        onChange={e => handleSupplyChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full h-12 px-4 pr-16 text-lg bg-white/70 border border-slate-200 rounded-lg font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">m³/s</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setIsInputModalOpen(false)}
                  className="px-6 py-3 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors shadow-md backdrop-blur-md"
                >
                  Simpan & Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </ModuleLayout >
  );
};
