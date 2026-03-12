import React from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, FileText, Download } from 'lucide-react';
import { generateSNICompliancePDF } from '@/services/reportingService';

export const SNIComplianceReport: React.FC = () => {
  const { 
    identitasLokasi, 
    morfometriDAS, 
    dataHujan, 
    stasiunList,
    analisisFrekuensi, 
    qcResults,
    hasilBanjir
  } = useHydrologyStore();

  const auditItems = [
    {
      id: 'DATA_LENGTH',
      title: 'Panjang Data Hujan',
      description: 'SNI 2415:2016 Pasal 4.1 mensyaratkan data minimal 10 tahun.',
      status: dataHujan.length >= 10 ? 'PASSED' : 'FAILED',
      value: `${dataHujan.length} tahun`
    },
    {
      id: 'QC_CONSISTENCY',
      title: 'Uji Konsistensi (RAPS)',
      description: 'Menjamin stabilitas rerata data hujan.',
      status: qcResults?.overallPassed ? 'PASSED' : 'WARNING',
      value: qcResults?.overallPassed ? 'Lulus' : 'Gagal/Belum Diuji'
    },
    {
      id: 'FREQ_ANALYSIS',
      title: 'Analisis Frekuensi',
      description: 'Penggunaan distribusi Pearson III atau Gumbel sesuai SNI.',
      status: analisisFrekuensi?.metodeTerpilih ? 'PASSED' : 'FAILED',
      value: analisisFrekuensi?.metodeTerpilih || 'Belum dipilih'
    },
    {
      id: 'METHOD_FIT',
      title: 'Kesesuaian Metode Debit',
      description: 'Rasional (A < 3km²), HSS (A > 3km²).',
      status: (morfometriDAS.luasDAS < 3 && hasilBanjir?.method === 'RATIONAL') || (morfometriDAS.luasDAS >= 3 && hasilBanjir?.method !== 'RATIONAL') ? 'PASSED' : 'WARNING',
      value: `DAS: ${morfometriDAS.luasDAS} km² | Metode: ${hasilBanjir?.method || 'N/A'}`
    }
  ];

  const overallScore = Math.round((auditItems.filter(i => i.status === 'PASSED').length / auditItems.length) * 100);

  const handleDownload = () => {
    generateSNICompliancePDF({
      identitas: identitasLokasi,
      morfometri: morfometriDAS,
      dataHujan,
      stasiunList,
      analisisFrekuensi,
      qcResults,
      hasilBanjir,
      complianceScore: overallScore,
      auditItems
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <div>
            <h2 className="text-xl font-bold">Laporan Kepatuhan SNI</h2>
            <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Audit Otomatis • SNI 2415:2016</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-emerald-400">{overallScore}%</div>
          <p className="text-[10px] text-slate-400 uppercase">Compliance Score</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Proyek</span>
            <div className="text-sm font-bold text-slate-800">{identitasLokasi.namaPekerjaan || 'Untitled Project'}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Lokasi</span>
            <div className="text-sm font-bold text-slate-800">{identitasLokasi.kabupaten || '-'}, {identitasLokasi.provinsi || '-'}</div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Detail Audit Hidrologi</h3>
          {auditItems.map((item) => (
            <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-300 transition-all group">
              <div className="mt-1">
                {item.status === 'PASSED' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : item.status === 'WARNING' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                    item.status === 'PASSED' ? 'bg-emerald-100 text-emerald-700' :
                    item.status === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                <div className="mt-2 text-[10px] font-mono bg-slate-50 px-2 py-1 rounded inline-block text-slate-600">
                  Nilai: {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-100 flex gap-3">
          <button 
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF Report
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-lg font-bold text-sm hover:bg-slate-50 transition-all">
            <FileText className="w-4 h-4" />
            Lihat Pasal SNI
          </button>
        </div>
      </div>
    </div>
  );
};
