import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  IdentitasLokasi, 
  MorfometriDAS, 
  DataHujan, 
  AnalisisFrekuensi, 
  QualityControlResults,
  HasilBanjir,
  StasiunHidrologi
} from '@/types/hydrology.types';

export interface ReportData {
  identitas: IdentitasLokasi;
  morfometri: MorfometriDAS;
  dataHujan: DataHujan[];
  stasiunList: StasiunHidrologi[];
  analisisFrekuensi: AnalisisFrekuensi;
  qcResults: QualityControlResults | null;
  hasilBanjir: HasilBanjir | null;
  complianceScore: number;
  auditItems: any[];
}

export const generateSNICompliancePDF = (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // --- HEADER ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('REKASDA PRO', 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('LAPORAN KEPATUHAN SNI 2415:2016', 15, 30);
  doc.text(`Generated: ${new Date().toLocaleString('id-ID')}`, pageWidth - 15, 30, { align: 'right' });

  // --- PROJECT IDENTITY ---
  let cursorY = 50;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('I. Identitas Proyek', 15, cursorY);
  
  cursorY += 10;
  autoTable(doc, {
    startY: cursorY,
    body: [
      ['Nama Pekerjaan', data.identitas.namaPekerjaan || '-'],
      ['Nama DAS', data.identitas.namaDAS || '-'],
      ['Lokasi', `${data.identitas.kabupaten || '-'}, ${data.identitas.provinsi || '-'}`],
      ['Koordinat', `Lat: ${data.identitas.koordinat.lat || '-'}, Lng: ${data.identitas.koordinat.lng || '-'}`],
      ['Luas DAS', `${data.morfometri.luasDAS} km²`],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
  });
  
  cursorY = (doc as any).lastAutoTable.finalY + 15;

  // --- COMPLIANCE SUMMARY ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('II. Ringkasan Kepatuhan SNI', 15, cursorY);
  
  cursorY += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Compliance Score: ${data.complianceScore}%`, 15, cursorY + 5);

  cursorY += 10;
  autoTable(doc, {
    startY: cursorY,
    head: [['Parameter Audit', 'Status', 'Keterangan']],
    body: data.auditItems.map(item => [
      item.title,
      item.status,
      item.description
    ]),
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: {
      1: { fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const status = data.cell.raw as string;
        if (status === 'PASSED') data.cell.styles.textColor = [16, 185, 129];
        if (status === 'FAILED') data.cell.styles.textColor = [239, 68, 68];
        if (status === 'WARNING') data.cell.styles.textColor = [245, 158, 11];
      }
    }
  });

  cursorY = (doc as any).lastAutoTable.finalY + 15;

  // --- FREQUENCY ANALYSIS ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('III. Analisis Frekuensi', 15, cursorY);
  
  cursorY += 10;
  const designRainfalls = data.analisisFrekuensi.hasilDistribusi?.[0]?.values || [];
  autoTable(doc, {
    startY: cursorY,
    head: [['Kala Ulang (Tr)', 'Curah Hujan Rencana (mm)']],
    body: designRainfalls.map(v => [`Q${v.Tr}`, v.R24.toFixed(2)]),
    headStyles: { fillColor: [79, 70, 229] }, // indigo-600
  });

  // --- FOOTER ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Halaman ${i} dari ${pageCount} - Dokumen ini dihasilkan secara otomatis oleh RekaSDA Pro Engine`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`Laporan_SNI_${data.identitas.namaDAS || 'Proyek'}_${Date.now()}.pdf`);
};
