import { describe, it, expect } from 'vitest';
import { calculatePert, calculatePoker, EstimatePayload, PokerEstimatePayload } from '../logic';

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
            // (6 - 2) / 6 = 0.666... -> 0.67
            expect(result.stdDev).toBe(0.67);
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
            // (1.5 + 10 + 4.5) / 6 = 16 / 6 = 2.666 -> 2.67
            const result = calculatePert(payload);
            expect(result.score).toBe(2.67);
        });

        it('handles wide variance', () => {
            const payload: EstimatePayload = {
                optimistic: 1,
                mostLikely: 5,
                pessimistic: 20
            };
            // (1 + 20 + 20) / 6 = 41 / 6 = 6.833 -> 6.83
            const result = calculatePert(payload);
            expect(result.score).toBe(6.83);
        });
    });

    describe('calculatePoker', () => {
        it('calculates expected score correctly', () => {
            const payload: PokerEstimatePayload = {
                value: 5
            };
            const result = calculatePoker(payload);
            expect(result.score).toBe(5);
            expect(result.stdDev).toBeUndefined();
        });
    });
});
