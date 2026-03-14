import React, { useState, useEffect } from 'react';
import { MANNING_ROUGHNESS } from '@/constants';
import { saveManningCalculation } from '@/services/calculationService';
import { ManningInputs, CalculationType, ChannelShape } from '@/types/types';
import { InputGroup } from '@/components/ui/forms/InputGroup';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/feedback/Alert';
import { ChannelVisualizer } from './ChannelVisualizer';
import { useHydraulicCalculations } from '@/hooks/useHydraulicCalculations';

import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';
import { SlopeCalculator } from './SlopeCalculator';
import { SelectWithSearch } from '@/components/ui/forms/SelectWithSearch';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { SNIFooter, SNITooltipLabel } from '@/components/ui/data-display/SNICompliance';
import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';
import { Collapsible } from '@/components/ui/Collapsible';
// getCurrentLocation removed as it is not used directly here

import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Metric } from '@/components/ui/Metric';
import { Waves, RefreshCw, Activity } from 'lucide-react';

interface Props {
 onSave: (type: CalculationType, inputs: ManningInputs, outputs: any) => void;
 onConsultAI: (inputs: ManningInputs, outputs: any) => void;
}

export const ManningCalculator: React.FC<Props> = ({ onConsultAI }) => {
 const { calculateManningChannel, manningResults, isCalculating: isHookCalculating, error: calcError } = useHydraulicCalculations();
 const { getDesignDischarge, identitasLokasi } = useHydrologyStore();
 
 // Ambil Debit Rencana dari modul Banjir (SSOT)
 const qDesign = getDesignDischarge('flood');
 
 const [isSaving, setIsSaving] = useState(false);
 const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
 const [inputs, setInputs] = useState<ManningInputs>({
 site: { channelName: '', regency: '', district: '', village: '' },
 shape: ChannelShape.TRAPEZOID,
 roughness: 0.025,
 slope: 0.001,
 width: 2.0,
 topWidth: 2.5,
 diameter: 1.0,
 depth: 1.0,
 totalDepth: 1.5,
 sideSlope: 0.1666,
 });

 const [showSlopeCalculator, setShowSlopeCalculator] = useState<boolean>(false);
 const [errors, setErrors] = useState<Record<string, string>>({});


 const handleSaveToDatabase = async () => {
 const projectName = inputs?.site?.channelName;
 if (!projectName) {
 setSaveMessage({ type: 'error', text: 'Mohon isi Nama Saluran di Identitas Lokasi terlebih dahulu' });
 setTimeout(() => setSaveMessage(null), 3000);
 return;
 }

 setIsSaving(true);
 try {
 const { error } = await saveManningCalculation({
 projectName: identitasLokasi.namaPekerjaan || 'Untitled Project',
 inputs: {
 ...inputs,
 site: {
 ...inputs.site,
 location: identitasLokasi.koordinat ? {
 latitude: identitasLokasi.koordinat.lat || 0,
 longitude: identitasLokasi.koordinat.lng || 0,
 accuracy: 10,
 timestamp: Date.now()
 } : null
 }
 },
 results: manningResults
 });

 if (error) {
 setSaveMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
 } else {
 setSaveMessage({ type: 'success', text: '✓ Berhasil menyimpan perhitungan!' });
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

 const updateGeometricParams = (newInputs: ManningInputs) => {
 if (newInputs.shape === ChannelShape.TRAPEZOID && newInputs.totalDepth > 0) {
 const b = newInputs.width;
 const B = newInputs.topWidth;
 const H = newInputs.totalDepth;
 newInputs.sideSlope = Math.max(0, (B - b) / (2 * H));
 }
 return newInputs;
 };

 const validateInputs = (newInputs: ManningInputs): Record<string, string> => {
 const newErrors: Record<string, string> = {};
 if (newInputs.roughness <= 0) newErrors.roughness = "Manning coefficient must be > 0";
 if (newInputs.slope <= 0) newErrors.slope = "Slope must be > 0";
 if (newInputs.slope > 0.1) newErrors.slope = "Slope seems unusually high (> 0.1)";
 if (newInputs.shape === ChannelShape.TRAPEZOID) {
 if (newInputs.width <= 0) newErrors.width = "Bottom width must be > 0";
 if (newInputs.depth <= 0) newErrors.depth = "Water depth must be > 0";
 } else {
 if (newInputs.diameter <= 0) newErrors.diameter = "Diameter must be > 0";
 if (newInputs.depth <= 0 || newInputs.depth > newInputs.diameter)
 newErrors.depth = "Water depth must be between 0 and diameter";
 }
 return newErrors;
 };

 const handleInputChange = (field: keyof ManningInputs, value: any) => {
 let updatedInputs = { ...inputs, [field]: value };
 if (field === 'width' || field === 'topWidth' || field === 'totalDepth') {
 updatedInputs = updateGeometricParams(updatedInputs);
 }
 setInputs(updatedInputs);
 
 const validationErrors = validateInputs(updatedInputs);
 setErrors(validationErrors);
 };

 // handleLocationChange removed (SSOT)



 useEffect(() => {
 const runCalc = async () => {
 const validationErrors = validateInputs(inputs);
 if (Object.keys(validationErrors).length === 0) {
 await calculateManningChannel(inputs);
 }
 };
 runCalc();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [inputs]);

 return (
 <ModuleLayout
 title="Analisis Saluran Manning"
 description="Perhitungan kapasitas debit saluran terbuka · Rumus Manning"
 icon={<Waves className="w-6 h-6" />}
 iconColorClass="bg-pupr-surface text-pupr-blue"
 sniCode="SNI 03-3424-1994"
 actions={
 <button 
 onClick={() => {
 setInputs({
 site: { channelName: '', regency: '', district: '', village: '' },
 shape: ChannelShape.TRAPEZOID,
 roughness: 0.025,
 slope: 0.001,
 width: 2.0,
 topWidth: 2.5,
 diameter: 1.0,
 depth: 1.0,
 totalDepth: 1.5,
 sideSlope: 0.1666,
 });
 setErrors({});
 }}
 className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all border border-slate-200 dark:border-slate-700 group"
 title="Reset Parameters"
 >
 <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-75" />
 </button>
 }
 >
 <div className="p-4 sm:p-6 relative min-h-[800px]">
 {/* Toast Messages positioning adjusted for Fixed Shell */}

 {saveMessage && (
 <div className={`absolute top-4 right-4 z-[110] px-4 py-2 rounded-sm border flex items-center gap-2 animate-fade-in pointer-events-none ${saveMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 {saveMessage.type === 'success' ? (
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
 ) : (
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 )}
 </svg>
 <span className="font-medium text-sm">{saveMessage.text}</span>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
 {/* LEFT SIDEBAR (Span 5) */}
 <div className="md:col-span-5 flex flex-col gap-4">

 {/* Project Banner (SSOT) */}
 <ProjectContextBanner />
 {/* Formula Display */}
 <div className="mb-4">
 <FormulaAccordion 
 title="Persamaan Manning"
 subtitle="Perhitungan Kapasitas Saluran Terbuka"
 theme="blue"
 formulas={[
 { label: "Rumus Utama (Debit)", math: "Q = \frac{1}{n} \cdot A \cdot R^{2/3} \cdot S^{1/2}" },
 { label: "Kecepatan Aliran", math: "V = \frac{Q}{A}" },
 { label: "Jari-jari Hidrolis", math: "R = \frac{A}{P}" },
 { label: "Bilangan Froude", math: "Fr = \frac{V}{\sqrt{g \cdot D}}" }
 ]}
 parameters={[
 { symbol: "Q", description: "Debit aliran rancangan", unit: "m�/s" },
 { symbol: "V", description: "Kecepatan aliran", unit: "m/s" },
 { symbol: "n", description: "Koefisien kekasaran Manning", unit: "-" },
 { symbol: "A", description: "Luas penampang basah", unit: "m�" },
 { symbol: "R", description: "Jari-jari hidrolis", unit: "m" },
 { symbol: "P", description: "Keliling penampang basah", unit: "m" },
 { symbol: "S", description: "Kemiringan dasar saluran", unit: "m/m" },
 { symbol: "Fr", description: "Bilangan Froude (Fr < 1 Subkritis)", unit: "-" }
 ]}
 reference="SNI 03-3424-1994 (Tata Cara Perencanaan Drainase Permukaan Jalan)"
 />
 </div>

 {/* Geometry Section */}
 <Collapsible title="Geometri Saluran" defaultOpen={true}>

 {(Object.keys(errors).length > 0 || calcError) && (
 <div className="mb-4">
 <Alert
 type="error"
 title="Validation Errors"
 message={calcError || Object.values(errors).join(', ')}
 />
 </div>
 )}

 <div className="space-y-4">
 {/* Shape Toggle */}
 <div className="p-2 bg-slate-100 rounded-sm flex gap-2">
 {[ChannelShape.TRAPEZOID, ChannelShape.CIRCULAR].map((s) => (
 <button
 key={s}
 onClick={() => handleInputChange('shape', s)}
 className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-sm transition-all ${inputs.shape === s ? 'bg-white dark:bg-slate-900 text-pupr-blue ' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'}`}
 >
 {s === ChannelShape.TRAPEZOID ? 'Trapesium' : 'Lingkaran'}
 </button>
 ))}
 </div>

 {/* Shape-specific inputs */}
 <div className="space-y-3">
 {inputs.shape === ChannelShape.TRAPEZOID ? (
 <>
 <div>
 <SNITooltipLabel label="Lebar Bawah (b)" tooltip="Lebar dasar saluran trapesium. Dimensi ini mempengaruhi luas penampang basah." /><InputGroup id="trapezoid-width" label="" unit="m" value={inputs.width} onChange={e => handleInputChange('width', parseFloat(e.target.value) || 0)} placeholder="1.5" />
 </div>
 <div>
 <SNITooltipLabel label="Lebar Atas (B)" tooltip="Lebar permukaan air di bagian atas saluran trapesium." /><InputGroup id="trapezoid-top-width" label="" unit="m" value={inputs.topWidth} onChange={e => handleInputChange('topWidth', parseFloat(e.target.value) || 0)} placeholder="2.0" />
 </div>
 <div>
 <SNITooltipLabel label="Tinggi Total (H)" tooltip="Tinggi total saluran dari dasar hingga puncak dinding." /><InputGroup id="trapezoid-total-depth" label="" unit="m" value={inputs.totalDepth} onChange={e => handleInputChange('totalDepth', parseFloat(e.target.value) || 0)} placeholder="1.5" />
 </div>
 <div>
 <SNITooltipLabel label="Tinggi Air (h)" tooltip="Kedalaman air aktual dalam saluran. Harus lebih kecil dari tinggi total." />
 <InputGroup id="trapezoid-depth" label="" unit="m" value={inputs.depth} onChange={e => handleInputChange('depth', parseFloat(e.target.value) || 0)} placeholder="0.8" />
 </div>
 </>
 ) : (
 <>
 <div>
 <SNITooltipLabel label="Diameter (D)" tooltip="Diameter pipa lingkaran. Untuk pipa penuh, tinggi air = diameter." /><InputGroup id="circular-diameter" label="" unit="m" value={inputs.diameter} onChange={e => handleInputChange('diameter', parseFloat(e.target.value) || 0)} placeholder="1.0" />
 </div>
 <div>
 <SNITooltipLabel label="Tinggi Air (h)" tooltip="Kedalaman air dalam pipa. Untuk aliran penuh, h = D." />
 <InputGroup id="circular-depth" label="" unit="m" value={inputs.depth} onChange={e => handleInputChange('depth', parseFloat(e.target.value) || 0)} placeholder="0.8" />
 </div>
 </>
 )}
 </div>

 {/* Slope */}
 <div>
 <SNITooltipLabel
 label="Kemiringan Dasar (S)"
 tooltip="Kemiringan longitudinal dasar saluran dalam m/m. Mempengaruhi kecepatan aliran sesuai Rumus Manning."
 sniRef="SNI 2415:2016"
 />
 <InputGroup id="slope" label="" unit="m/m" step="0.0001" value={inputs.slope} onChange={e => handleInputChange('slope', parseFloat(e.target.value) || 0)} placeholder="0.002" />
 <button
 onClick={() => setShowSlopeCalculator(!showSlopeCalculator)}
 className="mt-2 w-full px-3 py-2.5 text-pupr-blue bg-pupr-surface hover:bg-blue-100 rounded-sm transition-colors border border-pupr-border text-xs font-bold"
 >
 Kalkulator Kemiringan
 </button>
 {showSlopeCalculator && (
 <div className="mt-3">
 <SlopeCalculator
 onSlopeCalculated={(slope) => handleInputChange('slope', slope)}
 onClose={() => setShowSlopeCalculator(false)}
 />
 </div>
 )}
 </div>

 {/* Roughness */}
 <div>
 <SNITooltipLabel
 label="Kekasaran Manning (n)"
 tooltip="Koefisien kekasaran Manning berdasarkan material saluran. Nilai referensi dari SNI 2415:2016."
 sniRef="SNI 2415:2016"
 />
 <SelectWithSearch
 options={MANNING_ROUGHNESS.map(m => ({
 value: m.value.toString(),
 label: `${m.name} (n=${m.value})`
 }))}
 value={inputs.roughness.toString()}
 onChange={v => handleInputChange('roughness', parseFloat(v))}
 placeholder="Pilih material saluran"
 />
 </div>
 </div>
 </Collapsible>
 </div>

 {/* MAIN CONTENT (Span 7) */}
 <div className="md:col-span-7 flex flex-col gap-6 min-h-0">
 <div className="space-y-6">

 {/* Visualization */}
 <Card className="glass-card border-white/20 p-4 sm:p-6">
 <h2 className="text-base sm:text-lg font-bold text-neutral-900 mb-3 sm:mb-4">Tampilan Penampang Melintang</h2>
 <CardContent className="p-0">
 <ChannelVisualizer inputs={inputs} results={manningResults} />
 </CardContent>
 </Card>

 {manningResults && (
 <>
 {/* KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
 {isHookCalculating && (
 <div className="absolute inset-0 bg-white dark:bg-slate-900 ] z-10 flex items-center justify-center rounded-sm">
 <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-sm animate-pulse bg-slate-200 rounded-sm"></div>
 </div>
 )}
  <Metric
  label="Kapasitas Debit (Q Cap)"
  value={Number(manningResults?.Discharge || 0)}
  unit="m³/s"
  variant="blue"
  density="detailed"
  className="bg-pupr-surface/50 border-pupr-border"
  icon={<Waves className="w-6 h-6" />}
  />
  <Metric
  label="Kecepatan Aliran"
  value={Number(manningResults?.Velocity || 0)}
  unit="m/s"
  variant="slate"
  density="detailed"
  icon={<Activity className="w-6 h-6" />}
  />

 </div>
 
 {/* Evaluasi Kapasitas vs Debit Banjir Rencana */}
 {qDesign !== null && qDesign > 0 && (
 <div className={`p-4 rounded-sm border ${Number(manningResults?.Discharge || 0) >= qDesign ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} flex items-start gap-3 `}>
 <div className={`mt-0.5 p-1.5 rounded-sm ${Number(manningResults?.Discharge || 0) >= qDesign ? 'bg-emerald-100 text-pupr-blue' : 'bg-red-100 text-red-600'}`}>
 {Number(manningResults?.Discharge || 0) >= qDesign ? (
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
 ) : (
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
 )}
 </div>
 <div className="flex-1">
 <h3 className={`text-sm font-bold ${Number(manningResults?.Discharge || 0) >= qDesign ? 'text-emerald-800' : 'text-red-800'}`}>
 {Number(manningResults?.Discharge || 0) >= qDesign ? 'Kapasitas Saluran Aman' : 'Peringatan: Potensi Saluran Meluap (Overtopping)'}
 </h3>
 <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs">
 <span className={Number(manningResults?.Discharge || 0) >= qDesign ? 'text-emerald-700' : 'text-red-700'}>
 Debit Banjir Rencana (Q Design): <strong className="font-mono">{Number(qDesign || 0).toFixed(3)} m³/s</strong>
 </span>
 <span className="hidden sm:inline text-slate-300">|</span>
 <span className={Number(manningResults?.Discharge || 0) >= qDesign ? 'text-emerald-700' : 'text-red-700'}>
 Kapasitas Saluran (Q Cap): <strong className="font-mono">{Number(manningResults?.Discharge || 0).toFixed(3)} m³/s</strong>
 </span>
 </div>
 <p className={`mt-2 text-xs ${Number(manningResults?.Discharge || 0) >= qDesign ? 'text-pupr-blue' : 'text-red-600 font-medium'}`}>
 {Number(manningResults?.Discharge || 0) >= qDesign 
 ? 'Dimensi saluran ini cukup untuk menampung debit banjir dari hasil perhitungan hidrologi.' 
 : 'Kapasitas saluran lebih kecil dari debit rencana. Pertimbangkan untuk memperlebar dasar saluran (b) atau memperdalam tinggi jagaan (H).'}
 </p>
 </div>
 </div>
 )}

 {/* Detailed Results */}
 <Card className="glass-card border-white/20 p-4 sm:p-6 opacity-ransition duration-75" style={{ opacity: isHookCalculating ? 0.7 : 1 }}>
 <h2 className="text-base sm:text-lg font-bold text-neutral-900 mb-3 sm:mb-4">Rincian Hasil Perhitungan</h2>
 <CardContent className="p-0 space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
 {[
 { label: 'Jari-jari Hidrolis', val: Number(manningResults?.Radius || 0).toFixed(3), unit: 'm', help: 'Rasio luas penampang terhadap keliling basah' },
 { label: 'Lebar Permukaan', val: Number(manningResults?.TopWidth || 0).toFixed(3), unit: 'm', help: 'Lebar permukaan air di bagian atas' },
 { label: 'Energi Spesifik', val: Number(manningResults?.SpecificEnergy || 0).toFixed(3), unit: 'm', help: 'Total energi per satuan berat air' },
 { label: 'Tegangan Geser', val: Number(manningResults?.ShearStress || 0).toFixed(2), unit: 'N/m²', help: 'Gaya geser pada dasar saluran' },
 ].map((item, i) => (
 <div key={i} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-sm">
 <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1 flex items-center gap-1">
 {item.label}
 <div className="group relative inline-block">
 <svg className="w-3 h-3 text-slate-500 hover:text-pupr-blue cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-48 z-50 whitespace-normal">
 {item.help}
 <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
 </div>
 </div>
 </span>
 <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.val} <span className="text-xs text-slate-500">{item.unit}</span></span>
 </div>
 ))}
 </div>

 <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
 <Button className="w-full flex-1" onClick={handleSaveToDatabase} disabled={isSaving}>
 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
 {isSaving ? 'Menyimpan...' : 'Simpan Hasil'}
 </Button>
 <Button variant="outline" className="w-full flex-1" onClick={() => onConsultAI(inputs, manningResults)}>
 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
 Analisis AI
 </Button>
 </div>

 <SNIFooter
 standard="SNI 2415:2016"
 title="Rumus Manning untuk Perhitungan Kapasitas Saluran"
 />
 </CardContent>
 </Card>
 </>
 )}
 </div>
 </div>
 </div>
 </div>
 </ModuleLayout>
 );
};
