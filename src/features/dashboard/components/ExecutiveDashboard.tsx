import { useRef } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { ButtonGovTech } from '@/components/ui/ButtonGovTech';
import { CardGovTech } from '@/components/ui/CardGovTech';
import { FileText, Printer, AlertTriangle, MapPin, Activity, Calendar } from 'lucide-react';
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
        isNeracaDirty,
        identitasLokasi
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
            description="Laporan akhir kelayakan proyek dari hulu (Banjir) ke hilir (Embung)"
            icon={<FileText className="w-6 h-6" />}
            iconColorClass="bg-pupr-blue text-white"
            actions={
                <ButtonGovTech variant="pupr-accent" onClick={exportToPDF} disabled={isDirty}>
                    <Printer />
                    Cetak Laporan PDF
                </ButtonGovTech>
            }
        >
            {isDirty && (
                <div className="mb-6">
                    <DependencyWarningBanner module="banjir" />
                </div>
            )}

            <div
                ref={targetRef}
                className={`flex-1 flex flex-col gap-6 w-full ${isDirty ? 'opacity-30 pointer-events-none' : ''}`}
            >
                {/* Project Identity Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Project Info */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <CardGovTech title="Identitas Proyek">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-md bg-pupr-blue/10 flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5 text-pupr-blue" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-pupr-text/60 uppercase tracking-wider mb-1">Nama Proyek</p>
                                        <p className="text-sm font-bold text-pupr-text">{identitasLokasi?.namaPekerjaan || 'Belum diatur'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-md bg-pupr-yellow/20 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-pupr-blue" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-pupr-text/60 uppercase tracking-wider mb-1">DAS / Lokasi</p>
                                        <p className="text-sm font-bold text-pupr-text">
                                            {identitasLokasi?.namaDAS ? `DAS ${identitasLokasi.namaDAS}` : 'DAS Belum diatur'}
                                            {identitasLokasi?.provinsi ? `, ${identitasLokasi.provinsi}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-md bg-teal-500/10 flex items-center justify-center shrink-0">
                                        <Activity className="w-5 h-5 text-teal-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-pupr-text/60 uppercase tracking-wider mb-1">Luas DAS Terukur</p>
                                        <p className="text-sm font-bold text-pupr-text tabular-nums tracking-tight">{luasDas ? `${luasDas} km²` : 'Belum diatur'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardGovTech>
                    </div>

                    {/* Card 2: Flood Analysis */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                        <CardGovTech title="Analisis Banjir">
                            <div className="mt-4">
                                <p className="text-5xl font-bold text-pupr-blue tabular-nums tracking-tight mb-2">
                                    {hasilBanjir?.debitPuncak || '0'}
                                </p>
                                <p className="text-sm font-bold text-pupr-text/60 uppercase tracking-wide">m³/s · Debit Puncak</p>
                            </div>
                        </CardGovTech>
                    </div>

                    {/* Card 3: Embung Feasibility */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                        <CardGovTech title="Kelayakan Embung">
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <p className="text-4xl font-bold text-pupr-blue tabular-nums tracking-tight mb-1">{hasilEmbung?.reduksiPuncak || 0}%</p>
                                    <p className="text-xs font-bold text-pupr-text/60 uppercase tracking-wider">Reduksi</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-bold text-pupr-blue tabular-nums tracking-tight mb-1">{hasilEmbung?.umurSedimen || 0}</p>
                                    <p className="text-xs font-bold text-pupr-text/60 uppercase tracking-wider">Tahun</p>
                                </div>
                            </div>
                        </CardGovTech>
                    </div>
                </div>

                {/* Water Balance Chart */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                    <CardGovTech
                        title="Neraca Air Tahunan"
                        subtitle="Ketersediaan vs Kebutuhan Air Irigasi"
                        headerAction={
                            hasilNeraca?.bulanKritis && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-pupr-yellow/20 border border-pupr-yellow rounded-md">
                                    <Calendar className="w-4 h-4 text-pupr-text" />
                                    <span className="text-xs font-bold text-pupr-text uppercase tracking-wider">Kritis: {hasilNeraca.bulanKritis}</span>
                                </div>
                            )
                        }
                    >
                        <div className="w-full h-[300px]">
                            {!isDirty && hasilNeraca?.chartData ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={hasilNeraca.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 600 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 600 }} />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontWeight: 600 }}
                                        />
                                        <ReferenceLine y={0} stroke="currentColor" strokeDasharray="3 3" strokeWidth={2} />
                                        <Bar dataKey="ketersediaan" name="Ketersediaan (Q80)" fill="#0c3a66" radius={[4, 4, 0, 0]} barSize={24} />
                                        <Bar dataKey="kebutuhan" name="Kebutuhan Irigasi" fill="#DC2626" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-pupr-blue/[0.03] rounded-md border border-dashed border-pupr-blue/20">
                                    <AlertTriangle className="w-8 h-8 text-pupr-blue/30 mb-2" />
                                    <p className="text-sm font-bold text-slate-500 text-center px-4">
                                        Data belum lengkap atau belum diproses. Silakan selesaikan input di modul Master Data dan Analisis Banjir.
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardGovTech>
                </div>
            </div>
        </ModuleLayout>
    );
};
