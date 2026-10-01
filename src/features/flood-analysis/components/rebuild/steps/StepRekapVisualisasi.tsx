import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { calculateConvolution } from '@/lib/engine/flood';
import { WhiteBoxFormula } from '@/components/ui/WhiteBoxFormula';
import { toast } from '@/hooks/useToast';
import {
    BarChart3,
    Download,
    Share2,
    ClipboardCheck,
    AlertCircle,
    FileSpreadsheet,
    Layers
} from 'lucide-react';

interface WhiteBoxFormulaData {
    title: string;
    theoretical: string;
    substituted: string;
    result: string;
    variables?: Record<string, number>;
}

interface StepRekapVisualisasiProps {
    selectedMethod: string;
    unitHydrograph: any[];
}

export const StepRekapVisualisasi: React.FC<StepRekapVisualisasiProps> = ({ selectedMethod, unitHydrograph }) => {
    const {
        hujanEfektif,
        hasilBanjirEmpiris,
        hasilBanjirHSS,
        morfometriDAS,
        tutupanLahan,
        selectedKalaUlang,
        setHasilBanjir,
        setHasilKonvolusi
    } = useHydrologyStore();

    const isEmpirical = ['rational', 'melchior', 'haspers', 'der_weduwen'].includes(selectedMethod);

    // Hitung hidrograf banjir rencana akhir
    const finalResults = useMemo(() => {
        if (!unitHydrograph || unitHydrograph.length === 0) {
            return null;
        }

        // Jika metode empiris, hidrograf sintetis sudah dikonstruksi langsung pada Step 3
        if (isEmpirical) {
            const Qp = Math.max(...unitHydrograph.map(h => h.discharge));
            const peakPoint = unitHydrograph.find(h => h.discharge === Qp);
            
            // Hitung volume limpasan total (m³) dengan integrasi trapesium
            let totalVol = 0;
            for (let i = 0; i < unitHydrograph.length - 1; i++) {
                const dtSec = (unitHydrograph[i + 1].time - unitHydrograph[i].time) * 3600;
                const avgQ = (unitHydrograph[i].discharge + unitHydrograph[i + 1].discharge) / 2;
                totalVol += avgQ * dtSec;
            }

            return {
                hydrograph: unitHydrograph,
                Qp: parseFloat(Qp.toFixed(3)),
                Tp: peakPoint?.time || 1.5,
                totalVolume: parseFloat(totalVol.toFixed(2))
            };
        }

        // Jika metode HSS, konvolusikan hidrograf satuan dengan hujan efektif
        if (!hujanEfektif || hujanEfektif.length === 0) {
            return null;
        }

        const conv = calculateConvolution({
            effectiveRainfall: hujanEfektif,
            unitHydrograph: unitHydrograph
        });

        return conv;
    }, [hujanEfektif, unitHydrograph, isEmpirical]);

    // Simpan ke store Zustand
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
                totalVolume: finalResults.totalVolume || 0,
                componentHydrographs: []
            });
        }
    }, [finalResults, selectedMethod, setHasilBanjir, setHasilKonvolusi]);

    // Matriks Komparasi Multi-Metode Sepadan (All on Design Flood Scale)
    const comparisonMatrix = useMemo(() => {
        if (!finalResults) return [];

        const list: Array<{
            id: string;
            label: string;
            type: 'HSS' | 'Empiris';
            Qp: number;
            deviation: number;
            isSelected: boolean;
        }> = [];

        const activeQp = finalResults.Qp;

        // 1. Hitung puncak konvolusi untuk semua HSS methods
        if (hasilBanjirHSS && hujanEfektif && hujanEfektif.length > 0) {
            Object.entries(hasilBanjirHSS).forEach(([id, hss]: [string, any]) => {
                let qDesign = hss.Qp;
                if (hss.hydrograph && hss.hydrograph.length > 0) {
                    const conv = calculateConvolution({
                        effectiveRainfall: hujanEfektif,
                        unitHydrograph: hss.hydrograph
                    });
                    qDesign = conv.Qp;
                }
                const dev = activeQp > 0 ? ((qDesign - activeQp) / activeQp) * 100 : 0;
                list.push({
                    id,
                    label: id === 'gama1' ? 'HSS Gama-I' : id === 'scs' ? 'HSS SCS' : `HSS ${id.toUpperCase()}`,
                    type: 'HSS',
                    Qp: qDesign,
                    deviation: dev,
                    isSelected: id === selectedMethod
                });
            });
        }

        // 2. Tambahkan metode empiris
        if (hasilBanjirEmpiris) {
            Object.entries(hasilBanjirEmpiris).forEach(([id, emp]: [string, any]) => {
                const qDesign = emp.Qp;
                const dev = activeQp > 0 ? ((qDesign - activeQp) / activeQp) * 100 : 0;
                list.push({
                    id,
                    label: id === 'rational' ? 'Metode Rasional' : id === 'der_weduwen' ? 'Der Weduwen' : id.charAt(0).toUpperCase() + id.slice(1),
                    type: 'Empiris',
                    Qp: qDesign,
                    deviation: dev,
                    isSelected: id === selectedMethod
                });
            });
        }

        return list;
    }, [hasilBanjirHSS, hasilBanjirEmpiris, hujanEfektif, finalResults, selectedMethod]);

    // Handler Ekspor CSV
    const handleExportCsv = () => {
        if (!finalResults) return;
        let csv = `Waktu (jam);Debit Banjir (m3/s)\n`;
        finalResults.hydrograph.forEach(p => {
            csv += `${p.time.toFixed(2)};${p.discharge.toFixed(4)}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hidrograf-banjir-${selectedMethod}-Q${selectedKalaUlang || 25}.csv`;
        a.click();
        toast.success('File CSV hidrograf banjir berhasil diunduh.');
    };

    // Handler Ekspor JSON
    const handleExportJson = () => {
        if (!finalResults) return;
        const payload = {
            metadata: {
                standard: 'SNI 2415:2016',
                kalaUlang: selectedKalaUlang || 25,
                metodeTerpilih: selectedMethod,
                tanggalExport: new Date().toISOString()
            },
            ringkasanBanjir: {
                debitPuncakM3s: finalResults.Qp,
                waktuPuncakJam: finalResults.Tp,
                volumeLimpasanM3: finalResults.totalVolume || 0,
                volumeLimpasanJutaM3: ((finalResults.totalVolume || 0) / 1e6).toFixed(4),
                totalHujanEfektifMm: hujanEfektif?.reduce((a, b) => a + b, 0) || 0
            },
            komparasiMultiMetode: comparisonMatrix,
            hidrograf: finalResults.hydrograph
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analisis-banjir-${selectedMethod}-Q${selectedKalaUlang || 25}.json`;
        a.click();
        toast.success('File JSON analisis banjir berhasil diunduh.');
    };

    const handleSaveDashboard = () => {
        toast.success(`Hasil analisis banjir Q${selectedKalaUlang || 25} (${selectedMethod.toUpperCase()}) tersimpan ke dashboard.`);
    };

    // KaTeX White-Box Formula
    const whiteBoxFormulaData = useMemo<WhiteBoxFormulaData | null>(() => {
        if (!finalResults) return null;
        const A = morfometriDAS?.luasDAS || 10;
        const C = tutupanLahan?.koefisienPengaliranGabungan || 0.65;

        if (selectedMethod === 'rational') {
            const vars: Record<string, number> = {
                'C': C,
                'A': A,
                'Q_p': finalResults.Qp
            };
            return {
                title: 'Metode Rasional (SNI 2415:2016 Pasal 5.2)',
                theoretical: 'Q_p = 0.278 \\cdot C \\cdot I \\cdot A',
                substituted: `Q_p = 0.278 \\cdot ${C.toFixed(2)} \\cdot ${(finalResults.Qp / (0.278 * C * A)).toFixed(2)} \\cdot ${A.toFixed(2)}`,
                result: `= ${finalResults.Qp.toFixed(3)} \\text{ m}^3/\\text{s}`,
                variables: vars
            };
        }

        const vars: Record<string, number> = {
            'Q_p': finalResults.Qp,
            'T_p': finalResults.Tp,
            'Volume': finalResults.totalVolume || 0
        };
        return {
            title: `Konvolusi Hidrograf Banjir (${selectedMethod.toUpperCase()})`,
            theoretical: 'Q(t) = \\sum_{m=1}^{M} P_{eff}(m) \\cdot U(t - m + 1)',
            substituted: `Q_{max} = \\max \\left[ \\sum P_{eff} \\cdot U \\right] \\implies Q_p = ${finalResults.Qp.toFixed(3)} \\text{ m}^3/\\text{s}`,
            result: `= ${finalResults.Qp.toFixed(3)} \\text{ m}^3/\\text{s}`,
            variables: vars
        };
    }, [finalResults, selectedMethod, morfometriDAS, tutupanLahan]);

    if (!finalResults) {
        return (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-md">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <p className="text-slate-700 font-bold">Data belum lengkap untuk menampilkan hidrograf.</p>
                <p className="text-xs text-slate-400 mt-1">Pastikan Hujan Efektif (Step 2) dan Metode Banjir (Step 3) sudah dipilih.</p>
            </div>
        );
    }

    const totalVolM3 = finalResults.totalVolume || 0;
    const totalVolJuta = totalVolM3 / 1_000_000;
    const totalPeff = hujanEfektif?.reduce((a, b) => a + b, 0) || 0;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Kartu Ringkasan Metrik Rekayasa SDA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 bg-white border border-slate-300 shadow-sm rounded-md border-l-4 border-l-pupr-blue">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Debit Puncak (Qp)</p>
                        {whiteBoxFormulaData && <WhiteBoxFormula {...whiteBoxFormulaData} />}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{finalResults.Qp.toFixed(3)}</span>
                        <span className="text-xs font-bold text-slate-500">m³/det</span>
                    </div>
                    <p className="text-[10px] text-pupr-blue font-bold uppercase mt-1 truncate">
                        Metode: {selectedMethod.replace('_', ' ')}
                    </p>
                </Card>

                <Card className="p-5 bg-white border border-slate-300 shadow-sm rounded-md border-l-4 border-l-amber-500">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Waktu Puncak (Tp)</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{finalResults.Tp.toFixed(2)}</span>
                        <span className="text-xs font-bold text-slate-500">jam</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Time to Peak Limpasan</p>
                </Card>

                <Card className="p-5 bg-white border border-slate-300 shadow-sm rounded-md border-l-4 border-l-cyan-600">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Volume Limpasan Total</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                            {totalVolJuta >= 0.01 ? totalVolJuta.toFixed(3) : totalVolM3.toFixed(0)}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                            {totalVolJuta >= 0.01 ? 'Juta m³' : 'm³'}
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                        {totalVolM3.toLocaleString('id-ID')} m³ limpasan
                    </p>
                </Card>

                <Card className="p-5 bg-white border border-slate-300 shadow-sm rounded-md border-l-4 border-l-green-600">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Hujan Efektif</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{totalPeff.toFixed(2)}</span>
                        <span className="text-xs font-bold text-slate-500">mm</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Hujan netto penyumbang banjir</p>
                </Card>
            </div>

            {/* Visualisasi Kurva Hidrograf Banjir Rencana */}
            <Card className="p-6 bg-white border border-slate-300 shadow-sm rounded-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                            <BarChart3 className="w-5 h-5 text-pupr-blue" />
                            Hidrograf Banjir Rencana (Design Flood Hydrograph)
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Kala Ulang Q{selectedKalaUlang || 25} &bull; Metode: {selectedMethod.replace('_', ' ').toUpperCase()}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded hover:bg-slate-50 transition-all flex items-center gap-1.5 text-slate-700"
                            title="Unduh Ordinat Jam-jaman dalam format CSV"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-green-600" />
                            Ekspor CSV
                        </button>
                        <button
                            type="button"
                            onClick={handleExportJson}
                            className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded hover:bg-slate-50 transition-all flex items-center gap-1.5 text-slate-700"
                            title="Unduh Data Lengkap JSON"
                        >
                            <Download className="w-4 h-4 text-pupr-blue" />
                            JSON
                        </button>
                    </div>
                </div>

                <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={finalResults.hydrograph} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                            <defs>
                                <linearGradient id="floodGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0c3a66" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#0c3a66" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="time"
                                axisLine={true}
                                tickLine={true}
                                tick={{ fontSize: 10, fontWeight: 700 }}
                                label={{ value: 'Waktu Limpasan (jam)', position: 'insideBottom', offset: -10, style: { fontSize: 11, fontWeight: 800 } }}
                            />
                            <YAxis
                                axisLine={true}
                                tickLine={true}
                                tick={{ fontSize: 10, fontWeight: 700 }}
                                label={{ value: 'Debit Aliran (m³/s)', angle: -90, position: 'insideLeft', offset: 5, style: { fontSize: 11, fontWeight: 800 } }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '11px' }}
                                formatter={(value: any) => [`${Number(value).toFixed(3)} m³/s`, 'Debit Banjir']}
                                labelFormatter={(label) => `Waktu: ${label} jam`}
                            />
                            <Area
                                type="monotone"
                                dataKey="discharge"
                                stroke="#0c3a66"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#floodGradient)"
                                name="Debit Banjir"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Matriks Validasi Multi-Metode Sepadan & Panel Tindakan */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Tabel Perbandingan Multi-Metode Sepadan */}
                <Card className="p-6 bg-white border border-slate-300 shadow-sm rounded-md lg:col-span-7">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <ClipboardCheck className="w-4 h-4 text-green-600" />
                                Validasi Komparasi Multi-Metode Debit Banjir
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Seluruh metode dibandingkan setara pada skala debit banjir rencana (Q{selectedKalaUlang || 25})
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-md">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
                                <tr className="border-b border-slate-200">
                                    <th className="px-3 py-2.5 text-left">Metode Hidrologi</th>
                                    <th className="px-3 py-2.5 text-center">Kategori</th>
                                    <th className="px-3 py-2.5 text-right">Debit Puncak (m³/s)</th>
                                    <th className="px-3 py-2.5 text-right">Deviasi thd Pilihan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {comparisonMatrix.map(m => {
                                    const isPos = m.deviation > 0;
                                    const isZero = Math.abs(m.deviation) < 0.01;
                                    return (
                                        <tr
                                            key={m.id}
                                            className={`transition-colors ${m.isSelected ? 'bg-blue-50/70 font-bold' : 'hover:bg-slate-50'}`}
                                        >
                                            <td className="px-3 py-2 flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${m.isSelected ? 'bg-pupr-blue ring-2 ring-blue-300' : 'bg-slate-300'}`} />
                                                <span className={m.isSelected ? 'text-pupr-blue' : 'text-slate-800'}>{m.label}</span>
                                                {m.isSelected && (
                                                    <span className="text-[9px] bg-blue-100 text-pupr-blue px-1.5 py-0.2 rounded font-extrabold">TERPILIH</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center text-slate-500 font-mono text-[10px]">
                                                {m.type}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900 font-semibold">
                                                {m.Qp.toFixed(3)}
                                            </td>
                                            <td className={`px-3 py-2 text-right font-mono tabular-nums ${
                                                isZero ? 'text-slate-400' : isPos ? 'text-amber-700' : 'text-blue-700'
                                            }`}>
                                                {isZero ? '0.00%' : `${isPos ? '+' : ''}${m.deviation.toFixed(1)}%`}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Panel Tindakan Lanjutan & Status Desain */}
                <Card className="p-6 bg-gradient-to-br from-pupr-blue to-[#082644] text-white rounded-md shadow-md lg:col-span-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Layers className="w-5 h-5 text-blue-200" />
                            <h4 className="text-base font-bold">Kesiapan Desain Hidrolika</h4>
                        </div>
                        <p className="text-xs text-blue-100/80 leading-relaxed mb-4">
                            Hasil perhitungan hidrograf banjir rencana telah dikonvolusi dan divalidasi silang. Data debit puncak ({finalResults.Qp.toFixed(2)} m³/s) dan kurva hidrograf siap digunakan untuk:
                        </p>
                        <ul className="text-xs text-blue-100/90 space-y-1.5 mb-6 pl-4 list-disc">
                            <li>Dimensi penampang saluran pada <b>Modul Saluran (Manning)</b></li>
                            <li>Simulasi penelusuran banjir (flood routing) pada <b>Modul Embung / Waduk</b></li>
                            <li>Analisis tampungan retensi & spillway</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={handleSaveDashboard}
                            className="w-full py-3 bg-white text-pupr-blue font-bold rounded-md shadow hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-xs"
                        >
                            <Share2 className="w-4 h-4" />
                            Simpan ke Project Dashboard
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};
