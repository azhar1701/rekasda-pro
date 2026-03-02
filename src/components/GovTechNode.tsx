import { Handle, Position, NodeProps, Node } from '@xyflow/react';

// Tipe data yang diharapkan dalam custom node
export type GovTechNodeData = Node<{
  label: string;
  status?: string;
  moduleId?: string;
  isHydraulics?: boolean; // Menandai jika ini node "Pemodelan Hidraulika"
  isValidation?: boolean; // Menandai jika ini node "Validasi"
}, 'govtech'>;

export function GovTechNode({ data, isConnectable }: NodeProps<GovTechNodeData>) {
  // Warna Header GovTech Logic
  const headerBgColor = data.isHydraulics 
    ? 'bg-slate-800' // Biru lebih gelap sesuai instruksi FASE 2
    : data.isValidation
    ? 'bg-success-dark' // Aksen warna hijau sesuai instruksi FASE 2
    : 'bg-pupr-blue'; // Default Biru institusi PUPR

  return (
    <div className="bg-white border-2 border-slate-300 rounded-md shadow-sm w-64 overflow-hidden transition-all hover:shadow-md hover:border-pupr-blue cursor-pointer">
      
      {/* Target Handle (Koneksi Atas) */}
      <Handle 
        type="target" 
        position={Position.Top} 
        isConnectable={isConnectable} 
        className="w-3 h-3 bg-pupr-yellow border-2 border-white"
      />

      {/* Header GovTech (PUPR Blue & Yellow Border) */}
      <div className={`text-white text-xs font-bold p-2 border-b-2 border-pupr-yellow ${headerBgColor} text-center`}>
        {data.isValidation ? '🔴 VALIDASI' : data.isHydraulics ? '🟦 PEMODELAN' : '🟦 PROSES'}
      </div>

      {/* Body Area */}
      <div className="p-3 flex flex-col gap-2">
        <div className="font-semibold text-sm text-pupr-text leading-tight text-center">
          {data.label}
        </div>
        
        {/* Status Indicator */}
        {data.status && (
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
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
