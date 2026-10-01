import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { ChannelVisualizer } from './ChannelVisualizer';
import { SlopeCalculator } from './SlopeCalculator';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';
import { StatCard } from '@/components/ui/StatCard';
import { toast } from '@/hooks/useToast';
import { saveManningCalculation } from '@/services/calculationService';
import { CalculationType } from '@/types/types';
import {
  Waves,
  Sparkles,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sliders,
  ShieldCheck,
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  calculateChannelHydraulics,
  solveOptimalDimensions,
  SNI_CHANNEL_MATERIALS,
  type ChannelShapeType,
  type ChannelHydraulicResult
} from '@/lib/engine/channelEngine';

interface Props {
  onSave?: (type: any, inputs: any, outputs: any) => void;
  onConsultAI?: (inputs: any, outputs: any) => void;
}

export const ManningCalculator: React.FC<Props> = ({ onSave, onConsultAI }) => {
  // Use atomic selectors to prevent unnecessary re-renders
  const identitasLokasi = useHydrologyStore(s => s.identitasLokasi);
  const setHasilSaluran = useHydrologyStore(s => s.setHasilSaluran);
  const qDesign = useHydrologyStore(s => s.hasilBanjir?.debitPuncak ?? null);

  // Active Tab: 'geometry' | 'hydraulics' | 'energy'
  const [activeTab, setActiveTab] = useState<'geometry' | 'hydraulics' | 'energy'>('geometry');

  // Input States
  const [shape, setShape] = useState<ChannelShapeType>('trapezoid');
  const [channelName, setChannelName] = useState<string>('Saluran Utama Primer');
  const [width, setWidth] = useState<number>(2.0); // b (m)
  const [depth, setDepth] = useState<number>(1.0); // h (m)
  const [totalDepth, setTotalDepth] = useState<number>(1.8); // H (m)
  const [sideSlope, setSideSlope] = useState<number>(1.0); // m (1:m)
  const [diameter, setDiameter] = useState<number>(1.2); // D (m)
  const [slope, setSlope] = useState<number>(0.001); // S (m/m)
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('concrete_smooth');
  const [roughness, setRoughness] = useState<number>(0.013);

  // Auto-Dimensioning Drawer / Box state
  const [showAutoSolver, setShowAutoSolver] = useState<boolean>(false);
  const [targetQInput, setTargetQInput] = useState<string>(qDesign ? qDesign.toFixed(2) : '5.0');
  const [showSlopeCalculator, setShowSlopeCalculator] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync material roughness
  const handleMaterialChange = (matId: string) => {
    setSelectedMaterialId(matId);
    const found = SNI_CHANNEL_MATERIALS.find(m => m.id === matId);
    if (found) {
      setRoughness(found.n);
    }
  };

  // Perform Hydraulics Calculation (memoized to keep stable object reference)
  const results: ChannelHydraulicResult = useMemo(() => {
    return calculateChannelHydraulics({
      shape,
      width,
      depth,
      totalDepth,
      sideSlope,
      diameter,
      slope,
      roughness,
      materialId: selectedMaterialId
    });
  }, [shape, width, depth, totalDepth, sideSlope, diameter, slope, roughness, selectedMaterialId]);

  // Track last synced state to prevent circular updates
  const lastSyncedRef = useRef<string>('');

  // Sync to Global Hydrology Store whenever results change
  useEffect(() => {
    const signature = `${shape}_${channelName}_${width}_${depth}_${totalDepth}_${sideSlope}_${diameter}_${slope}_${roughness}_${selectedMaterialId}_${qDesign ?? ''}_${results.discharge.toFixed(4)}`;
    if (lastSyncedRef.current === signature) return;
    lastSyncedRef.current = signature;

    setHasilSaluran({
      shape,
      channelName,
      dischargeCapacity: results.discharge,
      designDischarge: qDesign ?? undefined,
      velocity: results.velocity,
      froudeNumber: results.froudeNumber,
      flowRegime: results.flowRegime,
      isSafe: qDesign ? results.discharge >= qDesign : results.isFreeboardSafe,
      isVelocitySafe: results.isVelocitySafe,
      velocityStatus: results.velocityStatus,
      freeboardActual: results.freeboardActual,
      freeboardRecommended: results.freeboardRecommended,
      isFreeboardSafe: results.isFreeboardSafe,
      dimensions: {
        width: shape !== 'circular' && shape !== 'triangular' ? width : undefined,
        depth,
        totalDepth,
        sideSlope: shape === 'trapezoid' || shape === 'triangular' ? sideSlope : undefined,
        diameter: shape === 'circular' ? diameter : undefined,
        topWidth: results.topWidth
      },
      materialName: SNI_CHANNEL_MATERIALS.find(m => m.id === selectedMaterialId)?.name ?? 'Beton',
      n: roughness,
      slope
    });
  }, [
    shape,
    channelName,
    width,
    depth,
    totalDepth,
    sideSlope,
    diameter,
    slope,
    roughness,
    selectedMaterialId,
    qDesign,
    results,
    setHasilSaluran
  ]);

  // Solver Dimensi Otomatis
  const handleApplyOptimalDimensions = () => {
    const targetQ = parseFloat(targetQInput) || (qDesign ?? 5.0);
    const opt = solveOptimalDimensions({
      shape,
      targetDischarge: targetQ,
      slope,
      roughness,
      sideSlope,
      materialId: selectedMaterialId
    });

    if (shape === 'circular' && opt.diameter) {
      setDiameter(opt.diameter);
      setDepth(opt.depth);
      setTotalDepth(opt.diameter);
    } else {
      if (opt.width > 0) setWidth(opt.width);
      setDepth(opt.depth);
      setTotalDepth(opt.totalDepth);
      if (shape === 'trapezoid' || shape === 'triangular') {
        setSideSlope(opt.sideSlope);
      }
    }

    toast.success(`Dimensi optimal berhasil diterapkan! Kapasitas: ${opt.capacity} m³/s`);
  };

  // Save to Database
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      const inputsData = {
        site: {
          channelName,
          regency: identitasLokasi?.kabupaten || '',
          district: '',
          village: ''
        },
        shape: shape as any,
        roughness,
        slope,
        width,
        topWidth: results.topWidth,
        diameter,
        depth,
        totalDepth,
        sideSlope
      };

      const outputsData = {
        Discharge: results.discharge.toFixed(3),
        Velocity: results.velocity.toFixed(3),
        Radius: results.hydraulicRadius.toFixed(3),
        TopWidth: results.topWidth.toFixed(3),
        SpecificEnergy: results.specificEnergy.toFixed(3),
        ShearStress: results.shearStress.toFixed(2),
        Froude: results.froudeNumber.toFixed(2),
        FlowType: results.flowRegime,
        Freeboard: results.freeboardActual.toFixed(2),
        SafetyStatus: qDesign ? (results.discharge >= qDesign ? 'Aman' : 'Meluap') : (results.isFreeboardSafe ? 'Aman' : 'Peringatan')
      };

      const { error } = await saveManningCalculation({
        projectName: identitasLokasi?.namaPekerjaan || channelName || 'Perencanaan Saluran Drainase',
        inputs: inputsData,
        results: outputsData
      });

      if (onSave) {
        onSave(CalculationType.MANNING, inputsData, outputsData);
      }

      if (error) {
        toast.error(`Gagal menyimpan: ${error.message}`);
      } else {
        toast.success('Hasil perhitungan saluran berhasil disimpan ke database!');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModuleLayout
      title="Analisis Kapasitas Saluran Terbuka"
      description="Perhitungan hidraulika penampang saluran, evaluasi kecepatan izin SNI 03-3424-1994, dan solver penampang hidrolis terbaik"
      icon={<Waves className="w-6 h-6" />}
      iconColorClass="bg-blue-50 text-pupr-blue"
      actions={
        <div className="flex items-center gap-2">
          {qDesign && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTargetQInput(qDesign.toFixed(2));
                toast.success(`Debit banjir rencana ${qDesign.toFixed(3)} m³/s disinkronkan ke target desain!`);
              }}
              className="h-8 text-xs border-teal-300 text-teal-700 bg-teal-50 hover:bg-teal-100"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Sync Banjir ({qDesign.toFixed(2)} m³/s)
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className="h-8 text-xs bg-pupr-blue hover:bg-teal-700 text-white font-semibold"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </Button>

          {onConsultAI && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onConsultAI({
                site: {
                  channelName,
                  regency: identitasLokasi?.kabupaten || '',
                  projectName: identitasLokasi?.namaPekerjaan || ''
                },
                shape,
                width,
                depth,
                totalDepth,
                slope,
                roughness,
                channelName
              }, results)}
              className="h-8 text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600" />
              Konsultasi AI
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'geometry', title: 'Geometri & Desain Penampang', icon: <Layers className="w-4 h-4" />, desc: 'Input Dimensi & Solver Otomatis' },
            { id: 'hydraulics', title: 'Karakteristik & Kepatuhan SNI', icon: <ShieldCheck className="w-4 h-4" />, desc: 'Kecepatan Izin, Froude & Jagaan' },
            { id: 'energy', title: 'Loncat Air & Energi Aliran', icon: <Zap className="w-4 h-4" />, desc: 'Analisis Aliran Superkritis' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <Card
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`p-3.5 border-2 transition-all cursor-pointer hover:border-pupr-blue/50 ${
                  isActive ? 'border-pupr-blue bg-blue-50/30' : 'border-transparent bg-white shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-pupr-blue text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {tab.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-xs font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-600'}`}>
                      {tab.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">{tab.desc}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* TAB 1: GEOMETRI & SOLVER DIMENSI */}
        {activeTab === 'geometry' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
            {/* Left Column: Form Parameters */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Shape Selector */}
              <Card className="border-slate-200">
                <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="text-xs font-bold text-slate-700">Pilih Bentuk Penampang Saluran</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'trapezoid', label: 'Trapesium' },
                      { id: 'rectangular', label: 'Persegi' },
                      { id: 'triangular', label: 'Segitiga' },
                      { id: 'circular', label: 'Pipa Lingkar' },
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setShape(s.id as ChannelShapeType)}
                        className={`py-2 px-2 text-[11px] font-bold rounded border transition-colors ${
                          shape === s.id
                            ? 'bg-pupr-blue text-white border-pupr-blue shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Auto-Dimensioning Box */}
              <Card className="border-teal-200 bg-teal-50/40">
                <CardHeader className="py-2.5 px-4 border-b border-teal-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-1.5 text-teal-800">
                    <Sliders className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">Solver Dimensi Otomatis (Penampang Terbaik)</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAutoSolver(!showAutoSolver)}
                    className="h-6 text-[10px] text-teal-700 hover:bg-teal-100 p-1"
                  >
                    {showAutoSolver ? 'Tutup' : 'Buka'}
                  </Button>
                </CardHeader>
                {showAutoSolver && (
                  <CardContent className="p-3 space-y-3">
                    <p className="text-[11px] text-teal-800 leading-relaxed">
                      Sistem menghitung rasio dimensi optimal ($R = h/2$) yang meminimalkan luas basah dan biaya konstruksi untuk target debit tertentu:
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-teal-800 uppercase block mb-1">Target Debit (Q, m³/s)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={targetQInput}
                          onChange={(e) => setTargetQInput(e.target.value)}
                          className="h-8 text-xs font-bold bg-white border-teal-300"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleApplyOptimalDimensions}
                        className="mt-5 h-8 text-xs bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                      >
                        Terapkan Dimensi
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Geometry Dimensions Card */}
              <Card className="border-slate-200">
                <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="text-xs font-bold text-slate-700">Dimensi Geometri Saluran</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Saluran</label>
                    <Input
                      type="text"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      className="h-8 text-xs"
                      placeholder="Contoh: Saluran Primer Kiri"
                    />
                  </div>

                  {shape !== 'circular' && shape !== 'triangular' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Lebar Dasar (b, m)</label>
                        <Input
                          type="number"
                          step="0.05"
                          value={width}
                          onChange={(e) => setWidth(parseFloat(e.target.value) || 0.1)}
                          className="h-8 text-xs font-bold"
                        />
                      </div>
                      {shape === 'trapezoid' && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kemiringan Tebing (1:m)</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={sideSlope}
                            onChange={(e) => setSideSlope(parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs font-bold"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {shape === 'triangular' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kemiringan Tebing (1:m)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={sideSlope}
                        onChange={(e) => setSideSlope(parseFloat(e.target.value) || 0.1)}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  )}

                  {shape === 'circular' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Diameter Pipa (D, m)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={diameter}
                        onChange={(e) => setDiameter(parseFloat(e.target.value) || 0.2)}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-pupr-blue uppercase block mb-1">Tinggi Muka Air (h, m)</label>
                      <Input
                        type="number"
                        step="0.05"
                        value={depth}
                        onChange={(e) => setDepth(parseFloat(e.target.value) || 0.05)}
                        className="h-8 text-xs font-bold text-pupr-blue border-blue-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {shape === 'circular' ? 'Tinggi Fisik Pipa (m)' : 'Tinggi Total Saluran (H, m)'}
                      </label>
                      <Input
                        type="number"
                        step="0.05"
                        value={shape === 'circular' ? diameter : totalDepth}
                        disabled={shape === 'circular'}
                        onChange={(e) => setTotalDepth(parseFloat(e.target.value) || 0.1)}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Slope and Material */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Kemiringan (S, m/m)</label>
                        <button
                          type="button"
                          onClick={() => setShowSlopeCalculator(!showSlopeCalculator)}
                          className="text-[10px] text-pupr-blue hover:underline"
                        >
                          Kalkulator
                        </button>
                      </div>
                      <Input
                        type="number"
                        step="0.0001"
                        value={slope}
                        onChange={(e) => setSlope(parseFloat(e.target.value) || 0.0001)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kekasaran Manning (n)</label>
                      <Input
                        type="number"
                        step="0.001"
                        value={roughness}
                        onChange={(e) => setRoughness(parseFloat(e.target.value) || 0.01)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Material Preset Selector */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Preset Material Saluran (SNI)</label>
                    <select
                      value={selectedMaterialId}
                      onChange={(e) => handleMaterialChange(e.target.value)}
                      className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2 text-slate-700"
                    >
                      {SNI_CHANNEL_MATERIALS.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} (n = {m.n}, Vmax = {m.maxVelocity} m/s)
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Slope Calculator Popup */}
              {showSlopeCalculator && (
                <SlopeCalculator
                  onSlopeCalculated={(calcS) => {
                    setSlope(parseFloat(calcS.toFixed(5)));
                    setShowSlopeCalculator(false);
                    toast.success(`Kemiringan ${calcS.toFixed(5)} diterapkan!`);
                  }}
                  onClose={() => setShowSlopeCalculator(false)}
                />
              )}
            </div>

            {/* Right Column: Interactive Visualizer & Quick Stats */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <Card className="border-slate-200">
                <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-pupr-blue" />
                    <CardTitle className="text-xs font-bold text-slate-800">Visualisasi Potongan Melintang Saluran</CardTitle>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Skala Proporsional Otomatis</span>
                </CardHeader>
                <CardContent className="p-4">
                  <ChannelVisualizer
                    inputs={{
                      shape,
                      width,
                      depth,
                      totalDepth,
                      sideSlope,
                      diameter,
                      slope,
                      roughness,
                      materialId: selectedMaterialId
                    }}
                    results={results}
                    qDesign={qDesign}
                  />
                </CardContent>
              </Card>

              {/* Quick Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Debit Kapasitas (Q)"
                  value={results.discharge.toFixed(3)}
                  unit="m³/s"
                  valueColorClass="text-pupr-blue"
                  className="bg-blue-50/40 border-blue-100"
                />
                <StatCard
                  label="Kecepatan Aliran (V)"
                  value={results.velocity.toFixed(2)}
                  unit="m/s"
                  valueColorClass="text-slate-800"
                />
                <StatCard
                  label="Angka Froude (Fr)"
                  value={results.froudeNumber.toFixed(2)}
                  unit={results.flowRegime}
                  valueColorClass={results.froudeNumber > 1 ? "text-amber-700" : "text-emerald-700"}
                  className={results.froudeNumber > 1 ? "bg-amber-50/30 border-amber-100" : "bg-emerald-50/30 border-emerald-100"}
                />
                <StatCard
                  label="Tinggi Jagaan"
                  value={results.freeboardActual.toFixed(2)}
                  unit={`Saran: ≥ ${results.freeboardRecommended.toFixed(2)}m`}
                  valueColorClass={results.isFreeboardSafe ? "text-emerald-700" : "text-rose-600"}
                  className={results.isFreeboardSafe ? "bg-emerald-50/30 border-emerald-100" : "bg-rose-50/30 border-rose-100"}
                />
              </div>

              {/* Formula Accordion */}
              <FormulaAccordion
                title="Persamaan Hidraulika Manning (SNI 03-3424-1994)"
                subtitle="Dasar Perhitungan Kapasitas Saluran Terbuka"
                theme="blue"
                formulas={[
                  { label: "Rumus Utama Manning", math: "V = \\frac{1}{n} \\cdot R^{2/3} \\cdot S^{1/2}" },
                  { label: "Debit Aliran", math: "Q = A \\cdot V" },
                  { label: "Jari-jari Hidrolis", math: "R = \\frac{A}{P}" },
                  { label: "Bilangan Froude", math: "Fr = \\frac{V}{\\sqrt{g \\cdot D_h}}" }
                ]}
                parameters={[
                  { symbol: "Q", description: "Debit aliran saluran", unit: "m³/s" },
                  { symbol: "V", description: "Kecepatan aliran rata-rata", unit: "m/s" },
                  { symbol: "n", description: "Koefisien kekasaran Manning", unit: "-" },
                  { symbol: "A", description: "Luas penampang basah", unit: "m²" },
                  { symbol: "R", description: "Jari-jari hidrolis (A/P)", unit: "m" },
                  { symbol: "S", description: "Kemiringan dasar saluran memanjang", unit: "m/m" },
                  { symbol: "Fr", description: "Angka Froude (Fr < 1: Subkritis, Fr > 1: Superkritis)", unit: "-" }
                ]}
                reference="SNI 03-3424-1994 & Chow (1959)"
              />
            </div>
          </div>
        )}

        {/* TAB 2: KARAKTERISTIK HIDRAULIKA & KEPATUHAN SNI */}
        {activeTab === 'hydraulics' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Status Banners */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Kapasitas vs Debit Banjir */}
              <div className={`p-4 rounded-lg border flex items-start gap-3 ${
                qDesign
                  ? results.discharge >= qDesign
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                {qDesign ? (
                  results.discharge >= qDesign ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )
                ) : (
                  <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <h4 className="font-bold">
                    {qDesign
                      ? results.discharge >= qDesign
                        ? 'Kapasitas Tampang Aman'
                        : 'Peringatan: Saluran Kurang Kapasitas'
                      : 'Kapasitas Saluran Mandiri'}
                  </h4>
                  <p className="mt-1 leading-relaxed opacity-90">
                    {qDesign ? (
                      <>
                        Kapasitas saluran (<strong>{results.discharge.toFixed(3)} m³/s</strong>) {results.discharge >= qDesign ? 'mencukupi' : 'lebih kecil dari'} debit banjir rencana Q<sub>design</sub> = <strong>{qDesign.toFixed(3)} m³/s</strong>.
                      </>
                    ) : (
                      'Belum ada debit banjir rencana di Modul Banjir. Silakan lakukan kalkulasi HSS di menu Banjir untuk sinkronisasi otomatis.'
                    )}
                  </p>
                </div>
              </div>

              {/* 2. Kecepatan Izin SNI */}
              <div className={`p-4 rounded-lg border flex items-start gap-3 ${
                results.isVelocitySafe
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                {results.isVelocitySafe ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <h4 className="font-bold">Batas Kecepatan Izin SNI: {results.velocityStatus}</h4>
                  <p className="mt-1 leading-relaxed opacity-90">
                    Kecepatan aliran <strong>{results.velocity.toFixed(2)} m/s</strong>. Batas minimum mencegah endapan: <strong>{results.minVelocity} m/s</strong>. Batas maksimum material: <strong>{results.maxVelocity} m/s</strong>.
                  </p>
                </div>
              </div>

              {/* 3. Tinggi Jagaan Freeboard */}
              <div className={`p-4 rounded-lg border flex items-start gap-3 ${
                results.isFreeboardSafe
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {results.isFreeboardSafe ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <h4 className="font-bold">
                    {results.isFreeboardSafe ? 'Tinggi Jagaan Memenuhi SNI' : 'Tinggi Jagaan Kurang / Meluap'}
                  </h4>
                  <p className="mt-1 leading-relaxed opacity-90">
                    Tinggi jagaan aktual: <strong>{results.freeboardActual.toFixed(2)} m</strong>. Rekomendasi standar Pd. T-02-2006-B (√0.5h): <strong>≥ {results.freeboardRecommended.toFixed(2)} m</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Hydraulic Data Table */}
            <Card className="border-slate-200">
              <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-xs font-bold text-slate-800">
                  Rincian Parameter Hidraulika Lengkap (SNI 8066:2015 & Pd. T-02-2006-B)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Parameter Hidraulika</th>
                      <th className="px-3 py-2.5">Simbol</th>
                      <th className="px-3 py-2.5 text-right">Nilai Dihitung</th>
                      <th className="px-3 py-2.5">Satuan</th>
                      <th className="px-4 py-2.5">Keterangan / Acuan Standar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="px-4 py-2 font-medium">Debit Aliran Kapasitas</td>
                      <td className="px-3 py-2 font-mono">Q</td>
                      <td className="px-3 py-2 text-right font-bold text-pupr-blue">{results.discharge.toFixed(4)}</td>
                      <td className="px-3 py-2">m³/s</td>
                      <td className="px-4 py-2 text-slate-400">Dihitung dari Persamaan Manning (A · V)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Kecepatan Aliran Rata-rata</td>
                      <td className="px-3 py-2 font-mono">V</td>
                      <td className="px-3 py-2 text-right font-bold">{results.velocity.toFixed(3)}</td>
                      <td className="px-3 py-2">m/s</td>
                      <td className="px-4 py-2 text-slate-400">V = (1/n) · R^(2/3) · S^(1/2)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Luas Penampang Basah</td>
                      <td className="px-3 py-2 font-mono">A</td>
                      <td className="px-3 py-2 text-right font-bold">{results.area.toFixed(3)}</td>
                      <td className="px-3 py-2">m²</td>
                      <td className="px-4 py-2 text-slate-400">Luas penampang basah terisi air</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Keliling Basah</td>
                      <td className="px-3 py-2 font-mono">P</td>
                      <td className="px-3 py-2 text-right font-bold">{results.wettedPerimeter.toFixed(3)}</td>
                      <td className="px-3 py-2">m</td>
                      <td className="px-4 py-2 text-slate-400">Panjang kontak air dengan dinding saluran</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Jari-Jari Hidrolis</td>
                      <td className="px-3 py-2 font-mono">R</td>
                      <td className="px-3 py-2 text-right font-bold">{results.hydraulicRadius.toFixed(3)}</td>
                      <td className="px-3 py-2">m</td>
                      <td className="px-4 py-2 text-slate-400">R = A / P</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Lebar Permukaan Air</td>
                      <td className="px-3 py-2 font-mono">T</td>
                      <td className="px-3 py-2 text-right font-bold">{results.topWidth.toFixed(3)}</td>
                      <td className="px-3 py-2">m</td>
                      <td className="px-4 py-2 text-slate-400">Lebar muka air di permukaan</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Kedalaman Hidrolis</td>
                      <td className="px-3 py-2 font-mono">Dh</td>
                      <td className="px-3 py-2 text-right font-bold">{results.hydraulicDepth.toFixed(3)}</td>
                      <td className="px-3 py-2">m</td>
                      <td className="px-4 py-2 text-slate-400">Dh = A / T</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Angka Froude</td>
                      <td className="px-3 py-2 font-mono">Fr</td>
                      <td className="px-3 py-2 text-right font-bold text-amber-700">{results.froudeNumber.toFixed(3)}</td>
                      <td className="px-3 py-2">-</td>
                      <td className="px-4 py-2 font-semibold text-slate-600">{results.flowRegime}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Kedalaman Kritis</td>
                      <td className="px-3 py-2 font-mono">yc</td>
                      <td className="px-3 py-2 text-right font-bold">{results.criticalDepth.toFixed(3)}</td>
                      <td className="px-3 py-2">m</td>
                      <td className="px-4 py-2 text-slate-400">Kedalaman saat Fr = 1.0 (Q²T / gA³ = 1)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Kecepatan Kritis</td>
                      <td className="px-3 py-2 font-mono">Vc</td>
                      <td className="px-3 py-2 text-right font-bold">{results.criticalVelocity.toFixed(3)}</td>
                      <td className="px-3 py-2">m/s</td>
                      <td className="px-4 py-2 text-slate-400">Vc = Q / Ac</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Kemiringan Kritis</td>
                      <td className="px-3 py-2 font-mono">Sc</td>
                      <td className="px-3 py-2 text-right font-bold font-mono">{results.criticalSlope.toFixed(5)}</td>
                      <td className="px-3 py-2">m/m</td>
                      <td className="px-4 py-2 text-slate-400">Kemiringan saat kedalaman normal = kritis</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Tinggi Kecepatan</td>
                      <td className="px-3 py-2 font-mono">hv</td>
                      <td className="px-3 py-2 text-right font-bold">{results.velocityHead.toFixed(3)}</td>
                      <td className="px-3 py-2">m</td>
                      <td className="px-4 py-2 text-slate-400">V² / (2 · g)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Energi Spesifik Total</td>
                      <td className="px-3 py-2 font-mono">E</td>
                      <td className="px-3 py-2 text-right font-bold text-purple-700">{results.specificEnergy.toFixed(3)}</td>
                      <td className="px-3 py-2">m</td>
                      <td className="px-4 py-2 text-slate-400">E = h + V² / (2g)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Tegangan Geser Dasar</td>
                      <td className="px-3 py-2 font-mono">τ</td>
                      <td className="px-3 py-2 text-right font-bold">{results.shearStress.toFixed(2)}</td>
                      <td className="px-3 py-2">N/m²</td>
                      <td className="px-4 py-2 text-slate-400">τ = γ · R · S (Gaya geser per satuan luas dasar)</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: LONCAT AIR & ENERGI ALIRAN */}
        {activeTab === 'energy' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {results.hydraulicJump?.hasJump ? (
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-lg border bg-amber-50/70 border-amber-200 text-amber-900 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <h4 className="font-bold text-sm">Aliran Superkritis Terdeteksi (Fr = {results.froudeNumber.toFixed(2)} &gt; 1.0)</h4>
                    <p className="mt-1 leading-relaxed">
                      Aliran berkecepatan tinggi berpotensi mengalami **Loncat Air (Hydraulic Jump)** saat bertransisi ke hilir yang lebih landai atau saat bertemu struktur penghambat. Diperlukan peredam energi atau kolam olak (*stilling basin*) untuk melindungi saluran dari bahaya gerusan lokal.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <StatCard
                    label="Kedalaman Awal (y1)"
                    value={results.hydraulicJump.initialDepth.toFixed(3)}
                    unit="m"
                    valueColorClass="text-slate-800"
                  />
                  <StatCard
                    label="Kedalaman Konjugasi (y2)"
                    value={results.hydraulicJump.sequentDepth.toFixed(3)}
                    unit="m (Hilir)"
                    valueColorClass="text-pupr-blue"
                    className="bg-blue-50/40 border-blue-100"
                  />
                  <StatCard
                    label="Kehilangan Energi (ΔE)"
                    value={results.hydraulicJump.energyLoss.toFixed(3)}
                    unit="m"
                    valueColorClass="text-rose-600"
                    className="bg-rose-50/30 border-rose-100"
                  />
                  <StatCard
                    label="Panjang Loncatan (Lj)"
                    value={results.hydraulicJump.jumpLength.toFixed(2)}
                    unit="m (USBR)"
                    valueColorClass="text-purple-700"
                    className="bg-purple-50/30 border-purple-100"
                  />
                </div>

                <Card className="border-slate-200">
                  <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-xs font-bold text-slate-800">
                      Karakteristik Loncatan Hidraulik (Metode Belanger & USBR)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">KLASIFIKASI LONCATAN (USBR)</span>
                        <strong className="text-slate-800 text-sm">{results.hydraulicJump.jumpType}</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">EFISIENSI LONCATAN (E2 / E1)</span>
                        <strong className="text-emerald-700 text-sm">{(results.hydraulicJump.efficiency * 100).toFixed(1)}%</strong>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pt-2">
                      *Catatan Desain: Panjang lantai peredam energi minimal disarankan sepanjang <strong>{results.hydraulicJump.jumpLength.toFixed(2)} meter</strong> dengan pasangan batu kali atau beton bertulang tahan abrasi untuk meredam energi aliran sebesar <strong>{results.hydraulicJump.energyLoss.toFixed(2)} meter</strong> head air.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center gap-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-800">Aliran Subkritis Tenang (Fr = {results.froudeNumber.toFixed(2)} &lt; 1.0)</h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Aliran berada pada rezim subkritis yang stabil dan aman tanpa potensi loncat air (*hydraulic jump*). Energi spesifik aliran berada pada tingkat normal.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ModuleLayout>
  );
};

export default ManningCalculator;
