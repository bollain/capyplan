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
    const score = (optimistic + 4 * mostLikely + pessimistic) / 6;
    const stdDev = (pessimistic - optimistic) / 6;

    return {
        score: parseFloat(score.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2)),
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
