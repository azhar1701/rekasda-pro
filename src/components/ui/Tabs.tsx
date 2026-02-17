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
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white rounded-t-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative px-4 py-3 font-medium text-sm whitespace-nowrap transition-all
              flex items-center gap-2
              ${
                activeTab === tab.id
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }
            `}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-2 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full font-semibold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl">{children}</div>
    </div>
  );
};
