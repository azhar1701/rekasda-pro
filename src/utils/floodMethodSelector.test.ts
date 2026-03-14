import { describe, it, expect } from 'vitest';
import { determineFloodMethod } from './floodMethodSelector';

describe('Flood Method Recommender Engine - determineFloodMethod()', () => {
 it('Should recommend Rasional for small DAS (<= 3 km2)', () => {
 const res = determineFloodMethod(2.5);
 expect(res.metode).toBe('Rasional');
 expect(res.isRasional).toBe(true);
 expect(res.status).toBe('ready');
 });

 it('Should recommend Rasional at exact boundary (3.0 km2)', () => {
 const res = determineFloodMethod(3.0);
 expect(res.metode).toBe('Rasional');
 expect(res.isRasional).toBe(true);
 expect(res.status).toBe('ready');
 });

 it('Should recommend HSS Nakayasu for large DAS (> 3 km2)', () => {
 const res = determineFloodMethod(3.1);
 expect(res.metode).toBe('HSS Nakayasu');
 expect(res.isRasional).toBe(false);
 expect(res.status).toBe('ready');
 });

 it('Should handle string input correctly', () => {
 const res = determineFloodMethod("2.5");
 expect(res.metode).toBe('Rasional');
 expect(res.status).toBe('ready');

 const res2 = determineFloodMethod("150");
 expect(res2.metode).toBe('HSS Nakayasu');
 expect(res2.status).toBe('ready');
 });

 it('Defensive: handle 0 or negative value', () => {
 const res0 = determineFloodMethod(0);
 expect(res0.status).toBe('not_ready');
 expect(res0.metode).toBe('None');

 const resNeg = determineFloodMethod(-1.5);
 expect(resNeg.status).toBe('not_ready');
 });

 it('Defensive: handle null/undefined/empty', () => {
 expect(determineFloodMethod(null).status).toBe('not_ready');
 expect(determineFloodMethod(undefined as any).status).toBe('not_ready');
 expect(determineFloodMethod("").status).toBe('not_ready');
 });

 it('Defensive: handle NaN strings', () => {
 expect(determineFloodMethod("invalid").status).toBe('not_ready');
 });
});
