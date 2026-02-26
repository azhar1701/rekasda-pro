import React from 'react';

interface ScrollableTableProps {
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

export const ScrollableTable: React.FC<ScrollableTableProps> = ({
  children,
  maxHeight = 'max-h-[400px]',
  className = ''
}) => {
  return (
    <div className={`overflow-x-auto ${maxHeight} border border-slate-200 rounded-lg ${className}`}>
      <div className="inline-block min-w-full align-middle">
        {children}
      </div>
    </div>
  );
};

interface StickyHeaderTableProps {
  headers: string[];
  children: React.ReactNode;
}

export const StickyHeaderTable: React.FC<StickyHeaderTableProps> = ({ headers, children }) => {
  return (
    <table className="min-w-full divide-y divide-slate-200">
      <thead className="bg-slate-50 sticky top-0 z-10">
        <tr>
          {headers.map((header, idx) => (
            <th
              key={idx}
              className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-slate-100">
        {children}
      </tbody>
    </table>
  );
};
