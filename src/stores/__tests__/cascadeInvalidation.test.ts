import { describe, it, expect, beforeEach } from 'vitest';
import { useHydrologyStore } from '../useHydrologyStore';

describe('Phase 2: Cascade Invalidation & Reactive Sync', () => {
  beforeEach(() => {
    // Reset store to known state
    useHydrologyStore.setState({
      dataHujan: [],
      isFrekuensiDirty: false,
      isBanjirDirty: false,
      isNeracaDirty: false,
      analisisFrekuensi: null,
      hasilBanjir: null,
    });
  });

  it('marks isFrekuensiDirty and isBanjirDirty when dataHujan is manually updated', () => {
    expect(useHydrologyStore.getState().isFrekuensiDirty).toBe(false);
    expect(useHydrologyStore.getState().isBanjirDirty).toBe(false);

    useHydrologyStore.getState().updateDataHujanManual([
      { id: 'ch-1', stasiun_id: 'sta-1', tanggal: '2023-01-01', curah_hujan: 55.4 }
    ]);

    const state = useHydrologyStore.getState();
    expect(state.isFrekuensiDirty).toBe(true);
    expect(state.isBanjirDirty).toBe(true);
  });

  it('marks isFrekuensiDirty, isBanjirDirty, and isNeracaDirty when Thiessen composite is set', () => {
    useHydrologyStore.getState().setHasilThiessen({
      bobotStasiun: [{ stasiunId: 'sta-1', nama: 'Sta A', bobot: 1.0 }],
      hujanRataRataDAS: [120, 150, 180],
      totalLuasDAS: 250,
      stasiunDetail: []
    });

    const state = useHydrologyStore.getState();
    expect(state.isFrekuensiDirty).toBe(true);
    expect(state.isBanjirDirty).toBe(true);
    expect(state.isNeracaDirty).toBe(true);
  });

  it('clears isFrekuensiDirty when setAnalisisFrekuensi is executed', () => {
    // Simulate dirty state prior to calculation
    useHydrologyStore.setState({
      isFrekuensiDirty: true,
      isBanjirDirty: false
    });

    useHydrologyStore.getState().setAnalisisFrekuensi({
      metodeTerpilih: 'gumbel',
      dataHujanInput: [100, 120, 110, 95, 130, 140, 105, 90, 115, 125],
      parameterStatistik: {
        asli: { mean: 113, stdDev: 15, skewness: 0.1, kurtosis: 2.8, n: 10 },
        log: { mean: 2.05, stdDev: 0.06, skewness: -0.1, kurtosis: 2.7, n: 10 }
      },
      hasilDistribusi: [],
      ujiKecocokan: []
    });

    const state = useHydrologyStore.getState();
    expect(state.isFrekuensiDirty).toBe(false);
    expect(state.isBanjirDirty).toBe(true);
  });

  it('clears isBanjirDirty when setHasilBanjir is called', () => {
    useHydrologyStore.setState({
      isBanjirDirty: true
    });

    useHydrologyStore.getState().setHasilBanjir({
      metode: 'nakayasu',
      kalaUlang: 25,
      debitPuncak: 45.2,
      waktuPuncak: 2.5,
      volumeBanjir: 150000,
      hidrograf: []
    } as any);

    const state = useHydrologyStore.getState();
    expect(state.isBanjirDirty).toBe(false);
  });

  it('supports explicit dirty flag setters for manual synchronization actions', () => {
    const { setIsFrekuensiDirty, setIsBanjirDirty, setIsNeracaDirty } = useHydrologyStore.getState();

    setIsFrekuensiDirty(true);
    expect(useHydrologyStore.getState().isFrekuensiDirty).toBe(true);
    setIsFrekuensiDirty(false);
    expect(useHydrologyStore.getState().isFrekuensiDirty).toBe(false);

    setIsBanjirDirty(true);
    expect(useHydrologyStore.getState().isBanjirDirty).toBe(true);
    setIsBanjirDirty(false);
    expect(useHydrologyStore.getState().isBanjirDirty).toBe(false);

    setIsNeracaDirty(true);
    expect(useHydrologyStore.getState().isNeracaDirty).toBe(true);
    setIsNeracaDirty(false);
    expect(useHydrologyStore.getState().isNeracaDirty).toBe(false);
  });
});
