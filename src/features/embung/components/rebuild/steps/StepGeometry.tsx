import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { Plus, Trash2, Info, AreaChart as ChartIcon, Table as TableIcon } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line } from 'recharts';

interface CurveRow {
 id: string;
 elevation: number;
 storage: number;
 area: number;
}

const DEFAULT_ROWS: CurveRow[] = [
 { id: '1', elevation: 100, storage: 0, area: 0 },
 { id: '2', elevation: 101, storage: 50000, area: 10000 },
 { id: '3', elevation: 102, storage: 120000, area: 22000 },
 { id: '4', elevation: 103, storage: 210000, area: 35000 },
 { id: '5', elevation: 104, storage: 320000, area: 50000 },
 { id: '6', elevation: 105, storage: 450000, area: 67000 },
];

export const StepGeometry: React.FC = () => {
 const { state, dispatch } = useEmbungStore();
 const [rows, setRows] = useState<CurveRow[]>(
 state.stageStorageCurve ?
 state.stageStorageCurve.elevation.map((e, i) => ({
 id: String(i),
 elevation: e,
 storage: state.stageStorageCurve!.storage[i],
 area: state.stageStorageCurve!.area[i]
 })) : DEFAULT_ROWS
 );

 const handleAddRow = () => {
 const lastRow = rows[rows.length - 1];
 setRows([...rows, {
 id: String(Date.now()),
 elevation: lastRow ? lastRow.elevation + 1 : 100,
 storage: lastRow ? lastRow.storage + 50000 : 0,
 area: lastRow ? lastRow.area + 10000 : 0
 }]);
 };

 const handleRemoveRow = (id: string) => {
 if (rows.length > 2) {
 setRows(rows.filter(r => r.id !== id));
 }
 };

 const handleChange = (id: string, field: keyof CurveRow, val: string) => {
 const numVal = parseFloat(val) || 0;
 setRows(rows.map(r => r.id === id ? { ...r, [field]: numVal } : r));
 };

 // Auto-save to store
 useEffect(() => {
 const sortedRows = [...rows].sort((a, b) => a.elevation - b.elevation);
 dispatch({
 type: 'SET_STAGE_STORAGE_CURVE',
 payload: {
 elevation: sortedRows.map(r => r.elevation),
 storage: sortedRows.map(r => r.storage),
 area: sortedRows.map(r => r.area)
 }
 });
 }, [rows, dispatch]);

 const chartData = [...rows].sort((a, b) => a.elevation - b.elevation);

 return (
 <div className="flex flex-col gap-6 animate-in fade-in duration-75">
 <div className="flex items-start gap-4 bg-amber-50 p-4 rounded-sm border border-amber-100">
 <Info className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
 <div>
 <h3 className="text-sm font-bold text-amber-900">Karakteristik Waduk (Geometri)</h3>
 <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
 Input hubungan antara elevasi muka air, volume tampungan, dan luas genangan. Data ini merupakan dasar utama (SSOT) untuk seluruh perhitungan kapasitas, routing, dan operasi waduk.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Table Input */}
 <Card className="lg:col-span-5 border-slate-200 dark:border-slate-700">
 <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50 dark:bg-slate-800">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <TableIcon className="w-4 h-4 text-slate-500" />
 <CardTitle className="text-sm">Tabel Curva Kapasitas</CardTitle>
 </div>
 <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleAddRow}>
 <Plus className="w-3 h-3 mr-1" /> Baris
 </Button>
 </div>
 </CardHeader>
 <CardContent className="p-0 max-h-[500px] overflow-auto">
 <table className="w-full text-xs text-left">
 <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold sticky top-0 z-10">
 <tr>
 <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Elevasi (m)</th>
 <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-right">Volume (m³)</th>
 <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-right">Luas (m²)</th>
 <th className="w-10 border-b border-slate-200 dark:border-slate-700"></th>
 </tr>
 </thead>
 <tbody>
 {rows.map((row) => (
 <tr key={row.id} className="hover:bg-slate-50 dark:bg-slate-800 transition-colors group">
 <td className="px-4 py-2 border-b border-slate-100">
 <Input
 type="number"
 value={row.elevation}
 className="h-8 text-xs font-medium border-transparent hover:border-slate-300 dark:border-slate-600 focus:border-pupr-blue bg-transparent"
 onChange={(e) => handleChange(row.id, 'elevation', e.target.value)}
 />
 </td>
 <td className="px-2 py-2 border-b border-slate-100">
 <Input
 type="number"
 value={row.storage}
 className="h-8 text-xs text-right font-medium border-transparent hover:border-slate-300 dark:border-slate-600 focus:border-pupr-blue bg-transparent"
 onChange={(e) => handleChange(row.id, 'storage', e.target.value)}
 />
 </td>
 <td className="px-2 py-2 border-b border-slate-100">
 <Input
 type="number"
 value={row.area}
 className="h-8 text-xs text-right font-medium border-transparent hover:border-slate-300 dark:border-slate-600 focus:border-pupr-blue bg-transparent"
 onChange={(e) => handleChange(row.id, 'area', e.target.value)}
 />
 </td>
 <td className="px-2 py-2 border-b border-slate-100 text-center">
 <Button
 variant="ghost"
 size="icon"
 className="h-7 w-7 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-500"
 onClick={() => handleRemoveRow(row.id)}
 >
 <Trash2 className="w-3 h-3" />
 </Button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </CardContent>
 </Card>

 {/* Chart Visualization */}
 <Card className="lg:col-span-7 border-slate-200 dark:border-slate-700">
 <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50 dark:bg-slate-800">
 <div className="flex items-center gap-2">
 <ChartIcon className="w-4 h-4 text-slate-500" />
 <CardTitle className="text-sm">Visualisasi Lengkung Kapasitas</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="p-6 h-[500px]">
 <ResponsiveContainer width="100%" height="100%">
 <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
 <XAxis
 dataKey="elevation"
 type="number"
 domain={['auto', 'auto']}
 label={{ value: 'Elevasi (m)', position: 'bottom', offset: 0, fontSize: 10, fill: '#64748b' }}
 tick={{ fontSize: 10, fill: '#94a3b8' }}
 axisLine={false}
 tickLine={false}
 />
 <YAxis
 yAxisId="left"
 label={{ value: 'Volume (m³)', angle: -90, position: 'left', fontSize: 10, fill: '#0EA5E9' }}
 tick={{ fontSize: 10, fill: '#0EA5E9' }}
 axisLine={false}
 tickLine={false}
 />
 <YAxis
 yAxisId="right"
 orientation="right"
 label={{ value: 'Luas (m²)', angle: 90, position: 'right', fontSize: 10, fill: '#8B5CF6' }}
 tick={{ fontSize: 10, fill: '#8B5CF6' }}
 axisLine={false}
 tickLine={false}
 />
 <Tooltip
 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
 />
 <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }} />
 <Area
 yAxisId="left"
 type="monotone"
 dataKey="storage"
 name="Volume (m³)"
 fill="#0EA5E9"
 stroke="#0284C7"
 fillOpacity={0.1}
 />
 <Line
 yAxisId="right"
 type="monotone"
 dataKey="area"
 name="Luas Genangan (m²)"
 stroke="#8B5CF6"
 strokeWidth={2}
 dot={{ r: 3 }}
 />
 </ComposedChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>
 </div>
 </div>
 );
};
