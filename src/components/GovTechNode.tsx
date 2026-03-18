import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { HelpTooltip } from '@/components/ui/govtech';

// Tipe data yang diharapkan dalam custom node
export type GovTechNodeData = Node<{
  label: string;
  status?: string;
  moduleId?: string;
  phase?: 'input' | 'pre' | 'engine' | 'module' | 'output';
  tooltip?: string;
}, 'govtech'>;

export function GovTechNode({ data, isConnectable }: NodeProps<GovTechNodeData>) {
  const phaseConfig: Record<string, { bg: string; border: string; label: string }> = {
    input: { bg: 'bg-sky-600', border: 'border-sky-500', label: '📥 INPUT' },
    pre: { bg: 'bg-amber-600', border: 'border-amber-500', label: '🔍 PRE-PROSES' },
    engine: { bg: 'bg-red-600', border: 'border-red-500', label: '⚙️ ENGINE' },
    module: { bg: 'bg-purple-600', border: 'border-purple-500', label: '📦 MODUL' },
    output: { bg: 'bg-green-600', border: 'border-green-500', label: '📊 OUTPUT' },
  };
  const config = phaseConfig[data.phase || ''] || { bg: 'bg-pupr-blue', border: 'border-pupr-blue', label: '🟦 PROSES' };

  const statusConfig: Record<string, { dot: string; text: string }> = {
    'Selesai': { dot: 'bg-emerald-500', text: 'text-emerald-600' },
    'Tersedia': { dot: 'bg-emerald-500', text: 'text-emerald-600' },
    'Menunggu Data': { dot: 'bg-amber-500', text: 'text-amber-600' },
    'Siap Diisi': { dot: 'bg-sky-500', text: 'text-sky-600' },
    'Siap Diuji': { dot: 'bg-sky-500', text: 'text-sky-600' },
    'Siap Dihitung': { dot: 'bg-sky-500', text: 'text-sky-600' },
    'Siap Disimulasi': { dot: 'bg-sky-500', text: 'text-sky-600' },
    'Siap Didesain': { dot: 'bg-sky-500', text: 'text-sky-600' },
  };
  const statusStyle = statusConfig[data.status || ''] || { dot: 'bg-slate-300', text: 'text-slate-500' };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none w-64 overflow-hidden transition-all duration-75 hover:border-pupr-blue cursor-pointer shadow-none group">
    
    {/* Target Handle */}
    <Handle 
      type="target" 
      position={Position.Top} 
      isConnectable={isConnectable} 
      className="!w-2 !h-2 !bg-[#f2c114] !border-none !rounded-none"
    />

    {/* Phase Header Bar */}
    <div className={`text-white text-[9px] font-black px-3 py-1.5 ${config.bg} flex items-center justify-between tracking-[0.15em]`}>
      <span>{config.label}</span>
      {data.status === 'Selesai' || data.status === 'Tersedia' ? (
        <div className="w-1.5 h-1.5 bg-white/80 rounded-none" />
      ) : null}
    </div>

    {/* Body */}
    <div className="p-3.5 flex flex-col gap-2.5">
      <div className="font-bold text-[11px] text-slate-700 dark:text-slate-200 leading-snug text-center flex items-center justify-center gap-1.5">
        {data.label}
        {data.tooltip && <HelpTooltip content={data.tooltip} />}
      </div>
      
      {/* Status Row */}
      {data.status && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className={`w-1.5 h-1.5 rounded-none ${statusStyle.dot}`} />
          <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${statusStyle.text}`}>
            {data.status}
          </span>
        </div>
      )}
    </div>

    {/* Source Handle */}
    <Handle 
      type="source" 
      position={Position.Bottom} 
      isConnectable={isConnectable} 
      className="!w-2 !h-2 !bg-[#f2c114] !border-none !rounded-none"
    />
    </div>
  );
}
