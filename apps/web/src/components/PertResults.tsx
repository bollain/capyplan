import { RoomState } from "@capyplan/protocol";
import { useState } from "react";
import { calculateTeamStats, getRiskLevel } from "../lib/pert";

interface Props {
    results: NonNullable<RoomState['results']>;
    participants: RoomState['participants'];
}

export default function PertResults({ results, participants }: Props) {
    const { avgScore, teamStdDev, disagreementLevel, disagreementColor } = calculateTeamStats(results);
    const [showGuide, setShowGuide] = useState(false);

    return (
        <div className="card" style={{ border: '1px solid var(--color-primary)' }}>
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

                        const risk = getRiskLevel(Number(result.stdDev));

                        return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '0.5rem' }}>{p.name}</td>
                                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{result.score}</td>
                                <td style={{ padding: '0.5rem', opacity: 0.7 }}>
                                    <span style={{
                                        backgroundColor: risk.color,
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        color: '#fff',
                                        fontWeight: 'bold'
                                    }}>
                                        {risk.text} (±{Number(result.stdDev).toFixed(2)})
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Team Estimate</h3>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {avgScore}
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
                        {disagreementLevel} Disagreement
                    </span>
                </div>
            </div>

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