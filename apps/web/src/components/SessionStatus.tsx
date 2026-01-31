import { RoomPhase } from '@capyplan/protocol';

interface Props {
    phase: RoomPhase;
    voteCount: number;
    totalParticipants: number;
}

export default function SessionStatus({ phase, voteCount, totalParticipants }: Props) {
    const isVoting = phase === 'VOTING';
    const isRevealed = phase === 'REVEALED';

    let label = phase as string;
    let helpText = '';

    if (isVoting) {
        label = 'Voting';
        helpText = `${voteCount} of ${totalParticipants} voted`;
    } else if (isRevealed) {
        label = 'Revealed';
        helpText = 'Estimates shown';
    } else {
        label = phase;
    }

    return (
        <div
            className={`session-status status-${phase.toLowerCase()}`}
            role="status"
            aria-live={isVoting ? "polite" : "off"}
        >
            <span className="status-dot"></span>
            <div className="status-content">
                <span className="status-label">{label}</span>
                {helpText && <span className="status-help">{helpText}</span>}
            </div>
        </div>
    );
}
