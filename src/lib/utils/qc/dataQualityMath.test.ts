import { describe, it, expect } from 'vitest';
import { 
  runFullQC, 
  validateDataLength, 
  QCValidationError,
  cekKonsistensiRAPS,
  cekOutlierGrubbs,
  cekHomogenitas,
  cekDoubleMassCurve
} from './dataQualityMath';

describe('Data Quality Control Math Utilities', () => {
  const validData = [
    { tahun: 2010, hujan: 120 },
    { tahun: 2011, hujan: 135 },
    { tahun: 2012, hujan: 98 },
    { tahun: 2013, hujan: 142 },
    { tahun: 2014, hujan: 115 },
    { tahun: 2015, hujan: 128 },
    { tahun: 2016, hujan: 105 },
    { tahun: 2017, hujan: 138 },
    { tahun: 2018, hujan: 122 },
    { tahun: 2019, hujan: 131 },
  ];

  describe('validateDataLength', () => {
    it('should pass for valid data (10-100 years)', () => {
      expect(() => validateDataLength(validData)).not.toThrow();
    });

    it('should throw error for less than 10 years', () => {
      const shortData = validData.slice(0, 5);
      expect(() => validateDataLength(shortData)).toThrow(QCValidationError);
      try {
        validateDataLength(shortData);
      } catch (e: any) {
        expect(e.code).toBe('INSUFFICIENT_DATA');
      }
    });

    it('should throw error for negative rainfall', () => {
      const negativeData = [...validData];
      negativeData[0] = { tahun: 2010, hujan: -10 };
      expect(() => validateDataLength(negativeData)).toThrow(QCValidationError);
      try {
        validateDataLength(negativeData);
      } catch (e: any) {
        expect(e.code).toBe('NEGATIVE_RAINFALL');
      }
    });

    it('should throw error for duplicate years', () => {
      const duplicateData = [...validData, { tahun: 2019, hujan: 100 }];
      expect(() => validateDataLength(duplicateData)).toThrow(QCValidationError);
    });
  });

  const consistentData = [
    { tahun: 2010, hujan: 100 },
    { tahun: 2011, hujan: 101 },
    { tahun: 2012, hujan: 99 },
    { tahun: 2013, hujan: 100 },
    { tahun: 2014, hujan: 101 },
    { tahun: 2015, hujan: 99 },
    { tahun: 2016, hujan: 100 },
    { tahun: 2017, hujan: 101 },
    { tahun: 2018, hujan: 99 },
    { tahun: 2019, hujan: 100 },
  ];

  describe('cekKonsistensiRAPS', () => {
    it('should detect consistent data', () => {
      const result = cekKonsistensiRAPS(consistentData);
      expect(result.isKonsisten).toBe(true);
      expect(result.QHitung).toBeLessThanOrEqual(result.QKritis);
      expect(result.RHitung).toBeLessThanOrEqual(result.RKritis);
    });

    it('should detect inconsistent data (simulated break)', () => {
      const inconsistentData = [
        { tahun: 2010, hujan: 100 },
        { tahun: 2011, hujan: 105 },
        { tahun: 2012, hujan: 110 },
        { tahun: 2013, hujan: 100 },
        { tahun: 2014, hujan: 105 },
        { tahun: 2015, hujan: 300 }, // Big jump
        { tahun: 2016, hujan: 310 },
        { tahun: 2017, hujan: 305 },
        { tahun: 2018, hujan: 315 },
        { tahun: 2019, hujan: 300 },
      ];
      const result = cekKonsistensiRAPS(inconsistentData);
      expect(result.isKonsisten).toBe(false);
    });
  });

  describe('cekOutlierGrubbs', () => {
    it('should pass for data without outliers', () => {
      const result = cekOutlierGrubbs(validData);
      expect(result.isBebasOutlier).toBe(true);
      expect(result.outliers.length).toBe(0);
    });

    it('should detect high outliers', () => {
      const dataWithOutlier = [...validData, { tahun: 2020, hujan: 1000 }];
      const result = cekOutlierGrubbs(dataWithOutlier);
      expect(result.isBebasOutlier).toBe(false);
      expect(result.outliers[0].type).toBe('HIGH');
    });

    it('should detect low outliers', () => {
      const dataWithOutlier = [...validData, { tahun: 2020, hujan: 1 }];
      const result = cekOutlierGrubbs(dataWithOutlier);
      expect(result.isBebasOutlier).toBe(false);
      expect(result.outliers[0].type).toBe('LOW');
    });
  });

  describe('cekHomogenitas', () => {
    it('should pass for homogeneous data', () => {
      const result = cekHomogenitas(validData);
      expect(result.isHomogen).toBe(true);
    });

    it('should detect non-homogeneous data (varians change)', () => {
      const nonHomogenData = [
        { tahun: 2010, hujan: 100 },
        { tahun: 2011, hujan: 101 },
        { tahun: 2012, hujan: 100 },
        { tahun: 2013, hujan: 101 },
        { tahun: 2014, hujan: 100 },
        { tahun: 2015, hujan: 100 }, // Varians kecil di awal
        { tahun: 2016, hujan: 50 },  // Varians besar di akhir
        { tahun: 2017, hujan: 250 },
        { tahun: 2018, hujan: 50 },
        { tahun: 2019, hujan: 250 },
      ];
      const result = cekHomogenitas(nonHomogenData);
      // Might fail F-Test or t-Test
      expect(result.isHomogen).toBe(false);
    });
  });

  describe('cekDoubleMassCurve', () => {
    it('should detect consistency between target and reference', () => {
      const referenceData = validData.map(d => ({ tahun: d.tahun, hujan: d.hujan * 1.1 }));
      const result = cekDoubleMassCurve(validData, referenceData);
      expect(result.isKonsisten).toBe(true);
    });

    it('should detect break in double mass curve', () => {
      const referenceData = validData.map(d => ({ tahun: d.tahun, hujan: 120 }));
      const inconsistentTarget = [
        ...validData.slice(0, 5).map(d => ({ tahun: d.tahun, hujan: 100 })),
        ...validData.slice(5).map(d => ({ tahun: d.tahun, hujan: 300 })),
      ];
      const result = cekDoubleMassCurve(inconsistentTarget, referenceData);
      expect(result.isKonsisten).toBe(false);
      expect(result.koreksiDiperlukan).toBe(true);
    });
  });

  describe('runFullQC', () => {
    it('should return aggregated results', () => {
      const result = runFullQC(validData);
      expect(result).toHaveProperty('isKonsisten');
      expect(result).toHaveProperty('isBebasOutlier');
      expect(result).toHaveProperty('isHomogen');
      expect(result.details).toBeDefined();
    });
  });
});
