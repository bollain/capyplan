import { describe, it, expect } from 'vitest';
import { calculatePert, EstimatePayload, calculateExtendedStats } from '../logic';

describe('Signal Logic', () => {
    describe('calculatePert', () => {
        it('calculates expected score correctly', () => {
            const payload: EstimatePayload = {
                optimistic: 2,
                mostLikely: 4,
                pessimistic: 6
            };
            // (2 + 4*4 + 6) / 6 = 24 / 6 = 4
            const result = calculatePert(payload);
            expect(result.score).toBe(4);
            // (6 - 2) / 6 = 0.666...
            expect(result.stdDev).toBeCloseTo(0.67, 2);
        });

        it('handles identical estimates', () => {
            const payload: EstimatePayload = {
                optimistic: 5,
                mostLikely: 5,
                pessimistic: 5
            };
            const result = calculatePert(payload);
            expect(result.score).toBe(5);
            expect(result.stdDev).toBe(0);
        });

        it('handles decimals', () => {
            const payload: EstimatePayload = {
                optimistic: 1.5,
                mostLikely: 2.5,
                pessimistic: 4.5
            };
            // (1.5 + 10 + 4.5) / 6 = 16 / 6 = 2.666...
            const result = calculatePert(payload);
            expect(result.score).toBeCloseTo(2.67, 2);
        });

        it('handles wide variance', () => {
            const payload: EstimatePayload = {
                optimistic: 1,
                mostLikely: 5,
                pessimistic: 20
            };
            // (1 + 20 + 20) / 6 = 41 / 6 = 6.833...
            const result = calculatePert(payload);
            expect(result.score).toBeCloseTo(6.83, 2);
        });

        it('handles swapped optimistic and pessimistic values via Math.abs', () => {
            const payload: EstimatePayload = {
                optimistic: 6,
                mostLikely: 4,
                pessimistic: 2
            };
            // Values are swapped, but formula should still treat it the same:
            // Score = (6 + 4*4 + 2) / 6 = 24 / 6 = 4
            const result = calculatePert(payload);
            expect(result.score).toBe(4);
            // StdDev = Math.abs(2 - 6) / 6 = 4 / 6 = 0.666...
            expect(result.stdDev).toBeCloseTo(0.67, 2);
        });
    });

    describe('calculateExtendedStats', () => {

        it('calculates population standard deviation correctly', () => {
            // Population: [2, 4, 4, 4, 5, 5, 7, 9]
            // Mean = 5
            // Population Variance (divide by N=8) = 4
            // Population StdDev = 2
            const results = [
                { score: 2 }, { score: 4 }, { score: 4 }, { score: 4 },
                { score: 5 }, { score: 5 }, { score: 7 }, { score: 9 }
            ];

            const stats = calculateExtendedStats(results);
            expect(stats.mean).toBe(5);
            expect(stats.stddev).toBe(2);
            expect(stats.min).toBe(2);
            expect(stats.max).toBe(9);
        });

        it('handles stable histogram keys', () => {
            const results = [{ score: 1 / 3 }, { score: 1 / 3 }]; // 0.333...
            const stats = calculateExtendedStats(results);
            expect(stats.histogram).toHaveProperty('0.33');
            expect(stats.histogram['0.33']).toBe(2);
        });
    });
});
