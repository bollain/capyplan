import { RoomPhase } from '@capyplan/protocol';

interface Props {
    onReveal: () => void;
    onNextItem: () => void;
    phase: RoomPhase;
    voteCount: number;
    totalParticipants: number;
}

export default function RoomActions({ onReveal, onNextItem, phase, voteCount, totalParticipants }: Props) {
    const allVoted = totalParticipants > 0 && voteCount >= totalParticipants;
    const isWaiting = phase === RoomPhase.VOTING && !allVoted;

    // Use compact class for waiting, standard (reduced padding) for others
    const cardClass = isWaiting ? 'action-card-compact' : 'action-card-standard';

    return (
        <div className={`card room-actions-card ${cardClass}`}>
            <div className="room-actions-row">
                {phase === RoomPhase.VOTING && (
                    <button
                        onClick={onReveal}
                        disabled={!allVoted}
                        className={allVoted ? 'btn-prominent' : 'btn-waiting'}
                        title={!allVoted ? `Waiting for votes... (${voteCount}/${totalParticipants})` : 'Reveal all estimates'}
                    >
                        {allVoted ? '⚡ Reveal Estimates' : `Waiting for Votes (${voteCount}/${totalParticipants})`}
                    </button>
                )}

                {phase === RoomPhase.REVEALED && (
                    <button
                        onClick={onNextItem}
                        className="btn-prominent"
                    >
                        Start New Estimation
                    </button>
                )}
            </div>
        </div>
    );
}
