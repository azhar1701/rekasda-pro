import { describe, it, expect } from 'vitest';
import { calculateSedimentYield } from './embungEngine';

describe('Embung Engine', () => {
    describe('calculateSedimentYield', () => {
        it('calculates total sediment volume correctly', () => {
            const input = {
                qData: [2.5, 5.1, 8.2],
                qsData: [0.032, 0.123, 0.297], // ton/hari  (Q * Cs * 0.0864)
                luasDas: 45.5,
                beratJenis: 1.2,
                bedLoadPercentage: 15,
                flowDurationDays: [120, 125, 80],
                flowDurationQ: [2.5, 5.1, 8.2]
            };

            const result = calculateSedimentYield(input);
            expect(result.totalLoadTonnes).toBeGreaterThan(0);
            expect(result.totalVolumeM3).toBeGreaterThan(0);
            expect(result.erosionRateMm).toBeGreaterThan(0);
        });
        
        it('returns error result if input arrays have different lengths', () => {
            const input = {
                qData: [2.5, 5.1],
                qsData: [0.032, 0.123, 0.297],
                luasDas: 45.5,
                beratJenis: 1.2,
                bedLoadPercentage: 15,
                flowDurationDays: [120, 125, 80],
                flowDurationQ: [2.5, 5.1, 8.2]
            };

            expect(() => calculateSedimentYield(input)).toThrow('Invalid sediment data samples');
        });
    });
});
