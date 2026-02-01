import React, { useState } from 'react';
import { CalculationResult } from '../types';

interface CompactExportProps {
  data: CalculationResult[];
}

export const CompactExport: React.FC<CompactExportProps> = ({ data }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const generateCSV = (items: CalculationResult[]): string => {
    const headers = ['ID', 'Tanggal', 'Tipe', 'Nama Lokasi', 'Debit (m³/s)', 'Latitude', 'Longitude'];
    const rows = items.map(item => [
      item.id,
      new Date(item.date).toLocaleDateString('id-ID'),
      item.type,
      item.inputs.site?.channelName || '',
      item.outputs.Discharge || '',
      item.location?.latitude || '',
      item.location?.longitude || ''
    ]);
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (type: 'csv' | 'json') => {
    if (data.length === 0) return;
    
    setIsExporting(true);
    setShowMenu(false);
    
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      
      if (type === 'csv') {
        const csvContent = generateCSV(data);
        downloadFile(csvContent, `hydrofield-data-${timestamp}.csv`, 'text/csv');
      } else {
        const jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, `hydrofield-data-${timestamp}.json`, 'application/json');
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={data.length === 0 || isExporting}
        className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors disabled:opacity-50 text-xs font-bold"
      >
        {isExporting ? (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        <span className="hidden md:inline">Export</span>
      </button>

      {showMenu && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 min-w-[120px]">
          <button
            onClick={() => handleExport('csv')}
            className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-t-xl"
          >
            CSV File
          </button>
          <button
            onClick={() => handleExport('json')}
            className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-b-xl"
          >
            JSON File
          </button>
        </div>
      )}
    </div>
  );
};