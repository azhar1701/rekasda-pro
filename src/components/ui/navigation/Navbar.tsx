import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  GitMerge, Database, TrendingUp, CloudRain, 
  Scale, Droplets, Waves, History, FileText, Sparkles 
} from 'lucide-react';

export enum Tab {
  WORKFLOW = '/workflow',
  SALURAN = '/saluran',
  BANJIR = '/banjir',
  NERACA = '/neraca',
  EMBUNG = '/embung',
  MASTER = '/master',
  FREKUENSI = '/frekuensi',
  HISTORY = '/history',
  AI = '/ai',
  EXEC = '/exec'
}

interface NavbarProps {
  isAIDrawerOpen: boolean;
  setIsAIDrawerOpen: (isOpen: boolean | ((prev: boolean) => boolean)) => void;
  isMobileOverflowOpen: boolean;
  setIsMobileOverflowOpen: (isOpen: boolean | ((prev: boolean) => boolean)) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAIDrawerOpen,
  setIsAIDrawerOpen,
  isMobileOverflowOpen,
  setIsMobileOverflowOpen
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname;

  const navGroups = [
    {
      items: [
        { tab: Tab.WORKFLOW, label: 'Alur Kerja', icon: <GitMerge strokeWidth={2.5} className="w-4 h-4" /> },
        { tab: Tab.MASTER, label: 'Data Master', icon: <Database strokeWidth={2.5} className="w-4 h-4" /> },
      ],
    },
    {
      items: [
        { tab: Tab.FREKUENSI, label: 'Frekuensi', icon: <TrendingUp strokeWidth={2.5} className="w-4 h-4" /> },
        { tab: Tab.BANJIR, label: 'Banjir', icon: <CloudRain strokeWidth={2.5} className="w-4 h-4" /> },
        { tab: Tab.NERACA, label: 'Neraca', icon: <Scale strokeWidth={2.5} className="w-4 h-4" /> },
      ],
    },
    {
      items: [
        { tab: Tab.EMBUNG, label: 'Embung', icon: <Droplets strokeWidth={2.5} className="w-4 h-4" /> },
        { tab: Tab.SALURAN, label: 'Saluran', icon: <Waves strokeWidth={2.5} className="w-4 h-4" /> },
      ],
    },
    {
      items: [
        { tab: Tab.HISTORY, label: 'Riwayat', icon: <History strokeWidth={2.5} className="w-4 h-4" /> },
        { tab: Tab.EXEC, label: 'Laporan', icon: <FileText strokeWidth={2.5} className="w-4 h-4" /> },
      ],
    },
  ];

  const activeClass = 'bg-[#f2c114] text-[#0c3a66] border-[#f2c114] shadow-none font-black';
  const hoverClass = 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent';
  const mobileActiveClass = 'text-[#0c3a66] bg-[#f2c114]/10 dark:text-blue-300 dark:bg-blue-900/40 font-bold';

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:top-16 md:bottom-auto z-50">
      {/* Desktop Ribbon Bar */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-14">
        <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide h-full py-2">
            {navGroups.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {groupIndex > 0 && <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />}
                {group.items.map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => navigate(item.tab)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-none border transition-all duration-75 whitespace-nowrap ${
                      activeTab.startsWith(item.tab) ? activeClass : hoverClass
                    }`}
                  >
                    {item.icon}
                    <span className="text-[11px] uppercase tracking-wide">{item.label}</span>
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* AI Toggle on the right */}
          <div className="flex items-center pl-4 border-l border-slate-200 dark:bg-slate-800">
            <button
              onClick={() => setIsAIDrawerOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-none border transition-all duration-75 ${
                isAIDrawerOpen 
                ? 'bg-indigo-600 text-white border-indigo-700 font-bold' 
                : 'text-indigo-600 hover:bg-indigo-50 border-indigo-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] uppercase tracking-wide">AI Konsultan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 safe-area-inset-bottom shadow-none">
        {isMobileOverflowOpen && (
          <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 animate-in slide-in-from-bottom-2">
            <div className="grid grid-cols-3 gap-2">
              {[Tab.WORKFLOW, Tab.FREKUENSI, Tab.EMBUNG, Tab.SALURAN, Tab.HISTORY, Tab.EXEC].map((tab) => {
                const item = [...navGroups[0].items, ...navGroups[1].items, ...navGroups[2].items, ...navGroups[3].items].find(i => i.tab === tab);
                if (!item) return null;
                return (
                  <button
                    key={tab}
                    onClick={() => { navigate(tab); setIsMobileOverflowOpen(false); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-none border ${
                      activeTab.startsWith(tab) ? 'bg-[#0c3a66] text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    {item.icon}
                    <span className="text-[10px] uppercase font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex items-center h-16 px-2">
          {/* Main 4 + AI + More */}
          {[Tab.MASTER, Tab.BANJIR, Tab.NERACA].map((tab) => {
             const item = [...navGroups[0].items, ...navGroups[1].items].find(i => i.tab === tab);
             if (!item) return null;
             return (
               <button
                 key={tab}
                 onClick={() => { navigate(tab); setIsMobileOverflowOpen(false); }}
                 className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                   activeTab.startsWith(tab) ? mobileActiveClass : 'text-slate-400'
                 }`}
               >
                 {item.icon}
                 <span className="text-[9px] mt-1 uppercase font-bold">{item.label}</span>
                 {activeTab.startsWith(tab) && <div className="w-1 h-1 bg-[#0c3a66] rounded-full mt-0.5" />}
               </button>
             );
          })}
          
          <button
            onClick={() => setIsAIDrawerOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isAIDrawerOpen ? 'text-indigo-600 font-black' : 'text-indigo-300'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] mt-1 uppercase font-bold">AI</span>
          </button>

          <button
            onClick={() => setIsMobileOverflowOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isMobileOverflowOpen ? 'text-[#0c3a66] font-black' : 'text-slate-400'
            }`}
          >
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-current rounded-full" />
              <div className="w-1 h-1 bg-current rounded-full" />
              <div className="w-1 h-1 bg-current rounded-full" />
            </div>
            <span className="text-[9px] mt-1 uppercase font-bold">Opsi</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
