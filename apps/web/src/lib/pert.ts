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
        .map((r: any) => r.score)
        .filter(n => typeof n === 'number');

    const avg = scores.length > 0
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
        : '0.00';

    const teamStdDevVal = scores.length > 1
        ? Math.sqrt(scores.map(x => Math.pow(x - parseFloat(avg), 2)).reduce((a, b) => a + b) / (scores.length - 1))
        : 0;

    const teamStdDev = teamStdDevVal.toFixed(2);

    let disagreementLevel: PertAnalysis['disagreementLevel'] = 'Low';
    let disagreementColor = '#4caf50';

    if (teamStdDevVal >= 1.0) {
        disagreementLevel = 'High';
        disagreementColor = '#f44336';
    } else if (teamStdDevVal >= 0.5) {
        disagreementLevel = 'Medium';
        disagreementColor = '#ff9800';
    }

    return {
        avgScore: avg,
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
