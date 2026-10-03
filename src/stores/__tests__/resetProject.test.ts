import { describe, it, expect, beforeEach } from 'vitest';
import { useHydrologyStore, INITIAL_HYDROLOGY_STATE } from '../useHydrologyStore';

describe('Project Reset: Comprehensive Multi-Module Reset Audit', () => {
  beforeEach(() => {
    useHydrologyStore.getState().resetProject();
  });

  it('resets every hydrology state variable back to INITIAL_HYDROLOGY_STATE', () => {
    // 1. Populate store with extensive state across all modules
    useHydrologyStore.setState({
      identitasLokasi: {
        namaPekerjaan: 'Proyek Bendungan Citarum Hilir',
        namaDAS: 'DAS Citarum',
        namaSungai: 'Sungai Citarum',
        provinsi: 'Jawa Barat',
        kabupaten: 'Karawang',
        koordinat: { lat: -6.3, lng: 107.3 }
      },
      morfometriDAS: {
        luasDAS: 450,
        panjangSungai: 32,
        kemiringanSungai: 0.008,
        elevasi: 120
      },
      luasDas: '450',
      panjangSungai: '32',
      curahHujanRencana: '145.5',
      tutupanLahan: {
        items: [{ id: 'tl-1', jenis: 'Hutan Lindung', luas: 450, nilaiC: 0.25, nilaiCN: 60 }]
      },
      stasiunList: [
        { id: 'st-1', nama_stasiun: 'Pos Hujan 1', koordinat_x: 107.1, koordinat_y: -6.2, elevasi: 100, keterangan: null }
      ],
      selectedStasiun: { id: 'st-1', nama_stasiun: 'Pos Hujan 1', koordinat_x: 107.1, koordinat_y: -6.2, elevasi: 100, keterangan: null },
      dataHujan: [
        { id: 'dh-1', stasiun_id: 'st-1', tanggal: '2023-01-01', curah_hujan: 75 }
      ],
      curahHujanWilayah: {
        metode: 'thiessen',
        stasiunConfigs: [{ stasiunId: 'st-1', namaStasiun: 'Pos Hujan 1', luasPengaruh: 450, bobot: 1.0 }],
        hujanRataRataDAS: [75]
      },
      activeRainfallSource: 'thiessen',
      arealRainfallThiessen: [{ id: 'ar-1', stasiun_id: 'composite', tanggal: '2023-01-01', curah_hujan: 75 }],
      analisisFrekuensi: {
        metodeTerpilih: 'gumbel',
        dataHujanInput: [75, 80, 85, 90, 95, 100, 105, 110, 115, 120],
        parameterStatistik: {
          asli: { mean: 97.5, stdDev: 15.1, skewness: 0, kurtosis: 3, n: 10 },
          log: { mean: 1.98, stdDev: 0.07, skewness: 0, kurtosis: 3, n: 10 }
        },
        hasilDistribusi: [],
        ujiKecocokan: []
      },
      hasilAnalisisFrekuensi: {
        metodeTerpilih: 'gumbel',
        rekapitulasi: [],
        rekomendasi: 'Gumbel'
      },
      hasilBanjir: {
        debitPuncak: 185.4,
        hidrograf: [{ time: 1, inflow: 185.4 }],
        method: 'HSS Nakayasu'
      },
      hasilNeraca: {
        isSurplus: true,
        totalSurplusDefisit: 12.5,
        bulanKritis: 'Agustus',
        chartData: [],
        waterScarcity: { ikaPercent: 15, status: 'Aman', description: 'Surplus', badgeColor: 'green' },
        storageRequiredM3: 0,
        storageRequiredJutaM3: 0,
        monthlySupply: [10, 12, 14],
        monthlyDemand: [8, 8, 8]
      },
      hasilEmbung: {
        kapasitasEfektif: 250000,
        tinggiMercu: 4.5
      } as any,
      hasilSaluran: {
        debitKapasitas: 45.2,
        kecepatan: 1.8
      } as any,
      qcResults: { 'st-1': { isConsistent: true } as any },
      qcStatus: { 'st-1': { konsisten: true, bebasOutlier: true, homogen: true } },
      dailyCompleteness: { 'st-1': { completenessPercent: 98 } as any },
      isQCOverridden: true,
      rentangTahun: { min: 2010, max: 2023 },
      isFrekuensiDirty: true,
      isBanjirDirty: true,
      isNeracaDirty: true,
      deletedStationIds: ['del-st-1']
    });

    // 2. Perform Reset
    useHydrologyStore.getState().resetProject();

    // 3. Verify ALL variables are strictly back to INITIAL_HYDROLOGY_STATE
    const currentState = useHydrologyStore.getState();

    expect(currentState.identitasLokasi.namaPekerjaan).toBe('');
    expect(currentState.identitasLokasi.namaDAS).toBe('');
    expect(currentState.morfometriDAS).toBeNull();
    expect(currentState.luasDas).toBe('');
    expect(currentState.panjangSungai).toBe('');
    expect(currentState.curahHujanRencana).toBe('');
    expect(currentState.tutupanLahan).toBeNull();
    expect(currentState.stasiunList).toEqual([]);
    expect(currentState.selectedStasiun).toBeNull();
    expect(currentState.dataHujan).toEqual([]);
    expect(currentState.curahHujanWilayah).toBeNull();
    expect(currentState.activeRainfallSource).toBe('titik');
    expect(currentState.arealRainfallThiessen).toBeNull();
    expect(currentState.arealRainfallAlgebraic).toBeNull();
    expect(currentState.arealRainfallIsohyet).toBeNull();
    expect(currentState.analisisFrekuensi).toBeNull();
    expect(currentState.hasilAnalisisFrekuensi).toBeNull();
    expect(currentState.hasilBanjir).toBeNull();
    expect(currentState.hasilNeraca).toBeNull();
    expect(currentState.hasilEmbung).toBeNull();
    expect(currentState.hasilSaluran).toBeNull();
    expect(currentState.qcResults).toBeNull();
    expect(currentState.qcStatus).toBeNull();
    expect(currentState.dailyCompleteness).toBeNull();
    expect(currentState.isQCOverridden).toBe(false);
    expect(currentState.rentangTahun).toBeNull();
    expect(currentState.deletedStationIds).toEqual([]);
    expect(currentState.isFrekuensiDirty).toBe(false);
    expect(currentState.isBanjirDirty).toBe(false);
    expect(currentState.isNeracaDirty).toBe(false);

    // Deep equality check against INITIAL_HYDROLOGY_STATE for all matching keys
    for (const [key, initialVal] of Object.entries(INITIAL_HYDROLOGY_STATE)) {
      expect((currentState as any)[key]).toEqual(initialVal);
    }
  });
});
