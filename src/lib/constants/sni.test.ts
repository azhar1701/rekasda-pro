/**
 * sni.test.ts — Unit Tests for SNI Constants & Boundary Check Utility
 *
 * Memverifikasi checkSNIBoundary() menghasilkan severity dan pesan
 * yang tepat untuk setiap kondisi batas SNI 2415:2016.
 */

import { describe, it, expect } from 'vitest';
import {
  checkSNIBoundary,
  SNI_METHOD_BOUNDARIES,
  SNI_METADATA,
  SNI_RATIONAL_AREA_LIMIT_HA,
  SNI_RATIONAL_AREA_LIMIT_KM2,
} from './sni';

// ─── Constants sanity ──────────────────────────────────────────────────────────
describe('SNI Constants', () => {
  it('SNI_RATIONAL_AREA_LIMIT_HA harus 5000', () => {
    expect(SNI_RATIONAL_AREA_LIMIT_HA).toBe(5000);
  });

  it('SNI_RATIONAL_AREA_LIMIT_KM2 harus 50', () => {
    expect(SNI_RATIONAL_AREA_LIMIT_KM2).toBe(50);
  });

  it('SNI_METHOD_BOUNDARIES harus memiliki 5 entri', () => {
    expect(Object.keys(SNI_METHOD_BOUNDARIES)).toHaveLength(5);
  });

  it('SNI_METADATA harus memiliki color valid', () => {
    const validColors = ['blue', 'green', 'amber', 'red'];
    for (const meta of Object.values(SNI_METADATA)) {
      expect(validColors).toContain(meta.color);
    }
  });

  it('SNI_METHOD_BOUNDARIES RASIONAL.maxAreaKm2 === 50', () => {
    expect(SNI_METHOD_BOUNDARIES.RASIONAL.maxAreaKm2).toBe(50);
  });

  it('SNI_METHOD_BOUNDARIES HSS_NAKAYASU.minAreaKm2 === 0.1', () => {
    expect(SNI_METHOD_BOUNDARIES.HSS_NAKAYASU.minAreaKm2).toBe(0.1);
  });
});

// ─── checkSNIBoundary ─────────────────────────────────────────────────────────
describe('checkSNIBoundary', () => {
  describe('RASIONAL — Area dalam batas optimal (≤ 3 km²)', () => {
    it('A = 1 km² → severity ok', () => {
      const r = checkSNIBoundary('RASIONAL', 1);
      expect(r.severity).toBe('ok');
      expect(r.isWithinBounds).toBe(true);
      expect(r.message).toBeNull();
    });

    it('A = 3 km² (batas optimal) → severity ok', () => {
      const r = checkSNIBoundary('RASIONAL', 3);
      expect(r.severity).toBe('ok');
    });
  });

  describe('RASIONAL — Area zona warning (3–50 km²)', () => {
    it('A = 4.5 km² → severity warning, masih dalam batas', () => {
      const r = checkSNIBoundary('RASIONAL', 4.5);
      expect(r.severity).toBe('warning');
      expect(r.isWithinBounds).toBe(true);
      expect(r.message).toContain('4.50 km²');
      expect(r.reference).toContain('SNI 2415:2016');
    });

    it('A = 49.9 km² → severity warning, masih diizinkan', () => {
      const r = checkSNIBoundary('RASIONAL', 49.9);
      expect(r.severity).toBe('warning');
      expect(r.isWithinBounds).toBe(true);
    });
  });

  describe('RASIONAL — Area melebihi batas SNI (> 50 km²)', () => {
    it('A = 51 km² → severity error, di luar batas', () => {
      const r = checkSNIBoundary('RASIONAL', 51);
      expect(r.severity).toBe('error');
      expect(r.isWithinBounds).toBe(false);
      expect(r.message).toContain('Gunakan HSS Nakayasu');
    });

    it('A = 600 km² → severity error, jauh di luar batas', () => {
      const r = checkSNIBoundary('RASIONAL', 600);
      expect(r.severity).toBe('error');
      expect(r.isWithinBounds).toBe(false);
    });
  });

  describe('RASIONAL — Tc boundary check', () => {
    it('Tc = 5.5 jam → severity ok (masih ≤ 6 jam)', () => {
      const r = checkSNIBoundary('RASIONAL', undefined, 5.5);
      expect(r.severity).toBe('ok');
    });

    it('Tc = 6.1 jam → severity warning (> 6 jam)', () => {
      const r = checkSNIBoundary('RASIONAL', undefined, 6.1);
      expect(r.severity).toBe('warning');
      expect(r.isWithinBounds).toBe(false);
      expect(r.message).toContain('Tc');
    });
  });

  describe('HSS_NAKAYASU — selalu ok untuk area (tidak ada batas maks.)', () => {
    it('A = 500 km² → severity ok', () => {
      const r = checkSNIBoundary('HSS_NAKAYASU', 500);
      expect(r.severity).toBe('ok');
      expect(r.isWithinBounds).toBe(true);
    });
  });

  describe('FJ_MOCK / EMBUNG — selalu ok tanpa area', () => {
    it('FJ_MOCK tanpa area → severity ok', () => {
      const r = checkSNIBoundary('FJ_MOCK');
      expect(r.severity).toBe('ok');
    });

    it('EMBUNG tanpa area → severity ok', () => {
      const r = checkSNIBoundary('EMBUNG');
      expect(r.severity).toBe('ok');
    });
  });

  describe('Metode tidak dikenal', () => {
    it('method tidak valid → severity ok (no-op graceful)', () => {
      const r = checkSNIBoundary('UNKNOWN_METHOD' as any);
      expect(r.severity).toBe('ok');
      expect(r.isWithinBounds).toBe(true);
    });
  });

  describe('Reference string format', () => {
    it('reference selalu berformat "SNI xxxx:yyyy Pasal z.z"', () => {
      const r = checkSNIBoundary('RASIONAL', 51);
      expect(r.reference).toMatch(/SNI \d+:\d+ Pasal \d+\.\d+/);
    });
  });
});
