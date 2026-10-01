import { describe, it, expect } from 'vitest';
import {
  parseRainfallValue,
  isValidDate,
  parseBulkMatrixText,
  chunkArray,
  RAINFALL_LIMITS,
} from '../rainfallSanitizer';

describe('rainfallSanitizer QA Suite', () => {
  describe('parseRainfallValue', () => {
    it('should parse valid positive rainfall correctly', () => {
      expect(parseRainfallValue(12.5)).toEqual({ val: 12.5, warning: undefined });
      expect(parseRainfallValue('25,7')).toEqual({ val: 25.7, warning: undefined });
      expect(parseRainfallValue('0')).toEqual({ val: 0, warning: undefined });
      expect(parseRainfallValue(0)).toEqual({ val: 0, warning: undefined });
    });

    it('should convert missing data codes to null without throwing', () => {
      expect(parseRainfallValue('-').val).toBeNull();
      expect(parseRainfallValue('–').val).toBeNull();
      expect(parseRainfallValue('NR').val).toBeNull();
      expect(parseRainfallValue('nr').val).toBeNull();
      expect(parseRainfallValue('NA').val).toBeNull();
      expect(parseRainfallValue('').val).toBeNull();
      expect(parseRainfallValue('8888').val).toBeNull();
      expect(parseRainfallValue('9999').val).toBeNull();
      expect(parseRainfallValue(null).val).toBeNull();
      expect(parseRainfallValue(undefined).val).toBeNull();
    });

    it('should normalize negative rainfall to 0.0 with warning', () => {
      const res = parseRainfallValue(-5);
      expect(res.val).toBe(0);
      expect(res.warning).toBeDefined();
    });

    it('should trigger warning for extreme rainfall (> 300 mm)', () => {
      const res = parseRainfallValue(350);
      expect(res.val).toBe(350);
      expect(res.warning).toContain('hujan ekstrem');
    });

    it('should reject rainfall exceeding maximum physical ceiling (> 600 mm)', () => {
      const res = parseRainfallValue(850);
      expect(res.val).toBeNull();
      expect(res.error).toContain('melampaui batas fisik maksimum');
    });
  });

  describe('isValidDate', () => {
    it('should correctly validate Gregorian dates', () => {
      expect(isValidDate(2024, 2, 29)).toBe(true);  // 2024 leap year
      expect(isValidDate(2023, 2, 29)).toBe(false); // 2023 non-leap
      expect(isValidDate(2024, 4, 30)).toBe(true);
      expect(isValidDate(2024, 4, 31)).toBe(false); // April has 30 days
      expect(isValidDate(2024, 12, 31)).toBe(true);
    });
  });

  describe('parseBulkMatrixText', () => {
    it('should parse 31x12 matrix text lines correctly', () => {
      const sampleText = `
        1   0.0   12.5   -   0.0   5.5   0   0   0   0   0   0   0
        2   5.2   0.0    0.0 14.1  -     0   0   0   0   0   0   0
      `;
      const result = parseBulkMatrixText(sampleText, 2024);
      expect(result.records.length).toBeGreaterThan(0);
      expect(result.missingCount).toBe(2); // two '-' values
      expect(result.errors.length).toBe(0);
      expect(result.yearSummary[2024]).toBeDefined();
    });
  });

  describe('chunkArray', () => {
    it('should chunk array into batches of specified size', () => {
      const data = Array.from({ length: 1000 }, (_, i) => i);
      const chunks = chunkArray(data, 365);
      expect(chunks.length).toBe(3); // 365 + 365 + 270
      expect(chunks[0].length).toBe(365);
      expect(chunks[1].length).toBe(365);
      expect(chunks[2].length).toBe(270);
    });
  });
});
