import React, { useState, useMemo } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Database, MapPin, LayoutDashboard, Building2, AlertCircle, Layers } from 'lucide-react';
import { MasterHidrologiTab } from './MasterHidrologiTab';
import { ParameterSpasial } from './ParameterSpasial';
import { MasterDataDashboard } from './MasterDataDashboard';
import { FormIdentitasLokasi } from './FormIdentitasLokasi';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Button } from '@/components/ui/Button';

type TabType = 'dashboard' | 'identitas' | 'data-hujan' | 'parameter-spasial';

export const MasterDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { projectStationIds } = useHydrologyStore();

  const isRainfallConfigured = useMemo(() => {
    return (projectStationIds?.length || 0) > 0;
  }, [projectStationIds]);

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'identitas' as TabType, label: 'Identitas Lokasi (Opsional)', icon: Building2 },
    { id: 'data-hujan' as TabType, label: 'Database Stasiun', icon: Database },
    { id: 'parameter-spasial' as TabType, label: 'Analisis Spasial & Thiessen', icon: MapPin },
  ];

  return (
    <ModuleLayout
      title="Master Data Hidrologi"
      description="Single Source of Truth untuk Data & Parameter Hidrologi"
      icon={<Database className="w-6 h-6" />}
      iconColorClass="bg-pupr-blue text-white"
    >
      <div className="space-y-6">
        {/* Professional Engineering Tabs */}
        <div className="border-b border-slate-300 overflow-x-auto scrollbar-hide">
          <div className="flex gap-0 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all border-b-4 ${isActive
                    ? 'text-pupr-blue border-pupr-yellow bg-slate-50'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50/50'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content with Logic Enforcement */}
        <div className="min-h-[600px] transition-all duration-300">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              <MasterDataDashboard
                onNavigateToSection={(section) => {
                  if (section === 'hujan') setActiveTab('data-hujan');
                  else setActiveTab('parameter-spasial');
                }}
              />
            </div>
          )}
          
          {activeTab === 'identitas' && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              <FormIdentitasLokasi />
            </div>
          )}

          {activeTab === 'data-hujan' && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              <MasterHidrologiTab />
            </div>
          )}

          {activeTab === 'parameter-spasial' && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              <ParameterSpasial />
            </div>
          )}
        </div>
      </div>
    </ModuleLayout>
  );
};
