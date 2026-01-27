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


    const risk = getRiskLevel(Number(result.stdDev));

    const getPersona = (riskLevel: string) => {
        switch (riskLevel) {
            case 'High':
                return {
                    name: 'Chaos Capy',
                    emoji: '🎲',
                    desc: 'Is the afterparty.'
                };
            case 'Medium':
                return {
                    name: 'Cautious Capy',
                    emoji: '🤔',
                    desc: 'Checks the vibe, then commits.'
                };
            case 'Low':
            default:
                return {
                    name: 'Chill Capy',
                    emoji: '😌',
                    desc: 'Unbothered. Unrushed.'
                };
        }
    };

    const persona = getPersona(risk.level);

    return (
        <div className="card your-vote-card">
            <h3>Your Vote</h3>
            <div className="your-vote-primary">
                <div className="your-vote-stat">
                    <span className="your-vote-score">{Math.round(Number(result.score))}</span>
                    <span className="your-vote-label">Score</span>
                </div>

                <div className="your-vote-stat">
                    <span className="your-vote-stddev" style={{ color: risk.color }}>
                        ±{Number(result.stdDev).toFixed(1)}
                    </span>
                    <span className="your-vote-label">Uncertainty</span>
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

            <div className="persona-section" style={{ borderColor: risk.color, backgroundColor: `${risk.color}15` }}>
                <div className="persona-header">
                    <span className="persona-emoji">{persona.emoji}</span>
                    <span className="persona-name" style={{ color: risk.color }}>{persona.name}</span>
                </div>
                <div className="persona-desc">"{persona.desc}"</div>
            </div>
        </div>
    );
}
