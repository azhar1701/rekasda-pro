import React, { useState, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Zap, AlertTriangle, CloudRain } from 'lucide-react';
import { type HyetographResult } from '@/lib/engine/flood/mononobe';
import { useHydrologyStore } from '@/stores/useHydrologyStore';

interface Props {
    /** R24 design rainfall (mm) — from frequency analysis or manual input */
    r24?: number;
}

export const HyetographGenerator: React.FC<Props> = ({ r24: r24Prop }) => {
    const { curahHujanRencana } = useHydrologyStore();

    // Effective R24: prop override → store → manual input
    const r24Store = parseFloat(curahHujanRencana) || 0;
    const [r24Local, setR24Local] = useState<string>('');
    const r24Effective = r24Prop ?? ((r24Local !== '' ? parseFloat(r24Local) : r24Store) || 0);

    const [durasi, setDurasi] = useState(6);
    const [result, setResult] = useState<HyetographResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = useCallback(async () => {
        setError(null);
        setIsGenerating(true);
        try {
            if (r24Effective <= 0) {
                throw new Error('Hujan harian rencana (R₂₄) harus > 0 mm.');
            }
            const response = await fetch('http://localhost:8000/api/v1/hujan/abm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    r24: r24Effective,
                    duration: durasi
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Gagal generate hyetograph di Python Engine');
            }

            const res: HyetographResult = await response.json();
            setResult(res);
        } catch (err: any) {
            setError(err.message || 'Gagal generate hyetograph.');
            setResult(null);
        } finally {
            setIsGenerating(false);
        }
    }, [r24Effective, durasi]);

    // Chart data
    const chartData = useMemo(() => {
        if (!result) return [];
        return result.rows.map(r => ({
            name: `${r.jam}`,
            hujan: r.abm,
            isPeak: r.jam === result.jamPuncak,
        }));
    }, [result]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white/95 backdrop-blur-md p-3 rounded-md shadow-sm border border-slate-200 text-xs">
                    <p className="font-bold text-slate-800 mb-1">Jam ke-{data.name}</p>
                    <p className="text-pupr-blue font-semibold font-mono">{data.hujan.toFixed(2)} mm</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-md shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-200/50 bg-white/40 flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-pupr-blue" />
                <div>
                    <h3 className="text-sm font-bold text-slate-800">Distribusi Hujan Jam-jaman</h3>
                    <p className="text-[10px] text-slate-500">Metode Mononobe + Alternating Block Method (ABM)</p>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Input row */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">R₂₄ (Hujan Rencana)</label>
                        <div className="relative">
                            <input
                                type="number"
                                step={1}
                                value={r24Prop !== undefined ? r24Prop : (r24Local !== '' ? r24Local : (r24Store > 0 ? String(r24Store) : ''))}
                                placeholder={r24Store > 0 ? String(r24Store) : 'mm'}
                                disabled={r24Prop !== undefined}
                                onChange={e => setR24Local(e.target.value)}
                                className="w-full h-10 px-3 pr-10 text-sm bg-white border border-slate-200 rounded-md font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">mm</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Durasi Hujan (T)</label>
                        <div className="relative">
                            <select
                                value={durasi}
                                onChange={e => setDurasi(parseInt(e.target.value))}
                                className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-md font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            >
                                {[3, 4, 5, 6, 7, 8, 10, 12, 24].map(d => (
                                    <option key={d} value={d}>{d} jam</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full h-10 bg-pupr-blue text-white text-white rounded-md font-bold text-xs hover:from-blue-700 hover:to-cyan-700 active:from-blue-800 active:to-cyan-800 transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Zap className="w-3.5 h-3.5" />
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-md">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-800 font-medium">{error}</p>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="space-y-4">
                        {/* Summary stats */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-blue-50/50 rounded-md p-3 text-center border border-blue-100">
                                <div className="text-[9px] font-bold text-pupr-blue uppercase">Total Hujan</div>
                                <div className="text-lg font-bold text-blue-700 font-mono">{result.totalHujan}</div>
                                <div className="text-[9px] text-pupr-blue">mm</div>
                            </div>
                            <div className="bg-cyan-50/50 rounded-md p-3 text-center border border-cyan-100">
                                <div className="text-[9px] font-bold text-cyan-400 uppercase">Jam Puncak</div>
                                <div className="text-lg font-bold text-cyan-700 font-mono">Jam {result.jamPuncak}</div>
                                <div className="text-[9px] text-cyan-400">dari {result.durasi} jam</div>
                            </div>
                            <div className="bg-indigo-50/50 rounded-md p-3 text-center border border-indigo-100">
                                <div className="text-[9px] font-bold text-pupr-blue uppercase">Hujan Puncak</div>
                                <div className="text-lg font-bold text-indigo-700 font-mono">{result.hujanPuncak}</div>
                                <div className="text-[9px] text-pupr-blue">mm</div>
                            </div>
                        </div>

                        {/* Chart + Table side by side */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                            {/* Bar Chart */}
                            <div className="lg:col-span-3 bg-white rounded-md border border-slate-200 p-4">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Hyetograph (ABM)</h4>
                                <div className="h-52">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                                                axisLine={{ stroke: '#cbd5e1' }}
                                                label={{ value: 'Jam', position: 'insideBottom', offset: -2, style: { fill: '#94a3b8', fontSize: 9, fontWeight: 700 } }}
                                            />
                                            <YAxis
                                                tick={{ fill: '#64748b', fontSize: 10 }}
                                                axisLine={{ stroke: '#cbd5e1' }}
                                                label={{ value: 'Hujan (mm)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 9, fontWeight: 700 } }}
                                            />
                                            <Tooltip itemStyle={{ fontVariantNumeric: "tabular-nums" }} content={<CustomTooltip />} />
                                            <ReferenceLine y={0} stroke="#94a3b8" />
                                            <Bar dataKey="hujan" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                                {chartData.map((entry, index) => (
                                                    <Cell
                                                        key={index}
                                                        fill={entry.isPeak ? '#2563eb' : '#3b82f6'}
                                                        fillOpacity={entry.isPeak ? 1 : 0.7}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Ordinate Table */}
                            <div className="lg:col-span-2 bg-white rounded-md border border-slate-200 overflow-hidden">
                                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase">Tabel Ordinat</h4>
                                </div>
                                <div className="overflow-y-auto max-h-52">
                                    <table className="w-full text-[10px]">
                                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                            <tr>
                                                <th className="py-1.5 px-2 text-center font-bold text-slate-600">Jam</th>
                                                <th className="py-1.5 px-2 text-right font-bold text-slate-600">I (mm/hr)</th>
                                                <th className="py-1.5 px-2 text-right font-bold text-slate-600">Kum. (mm)</th>
                                                <th className="py-1.5 px-2 text-right font-bold text-slate-600">Inkr. (mm)</th>
                                                <th className="py-1.5 px-2 text-right font-bold text-pupr-blue bg-blue-50/50">ABM (mm)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.rows.map((r) => (
                                                <tr
                                                    key={r.jam}
                                                    className={`border-b border-slate-100 ${r.jam === result.jamPuncak ? 'bg-blue-50/40 font-bold' : 'even:bg-slate-50/30'}`}
                                                >
                                                    <td className="py-1.5 px-2 text-center font-bold text-slate-700 tabular-nums tracking-tight">{r.jam}</td>
                                                    <td className="py-1.5 px-2 text-right font-mono text-slate-600 tabular-nums tracking-tight">{r.intensitas.toFixed(2)}</td>
                                                    <td className="py-1.5 px-2 text-right font-mono text-slate-600 tabular-nums tracking-tight">{r.kumulatif.toFixed(2)}</td>
                                                    <td className="py-1.5 px-2 text-right font-mono text-slate-600 tabular-nums tracking-tight">{r.inkremental.toFixed(2)}</td>
                                                    <td className={`py-1.5 px-2 text-right font-mono font-bold bg-blue-50/30 ${r.jam === result.jamPuncak ? 'text-blue-700' : 'text-pupr-blue'
                                                        }`}>
                                                        {r.abm.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-300">
                                            <tr>
                                                <td className="py-1.5 px-2 text-center font-bold text-slate-700 tabular-nums tracking-tight" colSpan={4}>Total</td>
                                                <td className="py-1.5 px-2 text-right font-mono font-bold text-blue-700 bg-blue-50/50 tabular-nums tracking-tight">
                                                    {result.totalHujan.toFixed(2)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
