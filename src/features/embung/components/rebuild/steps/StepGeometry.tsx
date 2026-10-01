import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { Plus, Trash2, Info, AreaChart as ChartIcon, Table as TableIcon } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line, ReferenceLine } from 'recharts';

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

    // Zoning state (SNI 03-3432-1994)
    const sortedElevs = rows.map(r => r.elevation).sort((a, b) => a - b);
    const minElev = sortedElevs[0] ?? 100;
    const maxElev = sortedElevs[sortedElevs.length - 1] ?? 105;

    const [deadStorageElev, setDeadStorageElev] = useState<number>(
        state.zoning?.deadStorageElevation ?? (sortedElevs[1] ?? minElev + 1)
    );
    const [normalWaterLevel, setNormalWaterLevel] = useState<number>(
        state.zoning?.normalWaterLevel ?? (sortedElevs[sortedElevs.length - 2] ?? maxElev - 1)
    );
    const [freeboard, setFreeboard] = useState<number>(
        state.zoning?.freeboard ?? 1.0
    );

    // Auto-save to store & calculate zoning
    useEffect(() => {
        const sortedRows = [...rows].sort((a, b) => a.elevation - b.elevation);
        const elevations = sortedRows.map(r => r.elevation);
        const storages = sortedRows.map(r => r.storage);
        const areas = sortedRows.map(r => r.area);

        const curve = {
            elevation: elevations,
            storage: storages,
            area: areas
        };

        dispatch({
            type: 'SET_STAGE_STORAGE_CURVE',
            payload: curve
        });

        // Calculate volumes via interpolation
        const interpolateVol = (h: number) => {
            if (elevations.length === 0) return 0;
            if (h <= elevations[0]) return storages[0];
            if (h >= elevations[elevations.length - 1]) return storages[storages.length - 1];
            for (let i = 0; i < elevations.length - 1; i++) {
                if (h >= elevations[i] && h <= elevations[i + 1]) {
                    const factor = (h - elevations[i]) / (elevations[i + 1] - elevations[i]);
                    return storages[i] + factor * (storages[i + 1] - storages[i]);
                }
            }
            return 0;
        };

        const deadStorageVol = Math.round(interpolateVol(deadStorageElev));
        const normalVol = Math.round(interpolateVol(normalWaterLevel));
        const activeStorageVol = Math.max(0, normalVol - deadStorageVol);
        const totalStorageVol = storages[storages.length - 1] ?? 0;

        dispatch({
            type: 'SET_ZONING',
            payload: {
                riverbedElevation: minElev,
                deadStorageElevation: deadStorageElev,
                normalWaterLevel: normalWaterLevel,
                floodWaterLevel: normalWaterLevel + 1.0, // default placeholder until routing is run
                freeboard: freeboard,
                deadStorageVolume: deadStorageVol,
                activeStorageVolume: activeStorageVol,
                floodStorageVolume: Math.max(0, totalStorageVol - normalVol),
                totalStorageVolume: totalStorageVol
            }
        });

        // Set initial spillway config if not set
        if (!state.spillwayConfig) {
            dispatch({
                type: 'SET_SPILLWAY_CONFIG',
                payload: {
                    crestElevation: normalWaterLevel,
                    crestLength: 10.0,
                    dischargeCoefficient: 2.0,
                    spillwayType: 'ogee'
                }
            });
        }
    }, [rows, deadStorageElev, normalWaterLevel, freeboard, dispatch, minElev, state.spillwayConfig]);

    const chartData = [...rows].sort((a, b) => a.elevation - b.elevation);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex items-start gap-4 bg-amber-50 p-4 rounded-lg border border-amber-100">
                <Info className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
                <div>
                    <h3 className="text-sm font-bold text-amber-900">Karakteristik Waduk & Zonasi Tampungan (SNI 03-3432-1994)</h3>
                    <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                        Input hubungan antara elevasi muka air, volume tampungan, dan luas genangan. Tentukan pula elevasi Muka Air Rendah (MAD) dan Muka Air Normal (MAN) sebagai acuan SSOT untuk analisis penelusuran banjir, sedimentasi, dan neraca operasi.
                    </p>
                </div>
            </div>

            {/* Zoning Parameters Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-3 border-slate-200 bg-white">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Dasar Sungai (Riverbed)
                    </span>
                    <p className="text-lg font-bold text-slate-700">{minElev.toFixed(2)} <span className="text-xs font-normal text-slate-400">m asl</span></p>
                </Card>
                <Card className="p-3 border-amber-200 bg-amber-50/40">
                    <label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                        Muka Air Rendah (MAD)
                    </label>
                    <div className="flex items-center gap-1">
                        <Input
                            type="number"
                            step="0.1"
                            value={deadStorageElev}
                            onChange={(e) => setDeadStorageElev(parseFloat(e.target.value) || minElev)}
                            className="h-8 text-sm font-bold text-amber-900 border-amber-300 bg-white"
                        />
                        <span className="text-xs font-medium text-amber-700 shrink-0">m asl</span>
                    </div>
                </Card>
                <Card className="p-3 border-blue-200 bg-blue-50/40">
                    <label className="text-[10px] font-bold text-pupr-blue uppercase tracking-wider block mb-1">
                        Mercu Pelimpah (MAN)
                    </label>
                    <div className="flex items-center gap-1">
                        <Input
                            type="number"
                            step="0.1"
                            value={normalWaterLevel}
                            onChange={(e) => setNormalWaterLevel(parseFloat(e.target.value) || maxElev)}
                            className="h-8 text-sm font-bold text-pupr-blue border-blue-300 bg-white"
                        />
                        <span className="text-xs font-medium text-blue-700 shrink-0">m asl</span>
                    </div>
                </Card>
                <Card className="p-3 border-emerald-200 bg-emerald-50/40">
                    <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                        Tinggi Jagaan (Freeboard)
                    </label>
                    <div className="flex items-center gap-1">
                        <Input
                            type="number"
                            step="0.1"
                            value={freeboard}
                            onChange={(e) => setFreeboard(parseFloat(e.target.value) || 1.0)}
                            className="h-8 text-sm font-bold text-emerald-900 border-emerald-300 bg-white"
                        />
                        <span className="text-xs font-medium text-emerald-700 shrink-0">m</span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Table Input */}
                <Card className="lg:col-span-5 border-slate-200">
                    <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TableIcon className="w-4 h-4 text-slate-400" />
                                <CardTitle className="text-sm">Tabel Curva Kapasitas</CardTitle>
                            </div>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleAddRow}>
                                <Plus className="w-3 h-3 mr-1" /> Baris
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 max-h-[500px] overflow-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 border-b border-slate-200">Elevasi (m)</th>
                                    <th className="px-2 py-3 border-b border-slate-200 text-right">Volume (m³)</th>
                                    <th className="px-2 py-3 border-b border-slate-200 text-right">Luas (m²)</th>
                                    <th className="w-10 border-b border-slate-200"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-2 border-b border-slate-100">
                                            <Input
                                                type="number"
                                                value={row.elevation}
                                                className="h-8 text-xs font-medium border-transparent hover:border-slate-300 focus:border-pupr-blue bg-transparent"
                                                onChange={(e) => handleChange(row.id, 'elevation', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-2 border-b border-slate-100">
                                            <Input
                                                type="number"
                                                value={row.storage}
                                                className="h-8 text-xs text-right font-medium border-transparent hover:border-slate-300 focus:border-pupr-blue bg-transparent"
                                                onChange={(e) => handleChange(row.id, 'storage', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-2 border-b border-slate-100">
                                            <Input
                                                type="number"
                                                value={row.area}
                                                className="h-8 text-xs text-right font-medium border-transparent hover:border-slate-300 focus:border-pupr-blue bg-transparent"
                                                onChange={(e) => handleChange(row.id, 'area', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-2 border-b border-slate-100 text-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500"
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
                <Card className="lg:col-span-7 border-slate-200">
                    <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <ChartIcon className="w-4 h-4 text-slate-400" />
                            <CardTitle className="text-sm">Visualisasi Lengkung Kapasitas & Garis Elevasi Acuan</CardTitle>
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
                                    label={{ value: 'Elevasi (m asl)', position: 'bottom', offset: 0, fontSize: 10, fill: '#64748b' }}
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
                                
                                {deadStorageElev && (
                                    <ReferenceLine
                                        yAxisId="left"
                                        x={Number(deadStorageElev)}
                                        stroke="#f59e0b"
                                        strokeDasharray="4 4"
                                        strokeWidth={1.5}
                                        label={{ value: `MAD (${deadStorageElev}m)`, position: 'insideTopLeft', fontSize: 10, fill: '#b45309' }}
                                    />
                                )}
                                {normalWaterLevel && (
                                    <ReferenceLine
                                        yAxisId="left"
                                        x={Number(normalWaterLevel)}
                                        stroke="#0284c7"
                                        strokeDasharray="4 4"
                                        strokeWidth={1.5}
                                        label={{ value: `MAN (${normalWaterLevel}m)`, position: 'insideTopLeft', fontSize: 10, fill: '#0369a1' }}
                                    />
                                )}

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

