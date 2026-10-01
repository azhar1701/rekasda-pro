import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Database, CloudRain, MapPin, LayoutDashboard, Building2 } from 'lucide-react';
import { MasterHidrologiTab } from './MasterHidrologiTab';
import { ParameterSpasial } from './ParameterSpasial';
import { MasterDataDashboard } from './MasterDataDashboard';
import { FormIdentitasLokasi } from './FormIdentitasLokasi';

type TabType = 'dashboard' | 'identitas' | 'data-hujan' | 'parameter-spasial';

export const MasterDataPage: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('identitas');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      if (tabParam === 'qc' || tabParam === 'satelit' || tabParam === 'hujan') {
        setActiveTab('data-hujan');
      } else if (tabParam === 'spasial' || tabParam === 'tutupan' || tabParam === 'karakteristik') {
        setActiveTab('parameter-spasial');
      } else if (['dashboard', 'identitas', 'data-hujan', 'parameter-spasial'].includes(tabParam)) {
        setActiveTab(tabParam as TabType);
      }
    }
  }, [location.search]);

  const tabs = [
    { id: 'identitas' as TabType, label: 'Identitas Lokasi', icon: Building2 },
    { id: 'data-hujan' as TabType, label: 'Data Curah Hujan', icon: CloudRain },
    { id: 'parameter-spasial' as TabType, label: 'Parameter Spasial', icon: MapPin },
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <ModuleLayout
      title="Master Data Hidrologi"
      description="Single Source of Truth untuk Data & Parameter Hidrologi"
      icon={<Database className="w-6 h-6" />}
      iconColorClass="bg-teal-50 text-pupr-blue"
    >
      <div className="space-y-6">
        {/* GovTech Grounded Tabs */}
        <div className="border-b border-slate-300 overflow-x-auto scrollbar-hide">
          <div className="flex gap-0 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-4 ${isActive
                    ? 'text-pupr-blue border-pupr-yellow bg-slate-50'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50/50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content with Transition */}
        <div className="min-h-[600px] transition-all duration-300">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              <MasterDataDashboard
                onNavigateToSection={(section) => {
                  if (section === 'qc') setActiveTab('data-hujan');
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
