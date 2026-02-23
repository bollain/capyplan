import { describe, it, expect } from 'vitest';
import { calculateTeamStats, getRiskLevel } from '../pert';

describe('calculateTeamStats', () => {
    it('calculates average and stdDev correctly for basic scores', () => {
        const results = {
            'u1': { score: 1 },
            'u2': { score: 3 },
            'u3': { score: 5 },
        };
        const stats = calculateTeamStats(results);
        // Avg: (1+3+5)/3 = 3.00
        // StdDev (Population): sqrt( ((1-3)^2 + (3-3)^2 + (5-3)^2) / 3 ) = sqrt( (4+0+4) / 3 ) = sqrt(2.666) = 1.63
        expect(stats.avgScore).toBe('3.00');
        expect(stats.teamStdDev).toBe('1.63');
        expect(stats.disagreementLevel).toBe('High'); // >= 1.0 is High
    });

    it('handles unanimous vote', () => {
        const results = {
            'u1': { score: 5 },
            'u2': { score: 5 },
        };
        const stats = calculateTeamStats(results);
        expect(stats.avgScore).toBe('5.00');
        expect(stats.teamStdDev).toBe('0.00');
        expect(stats.disagreementLevel).toBe('Low');
    });

    it('handles empty results', () => {
        const results = {};
        const stats = calculateTeamStats(results);
        expect(stats.avgScore).toBe('0.00');
        expect(stats.teamStdDev).toBe('0.00'); // default for <= 1 score
    });

    it('ignores non-number scores', () => {
        const results = {
            'u1': { score: 5 },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stats = calculateTeamStats(results as any);
        expect(stats.avgScore).toBe('5.00');
    });
});

describe('getRiskLevel', () => {
    it('returns Low risk for low stdDev', () => {
        expect(getRiskLevel(0.49).level).toBe('Low');
    });

    it('returns Medium risk for stdDev >= 0.5', () => {
        expect(getRiskLevel(0.5).level).toBe('Medium');
        expect(getRiskLevel(0.99).level).toBe('Medium');
    });

    it('returns High risk for stdDev >= 1.0', () => {
        expect(getRiskLevel(1.0).level).toBe('High');
        expect(getRiskLevel(2.5).level).toBe('High');
    });
});
