export interface PertAnalysis {
    avgScore: string;
    teamStdDev: string;
    disagreementLevel: 'Low' | 'Medium' | 'High';
    disagreementColor: string;
}

export interface RiskAnalysis {
    level: 'Low' | 'Medium' | 'High';
    color: string;
    text: string;
}

export function calculateTeamStats(results: Record<string, { score: number }>): PertAnalysis {
    const scores = Object.values(results)
        .map((r) => r.score)
        .filter(n => typeof n === 'number');

    const count = scores.length;

    if (count === 0) {
        return {
            avgScore: '0.00',
            teamStdDev: '0.00',
            disagreementLevel: 'Low',
            disagreementColor: '#4caf50'
        };
    }

    const sum = scores.reduce((a, b) => a + b, 0);
    const mean = sum / count;

    // Use Population Standard Deviation (divide by N)
    // Matches backend logic in apps/signal/src/logic.ts
    const squareDiffs = scores.map(score => Math.pow(score - mean, 2));
    const sumSquareDiff = squareDiffs.reduce((a, b) => a + b, 0);
    const variance = sumSquareDiff / count; // Population variance
    const stdDevVal = Math.sqrt(variance);

    const teamStdDev = stdDevVal.toFixed(2);

    let disagreementLevel: PertAnalysis['disagreementLevel'] = 'Low';
    let disagreementColor = '#4caf50';

    if (stdDevVal >= 1.0) {
        disagreementLevel = 'High';
        disagreementColor = '#f44336';
    } else if (stdDevVal >= 0.5) {
        disagreementLevel = 'Medium';
        disagreementColor = '#ff9800';
    }

    return {
        avgScore: mean.toFixed(2),
        teamStdDev,
        disagreementLevel,
        disagreementColor
    };
}

export function getRiskLevel(stdDev: number): RiskAnalysis {
    if (stdDev >= 1.0) {
        return { level: 'High', color: '#f44336', text: 'High Risk' };
    }
    if (stdDev >= 0.5) {
        return { level: 'Medium', color: '#ff9800', text: 'Medium Risk' };
    }
    return { level: 'Low', color: '#4caf50', text: 'Low Risk' };
}
