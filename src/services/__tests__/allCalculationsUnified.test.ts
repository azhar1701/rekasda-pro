import { describe, it, expect, beforeEach } from 'vitest';
import { getAllCalculations, deleteCalculationById } from '../allCalculationsService';
import {
  saveUnifiedProject,
  saveCalculationSnapshot,
  clearUnifiedProjectStorage
} from '../unifiedProjectService';

describe('Fase 3: Unified Calculation History Integration', () => {
  const testProjectId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  beforeEach(() => {
    clearUnifiedProjectStorage();
  });

  it('mengintegrasikan snapshot kalkulasi proyek ke dalam getAllCalculations()', async () => {
    // 1. Buat proyek induk
    await saveUnifiedProject({
      metadata: {
        id: testProjectId,
        projectCode: 'PRJ-2026-F3',
        name: 'Proyek Normalisasi Sungai Citarum Hilir',
        dasName: 'DAS Citarum',
        author: 'Ahli Hidrologi QA',
        institution: 'BBWS Citarum',
        status: 'ACTIVE',
        schemaVersion: '2.0',
        createdAt: '2026-10-03T10:00:00Z',
        updatedAt: '2026-10-03T10:00:00Z',
      },
      masterData: { stations: [], rainfallRecords: [] },
      analysisResults: {},
    });

    // 2. Simpan snapshot kalkulasi yang terkait ke proyek
    const snapshot = await saveCalculationSnapshot(testProjectId, {
      moduleType: 'manning',
      snapshotTitle: 'Saluran Primer Segmen 1',
      scenarioName: 'Debit Rencana Q25 (Trapesium)',
      inputParameters: { width: 3.5, depth: 1.8, slope: 0.002 },
      outputResults: { discharge: 8.45, velocity: 1.34 },
      notes: 'Penampang beton halus',
      createdBy: 'Ahli Hidrologi QA',
    });

    // 3. Ambil seluruh data kalkulasi via allCalculationsService
    const allCalculations = await getAllCalculations();
    const item = allCalculations.find((c) => c.id === snapshot.id);

    expect(item).toBeDefined();
    expect(item?.type).toBe('manning');
    expect(item?.project_name).toBe('Saluran Primer Segmen 1');
    expect(item?.projectId).toBe(testProjectId);
    expect(item?.projectCode).toBe('PRJ-2026-F3');
    expect(item?.scenarioName).toBe('Debit Rencana Q25 (Trapesium)');
    expect(item?.isSnapshot).toBe(true);
    expect(item?.data.results.discharge).toBe(8.45);
  });

  it('dapat menghapus snapshot perhitungan terpadu via deleteCalculationById()', async () => {
    await saveUnifiedProject({
      metadata: {
        id: testProjectId,
        projectCode: 'PRJ-2026-DEL',
        name: 'Proyek Hapus Test',
        dasName: 'DAS Test',
        author: 'QA',
        institution: 'RekasDA',
        status: 'ACTIVE',
        schemaVersion: '2.0',
        createdAt: '2026-10-03T10:00:00Z',
        updatedAt: '2026-10-03T10:00:00Z',
      },
      masterData: { stations: [], rainfallRecords: [] },
      analysisResults: {},
    });

    const snapshot = await saveCalculationSnapshot(testProjectId, {
      moduleType: 'flood',
      snapshotTitle: 'Banjir Rencana HSS Nakayasu',
      scenarioName: 'Kala Ulang 50 Tahun',
      inputParameters: { returnPeriod: 50, area: 120 },
      outputResults: { qPeak: 45.2 },
      notes: 'Simulasi banjir rencana',
      createdBy: 'QA',
    });

    let items = await getAllCalculations();
    expect(items.some((c) => c.id === snapshot.id)).toBe(true);

    // Hapus snapshot
    await deleteCalculationById('flood', snapshot.id);

    items = await getAllCalculations();
    expect(items.some((c) => c.id === snapshot.id)).toBe(false);
  });
});
