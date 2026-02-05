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

    // Always use compact layout for voting phase to prevent jumps
    const isVoting = phase === RoomPhase.VOTING;
    const cardClass = isVoting ? 'action-card-compact' : 'action-card-standard';

    return (
        <div className={`card room-actions-card ${cardClass}`}>
            <div className="room-actions-row">
                {phase === RoomPhase.VOTING && (
                    <button
                        onClick={onReveal}
                        disabled={voteCount === 0}
                        className={allVoted ? 'btn-prominent-std' : (voteCount > 0 ? '' : 'btn-waiting')}
                        title={voteCount === 0 ? `Waiting for votes... (${voteCount}/${totalParticipants})` : (allVoted ? 'Reveal all estimates' : 'Reveal current estimates')}
                    >
                        {allVoted ? '⚡ Reveal All Estimates' : (voteCount > 0 ? `Reveal Estimates (${voteCount}/${totalParticipants})` : `Waiting for Votes...`)}
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
