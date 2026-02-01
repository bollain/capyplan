import { RoomState } from '@capyplan/protocol';

interface Props {
    participants: RoomState['participants'];
    currentUserName?: string;
    leaderId: string;
    currentEstimates: RoomState['currentEstimates'];
}

export default function ParticipantList({ participants, currentUserName, leaderId, currentEstimates }: Props) {
    return (
        <div className="card">
            <h3>Participants ({participants.length})</h3>
            <ul className="participant-list">
                {participants.map(p => {
                    const isMe = p.name === currentUserName;
                    const hasEstimated = currentEstimates?.[p.id] !== undefined;

                    let itemClass = 'participant-item';
                    if (isMe) itemClass += ' is-me';
                    if (p.connected === false) itemClass += ' disconnected';

                    return (
                        <li key={p.id} className={itemClass}>
                            <div className="participant-info">
                                <span>{p.name} {isMe && '(You)'}</span>
                                {p.id === leaderId && <span title="Leader">👑</span>}
                                {p.isSpectator && <span title="Spectator">👀</span>}
                                {p.connected === false && <span title="Disconnected" style={{ fontSize: '0.8rem' }}>🔌</span>}
                            </div>
                            {hasEstimated && <span>✅</span>}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
