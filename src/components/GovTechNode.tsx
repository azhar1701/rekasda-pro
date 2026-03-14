import { Handle, Position, NodeProps, Node } from '@xyflow/react';

// Tipe data yang diharapkan dalam custom node
export type GovTechNodeData = Node<{
 label: string;
 status?: string;
 moduleId?: string;
 phase?: 'input' | 'pre' | 'engine' | 'module' | 'output';
}, 'govtech'>;

export function GovTechNode({ data, isConnectable }: NodeProps<GovTechNodeData>) {
 const phaseConfig: Record<string, { bg: string; label: string }> = {
 input: { bg: 'bg-sky-600', label: '📥 INPUT' },
 pre: { bg: 'bg-amber-600', label: '🔍 PRE-PROSES' },
 engine: { bg: 'bg-red-600', label: '⚙️ ENGINE' },
 module: { bg: 'bg-purple-600', label: '📦 MODUL' },
 output: { bg: 'bg-green-600', label: '📊 OUTPUT' },
 };
 const config = phaseConfig[data.phase || ''] || { bg: 'bg-pupr-blue', label: '🟦 PROSES' };

 return (
 <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-sm w-64 overflow-hidden transition-all hover: hover:border-pupr-blue cursor-pointer">
 
 {/* Target Handle (Koneksi Atas) */}
 <Handle 
 type="target" 
 position={Position.Top} 
 isConnectable={isConnectable} 
 className="w-3 h-3 bg-pupr-yellow border-2 border-white"
 />

 {/* Header GovTech (PUPR Blue & Yellow Border) */}
 <div className={`text-white text-xs font-bold p-2 border-b-2 border-pupr-yellow ${config.bg} text-center`}>
 {config.label}
 </div>

 {/* Body Area */}
 <div className="p-3 flex flex-col gap-2">
 <div className="font-semibold text-sm text-pupr-text leading-tight text-center">
 {data.label}
 </div>
 
 {/* Status Indicator */}
 {data.status && (
 <div className="mt-1 flex items-center justify-center gap-1.5">
 <span className={`w-2 h-2 rounded-sm ${
 data.status === 'Selesai' ? 'bg-success' : 
 data.status === 'Menunggu Data' ? 'bg-warning' : 
 'bg-slate-400'
 }`}></span>
 <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
 {data.status}
 </span>
 </div>
 )}
 </div>

 {/* Source Handle (Koneksi Bawah) */}
 <Handle 
 type="source" 
 position={Position.Bottom} 
 isConnectable={isConnectable} 
 className="w-3 h-3 bg-pupr-yellow border-2 border-white"
 />
 </div>
 );
}
