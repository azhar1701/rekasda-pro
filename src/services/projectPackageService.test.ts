import { describe, it, expect, vi } from 'vitest';
import {
  exportProjectBundle,
  validateAndParseProjectContent,
  applyProjectToStore,
  CURRENT_PROJECT_SCHEMA_VERSION,
  type ProjectPackagePayload
} from './projectPackageService';
import type { HydrologyState } from '@/stores/useHydrologyStore';

describe('projectPackageService', () => {
  const mockState: Partial<HydrologyState> = {
    identitasLokasi: {
      namaPekerjaan: 'Studi Kelayakan Bendungan Cimanuk',
      namaDAS: 'DAS Cimanuk Hulu',
      namaSungai: 'Sungai Cimanuk',
      provinsi: 'Jawa Barat',
      kabupaten: 'Garut',
      koordinat: { lat: -7.2, lng: 107.9 }
    },
    morfometriDAS: {
      luasDAS: 145.5,
      panjangSungai: 18.2,
      kemiringanSungai: 0.025,
      elevasi: 650
    },
    tutupanLahan: {
      items: [{ id: '1', jenis: 'Hutan', luas: 100, nilaiC: 0.3, nilaiCN: 55 }],
      koefisienPengaliranGabungan: 0.45,
      curveNumberGabungan: 68,
      totalLuas: 145.5
    },
    stasiunList: [
      { id: 'st1', nama_stasiun: 'Stasiun Bayongbong', koordinat_x: 107.8, koordinat_y: -7.2, elevasi: 700, keterangan: null },
      { id: 'st2', nama_stasiun: 'Stasiun Garut Kota', koordinat_x: 107.9, koordinat_y: -7.1, elevasi: 620, keterangan: null },
      { id: 'st3', nama_stasiun: 'Stasiun Samarang', koordinat_x: 107.7, koordinat_y: -7.25, elevasi: 800, keterangan: null }
    ],
    curahHujanWilayah: {
      metode: 'thiessen',
      hujanRataRata: 125.4,
      stasiunConfigs: [
        { stasiunId: 'st1', namaStasiun: 'Stasiun Bayongbong', luasPengaruh: 50, bobot: 34.36 },
        { stasiunId: 'st2', namaStasiun: 'Stasiun Garut Kota', luasPengaruh: 50, bobot: 34.36 },
        { stasiunId: 'st3', namaStasiun: 'Stasiun Samarang', luasPengaruh: 45.5, bobot: 31.28 }
      ],
      hujanRataRataAMS: [120, 135, 110, 145, 130]
    },
    dataHujan: [
      { id: 'd1', stasiun_id: 'st1', tanggal: '2023-01-01', curah_hujan: 25 },
      { id: 'd2', stasiun_id: 'st2', tanggal: '2023-01-01', curah_hujan: 30 }
    ],
    selectedKalaUlang: 25,
    curahHujanRencana: '142.5'
  };

  it('correctly exports active state into a valid .rekasda project bundle', () => {
    const bundle = exportProjectBundle(mockState as HydrologyState, {
      author: 'Ir. Ahmad Hidrolog',
      institution: 'BBWS Cimanuk Cisanggarung'
    });

    expect(bundle.app).toBe('RekasDA Pro');
    expect(bundle.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
    expect(bundle.metadata.projectName).toBe('Studi Kelayakan Bendungan Cimanuk');
    expect(bundle.metadata.author).toBe('Ir. Ahmad Hidrolog');
    expect(bundle.metadata.totalStations).toBe(3);
    expect(bundle.metadata.totalDailyRecords).toBe(2);
    expect(bundle.state.morfometriDAS?.luasDAS).toBe(145.5);
    expect(bundle.state.curahHujanWilayah?.metode).toBe('thiessen');
  });

  it('validates a correct project package JSON string', () => {
    const bundle = exportProjectBundle(mockState as HydrologyState);
    const jsonStr = JSON.stringify(bundle);

    const validation = validateAndParseProjectContent(jsonStr);
    expect(validation.isValid).toBe(true);
    expect(validation.payload?.metadata.projectName).toBe('Studi Kelayakan Bendungan Cimanuk');
  });

  it('rejects an invalid JSON string or corrupted project file', () => {
    const corruptedValidation = validateAndParseProjectContent('{ broken json ...');
    expect(corruptedValidation.isValid).toBe(false);
    expect(corruptedValidation.error).toContain('Gagal membaca isi berkas');

    const foreignApp = validateAndParseProjectContent(JSON.stringify({ app: 'OtherApp', state: {} }));
    expect(foreignApp.isValid).toBe(false);
    expect(foreignApp.error).toContain('Format berkas tidak dikenali');
  });

  it('successfully applies project bundle into store state', () => {
    const bundle = exportProjectBundle(mockState as HydrologyState);
    const mockSetState = vi.fn();

    applyProjectToStore(bundle, mockSetState);

    expect(mockSetState).toHaveBeenCalledTimes(1);
    const updatedState = mockSetState.mock.calls[0][0];
    expect(updatedState.morfometriDAS.luasDAS).toBe(145.5);
    expect(updatedState.stasiunList.length).toBe(3);
    expect(updatedState.isBanjirDirty).toBe(false);
    expect(updatedState.isNeracaDirty).toBe(false);
  });
});
