/**
 * CONTOH IMPLEMENTASI: Export Excel dengan exceljs
 * 
 * File ini menunjukkan cara menggunakan excelService yang telah
 * direfactor dari xlsx ke exceljs untuk keamanan Enterprise.
 */

import React, { useState } from 'react';
import { exportToExcel } from '@/utils/excelService';
import { Download } from 'lucide-react';

interface FloodData {
  Lokasi: string;
  Q2: number;
  Q5: number;
  Q10: number;
  Q25: number;
  Status: string;
}

export const TabelRekapBanjir: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  // Data contoh
  const floodData: FloodData[] = [
    { Lokasi: 'DAS Citarum', Q2: 125.5, Q5: 185.3, Q10: 225.8, Q25: 285.2, Status: 'Aman' },
    { Lokasi: 'DAS Ciliwung', Q2: 98.2, Q5: 145.7, Q10: 178.4, Q25: 220.5, Status: 'Waspada' },
    { Lokasi: 'DAS Cisadane', Q2: 110.8, Q5: 165.2, Q10: 202.1, Q25: 255.8, Status: 'Aman' }
  ];

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportToExcel(
        floodData,
        'rekap-banjir-rencana-2024',
        'Analisis Banjir'
      );
      alert('✅ Export berhasil!');
    } catch (error) {
      console.error('Export gagal:', error);
      alert('❌ Export gagal. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Rekap Debit Banjir Rencana</h3>
        <button
          onClick={handleExportExcel}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export to Excel'}
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="border p-2">Lokasi</th>
            <th className="border p-2">Q2 (m³/s)</th>
            <th className="border p-2">Q5 (m³/s)</th>
            <th className="border p-2">Q10 (m³/s)</th>
            <th className="border p-2">Q25 (m³/s)</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {floodData.map((row, idx) => (
            <tr key={idx}>
              <td className="border p-2">{row.Lokasi}</td>
              <td className="border p-2 text-right">{row.Q2.toFixed(1)}</td>
              <td className="border p-2 text-right">{row.Q5.toFixed(1)}</td>
              <td className="border p-2 text-right">{row.Q10.toFixed(1)}</td>
              <td className="border p-2 text-right">{row.Q25.toFixed(1)}</td>
              <td className="border p-2 text-center">{row.Status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
