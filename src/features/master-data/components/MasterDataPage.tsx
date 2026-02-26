import React, { useState } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Database, CloudRain, MapPin, LayoutDashboard } from 'lucide-react';
import { MasterHidrologiTab } from './MasterHidrologiTab';
import { ParameterSpasial } from './ParameterSpasial';
import { MasterDataDashboard } from './MasterDataDashboard';

type TabType = 'dashboard' | 'data-hujan' | 'parameter-spasial';

export const MasterDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <ModuleLayout
      title="Master Data Hidrologi"
      description="Single Source of Truth untuk Data & Parameter Hidrologi"
      icon={<Database className="w-6 h-6" />}
      iconColorClass="bg-teal-50 text-teal-600"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('data-hujan')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'data-hujan'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CloudRain className="w-4 h-4" />
            Data Curah Hujan
          </button>
          <button
            onClick={() => setActiveTab('parameter-spasial')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'parameter-spasial'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Parameter Spasial
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'dashboard' && (
            <MasterDataDashboard
              onNavigateToSection={(section) => {
                if (section === 'qc') setActiveTab('data-hujan');
                else setActiveTab('parameter-spasial');
              }}
            />
          )}
          {activeTab === 'data-hujan' && <MasterHidrologiTab />}
          {activeTab === 'parameter-spasial' && <ParameterSpasial />}
        </div>
      </div>
    </ModuleLayout>
  );
};
