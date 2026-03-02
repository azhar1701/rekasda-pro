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


const nodeTypes = {
  govtech: GovTechNode,
};

const initialNodes: GovTechNodeData[] = [
  { id: '1', type: 'govtech', position: { x: 150, y: 50 }, data: { label: 'Karakteristik Fisik DAS', status: 'Selesai', moduleId: 'morfometri' } },
  { id: '2', type: 'govtech', position: { x: 450, y: 50 }, data: { label: 'Data Presipitasi', status: 'Selesai', moduleId: 'presipitasi' } },
  { id: '3', type: 'govtech', position: { x: 300, y: 200 }, data: { label: 'Hujan Kawasan', status: 'Selesai', moduleId: 'thiessen' } },
  { id: '4', type: 'govtech', position: { x: 300, y: 350 }, data: { label: 'Neraca Air & Kehilangan', status: 'Dalam Proses', moduleId: 'neraca' } },
  { id: '5', type: 'govtech', position: { x: 300, y: 500 }, data: { label: 'Transformasi Hidrograf Banjir', status: 'Menunggu Data', moduleId: 'banjir' } },
  { id: '6', type: 'govtech', position: { x: 300, y: 650 }, data: { label: 'Pemodelan Hidraulika Saluran', status: 'Menunggu Data', moduleId: 'hidraulika', isHydraulics: true } },
  { id: '7', type: 'govtech', position: { x: 650, y: 350 }, data: { label: 'Validasi Hidrometri (Rating Curve)', status: 'Dalam Proses', moduleId: 'validasi', isValidation: true } },
];

const initialEdges: Edge[] = [
  { id: 'e1-3', source: '1', target: '3', type: 'smoothstep', style: { strokeWidth: 2, stroke: '#94a3b8' } },
  { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', style: { strokeWidth: 2, stroke: '#94a3b8' } },
  { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', style: { strokeWidth: 2, stroke: '#94a3b8' } },
  { id: 'e7-4', source: '7', target: '4', type: 'smoothstep', animated: true, label: 'Kalibrasi Parameter', style: { strokeWidth: 2, stroke: '#10B981' }, labelStyle: { fill: '#10B981', fontWeight: 600, fontSize: 12 }, labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 }, labelBgPadding: [4, 4], labelBgBorderRadius: 4 },
  { id: 'e4-5', source: '4', target: '5', type: 'smoothstep', style: { strokeWidth: 2, stroke: '#94a3b8' } },
  { id: 'e5-6', source: '5', target: '6', type: 'smoothstep', style: { strokeWidth: 2, stroke: '#94a3b8' } },
];

export function WorkflowCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const setActiveModule = useWorkflowStore((state) => state.setActiveModule);

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
          <MiniMap nodeColor={(n) => { const data = (n as GovTechNodeData).data; if (data?.isValidation) return '#10B981'; if (data?.isHydraulics) return '#1e293b'; return '#0c3a66'; }} maskColor="rgba(248, 250, 252, 0.7)" className="bg-white border rounded-md shadow-md" />
        </ReactFlow>
        <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-md shadow-sm border-l-4 border-pupr-blue pointer-events-none">
          <h2 className="text-lg font-bold text-pupr-blue">Alur Analisis SDA Terpadu</h2>
          <p className="text-sm text-slate-500">Pemetaan topologi hidrologi & hidraulika GovTech PUPR.</p>
        </div>
      </div>
    </>
  );
}
