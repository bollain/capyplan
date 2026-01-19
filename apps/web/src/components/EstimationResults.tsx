import { RoomState } from '@capyplan/protocol';
import { useState } from 'react';

interface Props {
    results: NonNullable<RoomState['results']>;
    participants: RoomState['participants'];
}

export default function EstimationResults({ results, participants }: Props) {
    // Safe calculate average
    const scores = Object.values(results).map((r: any) => r.score).filter(n => typeof n === 'number');
    const avg = scores.length > 0
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
        : '0.00';

    const teamStdDevVal = scores.length > 1
        ? Math.sqrt(scores.map(x => Math.pow(x - parseFloat(avg), 2)).reduce((a, b) => a + b) / (scores.length - 1))
        : 0;
    const teamStdDev = teamStdDevVal.toFixed(2);

    let disagreementLabel = 'Low Disagreement';
    let disagreementColor = '#4caf50';
    if (teamStdDevVal >= 1.0) {
        disagreementLabel = 'High Disagreement';
        disagreementColor = '#f44336';
    } else if (teamStdDevVal >= 0.5) {
        disagreementLabel = 'Medium Disagreement';
        disagreementColor = '#ff9800';
    }

    const [showGuide, setShowGuide] = useState(true);

    return (
        <div className="card" style={{ border: '1px solid var(--color-primary)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Team Estimate</h3>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {avg}
                </div>
                <p style={{ margin: 0, opacity: 0.7 }}>Average PERT Score</p>
                <div style={{ fontSize: '0.9rem', color: '#aaaaaa', marginTop: '0.5rem' }}>
                    Team Disagreement: <strong>±{teamStdDev}</strong>
                    <span style={{
                        marginLeft: '0.5rem',
                        backgroundColor: disagreementColor,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        color: '#fff',
                        fontWeight: 'bold'
                    }}>
                        {disagreementLabel}
                    </span>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
                        <th style={{ padding: '0.5rem' }}>Participant</th>
                        <th style={{ padding: '0.5rem' }}>Score</th>
                        <th style={{ padding: '0.5rem' }}>Uncertainty (StdDev)</th>
                    </tr>
                </thead>
                <tbody>
                    {participants.map(p => {
                        const result = results[p.id];
                        if (!result) return null; // or show "No vote"

                        return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '0.5rem' }}>{p.name}</td>
                                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{result.score}</td>
                                <td style={{ padding: '0.5rem', opacity: 0.7 }}>
                                    {(() => {
                                        const sd = Number(result.stdDev);
                                        let color = '#4caf50';
                                        let text = 'Low Risk';
                                        if (sd >= 1.0) {
                                            color = '#f44336';
                                            text = 'High Risk';
                                        } else if (sd >= 0.5) {
                                            color = '#ff9800';
                                            text = 'Medium Risk';
                                        }

                                        return (
                                            <span style={{
                                                backgroundColor: color,
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                color: '#fff',
                                                fontWeight: 'bold'
                                            }}>
                                                {text} (±{sd.toFixed(2)})
                                            </span>
                                        );
                                    })()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div style={{ marginTop: '2rem' }}>
                <button
                    onClick={() => setShowGuide(!showGuide)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#888',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        textDecoration: 'underline',
                        padding: 0,
                    }}
                >
                    {showGuide ? 'Hide' : 'Show'} Interpretation Guide
                </button>

                {showGuide && (
                    <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#333', borderRadius: '8px', fontSize: '0.9rem' }}>
                        <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>💡 Guide</h4>
                        <ul style={{ paddingLeft: '1.2rem', margin: 0, lineHeight: '1.4' }}>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <strong>High Risk 🔴 + Low Disagreement:</strong> The requirement is likely vague. Everyone is unsure in the same way.
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <strong>Low Risk 🟢 + High Disagreement:</strong> Team members are confident but have <em>different understandings</em> of the work.
                            </li>
                            <li>
                                <strong>High Disagreement:</strong> Discuss the outliers!
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
