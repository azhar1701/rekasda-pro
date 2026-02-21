import React from 'react';
import { X, Plus } from 'lucide-react';
import { RainfallDataPoint } from '../FrequencyAnalysisModal';

interface DataInputTableProps {
  data: RainfallDataPoint[];
  onChange: (data: RainfallDataPoint[]) => void;
}

export const DataInputTable: React.FC<DataInputTableProps> = ({ data, onChange }) => {
  const handleAdd = () => {
    const lastYear = data.length > 0 ? Math.max(...data.map(d => d.year)) : new Date().getFullYear();
    onChange([...data, { year: lastYear + 1, value: 0 }]);
  };

  const handleRemove = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof RainfallDataPoint, value: number) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">Data Hujan Harian Maksimum</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Baris
        </button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Tahun</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Hujan (mm)</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={row.year}
                    onChange={(e) => handleChange(index, 'year', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={row.value}
                    onChange={(e) => handleChange(index, 'value', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleRemove(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    aria-label="Hapus baris"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
