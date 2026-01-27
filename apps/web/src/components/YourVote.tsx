import { getRiskLevel } from "../lib/pert";

interface Props {
    result?: {
        score: number;
        stdDev?: number;
    } | null;
    estimate?: {
        optimistic: number;
        mostLikely: number;
        pessimistic: number;
    } | null;
    phase: string;
}

export default function YourVote({ result, estimate, phase }: Props) {
    if (phase !== 'REVEALED' || !result) return null;

    const roundedScore = Math.round(result.score);
    const uncertainty = Number(result.stdDev || 0);
    const risk = getRiskLevel(uncertainty);

    return (
        <div className="card your-vote-card">
            <h3>Your Vote</h3>
            <div className="your-vote-primary">
                <div className="your-vote-stat">
                    <span className="your-vote-label">Score</span>
                    <span className="your-vote-score">{roundedScore}</span>
                </div>

                <div className="your-vote-stat">
                    <span className="your-vote-label">Uncertainty (StdDev)</span>
                    <span className="your-vote-stddev" style={{ color: risk.color, fontWeight: 'bold' }}>
                        ±{uncertainty.toFixed(2)}
                    </span>
                </div>
            </div>

            {estimate && (
                <div className="your-vote-details">
                    <div className="your-vote-detail-item">
                        <span className="label">Optimistic</span>
                        <span className="value">{estimate.optimistic}</span>
                    </div>
                    <div className="your-vote-detail-item">
                        <span className="label">Most Likely</span>
                        <span className="value">{estimate.mostLikely}</span>
                    </div>
                    <div className="your-vote-detail-item">
                        <span className="label">Pessimistic</span>
                        <span className="value">{estimate.pessimistic}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
