import React, { useState } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Database, CloudRain, MapPin, LayoutDashboard, Zap, Building2 } from 'lucide-react';
import { MasterHidrologiTab } from './MasterHidrologiTab';
import { ParameterSpasial } from './ParameterSpasial';
import { MasterDataDashboard } from './MasterDataDashboard';
import { FormIdentitasLokasi } from './FormIdentitasLokasi';

type TabType = 'dashboard' | 'identitas' | 'data-hujan' | 'parameter-spasial';

export const MasterDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [hoveredTab, setHoveredTab] = useState<TabType | null>(null);

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard, color: 'indigo' },
    { id: 'identitas' as TabType, label: 'Identitas Lokasi', icon: Building2, color: 'purple' },
    { id: 'data-hujan' as TabType, label: 'Data Curah Hujan', icon: CloudRain, color: 'teal' },
    { id: 'parameter-spasial' as TabType, label: 'Parameter Spasial', icon: MapPin, color: 'blue' },
  ];

  return (
    <ModuleLayout
      title="Master Data Hidrologi"
      description="Single Source of Truth untuk Data & Parameter Hidrologi"
      icon={<Database className="w-6 h-6" />}
      iconColorClass="bg-teal-50 text-teal-600"
    >
      <div className="space-y-6">
        {/* Interactive Tab Navigation */}
        <div className="relative">
          <div className="flex gap-2 p-1.5 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl w-fit shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isHovered = hoveredTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className={`relative flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    isActive
                      ? `bg-white text-${tab.color}-700 shadow-lg scale-105`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${
                    isActive || isHovered ? 'scale-110' : ''
                  }`} />
                  <span className="relative">
                    {tab.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent animate-pulse" />
                    )}
                  </span>
                  {isActive && (
                    <Zap className="w-3 h-3 text-yellow-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content with Transition */}
        <div className="min-h-[600px] transition-all duration-300">
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <MasterDataDashboard
                onNavigateToSection={(section) => {
                  if (section === 'qc') setActiveTab('data-hujan');
                  else setActiveTab('parameter-spasial');
                }}
              />
            </div>
          )}
          {activeTab === 'identitas' && (
            <div className="animate-fade-in">
              <FormIdentitasLokasi />
            </div>
          )}
          {activeTab === 'data-hujan' && (
            <div className="animate-fade-in">
              <MasterHidrologiTab />
            </div>
          )}
          {activeTab === 'parameter-spasial' && (
            <div className="animate-fade-in">
              <ParameterSpasial />
            </div>
          )}
        </div>
      </div>
    </ModuleLayout>
  );
};
