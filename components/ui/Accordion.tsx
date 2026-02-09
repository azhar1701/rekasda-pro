import React, { useState } from 'react';

interface AccordionItem {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string;
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpen,
  allowMultiple = false,
  className = '',
}) => {
  const [openItems, setOpenItems] = useState<Set<string>>(
    defaultOpen ? new Set([defaultOpen]) : new Set()
  );

  const toggleItem = (id: string) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      if (!allowMultiple) {
        newOpen.clear();
      }
      newOpen.add(id);
    }
    setOpenItems(newOpen);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <div
          key={item.id}
          className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors"
        >
          <button
            onClick={() => toggleItem(item.id)}
            className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3 text-left">
              {item.icon && <div className="text-teal-600 flex-shrink-0">{item.icon}</div>}
              <div>
                <h4 className="font-semibold text-slate-900">{item.title}</h4>
                {item.description && (
                  <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
                )}
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${
                openItems.has(item.id) ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
          {openItems.has(item.id) && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
