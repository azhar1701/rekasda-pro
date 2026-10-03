import { describe, it, expect, beforeEach } from 'vitest';
import { useHydrologyStore, type DataHujan } from '@/stores/useHydrologyStore';
import { applyDoubleMassCorrection } from '@/lib/utils/qc/dataQualityMath';

describe('Double Mass Curve - Tagging Deret Data Terkoreksi (is_dmc_corrected)', () => {
  beforeEach(() => {
    useHydrologyStore.getState().resetProject();
    useHydrologyStore.setState({
      dataHujan: [],
      stasiunList: [
        {
          id: 'stn-test-1',
          nama_stasiun: 'Stasiun Cikawung',
          kode_stasiun: 'CKW-01',
          elevasi: 50,
          panjang_data: 5,
        },
      ],
      selectedStasiun: {
        id: 'stn-test-1',
        nama_stasiun: 'Stasiun Cikawung',
        kode_stasiun: 'CKW-01',
        elevasi: 50,
        panjang_data: 5,
      },
    });
  });

  it('menandai record pra-breakYear dengan flag is_dmc_corrected = true saat koreksi diaplikasikan', () => {
    const rawRecords: Partial<DataHujan>[] = [
      { id: '1', stasiun_id: 'stn-test-1', tanggal: '2018-03-10', curah_hujan: 20 },
      { id: '2', stasiun_id: 'stn-test-1', tanggal: '2019-07-22', curah_hujan: 40 },
      { id: '3', stasiun_id: 'stn-test-1', tanggal: '2020-01-15', curah_hujan: 50 },
      { id: '4', stasiun_id: 'stn-test-1', tanggal: '2021-04-10', curah_hujan: 60 },
    ];

    // Simulasikan perhitungan DMC
    const dmcResult = applyDoubleMassCorrection({
      records: rawRecords.map((r) => ({
        tanggal: r.tanggal!,
        curah_hujan: r.curah_hujan!,
      })),
      faktorKoreksi: 1.5,
      breakYear: 2020,
    });

    expect(dmcResult.correctedCount).toBe(2);
    expect(dmcResult.unchangedCount).toBe(2);

    // Pemetaan seperti yang dilakukan di DoubleMassCorrectionModal
    const toSave: DataHujan[] = dmcResult.correctedRecords.map((r, i) => ({
      id: rawRecords[i]?.id || `corr_${i}`,
      stasiun_id: 'stn-test-1',
      tanggal: r.tanggal,
      curah_hujan: r.curah_hujan,
      is_infilled: false,
      is_dmc_corrected: r.was_corrected,
    }));

    // Record 2018 & 2019 harus berstatus is_dmc_corrected = true
    const rec2018 = toSave.find((r) => r.tanggal.startsWith('2018'));
    const rec2019 = toSave.find((r) => r.tanggal.startsWith('2019'));
    const rec2020 = toSave.find((r) => r.tanggal.startsWith('2020'));
    const rec2021 = toSave.find((r) => r.tanggal.startsWith('2021'));

    expect(rec2018?.is_dmc_corrected).toBe(true);
    expect(rec2018?.curah_hujan).toBe(30); // 20 * 1.5
    expect(rec2019?.is_dmc_corrected).toBe(true);
    expect(rec2019?.curah_hujan).toBe(60); // 40 * 1.5

    // Record >= 2020 tidak terkoreksi dan is_dmc_corrected = false
    expect(rec2020?.is_dmc_corrected).toBe(false);
    expect(rec2020?.curah_hujan).toBe(50);
    expect(rec2021?.is_dmc_corrected).toBe(false);
    expect(rec2021?.curah_hujan).toBe(60);
  });

  it('menyimpan flag is_dmc_corrected secara konsisten ke dalam state useHydrologyStore', () => {
    const recordsToImport: DataHujan[] = [
      {
        id: 'rec-1',
        stasiun_id: 'stn-test-1',
        tanggal: '2019-10-01',
        curah_hujan: 35.5,
        is_dmc_corrected: true,
      },
      {
        id: 'rec-2',
        stasiun_id: 'stn-test-1',
        tanggal: '2022-10-01',
        curah_hujan: 45.0,
        is_dmc_corrected: false,
      },
    ];

    useHydrologyStore.getState().updateDataHujanManual(recordsToImport);

    const savedRecords = useHydrologyStore.getState().dataHujan;
    const item1 = savedRecords.find((r) => r.id === 'rec-1');
    const item2 = savedRecords.find((r) => r.id === 'rec-2');

    expect(item1).toBeDefined();
    expect(item1?.is_dmc_corrected).toBe(true);
    expect(item2).toBeDefined();
    expect(item2?.is_dmc_corrected).toBe(false);
  });
});
