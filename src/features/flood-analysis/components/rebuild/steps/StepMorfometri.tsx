import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Mountain, Droplets, Info, Save, AlertTriangle, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { toast } from '@/hooks/useToast';

interface StepMorfometriProps {
    onComplete: () => void;
    isCompleted: boolean;
}

export const StepMorfometri: React.FC<StepMorfometriProps> = ({ onComplete }) => {
    const {
        morfometriDAS,
        tutupanLahan,
        luasDas: globalLuasDas,
        panjangSungai: globalPanjangSungai,
        updateMorfometriDAS,
        setLuasDas,
        setPanjangSungai
    } = useHydrologyStore();

    // Inisialisasi dari morfometriDAS atau fallback ke global store
    const [localA, setLocalA] = useState(morfometriDAS?.luasDAS?.toString() || globalLuasDas || '');
    const [localL, setLocalL] = useState(morfometriDAS?.panjangSungai?.toString() || globalPanjangSungai || '');
    const [localS, setLocalS] = useState(morfometriDAS?.kemiringanSungai?.toString() || '0.01');

    // Advanced Gama-I Morfometri
    const [showAdvancedGama, setShowAdvancedGama] = useState(false);
    const [sf, setSf] = useState('0.45');   // Stream Factor
    const [sim, setSim] = useState('0.30'); // Shape Index Mountain
    const [jn, setJn] = useState('3');      // Junction Number
    const [sn, setSn] = useState('0.10');   // Slope Network
    const [rua, setRua] = useState('0.20'); // Relative Upstream Area

    const compositeC = tutupanLahan?.koefisienPengaliranGabungan || 0.65;
    const compositeCN = tutupanLahan?.curveNumberGabungan || 75;

    // SNI boundary check
    const currentA = parseFloat(localA) || 0;

    useEffect(() => {
        if (!localA && globalLuasDas) setLocalA(globalLuasDas);
        if (!localL && globalPanjangSungai) setLocalL(globalPanjangSungai);
    }, [globalLuasDas, globalPanjangSungai]);

    const handleSave = () => {
        const A = parseFloat(localA);
        const L = parseFloat(localL);
        const S = parseFloat(localS);

        if (isNaN(A) || A <= 0) return toast.error('Luas DAS harus valid (> 0 km²)');
        if (isNaN(L) || L <= 0) return toast.error('Panjang Sungai harus valid (> 0 km)');
        if (isNaN(S) || S <= 0) return toast.error('Kemiringan Sungai harus valid (> 0 m/m)');

        updateMorfometriDAS({
            luasDAS: A,
            panjangSungai: L,
            kemiringanSungai: S,
            elevasi: morfometriDAS?.elevasi || 0
        });

        setLuasDas(localA);
        setPanjangSungai(localL);

        toast.success('Karakteristik DAS berhasil disimpan.');
        onComplete();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Banner Informasi */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-pupr-blue mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-700">
                    <p className="font-bold mb-1 text-pupr-blue">Karakteristik Fisik Morfometri DAS (SNI 2415:2016)</p>
                    <p>
                        Parameter dimensi fisik berikut menentukan waktu konsentrasi ($t_c$), kelambatan waktu puncak ($T_g, T_p$),
                        serta batas penerapan metode banjir rencana.
                    </p>
                </div>
            </div>

            {/* Peringatan Batas SNI jika DAS > 3 km² (300 ha) */}
            {currentA > 3 && (
                <div className="bg-amber-50 border border-amber-300 rounded-md p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-800">
                        <p className="font-bold mb-0.5">Catatan Batasan Metode SNI 2415:2016</p>
                        <p>
                            Luas DAS saat ini <b>{currentA.toFixed(2)} km²</b> ({(currentA * 100).toFixed(0)} ha) melampaui batas optimal Metode Rasional (&le; 300 ha).
                            Sistem menyarankan penggunaan <b>HSS Nakayasu, HSS Gama-I, atau HSS SCS</b> pada tahap pemilihan metode.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dimensi Utama */}
                <Card className="p-6 bg-white border border-slate-300 shadow-sm rounded-md">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-slate-100 rounded-md">
                            <Mountain className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Dimensi Utama DAS</h3>
                            <p className="text-[11px] text-slate-500">Parameter geometri sungai & tangkapan air</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-bold text-slate-600 uppercase">Luas DAS (A)</label>
                                <span className="text-[10px] text-slate-400 font-mono">1 km² = 100 ha</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={localA}
                                    onChange={(e) => setLocalA(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-bold tabular-nums focus:ring-1 focus:ring-pupr-blue focus:outline-none"
                                    placeholder="0.00"
                                    step="0.01"
                                />
                                <span className="absolute right-3 top-2 text-slate-400 font-semibold text-sm">km²</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Panjang Sungai Utama (L)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={localL}
                                    onChange={(e) => setLocalL(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-bold tabular-nums focus:ring-1 focus:ring-pupr-blue focus:outline-none"
                                    placeholder="0.00"
                                    step="0.01"
                                />
                                <span className="absolute right-3 top-2 text-slate-400 font-semibold text-sm">km</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 italic">
                                {parseFloat(localL) <= 15 ? 'L ≤ 15 km: Tg dihitung dengan rumus daya 0.21·L^0.7 (SNI 2415)' : 'L > 15 km: Tg dihitung dengan rumus linear 0.4 + 0.058·L'}
                            </p>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-bold text-slate-600 uppercase">Kemiringan Rata-Rata Sungai (S)</label>
                                <span className="text-[10px] text-slate-400 font-mono">0.01 = 1%</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={localS}
                                    onChange={(e) => setLocalS(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-bold tabular-nums focus:ring-1 focus:ring-pupr-blue focus:outline-none"
                                    placeholder="0.01"
                                    step="0.001"
                                />
                                <span className="absolute right-3 top-2 text-slate-400 font-semibold text-sm">m/m</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Koefisien Runoff & Tutupan Lahan */}
                <Card className="p-6 bg-white border border-slate-300 shadow-sm rounded-md flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-green-50 rounded-md">
                                <Droplets className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Koefisien Runoff & Infiltrasi</h3>
                                <p className="text-[11px] text-slate-500">Diambil dari kalibrasi tutupan lahan Master Data</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-600 uppercase">Koefisien Pengaliran (C)</span>
                                    <span className="text-base font-bold text-pupr-blue tabular-nums">{compositeC.toFixed(3)}</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-pupr-blue h-full"
                                        style={{ width: `${Math.min(100, compositeC * 100)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 italic">Digunakan pada Metode Rasional & Hujan Efektif (P·C)</p>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-600 uppercase">Curve Number (CN)</span>
                                    <span className="text-base font-bold text-green-700 tabular-nums">{compositeCN.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-green-600 h-full"
                                        style={{ width: `${Math.min(100, compositeCN)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 italic">Digunakan pada HSS SCS & Abstraksi NRCS Kumulatif</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
                        <Save className="w-3 h-3" />
                        <span>Data morfometri tersinkronisasi otomatis dengan seluruh modul rekayasa.</span>
                    </div>
                </Card>
            </div>

            {/* Panel Advanced: Parameter Morfometri HSS Gama-I (Sri Harto 1993) */}
            <Card className="p-5 bg-slate-50 border border-slate-200 rounded-md">
                <button
                    type="button"
                    onClick={() => setShowAdvancedGama(!showAdvancedGama)}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-pupr-blue transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-pupr-blue" />
                        <span>Parameter Khusus HSS Gama-I (Sri Harto, 1993)</span>
                        <span className="text-[10px] text-slate-400 font-normal">(Opsional / Default Kalibrasi)</span>
                    </div>
                    {showAdvancedGama ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvancedGama && (
                    <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Stream Factor (SF)</label>
                            <input
                                type="number"
                                value={sf}
                                onChange={(e) => setSf(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                                step="0.01"
                            />
                            <p className="text-[9px] text-slate-400 mt-0.5">Faktor percabangan</p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Shape Index (SIM)</label>
                            <input
                                type="number"
                                value={sim}
                                onChange={(e) => setSim(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                                step="0.01"
                            />
                            <p className="text-[9px] text-slate-400 mt-0.5">Indeks bentuk DAS</p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Junction No (JN)</label>
                            <input
                                type="number"
                                value={jn}
                                onChange={(e) => setJn(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                                step="1"
                            />
                            <p className="text-[9px] text-slate-400 mt-0.5">Pertemuan sungai</p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Slope Net (SN)</label>
                            <input
                                type="number"
                                value={sn}
                                onChange={(e) => setSn(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                                step="0.01"
                            />
                            <p className="text-[9px] text-slate-400 mt-0.5">Kemiringan percabangan</p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Upstream Area (RUA)</label>
                            <input
                                type="number"
                                value={rua}
                                onChange={(e) => setRua(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                                step="0.01"
                            />
                            <p className="text-[9px] text-slate-400 mt-0.5">Rasio hulu/total</p>
                        </div>
                    </div>
                )}
            </Card>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="px-8 py-3 bg-pupr-blue hover:bg-pupr-blue/90 text-white font-bold rounded-md shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                    Simpan Karakteristik & Lanjut ke Hietograf →
                </button>
            </div>
        </div>
    );
};
