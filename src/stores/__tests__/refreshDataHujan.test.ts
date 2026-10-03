import { describe, it, expect, beforeEach } from 'vitest';
import { useHydrologyStore } from '../useHydrologyStore';

describe('refreshDataHujan Action in useHydrologyStore', () => {
  beforeEach(() => {
    useHydrologyStore.getState().resetProject();
  });

  it('successfully refreshes station list when no station is selected', async () => {
    useHydrologyStore.setState({
      stasiunList: [
        { id: 'st-1', nama_stasiun: 'Stasiun Cikupa', koordinat_x: 108.2, koordinat_y: -7.4, elevasi: 350, keterangan: null }
      ],
      selectedStasiun: null,
      dataHujan: []
    });

    const result = await useHydrologyStore.getState().refreshDataHujan();

    expect(result.success).toBe(true);
    expect(result.message).toContain('Daftar stasiun berhasil dimuat ulang');
    expect(useHydrologyStore.getState().isLoading).toBe(false);
  });

  it('successfully reloads rainfall data for active station and returns count', async () => {
    const station = { id: 'st-active', nama_stasiun: 'Stasiun Kawali', koordinat_x: 108.3, koordinat_y: -7.1, elevasi: 420, keterangan: null };
    const rainfallData = [
      { id: 'rf-1', stasiun_id: 'st-active', tanggal: '2024-01-01', curah_hujan: 32.5 },
      { id: 'rf-2', stasiun_id: 'st-active', tanggal: '2024-01-02', curah_hujan: 15.0 },
      { id: 'rf-3', stasiun_id: 'st-other', tanggal: '2024-01-01', curah_hujan: 10.0 }
    ];

    useHydrologyStore.setState({
      stasiunList: [station],
      selectedStasiun: station,
      dataHujan: rainfallData
    });

    const result = await useHydrologyStore.getState().refreshDataHujan('st-active');

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.message).toContain('2 rekaman');
    expect(useHydrologyStore.getState().isLoading).toBe(false);
  });
});
