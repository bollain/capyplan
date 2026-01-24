import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket.ts';
import { RoomState, ServerMessage, RoomPhase } from '@capyplan/protocol';
import RoomHeader from '../components/RoomHeader';
import Stage from '../components/Stage';
import ParticipantList from '../components/ParticipantList';
import LeaderControls from '../components/LeaderControls';
import DeckSelector from '../components/DeckSelector';

export default function Room() {
    const { roomId } = useParams<{ roomId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const name = location.state?.name; // Simplification: passed from Home
    const isSpectator = location.state?.isSpectator;

    const [roomState, setRoomState] = useState<RoomState | null>(null);
    // Use ref to keep latest roomState accessible in stable callbacks
    const roomStateRef = useRef<RoomState | null>(null);
    roomStateRef.current = roomState;

    const [connectionError, setConnectionError] = useState<string | null>(null);

    const handleSubmitEstimate = useCallback((payload: any) => {
        const state = roomStateRef.current;
        console.log({ state });
        if (!state) return;
        socket.send({
            type: 'SUBMIT_ESTIMATE',
            itemId: 'TODO-ITEM-ID',
            estimationMode: state.estimationMode,
            payload
        });
    }, []); // Stable reference, never changes

    // Connect and Join
    useEffect(() => {
        if (!roomId || !name) {
            navigate('/');
            return;
        }

        let mounted = true;
        setConnectionError(null);

        // Get or create stable client ID
        let clientId = localStorage.getItem('capyplan_client_id');
        if (!clientId) {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                clientId = crypto.randomUUID();
            } else {
                // Fallback for environments without crypto.randomUUID
                clientId = Math.random().toString(36).substring(2) + Date.now().toString(36);
            }
            localStorage.setItem('capyplan_client_id', clientId);
        }

        console.log('Using Client ID:', clientId);

        socket.connect();

        socket.waitForOpen()
            .then(() => {
                if (mounted) {
                    console.log('Sending JOIN_ROOM');
                    socket.send({
                        type: 'JOIN_ROOM',
                        roomId,
                        name,
                        clientId: clientId!,
                        isSpectator
                    });
                }
            })
            .catch(err => {
                if (mounted) {
                    console.error('Connection failed:', err);
                    setConnectionError('Could not connect to server. Please check your network connection or firewall settings (Port 3001).');
                }
            });

        const cleanup = socket.subscribe((data: ServerMessage) => {
            if (!mounted) return;
            if (data.type === 'ROOM_SNAPSHOT') {
                console.log('Received room snapshot', data.state);
                console.log({ data });
                setRoomState(data.state);
            } else if (data.type === 'ERROR') {
                alert(`Error: ${data.message}`);
            }
        });

        return () => {
            mounted = false;
            cleanup();
            socket.send({ type: 'LEAVE_ROOM' });
        };
    }, [roomId, name, navigate]);

    if (connectionError) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <h2 style={{ color: '#ff6b6b' }}>Connection Error</h2>
                <p>{connectionError}</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{ marginTop: '1rem' }}
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!roomState) {
        return <div className="container">Loading Room...</div>;
    }
    console.log({ RoomPhase });

    const myClientId = localStorage.getItem('capyplan_client_id');
    const isLeader = roomState.leaderId === myClientId;


    return (
        <div className="container">
            <RoomHeader
                roomId={roomState.roomId}
                estimationMode={roomState.estimationMode}
                phase={roomState.phase}
                userName={name}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginTop: '2rem' }}>
                <main>
                    <Stage
                        phase={roomState.phase}
                        mode={roomState.estimationMode}
                        availableEstimates={roomState.availableEstimates}
                        results={roomState.results}
                        participants={roomState.participants}
                        isSpectator={isSpectator}
                        onSubmitEstimate={handleSubmitEstimate}
                    />

                    {isLeader && (
                        <>
                            <LeaderControls
                                onReveal={() => socket.send({ type: 'REQUEST_REVEAL', itemId: 'TODO' })}
                                onNextItem={() => socket.send({ type: 'REQUEST_NEXT_VOTE' })}
                            />
                            <DeckSelector
                                currentDeck={roomState.availableEstimates}
                                onUpdateDeck={(availableEstimates) =>
                                    socket.send({ type: 'UPDATE_ROOM_SETTINGS', availableEstimates })
                                }
                            />
                        </>
                    )}
                </main>

                <aside>
                    <ParticipantList
                        participants={roomState.participants}
                        currentUserName={name}
                        leaderId={roomState.leaderId}
                        currentEstimates={roomState.currentEstimates}
                    />
                </aside>
            </div>
        </div>
    );
}
