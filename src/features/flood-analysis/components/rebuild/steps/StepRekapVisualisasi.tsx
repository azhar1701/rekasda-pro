import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { calculateConvolution } from '@/lib/engine/flood';
import { BarChart3, Download, Share2, ClipboardCheck, AlertCircle } from 'lucide-react';

interface StepRekapVisualisasiProps {
    selectedMethod: string;
    unitHydrograph: any[];
}

export const StepRekapVisualisasi: React.FC<StepRekapVisualisasiProps> = ({ selectedMethod, unitHydrograph }) => {
    const {
        hujanEfektif,
        hasilBanjirEmpiris,
        hasilBanjirHSS,
        setHasilBanjir,
        setHasilKonvolusi
    } = useHydrologyStore();

    const finalResults = useMemo(() => {
        if (!hujanEfektif || hujanEfektif.length === 0 || !unitHydrograph || unitHydrograph.length === 0) {
            return null;
        }

        const conv = calculateConvolution({
            effectiveRainfall: hujanEfektif,
            unitHydrograph: unitHydrograph
        });

        return conv;
    }, [hujanEfektif, unitHydrograph]);

    // Save to store when calculated
    React.useEffect(() => {
        if (finalResults) {
            setHasilBanjir({
                method: selectedMethod,
                debitPuncak: finalResults.Qp,
                hidrograf: finalResults.hydrograph.map(p => ({ time: p.time, inflow: p.discharge }))
            });
            setHasilKonvolusi({
                floodHydrograph: finalResults.hydrograph,
                peakDischarge: finalResults.Qp,
                timeToPeak: finalResults.Tp,
                totalVolume: 0, // Could be calculated
                componentHydrographs: []
            });
        }
    }, [finalResults, selectedMethod, setHasilBanjir, setHasilKonvolusi]);

    if (!finalResults) {
        return (
            <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Data tidak lengkap untuk konvolusi.</p>
                <p className="text-xs text-slate-400">Pastikan Hujan Efektif dan HSS sudah dipilih.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Metric Cards */}
                <Card className="p-6 bg-white border border-slate-300 shadow-sm rounded-md border-l-4 border-l-pupr-blue">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Debit Puncak (Qp)</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{finalResults.Qp.toFixed(3)}</span>
                        <span className="text-sm font-bold text-slate-500">m³/det</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase transition-all">Metode: {selectedMethod.replace('_', ' ')}</p>
                </Card>

                <Card className="p-6 bg-white border border-slate-300 shadow-sm rounded-md border-l-4 border-l-amber-500">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Waktu Puncak (Tp)</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{finalResults.Tp.toFixed(2)}</span>
                        <span className="text-sm font-bold text-slate-500">jam</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Time to Peak</p>
                </Card>

                <Card className="p-6 bg-white border border-slate-300 shadow-sm rounded-md border-l-4 border-l-green-600">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Hujan Efektif</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                            {hujanEfektif?.reduce((a: number, b: number) => a + b, 0).toFixed(2)}
                        </span>
                        <span className="text-sm font-bold text-slate-500">mm</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Input Konvolusi</p>
                </Card>
            </div>

            <Card className="p-6 bg-white border border-slate-300 shadow-sm rounded-md">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900 flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-pupr-blue" />
                        Hidrograf Banjir Rencana
                    </h3>
                    <div className="flex gap-2">
                        <button className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-all">
                            <Download className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={finalResults.hydrograph}>
                            <defs>
                                <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0c3a66" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#0c3a66" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="time"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700 }}
                                label={{ value: 'Waktu (jam)', position: 'insideBottom', offset: -5, style: { fontSize: 11, fontWeight: 800 } }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700 }}
                                label={{ value: 'Debit (m³/s)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fontWeight: 800 } }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.95)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="discharge"
                                stroke="currentColor"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorQ)"
                                name="Debit Banjir"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-white border border-slate-300 shadow-sm rounded-md">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-green-600" />
                        Validasi Perbandingan Puncak (Qp)
                    </h4>
                    <div className="overflow-hidden border border-slate-100 rounded-md">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-100">
                                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Metode</th>
                                    <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase">Deb. Puncak (m³/s)</th>
                                    <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase">Deviasi (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hasilBanjirHSS && Object.entries(hasilBanjirHSS).map(([id, hss]: [string, any]) => (
                                    <tr key={id} className={`border-b border-slate-50 last:border-0 ${id === selectedMethod ? 'bg-pupr-blue/5 font-bold' : ''}`}>
                                        <td className="px-4 py-3 flex items-center gap-2 capitalize">
                                            <div className={`w-1.5 h-1.5 rounded-full ${id === selectedMethod ? 'bg-pupr-blue' : 'bg-slate-300'}`} />
                                            {id}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">{hss.Qp.toFixed(3)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                                            {(((hss.Qp - finalResults.Qp) / finalResults.Qp) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                                {hasilBanjirEmpiris && Object.entries(hasilBanjirEmpiris).map(([id, emp]: [string, any]) => (
                                    <tr key={id} className={`border-b border-slate-50 last:border-0 ${id === selectedMethod ? 'bg-pupr-blue/5 font-bold' : ''}`}>
                                        <td className="px-4 py-3 flex items-center gap-2 capitalize italic text-slate-500">
                                            <div className={`w-1.5 h-1.5 rounded-full bg-slate-200`} />
                                            {id} (Empiris)
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">{emp.Qp.toFixed(3)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                                            -
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card className="p-6 bg-pupr-blue text-white rounded-md shadow-lg flex flex-col justify-center items-center text-center">
                    <ClipboardCheck className="w-12 h-12 mb-4 opacity-50" />
                    <h4 className="text-lg font-bold mb-2">Analisis Siap Digunakan</h4>
                    <p className="text-xs text-blue-100/70 mb-6 px-6">Hasil analisis banjir rencana telah dikonvolusi dan divalidasi dengan multi-metode. Anda dapat mengunduh laporan PDF atau melanjutkan ke analisis tampungan embung.</p>
                    <div className="flex gap-3 w-full max-w-xs">
                        <button className="flex-1 py-3 bg-white text-pupr-blue font-bold rounded-md flex items-center justify-center gap-2 text-xs">
                            <Download className="w-4 h-4" /> PDF Report
                        </button>
                        <button className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-md flex items-center justify-center gap-2 text-xs">
                            <Share2 className="w-4 h-4" /> Simpan DASH
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};
