import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  ListOrdered,
  Filter,
  ArrowUpRight,
  Info,
  GitMerge,
} from 'lucide-react';

import { GovTechNode, GovTechNodeData } from '../../components/GovTechNode';
import { useWorkflowStore, WorkflowPhaseFilter } from '../../stores/useWorkflowStore';
import { useHydrologyStore } from '../../stores/useHydrologyStore';
import {
  computeWorkflowStatus,
  ModuleId,
  WorkflowPhase,
} from './utils/workflowStatusEngine';

const nodeTypes = {
  govtech: GovTechNode,
};

// Base Node Definition (Structured Grid)
const baseNodesData: Array<{
  id: string;
  moduleId: ModuleId;
  label: string;
  phase: WorkflowPhase;
  position: { x: number; y: number };
}> = [
  // ── PHASE 1: INPUT (y=0) ──
  { id: 'I1', moduleId: 'identitas', label: 'Identitas Proyek & Lokasi (Form)', phase: 'input', position: { x: 0, y: 0 } },
  { id: 'I2', moduleId: 'hujan', label: 'Data Hujan Multi-Sumber (Excel/OCR)', phase: 'input', position: { x: 320, y: 0 } },
  { id: 'I3', moduleId: 'spasial', label: 'Karakteristik & Spasial DAS', phase: 'input', position: { x: 640, y: 0 } },
  { id: 'I4', moduleId: 'tutupan', label: 'Tutupan Lahan (Parameter C / CN)', phase: 'input', position: { x: 960, y: 0 } },

  // ── PHASE 2: PRE-PROCESSING (y=230) ──
  { id: 'P1', moduleId: 'qc', label: 'Quality Control (QC Data Hujan)', phase: 'pre', position: { x: 160, y: 230 } },
  { id: 'P2', moduleId: 'thiessen', label: 'Curah Hujan Wilayah (Thiessen)', phase: 'pre', position: { x: 480, y: 230 } },
  { id: 'P3', moduleId: 'satelit', label: 'Infilling Data (CHIRPS Satelit)', phase: 'pre', position: { x: 800, y: 230 } },

  // ── PHASE 3: ANALYSIS ENGINE (y=460) ──
  { id: 'E1', moduleId: 'frekuensi', label: 'Analisis Frekuensi Curah Hujan', phase: 'engine', position: { x: 160, y: 460 } },
  { id: 'E2', moduleId: 'arf', label: 'Areal Reduction Factor (ARF)', phase: 'engine', position: { x: 480, y: 460 } },
  { id: 'E3', moduleId: 'distribusi', label: 'Distribusi Jam-jaman & Hujan Efektif', phase: 'engine', position: { x: 800, y: 460 } },

  // ── PHASE 4: APPLICATION MODULES (y=690) ──
  { id: 'M1', moduleId: 'banjir', label: 'Banjir Rencana (HSS Terintegrasi)', phase: 'module', position: { x: 0, y: 690 } },
  { id: 'M2', moduleId: 'neraca', label: 'Neraca Air (FJ Mock)', phase: 'module', position: { x: 320, y: 690 } },
  { id: 'M3', moduleId: 'embung', label: 'Perencanaan Embung & Retensi', phase: 'module', position: { x: 640, y: 690 } },
  { id: 'M4', moduleId: 'saluran', label: 'Kapasitas Saluran (Manning)', phase: 'module', position: { x: 960, y: 690 } },

  // ── PHASE 5: OUTPUT (y=920) ──
  { id: 'O1', moduleId: 'dashboard', label: 'Dashboard Eksekutif', phase: 'output', position: { x: 160, y: 920 } },
  { id: 'O2', moduleId: 'ai', label: 'Konsultan AI Hidrologi (Gemini)', phase: 'output', position: { x: 480, y: 920 } },
  { id: 'O3', moduleId: 'ekspor', label: 'Ekspor Dokumen Laporan (PDF/XLS)', phase: 'output', position: { x: 800, y: 920 } },
];

const labelProps = {
  labelStyle: { fill: '#475569', fontWeight: 600, fontSize: 10 },
  labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
  labelBgPadding: [4, 4] as [number, number],
  labelBgBorderRadius: 4,
};

const rawEdges: Array<{
  id: string;
  source: string;
  target: string;
  label?: string;
  sourceModuleId: ModuleId;
}> = [
  // Input → Pre-Processing
  { id: 'e-I2-P1', source: 'I2', target: 'P1', label: 'Data Deret Waktu', sourceModuleId: 'hujan' },
  { id: 'e-P1-P2', source: 'P1', target: 'P2', label: 'Data Valid/Override', sourceModuleId: 'qc' },
  { id: 'e-I3-P2', source: 'I3', target: 'P2', label: 'Luas DAS', sourceModuleId: 'spasial' },
  { id: 'e-I2-P3', source: 'I2', target: 'P3', sourceModuleId: 'hujan' },
  { id: 'e-P3-P2', source: 'P3', target: 'P2', label: 'Infilled Series', sourceModuleId: 'satelit' },

  // Pre-Processing → Engine
  { id: 'e-P2-E1', source: 'P2', target: 'E1', label: 'Hujan Maksimum CHw', sourceModuleId: 'thiessen' },
  { id: 'e-E1-E2', source: 'E1', target: 'E2', label: 'Hujan Rencana R24', sourceModuleId: 'frekuensi' },
  { id: 'e-I3-E2', source: 'I3', target: 'E2', label: 'Luas DAS A', sourceModuleId: 'spasial' },
  { id: 'e-E2-E3', source: 'E2', target: 'E3', label: 'Hujan Terkoreksi', sourceModuleId: 'arf' },
  { id: 'e-I4-E3', source: 'I4', target: 'E3', label: 'Koefisien C', sourceModuleId: 'tutupan' },

  // Engine → Modules
  { id: 'e-E3-M1', source: 'E3', target: 'M1', label: 'Hujan Efektif', sourceModuleId: 'distribusi' },
  { id: 'e-I3-M1', source: 'I3', target: 'M1', label: 'Morfometri (A,L)', sourceModuleId: 'spasial' },
  { id: 'e-P2-M2', source: 'P2', target: 'M2', label: 'Hujan Bulanan', sourceModuleId: 'thiessen' },
  { id: 'e-I4-M2', source: 'I4', target: 'M2', sourceModuleId: 'tutupan' },
  { id: 'e-M1-M3', source: 'M1', target: 'M3', label: 'Debit Banjir Qp', sourceModuleId: 'banjir' },
  { id: 'e-M2-M3', source: 'M2', target: 'M3', label: 'Debit Andalan Q80', sourceModuleId: 'neraca' },
  { id: 'e-M1-M4', source: 'M1', target: 'M4', label: 'Debit Desain Q', sourceModuleId: 'banjir' },

  // Modules → Output
  { id: 'e-I1-O1', source: 'I1', target: 'O1', sourceModuleId: 'identitas' },
  { id: 'e-M1-O1', source: 'M1', target: 'O1', sourceModuleId: 'banjir' },
  { id: 'e-M2-O1', source: 'M2', target: 'O1', sourceModuleId: 'neraca' },
  { id: 'e-M3-O1', source: 'M3', target: 'O1', sourceModuleId: 'embung' },
  { id: 'e-M4-O1', source: 'M4', target: 'O1', sourceModuleId: 'saluran' },
  { id: 'e-O1-O3', source: 'O1', target: 'O3', sourceModuleId: 'dashboard' },
  { id: 'e-E1-O2', source: 'E1', target: 'O2', sourceModuleId: 'frekuensi' },
  { id: 'e-M1-O2', source: 'M1', target: 'O2', sourceModuleId: 'banjir' },
  { id: 'e-M2-O2', source: 'M2', target: 'O2', sourceModuleId: 'neraca' },
];

export function WorkflowCanvas() {
  const {
    activeModule,
    setActiveModule,
    viewMode,
    setViewMode,
    selectedPhaseFilter,
    setSelectedPhaseFilter,
  } = useWorkflowStore();

  const hydroState = useHydrologyStore();

  // Compute live workflow statuses
  const workflowData = useMemo(() => computeWorkflowStatus(hydroState), [hydroState]);
  const { modules, summary } = workflowData;

  const navigateToTab = useCallback((targetTab: string) => {
    window.dispatchEvent(new CustomEvent('navigateToTab', { detail: targetTab }));
  }, []);

  // Construct initial nodes
  const initialNodes: GovTechNodeData[] = useMemo(() => {
    return baseNodesData.map((node) => {
      const info = modules[node.moduleId];
      return {
        id: node.id,
        type: 'govtech',
        position: node.position,
        selected: activeModule === node.moduleId,
        data: {
          label: info?.label || node.label,
          status: info?.status || 'Siap Diisi',
          statusType: info?.statusType || 'ready',
          moduleId: node.moduleId,
          phase: node.phase,
          metricSummary: info?.metricSummary || '',
          targetTab: info?.targetTab || '',
          isRecommendedNext: summary.nextRecommended?.id === node.moduleId,
          onNavigate: navigateToTab,
          onOpenDetails: (id: string) => setActiveModule(id),
        },
      };
    });
  }, [modules, summary.nextRecommended, navigateToTab, setActiveModule, activeModule]);

  // Construct edges with dynamic status flow
  const computedEdges: Edge[] = useMemo(() => {
    return rawEdges.map((edge) => {
      const sourceInfo = modules[edge.sourceModuleId];
      const isSourceComplete =
        sourceInfo?.status === 'Selesai' || sourceInfo?.status === 'Tersedia';

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: isSourceComplete,
        style: {
          stroke: isSourceComplete ? '#0c3a66' : '#94a3b8',
          strokeWidth: isSourceComplete ? 2.5 : 1.5,
        },
        label: edge.label,
        ...labelProps,
      };
    });
  }, [modules]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges);

  // Synchronize nodes state whenever hydroState, summary, or activeModule changes
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((n) => {
        const info = modules[n.data.moduleId as ModuleId];
        if (!info) return n;
        return {
          ...n,
          selected: activeModule === info.id,
          data: {
            ...n.data,
            label: info.label,
            status: info.status,
            statusType: info.statusType,
            metricSummary: info.metricSummary,
            targetTab: info.targetTab,
            isRecommendedNext: summary.nextRecommended?.id === info.id,
            onNavigate: navigateToTab,
            onOpenDetails: (id: string) => setActiveModule(id),
          },
        };
      })
    );
  }, [modules, summary.nextRecommended, navigateToTab, setActiveModule, setNodes, activeModule]);

  // Synchronize edges whenever computedEdges changes
  useEffect(() => {
    setEdges(computedEdges);
  }, [computedEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = (node as GovTechNodeData).data;
      if (data.moduleId) setActiveModule(data.moduleId);
    },
    [setActiveModule]
  );

  // Filter modules for checklist view
  const filteredChecklistModules = useMemo(() => {
    if (selectedPhaseFilter === 'all') return workflowData.moduleList;
    return workflowData.moduleList.filter((m) => m.phase === selectedPhaseFilter);
  }, [workflowData.moduleList, selectedPhaseFilter]);

  const phaseTabs: Array<{ id: WorkflowPhaseFilter; label: string; count: number }> = [
    { id: 'all', label: 'Semua Tahap', count: workflowData.moduleList.length },
    { id: 'input', label: 'Input Dasar', count: 4 },
    { id: 'pre', label: 'Pre-Proses', count: 3 },
    { id: 'engine', label: 'Mesin Analisis', count: 3 },
    { id: 'module', label: 'Modul Desain', count: 4 },
    { id: 'output', label: 'Output & Laporan', count: 3 },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* ── Top Executive Progress Bar & Controller ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Project Title & Progress */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-pupr-blue/10 text-pupr-blue">
                <GitMerge className="w-5 h-5 stroke-[2.5]" />
              </span>
              <div>
                <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">
                  Alur Analisis Hidrologi Terpadu
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Pipeline Ketergantungan Data SNI 2415:2016 & Standar Perencanaan SDA
                </p>
              </div>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'canvas'
                    ? 'bg-white text-pupr-blue shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Diagram Alir</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('checklist')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'checklist'
                    ? 'bg-white text-pupr-blue shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Mode Panduan (Checklist)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Metrics & Next Step Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2 border-t border-slate-100">
          {/* Progress Bar & KPIs */}
          <div className="md:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-700">Kemajuan Analisis Proyek:</span>
                <span className="font-bold text-pupr-blue text-sm">{summary.percentage}% Selesai</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <strong>{summary.completedModules}</strong> Selesai
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <strong>{summary.readyModules}</strong> Siap
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <strong>{summary.pendingModules}</strong> Menunggu
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex border border-slate-200">
              <div
                className="bg-emerald-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${(summary.completedModules / summary.totalModules) * 100}%` }}
                title={`${summary.completedModules} Modul Selesai`}
              />
              <div
                className="bg-blue-400 h-full transition-all duration-500 ease-out"
                style={{ width: `${(summary.readyModules / summary.totalModules) * 100}%` }}
                title={`${summary.readyModules} Modul Siap Dihitung`}
              />
            </div>
          </div>

          {/* Next Recommended Step Card */}
          <div className="md:col-span-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="p-2 rounded-lg bg-amber-400 text-slate-900 shrink-0">
                <Sparkles className="w-4 h-4 fill-current" />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                  Rekomendasi Langkah Berikutnya
                </div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {summary.nextRecommended?.label || 'Dashboard Eksekutif'}
                </div>
              </div>
            </div>

            {summary.nextRecommended && (
              <button
                type="button"
                onClick={() => navigateToTab(summary.nextRecommended!.targetTab)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 transition-all shadow-sm active:scale-95"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Phase Filter Tabs (Applicable to both view modes) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-hide">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Fase:
          </span>
          {phaseTabs.map((tab) => {
            const isActive = selectedPhaseFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedPhaseFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-pupr-blue text-white border-pupr-blue shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main View Area ── */}
      <div className="flex-1 w-full min-h-[700px] relative">
        {viewMode === 'canvas' ? (
          <div className="w-full h-full min-h-[700px] bg-slate-50 relative border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              className="bg-pupr-surface"
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#cbd5e1" />
              <Controls
                showInteractive={false}
                className="bg-white shadow-md border rounded-xl overflow-hidden"
              />
              <MiniMap
                nodeColor={(n) => {
                  const data = (n as GovTechNodeData).data;
                  const phaseColors: Record<string, string> = {
                    input: '#0284c7',
                    pre: '#d97706',
                    engine: '#dc2626',
                    module: '#7c3aed',
                    output: '#16a34a',
                  };
                  return phaseColors[data?.phase || ''] || '#0c3a66';
                }}
                maskColor="rgba(248, 250, 252, 0.7)"
                className="bg-white border rounded-xl shadow-md"
              />
            </ReactFlow>

            {/* Quick Canvas Legend Floating Box */}
            <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm p-3.5 rounded-xl shadow-md border border-slate-200 pointer-events-none max-w-sm hidden sm:block">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-pupr-blue" />
                <h2 className="text-xs font-extrabold text-slate-800">
                  Data Pipeline & State Flow
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Garis berwarna biru & bergerak mengindikasikan data dependensi telah siap dialirkan ke
                modul downstream. Klik kartu untuk melihat detail I/O.
              </p>
            </div>
          </div>
        ) : (
          /* ── Guided Checklist View Mode (Linier Step-by-Step) ── */
          <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">
                  Daftar Panduan Bertahap (Step-by-Step Checklist)
                </h2>
                <p className="text-xs text-slate-500">
                  Ikuti langkah secara berurutan sesuai kaidah hidrologi SNI untuk hasil desain optimal.
                </p>
              </div>
              <div className="text-xs font-bold text-slate-600">
                Menampilkan {filteredChecklistModules.length} Modul
              </div>
            </div>

            <div className="space-y-3">
              {filteredChecklistModules.map((module) => {
                const isSuccess = module.status === 'Selesai' || module.status === 'Tersedia';
                const isReady = module.statusType === 'ready';
                const isWarning = module.statusType === 'warning';

                return (
                  <div
                    key={module.id}
                    className={`p-4 rounded-xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      summary.nextRecommended?.id === module.id
                        ? 'border-amber-400 bg-amber-50/40 shadow-md ring-2 ring-amber-300/30'
                        : isSuccess
                        ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 hover:shadow-xs'
                        : isReady
                        ? 'border-blue-200 bg-blue-50/20 hover:border-blue-300 hover:shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          Tahap {module.order}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 uppercase px-2 py-0.5 rounded bg-slate-100">
                          {module.phaseLabel}
                        </span>
                        {summary.nextRecommended?.id === module.id && (
                          <span className="text-[10px] font-extrabold text-slate-900 bg-amber-400 px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                            <Sparkles className="w-2.5 h-2.5 fill-current" />
                            Langkah Berikut
                          </span>
                        )}
                        {/* Status Badge */}
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {module.status}
                          </span>
                        ) : isReady ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            {module.status}
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            {module.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {module.status}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-sm text-slate-800">
                        {module.label}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {module.description}
                      </p>

                      {/* Current Payload Preview */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 inline-block">
                        <strong>Payload:</strong> {module.metricSummary}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveModule(module.id)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-pupr-blue hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Detail I/O</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToTab(module.targetTab)}
                        className="px-4 py-2 rounded-xl bg-pupr-blue hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-1.5 active:scale-95"
                      >
                        <span>Buka Modul</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
