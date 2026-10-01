import { ReactNode } from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  caption?: string;
  striped?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  caption,
  striped = true,
}: DataTableProps<T>) {
  return (
    <div className="bg-white border border-slate-300 rounded-sm overflow-hidden shadow-none">
      {caption && (
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-neutral-900">{caption}</h3>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-300">
            <tr>
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-3 text-xs font-semibold text-neutral-800 uppercase tracking-wider
                    ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-neutral-600"
                >
                  Tidak ada data
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={striped && rowIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}
                >
                  {columns.map((column, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-6 py-3 text-sm text-neutral-900 tabular-nums tracking-tight
                        ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      {column.render
                        ? column.render(row)
                        : row[column.key as keyof T]?.toString() || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
