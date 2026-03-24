import { describe, it, expect } from 'vitest';
import { convolveUnitHydrograph, resampleUnitHydrograph, computeDesignFloodHydrograph } from './convolution';

describe('Flood Convolution Engine', () => {
    const mockUH = [
        { time: 0, discharge: 0 },
        { time: 1, discharge: 5 },
        { time: 2, discharge: 15 },
        { time: 3, discharge: 8 },
        { time: 4, discharge: 2 },
        { time: 5, discharge: 0 }
    ];

    describe('resampleUnitHydrograph', () => {
        it('resamples a fine UH into a coarser UH using linear interpolation', () => {
            const fineUH = [
                { time: 0.0, discharge: 0.0 },
                { time: 0.5, discharge: 2.5 },
                { time: 1.0, discharge: 5.0 },
                { time: 1.5, discharge: 10.0 },
                { time: 2.0, discharge: 15.0 },
                { time: 2.5, discharge: 11.5 },
                { time: 3.0, discharge: 8.0 }
            ];

            const coarseUH = resampleUnitHydrograph(fineUH, 1.0);
            
            // Should contain t=0, t=1, t=2, t=3
            expect(coarseUH).toHaveLength(4);
            expect(coarseUH[0]).toEqual({ time: 0, discharge: 0 });
            expect(coarseUH[1]).toEqual({ time: 1.0, discharge: 5.0 });
            expect(coarseUH[2]).toEqual({ time: 2.0, discharge: 15.0 });
            expect(coarseUH[3]).toEqual({ time: 3.0, discharge: 8.0 });
        });

        it('handles resampling beyond the original UH duration safely', () => {
            const coarseUH = resampleUnitHydrograph(mockUH, 2.0);
            expect(coarseUH).toHaveLength(4); // t=0, t=2, t=4, t=6
            expect(coarseUH.find(p => p.time === 6)?.discharge).toBe(0); // Clamped due to exceeding maxTime
        });
    });

    describe('convolveUnitHydrograph', () => {
        it('convolves UH with effective rainfall correctly', () => {
            // Rainfall: 10mm at t=1, 5mm at t=2
            const effectiveRainfall = [10, 5];
            
            const result = convolveUnitHydrograph({
                unitHydrograph: mockUH,
                effectiveRainfall,
                timeStep: 1.0
            });

            // Length should be UH length (6) + rainfall length (2) - 1 = 7
            const dfh = result.floodHydrograph;
            expect(dfh).toHaveLength(7);
            
            // Expected convolution math:
            // t=0: 10*0 = 0
            // t=1: 10*5 = 50
            // t=2: 10*15 + 5*5 (rain2 shifted) = 150 + 25 = 175
            // t=3: 10*8 + 5*15 = 80 + 75 = 155
            // t=4: 10*2 + 5*8 = 20 + 40 = 60
            // t=5: 10*0 + 5*2 = 10
            // t=6: 0 + 5*0 = 0
            
            expect(dfh[0].discharge).toBe(0);
            expect(dfh[1].discharge).toBe(50);
            expect(dfh[2].discharge).toBe(175);
            expect(dfh[3].discharge).toBe(155);
            expect(dfh[4].discharge).toBe(60);
            expect(dfh[5].discharge).toBe(10);
            expect(dfh[6].discharge).toBe(0);
            
            expect(result.peakDischarge).toBe(175);
            expect(result.timeToPeak).toBe(2);
        });
    });

    describe('computeDesignFloodHydrograph', () => {
        it('handles the full pipeline from raw UH and rainfall', () => {
            // UH has 0.5h timestep, Rainfall is 1h timestep
            const fineUH = [
                { time: 0.0, discharge: 0.0 },
                { time: 0.5, discharge: 1.0 },
                { time: 1.0, discharge: 2.0 },
                { time: 1.5, discharge: 4.0 },
                { time: 2.0, discharge: 6.0 },
                { time: 2.5, discharge: 4.0 },
                { time: 3.0, discharge: 2.0 },
                { time: 3.5, discharge: 0.0 }
            ];
            
            const abmRainfall = [5, 10]; // 5mm in hour 1, 10mm in hour 2
            
            const result = computeDesignFloodHydrograph(fineUH, abmRainfall, 0.5);
            
            // First it resamples fineUH to 1.0h timeStep:
            // [ {0,0}, {1,2}, {2,6}, {3,2}, {4,0} ] -> length 5
            // Then convolution: length = 5 + 2 - 1 = 6
            const ds = result.floodHydrograph.map(p => p.discharge);
            
            // t=0: 5*0 = 0
            // t=1: 5*2 = 10
            // t=2: 5*6 + 10*2 = 30 + 20 = 50
            // t=3: 5*2 + 10*6 = 10 + 60 = 70
            // t=4: 5*0 + 10*2 = 20
            // t=5: 0 + 10*0 = 0
            
            expect(ds).toEqual([0, 10, 50, 70, 20, 0]);
            expect(result.peakDischarge).toBe(70);
            expect(result.timeToPeak).toBe(3);
        });
    });
});
