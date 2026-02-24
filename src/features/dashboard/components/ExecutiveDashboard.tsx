import { useRef } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Button } from '@/components/ui/Button';
import { FileText, Printer, CheckCircle, AlertTriangle, Droplets, MapPin, Activity, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import generatePDF from 'react-to-pdf';

export const ExecutiveDashboard = () => {
    const {
        luasDas,
        selectedStasiun,
        hasilBanjir,
        hasilNeraca,
        hasilEmbung,
        isBanjirDirty,
        isNeracaDirty
    } = useHydrologyStore();

    const targetRef = useRef<HTMLDivElement>(null);

    const isDirty = isBanjirDirty || isNeracaDirty;

    const exportToPDF = () => {
        generatePDF(targetRef, {
            filename: `Executive_Summary_${selectedStasiun?.nama_stasiun || 'RekaSDA'}.pdf`,
            page: { margin: 15 }
        });
    };

    return (
        <ModuleLayout
            title="Executive Summary & Pelaporan"
            description="Laporan akhir kelayakan proyek dari hulu (Banjir) ke hilir (Embung)."
            icon={<FileText className="w-6 h-6" />}
            iconColorClass="bg-indigo-50 text-indigo-600"
            actions={
                <Button
                    onClick={exportToPDF}
                    disabled={isDirty}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all flex items-center gap-2"
                >
                    <Printer className="w-4 h-4" />
                    Cetak Laporan Lengkap (PDF)
                </Button>
            }
        >
            {isDirty && (
                <div className="mb-6">
                    <DependencyWarningBanner module="banjir" />
                </div>
            )}

            <div
                ref={targetRef}
                className={`flex-1 flex flex-col gap-6 w-full ${isDirty ? 'opacity-30 pointer-events-none grayscale-[0.5]' : ''}`}
            >
                {/* Header Kop Surat (Tersembunyi di UI web, tapi masuk PDF jika perlu, atau selalu tampil) */}
                <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3" />

                    {/* Card 1: Identitas Proyek */}
                    <div className="flex flex-col justify-center">
                        <h2 className="text-xl font-extrabold text-slate-800 mb-2">Identitas Proyek</h2>
                        <p className="text-sm text-slate-500 mb-6 max-w-sm">Lembar konfirmasi kelayakan parameter perencanaan sumber daya air.</p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Stasiun Hujan</p>
                                    <p className="text-sm font-semibold text-slate-700">{selectedStasiun?.nama_stasiun || 'Belum diatur'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <Activity className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Luas DAS (Catchment)</p>
                                    <p className="text-sm font-semibold text-slate-700">{luasDas ? `${luasDas} km²` : 'Belum diatur'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Hidrologi Banjir */}
                    <div className="bg-slate-50/80 backdrop-blur border border-slate-100 p-5 rounded-2xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-red-100 text-red-600 rounded-lg"><Activity className="w-4 h-4" /></div>
                                <h3 className="font-bold text-slate-700">Analisis Banjir Rencana</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-4">Mempresentasikan potensi ancaman banjir tertinggi pada kala ulang terpilih.</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-800 mb-1">
                                {hasilBanjir?.debitPuncak || '0'} <span className="text-lg font-medium text-slate-500">m³/s</span>
                            </p>
                            <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Debit Puncak Aktual</p>
                        </div>
                    </div>

                    {/* Card 4: Kelayakan Embung */}
                    <div className="bg-teal-50/50 backdrop-blur border border-teal-100 p-5 rounded-2xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-teal-100 text-teal-600 rounded-lg"><CheckCircle className="w-4 h-4" /></div>
                                <h3 className="font-bold text-slate-700">Kelayakan Embung</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-4">Kinerja mitigasi waduk dan durabilitas penampungan sedimen jangka panjang.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-2xl font-black text-teal-700 mb-1">{hasilEmbung?.reduksiPuncak}%</p>
                                <p className="text-[10px] font-bold text-teal-600/70 uppercase tracking-wider">Reduksi Puncak</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-700 mb-1">{hasilEmbung?.umurSedimen} <span className="text-sm font-medium text-slate-500">Thn</span></p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Umur Guna</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Grafik Neraca Air (Bento Span Full) */}
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col min-h-[350px]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Droplets className="w-5 h-5" /></div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Neraca Air Tahunan</h3>
                                <p className="text-xs text-slate-500">Perbandingan probabilitas Ketersediaan vs Kebutuhan air irigasi.</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="flex items-center justify-end gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold uppercase tracking-wider">Bulan Kritis: {hasilNeraca?.bulanKritis}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[250px]">
                        {!isDirty && hasilNeraca?.chartData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hasilNeraca.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <ReferenceLine y={0} stroke="#94a3b8" />
                                    <Bar dataKey="ketersediaan" name="Ketersediaan (Q80)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="kebutuhan" name="Kebutuhan Irigasi" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm font-medium">Data grafik disembunyikan karena status parameter kotor (Dirty State).</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </ModuleLayout>
    );
};
