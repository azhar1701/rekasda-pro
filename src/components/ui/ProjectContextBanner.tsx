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
 <div className="bg-pupr-surface/80 border border-pupr-border text-blue-800 p-3 rounded-sm flex items-center gap-6 text-sm mb-1 animate-in fade-in slide-in-from-top-2 duration-75">
 <div className="flex items-center gap-2">
 <div className="hidden sm:flex w-12 h-12 rounded-sm bg-gradient-to-br from-pupr-blue to-[#1a4a7a] items-center justify-center ">
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
