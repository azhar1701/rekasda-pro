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
