import { Droplets } from 'lucide-react';
import { EmbungProvider } from '../../hooks/useEmbungStore';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';
import { EmbungNavigator } from './panels/EmbungNavigator';
import { EmbungWorkspace } from './panels/EmbungWorkspace';
import { ComplianceBadge } from '@/components/ui/data-display/ComplianceComponents';


export const EmbungRebuildMain: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Dynamic Workstation Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pupr-blue/10 rounded-sm flex items-center justify-center text-pupr-blue">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase">
                Manajemen Situ & Embung
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <ComplianceBadge sniCode="Pd T-07-2004-A" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Small Reservoir Engineering Workspace</span>
              </div>
            </div>
          </div>
        </div>

        <ProjectContextBanner />
      </div>

      {/* Main Workstation Body: Split Pane */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar: Controls & Parameters */}
        <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 border-r border-slate-200 dark:border-slate-800">
          <EmbungNavigator />
        </aside>

        {/* Right Content: Workspace & Results */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
          <EmbungWorkspace />
        </main>
      </div>
    </div>
  );
};

export const EmbungRebuild: React.FC = () => (
 <EmbungProvider>
 <EmbungRebuildMain />
 </EmbungProvider>
);
