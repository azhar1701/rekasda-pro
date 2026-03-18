import React, { useCallback, useMemo } from 'react';
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
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';
import { WorkflowAuditPanel } from './components/WorkflowAuditPanel';
import { GovTechNode, GovTechNodeData } from '../../components/GovTechNode';
import { useWorkflowStore } from '../../stores/useWorkflowStore';
import { useHydrologyStore } from '../../stores/useHydrologyStore';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Network, CheckCircle2, Layers, ShieldCheck, Activity } from 'lucide-react';

const nodeTypes = {
  govtech: GovTechNode,
};

// Base Node Definition (Optimized Routing Layout)
const baseNodes: GovTechNodeData[] = [
  // -- ROW 1: INPUT (y=0) --
  { id: 'I2', type: 'govtech', position: { x: 0, y: 0 }, data: { label: 'Data Hujan (Manual/Excel/OCR)', phase: 'input', moduleId: 'hujan' } },
  { id: 'I3', type: 'govtech', position: { x: 300, y: 0 }, data: { label: 'Karakteristik & Spasial DAS', phase: 'input', moduleId: 'spasial' } },
  { id: 'I4', type: 'govtech', position: { x: 600, y: 0 }, data: { label: 'Tutupan Lahan (Parameter C)', phase: 'input', moduleId: 'tutupan' } },
  { id: 'I1', type: 'govtech', position: { x: 900, y: 0 }, data: { label: 'Identitas Proyek & Lokasi (Form)', phase: 'input', moduleId: 'identitas', tooltip: 'Langkah 1: Tentukan nama pekerjaan dan lokasi ordinat proyek.' } },

  // -- ROW 2: PRE-PROCESSING (y=180) --
  { id: 'P1', type: 'govtech', position: { x: 0, y: 180 }, data: { label: 'Quality Control', phase: 'pre', moduleId: 'qc' } },
  { id: 'P3', type: 'govtech', position: { x: 300, y: 180 }, data: { label: 'Infilling Data (CHIRPS)', phase: 'pre', moduleId: 'satelit' } },

  // -- ROW 3: AGGREGATION (y=360) --
  { id: 'P2', type: 'govtech', position: { x: 150, y: 360 }, data: { label: 'Curah Hujan Wilayah (Thiessen)', phase: 'pre', moduleId: 'thiessen', tooltip: 'Menghitung hujan rata-rata kawasan menggunakan bobot stasiun (Poligon Thiessen/Aljabar).' } },

  // -- ROW 4: ENGINE (y=540) --
  { id: 'E1', type: 'govtech', position: { x: 150, y: 540 }, data: { label: 'Analisis Frekuensi', phase: 'engine', moduleId: 'frekuensi', tooltip: 'Distribusi probabilitas (Gumbel, Log Pearson, dsb) untuk menentukan hujan rencana berbagai kala ulang.' } },

  // -- ROW 5: ENGINE (y=720) --
  { id: 'E2', type: 'govtech', position: { x: 300, y: 720 }, data: { label: 'Areal Reduction Factor', phase: 'engine', moduleId: 'arf' } },

  // -- ROW 6: ENGINE (y=900) --
  { id: 'E3', type: 'govtech', position: { x: 450, y: 900 }, data: { label: 'Distribusi Jam-jaman & Hujan Efektif', phase: 'engine', moduleId: 'distribusi' } },

  // -- ROW 7: MODULES (y=1080) --
  { id: 'M1', type: 'govtech', position: { x: 150, y: 1080 }, data: { label: 'Banjir Rencana (HSS)', phase: 'module', moduleId: 'banjir' } },
  { id: 'M2', type: 'govtech', position: { x: 600, y: 1080 }, data: { label: 'Neraca Air (FJ Mock)', phase: 'module', moduleId: 'neraca' } },

  // -- ROW 8: MODULES 2 (y=1260) --
  { id: 'M4', type: 'govtech', position: { x: 0, y: 1260 }, data: { label: 'Kapasitas Saluran (Manning)', phase: 'module', moduleId: 'saluran' } },
  { id: 'M3', type: 'govtech', position: { x: 450, y: 1260 }, data: { label: 'Perencanaan Embung', phase: 'module', moduleId: 'embung' } },

  // -- ROW 9: OUTPUT (y=1440) --
  { id: 'O2', type: 'govtech', position: { x: 0, y: 1440 }, data: { label: 'AI Konsultan (Gemini)', phase: 'output', moduleId: 'ai' } },
  { id: 'O1', type: 'govtech', position: { x: 300, y: 1440 }, data: { label: 'Dashboard Eksekutif', phase: 'output', moduleId: 'dashboard', tooltip: 'Ringkasan kelayakan proyek, neraca air, dan reduksi banjir untuk keperluan pelaporan.' } },
  { id: 'O3', type: 'govtech', position: { x: 600, y: 1440 }, data: { label: 'Ekspor Laporan (PDF/Excel)', phase: 'output', moduleId: 'ekspor' } },
];

const edgeStyle = { strokeWidth: 2, stroke: '#94a3b8' };
const labelProps = { labelStyle: { fill: '#64748b', fontWeight: 600, fontSize: 10 }, labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 }, labelBgPadding: [4, 4] as [number, number], labelBgBorderRadius: 4 };

const initialEdges: Edge[] = [
  // Input → Pre-Processing
  { id: 'e-I2-P1', source: 'I2', target: 'P1', type: 'smoothstep', style: edgeStyle, label: 'Data Hujan', ...labelProps },
  { id: 'e-P1-P2', source: 'P1', target: 'P2', type: 'smoothstep', style: edgeStyle, label: 'Data Valid', ...labelProps },
  { id: 'e-I3-P2', source: 'I3', target: 'P2', type: 'smoothstep', style: edgeStyle, label: 'Luas DAS', ...labelProps },
  { id: 'e-I2-P3', source: 'I2', target: 'P3', type: 'smoothstep', style: edgeStyle },
  { id: 'e-P3-P2', source: 'P3', target: 'P2', type: 'smoothstep', style: edgeStyle, animated: true, label: 'Data Lengkap', ...labelProps },

  // Pre-Processing → Engine
  { id: 'e-P2-E1', source: 'P2', target: 'E1', type: 'smoothstep', style: edgeStyle, label: 'Hujan Tahunan', ...labelProps },
  { id: 'e-E1-E2', source: 'E1', target: 'E2', type: 'smoothstep', style: edgeStyle, label: 'Hujan Rencana', ...labelProps },
  { id: 'e-I3-E2', source: 'I3', target: 'E2', type: 'smoothstep', style: edgeStyle },
  { id: 'e-E2-E3', source: 'E2', target: 'E3', type: 'smoothstep', style: edgeStyle, label: 'Hujan Terkoreksi', ...labelProps },
  { id: 'e-I4-E3', source: 'I4', target: 'E3', type: 'smoothstep', style: edgeStyle, label: 'Koef Limpasan', ...labelProps },

  // Engine → Modules
  { id: 'e-E3-M1', source: 'E3', target: 'M1', type: 'smoothstep', style: edgeStyle, label: 'Hujan Efektif', ...labelProps },
  { id: 'e-I3-M1', source: 'I3', target: 'M1', type: 'smoothstep', style: edgeStyle },
  { id: 'e-P2-M2', source: 'P2', target: 'M2', type: 'smoothstep', style: edgeStyle, label: 'Hujan Bulanan', ...labelProps },
  { id: 'e-I4-M2', source: 'I4', target: 'M2', type: 'smoothstep', style: edgeStyle },
  { id: 'e-M1-M3', source: 'M1', target: 'M3', type: 'smoothstep', style: edgeStyle, label: 'Debit Puncak', ...labelProps },
  { id: 'e-M2-M3', source: 'M2', target: 'M3', type: 'smoothstep', style: edgeStyle, label: 'Debit Andalan', ...labelProps },
  { id: 'e-M1-M4', source: 'M1', target: 'M4', type: 'smoothstep', style: edgeStyle },

  // Modules → Output
  { id: 'e-I1-O1', source: 'I1', target: 'O1', type: 'smoothstep', style: edgeStyle },
  { id: 'e-M1-O1', source: 'M1', target: 'O1', type: 'smoothstep', style: edgeStyle },
  { id: 'e-M2-O1', source: 'M2', target: 'O1', type: 'smoothstep', style: edgeStyle },
  { id: 'e-M3-O1', source: 'M3', target: 'O1', type: 'smoothstep', style: edgeStyle },
  { id: 'e-O1-O3', source: 'O1', target: 'O3', type: 'smoothstep', style: edgeStyle },
  { id: 'e-E1-O2', source: 'E1', target: 'O2', type: 'smoothstep', style: edgeStyle },
  { id: 'e-M1-O2', source: 'M1', target: 'O2', type: 'smoothstep', style: edgeStyle },
  { id: 'e-M2-O2', source: 'M2', target: 'O2', type: 'smoothstep', style: edgeStyle },
];

export function WorkflowCanvas() {
  const setActiveModule = useWorkflowStore((state) => state.setActiveModule);
  const hydroState = useHydrologyStore();

  // Compute dynamic node statuses based on store values
  const computeStatus = (moduleId: string): string => {
    switch (moduleId) {
      // Inputs
      case 'identitas': return hydroState.identitasLokasi?.namaPekerjaan ? 'Selesai' : 'Opsional';
      case 'hujan': return (hydroState.dataHujan?.length > 0 || (hydroState.curahHujanWilayah?.stasiunConfigs?.length || 0) > 0) ? 'Selesai' : 'Siap Diisi';
      case 'spasial': return (hydroState.morfometriDAS?.luasDAS > 0 && hydroState.morfometriDAS?.panjangSungai > 0) ? 'Selesai' : 'Menunggu Data';
      case 'tutupan': return (hydroState.tutupanLahan?.items?.length > 0 || hydroState.tutupanLahan?.koefisienPengaliranGabungan > 0) ? 'Selesai' : 'Menunggu Data';

      // Pre-Processing
      case 'qc': return (hydroState.qcResults || hydroState.isQCOverridden) ? 'Selesai' : (hydroState.dataHujan?.length > 0 ? 'Siap Diuji' : 'Menunggu Data');
      case 'thiessen': return (hydroState.hasilThiessen || hydroState.curahHujanWilayah?.hujanRataRata > 0) ? 'Selesai' : (hydroState.stasiunList?.length > 0 ? 'Siap Dihitung' : 'Menunggu Data');
      case 'satelit': return 'Tersedia (Opsional)';

      // Engine
      case 'frekuensi': return hydroState.hasilAnalisisFrekuensi ? 'Selesai' : (hydroState.curahHujanWilayah?.hujanRataRata > 0 ? 'Siap Dihitung' : 'Menunggu Data');
      case 'arf': return hydroState.hasilARF ? 'Selesai' : (hydroState.hasilAnalisisFrekuensi && hydroState.morfometriDAS?.luasDAS > 0 ? 'Siap Dihitung' : 'Menunggu Data');
      case 'distribusi': return (hydroState.distribusiHujanJamJaman?.length > 0 && hydroState.hujanEfektif?.length > 0) ? 'Selesai' : (hydroState.hasilARF && hydroState.tutupanLahan?.koefisienPengaliranGabungan > 0 ? 'Siap Dihitung' : 'Menunggu Data');

      // Modules
      case 'banjir': return hydroState.hasilBanjir ? 'Selesai' : (hydroState.hujanEfektif?.length > 0 && hydroState.morfometriDAS?.luasDAS > 0 ? 'Siap Disimulasi' : 'Menunggu Data');
      case 'neraca': return hydroState.hasilMock ? 'Selesai' : (hydroState.curahHujanWilayah?.hujanRataRata > 0 ? 'Siap Disimulasi' : 'Menunggu Data');
      case 'embung': return hydroState.hasilEmbung ? 'Selesai' : (hydroState.hasilBanjir ? 'Siap Didesain' : 'Menunggu Data');
      case 'saluran': return 'Siap Diuji';

      // Outputs
      case 'dashboard': return (hydroState.hasilBanjir || hydroState.hasilMock) ? 'Tersedia' : 'Menunggu Data';
      case 'ai': return 'Tersedia';
      case 'ekspor': return (hydroState.hasilBanjir || hydroState.hasilMock) ? 'Tersedia' : 'Menunggu Data';

      default: return 'Siap Diisi';
    }
  };

  // Map the computed status into the nodes
  const initialNodesWithStatus = baseNodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      status: computeStatus(node.data.moduleId || '')
    }
  }));

  const [nodes, , onNodesChange] = useNodesState(initialNodesWithStatus);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds)), [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const data = (node as GovTechNodeData).data;
    if (data.moduleId) setActiveModule(data.moduleId);
  }, [setActiveModule]);

  // KPI Metrics
  const kpiMetrics = useMemo(() => {
    const allStatuses = baseNodes.map(n => computeStatus(n.data.moduleId || ''));
    const completed = allStatuses.filter(s => s === 'Selesai' || s === 'Tersedia').length;
    const total = baseNodes.length;
    const complianceScore = Math.round((completed / total) * 100);

    // Phase counts
    const phases = { input: 0, pre: 0, engine: 0, module: 0, output: 0 };
    baseNodes.forEach(n => {
      if (n.data.phase) phases[n.data.phase]++;
    });

    return { completed, total, complianceScore, phases };
  }, [hydroState]);

  return (
    <ModuleLayout
      title="Alur Analisis Hidrologi Terpadu v1.1"
      description="Pemetaan data-flow: Input → Pre-Processing → Engine → Modul → Output"
      icon={<Network className="w-6 h-6" />}
      sniCode="SNI 2415:2016"
    >
      <div className="space-y-0">
        <ProjectContextBanner />

        {/* KPI Strip — Dashboard Style */}
        <header className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-x divide-slate-100 dark:divide-slate-800">
          <div className="p-5 space-y-1">
            <p className="text-3xl font-light text-slate-900 dark:text-slate-100 tracking-tighter tabular-nums">
              {kpiMetrics.total}
              <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase">node</span>
            </p>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-slate-400" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Modul</p>
            </div>
          </div>
          <div className="p-5 space-y-1">
            <p className="text-3xl font-light text-emerald-600 tracking-tighter tabular-nums">
              {kpiMetrics.completed}
              <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase">/ {kpiMetrics.total}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modul Selesai</p>
            </div>
          </div>
          <div className="p-5 space-y-1">
            <p className={`text-3xl font-light tracking-tighter tabular-nums ${kpiMetrics.complianceScore >= 60 ? 'text-pupr-blue' : kpiMetrics.complianceScore >= 30 ? 'text-amber-500' : 'text-rose-500'}`}>
              {kpiMetrics.complianceScore}
              <span className="text-xs font-bold text-slate-400 ml-0.5 uppercase">%</span>
            </p>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-pupr-blue" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Compliance</p>
            </div>
          </div>
          <div className="p-5 space-y-1">
            <p className="text-3xl font-light text-slate-900 dark:text-slate-100 tracking-tighter tabular-nums">
              {Object.keys(kpiMetrics.phases).length}
              <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase">fase</span>
            </p>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-slate-400" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pipeline</p>
            </div>
          </div>
        </header>

        {/* Workstation Split-Pane */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-0 border-x border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Main Canvas Area */}
          <div className="lg:col-span-8 h-[72vh] min-h-[600px] relative bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
            <ReactFlow 
              nodes={nodes} 
              edges={edges} 
              onNodesChange={onNodesChange} 
              onEdgesChange={onEdgesChange} 
              onConnect={onConnect} 
              onNodeClick={onNodeClick} 
              nodeTypes={nodeTypes as any} 
              fitView 
              fitViewOptions={{ padding: 0.3, minZoom: 0.3, maxZoom: 1.2 }}
              minZoom={0.2}
              maxZoom={1.5}
              className="bg-[#f8fafc] dark:bg-slate-950"
            >
              <Background variant={BackgroundVariant.Lines} gap={40} size={1} color="#e2e8f0" />
              <Controls 
                showInteractive={false} 
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 rounded-none shadow-none [&>button]:rounded-none [&>button]:border-slate-200 dark:[&>button]:border-slate-700 [&>button]:shadow-none" 
              />
              <MiniMap 
                nodeColor={(n) => {
                  const data = (n as GovTechNodeData).data;
                  const phaseColors: Record<string, string> = {
                    input: '#0284c7', pre: '#d97706', engine: '#dc2626',
                    module: '#7c3aed', output: '#16a34a',
                  };
                  return phaseColors[data?.phase || ''] || '#0c3a66';
                }} 
                maskColor="rgba(248, 250, 252, 0.7)" 
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-none shadow-none" 
                style={{ border: '1px solid #e2e8f0' }}
              />
            </ReactFlow>
          </div>

          {/* Audit Sidebar */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 overflow-y-auto h-[72vh] min-h-[600px]">
            <WorkflowAuditPanel />
          </div>
        </div>

        {/* Phase Legend — Dedicated Strip */}
        <div className="flex items-center justify-center gap-6 bg-white dark:bg-slate-900 border-x border-b border-slate-200 dark:border-slate-800 px-4 py-2.5">
          {[
            { label: 'Input', color: 'bg-sky-600' },
            { label: 'Pre-Proses', color: 'bg-amber-600' },
            { label: 'Engine', color: 'bg-red-600' },
            { label: 'Modul', color: 'bg-purple-600' },
            { label: 'Output', color: 'bg-green-600' },
          ].map(phase => (
            <div key={phase.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 ${phase.color}`} />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{phase.label}</span>
            </div>
          ))}
        </div>
      </div>
    </ModuleLayout>
  );
}