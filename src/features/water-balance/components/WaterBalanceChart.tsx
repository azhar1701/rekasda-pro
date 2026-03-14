import React from 'react';
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WaterBalanceResult } from '@/services/waterBalanceEngine';
import { CHART_COLORS } from '@/lib/constants/chartColors';

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
 <div className="bg-white dark:bg-slate-900 p-4 rounded-sm border border-slate-200 dark:border-slate-700">
 <p className="font-bold text-slate-900 dark:text-slate-100 mb-2">{data.month}</p>
 <div className="space-y-1 text-sm">
 <p className="text-pupr-blue font-semibold">Ketersediaan: {data['Ketersediaan Air (Q80)']} m³/s</p>
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
 <div className="w-full h-full">
 <ResponsiveContainer width="100%" height="100%">
 <ComposedChart
 data={chartData}
 margin={{
 top: 10,
 right: 10,
 left: 0,
 bottom: 5
 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} />
      <XAxis
        dataKey="month"
        tick={{ fill: CHART_COLORS.axisLine, fontSize: 11, fontWeight: 600 }}
        axisLine={{ stroke: CHART_COLORS.referenceLine }}
        height={40}
      />
      <YAxis
        label={{
          value: 'Debit (m³/s)',
          angle: -90,
          position: 'insideLeft',
          style: { fill: CHART_COLORS.axisLine, fontWeight: 600, fontSize: 11 }
        }}
        tick={{ fill: CHART_COLORS.axisLine, fontSize: 11 }}
        axisLine={{ stroke: CHART_COLORS.referenceLine }}
        width={60}
      />
      <Tooltip itemStyle={{ fontVariantNumeric: "tabular-nums" }} content={<CustomTooltip />} />
      <Legend
        wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
        iconType="rect"
        iconSize={10}
      />
      <ReferenceLine y={0} stroke={CHART_COLORS.axisLine} strokeDasharray="3 3" />

      {/* Background area for deficit/surplus */}
      <Area
        type="monotone"
        dataKey="Surplus/Defisit"
        fill={`${CHART_COLORS.surplus}50`}
        stroke="none"
        fillOpacity={0.3}
      />

      {/* Bar for water supply */}
      <Bar
        dataKey="Ketersediaan Air (Q80)"
        fill={CHART_COLORS.rainfall}
        radius={[8, 8, 0, 0]}
        maxBarSize={60}
      />

      {/* Line for total demand */}
      <Line
        type="monotone"
        dataKey="Total Kebutuhan"
        stroke={CHART_COLORS.demand}
        strokeWidth={3}
        dot={{ fill: CHART_COLORS.demand, r: 5 }}
        activeDot={{ r: 7 }}
      />
    </ComposedChart>

 </ResponsiveContainer>
 </div>
 );
};
