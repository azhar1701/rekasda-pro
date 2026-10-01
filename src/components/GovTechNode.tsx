import React from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { CheckCircle2, Clock, AlertCircle, ArrowUpRight, Info, Sparkles } from 'lucide-react';

export type GovTechNodeData = Node<
  {
    label: string;
    status?: string;
    statusType?: 'success' | 'ready' | 'pending' | 'warning';
    moduleId?: string;
    phase?: 'input' | 'pre' | 'engine' | 'module' | 'output';
    metricSummary?: string;
    targetTab?: string;
    isRecommendedNext?: boolean;
    onNavigate?: (targetTab: string) => void;
    onOpenDetails?: (moduleId: string) => void;
  },
  'govtech'
>;

export function GovTechNode({ data, isConnectable, selected }: NodeProps<GovTechNodeData>) {
  const phaseConfig: Record<string, { bg: string; border: string; badge: string; label: string }> = {
    input: { bg: 'bg-sky-700', border: 'border-sky-700', badge: 'bg-sky-100 text-sky-800', label: '📥 INPUT' },
    pre: { bg: 'bg-amber-600', border: 'border-amber-600', badge: 'bg-amber-100 text-amber-800', label: '🔍 PRE-PROSES' },
    engine: { bg: 'bg-rose-600', border: 'border-rose-600', badge: 'bg-rose-100 text-rose-800', label: '⚙️ ENGINE' },
    module: { bg: 'bg-purple-700', border: 'border-purple-700', badge: 'bg-purple-100 text-purple-800', label: '📦 MODUL' },
    output: { bg: 'bg-emerald-700', border: 'border-emerald-700', badge: 'bg-emerald-100 text-emerald-800', label: '📊 OUTPUT' },
  };

  const config = phaseConfig[data.phase || ''] || {
    bg: 'bg-pupr-blue',
    border: 'border-pupr-blue',
    badge: 'bg-slate-100 text-slate-800',
    label: '🟦 PROSES',
  };

  const isSuccess = data.status === 'Selesai' || data.status === 'Tersedia' || data.statusType === 'success';
  const isReady = data.statusType === 'ready';
  const isWarning = data.statusType === 'warning' || data.status === 'Peringatan';

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onNavigate && data.targetTab) {
      data.onNavigate(data.targetTab);
    } else if (data.targetTab) {
      window.dispatchEvent(new CustomEvent('navigateToTab', { detail: data.targetTab }));
    }
  };

  const handleOpenDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onOpenDetails && data.moduleId) {
      data.onOpenDetails(data.moduleId);
    }
  };

  return (
    <div
      onClick={handleOpenDetails}
      className={`bg-white rounded-xl shadow-sm w-72 overflow-hidden transition-all duration-200 border-2 select-none group cursor-pointer ${
        selected
          ? 'border-pupr-blue ring-4 ring-pupr-blue/20 shadow-lg scale-[1.02]'
          : data.isRecommendedNext
          ? 'border-amber-400 ring-4 ring-amber-300/30 shadow-md animate-pulse'
          : 'border-slate-300 hover:border-pupr-blue hover:shadow-md'
      }`}
    >
      {/* Target Handle (Koneksi Atas) */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!w-3.5 !h-3.5 !bg-amber-400 !border-2 !border-white !-top-1.5 transition-transform hover:scale-125 shadow-sm"
      />

      {/* Header GovTech */}
      <div className={`text-white text-[11px] font-bold px-3 py-1.5 border-b-2 border-pupr-yellow ${config.bg} flex items-center justify-between`}>
        <span className="tracking-wide uppercase">{config.label}</span>
        {data.isRecommendedNext && (
          <span className="flex items-center gap-1 bg-amber-400 text-slate-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
            <Sparkles className="w-2.5 h-2.5 fill-current" />
            Langkah Berikut
          </span>
        )}
      </div>

      {/* Body Area */}
      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="font-bold text-sm text-slate-800 leading-snug line-clamp-2">
            {data.label}
          </div>
        </div>

        {/* Metric Summary Preview */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-xs font-mono text-slate-700 min-h-[38px] flex items-center">
          <span className="line-clamp-2 leading-relaxed text-[11px]">
            {data.metricSummary || 'Belum ada parameter tercatat'}
          </span>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            {isSuccess ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                {data.status || 'Selesai'}
              </span>
            ) : isReady ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                {data.status || 'Siap Dihitung'}
              </span>
            ) : isWarning ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                {data.status || 'Peringatan'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                {data.status || 'Menunggu Data'}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleOpenDetails}
              title="Lihat Detail I/O & Algoritma"
              className="p-1 rounded text-slate-400 hover:text-pupr-blue hover:bg-slate-100 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNavigate}
              title={`Buka Modul ${data.targetTab || ''}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-pupr-blue text-white text-[11px] font-semibold hover:bg-blue-800 transition-all shadow-sm active:scale-95"
            >
              <span>Buka</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Source Handle (Koneksi Bawah) */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!w-3.5 !h-3.5 !bg-amber-400 !border-2 !border-white !-bottom-1.5 transition-transform hover:scale-125 shadow-sm"
      />
    </div>
  );
}
