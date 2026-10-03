import React, { useState, useEffect, useMemo } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { getAllCalculations, AllCalculationsData } from '@/services/allCalculationsService';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';
import { OfficialReportDocument } from './OfficialReportDocument';
import { 
  aggregateActiveReportData, 
  aggregateHistoricalProjectData, 
  defaultKopData, 
  defaultSectionsConfig 
} from '../services/reportDataAggregator';
import { ExecutiveReportPayload, ReportKopData, ReportSectionsConfig } from '../types/report.types';
import { exportExecutiveSummaryToExcel } from '@/utils/excelService';
import { consultHydrologist } from '@/services/geminiService';
import { toast } from '@/hooks/useToast';
import { 
  FileText, 
  Printer, 
  FileSpreadsheet, 
  SlidersHorizontal, 
  Settings2, 
  Sparkles, 
  History, 
  Database,
  Building,
  X
} from 'lucide-react';

export const ExecutiveDashboard: React.FC = () => {
  const store = useHydrologyStore();
  const { isFrekuensiDirty, isBanjirDirty, isNeracaDirty } = store;
  const isDirty = isFrekuensiDirty || isBanjirDirty || isNeracaDirty;

  // State: Source Mode (Active Workspace vs History)
  const [dataSource, setDataSource] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [historyItems, setHistoryItems] = useState<AllCalculationsData[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // State: KOP Surat & Sections Configuration
  const [kopData, setKopData] = useState<ReportKopData>(defaultKopData);
  const [sectionsConfig, setSectionsConfig] = useState<ReportSectionsConfig>(defaultSectionsConfig);
  const [customAiSummary, setCustomAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Modals
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);

  // Load history list when switching to HISTORY mode
  useEffect(() => {
    if (dataSource === 'HISTORY') {
      setLoadingHistory(true);
      getAllCalculations()
        .then((items: AllCalculationsData[]) => {
          setHistoryItems(items);
          if (items.length > 0 && !selectedHistoryId) {
            setSelectedHistoryId(items[0].id);
          }
        })
        .catch((err: unknown) => {
          console.error('Gagal memuat riwayat kalkulasi:', err);
          toast.error('Gagal memuat riwayat proyek tersimpan.');
        })
        .finally(() => setLoadingHistory(false));
    }
  }, [dataSource, selectedHistoryId]);

  // Aggregate active report payload
  const activeReport = useMemo<ExecutiveReportPayload>(() => {
    if (dataSource === 'HISTORY' && selectedHistoryId) {
      const found = historyItems.find((h) => h.id === selectedHistoryId);
      if (found) {
        const payload = aggregateHistoricalProjectData(found);
        return {
          ...payload,
          kop: { ...payload.kop, ...kopData },
          sectionsConfig: { ...sectionsConfig },
          aiSummary: customAiSummary || payload.aiSummary
        };
      }
    }

    const payload = aggregateActiveReportData(store);
    return {
      ...payload,
      kop: { ...payload.kop, ...kopData },
      sectionsConfig: { ...sectionsConfig },
      aiSummary: customAiSummary || payload.aiSummary
    };
  }, [dataSource, selectedHistoryId, historyItems, store, kopData, sectionsConfig, customAiSummary]);

  // Check if active workspace has data
  const hasActiveData = Boolean(
    store.identitasLokasi?.namaPekerjaan || 
    store.hasilBanjir || 
    store.hasilNeraca || 
    store.hasilEmbung || 
    store.hasilSaluran || 
    store.hasilAnalisisFrekuensi
  );

  // Handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    try {
      toast.info('Menyusun lembar kerja Excel...');
      await exportExecutiveSummaryToExcel(activeReport);
      toast.success('Laporan Excel berhasil diunduh!');
    } catch (err) {
      console.error('Gagal ekspor Excel:', err);
      toast.error('Terjadi kesalahan saat mengekspor Excel.');
    }
  };

  const handleGenerateAISummary = async () => {
    setIsAiLoading(true);
    try {
      const context = JSON.stringify({
        proyek: activeReport.identitas.namaPekerjaan,
        das: activeReport.identitas.namaDAS,
        luasDAS: activeReport.identitas.luasDas,
        debitBanjir: activeReport.banjir?.debitPuncak,
        metodeBanjir: activeReport.banjir?.metode,
        neracaAir: activeReport.neraca?.netBalance,
        bulanKritis: activeReport.neraca?.bulanKritis,
        embungReduksi: activeReport.embung?.reduksiPuncak,
        saluranKapasitas: activeReport.saluran?.dischargeCapacity,
        saluranKecepatan: activeReport.saluran?.velocity,
        saluranStatus: activeReport.saluran?.isSafe
      });

      const prompt = `Bertindaklah sebagai Ahli Madya Teknik Sumber Daya Air (SDA) bersertifikasi LPJK. Berikan sintesis ringkasan eksekutif 2 hingga 3 paragraf mengenai kelayakan teknis perancangan ini berdasarkan standar SNI 2415:2016, SNI 19-6728.1-2002, dan Pd T-03-2005-A. Ulas aspek debit banjir, kecukupan ketersediaan air, fungsi embung, dan kapasitas saluran terbuka secara lugas dan profesional untuk pengambil keputusan.`;

      const aiResponse = await consultHydrologist(prompt, context);
      if (aiResponse && !aiResponse.includes('kesalahan')) {
        setCustomAiSummary(aiResponse);
        toast.success('Sintesis rekomendasi teknis AI berhasil diperbarui!');
      } else {
        toast.warning('Menggunakan kesimpulan teknis heuristik SNI bawaan.');
      }
    } catch (e) {
      console.warn('AI fallback:', e);
      toast.error('Layanan AI tidak dapat diakses, menggunakan ringkasan standar.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <ModuleLayout
      title="Executive Summary & Pelaporan Resmi"
      description="Laporan kelayakan teknis terpadu dari hulu ke hilir berbasis kaidah SNI & Standar Rekayasa SDA"
      icon={<FileText className="w-6 h-6" />}
      iconColorClass="bg-[#0c3a66] text-white"
      actions={
        <div className="flex flex-wrap items-center gap-2 no-print">
          {/* Section Settings */}
          <button
            onClick={() => setIsSectionsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors"
            title="Pilih Bab Laporan yang Ditampilkan"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pilihan Bab</span>
          </button>

          {/* KOP & Signature Settings */}
          <button
            onClick={() => setIsKopModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors"
            title="Kustomisasi KOP Surat & Lembar Pengesahan"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">KOP & Pengesahan</span>
          </button>

          {/* AI Synthesis */}
          <button
            onClick={handleGenerateAISummary}
            disabled={isAiLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-colors disabled:opacity-50"
            title="Sintesis Narasi Eksekutif Otomatis Menggunakan AI Gemini"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            {isAiLoading ? 'Menyintesis...' : 'Sintesis AI'}
          </button>

          {/* Excel Export */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 transition-colors shadow-sm"
            title="Unduh Lembar Kerja Multi-Sheet Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          {/* Print PDF Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0c3a66] hover:bg-[#082846] text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            title="Cetak atau Simpan Dokumen Laporan Teknis A4 (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Dokumen A4
          </button>
        </div>
      }
    >
      {/* Dependency Warning */}
      {isDirty && (
        <div className="mb-6 no-print space-y-2">
          {isFrekuensiDirty && <DependencyWarningBanner module="frekuensi" />}
          {isBanjirDirty && <DependencyWarningBanner module="banjir" />}
          {isNeracaDirty && <DependencyWarningBanner module="neraca" />}
        </div>
      )}

      {/* Source Selector Bar (Active vs History) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sumber Data:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-bold">
            <button
              onClick={() => setDataSource('ACTIVE')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                dataSource === 'ACTIVE' 
                  ? 'bg-[#0c3a66] text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Sesi Aktif (Live Workspace)
            </button>
            <button
              onClick={() => setDataSource('HISTORY')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                dataSource === 'HISTORY' 
                  ? 'bg-[#0c3a66] text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Pilih dari Arsip Riwayat
            </button>
          </div>
        </div>

        {/* History Selector Dropdown */}
        {dataSource === 'HISTORY' && (
          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <select
              value={selectedHistoryId || ''}
              onChange={(e) => setSelectedHistoryId(e.target.value)}
              disabled={loadingHistory || historyItems.length === 0}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0c3a66]"
            >
              {loadingHistory ? (
                <option value="">Memuat daftar arsip proyek...</option>
              ) : historyItems.length === 0 ? (
                <option value="">Tidak ada arsip perhitungan ditemukan</option>
              ) : (
                historyItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.type.toUpperCase()}] {item.project_name} ({new Date(item.created_at).toLocaleDateString('id-ID')})
                  </option>
                ))
              )}
            </select>
          </div>
        )}
      </div>

      {/* Empty State Warning if Active Workspace is completely blank */}
      {dataSource === 'ACTIVE' && !hasActiveData ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center my-6 shadow-sm no-print">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0c3a66] flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Data Sesi Aktif Masih Kosong</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
            Anda belum melakukan perhitungan di workspace ini. Anda dapat beralih ke <strong>"Pilih dari Arsip Riwayat"</strong> untuk mencetak data yang pernah disimpan, atau mulai input data di modul Master & Analisis.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setDataSource('HISTORY')}
              className="px-4 py-2 bg-[#0c3a66] hover:bg-[#082846] text-white text-xs font-bold rounded-lg transition-colors"
            >
              Buka dari Arsip Riwayat
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigateToTab', { detail: '/master' }))}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-300"
            >
              Input Data Master
            </button>
          </div>
        </div>
      ) : null}

      {/* Main Document Presentation */}
      <div className="mt-2">
        <OfficialReportDocument report={activeReport} />
      </div>

      {/* =====================================================================
          MODAL: KUSTOMISASI KOP SURAT & LEMBAR PENGESAHAN
          ===================================================================== */}
      {isKopModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0c3a66] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-bold">KOP Surat & Penandatangan Dokumen</h3>
              </div>
              <button 
                onClick={() => setIsKopModalOpen(false)} 
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Instansi / Perusahaan Konsultan</label>
                <input
                  type="text"
                  value={kopData.instansi}
                  onChange={(e) => setKopData({ ...kopData, instansi: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Balai / Dinas Pengelola</label>
                <input
                  type="text"
                  value={kopData.balai}
                  onChange={(e) => setKopData({ ...kopData, balai: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Dokumen</label>
                  <input
                    type="text"
                    value={kopData.nomorDokumen}
                    onChange={(e) => setKopData({ ...kopData, nomorDokumen: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Dokumen</label>
                  <select
                    value={kopData.statusDokumen}
                    onChange={(e) => setKopData({ ...kopData, statusDokumen: e.target.value as any })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-medium"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="REVIEW">REVIEW</option>
                    <option value="FINAL">FINAL</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block mb-2">Penandatangan Teknis</span>
                
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-0.5">Nama Tenaga Ahli Penyusun</label>
                    <input
                      type="text"
                      value={kopData.penandatangan.penyusun}
                      onChange={(e) => setKopData({
                        ...kopData,
                        penandatangan: { ...kopData.penandatangan, penyusun: e.target.value }
                      })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-0.5">Nama Lead Hydrologist / Verifikator</label>
                    <input
                      type="text"
                      value={kopData.penandatangan.verifikator}
                      onChange={(e) => setKopData({
                        ...kopData,
                        penandatangan: { ...kopData.penandatangan, verifikator: e.target.value }
                      })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-0.5">Nama Pengguna Jasa / PPK</label>
                    <input
                      type="text"
                      value={kopData.penandatangan.penggunaJasa}
                      onChange={(e) => setKopData({
                        ...kopData,
                        penandatangan: { ...kopData.penandatangan, penggunaJasa: e.target.value }
                      })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end">
              <button
                onClick={() => setIsKopModalOpen(false)}
                className="px-4 py-2 bg-[#0c3a66] hover:bg-[#082846] text-white text-xs font-bold rounded-lg transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: KUSTOMISASI PILIHAN BAB LAPORAN
          ===================================================================== */}
      {isSectionsModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-[#0c3a66] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-bold">Kustomisasi Bagian Laporan</h3>
              </div>
              <button 
                onClick={() => setIsSectionsModalOpen(false)} 
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-500 mb-2">
                Pilih bab atau elemen yang ingin disertakan dalam dokumen cetak dan ekspor Excel:
              </p>

              {[
                { key: 'showKop', label: 'KOP Surat Resmi & No. Dokumen' },
                { key: 'showIdentitas', label: '1. Identitas Proyek & Morfometri DAS' },
                { key: 'showFrekuensi', label: '2. Analisis Frekuensi Curah Hujan R24' },
                { key: 'showBanjir', label: '3. Analisis Debit Banjir Rancangan' },
                { key: 'showNeraca', label: '4. Neraca Sumber Daya Air Bulanan' },
                { key: 'showEmbung', label: '5. Evaluasi Kinerja Situ & Embung' },
                { key: 'showSaluran', label: '6. Desain Hidraulik Saluran Terbuka' },
                { key: 'showAiSummary', label: '7. Kesimpulan & Rekomendasi Teknis' },
                { key: 'showPengesahan', label: '8. Lembar Verifikasi & Tanda Tangan' }
              ].map(({ key, label }) => (
                <label 
                  key={key} 
                  className="flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <span className="font-semibold text-slate-800">{label}</span>
                  <input
                    type="checkbox"
                    checked={sectionsConfig[key as keyof ReportSectionsConfig]}
                    onChange={(e) => setSectionsConfig({
                      ...sectionsConfig,
                      [key]: e.target.checked
                    })}
                    className="w-4 h-4 text-[#0c3a66] rounded focus:ring-[#0c3a66]"
                  />
                </label>
              ))}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end">
              <button
                onClick={() => setIsSectionsModalOpen(false)}
                className="px-4 py-2 bg-[#0c3a66] hover:bg-[#082846] text-white text-xs font-bold rounded-lg transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  );
};
