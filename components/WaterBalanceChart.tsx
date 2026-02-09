import React from 'react';
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WaterBalanceResult } from '../services/waterBalanceEngine';

interface Props {
  data: WaterBalanceResult[];
}

export const WaterBalanceChart: React.FC<Props> = ({ data }) => {
  // Transform data for chart
  const chartData = data.map(item => ({
    month: item.month,
    'Ketersediaan Air (Q80)': item.supply,
    'Total Kebutuhan': item.totalDemand,
    'Surplus/Defisit': item.balance,
    status: item.status
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-slate-200">
          <p className="font-bold text-slate-900 mb-2">{data.month}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600 font-semibold">Ketersediaan: {data['Ketersediaan Air (Q80)']} m³/s</p>
            <p className="text-orange-600 font-semibold">Kebutuhan: {data['Total Kebutuhan']} m³/s</p>
            <p className={`font-bold ${data['Surplus/Defisit'] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data['Surplus/Defisit'] >= 0 ? 'Surplus' : 'Defisit'}: {Math.abs(data['Surplus/Defisit'])} m³/s
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis 
            label={{ value: 'Debit (m³/s)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontWeight: 600 } }}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
          
          {/* Background area for deficit/surplus */}
          <Area 
            type="monotone" 
            dataKey="Surplus/Defisit" 
            fill="#10b98150"
            stroke="none"
            fillOpacity={0.3}
          />
          
          {/* Bar for water supply */}
          <Bar 
            dataKey="Ketersediaan Air (Q80)" 
            fill="#3b82f6" 
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          />
          
          {/* Line for total demand */}
          <Line 
            type="monotone" 
            dataKey="Total Kebutuhan" 
            stroke="#f97316" 
            strokeWidth={3}
            dot={{ fill: '#f97316', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
