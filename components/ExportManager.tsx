import React, { useState } from 'react';
import { CalculationResult, CalculationType } from '../types';

interface ExportManagerProps {
  data: CalculationResult[];
  className?: string;
}

export const ExportManager: React.FC<ExportManagerProps> = ({ data, className = '' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'json' | 'pdf' | null>(null);

  const generateCSV = (items: CalculationResult[]): string => {
    const headers = [
      'ID', 'Tanggal', 'Tipe', 'Nama Lokasi', 'Kabupaten', 'Kecamatan', 'Desa',
      'Debit (m³/s)', 'Latitude', 'Longitude', 'Akurasi GPS', 'Catatan'
    ];

    const rows = items.map(item => [
      item.id,
      new Date(item.date).toLocaleDateString('id-ID'),
      item.type,
      item.inputs.site?.channelName || '',
      item.inputs.site?.regency || '',
      item.inputs.site?.district || '',
      item.inputs.site?.village || '',
      item.outputs.Discharge || '',
      item.location?.latitude || '',
      item.location?.longitude || '',
      item.location?.accuracy || '',
      item.notes || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\\n');
  };

  const generateJSON = (items: CalculationResult[]): string => {
    return JSON.stringify(items, null, 2);
  };

  const generatePDFContent = (items: CalculationResult[]): string => {
    const title = `LAPORAN DATA PERHITUNGAN HIDROLOGI`;
    const date = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let content = `${title}\\n`;
    content += `Tanggal: ${date}\\n`;
    content += `Total Data: ${items.length}\\n\\n`;

    const manningCount = items.filter(i => i.type === CalculationType.MANNING).length;
    const rationalCount = items.filter(i => i.type === CalculationType.RATIONAL).length;

    content += `RINGKASAN:\\n`;
    content += `- Perhitungan Manning: ${manningCount}\\n`;
    content += `- Perhitungan Rational: ${rationalCount}\\n\\n`;

    content += `DETAIL DATA:\\n`;
    content += `${'='.repeat(80)}\\n`;

    items.forEach((item, index) => {
      content += `${index + 1}. ${item.inputs.site?.channelName || 'Tanpa Nama'}\\n`;
      content += `   Tipe: ${item.type}\\n`;
      content += `   Tanggal: ${new Date(item.date).toLocaleDateString('id-ID')}\\n`;
      content += `   Lokasi: ${item.inputs.site?.village}, ${item.inputs.site?.district}, ${item.inputs.site?.regency}\\n`;
      content += `   Debit: ${item.outputs.Discharge} m³/s\\n`;
      if (item.location) {
        content += `   GPS: ${item.location.latitude.toFixed(6)}, ${item.location.longitude.toFixed(6)} (±${item.location.accuracy}m)\\n`;
      }
      if (item.notes) {
        content += `   Catatan: ${item.notes}\\n`;
      }
      content += `\\n`;
    });

    content += `\\nDibuat oleh: HydroField Pro\\n`;
    content += `Waktu Export: ${new Date().toLocaleString('id-ID')}`;

    return content;
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

  const handleExport = async (type: 'csv' | 'json' | 'pdf') => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    setIsExporting(true);
    setExportType(type);

    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      
      switch (type) {
        case 'csv':
          const csvContent = generateCSV(data);
          downloadFile(csvContent, `hydrofield-data-${timestamp}.csv`, 'text/csv');
          break;
          
        case 'json':
          const jsonContent = generateJSON(data);
          downloadFile(jsonContent, `hydrofield-data-${timestamp}.json`, 'application/json');
          break;
          
        case 'pdf':
          const pdfContent = generatePDFContent(data);
          downloadFile(pdfContent, `hydrofield-report-${timestamp}.txt`, 'text/plain');
          break;
      }

      // Show success message
      setTimeout(() => {
        alert(`Data berhasil diekspor sebagai ${type.toUpperCase()}`);
      }, 500);

    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengekspor data. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const exportOptions = [
    {
      type: 'csv' as const,
      label: 'CSV',
      description: 'Spreadsheet data',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    {
      type: 'json' as const,
      label: 'JSON',
      description: 'Raw data format',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    {
      type: 'pdf' as const,
      label: 'Report',
      description: 'Text report',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-red-100 text-red-700 hover:bg-red-200'
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Export Data</h3>
          <p className="text-sm text-slate-600">Ekspor {data.length} data perhitungan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exportOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => handleExport(option.type)}
            disabled={isExporting || data.length === 0}
            className={`p-4 rounded-xl border border-slate-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${option.color}`}
          >
            <div className="flex items-center gap-3">
              {isExporting && exportType === option.type ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                option.icon
              )}
              <div className="text-left">
                <div className="font-medium">{option.label}</div>
                <div className="text-xs opacity-75">{option.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-6 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Belum ada data untuk diekspor</p>
        </div>
      )}
    </div>
  );
};