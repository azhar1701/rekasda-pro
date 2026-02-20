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
    <div className="glass-card rounded-xl overflow-hidden shadow-lg">
      {caption && (
        <div className="px-6 py-4 border-b border-white/20">
          <h3 className="text-sm font-semibold text-neutral-900">{caption}</h3>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="glass border-b border-white/20">
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
          <tbody className="divide-y divide-white/10">
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
                  className={striped && rowIdx % 2 === 1 ? 'bg-white/5' : ''}
                >
                  {columns.map((column, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-6 py-3.5 text-sm text-neutral-900 font-feature-settings-numeric
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
