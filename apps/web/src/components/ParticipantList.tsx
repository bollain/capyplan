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
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {participants.map(p => {
                    const isMe = p.name === currentUserName;
                    const hasEstimated = currentEstimates?.[p.id];
                    return (
                        <li key={p.id} style={{
                            padding: '0.5rem',
                            borderBottom: '1px solid #444',
                            display: 'flex',
                            justifyContent: 'space-between',
                            backgroundColor: isMe ? 'rgba(255, 159, 28, 0.1)' : 'transparent',
                            fontWeight: isMe ? 'bold' : 'normal',
                            alignItems: 'center',
                            opacity: p.connected === false ? 0.5 : 1.0,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>{p.name} {isMe && '(You)'}</span>
                                {p.id === leaderId && <span title="Leader">👑</span>}
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
