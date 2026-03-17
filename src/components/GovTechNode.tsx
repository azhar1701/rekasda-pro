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
  const phaseConfig: Record<string, { bg: string; label: string }> = {
    input: { bg: 'bg-sky-600', label: '📥 INPUT' },
    pre: { bg: 'bg-amber-600', label: '🔍 PRE-PROSES' },
    engine: { bg: 'bg-red-600', label: '⚙️ ENGINE' },
    module: { bg: 'bg-purple-600', label: '📦 MODUL' },
    output: { bg: 'bg-green-600', label: '📊 OUTPUT' },
  };
  const config = phaseConfig[data.phase || ''] || { bg: 'bg-pupr-blue', label: '🟦 PROSES' };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none w-64 overflow-hidden transition-all hover:border-pupr-blue cursor-pointer shadow-none">
    
    {/* Target Handle (Koneksi Atas) */}
    <Handle 
      type="target" 
      position={Position.Top} 
      isConnectable={isConnectable} 
      className="!w-2 !h-2 !bg-[#f2c114] !border-none !rounded-none"
    />

    {/* Header GovTech (High Density) */}
    <div className={`text-white text-[10px] font-black p-2 border-b border-[#f2c114] ${config.bg} text-center tracking-[0.1em]`}>
      {config.label}
    </div>

    {/* Body Area */}
    <div className="p-4 flex flex-col gap-3">
      <div className="font-bold text-xs text-slate-700 dark:text-slate-200 leading-snug text-center flex items-center justify-center gap-1.5">
        {data.label}
        {data.tooltip && <HelpTooltip content={data.tooltip} />}
      </div>
      
      {/* Status Indicator - High Density */}
      {data.status && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
          <div className={`w-1.5 h-1.5 rounded-none ${
            data.status === 'Selesai' ? 'bg-emerald-500' : 
            data.status === 'Menunggu Data' ? 'bg-amber-500' : 
            'bg-slate-300'
          }`}></div>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
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
      className="!w-2 !h-2 !bg-[#f2c114] !border-none !rounded-none"
    />
    </div>
  );
}
