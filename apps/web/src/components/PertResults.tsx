import { RoomState } from "@capyplan/protocol";
import { useState } from "react";
import { calculateTeamStats, getRiskLevel } from "../lib/pert";

interface Props {
    results: NonNullable<RoomState['results']>;
    currentEstimates: RoomState['currentEstimates'];
    participants: RoomState['participants'];
}

export default function PertResults({ results, currentEstimates, participants }: Props) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { avgScore, teamStdDev, disagreementLevel, disagreementColor } = calculateTeamStats(results as any);
    const [showGuide, setShowGuide] = useState(false);

    return (
        <div className="card pert-results-card">
            <table className="pert-table">
                <thead>
                    <tr>
                        <th>Participant</th>
                        <th>Score</th>
                        <th>Uncertainty (StdDev)</th>
                    </tr>
                </thead>
                <tbody>
                    {participants.map(p => {
                        const result = results[p.id] as { score: number; stdDev: number } | undefined;
                        const estimate = currentEstimates?.[p.id];
                        if (!result) return null;

                        const risk = getRiskLevel(Number(result.stdDev));
                        const roundedResult = Math.round(Number(result.score));

                        const raw = estimate as { optimistic: number, mostLikely: number, pessimistic: number } | undefined;
                        const tooltip = raw
                            ? `Optimistic: ${raw.optimistic} | Most Likely: ${raw.mostLikely} | Pessimistic: ${raw.pessimistic}`
                            : undefined;

                        return (
                            <tr key={p.id}>
                                <td>{p.name}</td>
                                <td
                                    className={`pert-score-cell ${tooltip ? 'has-tooltip' : ''}`}
                                    data-tooltip={tooltip}
                                >
                                    {roundedResult}
                                </td>
                                <td className="pert-stddev-cell">
                                    <div className="stat-value-row">
                                        <span className="risk-value" style={{ color: risk.color }}>
                                            ±{Number(result.stdDev).toFixed(2)}
                                        </span>
                                        {risk.level !== 'Low' && (
                                            <span className="risk-badge" style={{ backgroundColor: risk.color }}>
                                                {risk.level}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="stat-footer">
                <div className="stat-block">
                    <span className="stat-label">Team Average</span>
                    <span className="stat-value-large">{avgScore}</span>
                </div>

                <div className="stat-block align-right">
                    <span className="stat-label">Disagreement</span>
                    <div className="stat-value-row">
                        <span className="stat-value-small" style={{ color: disagreementColor }}>
                            ±{teamStdDev}
                        </span>
                        {disagreementLevel !== 'Low' && (
                            <span className="risk-badge" style={{ backgroundColor: disagreementColor }}>
                                {disagreementLevel}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="guide-toggle">
                <button onClick={() => setShowGuide(!showGuide)}>
                    {showGuide ? 'Hide' : 'Show'} Interpretation Guide
                </button>

                {showGuide && (
                    <div className="guide-panel">
                        <h4>💡 Guide</h4>
                        <ul>
                            <li>
                                <strong>High Risk 🔴 + Low Disagreement:</strong> The requirement is likely vague. Everyone is unsure in the same way.
                            </li>
                            <li>
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