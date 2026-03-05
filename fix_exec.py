with open("src/features/dashboard/components/ExecutiveDashboard.tsx", "w") as f:
    f.write("""import { useRef } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { ButtonGovTech } from '@/components/ui/ButtonGovTech';
import { CardGovTech } from '@/components/ui/CardGovTech';
import { TableGovTech } from '@/components/ui/TableGovTech';
import { FileText, Printer, AlertTriangle, MapPin, Activity, Calendar, Waves, Droplets, CloudRain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import generatePDF from 'react-to-pdf';

export const ExecutiveDashboard = () => {
    const {
        luasDas,
        selectedStasiun,
        hasilBanjir,
        hasilNeraca,
        hasilEmbung,
        neracaFinal,
        hasilAnalisisFrekuensi,
        isBanjirDirty,
        isNeracaDirty,
        identitasLokasi
    } = useHydrologyStore();

    const targetRef = useRef<HTMLDivElement>(null);
    const isDirty = isBanjirDirty || isNeracaDirty;

    const exportToPDF = () => {
        generatePDF(targetRef, {
            filename: `Executive_Summary_${identitasLokasi?.namaPekerjaan || 'RekaSDA'}.pdf`,
            page: { margin: 15 }
        });
    };

    return (
        <ModuleLayout
            title="Executive Summary & Pelaporan"
            description="Laporan akhir kelayakan proyek dari hulu (Banjir) ke hilir (Neraca & Embung)"
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
                className={`flex-1 flex flex-col gap-6 w-full pb-8 ${isDirty ? 'opacity-30 pointer-events-none' : ''}`}
            >
                {/* 1. Project Identity Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CardGovTech title="Identitas Proyek">
                        <div className="space-y-4 mt-2">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-md bg-pupr-surface flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4 text-pupr-blue" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-pupr-text/60 uppercase tracking-wider mb-0.5">Nama Proyek</p>
                                    <p className="text-sm font-bold text-pupr-text leading-tight">{identitasLokasi?.namaPekerjaan || 'Belum diatur'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-md bg-pupr-surface flex items-center justify-center shrink-0">
                                    <MapPin className="w-4 h-4 text-pupr-blue" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-pupr-text/60 uppercase tracking-wider mb-0.5">Lokasi / DAS</p>
                                    <p className="text-sm font-bold text-pupr-text leading-tight">
                                        {identitasLokasi?.namaDAS ? `DAS ${identitasLokasi.namaDAS}` : '-'}
                                        {identitasLokasi?.provinsi ? `, ${identitasLokasi.provinsi}` : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-md bg-pupr-surface flex items-center justify-center shrink-0">
                                    <Activity className="w-4 h-4 text-pupr-blue" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-pupr-text/60 uppercase tracking-wider mb-0.5">Luas DAS</p>
                                    <p className="text-sm font-bold text-pupr-text tabular-nums">{luasDas ? `${parseFloat(luasDas).toFixed(2)} km²` : '-'}</p>
                                </div>
                            </div>
                        </div>
                    </CardGovTech>

                    <CardGovTech title="Analisis Banjir">
                        <div className="mt-4 flex flex-col h-full justify-center">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                                    <CloudRain className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Metode Terpilih</p>
                                    <p className="text-sm font-bold text-slate-900">{hasilBanjir?.method || hasilAnalisisFrekuensi?.metodeTerpilih || 'Belum dihitung'}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-4xl font-black text-red-600 tabular-nums tracking-tight mb-1">
                                    {hasilBanjir?.debitPuncak?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">m³/s · Debit Puncak Rencana</p>
                            </div>
                        </div>
                    </CardGovTech>

                    <CardGovTech title="Neraca Air & Embung">
                        <div className="mt-4 flex flex-col h-full justify-center">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <Droplets className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Tahunan</p>
                                    <p className={`text-sm font-bold ${hasilNeraca?.isSurplus ? 'text-emerald-700' : 'text-rose-600'}`}>
                                        {hasilNeraca ? (hasilNeraca.isSurplus ? 'Surplus' : 'Defisit') : 'Belum dihitung'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-2xl font-black text-emerald-600 tabular-nums tracking-tight">
                                        {hasilNeraca?.totalSurplusDefisit ? (hasilNeraca.totalSurplusDefisit > 0 ? '+' : '') + hasilNeraca.totalSurplusDefisit.toFixed(1) : '0.0'}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">m³/s · Total Saldo</p>
                                </div>
              
