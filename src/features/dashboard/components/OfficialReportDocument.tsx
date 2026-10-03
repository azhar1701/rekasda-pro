import React from 'react';
import { ExecutiveReportPayload } from '../types/report.types';
import { MethodologyBox } from './MethodologyBox';
import { 
  Building2, 
  MapPin, 
  Activity, 
  Calendar, 
  CloudRain, 
  Waves, 
  Droplets, 
  ShieldCheck
} from 'lucide-react';

interface Props {
  report: ExecutiveReportPayload;
}

const formatNum = (val: any, decimals = 2, fallback = '-'): string => {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return fallback;
  return num.toFixed(decimals);
};

const formatInt = (val: any, fallback = '-'): string => {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return fallback;
  return Math.round(num).toLocaleString('id-ID');
};

export const OfficialReportDocument: React.FC<Props> = ({ report }) => {
  const { 
    kop, 
    identitas, 
    frekuensi, 
    banjir, 
    neraca, 
    embung, 
    saluran, 
    rekomendasiTeknis, 
    aiSummary,
    sectionsConfig 
  } = report;

  return (
    <div className="print-container bg-white text-slate-900 font-sans p-6 sm:p-10 max-w-[210mm] mx-auto shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0">
      
      {/* =====================================================================
          KOP SURAT DOKUMEN RESMI
          ===================================================================== */}
      {sectionsConfig.showKop && (
        <div className="border-b-4 border-slate-900 border-double pb-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Logo Lambang Rekayasa SDA */}
            <div className="w-16 h-16 shrink-0 rounded-full border-2 border-slate-900 flex items-center justify-center bg-amber-50">
              <Building2 className="w-9 h-9 text-slate-900" />
            </div>

            <div className="flex-1 text-center pr-16 sm:pr-20">
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900">
                {kop.instansi}
              </h2>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                {kop.balai}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-600 font-medium mt-0.5">
                Sistem Informasi & Rekayasa Sumber Daya Air Terpadu (RekaSDA Pro - SNI Compliant)
              </p>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-300 flex flex-wrap items-center justify-between text-xs font-semibold text-slate-700">
            <div>
              <span className="text-slate-500 font-normal">Nomor Dokumen: </span>
              <span className="font-mono font-bold text-slate-900">{kop.nomorDokumen}</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500 font-normal">Tanggal: </span>
                <span className="font-bold text-slate-900">{kop.tanggalDokumen}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                kop.statusDokumen === 'FINAL' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {kop.statusDokumen}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          JUDUL DOKUMEN LAPORAN
          ===================================================================== */}
      <div className="text-center my-6">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
          LAPORAN RINGKASAN EKSEKUTIF
        </h1>
        <p className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-widest mt-1">
          STUDI KELAYAKAN TEKNIS HIDROLOGI & DESAIN INFRASTRUKTUR AIR
        </p>
        <div className="w-24 h-1 bg-[#0c3a66] mx-auto mt-2 rounded-full"></div>
      </div>

      {/* =====================================================================
          BAGIAN 1: IDENTITAS PROYEK & MORFOMETRI DAS
          ===================================================================== */}
      {sectionsConfig.showIdentitas && (
        <section className="mb-6 print-avoid-break">
          <div className="bg-slate-100 px-3 py-1.5 border-l-4 border-[#0c3a66] mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#0c3a66]" />
              1. Identitas Proyek & Karakteristik Wilayah Sungai (DAS)
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">SNI 2415:2016</span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div className="border-b border-slate-200 pb-1 flex justify-between">
              <span className="text-slate-500">Nama Pekerjaan:</span>
              <span className="font-bold text-slate-900 text-right">{identitas.namaPekerjaan}</span>
            </div>
            <div className="border-b border-slate-200 pb-1 flex justify-between">
              <span className="text-slate-500">Nama Wilayah DAS:</span>
              <span className="font-bold text-slate-900 text-right">{identitas.namaDAS || '-'}</span>
            </div>
            <div className="border-b border-slate-200 pb-1 flex justify-between">
              <span className="text-slate-500">Provinsi / Wilayah:</span>
              <span className="font-bold text-slate-900 text-right">{identitas.provinsi || '-'}</span>
            </div>
            <div className="border-b border-slate-200 pb-1 flex justify-between">
              <span className="text-slate-500">Kabupaten / Kota:</span>
              <span className="font-bold text-slate-900 text-right">{identitas.kabupaten || '-'}</span>
            </div>
            <div className="border-b border-slate-200 pb-1 flex justify-between">
              <span className="text-slate-500">Luas Daerah Aliran (DAS):</span>
              <span className="font-bold text-slate-900 text-right">
                {identitas.luasDas ? `${identitas.luasDas} km²` : '-'}
              </span>
            </div>
            <div className="border-b border-slate-200 pb-1 flex justify-between">
              <span className="text-slate-500">Panjang Sungai Utama:</span>
              <span className="font-bold text-slate-900 text-right">
                {identitas.panjangSungai ? `${formatNum(identitas.panjangSungai, 2)} km` : '-'}
              </span>
            </div>
            <div className="border-b border-slate-200 pb-1 flex justify-between">
              <span className="text-slate-500">Waktu Konsentrasi (tc):</span>
              <span className="font-bold text-slate-900 text-right">
                {identitas.waktuKonsentrasi ? `${formatNum(identitas.waktuKonsentrasi, 2)} jam` : '-'}
              </span>
            </div>
            <div className="border-b border-slate-200 pb-1 flex justify-between">
              <span className="text-slate-500">Koefisien Limpasan:</span>
              <span className="font-bold text-slate-900 text-right">
                {identitas.koefisienLimpasan ? `${formatNum(identitas.koefisienLimpasan, 2)} (C/CN)` : '-'}
              </span>
            </div>
            {identitas.latitude !== undefined && identitas.longitude !== undefined && (
              <div className="col-span-2 border-b border-slate-200 pb-1 flex justify-between">
                <span className="text-slate-500">Titik Koordinat (Geografis):</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatNum(identitas.latitude, 6)}, {formatNum(identitas.longitude, 6)}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =====================================================================
          BAGIAN 2: ANALISIS FREKUENSI CURAH HUJAN (SNI 2415:2016)
          ===================================================================== */}
      {sectionsConfig.showFrekuensi && frekuensi && (
        <section className="mb-6 print-avoid-break">
          <div className="bg-slate-100 px-3 py-1.5 border-l-4 border-indigo-600 mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <CloudRain className="w-3.5 h-3.5 text-indigo-600" />
              2. Analisis Frekuensi Curah Hujan Rencana (R24)
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">SNI 2415:2016</span>
          </div>

          <MethodologyBox metodologiKey={frekuensi.metodologiKey || frekuensi.metodeTerpilih || 'GUMBEL'} />

          <div className="flex flex-wrap items-center justify-between text-xs mb-2">
            <div>
              <span className="text-slate-500">Metode Distribusi Terpilih: </span>
              <span className="font-bold text-slate-900">{frekuensi.metodeTerpilih || 'Gumbel'}</span>
            </div>
            <div>
              <span className="text-slate-500">Uji Kesesuaian Statistik: </span>
              <span className={`font-bold ${frekuensi.lulusUji ? 'text-emerald-700' : 'text-amber-700'}`}>
                {frekuensi.lulusUji ? 'Memenuhi Syarat (Lulus Uji)' : 'Perlu Kalibrasi Lanjutan'}
              </span>
            </div>
          </div>

          {frekuensi.curahHujanRencana && frekuensi.curahHujanRencana.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-1.5 px-3">Kala Ulang (Tr)</th>
                    {frekuensi.curahHujanRencana.map((item, idx) => (
                      <th key={idx} className="py-1.5 px-3 text-right">
                        {item.Tr} Tahun
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="py-1.5 px-3 font-semibold text-slate-800">Curah Hujan R24 (mm)</td>
                    {frekuensi.curahHujanRencana.map((item, idx) => (
                      <td key={idx} className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatNum(item.R24, 1)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =====================================================================
          BAGIAN 3: ANALISIS DEBIT BANJIR RANCANGAN
          ===================================================================== */}
      {sectionsConfig.showBanjir && banjir && (
        <section className="mb-6 print-avoid-break print-page-break-before">
          <div className="bg-slate-100 px-3 py-1.5 border-l-4 border-red-600 mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-red-600" />
              3. Analisis Debit Banjir Rancangan
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">SNI 2415:2016</span>
          </div>

          <MethodologyBox metodologiKey={banjir.metodologiKey || banjir.metode || 'RASIONAL'} />

          <div className="grid grid-cols-3 gap-3 mb-3 text-center">
            <div className="border border-slate-200 p-2.5 rounded bg-slate-50/50">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Debit Puncak Desain</span>
              <span className="text-base font-extrabold text-red-700 font-mono">
                {formatNum(banjir.debitPuncak, 2)} <span className="text-xs font-normal">m³/s</span>
              </span>
            </div>
            <div className="border border-slate-200 p-2.5 rounded bg-slate-50/50">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Waktu ke Puncak (tp)</span>
              <span className="text-base font-extrabold text-slate-900 font-mono">
                {formatNum(banjir.waktuPuncak, 2)} <span className="text-xs font-normal">jam</span>
              </span>
            </div>
            <div className="border border-slate-200 p-2.5 rounded bg-slate-50/50">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Metode Hidrologi</span>
              <span className="text-sm font-extrabold text-slate-800">
                {banjir.metode || 'Rasional / HSS'}
              </span>
            </div>
          </div>

          {banjir.returnPeriods && banjir.returnPeriods.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-1.5 px-3">Kala Ulang</th>
                    {banjir.returnPeriods.map((rp, idx) => (
                      <th key={idx} className="py-1.5 px-3 text-right">Tr {rp.period} Th</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="py-1.5 px-3 font-semibold text-slate-800">Debit Banjir Q (m³/s)</td>
                    {banjir.returnPeriods.map((rp, idx) => (
                      <td key={idx} className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatNum(rp.qPeak, 2)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =====================================================================
          BAGIAN 4: NERACA AIR BULANAN & KETERSEDIAAN AIR
          ===================================================================== */}
      {sectionsConfig.showNeraca && neraca && (
        <section className="mb-6 print-avoid-break print-page-break-before">
          <div className="bg-slate-100 px-3 py-1.5 border-l-4 border-emerald-600 mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              4. Neraca Sumber Daya Air Bulanan
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">SNI 19-6728.1-2002</span>
          </div>

          <MethodologyBox metodologiKey={neraca.metodologiKey || 'FJ_MOCK'} />

          <div className="flex items-center justify-between text-xs mb-2">
            <div>
              <span className="text-slate-500">Status Tahunan: </span>
              <span className={`font-bold ${neraca.netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {neraca.netBalance >= 0 ? 'SURPLUS' : 'DEFISIT'} ({neraca.netBalance >= 0 ? '+' : ''}{formatNum(neraca.netBalance, 1)} m³/s)
              </span>
            </div>
            <div>
              <span className="text-slate-500">Bulan Kritis: </span>
              <span className="font-bold text-amber-700">{neraca.bulanKritis || 'Agustus'}</span>
            </div>
            {neraca.ikaPercent !== undefined && (
              <div>
                <span className="text-slate-500">Indeks Kerapuhan Air (IKA): </span>
                <span className="font-mono font-bold text-slate-900">{formatNum(neraca.ikaPercent, 1)}%</span>
              </div>
            )}
          </div>

          {neraca.monthlyRows && neraca.monthlyRows.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded print:overflow-visible print:border-slate-300">
              <table className="w-full text-xs text-left print:text-[8pt] border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 print:bg-slate-50">
                  <tr>
                    <th className="py-1.5 px-2 print:py-1 print:px-1">Bulan</th>
                    {neraca.monthlyRows.map((r, idx) => (
                      <th key={idx} className="py-1.5 px-1.5 text-center text-[10px] print:text-[7.5pt] print:py-1 print:px-0.5">{String(r.bulan || '').substring(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                  <tr>
                    <td className="py-1 px-2 font-medium text-slate-600 print:py-0.5 print:px-1">Andalan (m³/s)</td>
                    {neraca.monthlyRows.map((r, idx) => (
                      <td key={idx} className="py-1 px-1.5 text-center font-mono text-[10px] print:text-[7.5pt] print:py-0.5 print:px-0.5 text-slate-800">
                        {formatNum(r.ketersediaan, 1)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1 px-2 font-medium text-slate-600 print:py-0.5 print:px-1">Kebutuhan (m³/s)</td>
                    {neraca.monthlyRows.map((r, idx) => (
                      <td key={idx} className="py-1 px-1.5 text-center font-mono text-[10px] print:text-[7.5pt] print:py-0.5 print:px-0.5 text-slate-800">
                        {formatNum(r.kebutuhan, 1)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/70 font-semibold print:bg-slate-100/50">
                    <td className="py-1 px-2 font-bold text-slate-700 print:py-0.5 print:px-1">Neraca (m³/s)</td>
                    {neraca.monthlyRows.map((r, idx) => (
                      <td key={idx} className={`py-1 px-1.5 text-center font-mono text-[10px] print:text-[7.5pt] print:py-0.5 print:px-0.5 font-bold ${
                        r.neraca >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {r.neraca >= 0 ? '+' : ''}{formatNum(r.neraca, 1)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =====================================================================
          BAGIAN 5: INFRASTRUKTUR SITU & EMBUNG (PD T-03-2005-A)
          ===================================================================== */}
      {sectionsConfig.showEmbung && embung && (
        <section className="mb-6 print-avoid-break">
          <div className="bg-slate-100 px-3 py-1.5 border-l-4 border-teal-600 mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5 text-teal-600" />
              5. Evaluasi Kinerja Situ & Embung
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">Pd T-03-2005-A</span>
          </div>

          <MethodologyBox metodologiKey={embung.metodologiKey || 'ROUTING_EMBUNG'} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="border border-slate-200 p-2.5 rounded bg-slate-50/50">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Reduksi Puncak</span>
              <span className="text-base font-extrabold text-teal-700 font-mono">
                {formatNum(embung.reduksiPuncak, 1)}%
              </span>
            </div>
            <div className="border border-slate-200 p-2.5 rounded bg-slate-50/50">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Umur Layanan Sedimen</span>
              <span className="text-base font-extrabold text-slate-900 font-mono">
                {embung.umurSedimen || 25} <span className="text-xs font-normal">Tahun</span>
              </span>
            </div>
            <div className="border border-slate-200 p-2.5 rounded bg-slate-50/50">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Tampungan Efektif</span>
              <span className="text-sm font-extrabold text-slate-900 font-mono">
                {formatInt(embung.effectiveStorage)} <span className="text-[10px] font-normal">m³</span>
              </span>
            </div>
            <div className="border border-slate-200 p-2.5 rounded bg-slate-50/50">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Status Keamanan</span>
              <span className={`text-sm font-extrabold ${embung.isAman ? 'text-emerald-700' : 'text-rose-700'}`}>
                {embung.isAman ? 'Memenuhi Syarat' : 'Perlu Tinjauan'}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          BAGIAN 6: DESAIN HIDRAULIK SALURAN TERBUKA (MANNING / SNI 03-2401-1991)
          ===================================================================== */}
      {sectionsConfig.showSaluran && saluran && (
        <section className="mb-6 print-page-break-before">
          <div className="bg-slate-100 px-3 py-1.5 border-l-4 border-blue-600 mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Waves className="w-3.5 h-3.5 text-blue-600" />
              6. Desain Hidraulik Saluran Terbuka (Manning)
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">SNI 03-2401-1991</span>
          </div>

          <MethodologyBox metodologiKey={saluran.metodologiKey || 'MANNING'} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-2 print-avoid-break">
            <div className="border border-slate-200 p-2 rounded">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Kapasitas Debit (Q)</span>
              <span className="text-sm font-bold text-blue-700 font-mono">{formatNum(saluran.dischargeCapacity, 2)} m³/s</span>
            </div>
            <div className="border border-slate-200 p-2 rounded">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Kecepatan Alir (V)</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{formatNum(saluran.velocity, 2)} m/s</span>
            </div>
            <div className="border border-slate-200 p-2 rounded">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Bilangan Froude (Fr)</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{formatNum(saluran.froudeNumber, 2)}</span>
            </div>
            <div className="border border-slate-200 p-2 rounded">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Status Keamanan</span>
              <span className={`text-sm font-bold ${saluran.isSafe ? 'text-emerald-700' : 'text-rose-700'}`}>
                {saluran.isSafe ? 'Aman' : 'Limpasan'}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 flex justify-between border-t border-slate-100 pt-1.5">
            <span>Bentuk Penampang: <strong className="text-slate-800 uppercase">{saluran.shape}</strong></span>
            <span>Tinggi Jagaan: <strong className="text-slate-800">{formatNum(saluran.freeboardActual, 2)} m</strong> (Syarat: {formatNum(saluran.freeboardRecommended, 2)} m)</span>
            <span>Rejim Aliran: <strong className="text-slate-800">{saluran.flowRegime}</strong></span>
          </div>
        </section>
      )}

      {/* =====================================================================
          BAGIAN 7: SINTESIS KESIMPULAN & REKOMENDASI TEKNIS SNI
          ===================================================================== */}
      {sectionsConfig.showAiSummary && (
        <section className="mb-6 print-avoid-break">
          <div className="bg-slate-100 px-3 py-1.5 border-l-4 border-amber-500 mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              7. Kesimpulan & Rekomendasi Teknis Rekayasa SDA
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">Kaidah Standar Teknis SNI</span>
          </div>

          <div className="p-3 bg-amber-50/40 border border-amber-200/80 rounded text-xs leading-relaxed text-slate-800 mb-3">
            <p className="font-medium">{aiSummary}</p>
          </div>

          {rekomendasiTeknis && rekomendasiTeknis.length > 0 && (
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pl-1">
              {rekomendasiTeknis.map((rek, idx) => (
                <li key={idx}>{rek}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* =====================================================================
          BAGIAN 8: LEMBAR PENGESAHAN DOKUMEN RESMI (3 PIHAK)
          ===================================================================== */}
      {sectionsConfig.showPengesahan && (
        <section className="mt-8 pt-4 border-t-2 border-slate-300 print-avoid-break print-page-break-before">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center mb-6">
            LEMBAR PENGESAHAN & PENETAPAN KELAYAKAN TEKNIS
          </p>

          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            {/* Pihak 1: Penyusun */}
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Disusun Oleh:</span>
              <span className="font-bold text-slate-800 block text-[11px]">{kop.penandatangan.jabatanPenyusun}</span>
              <div className="h-16 flex items-end justify-center">
                <span className="text-[10px] text-slate-400 italic">(Tanda Tangan)</span>
              </div>
              <div className="border-t border-slate-900 pt-1 font-bold text-slate-900">
                {kop.penandatangan.penyusun}
              </div>
            </div>

            {/* Pihak 2: Verifikator / Tenaga Ahli */}
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Diperiksa & Diverifikasi:</span>
              <span className="font-bold text-slate-800 block text-[11px]">{kop.penandatangan.jabatanVerifikator}</span>
              <div className="h-16 flex items-end justify-center">
                <span className="text-[10px] text-slate-400 italic">(Tanda Tangan)</span>
              </div>
              <div className="border-t border-slate-900 pt-1 font-bold text-slate-900">
                {kop.penandatangan.verifikator}
              </div>
            </div>

            {/* Pihak 3: Pengguna Jasa / PPK */}
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Disetujui Pengguna Jasa:</span>
              <span className="font-bold text-slate-800 block text-[11px]">{kop.penandatangan.jabatanPenggunaJasa}</span>
              <div className="h-16 flex items-end justify-center">
                <span className="text-[10px] text-slate-400 italic">(Tanda Tangan & Cap)</span>
              </div>
              <div className="border-t border-slate-900 pt-1 font-bold text-slate-900">
                {kop.penandatangan.penggunaJasa}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer Cap Standar */}
      <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between items-center print:text-slate-500">
        <span>RekaSDA Pro — Format Laporan Standar Rekayasa SDA (SNI Compliant)</span>
        <span className="print:hidden">Ringkasan Eksekutif Terpadu</span>
        <span className="hidden print:inline font-mono">Dokumen Resmi RekaSDA Pro ({kop.nomorDokumen})</span>
      </div>
    </div>
  );
};
