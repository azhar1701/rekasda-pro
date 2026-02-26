/**
 * TAHAP 3: Executive Comparison Dashboard
 * Multi-Line Chart untuk perbandingan HSS
 */

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { HSSComparisonResult } from '@/stores/useHydrologyStore';
import { Card } from '@/components/ui/Card';

interface HSSComparisonChartProps {
  results: HSSComparisonResult[];
  title?: string;
}

export const HSSComparisonChart: React.FC<HSSComparisonChartProps> = ({
  results,
  title = 'Perbandingan Hidrograf Satuan Sintetik',
}) => {
  const [visibleMethods, setVisibleMethods] = useState<Set<string>>(
    new Set(results.map((r) => r.method))
  );

  // Transform data untuk Recharts
  const chartData = React.useMemo(() => {
    if (results.length === 0) return [];

    // Find max time across all methods
    const maxTime = Math.max(
      ...results.map((r) => Math.max(...r.hydrograph.map((h) => h.time)))
    );

    const data: any[] = [];
    for (let t = 0; t <= maxTime; t += 0.5) {
      const point: any = { time: t };
      results.forEach((result) => {
        const hydrographPoint = result.hydrograph.find((h) => Math.abs(h.time - t) < 0.25);
        point[result.method] = hydrographPoint?.discharge || 0;
      });
      data.push(point);
    }

    return data;
  }, [results]);

  const toggleMethod = (method: string) => {
    setVisibleMethods((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(method)) {
        newSet.delete(method);
      } else {
        newSet.add(method);
      }
      return newSet;
    });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            label={{ value: 'Waktu (jam)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            label={{ value: 'Debit (m³/s)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value: number) => value.toFixed(2) + ' m³/s'}
            labelFormatter={(label) => `Waktu: ${label} jam`}
          />
          <Legend
            onClick={(e) => toggleMethod(e.value)}
            wrapperStyle={{ cursor: 'pointer' }}
          />
          {results.map((result) => (
            <Line
              key={result.method}
              type="monotone"
              dataKey={result.method}
              stroke={result.color}
              strokeWidth={2}
              dot={false}
              hide={!visibleMethods.has(result.method)}
              name={result.method}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Summary Table */}
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-3">Rekapitulasi Debit Puncak</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left p-2 border">Metode</th>
                <th className="text-right p-2 border">Qp (m³/s)</th>
                <th className="text-right p-2 border">Tp (jam)</th>
                <th className="text-right p-2 border">Tb (jam)</th>
                <th className="text-center p-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr
                  key={result.method}
                  className="border-b hover:bg-gray-50"
                  style={{
                    opacity: visibleMethods.has(result.method) ? 1 : 0.4,
                  }}
                >
                  <td className="p-2 border">
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: result.color }}
                    />
                    {result.method}
                  </td>
                  <td className="text-right p-2 border font-mono">
                    {result.Qp.toFixed(2)}
                  </td>
                  <td className="text-right p-2 border font-mono">
                    {result.Tp.toFixed(2)}
                  </td>
                  <td className="text-right p-2 border font-mono">
                    {result.Tb.toFixed(2)}
                  </td>
                  <td className="text-center p-2 border">
                    <button
                      onClick={() => toggleMethod(result.method)}
                      className="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200"
                    >
                      {visibleMethods.has(result.method) ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Rekomendasi SNI 2415:2016:</strong> Pilih metode yang paling sesuai dengan
          karakteristik DAS. Untuk DAS di Indonesia, metode Nakayasu umumnya memberikan hasil
          yang baik. Bandingkan dengan data observasi jika tersedia.
        </p>
      </div>
    </Card>
  );
};
