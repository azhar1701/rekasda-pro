import React, { useState, useEffect } from 'react';
import { Waves, RefreshCw, Calculator, Zap, Maximize2, Activity, Info, ArrowDownRight } from 'lucide-react';
import { useHydraulicCalculations } from '@/hooks/useHydraulicCalculations';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { ManningInputs, ChannelShape, CalculationType } from '@/types/types';
import { MANNING_ROUGHNESS } from '@/constants';
import { toast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { InputGroup } from '@/components/ui/forms/InputGroup';
import { SelectWithSearch } from '@/components/ui/forms/SelectWithSearch';
import { SNITooltipLabel, SNIFooter } from '@/components/ui/data-display/SNICompliance';
import { ChannelVisualizer } from '../ChannelVisualizer';
import { RatingCurveChart } from './RatingCurveChart';
import { SlopeCalculator } from '../SlopeCalculator';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';
import { saveManningCalculation } from '@/services/calculationService';
import { cn } from '@/lib/utils';

interface Props {
    onSave?: (type: CalculationType, inputs: ManningInputs, outputs: any) => void;
    onConsultAI?: (inputs: ManningInputs, outputs: any) => void;
}

export const ChannelWorkstation: React.FC<Props> = ({ onSave, onConsultAI }) => {
    const { calculateManningChannel, manningResults } = useHydraulicCalculations();
    const { getDesignDischarge, identitasLokasi } = useHydrologyStore();
    
    const qDesign = getDesignDischarge('flood');
    const [isSaving, setIsSaving] = useState(false);
    const [showSlopeCalc, setShowSlopeCalc] = useState(false);

    const [inputs, setInputs] = useState<ManningInputs>({
        site: { channelName: '', regency: '', district: '', village: '' },
        shape: ChannelShape.TRAPEZOID,
        roughness: 0.025,
        slope: 0.001,
        width: 2.0,
        topWidth: 3.0,
        diameter: 1.0,
        depth: 1.2,
        totalDepth: 2.0,
        sideSlope: 0.416,
    });

    const updateGeometricParams = (newInputs: ManningInputs) => {
        if (newInputs.shape === ChannelShape.TRAPEZOID && newInputs.totalDepth > 0) {
            const b = newInputs.width;
            const B = newInputs.topWidth;
            const H = newInputs.totalDepth;
            newInputs.sideSlope = Math.max(0, (B - b) / (2 * H));
        }
        return newInputs;
    };

    const handleInputChange = (field: keyof ManningInputs, value: any) => {
        let updatedInputs = { ...inputs, [field]: value };
        if (field === 'width' || field === 'topWidth' || field === 'totalDepth') {
            updatedInputs = updateGeometricParams(updatedInputs);
        }
        setInputs(updatedInputs);
    };

    useEffect(() => {
        calculateManningChannel(inputs);
    }, [inputs, calculateManningChannel]);

    const handleSave = async () => {
        if (onSave) {
            onSave(CalculationType.MANNING, inputs, manningResults);
        } else {
            setIsSaving(true);
            try {
                const { error } = await saveManningCalculation({
                    projectName: identitasLokasi.namaPekerjaan || 'Untitled Project',
                    inputs,
                    results: manningResults
                });
                if (error) throw error;
                console.log("SAVE_SUCCESS: Result saved successfully.");
                toast.success("Hasil perhitungan berhasil disimpan!");
            } catch (err: any) {
                toast.error(`Gagal menyimpan: ${err.message}`);
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-300">
            {/* Engineering Control Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-pupr-blue text-white rounded-none shadow-sm">
                        <Waves className="w-5 h-5 text-pupr-yellow" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Workstation Analisis Saluran</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1 italic">Manning Steady Flow Analysis Engine</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setInputs({ ...inputs, width: 2.0, depth: 1.0 })}
                        className="h-8 text-[10px] font-black uppercase tracking-widest rounded-none border-slate-200 bg-white hover:bg-slate-50"
                    >
                        <RefreshCw className="w-3 h-3 mr-2" /> Reset
                    </Button>
                    {onConsultAI && (
                        <Button 
                            variant="outline"
                            size="sm" 
                            onClick={() => onConsultAI(inputs, manningResults)}
                            className="h-8 text-[10px] font-black uppercase tracking-widest rounded-none border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                            <Activity className="w-3 h-3 mr-2" /> Konsultasi AI
                        </Button>
                    )}
                    <Button 
                        size="sm" 
                        disabled={isSaving}
                        onClick={handleSave}
                        className="h-8 text-[10px] font-black uppercase tracking-widest rounded-none bg-pupr-blue hover:bg-slate-800 text-white border-none"
                    >
                        <Zap className="w-3 h-3 mr-2 text-pupr-yellow" /> {isSaving ? 'Saving...' : 'Simpan Design'}
                    </Button>
                </div>
            </div>

            {/* Split-Pane Workstation */}
            <div className="flex-1 flex overflow-hidden">
                {/* Side Navigator - Navigator Input Panel */}
                <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 overflow-y-auto">
                    <div className="p-5 flex flex-col gap-6">
                        <ProjectContextBanner />

                        {/* Shape Configuration */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-pupr-blue"></span>
                                KONFIGURASI PENAMPANG
                            </h3>
                            <div className="px-0">
                                <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-sm border border-slate-200 dark:border-slate-700">
                                    {[ChannelShape.TRAPEZOID, ChannelShape.CIRCULAR].map((shape) => (
                                        <button
                                            key={shape}
                                            onClick={() => handleInputChange('shape', shape)}
                                            className={cn(
                                                "py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                                inputs.shape === shape 
                                                    ? "bg-white dark:bg-slate-900 text-pupr-blue shadow-sm" 
                                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                            )}
                                        >
                                            {shape === ChannelShape.TRAPEZOID ? 'Trapesium' : 'Lingkaran'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Geometry Inputs */}
                        <div className="space-y-4 mt-2">
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-pupr-blue"></span>
                                DIMENSI & ELEVASI
                            </h3>
                            <div className="space-y-4">
                                {inputs.shape === ChannelShape.TRAPEZOID ? (
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                                        <InputGroup id="b" label="Dasar (b)" unit="m" value={inputs.width} onChange={e => handleInputChange('width', parseFloat(e.target.value) || 0)} className="h-10" />
                                        <InputGroup id="z" label="Sisi (z)" unit="1:z" value={inputs.sideSlope} onChange={e => handleInputChange('sideSlope', parseFloat(e.target.value) || 0)} className="h-10" />
                                        <InputGroup id="B" label="Puncak (B)" unit="m" value={inputs.topWidth} onChange={e => handleInputChange('topWidth', parseFloat(e.target.value) || 0)} className="h-10" />
                                        <InputGroup id="H" label="Tinggi (H)" unit="m" value={inputs.totalDepth} onChange={e => handleInputChange('totalDepth', parseFloat(e.target.value) || 0)} className="h-10" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputGroup id="D" label="Diameter (D)" unit="m" value={inputs.diameter} onChange={e => handleInputChange('diameter', parseFloat(e.target.value) || 0)} className="h-10 col-span-2" />
                                    </div>
                                )}
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <InputGroup id="h" label="Kedalaman Air (h)" unit="m" value={inputs.depth} onChange={e => handleInputChange('depth', parseFloat(e.target.value) || 0)} className="bg-blue-50/20 border-pupr-blue/30 h-10 ring-1 ring-pupr-blue/5" />
                                </div>
                            </div>
                        </div>

                        {/* Material & Slope */}
                        <div className="space-y-4 mt-2">
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-pupr-blue"></span>
                                HIDROLIKA DASAR
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex gap-1 items-end">
                                        <InputGroup id="S" label="Kemiringan (S)" unit="m/m" value={inputs.slope} onChange={e => handleInputChange('slope', parseFloat(e.target.value) || 0)} className="flex-1 h-10" helpText="Kemiringan longitudinal saluran." />
                                        <Button variant="outline" size="sm" onClick={() => setShowSlopeCalc(!showSlopeCalc)} className="h-10 w-10 p-0 rounded-none border-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                            <Calculator className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                                        </Button>
                                    </div>
                                    {showSlopeCalc && (
                                        <div className="mt-3 p-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
                                            <SlopeCalculator onSlopeCalculated={(s) => handleInputChange('slope', s)} onClose={() => setShowSlopeCalc(false)} />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <SNITooltipLabel label="Koefisien Kekasaran (n)" tooltip="Koefisien Manning berdasarkan material penampang." className="text-[12px] font-bold text-slate-500 uppercase tracking-tight" />
                                    <SelectWithSearch
                                        options={MANNING_ROUGHNESS.map(m => ({ value: m.value.toString(), label: `${m.name} (n=${m.value})` }))}
                                        value={inputs.roughness.toString()}
                                        onChange={v => handleInputChange('roughness', parseFloat(v))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area - Workspace */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {/* Engineering Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                        <div className="bg-white dark:bg-slate-900 border-l-4 border-l-pupr-blue border-y border-r border-slate-200 dark:border-slate-800 p-5 group flex flex-col justify-between h-28 italic">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Kapasitas Debit (Q)</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter line-height-none">
                                    {Number(manningResults?.Discharge || 0).toFixed(3)}
                                </h3>
                                <span className="text-xs font-bold text-slate-400">m³/s</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between h-28">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Kecepatan (V)</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-black text-slate-700 dark:text-slate-300 tabular-nums">
                                    {Number(manningResults?.Velocity || 0).toFixed(3)}
                                </h3>
                                <span className="text-xs font-bold text-slate-400">m/s</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[9px] font-black text-slate-500 uppercase flex items-center gap-1.5 mt-auto">
                                <Maximize2 className="w-3 h-3" /> Area: {manningResults?.Area} m²
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between h-28">
                            <div className="flex justify-between items-start">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bil. Froude (Fr)</p>
                                <div className={cn(
                                    "px-2 py-0.5 text-[8px] font-black uppercase rounded-[2px] shadow-sm",
                                    Number(manningResults?.Froude || 0) < 1 
                                        ? "bg-emerald-500 text-white border border-emerald-600" 
                                        : "bg-rose-500 text-white border border-rose-600"
                                )}>
                                    {manningResults?.FlowType || '-'}
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-slate-700 dark:text-slate-300 tabular-nums">
                                {Number(manningResults?.Froude || 0).toFixed(3)}
                            </h3>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">Kedalaman Hidrolik: {manningResults?.HydraulicDepth} m</div>
                        </div>

                        <div className={cn(
                            "p-5 flex flex-col justify-between h-28 border",
                            manningResults?.SafetyStatus === 'Aman' 
                                ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800" 
                                : "bg-rose-50/50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800"
                        )}>
                            <p className={cn("text-[10px] font-black uppercase tracking-widest", manningResults?.SafetyStatus === 'Aman' ? "text-emerald-600" : "text-rose-600")}>Safety Margin</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className={cn("text-3xl font-black tabular-nums", manningResults?.SafetyStatus === 'Aman' ? "text-emerald-700" : "text-rose-700")}>
                                    {Number(manningResults?.Freeboard || 0).toFixed(2)}
                                </h3>
                                <div className={cn(
                                    "px-2 py-0.5 text-[8px] font-black uppercase rounded-none border",
                                    manningResults?.SafetyStatus === 'Aman' 
                                        ? "bg-emerald-100/50 text-emerald-700 border-emerald-200" 
                                        : "bg-rose-100/50 text-rose-700 border-rose-200"
                                )}>
                                    {manningResults?.SafetyStatus}
                                </div>
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase">m high • Tinggi Jagaan</p>
                        </div>
                    </div>

                    {/* Integrated Analytics Dashboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                        {/* Visual Sections */}
                        <div className="lg:col-span-8 flex flex-col gap-6 min-h-0">
                            {/* Cross-Section Section */}
                            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col min-h-[300px]">
                                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-pupr-blue" />
                                        <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Visualisasi Penampang Melintang</h3>
                                    </div>
                                    <div className="bg-pupr-yellow/10 px-2 py-1 flex items-center gap-1.5 border border-pupr-yellow/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-pupr-yellow animate-pulse" />
                                        <span className="text-[9px] font-black text-pupr-blue uppercase">Design Live View</span>
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <ChannelVisualizer inputs={inputs} results={manningResults} />
                                </div>
                            </div>

                            {/* Detailed Hydraulic Matrix */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Matriks Parameter Hidrolika Detil</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[11px] border-collapse">
                                        <thead className="bg-slate-50/30 dark:bg-slate-800/30 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                            <tr>
                                                <th className="px-5 py-3">Parameter</th>
                                                <th className="px-5 py-3">Simbol</th>
                                                <th className="px-5 py-3 text-right">Nilai</th>
                                                <th className="px-5 py-3">Satuan</th>
                                                <th className="px-5 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                                            <tr className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-2.5 font-bold text-slate-600">Jari-Jari Hidrolis</td>
                                                <td className="px-5 py-2.5 text-slate-400">R</td>
                                                <td className="px-5 py-2.5 text-right font-black text-slate-800 dark:text-slate-200">{manningResults?.Radius}</td>
                                                <td className="px-5 py-2.5 text-slate-400">m</td>
                                                <td className="px-5 py-2.5"><span className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-black text-slate-500 uppercase tracking-tighter">Geometric</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-2.5 font-bold text-slate-600">Energi Spesifik</td>
                                                <td className="px-5 py-2.5 text-slate-400">Es</td>
                                                <td className="px-5 py-2.5 text-right font-black text-slate-800 dark:text-slate-200">{manningResults?.SpecificEnergy}</td>
                                                <td className="px-5 py-2.5 text-slate-400">m</td>
                                                <td className="px-5 py-2.5"><span className="text-[9px] px-2 py-0.5 bg-blue-100/50 text-pupr-blue rounded font-black uppercase tracking-tighter">Energy Level</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-2.5 font-bold text-slate-600">Tegangan Geser</td>
                                                <td className="px-5 py-2.5 text-slate-400">τ</td>
                                                <td className="px-5 py-2.5 text-right font-black text-slate-800 dark:text-slate-200">{manningResults?.ShearStress}</td>
                                                <td className="px-5 py-2.5 text-slate-400">N/m²</td>
                                                <td className="px-5 py-2.5"><span className="text-[9px] px-2 py-0.5 bg-amber-100/50 text-amber-700 rounded font-black uppercase tracking-tighter">Erosion Risk</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-2.5 font-bold text-slate-600">Daya Hantar</td>
                                                <td className="px-5 py-2.5 text-slate-400">K</td>
                                                <td className="px-5 py-2.5 text-right font-black text-slate-800 dark:text-slate-200">{manningResults?.Conveyance}</td>
                                                <td className="px-5 py-2.5 text-slate-400">m³/s</td>
                                                <td className="px-5 py-2.5"><span className="text-[9px] px-2 py-0.5 bg-emerald-100/50 text-emerald-700 rounded font-black uppercase tracking-tighter">Capacity</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Analytic/Chart Column */}
                        <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
                            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 min-h-[300px]">
                                <RatingCurveChart inputs={inputs} currentQ={Number(manningResults?.Discharge || 0)} />
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-5 flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-pupr-yellow" />
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Status Evaluasi Saluran</h4>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Q Design (SSOT)</span>
                                        <span className="text-xs font-black text-white tabular-nums">{qDesign ? `${qDesign.toFixed(3)} m³/s` : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Q Kapasitas (Actual)</span>
                                        <span className="text-xs font-black text-emerald-400 tabular-nums">{manningResults?.Discharge} m³/s</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-800">
                                        <div className={cn(
                                            "flex items-center gap-2 text-[10px] font-black uppercase tracking-tight",
                                            qDesign && Number(manningResults?.Discharge) >= qDesign ? "text-emerald-500" : "text-rose-500"
                                        )}>
                                            <ArrowDownRight className="w-3 h-3 rotate-180" />
                                            {qDesign && Number(manningResults?.Discharge) >= qDesign ? "Kapasitas Mencukupi" : "Kapasitas Tidak Cukup"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <SNIFooter standard="SNI 03-3424-1994" title="Perencanaan Drainase Permukaan Jalan" />
                </div>
            </div>
        </div>
    );
};
