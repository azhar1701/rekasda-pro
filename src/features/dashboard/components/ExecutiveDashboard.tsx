import { useRef } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { FileText, Printer, MapPin, Activity, Calendar, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import generatePDF from 'react-to-pdf';
import { CHART_COLORS } from '@/lib/constants/chartColors';
import {
 ButtonGovTech,
 CardGovTech,
 StaggeredReveal,
 InfoProperty,
 MetricCard,
 ActionableEmptyState
} from '@/components/ui/govtech';

export const ExecutiveDashboard = () => {
 const {
 luasDas,
 selectedStasiun,
 hasilBanjir,
 hasilNeraca,
 hasilEmbung,
 isBanjirDirty,
 isNeracaDirty,
 identitasLokasi,
 resetAll
 } = useHydrologyStore();

 const handleReset = () => {
 if (window.confirm('⚠️ KONFIRMASI RESET: Anda yakin ingin menghapus seluruh parameter input (DAS, Landuse, Hietograf) dan hasil analisis? \n\nNOTE: Database Stasiun dan Matriks Data Hujan (Master Data) TETAP TERSIMPAN.')) {
 resetAll();
 }
 };

 const targetRef = useRef<HTMLDivElement>(null);
 const isDirty = isBanjirDirty || isNeracaDirty;
 const hasAnyData = identitasLokasi?.namaPekerjaan || hasilBanjir || hasilNeraca || hasilEmbung;

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
 sniCode="SNI 2415:2016 & Pd T-07-2004-A"
 actions={
 <div className="flex gap-3">
 <ButtonGovTech variant="ghost" onClick={handleReset}>
 <RefreshCw />
 Reset Global
 </ButtonGovTech>
 <ButtonGovTech variant="pupr-accent" onClick={exportToPDF} disabled={isDirty || !hasAnyData}>
 <Printer />
 Cetak Laporan PDF
 </ButtonGovTech>
 </div>
 }
 >
 {isDirty && (
 <div className="mb-6">
 <DependencyWarningBanner module="banjir" />
 </div>
 )}

 {!hasAnyData ? (
 <div className="flex-1 flex flex-col items-center justify-center p-12">
 <ActionableEmptyState
 title="Belum Ada Laporan Tersedia"
 description="Dashboard ini merangkum seluruh hasil analisis Anda. Mulailah dengan mengisi Identitas Lokasi dan Data Master untuk melihat ringkasan eksekutif di sini."
 actionLabel="Mulai dari Data Master"
 onAction={() => {
 const event = new CustomEvent('navigateToTab', { detail: '/master' });
 window.dispatchEvent(event);
 }}
 />
 </div>
 ) : (
 <div
 ref={targetRef}
 className={`flex-1 flex flex-col gap-6 w-full ${isDirty ? 'opacity-30 pointer-events-none' : ''}`}
 >
 {/* Project Identity Cards */}
 <StaggeredReveal className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Project Info */}
        <CardGovTech title="Identitas Proyek" accentColor="pupr">
 <div className="space-y-4">
 <InfoProperty
 label="Nama Proyek"
 value={identitasLokasi?.namaPekerjaan}
 icon={<FileText />}
 />
 <InfoProperty
 label="DAS / Lokasi"
 value={
 identitasLokasi?.namaDAS
 ? `DAS ${identitasLokasi.namaDAS}${identitasLokasi.provinsi ? `, ${identitasLokasi.provinsi}` : ''}`
 : undefined
 }
 icon={<MapPin />}
 iconColorClass="text-pupr-blue"
 />
 <InfoProperty
 label="Luas DAS Terukur"
 value={luasDas ? `${luasDas} km²` : undefined}
 icon={<Activity />}
 iconColorClass="text-teal-600"
 />
 </div>
 </CardGovTech>

 {/* Card 2: Flood Analysis */}
 <MetricCard
 title="Analisis Banjir"
 value={hasilBanjir?.debitPuncak || '0'}
 unit="m³/s · Debit Puncak"
 variant="blue"
 showShimmer={true}
 />

 {/* Card 3: Embung Feasibility */}
 <MetricCard
 title="Reduksi Banjir"
 value={hasilEmbung?.reduksiPuncak || 0}
 unit="% · Efektivitas"
 variant="teal"
 subtitle={`Umur Sedimen: ${hasilEmbung?.umurSedimen || 0} Tahun`}
 />
 </StaggeredReveal>

 {/* Water Balance Chart */}
 <StaggeredReveal
 className="w-full"
 baseDelay={300}
 >
 <CardGovTech
 title="Neraca Air Tahunan"
 subtitle="Ketersediaan vs Kebutuhan Air Irigasi"
 headerAction={
 hasilNeraca?.bulanKritis && (
 <div className="flex items-center gap-2 px-3 py-1.5 bg-pupr-yellow/20 border border-pupr-yellow rounded-sm">
 <Calendar className="w-4 h-4 text-pupr-text" />
 <span className="text-xs font-bold text-pupr-text uppercase tracking-wider">Kritis: {hasilNeraca.bulanKritis}</span>
 </div>
 )
 }
 >
 <div className="w-full h-[300px]">
 {!isDirty && hasilNeraca?.chartData ? (
 <div className="w-full h-full"> {/* Wrap to prevent animation logic conflicts */}
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
<Bar dataKey="ketersediaan" name="Ketersediaan (Q80)" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} barSize={24} />
<Bar dataKey="kebutuhan" name="Kebutuhan Irigasi" fill={CHART_COLORS.danger} radius={[4, 4, 0, 0]} barSize={24} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 ) : (
 <ActionableEmptyState
 title="Analisis Neraca Air Belum Siap"
 description="Data belum lengkap atau belum diproses. Silakan selesaikan input di modul Master Data dan Analisis Banjir."
 />
 )}
 </div>
 </CardGovTech>
 </StaggeredReveal>
 </div>
 )}
 </ModuleLayout>
 );
};
