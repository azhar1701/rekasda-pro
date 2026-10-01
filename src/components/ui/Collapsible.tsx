import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({ title, defaultOpen = false, children, badge }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-slate-300 rounded-sm shadow-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50 min-h-[44px]"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-label text-neutral-900">{title}</h2>
          {badge && <span className="text-caption font-bold text-success">{badge}</span>}
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-neutral-600" /> : <ChevronDown className="w-5 h-5 text-neutral-600" />}
      </button>
      {isOpen && <div className="px-6 pb-6 pt-2 border-t border-slate-200">{children}</div>}
    </div>
  );
};
