import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  GitCompare,
  TrendingDown,
  TrendingUp,
  Loader2,
  Info,
  ArrowLeft,
  ArrowRight,
  Sliders,
  Check,
} from 'lucide-react';
import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { useHydrologyStore, type StasiunHidrologi, type DataHujan } from '@/stores/useHydrologyStore';
import {
  cekDoubleMassCurve,
  createCompositeReferenceSeries,
  applyDoubleMassCorrection,
  type DoubleMassResult,
  type DMCCorrectionResult,
  type RainfallData,
} from '@/lib/utils/qc/dataQualityMath';
import { supabase } from '@/lib/api/supabase';
import { toast } from '@/hooks/useToast';

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
interface DoubleMassCorrectionModalProps {
  /** Stasiun target yang datanya akan dikoreksi */
  targetStasiun: StasiunHidrologi;
  onClose: () => void;
  /** Dipanggil setelah koreksi berhasil disimpan — untuk refresh QC */
  onCorrectionApplied?: (stasiunId: string) => void;
}

type Step = 'select-reference' | 'preview-dmc' | 'preview-correction' | 'done';
type ReferenceMode = 'single' | 'composite';

// ─────────────────────────────────────────────────────
// Helper: fetch paginated daily records
// ─────────────────────────────────────────────────────
async function fetchDailyRecords(stasiunId: string, currentDataHujan: DataHujan[]): Promise<DataHujan[]> {
  const inMemory = currentDataHujan.filter(d => d.stasiun_id === stasiunId);
  if (inMemory.length > 0) return inMemory;

  if (!supabase) return inMemory;

  let all: DataHujan[] = [];
  let page = 0;
  const PAGE = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data: chunk, error } = await supabase
      .from('master_data_hujan')
      .select('id, stasiun_id, tanggal, curah_hujan, is_infilled')
      .eq('stasiun_id', stasiunId)
      .order('tanggal', { ascending: true })
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (error) throw new Error(error.message);
    if (chunk && chunk.length > 0) {
      all = [...all, ...(chunk as DataHujan[])];
      hasMore = chunk.length === PAGE;
      page++;
    } else {
      hasMore = false;
    }
  }
  return all;
}

/** Aggregasi ke AMS (Annual Maximum Series) */
function toAnnualMax(records: DataHujan[]): RainfallData[] {
  const byYear: Record<number, number> = {};
  records.forEach(r => {
    const y = parseInt(r.tanggal.split('-')[0], 10);
    if (isNaN(y)) return;
    const v = Number(r.curah_hujan) || 0;
    if (!byYear[y] || v > byYear[y]) byYear[y] = v;
  });
  return Object.entries(byYear)
    .map(([y, h]) => ({ tahun: Number(y), hujan: h }))
    .sort((a, b) => a.tahun - b.tahun);
}

// ─────────────────────────────────────────────────────
// Custom Tooltip for DMC chart
// ─────────────────────────────────────────────────────
const DmcTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md p-2.5 text-xs">
      <p className="font-bold text-slate-800 mb-1">Tahun {d.tahun}</p>
      <p className="text-blue-600 font-medium">Σ Referensi: <span className="font-mono text-slate-700">{d.akumulasiReferensi?.toFixed(0)} mm</span></p>
      <p className="text-indigo-600 font-medium">Σ Target: <span className="font-mono text-slate-700">{d.akumulasiTarget?.toFixed(0)} mm</span></p>
    </div>
  );
};

// ─────────────────────────────────────────────────────
// Modal Component
// ─────────────────────────────────────────────────────
export const DoubleMassCorrectionModal: React.FC<DoubleMassCorrectionModalProps> = ({
  targetStasiun,
  onClose,
  onCorrectionApplied,
}) => {
  const { stasiunList, dataHujan, importDataHujanBatch } = useHydrologyStore();

  const [step, setStep] = useState<Step>('select-reference');
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>('single');
  const [selectedRefId, setSelectedRefId] = useState<string>('');
  const [selectedCompositeIds, setSelectedCompositeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cached AMS series for instant breakpoint switching without refetch
  const [cachedTargetAMS, setCachedTargetAMS] = useState<RainfallData[]>([]);
  const [cachedRefAMS, setCachedRefAMS] = useState<RainfallData[]>([]);

  const [dmcResult, setDmcResult] = useState<DoubleMassResult | null>(null);
  const [correctionResult, setCorrectionResult] = useState<DMCCorrectionResult | null>(null);
  const [targetRecords, setTargetRecords] = useState<DataHujan[]>([]);

  // Opsi stasiun referensi (semua kecuali target sendiri)
  const referenceOptions = stasiunList.filter(s => s.id !== targetStasiun.id);

  // ── Step 1 → Step 2: Hitung DMC (Single atau Komposit) ─
  const handleCalculateDMC = useCallback(async () => {
    setErrorMessage(null);

    const refIds = referenceMode === 'single'
      ? (selectedRefId ? [selectedRefId] : [])
      : selectedCompositeIds;

    if (refIds.length === 0) {
      setErrorMessage(
        referenceMode === 'single'
          ? 'Silakan pilih satu stasiun referensi.'
          : 'Pilih minimal satu (disarankan 2 atau lebih) stasiun untuk deret komposit.'
      );
      return;
    }

    setIsLoading(true);
    try {
      // Fetch target station daily records
      const tgt = await fetchDailyRecords(targetStasiun.id, dataHujan);
      setTargetRecords(tgt);
      const targetAMS = toAnnualMax(tgt);

      if (targetAMS.length < 5) {
        setErrorMessage('Stasiun target memerlukan minimal 5 tahun data untuk analisis DMC.');
        return;
      }

      // Fetch all selected reference stations in parallel
      const refRecordsList = await Promise.all(
        refIds.map(id => fetchDailyRecords(id, dataHujan))
      );

      const refAMSList = refRecordsList.map(rec => toAnnualMax(rec));

      // Check each reference station has at least 5 years
      const invalidRef = refAMSList.find(ams => ams.length < 5);
      if (invalidRef) {
        setErrorMessage('Ada stasiun referensi terpilih yang datanya kurang dari 5 tahun.');
        return;
      }

      // Generate composite reference or use single
      const finalRefAMS = createCompositeReferenceSeries(refAMSList);

      setCachedTargetAMS(targetAMS);
      setCachedRefAMS(finalRefAMS);

      const result = cekDoubleMassCurve(targetAMS, finalRefAMS);
      setDmcResult(result);
      setStep('preview-dmc');
    } catch (err: any) {
      setErrorMessage(`Gagal menghitung DMC: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [referenceMode, selectedRefId, selectedCompositeIds, targetStasiun.id, dataHujan]);

  // ── Re-evaluasi Breakpoint saat pengguna memilih tahun kandidat ─
  const handleSelectBreakYear = useCallback((year: number) => {
    if (!cachedTargetAMS.length || !cachedRefAMS.length) return;
    const recalculated = cekDoubleMassCurve(cachedTargetAMS, cachedRefAMS, { customBreakYear: year });
    setDmcResult(recalculated);
  }, [cachedTargetAMS, cachedRefAMS]);

  // ── Step 2 → Step 3: Preview koreksi ────────────────
  const handlePreviewCorrection = useCallback(() => {
    if (!dmcResult?.breakYear || !dmcResult.faktorKoreksi) return;
    setErrorMessage(null);
    try {
      const preview = applyDoubleMassCorrection({
        records: targetRecords.map(r => ({ tanggal: r.tanggal, curah_hujan: Number(r.curah_hujan) })),
        faktorKoreksi: dmcResult.faktorKoreksi,
        breakYear: dmcResult.breakYear,
      });
      setCorrectionResult(preview);
      setStep('preview-correction');
    } catch (err: any) {
      setErrorMessage(`Gagal preview koreksi: ${err.message}`);
    }
  }, [dmcResult, targetRecords]);

  // ── Step 3 → Simpan koreksi ──────────────────────────
  const handleApplyCorrection = useCallback(async () => {
    if (!correctionResult) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const toSave = correctionResult.correctedRecords.map(r => ({
        stasiun_id: targetStasiun.id,
        tanggal: r.tanggal,
        curah_hujan: r.curah_hujan,
      }));

      await importDataHujanBatch(toSave);

      toast.success(correctionResult.pesan);
      setStep('done');
      onCorrectionApplied?.(targetStasiun.id);
    } catch (err: any) {
      setErrorMessage(`Gagal menyimpan koreksi: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [correctionResult, targetStasiun.id, importDataHujanBatch, onCorrectionApplied]);

  // ── Chart data untuk DMC ─────────────────────────────
  const dmcChartData = dmcResult?.dataPlot || [];
  const lastPt = dmcChartData[dmcChartData.length - 1];
  const regressionData = lastPt
    ? [
        { akumulasiReferensi: 0, regressionY: 0 },
        { akumulasiReferensi: lastPt.akumulasiReferensi, regressionY: lastPt.akumulasiTarget },
      ]
    : [];

  const refStationLabel = referenceMode === 'single'
    ? stasiunList.find(s => s.id === selectedRefId)?.nama_stasiun || 'Referensi'
    : `Komposit (${selectedCompositeIds.length} Stasiun Acuan)`;

  const STEPS: Step[] = ['select-reference', 'preview-dmc', 'preview-correction', 'done'];
  const stepLabels = ['1. Pilih Referensi', '2. Grafik & Breakpoint', '3. Simulasi Koreksi', '4. Selesai'];
  const currentStepIdx = STEPS.indexOf(step);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Koreksi Double Mass Curve (DMC)</h3>
              <p className="text-xs text-slate-500">
                Stasiun Target: <span className="font-semibold text-slate-700">{targetStasiun.nama_stasiun}</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span className="text-slate-400">WMO Guide No. 168 §5.3.2 (Chow Test & Segmented Least-Squares)</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading || isSaving}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Stepper ── */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex items-center gap-1.5 text-xs bg-slate-50/70 overflow-x-auto">
          {STEPS.map((s, i) => {
            const isActive = s === step;
            const isDone = currentStepIdx > i;
            return (
              <React.Fragment key={s}>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium'
                      : 'text-slate-400 font-normal'
                  }`}
                >
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>{stepLabels[i]}</span>
                </div>
                {i < STEPS.length - 1 && <span className="text-slate-300">›</span>}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ─ Step 1: Pilih Referensi ─ */}
          {step === 'select-reference' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Info className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Prinsip Uji Konsistensi Kurva Massa Ganda Teroptimasi</span>
                </div>
                <p className="leading-relaxed text-blue-800">
                  Untuk hasil paling robust, WMO No. 168 merekomendasikan penggunaan <strong>Kelompok Stasiun Acuan (Komposit)</strong> untuk menghilangkan variabilitas lokal. Algoritma melakukan <em>Piecewise Segmented Search</em> dan <em>Chow Test</em> untuk menemukan tahun patahan sejati secara otomatis.
                </p>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Metode Deret Referensi
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <label
                    className={`flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer transition-all ${
                      referenceMode === 'single'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="refMode"
                      value="single"
                      checked={referenceMode === 'single'}
                      onChange={() => {
                        setReferenceMode('single');
                        setErrorMessage(null);
                      }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold block">Stasiun Tunggal</span>
                      <span className="text-[11px] text-slate-500">Gunakan 1 stasiun terdekat sebagai acuan</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer transition-all ${
                      referenceMode === 'composite'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="refMode"
                      value="composite"
                      checked={referenceMode === 'composite'}
                      onChange={() => {
                        setReferenceMode('composite');
                        setErrorMessage(null);
                      }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold block">Komposit Multi-Stasiun</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                          WMO Best Practice
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">Rata-rata kumulatif 2+ stasiun sekitar</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Station Selection List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    {referenceMode === 'single'
                      ? 'Pilih 1 Stasiun Referensi'
                      : `Pilih Stasiun untuk Deret Komposit (${selectedCompositeIds.length} dipilih)`}
                  </label>
                  {referenceMode === 'composite' && referenceOptions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCompositeIds.length === referenceOptions.length) {
                          setSelectedCompositeIds([]);
                        } else {
                          setSelectedCompositeIds(referenceOptions.map(s => s.id));
                        }
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      {selectedCompositeIds.length === referenceOptions.length ? 'Batal Pilih Semua' : 'Pilih Semua Stasiun'}
                    </button>
                  )}
                </div>

                {referenceOptions.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-500 italic">
                    Tidak ditemukan stasiun hidrologi lain untuk dijadikan acuan koreksi.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {referenceOptions.map(s => {
                      const isChecked = referenceMode === 'single'
                        ? selectedRefId === s.id
                        : selectedCompositeIds.includes(s.id);

                      return (
                        <label
                          key={s.id}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                            isChecked
                              ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {referenceMode === 'single' ? (
                              <input
                                type="radio"
                                name="reference-station"
                                value={s.id}
                                checked={isChecked}
                                onChange={() => {
                                  setSelectedRefId(s.id);
                                  setErrorMessage(null);
                                }}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                            ) : (
                              <input
                                type="checkbox"
                                value={s.id}
                                checked={isChecked}
                                onChange={e => {
                                  const id = s.id;
                                  if (e.target.checked) {
                                    setSelectedCompositeIds(prev => [...prev, id]);
                                  } else {
                                    setSelectedCompositeIds(prev => prev.filter(x => x !== id));
                                  }
                                  setErrorMessage(null);
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                            )}
                            <div>
                              <span className="text-xs font-bold text-slate-800">{s.nama_stasiun}</span>
                              {s.keterangan && (
                                <p className="text-[11px] text-slate-400">{s.keterangan}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-[11px] text-slate-400">
                            {s.elevasi !== null && <span>Elev: {s.elevasi} mdpl</span>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─ Step 2: Preview DMC Chart & Breakpoint Optimization ─ */}
          {step === 'preview-dmc' && dmcResult && (
            <div className="space-y-4">
              {/* Header Status & Quality Banner */}
              <div
                className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                  dmcResult.isKonsisten
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {dmcResult.isKonsisten ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      {dmcResult.isKonsisten ? 'Data Konsisten (Lolos Uji Grafis)' : 'Patahan Data Signifikan Terdeteksi'}
                    </span>
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span className="text-[11px] font-mono opacity-90">{dmcResult.pesan}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {dmcResult.rSquared !== undefined && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/80 border border-slate-200 text-slate-700">
                      R² = {dmcResult.rSquared.toFixed(3)}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      dmcResult.isKonsisten
                        ? 'bg-emerald-200/70 text-emerald-800'
                        : 'bg-rose-200/70 text-rose-800'
                    }`}
                  >
                    {dmcResult.isKonsisten ? 'KONSISTEN' : `PATAHAN: ~${dmcResult.breakYear}`}
                  </span>
                </div>
              </div>

              {/* Interactive Breakpoint Selector (Optimization Feature) */}
              {dmcResult.candidates && dmcResult.candidates.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Sliders className="w-3.5 h-3.5 text-blue-600" />
                      <span>Optimasi Titik Patah (Piecewise Candidates)</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Klik salah satu tahun untuk beralih breakpoint
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {dmcResult.candidates.map(cand => {
                      const isCurrent = cand.year === dmcResult.breakYear;
                      return (
                        <button
                          key={cand.year}
                          type="button"
                          onClick={() => handleSelectBreakYear(cand.year)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
                            isCurrent
                              ? 'bg-blue-600 text-white font-bold shadow-xs'
                              : 'bg-white border border-slate-200 hover:border-blue-400 text-slate-700'
                          }`}
                        >
                          {isCurrent && <Check className="w-3 h-3" />}
                          <span>Tahun {cand.year}</span>
                          <span
                            className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                              isCurrent
                                ? 'bg-blue-700 text-white'
                                : cand.confidence === 'TINGGI'
                                ? 'bg-rose-100 text-rose-700 font-semibold'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Δ {cand.slopeDiffPercent}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DMC Chart Container */}
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Grafik Akumulasi Massa Ganda</h4>
                    <p className="text-[11px] text-slate-500">
                      {targetStasiun.nama_stasiun} (Sumbu Y) vs {refStationLabel} (Sumbu X)
                    </p>
                  </div>
                  {dmcResult.breakYear && (
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded">
                      Titik Patah Aktif: Tahun {dmcResult.breakYear}
                    </span>
                  )}
                </div>

                <div style={{ height: 260, width: '100%' }}>
                  <ResponsiveContainer>
                    <ComposedChart margin={{ top: 5, right: 15, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="akumulasiReferensi"
                        type="number"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        domain={[0, 'dataMax']}
                        label={{
                          value: `Σ Hujan ${refStationLabel} (mm)`,
                          position: 'insideBottom',
                          offset: -12,
                          fontSize: 10,
                          fill: '#64748b',
                        }}
                      />
                      <YAxis
                        dataKey="akumulasiTarget"
                        type="number"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        domain={[0, 'dataMax']}
                        width={60}
                        label={{
                          value: `Σ Hujan ${targetStasiun.nama_stasiun} (mm)`,
                          angle: -90,
                          position: 'insideLeft',
                          fontSize: 10,
                          fill: '#64748b',
                        }}
                      />
                      <Tooltip content={<DmcTooltip />} />
                      <Line
                        data={regressionData}
                        dataKey="regressionY"
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={false}
                        isAnimationActive={false}
                        name="Trend Ideal"
                      />
                      <Scatter
                        data={dmcChartData}
                        fill="#0c3a66"
                        line={{ stroke: '#0ea5e9', strokeWidth: 1.5 }}
                        name="Akumulasi Aktual"
                      />
                      {dmcResult.breakYear && (() => {
                        const bpPt = dmcChartData.find(p => p.tahun >= (dmcResult.breakYear as number));
                        return bpPt ? (
                          <ReferenceLine
                            x={bpPt.akumulasiReferensi}
                            stroke="#e11d48"
                            strokeDasharray="4 4"
                            label={{
                              value: `Patah ~${dmcResult.breakYear}`,
                              position: 'top',
                              fontSize: 10,
                              fill: '#e11d48',
                              fontWeight: 'bold',
                            }}
                          />
                        ) : null;
                      })()}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Metrik Patahan Lengkap */}
              {!dmcResult.isKonsisten && dmcResult.breakYear && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Tahun Patah</p>
                    <p className="text-lg font-bold text-rose-700 font-mono">{dmcResult.breakYear}</p>
                    <p className="text-[10px] text-slate-400">Titik Perubahan</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Faktor Koreksi (Sa/So)</p>
                    <p className="text-lg font-bold text-blue-700 font-mono">{dmcResult.faktorKoreksi?.toFixed(4)}</p>
                    <p className="text-[10px] text-slate-400">Pengali Pra-{dmcResult.breakYear}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Beda Kemiringan</p>
                    <div className="flex items-center justify-center gap-1">
                      {(dmcResult.faktorKoreksi ?? 1) > 1 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <p
                        className={`text-lg font-bold font-mono ${
                          (dmcResult.faktorKoreksi ?? 1) > 1 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {dmcResult.slopeDiffPercent ?? 0}%
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400">Slope Pra: {dmcResult.slopeBefore} → Pasca: {dmcResult.slopeAfter}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Korelasi Deret</p>
                    <p className="text-lg font-bold text-slate-800 font-mono">
                      {dmcResult.rSquared ? (dmcResult.rSquared * 100).toFixed(1) + '%' : '-'}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold">
                      {Number(dmcResult.rSquared) > 0.85 ? 'Sangat Kuat' : 'Korelasi Cukup'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─ Step 3: Preview Koreksi ─ */}
          {step === 'preview-correction' && correctionResult && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Konfirmasi Penerapan Koreksi Data</p>
                  <p className="text-amber-800 leading-relaxed">
                    Sebanyak <strong className="text-amber-900">{correctionResult.correctedCount.toLocaleString()} data harian</strong> sebelum tahun{' '}
                    <strong>{correctionResult.breakYear}</strong> akan disesuaikan dengan faktor koreksi{' '}
                    <span className="font-mono font-bold text-amber-900">{correctionResult.faktorKoreksi.toFixed(4)}</span>. Data historis pada database akan diperbarui.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg text-center">
                  <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-0.5">Data Terkoreksi</p>
                  <p className="text-xl font-bold text-rose-800 font-mono">
                    {correctionResult.correctedCount.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-rose-600">Hujan harian pra-{correctionResult.breakYear}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">Data Tetap</p>
                  <p className="text-xl font-bold text-slate-800 font-mono">
                    {correctionResult.unchangedCount.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500">Hujan harian pasca-{correctionResult.breakYear}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Sampel Data Harian Terkoreksi (10 Rekaman Pertama)
                  </label>
                  {correctionResult.correctedCount > 10 && (
                    <span className="text-[11px] text-slate-400">
                      +{(correctionResult.correctedCount - 10).toLocaleString()} rekaman lainnya
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2 px-3 text-left font-semibold">Tanggal</th>
                        <th className="py-2 px-3 text-right font-semibold">Nilai Awal (mm)</th>
                        <th className="py-2 px-3 text-right font-semibold">Hasil Koreksi (mm)</th>
                        <th className="py-2 px-3 text-center font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {correctionResult.correctedRecords
                        .filter(r => r.was_corrected)
                        .slice(0, 10)
                        .map((r, i) => {
                          const orig = targetRecords.find(t => t.tanggal === r.tanggal);
                          return (
                            <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-1.5 px-3 font-mono text-slate-700">{r.tanggal}</td>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-500">
                                {orig?.curah_hujan !== undefined && orig?.curah_hujan !== null
                                  ? Number(orig.curah_hujan).toFixed(1)
                                  : '-'}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono font-semibold text-blue-700">
                                {r.curah_hujan.toFixed(1)}
                              </td>
                              <td className="py-1.5 px-3 text-center">
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
                                  TERKOREKSI
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─ Step 4: Selesai ─ */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 mb-1">Koreksi Berhasil Disimpan</h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">{correctionResult?.pesan}</p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Data telah diperbarui di database. Evaluasi QC otomatis diperbarui untuk stasiun ini.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (step === 'select-reference' || step === 'done') onClose();
              else if (step === 'preview-dmc') setStep('select-reference');
              else if (step === 'preview-correction') setStep('preview-dmc');
            }}
            disabled={isLoading || isSaving}
            className="gap-1.5"
          >
            {step === 'select-reference' || step === 'done' ? (
              'Tutup'
            ) : (
              <>
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali
              </>
            )}
          </Button>

          <div className="flex gap-2">
            {step === 'select-reference' && (
              <Button
                type="button"
                size="sm"
                disabled={isLoading}
                onClick={handleCalculateDMC}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menganalisis...
                  </>
                ) : (
                  <>
                    <span>Hitung Kurva Massa Ganda</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            )}

            {step === 'preview-dmc' && (
              dmcResult?.koreksiDiperlukan ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePreviewCorrection}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  <span>Lanjut ke Simulasi Koreksi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={onClose}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Selesai — Data Sudah Konsisten
                </Button>
              )
            )}

            {step === 'preview-correction' && (
              <Button
                type="button"
                size="sm"
                disabled={isSaving}
                onClick={handleApplyCorrection}
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menerapkan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terapkan & Simpan Koreksi
                  </>
                )}
              </Button>
            )}

            {step === 'done' && (
              <Button
                type="button"
                size="sm"
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Selesai
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DoubleMassCorrectionModal;
