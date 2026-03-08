import React from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Building2, Navigation } from 'lucide-react';
import { Tooltip } from "@/components/ui/data-display/Tooltip";

export const ProjectContextBanner: React.FC = () => {
  const { identitasLokasi } = useHydrologyStore();
  const { namaPekerjaan, namaDAS, namaSungai } = identitasLokasi;

  if (!namaPekerjaan && !namaDAS && !namaSungai) return null;

  return (
    <Tooltip content="Data identitas dikelola melalui Master Data" position="bottom">
      <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-100 text-blue-800 p-3 rounded-xl flex items-center gap-6 text-sm mb-1 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-pupr-blue to-[#1a4a7a] items-center justify-center shadow-md">
            <Building2 className="text-pupr-yellow w-6 h-6" />
          </div>
          <span className="font-semibold uppercase tracking-tight">📍 Proyek:</span>
          <span className="font-medium text-blue-900">{namaPekerjaan || '—'}</span>
        </div>
        <div className="h-4 w-px bg-blue-200" />
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-500" />
          <span className="font-semibold uppercase tracking-tight">🌊 DAS:</span>
          <span className="font-medium text-blue-900">
            {namaDAS || '—'} {namaSungai ? ` - Sungai ${namaSungai}` : ''}
          </span>
        </div>
      </div>
    </Tooltip>
  );
};
