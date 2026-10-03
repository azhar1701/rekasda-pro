import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Save,
  Download,
  Clipboard,
  TrendingUp,
  Info,
  FileSpreadsheet,
  FolderGit2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { ActionableEmptyState } from '@/components/ui/ActionableEmptyState';
import { WhiteBoxFormula } from '@/components/ui/WhiteBoxFormula';
import { toast } from '@/hooks/useToast';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { SuccessCelebration } from '@/components/ui/feedback/SuccessCelebration';
import { HelpTooltip } from '@/components/ui/govtech';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';
import {
  calculateStatisticalParams,
  calculateDistributions,
  calculateGoodnessOfFit,
  selectBestMethod,
  evaluateSNI2415Criteria,
  NORMAL_Z,
  GUMBEL_YN,
  GUMBEL_SN,
  GUMBEL_YTR,
  interpolateLogPearsonK,
  interpolate,
} from '@/lib/utils/frequencyMath';
import { extractAnnualMaximums } from '@/utils/rainfallSeriesUtils';

const METHOD_LABELS: Record<string, string> = {
  normal: 'Normal',
  lognormal: 'Log Normal',
  gumbel: 'Gumbel',
  logpearson3: 'Log Pearson III'
};

const RETURN_PERIODS = [2, 5, 10, 20, 25, 50, 100];

interface ModulAnalisisFrekuensiProps {
  onSave?: (type: any, inputs: any, outputs: any) => void;
}

export const ModulAnalisisFrekuensi: React.FC<ModulAnalisisFrekuensiProps> = ({ onSave }) => {
  const {
    analisisFrekuensi, setAnalisisFrekuensi, dataHujan, selectedStasiun,
    activeRainfallSource, arealRainfallAlgebraic, arealRainfallThiessen, arealRainfallIsohyet
  } = useHydrologyStore();

  const [dataInput, setDataInput] = useState<number[]>([]);
  const [inputType, setInputType] = useState<'point' | 'areal_algebraic' | 'areal_thiessen' | 'areal_isohyet'>('point');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showAllData, setShowAllData] = useState(false);
  const [selectedTr, setSelectedTr] = useState<number>(25);
  const [showCelebration, setShowCelebration] = useState(false);
  const { completeStep } = useOnboarding();

  const hasValidData = useMemo(() => {
    const pointAMS = extractAnnualMaximums(selectedStasiun ? dataHujan.filter(d => d.stasiun_id === selectedStasiun.id) : dataHujan).length;
    const thiessenAMS = extractAnnualMaximums(arealRainfallThiessen || []).length;
    const aljabarAMS = extractAnnualMaximums(arealRainfallAlgebraic || []).length;
    const isohyetAMS = extractAnnualMaximums(arealRainfallIsohyet || []).length;
    return pointAMS >= 10 || thiessenAMS >= 10 || aljabarAMS >= 10 || isohyetAMS >= 10 || dataInput.length >= 10;
  }, [dataHujan, selectedStasiun, arealRainfallAlgebraic, arealRainfallThiessen, arealRainfallIsohyet, dataInput]);

  // Workflow Sync: Default to saved Spatial Analysis method
  useEffect(() => {
    if (activeRainfallSource === 'thiessen') setInputType('areal_thiessen');
    else if (activeRainfallSource === 'aljabar') setInputType('areal_algebraic');
    else if (activeRainfallSource === 'isohyet') setInputType('areal_isohyet');
    else setInputType('point');
  }, [activeRainfallSource]);

  // Data Ingestion: Extract Annual Maximum Series (AMS) consistently for all sources
  useEffect(() => {
    if (inputType === 'point' && dataHujan.length > 0) {
      const stasiunData = selectedStasiun
        ? dataHujan.filter(d => d.stasiun_id === selectedStasiun.id)
        : dataHujan;

      if (stasiunData.length > 0) {
        const ams = extractAnnualMaximums(stasiunData);
        setDataInput(ams.map(d => d.value));
      } else {
        setDataInput([]);
      }
    } else if (inputType === 'areal_thiessen') {
      const ams = extractAnnualMaximums(arealRainfallThiessen || []);
      setDataInput(ams.map(d => d.value));
    } else if (inputType === 'areal_algebraic') {
      const ams = extractAnnualMaximums(arealRainfallAlgebraic || []);
      setDataInput(ams.map(d => d.value));
    } else if (inputType === 'areal_isohyet') {
      const ams = extractAnnualMaximums(arealRainfallIsohyet || []);
      setDataInput(ams.map(d => d.value));
    }
  }, [dataHujan, selectedStasiun, inputType, arealRainfallAlgebraic, arealRainfallThiessen, arealRainfallIsohyet]);

  useEffect(() => {
    if (analisisFrekuensi) {
      setDataInput(analisisFrekuensi.dataHujanInput);
      setSelectedMethod(analisisFrekuensi.metodeTerpilih);
      if (analisisFrekuensi.hasilDistribusi && analisisFrekuensi.hasilDistribusi.length > 0) {
        setIsCalculated(true);
      }
    } else {
      setIsCalculated(false);
      setSelectedMethod(null);
    }
  }, [analisisFrekuensi]);

  const { paramsAsli, paramsLog, distributions, goodnessOfFit, sniCriteria, recommendedMethod } = useMemo(() => {
    if (dataInput.length < 10) {
      return {
        paramsAsli: null,
        paramsLog: null,
        distributions: null,
        goodnessOfFit: null,
        sniCriteria: null,
        recommendedMethod: null
      };
    }

    const asli = calculateStatisticalParams(dataInput);
    const logData = dataInput.map(x => Math.log10(Math.max(x, 1e-10)));
    const log = calculateStatisticalParams(logData);

    const dist = calculateDistributions(dataInput, RETURN_PERIODS);
    const gof = calculateGoodnessOfFit(dataInput, dist);
    const criteria = evaluateSNI2415Criteria(asli, log);
    const recommended = selectBestMethod(gof, criteria);

    return {
      paramsAsli: asli,
      paramsLog: log,
      distributions: dist,
      goodnessOfFit: gof,
      sniCriteria: criteria,
      recommendedMethod: recommended
    };
  }, [dataInput]);

  useEffect(() => {
    if (recommendedMethod && !selectedMethod) {
      setSelectedMethod(recommendedMethod);
    }
  }, [recommendedMethod, selectedMethod]);

  const handlePasteFromExcel = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.trim().split('\n');
      const values = lines
        .map(line => parseFloat(line.split('\t')[0].replace(',', '.')))
        .filter(v => !isNaN(v) && v >= 0);
      if (values.length >= 10) {
        setDataInput(values);
        toast.success(`Berhasil menyalin ${values.length} data hujan tahunan.`);
      } else {
        toast.warning(`Data tersalin (${values.length}) kurang dari 10 tahun.`);
      }
    } catch (err) {
      toast.error('Gagal membaca clipboard. Pastikan Anda sudah menyalin data dari Excel.');
    }
  };

  const handleSyncLatestSeries = () => {
    let sourceData = dataHujan;
    if (inputType === 'point') {
      sourceData = selectedStasiun
        ? dataHujan.filter(d => d.stasiun_id === selectedStasiun.id)
        : dataHujan;
    } else if (inputType === 'areal_thiessen') {
      sourceData = arealRainfallThiessen || [];
    } else if (inputType === 'areal_algebraic') {
      sourceData = arealRainfallAlgebraic || [];
    } else if (inputType === 'areal_isohyet') {
      sourceData = arealRainfallIsohyet || [];
    }

    const ams = extractAnnualMaximums(sourceData);
    if (ams.length >= 10) {
      setDataInput(ams.map(d => d.value));
      toast.info(`Berhasil menyinkronkan ${ams.length} data curah hujan tahunan (AMS) terkini. Silakan verifikasi dan klik Simpan & Lanjutkan.`);
    } else if (ams.length > 0) {
      setDataInput(ams.map(d => d.value));
      toast.warning(`Data tahunan terkini yang tersedia hanya ${ams.length} tahun (minimal 10 tahun per SNI 2415:2016).`);
    } else {
      toast.error('Tidak ditemukan data curah hujan yang valid untuk menyusun deret tahunan.');
    }
  };

  const handleCalculate = () => {
    if (!paramsAsli || !paramsLog || !distributions || !goodnessOfFit || !selectedMethod) return;

    const selectedDist = distributions.find(d => d.method === selectedMethod);
    if (!selectedDist) return;

    const curahHujanRencana = selectedDist.values.map(v => ({
      kalaUlang: v.Tr,
      curahHujan: v.R24,
      Tr: v.Tr,
      R24: v.R24
    }));

    setAnalisisFrekuensi({
      parameterStatistik: { asli: paramsAsli, log: paramsLog },
      hasilDistribusi: distributions,
      ujiKecocokan: goodnessOfFit,
      metodeTerpilih: selectedMethod,
      dataHujanInput: dataInput
    });

    const isArealSource = inputType.startsWith('areal');
    const { setHasilAnalisisFrekuensi, setSelectedKalaUlang, setHasilARF } = useHydrologyStore.getState();

    setHasilAnalisisFrekuensi({
      metodeTerpilih: selectedMethod,
      lulusUjiKecocokan: goodnessOfFit.find(g => g.method === selectedMethod)?.chiSquare.accepted || false,
      curahHujanRencana,
      selectedKalaUlang: selectedTr
    });
    setSelectedKalaUlang(selectedTr);

    // Otomatis koordinasi ARF = 1.0 jika input sudah merupakan Hujan Wilayah Komposit (mencegah reduksi ganda)
    if (isArealSource) {
      const match = curahHujanRencana.find(v => v.Tr === selectedTr);
      const val = match?.R24 || 0;
      setHasilARF({
        arfValue: 1.0,
        arfOverride: null,
        hujanTitik: val,
        hujanDAS: val
      });
    }

    setIsCalculated(true);
    setShowCelebration(true);
    completeStep('frekuensi');

    // Auto-save snapshot ke Unified Project Storage
    (async () => {
      try {
        const { saveCalculationSnapshot, generateUUID } = await import('@/services/unifiedProjectService');
        const activeProjectId = useHydrologyStore.getState().currentProjectId || generateUUID();
        await saveCalculationSnapshot(activeProjectId, {
          moduleType: 'frequency',
          snapshotTitle: `Analisis Frekuensi Hujan (${METHOD_LABELS[selectedMethod] || selectedMethod})`,
          scenarioName: `Hujan Rencana Q${selectedTr}`,
          inputParameters: {
            inputType,
            dataCount: dataInput.length,
            selectedMethod,
            selectedTr
          },
          outputResults: {
            metodeTerpilih: selectedMethod,
            curahHujanRencana,
            paramsAsli,
            paramsLog
          },
          notes: `Analisis frekuensi SNI 2415:2016 metode ${METHOD_LABELS[selectedMethod]}`
        });
      } catch (snapErr) {
        console.warn('Auto-save frekuensi snapshot warning:', snapErr);
      }
    })();

    toast.success(`Analisis frekuensi disimpan (Metode: ${METHOD_LABELS[selectedMethod]}, Q${selectedTr})`);
  };

  const handleSaveToProject = async () => {
    if (!selectedMethod || !distributions) return;
    try {
      const selectedDist = distributions.find(d => d.method === selectedMethod);
      const { saveCalculationSnapshot, generateUUID } = await import('@/services/unifiedProjectService');
      const activeProjectId = useHydrologyStore.getState().currentProjectId || generateUUID();
      
      await saveCalculationSnapshot(activeProjectId, {
        moduleType: 'frequency',
        snapshotTitle: `Analisis Frekuensi Hujan (${METHOD_LABELS[selectedMethod] || selectedMethod})`,
        scenarioName: `Hujan Rencana Q${selectedTr}`,
        inputParameters: {
          inputType,
          dataCount: dataInput.length,
          selectedMethod,
          selectedTr
        },
        outputResults: {
          metodeTerpilih: selectedMethod,
          curahHujanRencana: selectedDist?.values || [],
          paramsAsli,
          paramsLog
        },
        notes: `Analisis frekuensi SNI 2415:2016 metode ${METHOD_LABELS[selectedMethod]}`
      });

      if (onSave) {
        onSave(
          'frequency',
          {
            site: { channelName: `Analisis Frekuensi (${METHOD_LABELS[selectedMethod]})` },
            inputType,
            selectedMethod
          },
          {
            R24_Q25: selectedDist?.values.find(v => v.Tr === selectedTr)?.R24 || 0,
            Tr: selectedTr
          }
        );
      } else {
        toast.success(`Analisis frekuensi ${METHOD_LABELS[selectedMethod]} berhasil disimpan ke skenario proyek!`);
      }
    } catch (e) {
      console.warn('Gagal menyimpan frekuensi ke snapshot:', e);
      toast.success('Analisis frekuensi tersimpan lokal.');
    }
  };

  const handleExportJson = () => {
    if (!analisisFrekuensi) return;
    const data = JSON.stringify(analisisFrekuensi, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis-frekuensi-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('File JSON berhasil diunduh.');
  };

  const handleExportCsv = () => {
    if (!distributions || distributions.length === 0) return;
    let csv = 'Kala Ulang (Tahun);Normal (mm);Log Normal (mm);Gumbel (mm);Log Pearson III (mm)\n';
    RETURN_PERIODS.forEach(tr => {
      const norm = distributions.find(d => d.method === 'normal')?.values.find(v => v.Tr === tr)?.R24.toFixed(2) || '-';
      const logn = distributions.find(d => d.method === 'lognormal')?.values.find(v => v.Tr === tr)?.R24.toFixed(2) || '-';
      const gumb = distributions.find(d => d.method === 'gumbel')?.values.find(v => v.Tr === tr)?.R24.toFixed(2) || '-';
      const lp3  = distributions.find(d => d.method === 'logpearson3')?.values.find(v => v.Tr === tr)?.R24.toFixed(2) || '-';
      csv += `${tr};${norm};${logn};${gumb};${lp3}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-hujan-rencana-R24-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('File CSV berhasil diunduh.');
  };

  interface WhiteBoxFormulaData {
    title: string;
    theoretical: string;
    substituted: string;
    result: string;
    variables?: Record<string, number>;
  }

  const getWhiteBoxFormula = (method: string, tr: number, value: number): WhiteBoxFormulaData | null => {
    if (!paramsAsli || !paramsLog) return null;

    if (method === 'normal') {
      const z = NORMAL_Z[tr] ?? 0;
      return {
        title: `Distribusi Normal - Kala Ulang ${tr} Tahun`,
        theoretical: `X_T = \\bar{X} + Z \\cdot S`,
        substituted: `X_{${tr}} = ${paramsAsli.mean.toFixed(2)} + (${z.toFixed(3)}) \\cdot ${paramsAsli.stdDev.toFixed(2)}`,
        result: `= ${value.toFixed(2)} \\text{ mm}`,
        variables: {
          '\\bar{X}': parseFloat(paramsAsli.mean.toFixed(2)),
          'S': parseFloat(paramsAsli.stdDev.toFixed(2)),
          'Z': z
        }
      };
    }

    if (method === 'lognormal') {
      const z = NORMAL_Z[tr] ?? 0;
      const yVal = paramsLog.mean + z * paramsLog.stdDev;
      return {
        title: `Distribusi Log Normal - Kala Ulang ${tr} Tahun`,
        theoretical: `Y_T = \\bar{Y} + Z \\cdot S_y \\implies X_T = 10^{Y_T}`,
        substituted: `Y_{${tr}} = ${paramsLog.mean.toFixed(4)} + (${z.toFixed(3)}) \\cdot ${paramsLog.stdDev.toFixed(4)} = ${yVal.toFixed(4)} \\implies X_{${tr}} = 10^{${yVal.toFixed(4)}}`,
        result: `= ${value.toFixed(2)} \\text{ mm}`,
        variables: {
          '\\bar{Y}': parseFloat(paramsLog.mean.toFixed(4)),
          'S_y': parseFloat(paramsLog.stdDev.toFixed(4)),
          'Z': z,
          'Y_T': parseFloat(yVal.toFixed(4))
        }
      };
    }

    if (method === 'gumbel') {
      const yn = interpolate(GUMBEL_YN, paramsAsli.n);
      const sn = interpolate(GUMBEL_SN, paramsAsli.n);
      const ytr = GUMBEL_YTR[tr] ?? 0;
      const k = (ytr - yn) / sn;

      return {
        title: `Distribusi Gumbel - Kala Ulang ${tr} Tahun`,
        theoretical: `X_T = \\bar{X} + \\frac{Y_T - Y_n}{S_n} \\cdot S`,
        substituted: `X_{${tr}} = ${paramsAsli.mean.toFixed(2)} + \\frac{${ytr.toFixed(4)} - ${yn.toFixed(4)}}{${sn.toFixed(4)}} \\cdot ${paramsAsli.stdDev.toFixed(2)}`,
        result: `= ${value.toFixed(2)} \\text{ mm}`,
        variables: {
          '\\bar{X}': parseFloat(paramsAsli.mean.toFixed(2)),
          'S': parseFloat(paramsAsli.stdDev.toFixed(2)),
          'Y_T': parseFloat(ytr.toFixed(4)),
          'Y_n': parseFloat(yn.toFixed(4)),
          'S_n': parseFloat(sn.toFixed(4)),
          'K': parseFloat(k.toFixed(4))
        }
      };
    }

    if (method === 'logpearson3') {
      const k = interpolateLogPearsonK(paramsLog.cs, tr);
      const yVal = paramsLog.mean + k * paramsLog.stdDev;
      return {
        title: `Distribusi Log Pearson III - Kala Ulang ${tr} Tahun`,
        theoretical: `Y_T = \\bar{Y} + K(C_s, T_r) \\cdot S_y \\implies X_T = 10^{Y_T}`,
        substituted: `Y_{${tr}} = ${paramsLog.mean.toFixed(4)} + (${k.toFixed(3)}) \\cdot ${paramsLog.stdDev.toFixed(4)} = ${yVal.toFixed(4)} \\implies X_{${tr}} = 10^{${yVal.toFixed(4)}}`,
        result: `= ${value.toFixed(2)} \\text{ mm}`,
        variables: {
          '\\bar{Y}': parseFloat(paramsLog.mean.toFixed(4)),
          'S_y': parseFloat(paramsLog.stdDev.toFixed(4)),
          'C_s': parseFloat(paramsLog.cs.toFixed(3)),
          'K': parseFloat(k.toFixed(3)),
          'Y_T': parseFloat(yVal.toFixed(4))
        }
      };
    }

    return null;
  };

  const frequencyCurveData = useMemo(() => {
    if (!distributions) return [];
    return RETURN_PERIODS.map(tr => {
      const norm = distributions.find(d => d.method === 'normal')?.values.find(v => v.Tr === tr)?.R24;
      const logn = distributions.find(d => d.method === 'lognormal')?.values.find(v => v.Tr === tr)?.R24;
      const gumb = distributions.find(d => d.method === 'gumbel')?.values.find(v => v.Tr === tr)?.R24;
      const lp3  = distributions.find(d => d.method === 'logpearson3')?.values.find(v => v.Tr === tr)?.R24;
      return {
        trLabel: `Q${tr}`,
        tr,
        Normal: norm ? Number(norm.toFixed(1)) : null,
        LogNormal: logn ? Number(logn.toFixed(1)) : null,
        Gumbel: gumb ? Number(gumb.toFixed(1)) : null,
        LogPearson3: lp3 ? Number(lp3.toFixed(1)) : null,
      };
    });
  }, [distributions]);

  if (!hasValidData) {
    return (
      <ModuleLayout
        title="Analisis Frekuensi Hujan Ekstrem"
        description="Perhitungan probabilitas hujan rencana (SNI 2415:2016)"
        icon={<BarChart3 className="w-6 h-6" />}
        iconColorClass="bg-blue-50 text-pupr-blue"
      >
        <ActionableEmptyState
          title="Data Belum Lengkap"
          description="Lengkapi Data Master terlebih dahulu: (1) Data Curah Hujan minimal 10 tahun untuk setiap stasiun, (2) Morfometri DAS, (3) Tutupan Lahan."
        />
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout
      title="Analisis Frekuensi Hujan Ekstrem"
      description="Perhitungan probabilitas hujan rencana (SNI 2415:2016)"
      icon={<BarChart3 className="w-6 h-6" />}
      iconColorClass="bg-blue-50 text-pupr-blue"
      actions={
        isCalculated && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToProject}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-pupr-blue text-white rounded-md font-semibold hover:bg-blue-800 transition-colors text-xs"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              Simpan ke Proyek
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md font-semibold hover:bg-slate-50 transition-colors text-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export CSV
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md font-semibold hover:bg-slate-50 transition-colors text-xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              Export JSON
            </button>
          </div>
        )
      }
    >
      <div className="space-y-5 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {showCelebration && (
          <SuccessCelebration
            message="Analisis Frekuensi Hujan Ekstrem (SNI 2415:2016) berhasil diselesaikan!"
            onComplete={() => setShowCelebration(false)}
          />
        )}

        {/* Cascade Invalidation Alert */}
        <DependencyWarningBanner
          module="frekuensi"
          onAction={handleSyncLatestSeries}
          actionLabel="Sinkronkan Deret Baru"
        />

        {/* TAHAP 1: Smart Data Context - Input AMS */}
        <div className="rounded-md border border-slate-300 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">1. Deret Data Hujan Maksimum Tahunan (AMS)</h3>
              <p className="text-xs text-slate-500">Annual Maximum Series dari stasiun penakar atau komposit wilayah</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                dataInput.length >= 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {dataInput.length} Tahun Data {dataInput.length >= 10 ? '✓ (SNI ≥10)' : '⚠ (Kurang)'}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <label className="text-xs font-bold text-slate-700">Sumber Data:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'point', label: 'Data Titik (Stasiun)' },
                  { id: 'areal_algebraic', label: 'Rerata Aljabar' },
                  { id: 'areal_thiessen', label: 'Poligon Thiessen' },
                  { id: 'areal_isohyet', label: 'Garis Isohyet' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setInputType(opt.id as any)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-full border transition-all ${
                      inputType === opt.id
                        ? 'bg-pupr-blue text-white border-pupr-blue shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {inputType.startsWith('areal') && (
              <div className="mb-4 p-2.5 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
                <Info className="w-4 h-4 text-pupr-blue shrink-0" />
                <span className="text-xs text-blue-900">
                  <b>Info SNI 2415:2016:</b> Menggunakan <b>Annual Maximum Series (AMS)</b> yang diekstrak langsung dari deret waktu hujan komposit DAS. Nilai ARF otomatis diset 1.000 untuk mencegah reduksi luas ganda.
                </span>
              </div>
            )}

            {dataInput.length >= 10 && !showManualInput ? (
              <div className="space-y-3">
                {/* Data Summary Card */}
                <div className="flex items-start justify-between p-3.5 bg-pupr-blue text-white rounded-md border border-pupr-blue overflow-hidden shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/10 rounded-md">
                      <CheckCircle2 className="w-5 h-5 text-pupr-yellow" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">
                        {dataInput.length} Tahun Data Hujan Maksimum (AMS)
                      </p>
                      <p className="text-xs text-slate-200">
                        Sumber:{' '}
                        {inputType === 'areal_thiessen'
                          ? 'Hujan Wilayah (Poligon Thiessen)'
                          : inputType === 'areal_algebraic'
                            ? 'Hujan Wilayah (Rerata Aljabar)'
                            : inputType === 'areal_isohyet'
                              ? 'Hujan Wilayah (Garis Isohyet)'
                              : selectedStasiun
                                ? `Stasiun ${selectedStasiun.nama_stasiun}`
                                : 'Data Stasiun Master'}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-300">Minimum:</span>
                          <span className="text-sm font-bold text-white font-mono tabular-nums">{Math.min(...dataInput).toFixed(1)} mm</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-300">Maksimum:</span>
                          <span className="text-sm font-bold text-white font-mono tabular-nums">{Math.max(...dataInput).toFixed(1)} mm</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-300">Rerata:</span>
                          <span className="text-sm font-bold text-white font-mono tabular-nums">{(dataInput.reduce((a, b) => a + b, 0) / dataInput.length).toFixed(1)} mm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowManualInput(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
                  >
                    ✏️ Edit Nilai
                  </button>
                </div>

                {/* Quick Preview Grid */}
                <div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {dataInput.slice(0, showAllData ? dataInput.length : 10).map((val, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-md shadow-xs text-center p-2">
                        <div className="text-[10px] text-slate-500 font-semibold">T-{idx + 1}</div>
                        <div className="text-sm font-bold text-slate-800 tabular-nums">{val.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                  {dataInput.length > 10 && (
                    <button
                      onClick={() => setShowAllData(!showAllData)}
                      className="w-full mt-2 px-3 py-1.5 text-xs font-semibold text-pupr-blue hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                    >
                      {showAllData ? '▲ Tampilkan 10 Data Pertama' : `▼ Tampilkan Semua (${dataInput.length} Data AMS)`}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Input Manual Deret Maksimum Tahunan</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Masukkan minimal 10 baris angka curah hujan ekstrem tahunan (mm)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePasteFromExcel}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-pupr-blue hover:bg-blue-800 text-white text-xs font-semibold rounded-md transition-colors"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      Paste dari Excel
                    </button>
                    {dataInput.length >= 10 && (
                      <button
                        onClick={() => setShowManualInput(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
                      >
                        Selesai
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    value={dataInput.map(v => v.toFixed(1)).join('\n')}
                    onChange={(e) => setDataInput(e.target.value.split('\n').map(v => parseFloat(v.trim().replace(',', '.'))).filter(v => !isNaN(v) && v >= 0))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs focus:border-pupr-blue focus:ring-1 focus:ring-pupr-blue focus:outline-none"
                    rows={8}
                    placeholder="Contoh:&#10;85.4&#10;112.0&#10;95.5&#10;130.2"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold">
                    <span className={dataInput.length >= 10 ? 'text-emerald-600' : 'text-amber-600'}>
                      {dataInput.length}/10 data
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TAHAP 2: Parameter Statistik & Uji Keselarasan */}
        {dataInput.length >= 10 && paramsAsli && paramsLog && goodnessOfFit && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Kolom Kiri: Parameter Statistik */}
            <div className="rounded-md border border-slate-300 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-900">2. Parameter Statistik Sampel</h3>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-pupr-blue text-white">
                      <th className="px-3 py-2 text-left font-semibold">Parameter</th>
                      <th className="px-3 py-2 text-right font-semibold">Data Asli (X)</th>
                      <th className="px-3 py-2 text-right font-semibold">Data Log₁₀ (Y)</th>
                      <th className="px-3 py-2 text-left font-semibold">Definisi Hidrologis</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">Rata-rata (Mean, X̄ / Ȳ)</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">{paramsAsli.mean.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">{paramsLog.mean.toFixed(4)}</td>
                      <td className="px-3 py-2 text-slate-500 text-[11px]">Pusat kecenderungan data</td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">Standar Deviasi (S / Sy)</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">{paramsAsli.stdDev.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">{paramsLog.stdDev.toFixed(4)}</td>
                      <td className="px-3 py-2 text-slate-500 text-[11px]">Dispersi sebaran data</td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">Koefisien Variasi (Cv)</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">{paramsAsli.cv.toFixed(3)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">{paramsLog.cv.toFixed(3)}</td>
                      <td className="px-3 py-2 text-slate-500 text-[11px]">Rasio variasi S / X̄</td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">Koefisien Kemencengan (Cs)</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">{paramsAsli.cs.toFixed(3)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">{paramsLog.cs.toFixed(3)}</td>
                      <td className="px-3 py-2 text-slate-500 text-[11px]">Asimetri bentuk kurva</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">Koefisien Keruncingan (Ck)</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">{paramsAsli.ck.toFixed(3)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">{paramsLog.ck.toFixed(3)}</td>
                      <td className="px-3 py-2 text-slate-500 text-[11px]">Ketajaman puncak kurva</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kolom Kanan: Uji Keselarasan (Goodness-of-Fit) */}
            <div className="rounded-md border border-slate-300 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">3. Uji Keselarasan (Goodness-of-Fit)</h3>
                <span className="text-[11px] text-slate-500 font-semibold">Taraf Nyata α = 5%</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-pupr-blue text-white">
                      <th className="px-3 py-2 text-left font-semibold">Metode</th>
                      <th className="px-3 py-2 text-center font-semibold">Chi-Square (χ²)</th>
                      <th className="px-3 py-2 text-center font-semibold">Smirnov-Kolmogorov (Δ)</th>
                      <th className="px-3 py-2 text-center font-semibold">Status Uji</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goodnessOfFit.map((gof) => {
                      const bothPassed = gof.chiSquare.accepted && gof.kolmogorovSmirnov.accepted;
                      const isRecommended = gof.method === recommendedMethod;
                      return (
                        <tr
                          key={gof.method}
                          className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors cursor-pointer ${
                            isRecommended ? 'bg-amber-50/40' : ''
                          }`}
                          onClick={() => bothPassed && setSelectedMethod(gof.method)}
                        >
                          <td className="px-3 py-2.5 font-bold flex items-center gap-1.5 text-slate-800">
                            {METHOD_LABELS[gof.method]}
                            {isRecommended && (
                              <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded shadow-xs">
                                REKOMENDASI
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono">
                            <span className="font-semibold">{gof.chiSquare.statistic.toFixed(2)}</span>
                            <span className="text-slate-400 text-[10px] ml-1">(cr: {gof.chiSquare.critical.toFixed(2)})</span>
                            <span className="ml-1.5">
                              {gof.chiSquare.accepted ? '✓' : '✕'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono">
                            <span className="font-semibold">{gof.kolmogorovSmirnov.statistic.toFixed(3)}</span>
                            <span className="text-slate-400 text-[10px] ml-1">(cr: {gof.kolmogorovSmirnov.critical.toFixed(3)})</span>
                            <span className="ml-1.5">
                              {gof.kolmogorovSmirnov.accepted ? '✓' : '✕'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded border ${
                              bothPassed
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-red-100 text-red-800 border-red-300'
                            }`}>
                              {bothPassed ? 'LOLOS (PASS)' : 'DITOLAK (FAIL)'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kartu Evaluasi Kriteria SNI 2415:2016 (Full Width) */}
            <div className="lg:col-span-2 rounded-md border border-slate-300 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">4. Evaluasi Syarat Pemilihan Distribusi (SNI 2415:2016 Tabel 1)</h3>
                  <HelpTooltip content="Verifikasi kepatuhan parameter bentuk sampel (Cs, Ck, Cv) terhadap persyaratan baku pemilihan jenis distribusi hidrologi." />
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">Kriteria Asimetri & Keruncingan</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-pupr-blue text-white">
                      <th className="px-3 py-2 text-left font-semibold">Metode Distribusi</th>
                      <th className="px-3 py-2 text-left font-semibold">Syarat Kriteria SNI 2415</th>
                      <th className="px-3 py-2 text-left font-semibold">Nilai Sampel</th>
                      <th className="px-3 py-2 text-center font-semibold">Status Kepatuhan</th>
                      <th className="px-3 py-2 text-left font-semibold">Keterangan Rekayasa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sniCriteria?.map((crit) => (
                      <tr key={crit.method} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2.5 font-bold text-slate-800">{crit.name}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">{crit.criteriaText}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-800 font-semibold">{crit.actualValuesText}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded border ${
                            crit.status === 'SESUAI'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : crit.status === 'MENDEKATI'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}>
                            {crit.status === 'SESUAI' ? '✓ SESUAI' : crit.status === 'MENDEKATI' ? '≈ MENDEKATI' : '✕ TIDAK SESUAI'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 text-[11px]">{crit.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAHAP 3: Hujan Rencana (R24), Kurva Probabilitas & Visualisasi */}
        {distributions && (
          <div className="rounded-md border border-slate-300 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">5. Curah Hujan Rencana (R₂₄) & Kurva Frekuensi</h3>
                <p className="text-xs text-slate-500">Estimasi curah hujan rancangan per periode ulang (2 s/d 100 Tahun)</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center text-xs font-bold text-slate-700">
                  Metode:
                  <HelpTooltip content="Pilih metode distribusi yang telah lolos uji keselarasan untuk diterapkan pada analisis hidrograf banjir downstream." />
                </label>
                <select
                  value={selectedMethod || ''}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white focus:border-pupr-blue focus:ring-1 focus:ring-pupr-blue focus:outline-none"
                >
                  {distributions.map(d => (
                    <option key={d.method} value={d.method}>
                      {METHOD_LABELS[d.method]}
                      {d.method === recommendedMethod ? ' ⭐ (Rekomendasi)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleCalculate}
                  disabled={!selectedMethod}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                    !selectedMethod
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-50'
                      : isCalculated
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : 'bg-pupr-blue hover:bg-blue-800 text-white shadow-sm'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {isCalculated ? 'Tersimpan ke Pipeline ✓' : 'Simpan ke Pipeline'}
                </button>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Kurva Probabilitas Frekuensi */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Kurva Frekuensi Hujan Rencana (R₂₄)</h4>
                    <p className="text-xs text-slate-500">Perbandingan Kurva Teoritis vs Periode Ulang Tr (Tahun)</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-blue-600 inline-block rounded"></span> Normal</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-emerald-600 inline-block rounded"></span> Log Normal</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-amber-500 inline-block rounded"></span> Gumbel</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-purple-600 inline-block rounded"></span> Log Pearson III</span>
                  </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={frequencyCurveData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                      <XAxis
                        dataKey="trLabel"
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                        label={{ value: 'Kala Ulang Tr (Tahun)', position: 'insideBottom', offset: -10, style: { fontSize: 11, fill: '#475569', fontWeight: 600 } }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                        label={{ value: 'Curah Hujan R24 (mm)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#475569', fontWeight: 600 } }}
                      />
                      <RechartsTooltip
                        formatter={(val: number, name: string) => [`${val.toFixed(2)} mm`, name]}
                        labelFormatter={(label) => `Periode Ulang: ${label}`}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Normal"
                        stroke="#2563eb"
                        strokeWidth={selectedMethod === 'normal' ? 3.5 : 1.5}
                        dot={{ r: selectedMethod === 'normal' ? 4 : 2 }}
                        strokeDasharray={selectedMethod === 'normal' ? undefined : '4 4'}
                      />
                      <Line
                        type="monotone"
                        dataKey="LogNormal"
                        stroke="#059669"
                        strokeWidth={selectedMethod === 'lognormal' ? 3.5 : 1.5}
                        dot={{ r: selectedMethod === 'lognormal' ? 4 : 2 }}
                        strokeDasharray={selectedMethod === 'lognormal' ? undefined : '4 4'}
                      />
                      <Line
                        type="monotone"
                        dataKey="Gumbel"
                        stroke="#d97706"
                        strokeWidth={selectedMethod === 'gumbel' ? 3.5 : 1.5}
                        dot={{ r: selectedMethod === 'gumbel' ? 4 : 2 }}
                        strokeDasharray={selectedMethod === 'gumbel' ? undefined : '4 4'}
                      />
                      <Line
                        type="monotone"
                        dataKey="LogPearson3"
                        stroke="#7c3aed"
                        strokeWidth={selectedMethod === 'logpearson3' ? 4 : 1.5}
                        dot={{ r: selectedMethod === 'logpearson3' ? 5 : 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Kala Ulang Selector Bar */}
              <div className="p-4 bg-gradient-to-br from-pupr-blue to-slate-900 text-white rounded-md shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Pilih Kala Ulang Desain (Q_Tr)</h4>
                      <p className="text-[11px] text-slate-300">Nilai hujan rencana terpilih akan diteruskan ke hidrograf banjir & saluran</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-1 bg-black/30 rounded-md border border-white/10">
                    {RETURN_PERIODS.map(tr => (
                      <button
                        key={tr}
                        onClick={() => setSelectedTr(tr)}
                        className={`px-3 py-1 text-xs font-extrabold rounded transition-all ${
                          selectedTr === tr
                            ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Q{tr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {distributions.map(d => {
                    const value = d.values.find(v => v.Tr === selectedTr)?.R24 || 0;
                    const maxValue = Math.max(...distributions.map(dist => dist.values.find(v => v.Tr === selectedTr)?.R24 || 0));
                    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    const isSelected = d.method === selectedMethod;
                    const isFailed = goodnessOfFit?.find(g => g.method === d.method) &&
                      !(goodnessOfFit.find(g => g.method === d.method)!.chiSquare.accepted &&
                        goodnessOfFit.find(g => g.method === d.method)!.kolmogorovSmirnov.accepted);

                    return (
                      <div key={d.method} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-bold ${isSelected ? 'text-amber-300' : isFailed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                            {METHOD_LABELS[d.method]}
                            {isFailed && <span className="ml-1 text-[9px] uppercase px-1 py-0.2 bg-red-500/20 text-red-300 rounded font-normal">Ditolak</span>}
                            {isSelected && <span className="ml-1 text-[9px] uppercase px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded font-black">Aktif</span>}
                          </span>
                          <span className={`font-mono font-bold ${isSelected ? 'text-amber-300' : 'text-slate-300'}`}>
                            {value.toFixed(2)} mm
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isSelected
                                ? 'bg-amber-400'
                                : isFailed ? 'bg-slate-600' : 'bg-slate-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tabel Matriks Curah Hujan Rencana (R24) dengan WhiteBox Formula Lengkap */}
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-pupr-blue text-white">
                      <th className="px-3 py-2.5 text-center font-bold">Kala Ulang (Tr)</th>
                      {distributions.map(d => {
                        const isSelected = d.method === selectedMethod;
                        return (
                          <th key={d.method} className={`px-3 py-2.5 text-right font-bold transition-colors ${isSelected ? 'bg-blue-900 text-amber-300' : 'text-white'}`}>
                            {METHOD_LABELS[d.method]}
                            {isSelected ? ' ★' : ''}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {RETURN_PERIODS.map(tr => (
                      <tr
                        key={tr}
                        className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                          selectedTr === tr ? 'bg-blue-50/80 font-bold' : ''
                        }`}
                        onClick={() => setSelectedTr(tr)}
                      >
                        <td className={`px-3 py-2 text-center font-bold tabular-nums ${
                          selectedTr === tr ? 'text-pupr-blue' : 'text-slate-700'
                        }`}>
                          {tr} Tahun (Q{tr})
                        </td>
                        {distributions.map(d => {
                          const value = d.values.find(v => v.Tr === tr);
                          const isSelected = d.method === selectedMethod;
                          const formula = getWhiteBoxFormula(d.method, tr, value?.R24 || 0);

                          return (
                            <td
                              key={d.method}
                              className={`px-3 py-2 text-right font-mono tabular-nums ${
                                isSelected ? 'bg-blue-50/40 font-bold text-pupr-blue' : 'text-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <span>{value?.R24.toFixed(2)} mm</span>
                                {formula && <WhiteBoxFormula {...formula} />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
};

export default ModulAnalisisFrekuensi;
