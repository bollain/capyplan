import { EstimationMode } from '@capyplan/protocol';

export interface EstimatePayload {
    optimistic: number;
    mostLikely: number;
    pessimistic: number;
}

export interface EstimationResult {
    score: number;
    stdDev?: number; // Standard deviation for PERT
}

/**
 * Calculates PERT estimate (Program Evaluation and Review Technique)
 * Formula: (Optimistic + 4 * MostLikely + Pessimistic) / 6
 * Standard Deviation: (Pessimistic - Optimistic) / 6
 */
export function calculatePert(payload: EstimatePayload): EstimationResult {
    const { optimistic, mostLikely, pessimistic } = payload;

    // Return raw values. Rounding happens at display/storage edge.
    const score = (optimistic + 4 * mostLikely + pessimistic) / 6;
    // Use Math.abs so standard deviation is positive even if inputs are swapped
    const stdDev = Math.abs(pessimistic - optimistic) / 6;

    return {
        score,
        stdDev,
    };
}

/**
 * Strategy pattern for future modes (e.g., Fibonacci, Planning Poker)
 */
export function calculateEstimate(mode: EstimationMode, payload: unknown): EstimationResult {
    switch (mode) {
        case EstimationMode.PERT:
            return calculatePert(payload as EstimatePayload);
        default:
            throw new Error(`Unsupported estimation mode: ${mode}`);
    }
}

export interface GroupStats {
    mean: number;
    stddev: number;
    median: number;
    min: number;
    max: number;
    histogram: Record<string, number>;
}

export function calculateExtendedStats(results: EstimationResult[], roundTo: number = 2): GroupStats {
    if (results.length === 0) {
        return { mean: 0, stddev: 0, median: 0, min: 0, max: 0, histogram: {} };
    }

    const scores = results.map(r => r.score).sort((a, b) => a - b);
    const count = scores.length;

    // Mean
    const sum = scores.reduce((a, b) => a + b, 0);
    const mean = sum / count;

    // StdDev (Population Standard Deviation)
    // We use N (not N-1) because we are treating this specific group's votes 
    // as the complete population we care about for this session's stats.
    const squareDiffs = scores.map(score => Math.pow(score - mean, 2));
    const sumSquareDiff = squareDiffs.reduce((a, b) => a + b, 0);
    const variance = count > 0 ? sumSquareDiff / count : 0;
    const stdDev = Math.sqrt(variance);

    // Median
    let median = 0;
    if (count % 2 === 0) {
        median = (scores[count / 2 - 1] + scores[count / 2]) / 2;
    } else {
        median = scores[Math.floor(count / 2)];
    }

    // Min/Max
    const min = scores[0];
    const max = scores[count - 1];

    // Helper to round
    const round = (val: number) => parseFloat(val.toFixed(roundTo));

    // Histogram
    // Use fixed precision for keys to ensure stability (e.g. "5.33" instead of "5.3333333333")
    const histogram: Record<string, number> = {};
    for (const score of scores) {
        const key = score.toFixed(roundTo);
        histogram[key] = (histogram[key] || 0) + 1;
    }

    return {
        mean: round(mean),
        stddev: round(stdDev),
        median: round(median),
        min: round(min),
        max: round(max),
        histogram
    };
}
