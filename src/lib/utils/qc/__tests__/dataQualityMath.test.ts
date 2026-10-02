import { describe, it, expect } from 'vitest';
import {
  runFullQC,
  cekKonsistensiRAPS,
  cekOutlierGrubbs,
  cekOutlierGrubbsLog,
  cekHomogenitas,
  getDataLevel,
  validateDataLength,
  QCValidationError,
  applyDoubleMassCorrection,
  cekDoubleMassCurve,
  createCompositeReferenceSeries,
  type RainfallData,
} from '../dataQualityMath';

describe('dataQualityMath - Ambang Batas & Level Klasifikasi (Fase 3)', () => {
  it('harus mengklasifikasikan level data secara akurat', () => {
    expect(getDataLevel(3)).toBe('INSUFFICIENT');
    expect(getDataLevel(4)).toBe('INSUFFICIENT');
    expect(getDataLevel(5)).toBe('PRELIMINARY');
    expect(getDataLevel(9)).toBe('PRELIMINARY');
    expect(getDataLevel(10)).toBe('SNI_COMPLIANT');
    expect(getDataLevel(25)).toBe('SNI_COMPLIANT');
  });

  it('harus melempar error INSUFFICIENT_DATA jika data kurang dari 5 tahun', () => {
    const dataUnder5: RainfallData[] = [
      { tahun: 2020, hujan: 100 },
      { tahun: 2021, hujan: 110 },
      { tahun: 2022, hujan: 95 },
      { tahun: 2023, hujan: 105 },
    ];
    expect(() => validateDataLength(dataUnder5)).toThrowError(QCValidationError);
    expect(() => validateDataLength(dataUnder5)).toThrowError(/Minimum absolut 5 tahun/);

    const result = runFullQC(dataUnder5);
    expect(result.dataLevel).toBe('INSUFFICIENT');
    expect(result.isKonsisten).toBe(false);
    expect(result.isBebasOutlier).toBe(false);
    expect(result.isHomogen).toBe(false);
  });

  it('harus menerima dan memproses data preliminari (5–9 tahun) dengan dataLevel PRELIMINARY', () => {
    const data7Years: RainfallData[] = [
      { tahun: 2017, hujan: 120 },
      { tahun: 2018, hujan: 135 },
      { tahun: 2019, hujan: 110 },
      { tahun: 2020, hujan: 125 },
      { tahun: 2021, hujan: 130 },
      { tahun: 2022, hujan: 115 },
      { tahun: 2023, hujan: 140 },
    ];

    expect(() => validateDataLength(data7Years)).not.toThrow();

    const result = runFullQC(data7Years);
    expect(result.dataLevel).toBe('PRELIMINARY');
    expect(result.dataYearsCount).toBe(7);
    expect(result.isKonsisten).toBe(true);
    expect(result.isBebasOutlier).toBe(true);
    expect(result.isHomogen).toBe(true);
    expect(result.details.homogenitas.pesan).toContain('Hasil indikatif');
  });

  it('harus memproses data penuh (≥10 tahun) dengan level SNI_COMPLIANT', () => {
    const data10Years: RainfallData[] = [
      { tahun: 2014, hujan: 110 },
      { tahun: 2015, hujan: 125 },
      { tahun: 2016, hujan: 118 },
      { tahun: 2017, hujan: 130 },
      { tahun: 2018, hujan: 145 },
      { tahun: 2019, hujan: 120 },
      { tahun: 2020, hujan: 135 },
      { tahun: 2021, hujan: 128 },
      { tahun: 2022, hujan: 140 },
      { tahun: 2023, hujan: 132 },
    ];

    const result = runFullQC(data10Years);
    expect(result.dataLevel).toBe('SNI_COMPLIANT');
    expect(result.dataYearsCount).toBe(10);
    expect(result.isKonsisten).toBe(true);
    expect(result.isBebasOutlier).toBe(true);
    expect(result.isHomogen).toBe(true);
  });
});

describe('dataQualityMath - Uji Outlier Grubbs Skala Log (WMO No. 100)', () => {
  it('harus mendeteksi outlier ekstrem tinggi pada skala linear dan logaritmik', () => {
    const dataWithOutlier: RainfallData[] = [
      { tahun: 2014, hujan: 100 },
      { tahun: 2015, hujan: 105 },
      { tahun: 2016, hujan: 95 },
      { tahun: 2017, hujan: 110 },
      { tahun: 2018, hujan: 102 },
      { tahun: 2019, hujan: 98 },
      { tahun: 2020, hujan: 104 },
      { tahun: 2021, hujan: 100 },
      { tahun: 2022, hujan: 103 },
      { tahun: 2023, hujan: 450 }, // Outlier nyata
    ];

    const linearGrubbs = cekOutlierGrubbs(dataWithOutlier);
    expect(linearGrubbs.isBebasOutlier).toBe(false);
    expect(linearGrubbs.outliers.length).toBeGreaterThan(0);
    expect(linearGrubbs.outliers[0].tahun).toBe(2023);

    const logGrubbs = cekOutlierGrubbsLog(dataWithOutlier);
    expect(logGrubbs.isBebasOutlier).toBe(false);
    expect(logGrubbs.outliers.length).toBeGreaterThan(0);
    expect(logGrubbs.outliers[0].tahun).toBe(2023);

    const fullResult = runFullQC(dataWithOutlier);
    expect(fullResult.isBebasOutlier).toBe(false);
    expect(fullResult.details.grubbsLog).toBeDefined();
  });

  it('lolos uji outlier untuk data homogen terdistribusi normal/log-normal', () => {
    const cleanData: RainfallData[] = [
      { tahun: 2014, hujan: 90 },
      { tahun: 2015, hujan: 110 },
      { tahun: 2016, hujan: 95 },
      { tahun: 2017, hujan: 120 },
      { tahun: 2018, hujan: 105 },
      { tahun: 2019, hujan: 115 },
      { tahun: 2020, hujan: 100 },
      { tahun: 2021, hujan: 125 },
      { tahun: 2022, hujan: 108 },
      { tahun: 2023, hujan: 112 },
    ];

    const logGrubbs = cekOutlierGrubbsLog(cleanData);
    expect(logGrubbs.isBebasOutlier).toBe(true);
    expect(logGrubbs.outliers.length).toBe(0);
  });
});

describe('dataQualityMath - Uji Konsistensi RAPS & Homogenitas', () => {
  it('berhasil menghitung RAPS Q dan R statistik', () => {
    const data: RainfallData[] = [
      { tahun: 2014, hujan: 120 },
      { tahun: 2015, hujan: 130 },
      { tahun: 2016, hujan: 125 },
      { tahun: 2017, hujan: 140 },
      { tahun: 2018, hujan: 135 },
      { tahun: 2019, hujan: 122 },
      { tahun: 2020, hujan: 138 },
      { tahun: 2021, hujan: 129 },
      { tahun: 2022, hujan: 131 },
      { tahun: 2023, hujan: 126 },
    ];

    const raps = cekKonsistensiRAPS(data);
    expect(raps.isKonsisten).toBe(true);
    expect(raps.QHitung).toBeGreaterThan(0);
    expect(raps.RHitung).toBeGreaterThan(0);
    expect(raps.QKritis).toBeGreaterThan(0);
    expect(raps.RKritis).toBeGreaterThan(0);

    const homog = cekHomogenitas(data);
    expect(homog.isHomogen).toBe(true);
    expect(homog.fTest.lulus).toBe(true);
    expect(homog.tTest.lulus).toBe(true);
  });
});

describe('dataQualityMath - Double Mass Curve (DMC) & Koreksi Patahan', () => {
  it('berhasil melakukan cekDoubleMassCurve dan mendeteksi korelasi serta kelayakan', () => {
    const dataTarget: RainfallData[] = [
      { tahun: 2014, hujan: 1000 },
      { tahun: 2015, hujan: 1050 },
      { tahun: 2016, hujan: 1100 },
      { tahun: 2017, hujan: 950 },
      { tahun: 2018, hujan: 1200 },
      { tahun: 2019, hujan: 1150 },
      { tahun: 2020, hujan: 1080 },
      { tahun: 2021, hujan: 1220 },
      { tahun: 2022, hujan: 1180 },
      { tahun: 2023, hujan: 1250 },
    ];

    const dataRef: RainfallData[] = [
      { tahun: 2014, hujan: 1020 },
      { tahun: 2015, hujan: 1040 },
      { tahun: 2016, hujan: 1090 },
      { tahun: 2017, hujan: 980 },
      { tahun: 2018, hujan: 1180 },
      { tahun: 2019, hujan: 1140 },
      { tahun: 2020, hujan: 1090 },
      { tahun: 2021, hujan: 1210 },
      { tahun: 2022, hujan: 1170 },
      { tahun: 2023, hujan: 1240 },
    ];

    const dmc = cekDoubleMassCurve(dataTarget, dataRef);
    expect(dmc.dataPlot.length).toBe(10);
    expect(dmc.isKonsisten).toBe(true);
    expect(dmc.koreksiDiperlukan).toBe(false);
  });

  it('berhasil menerapkan applyDoubleMassCorrection pada data harian sebelum breakYear', () => {
    const records = [
      { tanggal: '2018-05-10', curah_hujan: 20.0 },
      { tanggal: '2019-11-15', curah_hujan: 50.0 },
      { tanggal: '2020-01-20', curah_hujan: 30.0 },
      { tanggal: '2021-08-05', curah_hujan: 40.0 },
    ];

    // Correction factor 1.25 for years before 2020
    const res = applyDoubleMassCorrection({
      records,
      faktorKoreksi: 1.25,
      breakYear: 2020,
    });

    expect(res.correctedCount).toBe(2); // 2018 and 2019
    expect(res.unchangedCount).toBe(2); // 2020 and 2021
    expect(res.faktorKoreksi).toBe(1.25);
    expect(res.breakYear).toBe(2020);

    // 2018-05-10: 20.0 * 1.25 = 25.0
    const rec1 = res.correctedRecords.find(r => r.tanggal === '2018-05-10');
    expect(rec1?.curah_hujan).toBe(25.0);
    expect(rec1?.was_corrected).toBe(true);

    // 2019-11-15: 50.0 * 1.25 = 62.5
    const rec2 = res.correctedRecords.find(r => r.tanggal === '2019-11-15');
    expect(rec2?.curah_hujan).toBe(62.5);
    expect(rec2?.was_corrected).toBe(true);

    // 2020-01-20: unchanged (>= 2020)
    const rec3 = res.correctedRecords.find(r => r.tanggal === '2020-01-20');
    expect(rec3?.curah_hujan).toBe(30.0);
    expect(rec3?.was_corrected).toBe(false);

    // 2021-08-05: unchanged (>= 2020)
    const rec4 = res.correctedRecords.find(r => r.tanggal === '2021-08-05');
    expect(rec4?.curah_hujan).toBe(40.0);
    expect(rec4?.was_corrected).toBe(false);
  });

  it('berhasil menggabungkan beberapa stasiun referensi menjadi satu deret komposit rata-rata', () => {
    const st1: RainfallData[] = [
      { tahun: 2020, hujan: 100 },
      { tahun: 2021, hujan: 200 },
    ];
    const st2: RainfallData[] = [
      { tahun: 2020, hujan: 120 },
      { tahun: 2021, hujan: 180 },
    ];
    const st3: RainfallData[] = [
      { tahun: 2020, hujan: 110 },
      { tahun: 2021, hujan: 220 },
    ];

    const composite = createCompositeReferenceSeries([st1, st2, st3]);
    expect(composite.length).toBe(2);
    // (100 + 120 + 110) / 3 = 110
    expect(composite[0].tahun).toBe(2020);
    expect(composite[0].hujan).toBe(110);
    // (200 + 180 + 220) / 3 = 200
    expect(composite[1].tahun).toBe(2021);
    expect(composite[1].hujan).toBe(200);
  });

  it('berhasil mendeteksi patahan struktural (Chow Test) dan mendukung customBreakYear', () => {
    // Data dengan perubahan kemiringan nyata di tahun 2019
    // 2014-2018: rasio Target/Ref ≈ 0.50 (sensor lama)
    // 2019-2023: rasio Target/Ref ≈ 1.00 (sensor baru)
    const dataTarget: RainfallData[] = [
      { tahun: 2014, hujan: 500 },
      { tahun: 2015, hujan: 520 },
      { tahun: 2016, hujan: 480 },
      { tahun: 2017, hujan: 510 },
      { tahun: 2018, hujan: 500 },
      { tahun: 2019, hujan: 1000 },
      { tahun: 2020, hujan: 1050 },
      { tahun: 2021, hujan: 980 },
      { tahun: 2022, hujan: 1020 },
      { tahun: 2023, hujan: 1000 },
    ];

    const dataRef: RainfallData[] = [
      { tahun: 2014, hujan: 1000 },
      { tahun: 2015, hujan: 1000 },
      { tahun: 2016, hujan: 1000 },
      { tahun: 2017, hujan: 1000 },
      { tahun: 2018, hujan: 1000 },
      { tahun: 2019, hujan: 1000 },
      { tahun: 2020, hujan: 1000 },
      { tahun: 2021, hujan: 1000 },
      { tahun: 2022, hujan: 1000 },
      { tahun: 2023, hujan: 1000 },
    ];

    const dmc = cekDoubleMassCurve(dataTarget, dataRef);
    expect(dmc.isKonsisten).toBe(false);
    expect(dmc.koreksiDiperlukan).toBe(true);
    // Breakpoint terdeteksi sekitar tahun 2019
    expect(dmc.breakYear).toBe(2019);
    // Faktor koreksi pasca/pra: ~1.0 / ~0.5 ≈ ~2.0
    expect(dmc.faktorKoreksi).toBeGreaterThan(1.8);
    expect(dmc.candidates?.length).toBeGreaterThan(0);

    // Pengujian opsi customBreakYear
    const dmcCustom = cekDoubleMassCurve(dataTarget, dataRef, { customBreakYear: 2018 });
    expect(dmcCustom.breakYear).toBe(2018);
  });
});

