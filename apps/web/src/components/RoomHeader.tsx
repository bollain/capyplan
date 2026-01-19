import { RoomPhase, EstimationMode } from '@capyplan/protocol';

interface Props {
    roomId: string;
    estimationMode: EstimationMode;
    phase: RoomPhase;
    userName?: string;
}

export default function RoomHeader({ roomId, estimationMode, phase, userName }: Props) {
    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Room: {roomId}</h1>
                    <span style={{
                        backgroundColor: '#333',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        display: 'inline-block',
                        marginTop: '0.5rem'
                    }}>
                        Mode: {estimationMode}
                    </span>
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                    👤 <strong>{userName}</strong>
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                    Status: <strong>{phase}</strong>
                </div>
            </div>
        </header>
    );
}
