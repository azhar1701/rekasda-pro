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
            description="Laporan akhir kelayakan proyek dari hulu (Banjir) ke hilir (Embung)"
            icon={<FileText className="w-6 h-6" />}
            iconColorClass="bg-primary-50 text-primary-600"
            actions={
                <Button variant="primary" onClick={exportToPDF} disabled={isDirty}>
                    <Printer />
                    Cetak Laporan PDF
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
                className={`flex-1 flex flex-col gap-6 w-full ${isDirty ? 'opacity-30 pointer-events-none' : ''}`}
            >
                {/* Project Identity Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Project Info */}
                    <div className="bg-white border border-neutral-200 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-neutral-900 mb-4">Identitas Proyek</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5 text-neutral-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Stasiun Hujan</p>
                                    <p className="text-sm font-semibold text-neutral-900">{selectedStasiun?.nama_stasiun || 'Belum diatur'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                                    <Activity className="w-5 h-5 text-neutral-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Luas DAS</p>
                                    <p className="text-sm font-semibold text-neutral-900 tabular-nums">{luasDas ? `${luasDas} km²` : 'Belum diatur'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Flood Analysis */}
                    <div className="bg-white border border-neutral-200 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-error-light rounded-lg">
                                <Activity className="w-4 h-4 text-error" />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900">Analisis Banjir</h3>
                        </div>
                        <div className="mt-6">
                            <p className="text-4xl font-bold text-neutral-900 tabular-nums tracking-tight mb-2">
                                {hasilBanjir?.debitPuncak || '0'}
                            </p>
                            <p className="text-sm font-semibold text-neutral-500">m³/s · Debit Puncak</p>
                        </div>
                    </div>

                    {/* Card 3: Embung Feasibility */}
                    <div className="bg-white border border-neutral-200 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-success-light rounded-lg">
                                <CheckCircle className="w-4 h-4 text-success" />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900">Kelayakan Embung</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div>
                                <p className="text-3xl font-bold text-neutral-900 tabular-nums tracking-tight mb-1">{hasilEmbung?.reduksiPuncak || 0}%</p>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Reduksi</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-neutral-900 tabular-nums tracking-tight mb-1">{hasilEmbung?.umurSedimen || 0}</p>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tahun</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Water Balance Chart */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-50 rounded-lg">
                                <Droplets className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-neutral-900">Neraca Air Tahunan</h3>
                                <p className="text-sm text-neutral-500">Ketersediaan vs Kebutuhan Air Irigasi</p>
                            </div>
                        </div>
                        {hasilNeraca?.bulanKritis && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-warning-light border border-warning rounded-lg">
                                <Calendar className="w-4 h-4 text-warning-dark" />
                                <span className="text-xs font-semibold text-warning-dark uppercase tracking-wide">Kritis: {hasilNeraca.bulanKritis}</span>
                            </div>
                        )}
                    </div>

                    <div className="w-full h-[300px]">
                        {!isDirty && hasilNeraca?.chartData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hasilNeraca.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0F2FE" />
                                    <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#0EA5E9' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#0EA5E9' }} />
                                    <Tooltip
                                        cursor={{ fill: '#F0F9FF' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #BAE6FD', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                                    />
                                    <ReferenceLine y={0} stroke="#0EA5E9" strokeDasharray="3 3" />
                                    <Bar dataKey="ketersediaan" name="Ketersediaan (Q80)" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={24} />
                                    <Bar dataKey="kebutuhan" name="Kebutuhan Irigasi" fill="#DC2626" radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                                <AlertTriangle className="w-8 h-8 text-neutral-400 mb-2" />
                                <p className="text-sm font-medium text-neutral-500">Data tidak tersedia</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ModuleLayout>
    );
};
