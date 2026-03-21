import { RoomState } from '@capyplan/protocol';

interface Props {
    results: NonNullable<RoomState['results']>;
    participants: RoomState['participants'];
}

export default function PokerResults({ results, participants }: Props) {
    // Participants who voted
    const votedParticipants = participants.filter(p => results[p.id] !== undefined);

    // Calculate average
    const scores = votedParticipants.map(p => (results[p.id] as { score: number }).score);
    const average = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';

    return (
        <div className="card pert-results-card">
            <div className="poker-results-grid">
                {votedParticipants.map(p => (
                    <div key={p.id} className="poker-result-item">
                        <div className="voting-card selected readonly">
                            {(results[p.id] as { score: number }).score}
                        </div>
                        <span className="poker-result-participant">{p.name}</span>
                    </div>
                ))}
            </div>

            <div className="stat-footer center">
                <div className="stat-block center">
                    <span className="stat-label">Team Average</span>
                    <span className="stat-value-large">{average}</span>
                </div>
            </div>
        </div>
    );
}
