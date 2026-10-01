import React, { useCallback } from 'react';
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

import { GovTechNode, GovTechNodeData } from '../../components/GovTechNode';
import { useWorkflowStore } from '../../stores/useWorkflowStore';
import { useHydrologyStore } from '../../stores/useHydrologyStore';


const nodeTypes = {
  govtech: GovTechNode,
};

// Base Node Definition (Static Coordinates & Labels)
const baseNodes: GovTechNodeData[] = [
  // ── PHASE 1: INPUT (y=0) ──
  { id: 'I1', type: 'govtech', position: { x: 0, y: 0 }, data: { label: 'Identitas Proyek & Lokasi (Form)', phase: 'input', moduleId: 'identitas' } },
  { id: 'I2', type: 'govtech', position: { x: 280, y: 0 }, data: { label: 'Data Hujan (Manual/Excel/OCR)', phase: 'input', moduleId: 'hujan' } },
  { id: 'I3', type: 'govtech', position: { x: 560, y: 0 }, data: { label: 'Karakteristik & Spasial DAS', phase: 'input', moduleId: 'spasial' } },
  { id: 'I4', type: 'govtech', position: { x: 840, y: 0 }, data: { label: 'Tutupan Lahan (Parameter C)', phase: 'input', moduleId: 'tutupan' } },

  // ── PHASE 2: PRE-PROCESSING (y=200) ──
  { id: 'P1', type: 'govtech', position: { x: 140, y: 200 }, data: { label: 'Quality Control', phase: 'pre', moduleId: 'qc' } },
  { id: 'P2', type: 'govtech', position: { x: 420, y: 200 }, data: { label: 'Curah Hujan Wilayah (Thiessen)', phase: 'pre', moduleId: 'thiessen' } },
  { id: 'P3', type: 'govtech', position: { x: 700, y: 200 }, data: { label: 'Infilling Data (CHIRPS)', phase: 'pre', moduleId: 'satelit' } },

  // ── PHASE 3: ANALYSIS ENGINE (y=400) ──
  { id: 'E1', type: 'govtech', position: { x: 140, y: 400 }, data: { label: 'Analisis Frekuensi', phase: 'engine', moduleId: 'frekuensi' } },
  { id: 'E2', type: 'govtech', position: { x: 420, y: 400 }, data: { label: 'Areal Reduction Factor', phase: 'engine', moduleId: 'arf' } },
  { id: 'E3', type: 'govtech', position: { x: 700, y: 400 }, data: { label: 'Distribusi Jam-jaman & Hujan Efektif', phase: 'engine', moduleId: 'distribusi' } },

  // ── PHASE 4: APPLICATION MODULES (y=600) ──
  { id: 'M1', type: 'govtech', position: { x: 0, y: 600 }, data: { label: 'Banjir Rencana (HSS)', phase: 'module', moduleId: 'banjir' } },
  { id: 'M2', type: 'govtech', position: { x: 280, y: 600 }, data: { label: 'Neraca Air (FJ Mock)', phase: 'module', moduleId: 'neraca' } },
  { id: 'M3', type: 'govtech', position: { x: 560, y: 600 }, data: { label: 'Perencanaan Embung', phase: 'module', moduleId: 'embung' } },
  { id: 'M4', type: 'govtech', position: { x: 840, y: 600 }, data: { label: 'Kapasitas Saluran (Manning)', phase: 'module', moduleId: 'saluran' } },

  // ── PHASE 5: OUTPUT (y=800) ──
  { id: 'O1', type: 'govtech', position: { x: 140, y: 800 }, data: { label: 'Dashboard Eksekutif', phase: 'output', moduleId: 'dashboard' } },
  { id: 'O2', type: 'govtech', position: { x: 420, y: 800 }, data: { label: 'AI Konsultan (Gemini)', phase: 'output', moduleId: 'ai' } },
  { id: 'O3', type: 'govtech', position: { x: 700, y: 800 }, data: { label: 'Ekspor Laporan (PDF/Excel)', phase: 'output', moduleId: 'ekspor' } },
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
      case 'identitas': return hydroState.identitasLokasi?.namaPekerjaan ? 'Selesai' : 'Siap Diisi';
      case 'hujan': return hydroState.dataHujan?.length > 0 ? 'Selesai' : 'Siap Diisi';
      case 'spasial': return hydroState.morfometriDAS ? 'Selesai' : 'Menunggu Data';
      case 'tutupan': return hydroState.tutupanLahan ? 'Selesai' : 'Menunggu Data';

      // Pre-Processing
      case 'qc': return hydroState.qcResults || hydroState.isQCOverridden ? 'Selesai' : (hydroState.dataHujan?.length > 0 ? 'Siap Diuji' : 'Menunggu Data');
      case 'thiessen': return hydroState.hasilThiessen ? 'Selesai' : (hydroState.stasiunList?.length > 0 ? 'Siap Dihitung' : 'Menunggu Data');
      case 'satelit': return 'Menunggu Data'; // Usually optional/manual flow

      // Engine
      case 'frekuensi': return hydroState.hasilAnalisisFrekuensi ? 'Selesai' : (hydroState.hasilThiessen ? 'Siap Dihitung' : 'Menunggu Data');
      case 'arf': return hydroState.hasilARF ? 'Selesai' : (hydroState.hasilAnalisisFrekuensi && hydroState.morfometriDAS ? 'Siap Dihitung' : 'Menunggu Data');
      case 'distribusi': return hydroState.distribusiHujanJamJaman && hydroState.hujanEfektif ? 'Selesai' : (hydroState.hasilARF && hydroState.landCoverParams ? 'Siap Dihitung' : 'Menunggu Data');

      // Modules
      case 'banjir': return hydroState.hasilBanjir ? 'Selesai' : (hydroState.hujanEfektif && hydroState.morfometriDAS ? 'Siap Disimulasi' : 'Menunggu Data');
      case 'neraca': return hydroState.hasilMock ? 'Selesai' : (hydroState.hasilThiessen ? 'Siap Disimulasi' : 'Menunggu Data');
      case 'embung': return hydroState.hasilEmbung ? 'Selesai' : (hydroState.hasilBanjir ? 'Siap Didesain' : 'Menunggu Data');
      case 'saluran': return hydroState.hasilSaluran ? 'Selesai' : (hydroState.hasilBanjir ? 'Siap Didesain' : 'Siap Diisi');

      // Outputs
      case 'dashboard': return hydroState.hasilBanjir || hydroState.hasilMock ? 'Tersedia' : 'Menunggu Data';
      case 'ai': return 'Tersedia';
      case 'ekspor': return hydroState.hasilBanjir || hydroState.hasilMock ? 'Tersedia' : 'Menunggu Data';

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

  return (
    <>
      <div className="w-full h-full bg-slate-50 relative border rounded-xl overflow-hidden shadow-sm">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={onNodeClick} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }} className="bg-pupr-surface">
          <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#cbd5e1" />
          <Controls showInteractive={false} className="bg-white shadow-md border rounded-md overflow-hidden" />
          <MiniMap nodeColor={(n) => {
            const data = (n as GovTechNodeData).data;
            const phaseColors: Record<string, string> = {
              input: '#0284c7', pre: '#d97706', engine: '#dc2626',
              module: '#7c3aed', output: '#16a34a',
            };
            return phaseColors[data?.phase || ''] || '#0c3a66';
          }} maskColor="rgba(248, 250, 252, 0.7)" className="bg-white border rounded-md shadow-md" />
        </ReactFlow>
        <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-md shadow-sm border-l-4 border-pupr-blue pointer-events-none">
          <h2 className="text-lg font-bold text-pupr-blue">Alur Analisis Hidrologi Terpadu v1.1</h2>
          <p className="text-sm text-slate-500">Pemetaan data-flow: Input → Pre-Processing → Engine → Modul → Output</p>
        </div>
      </div>
    </>
  );
}
