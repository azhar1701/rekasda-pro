import React, { useState, useCallback } from 'react';
import { Collapsible } from '@/components/ui/Collapsible';
import { AlertTriangle, Zap } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import {
    generateDefaultIrrigationInput,
    DEFAULT_KC,
    DEFAULT_PERKOLASI,
    type IrrigationMonthlyInput,
    type IrrigationMonthlyResult,
    type PolaTanam,
    type NeracaAirFinalRow,
} from '@/lib/engine/irrigationDemand'; // Keeping types and defaults

const POLA_OPTIONS: { value: PolaTanam; label: string }[] = [
    { value: 'padi', label: 'Padi' },
    { value: 'palawija', label: 'Palawija' },
    { value: 'bero', label: 'Bero' },
];

interface Props {
    monthlySupply: number[]; // 12 values (m³/s) — from Mock or manual
    onNeracaCalculated?: (neraca: NeracaAirFinalRow[]) => void;
}

export const KalkulatorIrigasi: React.FC<Props> = ({ monthlySupply, onNeracaCalculated }) => {
    const { setNeracaFinal } = useHydrologyStore();

    // Irrigation params
    const [luasIrigasi, setLuasIrigasi] = useState(100);
    const [efisiensi, setEfisiensi] = useState(0.65);

    // 12-month irrigation matrix
    const [irrData, setIrrData] = useState<IrrigationMonthlyInput[]>(
        generateDefaultIrrigationInput()
    );

    // Raw water
    const [populasi, setPopulasi] = useState(5000);
    const [standarDomestik, setStandarDomestik] = useState(100);
    const [industri, setIndustri] = useState(0);

    // Results
    const [irrResults, setIrrResults] = useState<IrrigationMonthlyResult[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const updateMonth = (index: number, field: keyof IrrigationMonthlyInput, value: any) => {
        setIrrData(prev => {
            const updated = [...prev];
            const row = { ...updated[index], [field]: value };
            // Auto-update Kc and perkolasi when pola tanam changes
            if (field === 'polaTanam') {
                const pola = value as PolaTanam;
                row.kc = DEFAULT_KC[pola];
                row.perkolasi = DEFAULT_PERKOLASI[pola];
                if (pola === 'bero') { row.wlr = 0; row.kc = 0; }
            }
            updated[index] = row;
            return updated;
        });
    };

    const [isCalculating, setIsCalculating] = useState(false);

    const handleCalculate = useCallback(async () => {
        setError(null);
        setIsCalculating(true);
        try {
            // 1. Calculate irrigation demand via API
            const irrResponse = await fetch('http://localhost:8000/api/v1/neraca-air/kebutuhan-irigasi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    luas_irigasi: luasIrigasi,
                    efisiensi,
                    data: irrData
                })
            });

            if (!irrResponse.ok) {
                const errorData = await irrResponse.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Gagal menghitung Kebutuhan Irigasi');
            }
            const irr: IrrigationMonthlyResult[] = await irrResponse.json();
            setIrrResults(irr);

            const irrigationDR = irr.map(r => r.dr);

            // 2. Calculate Final Water Balance via API (combines raw water & final comparison)
            const neracaResponse = await fetch('http://localhost:8000/api/v1/neraca-air/neraca-air', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supply: monthlySupply,
                    irrigation_dr: irrigationDR,
                    populasi: populasi,
                    standar_domestik: standarDomestik,
                    industri_m3s: industri
                })
            });

            if (!neracaResponse.ok) {
                const errorData = await neracaResponse.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Gagal menghitung Neraca Air Final');
            }

            const neraca: NeracaAirFinalRow[] = await neracaResponse.json();

            // 4. Save to store
            setNeracaFinal(neraca);
            onNeracaCalculated?.(neraca);
        } catch (err: any) {
            setError(err.message || 'Perhitungan API gagal.');
        } finally {
            setIsCalculating(false);
        }
    }, [luasIrigasi, efisiensi, irrData, populasi, standarDomestik, industri, monthlySupply, setNeracaFinal, onNeracaCalculated]);

    return (
        <div className="space-y-4">
            {/* Irrigation Parameters */}
            <Collapsible title="Kebutuhan Irigasi (KP-01)" defaultOpen={true} badge="SNI 6728.1:2015">
                <div className="space-y-4">
                    {/* Global params */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Luas Irigasi</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={luasIrigasi}
                                    onChange={e => setLuasIrigasi(parseFloat(e.target.value) || 0)}
                                    className="w-full h-10 px-3 pr-10 text-sm bg-white border border-slate-200 rounded-md font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">Ha</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Efisiensi Irigasi</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step={0.05}
                                    value={efisiensi}
                                    onChange={e => setEfisiensi(parseFloat(e.target.value) || 0)}
                                    className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-md font-semibold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 12-month matrix — compact scrollable */}
                    <div className="overflow-x-auto overflow-y-auto max-h-72 border border-slate-200 rounded-md bg-white">
                        <table className="w-full text-[10px]">
                            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                <tr>
                                    <th className="py-2 px-2 text-left font-bold text-slate-600 whitespace-nowrap">Bln</th>
                                    <th className="py-2 px-2 text-center font-bold text-slate-600 whitespace-nowrap">Pola</th>
                                    <th className="py-2 px-2 text-center font-bold text-slate-600 whitespace-nowrap">Kc</th>
                                    <th className="py-2 px-2 text-center font-bold text-slate-600 whitespace-nowrap">P</th>
                                    <th className="py-2 px-2 text-center font-bold text-slate-600 whitespace-nowrap">WLR</th>
                                    <th className="py-2 px-2 text-center font-bold text-slate-600 whitespace-nowrap">Reff</th>
                                    <th className="py-2 px-2 text-center font-bold text-slate-600 whitespace-nowrap">ETo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {irrData.map((row, i) => (
                                    <tr key={i} className={`border-b border-slate-100 ${row.polaTanam === 'bero' ? 'bg-slate-50/50 opacity-60' : ''}`}>
                                        <td className="py-1.5 px-2 font-bold text-slate-700 tabular-nums tracking-tight">{row.month}</td>
                                        <td className="py-1.5 px-1 tabular-nums tracking-tight">
                                            <select
                                                value={row.polaTanam}
                                                onChange={e => updateMonth(i, 'polaTanam', e.target.value)}
                                                className="w-full h-7 px-1 text-[10px] bg-white border border-slate-200 rounded font-semibold outline-none focus:border-blue-500"
                                            >
                                                {POLA_OPTIONS.map(o => (
                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        {(['kc', 'perkolasi', 'wlr', 'rpiEfektif', 'eto'] as const).map(field => (
                                            <td key={field} className="py-1.5 px-0.5">
                                                <input
                                                    type="number"
                                                    step={0.1}
                                                    value={row[field]}
                                                    onChange={e => updateMonth(i, field, parseFloat(e.target.value) || 0)}
                                                    disabled={row.polaTanam === 'bero' && field !== 'eto'}
                                                    className="w-14 h-7 px-1 text-[10px] bg-white border border-slate-200 rounded text-center font-mono font-semibold outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Collapsible>

            {/* Raw Water Demand */}
            <Collapsible title="Air Baku (Domestik & Industri)" defaultOpen={true}>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Populasi</label>
                        <input
                            type="number"
                            value={populasi}
                            onChange={e => setPopulasi(parseFloat(e.target.value) || 0)}
                            className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-md font-semibold text-right focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[9px] text-slate-400 mt-0.5 block">jiwa</span>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Standar</label>
                        <input
                            type="number"
                            value={standarDomestik}
                            onChange={e => setStandarDomestik(parseFloat(e.target.value) || 0)}
                            className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-md font-semibold text-right focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[9px] text-slate-400 mt-0.5 block">L/org/hari</span>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Industri</label>
                        <input
                            type="number"
                            step={0.001}
                            value={industri}
                            onChange={e => setIndustri(parseFloat(e.target.value) || 0)}
                            className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-md font-semibold text-right focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[9px] text-slate-400 mt-0.5 block">m³/s</span>
                    </div>
                </div>
            </Collapsible>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-md">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-800 font-medium">{error}</p>
                </div>
            )}

            <button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="w-full min-h-[44px] py-3 bg-pupr-blue text-white text-white rounded-md font-bold hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Zap className="w-5 h-5" />
                {isCalculating ? 'Menghitung via Engine...' : 'Hitung Neraca Air Final'}
            </button>

            {/* Irrigation Results Summary (compact) */}
            {irrResults && (
                <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Ringkasan DR Irigasi (m³/s)</span>
                    <div className="grid grid-cols-4 gap-1.5">
                        {irrResults.map((r, i) => (
                            <div key={i} className={`text-center py-1.5 rounded ${r.dr > 0 ? 'bg-white border border-slate-200' : 'bg-slate-100'}`}>
                                <div className="text-[9px] font-bold text-slate-400">{r.month}</div>
                                <div className={`text-xs font-bold font-mono ${r.dr > 0 ? 'text-teal-700' : 'text-slate-400'}`}>
                                    {r.dr > 0 ? r.dr.toFixed(4) : '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
