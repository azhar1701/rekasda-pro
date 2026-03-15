import React from 'react';

interface Tab {
 id: string;
 label: string;
 icon?: React.ReactNode;
 badge?: number;
}

interface TabsProps {
 tabs: Tab[];
 activeTab: string;
 onChange: (tabId: string) => void;
 children: React.ReactNode;
 className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
 tabs,
 activeTab,
 onChange,
 children,
 className = '',
}) => {
 return (
 <div className={`w-full ${className}`}>
 {/* Tab Headers */}
 <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-t-xl overflow-x-auto">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => onChange(tab.id)}
 className={`
 relative px-4 py-3 font-medium text-sm whitespace-nowrap transition-all
 flex items-center gap-2
 ${
 activeTab === tab.id
 ? 'text-pupr-blue border-b-4 border-pupr-yellow font-bold'
 : 'text-slate-600 dark:text-slate-500 hover:text-pupr-blue border-b-4 border-transparent'
 }
 `}
 >
 {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
 {tab.label}
 {tab.badge !== undefined && (
 <span className="ml-2 px-2 py-0.5 bg-pupr-blue text-white text-xs rounded-sm font-bold tabular-nums tracking-tight">
 {tab.badge}
 </span>
 )}
 </button>
 ))}
 </div>

 {/* Tab Content */}
 <div className="bg-white dark:bg-slate-900 rounded-b-xl">{children}</div>
 </div>
 );
};
