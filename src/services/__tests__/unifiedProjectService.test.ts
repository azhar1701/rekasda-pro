import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveUnifiedProject,
  getUnifiedProjectList,
  getUnifiedProjectById,
  deleteUnifiedProject,
  saveCalculationSnapshot,
  getSnapshotsByProjectId,
  clearUnifiedProjectStorage,
} from '../unifiedProjectService';
import { type UnifiedProjectEntity } from '@/types/unifiedProject.types';

describe('Unified Project Storage Service (Fase 1)', () => {
  beforeEach(() => {
    clearUnifiedProjectStorage();
  });

  const mockProject: UnifiedProjectEntity = {
    metadata: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      projectCode: 'PRJ-CITANDUY-01',
      name: 'Pengendalian Banjir Sungai Citanduy',
      dasName: 'DAS Citanduy',
      riverName: 'Sungai Citanduy',
      province: 'Jawa Barat',
      regency: 'Ciamis',
      author: 'Ir. Ahmad Hidrolog, MT',
      institution: 'BBWS Citanduy',
      latitude: -7.32,
      longitude: 108.45,
      status: 'DRAFT',
      schemaVersion: '2.0',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
    masterData: {
      identitasLokasi: {
        namaPekerjaan: 'Pengendalian Banjir Sungai Citanduy',
        namaDAS: 'DAS Citanduy',
        namaSungai: 'Sungai Citanduy',
        provinsi: 'Jawa Barat',
        kabupaten: 'Ciamis',
        koordinat: { lat: -7.32, lng: 108.45 },
      },
      morfometriDAS: {
        luasDAS: 450,
        panjangSungai: 32,
        kemiringanSungai: 0.008,
      },
      tutupanLahan: {
        items: [{ id: 'tl-1', jenis: 'Hutan Lindung', luas: 450, nilaiC: 0.25, nilaiCN: 60 }],
      },
      stasiunList: [
        { id: 'stn-1', nama_stasiun: 'Pos Hujan Cikawung', kode_stasiun: 'CKW', elevasi: 50, panjang_data: 10 },
      ],
      curahHujanWilayah: null,
      activeRainfallSource: 'titik',
      dataHujan: [],
    },
    analysisResults: {
      curahHujanRencana: '155.4',
    },
    snapshots: [],
  };

  it('berhasil menyimpan dan mengambil proyek dari unified project store', async () => {
    const saved = await saveUnifiedProject(mockProject);
    expect(saved.metadata.id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    const projectList = await getUnifiedProjectList();
    const citanduy = projectList.find((p) => p.id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(citanduy).toBeDefined();
    expect(citanduy?.projectCode).toBe('PRJ-CITANDUY-01');
    expect(citanduy?.name).toBe('Pengendalian Banjir Sungai Citanduy');

    const retrieved = await getUnifiedProjectById('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.masterData.morfometriDAS?.luasDAS).toBe(450);
    expect(retrieved?.masterData.tutupanLahan.items.length).toBe(1);
  });

  it('berhasil menyimpan riwayat snapshot kalkulasi yang terikat kuat ke projectId induk', async () => {
    await saveUnifiedProject(mockProject);

    const snapshot1 = await saveCalculationSnapshot('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', {
      moduleType: 'manning',
      snapshotTitle: 'Dimensi Saluran Titik Pengeluaran STA 0+450',
      scenarioName: 'Debit Q25 HSS Nakayasu',
      inputParameters: { debit: 45.2, kemiringan: 0.002, manningN: 0.025 },
      outputResults: { lebarDasar: 5.5, kedalamanAir: 2.1, kecepatan: 1.8 },
      notes: 'Desain awal saluran terpadu',
    });

    expect(snapshot1.projectId).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(snapshot1.moduleType).toBe('manning');

    const snapshot2 = await saveCalculationSnapshot('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', {
      moduleType: 'flood',
      snapshotTitle: 'Simulasi Banjir Rasional DAS Citanduy',
      scenarioName: 'Kala Ulang 50 Tahun',
      inputParameters: { luasDAS: 450, koefC: 0.35, intensitas: 65 },
      outputResults: { Qp: 285.5 },
    });

    const projectSnapshots = await getSnapshotsByProjectId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(projectSnapshots.length).toBe(2);
    expect(projectSnapshots.some((s) => s.moduleType === 'manning')).toBe(true);
    expect(projectSnapshots.some((s) => s.moduleType === 'flood')).toBe(true);

    // Ambil proyek utuh dan pastikan snapshot ikut terangkut
    const fullProject = await getUnifiedProjectById('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(fullProject?.snapshots.length).toBe(2);
  });

  it('berhasil menghapus proyek beserta seluruh riwayat snapshot-nya secara kaskade', async () => {
    await saveUnifiedProject(mockProject);
    await saveCalculationSnapshot('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', {
      moduleType: 'manning',
      snapshotTitle: 'Test Saluran',
      scenarioName: 'Eksisting',
      inputParameters: {},
      outputResults: {},
    });

    const initialList = await getUnifiedProjectList();
    expect(initialList.some((p) => p.id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true);

    const deleted = await deleteUnifiedProject('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(deleted).toBe(true);

    const afterList = await getUnifiedProjectList();
    expect(afterList.some((p) => p.id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(false);

    const remainingSnapshots = await getSnapshotsByProjectId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(remainingSnapshots.length).toBe(0);
  });
});
