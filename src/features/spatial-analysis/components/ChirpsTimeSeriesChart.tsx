import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChirpsTimeSeriesChartProps {
  data: Array<{
    date: string; // YYYY-MM-DD
    rainfall: number;
  }>;
  height?: number;
}

export const ChirpsTimeSeriesChart: React.FC<ChirpsTimeSeriesChartProps> = ({ 
  data, 
  height = 250 
}) => {
  const chartData = data.length > 2000 
    ? data.filter((_, i) => i % Math.ceil(data.length / 2000) === 0) 
    : data;

  const maxRainfall = Math.max(...chartData.map(d => d.rainfall), 10);

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 9, fill: '#94a3b8' }} 
            tickFormatter={(val) => val.substring(0, 4)} 
            minTickGap={40}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis 
            tick={{ fontSize: 9, fill: '#94a3b8' }} 
            domain={[0, maxRainfall * 1.1]} 
            width={60}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '0px', 
              fontSize: '10px', 
              border: '1px solid #e2e8f0',
              boxShadow: 'none',
              fontWeight: 'bold'
            }}
            formatter={(value: number) => [`${value.toFixed(1)} mm`, 'Hujan']}
            labelFormatter={(label) => `Tanggal: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="rainfall" 
            stroke="#0c3a66" 
            strokeWidth={1} 
            dot={false}
            activeDot={{ r: 3, fill: '#f2c114', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
