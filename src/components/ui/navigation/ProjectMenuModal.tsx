import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FolderArchive,
  Download,
  Upload,
  RefreshCw,
  FileCheck,
  AlertCircle,
  X,
  ChevronDown,
  Trash2,
  FolderOpen,
  Save,
  Layers,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useOnboarding } from '@/providers/OnboardingProvider';
import {
  exportProjectBundle,
  downloadProjectFile,
  readProjectFile,
  applyProjectToStore,
  type ProjectPackagePayload,
} from '@/services/projectPackageService';
import {
  saveUnifiedProject,
  getUnifiedProjectList,
  getUnifiedProjectById,
  deleteUnifiedProject,
  generateUUID,
} from '@/services/unifiedProjectService';
import { type UnifiedProjectMetadata, type UnifiedProjectEntity } from '@/types/unifiedProject.types';
import { toast } from '@/hooks/useToast';

export const ProjectMenuModal: React.FC = () => {
  const store = useHydrologyStore();
  const { resetOnboarding } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'katalog' | 'export' | 'import' | 'new'>('katalog');

  // Katalog State
  const [savedProjects, setSavedProjects] = useState<UnifiedProjectMetadata[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isSavingCatalog, setIsSavingCatalog] = useState(false);

  // Export State
  const [author, setAuthor] = useState('Tenaga Ahli Hidrologi');
  const [institution, setInstitution] = useState('Konsultan Perencana SDA / Balai Wilayah Sungai');
  const [notes, setNotes] = useState('');

  // Import State
  const [importPreview, setImportPreview] = useState<ProjectPackagePayload | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memuat daftar proyek tersimpan saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      loadCatalog();
    }
  }, [isOpen]);

  // Listener event eksternal untuk membuka modal katalog proyek
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setActiveTab('katalog');
    };
    window.addEventListener('openProjectModal', handleOpen);
    return () => window.removeEventListener('openProjectModal', handleOpen);
  }, []);

  const loadCatalog = async () => {
    setIsLoadingCatalog(true);
    try {
      const list = await getUnifiedProjectList();
      setSavedProjects(list);
    } catch (err: any) {
      console.warn('Gagal memuat katalog proyek:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const handleSaveCurrentToCatalog = async () => {
    setIsSavingCatalog(true);
    try {
      const currentStore = useHydrologyStore.getState();
      const identitas = currentStore.identitasLokasi;

      const projectId = currentStore.currentProjectId || generateUUID();
      const projectCode =
        currentStore.currentProjectCode ||
        `PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const projectName = identitas?.namaPekerjaan || 'Proyek Hidrologi SDA';

      const entity: UnifiedProjectEntity = {
        metadata: {
          id: projectId,
          projectCode,
          name: projectName,
          dasName: identitas?.namaDAS || (currentStore.morfometriDAS ? 'Model DAS' : 'DAS Tidak Terdefinisi'),
          riverName: identitas?.namaSungai || undefined,
          province: identitas?.provinsi || undefined,
          regency: identitas?.kabupaten || undefined,
          author,
          institution,
          latitude: identitas?.koordinat?.lat || null,
          longitude: identitas?.koordinat?.lng || null,
          status: 'DRAFT',
          schemaVersion: '2.0',
          notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        masterData: {
          identitasLokasi: currentStore.identitasLokasi,
          morfometriDAS: currentStore.morfometriDAS,
          tutupanLahan: currentStore.tutupanLahan,
          stasiunList: currentStore.stasiunList || [],
          curahHujanWilayah: currentStore.curahHujanWilayah,
          activeRainfallSource: currentStore.activeRainfallSource || 'titik',
          dataHujan: currentStore.dataHujan || [],
          arealRainfallAlgebraic: currentStore.arealRainfallAlgebraic || null,
          arealRainfallThiessen: currentStore.arealRainfallThiessen || null,
          arealRainfallIsohyet: currentStore.arealRainfallIsohyet || null,
        },
        analysisResults: {
          analisisFrekuensi: currentStore.analisisFrekuensi || undefined,
          curahHujanRencana: currentStore.curahHujanRencana || undefined,
          hasilARF: currentStore.hasilARF || undefined,
          distribusiHujanJamJaman: currentStore.distribusiHujanJamJaman || undefined,
          durasiHujan: currentStore.durasiHujan,
          hujanEfektif: currentStore.hujanEfektif || undefined,
          hasilBanjir: currentStore.hasilBanjir || undefined,
          hasilBanjirEmpiris: currentStore.hasilBanjirEmpiris || undefined,
          hasilBanjirHSS: currentStore.hasilBanjirHSS || undefined,
          hasilKonvolusi: currentStore.hasilKonvolusi || undefined,
          hasilNeraca: currentStore.hasilNeraca || undefined,
          hasilMock: currentStore.hasilMock || undefined,
          neracaFinal: currentStore.neracaFinal || undefined,
          hasilEmbung: currentStore.hasilEmbung || undefined,
          hasilSaluran: currentStore.hasilSaluran || undefined,
          qcResults: currentStore.qcResults || undefined,
          qcStatus: currentStore.qcStatus || undefined,
        },
        summaryMetrics: {
          totalStations: currentStore.stasiunList?.length || 0,
          totalDailyRecords: currentStore.dataHujan?.length || 0,
        },
        snapshots: [],
      };

      await saveUnifiedProject(entity);
      store.setCurrentProject(projectId, projectCode, projectName);
      await loadCatalog();
      toast.success(`Proyek "${projectName}" berhasil disimpan ke Katalog Proyek!`);
    } catch (err: any) {
      toast.error(`Gagal menyimpan proyek ke katalog: ${err.message}`);
    } finally {
      setIsSavingCatalog(false);
    }
  };

  const handleOpenSavedProject = async (projectId: string) => {
    try {
      const project = await getUnifiedProjectById(projectId);
      if (!project) {
        toast.error('Proyek tidak ditemukan.');
        return;
      }

      // Terapkan ke store melalui applyProjectToStore adapter
      const packagePayload: ProjectPackagePayload = {
        app: 'RekasDA Pro',
        schemaVersion: project.metadata.schemaVersion,
        metadata: {
          projectId: project.metadata.id,
          projectCode: project.metadata.projectCode,
          projectName: project.metadata.name,
          dasName: project.metadata.dasName,
          riverName: project.metadata.riverName || '-',
          location: `${project.metadata.regency || '-'}, ${project.metadata.province || '-'}`,
          author: project.metadata.author,
          institution: project.metadata.institution,
          createdAt: project.metadata.createdAt,
          exportedAt: project.metadata.updatedAt,
          schemaVersion: project.metadata.schemaVersion,
          app: 'RekasDA Pro',
          totalStations: project.masterData.stasiunList?.length || 0,
          totalDailyRecords: project.masterData.dataHujan?.length || 0,
          notes: project.metadata.notes,
        },
        state: {
          identitasLokasi: project.masterData.identitasLokasi,
          morfometriDAS: project.masterData.morfometriDAS,
          tutupanLahan: project.masterData.tutupanLahan,
          stasiunList: project.masterData.stasiunList,
          curahHujanWilayah: project.masterData.curahHujanWilayah,
          activeRainfallSource: project.masterData.activeRainfallSource,
          dataHujan: project.masterData.dataHujan,
          arealRainfallAlgebraic: project.masterData.arealRainfallAlgebraic || null,
          arealRainfallThiessen: project.masterData.arealRainfallThiessen || null,
          arealRainfallIsohyet: project.masterData.arealRainfallIsohyet || null,
          analisisFrekuensi: project.analysisResults.analisisFrekuensi || null,
          selectedKalaUlang: 25,
          curahHujanRencana: project.analysisResults.curahHujanRencana || '0',
          hasilARF: project.analysisResults.hasilARF || null,
          distribusiHujanJamJaman: project.analysisResults.distribusiHujanJamJaman || null,
          durasiHujan: project.analysisResults.durasiHujan || 6,
          hujanEfektif: project.analysisResults.hujanEfektif || null,
          hasilBanjir: project.analysisResults.hasilBanjir || null,
          hasilBanjirEmpiris: project.analysisResults.hasilBanjirEmpiris || null,
          hasilBanjirHSS: project.analysisResults.hasilBanjirHSS || null,
          hasilKonvolusi: project.analysisResults.hasilKonvolusi || null,
          hasilNeraca: project.analysisResults.hasilNeraca || null,
          hasilMock: project.analysisResults.hasilMock || null,
          neracaFinal: project.analysisResults.neracaFinal || null,
          hasilEmbung: project.analysisResults.hasilEmbung || null,
          hasilSaluran: project.analysisResults.hasilSaluran || null,
          qcResults: project.analysisResults.qcResults || null,
          qcStatus: project.analysisResults.qcStatus || null,
        },
      };

      applyProjectToStore(packagePayload, (partial) => {
        useHydrologyStore.setState(partial);
      });
      store.setCurrentProject(project.metadata.id, project.metadata.projectCode, project.metadata.name);

      toast.success(`Proyek "${project.metadata.name}" berhasil dibuka dan dimuat ke lembar kerja.`);
      setIsOpen(false);
    } catch (err: any) {
      toast.error(`Gagal membuka proyek: ${err.message}`);
    }
  };

  const handleDeleteSavedProject = async (projectId: string, name: string) => {
    if (window.confirm(`Hapus proyek "${name}" beserta seluruh riwayat perhitungannya dari katalog?`)) {
      try {
        await deleteUnifiedProject(projectId);
        if (store.currentProjectId === projectId) {
          store.setCurrentProject(null, null, null);
        }
        await loadCatalog();
        toast.info(`Proyek "${name}" berhasil dihapus dari katalog.`);
      } catch (err: any) {
        toast.error(`Gagal menghapus proyek: ${err.message}`);
      }
    }
  };

  const handleExport = () => {
    try {
      const bundle = exportProjectBundle(store, {
        author,
        institution,
        notes,
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
    if (
      window.confirm(
        'Apakah Anda yakin ingin memulai Proyek Baru? Seluruh data aktif di lembar kerja akan di-reset ke nilai default.'
      )
    ) {
      useHydrologyStore.getState().resetProject();
      store.setCurrentProject(null, null, null);
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
          {store.currentProjectCode && (
            <span className="hidden lg:inline-block bg-teal-500/30 text-teal-200 border border-teal-400/40 text-[10px] px-1.5 py-0.2 rounded font-mono">
              {store.currentProjectCode}
            </span>
          )}
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
                    <h3 className="text-sm font-bold tracking-tight">Manajemen Proyek Terpadu</h3>
                    <p className="text-[11px] text-slate-200 font-medium">
                      Pusat Kendali Proyek Hidrologi, Katalog Tersimpan & Portabilitas (.rekasda)
                    </p>
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
              <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-1.5 text-xs font-bold overflow-x-auto">
                <button
                  onClick={() => setActiveTab('katalog')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'katalog'
                      ? 'border-pupr-blue text-pupr-blue bg-white rounded-t-md shadow-xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Katalog Proyek ({savedProjects.length})
                </button>
                <button
                  onClick={() => setActiveTab('export')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'export'
                      ? 'border-pupr-blue text-pupr-blue bg-white rounded-t-md shadow-xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Ekspor (.rekasda)
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'import'
                      ? 'border-pupr-blue text-pupr-blue bg-white rounded-t-md shadow-xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Buka Berkas (.rekasda)
                </button>
                <button
                  onClick={() => setActiveTab('new')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-all whitespace-nowrap ${
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
                {/* TAB 1: KATALOG PROYEK TERSIMPAN */}
                {activeTab === 'katalog' && (
                  <div className="space-y-4">
                    {/* Status Proyek Aktif & Tombol Simpan Cepat */}
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[11px] font-semibold text-blue-700 block uppercase tracking-wider">
                          Lembar Kerja Aktif Saat Ini
                        </span>
                        <p className="font-bold text-slate-800 text-sm">
                          {store.identitasLokasi?.namaPekerjaan || 'Proyek Hidrologi Tanpa Judul'}
                        </p>
                        <span className="text-slate-500 text-[11px]">
                          DAS: <strong>{store.identitasLokasi?.namaDAS || 'Model DAS'}</strong> • Stasiun:{' '}
                          <strong>{store.stasiunList?.length || 0} unit</strong> • Data:{' '}
                          <strong>{store.dataHujan?.length || 0} baris</strong>
                        </span>
                      </div>
                      <button
                        onClick={handleSaveCurrentToCatalog}
                        disabled={isSavingCatalog}
                        className="px-3.5 py-2 bg-pupr-blue hover:bg-blue-900 text-white rounded-md font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5 text-pupr-yellow" />
                        <span>{isSavingCatalog ? 'Menyimpan...' : 'Simpan ke Katalog'}</span>
                      </button>
                    </div>

                    {/* Daftar Proyek Tersimpan */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-0.5">
                        <span>Daftar Proyek Tersimpan di Sistem:</span>
                        <button
                          onClick={loadCatalog}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingCatalog ? 'animate-spin' : ''}`} />
                          Segarkan
                        </button>
                      </div>

                      {isLoadingCatalog ? (
                        <div className="p-8 text-center text-xs text-slate-400">Memuat katalog proyek...</div>
                      ) : savedProjects.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-xs space-y-2">
                          <FolderArchive className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-semibold text-slate-600">Belum ada proyek tersimpan di katalog sistem.</p>
                          <p className="text-slate-400 text-[11px] max-w-sm mx-auto">
                            Klik tombol <strong>"Simpan ke Katalog"</strong> di atas untuk menyimpan lembar kerja aktif
                            ini ke dalam sistem terpadu.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {savedProjects.map((p) => {
                            const isCurrent = store.currentProjectId === p.id;
                            return (
                              <div
                                key={p.id}
                                className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 transition-all ${
                                  isCurrent
                                    ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-200'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                                      {p.projectCode}
                                    </span>
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{p.name}</h4>
                                    {isCurrent && (
                                      <span className="bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                        Sedang Aktif
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-500 text-[11px] flex flex-wrap gap-x-3 gap-y-0.5">
                                    <span>DAS: <strong>{p.dasName}</strong></span>
                                    {p.regency && <span>Lokasi: {p.regency}</span>}
                                    <span className="flex items-center gap-1 text-slate-400">
                                      <Clock className="w-3 h-3" />
                                      {new Date(p.updatedAt).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleOpenSavedProject(p.id)}
                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-pupr-blue border border-blue-200 rounded font-bold text-xs flex items-center gap-1 transition-colors"
                                    title="Muat proyek ini ke lembar kerja aktif"
                                  >
                                    <FolderOpen className="w-3.5 h-3.5" />
                                    <span>Buka</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSavedProject(p.id, p.name)}
                                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                    title="Hapus proyek ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: EXPORT (.rekasda) */}
                {activeTab === 'export' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-md text-xs space-y-1">
                      <p className="font-bold text-pupr-blue flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4" />
                        Paket Berkas Mandiri Terpadu (.rekasda)
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        Berkas <code>.rekasda</code> menyimpan seluruh konfigurasi <strong>Data Master</strong>,{' '}
                        <strong>stasiun & deret harian</strong>, serta hasil pemodelan{' '}
                        <strong>Frekuensi, Banjir, Neraca, Embung, dan Saluran</strong> untuk kemudahan arsip & pertukaran tim.
                      </p>
                    </div>

                    {/* Summary Box */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Proyek</span>
                        <strong className="text-slate-800 truncate block">
                          {store.identitasLokasi?.namaPekerjaan || 'Proyek Tanpa Judul'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">DAS</span>
                        <strong className="text-slate-800 truncate block">
                          {store.identitasLokasi?.namaDAS || (store.morfometriDAS ? 'Model DAS' : '-')}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Stasiun Hujan</span>
                        <strong className="text-slate-800 truncate block">
                          {store.stasiunList?.length || 0} Stasiun
                        </strong>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Data Harian</span>
                        <strong className="text-slate-800 truncate block">
                          {store.dataHujan?.length.toLocaleString('id-ID') || 0} Baris
                        </strong>
                      </div>
                    </div>

                    {/* Form Metadata Tambahan */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Nama Penyusun / Tenaga Ahli
                          </label>
                          <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-pupr-blue focus:outline-none"
                            placeholder="Contoh: Ir. Nama Ahli, MT"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Instansi / Konsultan
                          </label>
                          <input
                            type="text"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-pupr-blue focus:outline-none"
                            placeholder="Contoh: BWS / PT. Konsultan"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Catatan / Keterangan Skenario
                        </label>
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-pupr-blue focus:outline-none"
                          placeholder="Catatan skenario kalibrasi atau asumsi desain..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-pupr-blue text-white rounded text-xs font-bold hover:bg-blue-900 transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh Berkas Proyek (.rekasda)
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: IMPORT (.rekasda) */}
                {activeTab === 'import' && (
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-pupr-blue hover:bg-blue-50/30 transition-all rounded-lg p-6 text-center cursor-pointer space-y-2"
                    >
                      <div className="w-10 h-10 bg-blue-100 text-pupr-blue rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Klik untuk memilih berkas paket proyek <code>.rekasda</code>
                      </p>
                      <p className="text-[11px] text-slate-500">Mendukung berkas standar JSON / .rekasda v1.0 - v2.0</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".rekasda,.json"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    {isReadingFile && (
                      <div className="p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-pupr-blue" />
                        Membaca dan memverifikasi integritas paket proyek...
                      </div>
                    )}

                    {importError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{importError}</span>
                      </div>
                    )}

                    {importPreview && (
                      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-md text-xs space-y-3">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Paket Proyek Valid & Siap Dibuka
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                          <div>
                            <span className="text-slate-500 block">Nama Proyek:</span>
                            <strong>{importPreview.metadata.projectName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">DAS & Lokasi:</span>
                            <strong>
                              {importPreview.metadata.dasName} ({importPreview.metadata.location})
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Penyusun:</span>
                            <span>{importPreview.metadata.author}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Jumlah Stasiun / Baris:</span>
                            <span>
                              {importPreview.metadata.totalStations} Stasiun /{' '}
                              {importPreview.metadata.totalDailyRecords} Baris
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleApplyImport}
                            className="px-4 py-2 bg-emerald-700 text-white rounded text-xs font-bold hover:bg-emerald-800 transition-all flex items-center gap-1.5 shadow-xs"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Terapkan & Buka Proyek Ini
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: NEW / RESET */}
                {activeTab === 'new' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
                      <p className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Mulai Proyek Baru & Bersihkan Lembar Kerja
                      </p>
                      <p className="text-amber-800 leading-relaxed">
                        Aksi ini akan mereset seluruh formulir Data Master, menghapus deret stasiun hujan lokal yang
                        sedang aktif, dan mengosongkan hasil kalkulasi banjir, neraca, embung, serta saluran di lembar
                        kerja aktif.
                      </p>
                      <p className="text-slate-600 font-medium">
                        <em>
                          Saran: Jika Anda memiliki pekerjaan penting, lakukan{' '}
                          <strong>Simpan ke Katalog</strong> atau <strong>Ekspor Proyek (.rekasda)</strong> terlebih dahulu.
                        </em>
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
                <span>Standar Ekspor-Impor SNI RekasDA Pro v2.0 (Unified Storage)</span>
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
