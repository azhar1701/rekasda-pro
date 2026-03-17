import React, { useState } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Database, MapPin, LayoutDashboard, Building2 } from 'lucide-react';
import { MasterHidrologiTab } from './MasterHidrologiTab';
import { ParameterSpasial } from './ParameterSpasial';
import { MasterDataDashboard } from './MasterDataDashboard';
import { FormIdentitasLokasi } from './FormIdentitasLokasi';
import { useHydrologyStore } from '@/stores/useHydrologyStore';

type TabType = 'dashboard' | 'identitas' | 'data-hujan' | 'parameter-spasial';

export const MasterDataPage: React.FC = () => {
 const [activeTab, setActiveTab] = useState<TabType>('dashboard');
 useHydrologyStore();

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
 
 >
 <div className="space-y-6">
 {/* Professional Engineering Tabs */}
 <div className="border-b border-slate-300 dark:border-slate-600 overflow-x-auto scrollbar-hide">
 <div className="flex gap-0 min-w-max" role="tablist" aria-label="Navigasi Modul Master Data">
 {tabs.map((tab) => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;

 return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all border-b-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pupr-blue focus-visible:ring-inset ${isActive
              ? 'text-pupr-blue border-pupr-yellow bg-slate-50 dark:bg-slate-800'
              : 'text-slate-500 border-transparent hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800'
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
 <div className="min-h-[600px] transition-all duration-75">
  {activeTab === 'dashboard' && (
  <div 
  id="panel-dashboard"
  role="tabpanel"
  aria-labelledby="tab-dashboard"
  className="animate-in fade-in duration-75"
  >
  <MasterDataDashboard
  onNavigateToSection={(section) => {
  if (section === 'hujan') setActiveTab('data-hujan');
  else setActiveTab('parameter-spasial');
  }}
  />
  </div>
  )}
 
  {activeTab === 'identitas' && (
  <div 
  id="panel-identitas"
  role="tabpanel"
  aria-labelledby="tab-identitas"
  className="animate-in fade-in duration-75"
  >
  <FormIdentitasLokasi />
  </div>
  )}

  {activeTab === 'data-hujan' && (
  <div 
  id="panel-data-hujan"
  role="tabpanel"
  aria-labelledby="tab-data-hujan"
  className="animate-in fade-in duration-75"
  >
  <MasterHidrologiTab />
  </div>
  )}

  {activeTab === 'parameter-spasial' && (
  <div 
  id="panel-parameter-spasial"
  role="tabpanel"
  aria-labelledby="tab-parameter-spasial"
  className="animate-in fade-in duration-75"
  >
  <ParameterSpasial />
  </div>
  )}
 </div>
 </div>
 </ModuleLayout>
 );
};
