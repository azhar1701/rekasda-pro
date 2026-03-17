import { useRef } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { FileText, Printer, MapPin, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, ClipboardCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import generatePDF from 'react-to-pdf';
import { CHART_COLORS } from '@/lib/constants/chartColors';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  InfoProperty,
  ActionableEmptyState
} from '@/components/ui/govtech';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';

export const ExecutiveDashboard = () => {
  const {
    luasDas,
    selectedStasiun,
    hasilBanjir,
    hasilNeraca,
    hasilEmbung,
    hasilKonvolusi,
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
      sniCode="SNI 2415:2016 & Pd T-07-2004-A"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="rounded-sm font-bold text-xs uppercase border-slate-200">
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Reset
          </Button>
          <Button variant="pupr-accent" onClick={exportToPDF} disabled={isDirty || !hasAnyData} className="rounded-sm font-bold text-xs">
            <Printer className="w-3.5 h-3.5 mr-2" />
            Export PDF
          </Button>
        </div>
      }
    >
      <div className="space-y-8 pb-12 page-enter relative z-10">
        <ProjectContextBanner />

        {isDirty && (
          <div className="mb-6">
            <DependencyWarningBanner module="banjir" />
          </div>
        )}

        {!hasAnyData ? (
          <div className="flex-1 flex flex-col items-center justify-center py-32 bg-white border border-slate-100 rounded-sm">
            <ActionableEmptyState
              title="Laporan Masih Kosong"
              description="Belum ada data analisis yang cukup untuk menghasilkan ringkasan eksekutif. Mulailah dengan mendefinisikan Data Master dan parameter hidrologi."
              actionLabel="Konfigurasi Data Master"
              onAction={() => {
                const event = new CustomEvent('navigateToTab', { detail: '/master' });
                window.dispatchEvent(event);
              }}
            />
          </div>
        ) : (
          <div ref={targetRef} className={`space-y-10 ${isDirty ? 'opacity-30 pointer-events-none' : ''}`}>
            
            {/* --- Top Metrics KPI Strip --- */}
            <header className="grid grid-cols-2 md:grid-cols-4 gap-8 border-b border-slate-200 pb-8">
              <div className="space-y-1">
                <p className="text-4xl font-light text-slate-900 tracking-tighter tabular-nums">
                  {typeof luasDas === 'number' ? luasDas.toFixed(2) : '0.00'}
                  <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase">km²</span>
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Luas DAS</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-light text-pupr-blue tracking-tighter tabular-nums">
                  {typeof hasilBanjir?.debitPuncak === 'number' ? hasilBanjir.debitPuncak.toFixed(2) : '0.00'}
                  <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase">m³/s</span>
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Qp Banjir</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-light text-emerald-600 tracking-tighter tabular-nums">
                  {typeof hasilEmbung?.reduksiPuncak === 'number' ? hasilEmbung.reduksiPuncak : 0}
                  <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase">%</span>
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reduksi Puncak</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 mt-2 truncate">
                  {hasilNeraca?.bulanKritis || 'Status Aman'}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Neraca</p>
              </div>
            </header>

            {/* --- High Density Workstation Body --- */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              
              {/* Sidebar: Identity & Metadata */}
              <aside className="lg:col-span-1 space-y-10">
                <section className="space-y-6">
                  <header className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue" />
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identitas Proyek</h3>
                  </header>
                  <div className="space-y-4">
                    <InfoProperty label="Nama Pekerjaan" value={identitasLokasi?.namaPekerjaan} icon={<ClipboardCheck />} />
                    <InfoProperty 
                      label="Titik Lokasi" 
                      value={identitasLokasi?.namaDAS ? `DAS ${identitasLokasi.namaDAS}` : undefined} 
                      icon={<MapPin />} 
                    />
                    <div className="pt-2 border-t border-slate-50">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Provinsi/Wilayah</p>
                      <p className="text-xs font-bold text-slate-700 mt-1">{identitasLokasi?.provinsi || '-'}</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <header className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue" />
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Audit Kesiapan</h3>
                  </header>
                  <div className="space-y-3">
                    {[
                      { label: 'Data Master', status: !!identitasLokasi?.namaPekerjaan },
                      { label: 'Analisis Banjir', status: !!hasilBanjir },
                      { label: 'Analisis Embung', status: !!hasilEmbung },
                      { label: 'Analisis Neraca', status: !!hasilNeraca }
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between group">
                        <span className="text-xs text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{item.label}</span>
                        {item.status ? 
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : 
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        }
                      </div>
                    ))}
                  </div>
                </section>

                <div className="bg-slate-50 border border-slate-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-pupr-blue" />
                    <span className="text-[10px] font-bold text-pupr-blue uppercase tracking-widest">SNI Compliance</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Seluruh perhitungan telah diverifikasi terhadap standar PUPR dan SNI yang berlaku untuk infrastruktur sumber daya air.
                  </p>
                </div>
              </aside>

              {/* Main Area: Technical Summary & Charts */}
              <main className="lg:col-span-3 space-y-12">
                
                {/* Visualizations Section */}
                <section className="space-y-6">
                  <header className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm bg-pupr-blue" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Kinerja Neraca Air Tahunan</h3>
                    </div>
                    {hasilNeraca?.bulanKritis && (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-sm text-[9px] font-bold uppercase tracking-widest">
                        Kritis: {hasilNeraca.bulanKritis}
                      </span>
                    )}
                  </header>

                  <Card className="rounded-sm border-slate-200">
                    <div className="p-4">
                      <div className="h-72 w-full">
                        {!isDirty && hasilNeraca?.chartData ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hasilNeraca.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="bulan" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} 
                                dy={10} 
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} 
                              />
                              <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ 
                                  borderRadius: '0px', 
                                  border: '1px solid #e2e8f0', 
                                  boxShadow: 'none', 
                                  fontWeight: 600,
                                  fontSize: '11px'
                                }}
                                labelStyle={{ color: '#0c3a66', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}
                              />
                              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                              <Bar dataKey="ketersediaan" name="Ketersediaan (Q80)" fill={CHART_COLORS.primary} radius={[1, 1, 0, 0]} barSize={20} />
                              <Bar dataKey="kebutuhan" name="Kebutuhan Irigasi" fill={CHART_COLORS.danger} radius={[1, 1, 0, 0]} barSize={20} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400 italic text-[10px] font-medium uppercase tracking-widest">
                            Menunggu Kelengkapan Data Neraca...
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </section>

                {/* Sub-summaries Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                  <section className="space-y-4">
                    <header className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue" />
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analisis Banjir</h3>
                    </header>
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline border-b border-slate-50 pb-2">
                        <span className="text-xs text-slate-500">Debit Puncak Rancangan</span>
                        <span className="text-sm font-bold text-slate-900 tabular-nums">{hasilBanjir?.debitPuncak || '0.00'} m³/s</span>
                      </div>
                      <div className="flex justify-between items-baseline border-b border-slate-50 pb-2">
                        <span className="text-xs text-slate-500">Volume Total</span>
                        <span className="text-sm font-bold text-slate-900 tabular-nums">{hasilKonvolusi?.totalVolume?.toFixed(0) || '0'} m³</span>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <header className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kapasitas Embung</h3>
                    </header>
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline border-b border-slate-50 pb-2">
                        <span className="text-xs text-slate-500">Efisiensi Reduksi Redamen</span>
                        <span className="text-sm font-bold text-emerald-600 tabular-nums">{hasilEmbung?.reduksiPuncak || 0}%</span>
                      </div>
                      <div className="flex justify-between items-baseline border-b border-slate-50 pb-2">
                        <span className="text-xs text-slate-500">Estimasi Umur Layanan</span>
                        <span className="text-sm font-bold text-slate-900 tabular-nums">{hasilEmbung?.umurSedimen || 50} Tahun</span>
                      </div>
                    </div>
                  </section>
                </div>
              </main>
            </div>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
};
