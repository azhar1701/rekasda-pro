import { describe, it, expect } from 'vitest';
import { computeWorkflowStatus } from '../workflowStatusEngine';
import { HydrologyState } from '@/stores/useHydrologyStore';

describe('Workflow Status Engine', () => {
  const createMockHydroState = (overrides: Partial<HydrologyState> = {}): HydrologyState => {
    return {
      identitasLokasi: null,
      morfometriDAS: null,
      tutupanLahan: null,
      stasiunList: [],
      dataHujan: [],
      curahHujanWilayah: null,
      analisisFrekuensi: null,
      hasilThiessen: null,
      hasilARF: null,
      hasilAnalisisFrekuensi: null,
      hasilBanjir: null,
      hasilBanjirEmpiris: null,
      hasilBanjirHSS: null,
      hasilKonvolusi: null,
      hasilNeraca: null,
      hasilEmbung: null,
      hasilSaluran: null,
      hasilMock: null,
      neracaFinal: null,
      distribusiHujanJamJaman: null,
      hujanEfektif: null,
      durasiHujan: 6,
      qcResults: null,
      qcStatus: null,
      isQCOverridden: false,
      isQCCalculating: false,
      rentangTahun: null,
      landCoverParams: null,
      effectiveRainfall: null,
      hssComparisonResults: null,
      activeRainfallSource: 'titik',
      arealRainfallAlgebraic: null,
      arealRainfallThiessen: null,
      arealRainfallIsohyet: null,
      isBanjirDirty: false,
      isNeracaDirty: false,
      isLoading: false,
      error: null,
      selectedKalaUlang: 25,
      ...overrides,
    } as unknown as HydrologyState;
  };

  it('should initialize with all 17 workflow modules', () => {
    const state = createMockHydroState();
    const result = computeWorkflowStatus(state);

    expect(result.moduleList.length).toBe(17);
    expect(result.summary.totalModules).toBe(17);
    expect(result.summary.percentage).toBeGreaterThanOrEqual(0);
  });

  it('should mark identitas and data hujan as Selesai when provided', () => {
    const state = createMockHydroState({
      identitasLokasi: {
        namaPekerjaan: 'Perencanaan Normalisasi Sungai',
        namaDAS: 'DAS Citarum Hulu',
        namaSungai: 'Citarum',
        provinsi: 'Jawa Barat',
        kabupaten: 'Bandung',
        koordinat: { lat: -6.9, lng: 107.6 },
      },
      stasiunList: [
        { id: 'st-1', nama_stasiun: 'Majalaya', koordinat_x: null, koordinat_y: null, elevasi: 600, keterangan: null },
      ],
      dataHujan: [
        { id: 'dh-1', stasiun_id: 'st-1', tanggal: '2023-01-01', curah_hujan: 85 },
      ],
    });

    const result = computeWorkflowStatus(state);

    expect(result.modules.identitas.status).toBe('Selesai');
    expect(result.modules.identitas.statusType).toBe('success');
    expect(result.modules.identitas.metricSummary).toContain('Perencanaan Normalisasi Sungai');

    expect(result.modules.hujan.status).toBe('Selesai');
    expect(result.modules.hujan.metricSummary).toContain('1 Pos Stasiun');
  });

  it('should route ekspor and dashboard to /exec instead of /master', () => {
    const state = createMockHydroState();
    const result = computeWorkflowStatus(state);

    expect(result.modules.ekspor.targetTab).toBe('/exec');
    expect(result.modules.dashboard.targetTab).toBe('/exec');
    expect(result.modules.identitas.targetTab).toBe('/master?tab=identitas');
    expect(result.modules.hujan.targetTab).toBe('/master?tab=data-hujan');
  });

  it('should recommend next step logically based on readiness', () => {
    // When identitas is done, next recommendation should move forward
    const state = createMockHydroState({
      identitasLokasi: {
        namaPekerjaan: 'Drainase Perkotaan',
        namaDAS: 'DAS Cisadane',
        namaSungai: 'Cisadane',
        provinsi: 'Banten',
        kabupaten: 'Tangerang',
        koordinat: { lat: -6.2, lng: 106.6 },
      },
    });

    const result = computeWorkflowStatus(state);
    expect(result.summary.nextRecommended).toBeDefined();
    expect(result.summary.nextRecommended?.id).toBe('hujan');
  });

  it('should correctly mark QC as Selesai when overridden', () => {
    const state = createMockHydroState({
      dataHujan: [
        { id: 'dh-1', stasiun_id: 'st-1', tanggal: '2023-01-01', curah_hujan: 120 },
      ],
      isQCOverridden: true,
    });

    const result = computeWorkflowStatus(state);
    expect(result.modules.qc.status).toBe('Selesai');
    expect(result.modules.qc.metricSummary).toContain('Override');
  });
});
