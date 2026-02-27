import React from 'react';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  numeric?: boolean;
}

interface TableGovTechProps {
  columns: Column[];
  data: Record<string, any>[];
  className?: string;
  stickyHeader?: boolean;
  zebraStripe?: boolean;
}

export const TableGovTech: React.FC<TableGovTechProps> = ({ 
  columns, 
  data,
  className = '',
  stickyHeader = true,
  zebraStripe = true
}) => {
  return (
    <div className={`overflow-x-auto border border-pupr-border rounded-md ${className}`}>
      <table className="w-full border-collapse">
        <thead className={`bg-pupr-blue text-white ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
          <tr>
            {columns.map((col) => (
              <th 
                key={col.key}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-pupr-blue ${
                  col.align === 'right' ? 'text-right' : 
                  col.align === 'center' ? 'text-center' : 
                  'text-left'
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr 
              key={idx}
              className={`border-b border-pupr-border hover:bg-pupr-surface transition-colors ${
                zebraStripe && idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'
              }`}
            >
              {columns.map((col) => (
                <td 
                  key={col.key}
                  className={`px-4 py-2.5 text-sm text-pupr-text ${
                    col.numeric ? 'tabular-nums tracking-tight font-medium' : ''
                  } ${
                    col.align === 'right' ? 'text-right' : 
                    col.align === 'center' ? 'text-center' : 
                    'text-left'
                  }`}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
