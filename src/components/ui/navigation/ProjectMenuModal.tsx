import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FolderArchive,
  Download,
  Upload,
  RefreshCw,
  FileCheck,
  AlertCircle,
  X,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useOnboarding } from '@/providers/OnboardingProvider';
import {
  exportProjectBundle,
  downloadProjectFile,
  readProjectFile,
  applyProjectToStore,
  type ProjectPackagePayload
} from '@/services/projectPackageService';
import { toast } from '@/hooks/useToast';

export const ProjectMenuModal: React.FC = () => {
  const store = useHydrologyStore();
  const { resetOnboarding } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'new'>('export');

  // Export State
  const [author, setAuthor] = useState('Tenaga Ahli Hidrologi');
  const [institution, setInstitution] = useState('Konsultan Perencana SDA / Balai Wilayah Sungai');
  const [notes, setNotes] = useState('');

  // Import State
  const [importPreview, setImportPreview] = useState<ProjectPackagePayload | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleExport = () => {
    try {
      const bundle = exportProjectBundle(store, {
        author,
        institution,
        notes
      });
      downloadProjectFile(bundle);
      toast.success(`Paket proyek ${bundle.metadata.projectName} (.rekasda) berhasil diunduh.`);
      setIsOpen(false);
    } catch (err: any) {
      toast.error(`Gagal mengekspor proyek: ${err.message}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    setImportError(null);
    setImportPreview(null);

    try {
      const result = await readProjectFile(file);
      if (result.isValid && result.payload) {
        setImportPreview(result.payload);
        toast.info(`Berkas valid: ${result.payload.metadata.projectName}`);
      } else {
        setImportError(result.error || 'Format berkas tidak valid.');
        toast.error(result.error || 'Format berkas tidak valid.');
      }
    } catch (err: any) {
      setImportError(err.message || 'Gagal membaca berkas.');
    } finally {
      setIsReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyImport = () => {
    if (!importPreview) return;

    try {
      applyProjectToStore(importPreview, (partial) => {
        useHydrologyStore.setState(partial);
      });
      toast.success(`Proyek "${importPreview.metadata.projectName}" berhasil dipulihkan secara utuh!`);
      setIsOpen(false);
    } catch (err: any) {
      toast.error(`Gagal memulihkan proyek: ${err.message}`);
    }
  };

  const handleResetProject = () => {
    if (window.confirm('Apakah Anda yakin ingin memulai Proyek Baru? Seluruh data aktif akan di-reset ke nilai default.')) {
      useHydrologyStore.getState().resetProject();
      try {
        localStorage.removeItem('rekasda_ai_history');
        window.dispatchEvent(new Event('rekasda_ai_history_sync'));
      } catch (e) {
        console.warn('Gagal membersihkan riwayat AI chat:', e);
      }
      resetOnboarding(true);
      toast.success('Proyek baru dimulai. Seluruh lembar kerja dan modul telah di-reset ke nilai default.');
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Tombol Aksi di Header Navbar */}
      <div className="relative inline-flex items-center">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all shadow-xs"
          title="Manajemen Berkas Proyek Pemodelan"
        >
          <FolderArchive className="w-3.5 h-3.5 text-pupr-yellow" />
          <span>Kelola Proyek</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
      </div>

      {/* Modal Dialog via Portal to prevent header/nav stacking context clipping */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Modal Header */}
            <div className="bg-pupr-blue px-5 py-4 text-white flex items-center justify-between border-b-2 border-pupr-yellow">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-md">
                  <FolderArchive className="w-5 h-5 text-pupr-yellow" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Manajemen Paket Proyek (.rekasda)</h3>
                  <p className="text-[11px] text-slate-200 font-medium">Portabilitas & Pencadangan Seluruh Data Pemodelan Hidrologi SDA</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 text-xs font-bold">
              <button
                onClick={() => setActiveTab('export')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 transition-all ${
                  activeTab === 'export'
                    ? 'border-pupr-blue text-pupr-blue bg-white rounded-t-md shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor Proyek (.rekasda)
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 transition-all ${
                  activeTab === 'import'
                    ? 'border-pupr-blue text-pupr-blue bg-white rounded-t-md shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Impor / Buka Proyek
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 transition-all ${
                  activeTab === 'new'
                    ? 'border-amber-600 text-amber-700 bg-white rounded-t-md shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Proyek Baru / Reset
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-700">
              {/* TAB 1: EXPORT */}
              {activeTab === 'export' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-md text-xs space-y-1">
                    <p className="font-bold text-pupr-blue flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4" />
                      Paket Proyek Lengkap Terpadu
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Berkas <code>.rekasda</code> menyimpan seluruh konfigurasi <strong>Data Master</strong> (Identitas, Morfometri DAS, Tutupan Lahan), <strong>seluruh data harian stasiun</strong>, serta hasil pemodelan <strong>Frekuensi, Banjir, Neraca, Embung, dan Saluran</strong>.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Proyek</span>
                      <strong className="text-slate-800 truncate block">{store.identitasLokasi?.namaPekerjaan || 'Proyek Tanpa Judul'}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">DAS</span>
                      <strong className="text-slate-800 truncate block">{store.identitasLokasi?.namaDAS || (store.morfometriDAS ? 'Model DAS' : '-')}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Stasiun Hujan</span>
                      <strong className="text-slate-800 block">{store.stasiunList?.length || 0} Stasiun</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Data Harian</span>
                      <strong className="text-slate-800 block">{store.dataHujan?.length?.toLocaleString('id-ID') || 0} Baris</strong>
                    </div>
                  </div>

                  {/* Metadata Input Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama Penyusun / Tenaga Ahli</label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-pupr-blue"
                        placeholder="Nama Tenaga Ahli"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Instansi / Konsultan</label>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-pupr-blue"
                        placeholder="Nama Instansi / BWS / Konsultan"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Catatan / Keterangan Skenario</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-pupr-blue"
                        placeholder="Catatan skenario kalibrasi atau asumsi desain..."
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleExport}
                      className="px-4 py-2 bg-pupr-blue text-white rounded text-xs font-bold hover:bg-[#092b4d] transition-all flex items-center gap-2 shadow-xs"
                    >
                      <Download className="w-4 h-4 text-pupr-yellow" />
                      Unduh Berkas Proyek (.rekasda)
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: IMPORT */}
              {activeTab === 'import' && (
                <div className="space-y-4">
                  {/* Dropzone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-pupr-blue rounded-lg p-6 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/30"
                  >
                    <Upload className="w-8 h-8 text-pupr-blue mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-bold text-slate-800">Klik atau geser berkas .rekasda / .json ke sini</p>
                    <p className="text-[11px] text-slate-500 mt-1">Mendukung format berkas paket resmi RekasDA Pro v1.0 & v1.1</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".rekasda,.json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {isReadingFile && (
                    <div className="p-3 text-center text-xs text-slate-600 animate-pulse">
                      Membaca dan memverifikasi integritas berkas proyek...
                    </div>
                  )}

                  {importError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{importError}</span>
                    </div>
                  )}

                  {/* Preview Box */}
                  {importPreview && (
                    <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-3.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Paket Proyek Terverifikasi</span>
                        </div>
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          v{importPreview.schemaVersion}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[11px] text-slate-500">Nama Pekerjaan:</span>
                          <p className="font-bold text-slate-800">{importPreview.metadata.projectName}</p>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500">DAS / Sungai:</span>
                          <p className="font-bold text-slate-800">{importPreview.metadata.dasName} / {importPreview.metadata.riverName}</p>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500">Penyusun & Instansi:</span>
                          <p className="text-slate-700">{importPreview.metadata.author} ({importPreview.metadata.institution})</p>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500">Data Stasiun & Deret:</span>
                          <p className="text-slate-700">{importPreview.metadata.totalStations} Stasiun ({importPreview.metadata.totalDailyRecords} baris data)</p>
                        </div>
                      </div>

                      {/* Modeling Modules Checklist */}
                      <div className="pt-2 border-t border-emerald-200/60">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight block mb-1.5">Kesiapan Modul Analisis:</span>
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          <span className={`px-2 py-0.5 rounded ${importPreview.summary.hasFrequency ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-slate-100 text-slate-500'}`}>
                            {importPreview.summary.hasFrequency ? '✓' : '—'} Frekuensi
                          </span>
                          <span className={`px-2 py-0.5 rounded ${importPreview.summary.hasFlood ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-slate-100 text-slate-500'}`}>
                            {importPreview.summary.hasFlood ? '✓' : '—'} Banjir Rencana
                          </span>
                          <span className={`px-2 py-0.5 rounded ${importPreview.summary.hasWaterBalance ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-slate-100 text-slate-500'}`}>
                            {importPreview.summary.hasWaterBalance ? '✓' : '—'} Neraca Air
                          </span>
                          <span className={`px-2 py-0.5 rounded ${importPreview.summary.hasEmbung ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-slate-100 text-slate-500'}`}>
                            {importPreview.summary.hasEmbung ? '✓' : '—'} Embung
                          </span>
                          <span className={`px-2 py-0.5 rounded ${importPreview.summary.hasChannel ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-slate-100 text-slate-500'}`}>
                            {importPreview.summary.hasChannel ? '✓' : '—'} Saluran Manning
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[11px] text-amber-700 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Memuat proyek akan menimpa lembar kerja aktif.
                        </span>
                        <button
                          onClick={handleApplyImport}
                          className="px-3.5 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Pulihkan Proyek Ini
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: NEW / RESET */}
              {activeTab === 'new' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Mulai Proyek Baru & Bersihkan Lembar Kerja
                    </p>
                    <p className="text-amber-800 leading-relaxed">
                      Aksi ini akan mereset seluruh formulir Data Master, menghapus deret stasiun hujan lokal yang sedang aktif, dan mengosongkan hasil kalkulasi banjir, neraca, embung, serta saluran.
                    </p>
                    <p className="text-slate-600 font-medium">
                      <em>Saran: Jika Anda memiliki pekerjaan penting, lakukan <strong>Ekspor Proyek (.rekasda)</strong> terlebih dahulu sebelum melakukan reset.</em>
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleResetProject}
                      className="px-4 py-2 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Konfirmasi Reset Lembar Kerja
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Standar Ekspor-Impor SNI RekasDA Pro v1.1</span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
