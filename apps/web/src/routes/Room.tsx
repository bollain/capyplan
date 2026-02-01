import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket';
import { RoomState, ServerMessage, RoomPhase } from '@capyplan/protocol';
import RoomHeader from '../components/RoomHeader';
import Stage from '../components/Stage';
import ParticipantList from '../components/ParticipantList';
import RoomActions from '../components/RoomActions';
import DeckSelector from '../components/DeckSelector';
import YourVote from '../components/YourVote';
import JoinRoom from '../components/JoinRoom';
import Toast from '../components/Toast';

function getOrCreateClientId(): string {
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
    return clientId;
}

export default function Room() {
    const { roomId } = useParams<{ roomId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    // Try state first, then fallback to persisted name
    const [name, setName] = useState(location.state?.name || localStorage.getItem('capyplan_username') || '');
    const [isSpectator, setIsSpectator] = useState(location.state?.isSpectator || false);
    const [isJoined, setIsJoined] = useState(!!name);

    const [roomState, setRoomState] = useState<RoomState | null>(null);
    // Use ref to keep latest roomState accessible in stable callbacks
    const roomStateRef = useRef<RoomState | null>(null);

    useEffect(() => {
        roomStateRef.current = roomState;
    }, [roomState]);

    const [connectionError, setConnectionError] = useState<string | null>(null);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState<string>('');

    const handleSubmitEstimate = useCallback((payload: Record<string, unknown>) => {
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
        if (!roomId || !isJoined || !name) {
            return;
        }

        let mounted = true;
        if (connectionError) setConnectionError(null);

        const clientId = getOrCreateClientId();

        console.log('Using Client ID:', clientId);

        socket.connect();

        socket.waitForOpen()
            .then(() => {
                if (mounted) {
                    socket.send({
                        type: 'JOIN_ROOM',
                        roomId,
                        roomName: location.state?.roomName, // Pass roomName if available
                        name,
                        clientId,
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

        const cleanup = socket.subscribe((raw: unknown) => {
            const data = raw as ServerMessage;
            if (!mounted) return;
            if (data.type === 'ROOM_SNAPSHOT') {
                console.log('Received room snapshot', data.state);
                console.log({ data });
                setRoomState(data.state);
            } else if (data.type === 'ROOM_EVENT') {
                if (data.event === 'REVEALED') {
                    setToastMessage(`${data.payload.userName} revealed the estimates!`);
                    setShowToast(true);
                }
            } else if (data.type === 'ERROR') {
                alert(`Error: ${data.message}`);
            }
        });

        return () => {
            mounted = false;
            cleanup();
            socket.send({ type: 'LEAVE_ROOM' });
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, name, isJoined, navigate, location.state?.roomName, isSpectator]); // Re-run if joined status changes

    if (connectionError) {
        return (
            <div className="container connection-error-container">
                <h2 className="connection-error-title">Connection Error</h2>
                <p>{connectionError}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="connection-error-retry"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!isJoined) {
        return (
            <JoinRoom
                roomId={roomId!}
                startName={name}
                onJoin={(newName, spectator) => {
                    localStorage.setItem('capyplan_username', newName);
                    setName(newName);
                    setIsSpectator(spectator);
                    setIsJoined(true);
                }}
            />
        );
    }

    if (!roomState) {
        return <div className="container">Loading Room...</div>;
    }
    console.log({ RoomPhase });

    const myClientId = localStorage.getItem('capyplan_client_id');
    const isLeader = roomState.leaderId === myClientId;

    // Safety check for myClientId
    const myResult = (myClientId && roomState.results) ? (roomState.results[myClientId] as { score: number; stdDev?: number }) : null;
    const myEstimate = (myClientId && roomState.currentEstimates) ? (roomState.currentEstimates[myClientId] as { optimistic: number; mostLikely: number; pessimistic: number }) : null;

    const voteCount = roomState.currentEstimates ? Object.keys(roomState.currentEstimates).length : 0;
    const totalParticipants = roomState.participants ? roomState.participants.length : 0;

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setToastMessage('Link copied to clipboard! 📋');
        setShowToast(true);
    };

    return (
        <>
            <Toast
                message={toastMessage}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
            <RoomHeader
                roomId={roomState.roomId}
                roomName={roomState.roomName}
                estimationMode={roomState.estimationMode}
                phase={roomState.phase}
                userName={name}
                voteCount={voteCount}
                totalParticipants={totalParticipants}
                onInvite={handleShare}
            />
            <div className="container">
                <div className="room-layout-grid">
                    <main className="room-main-content">
                        <Stage
                            phase={roomState.phase}
                            mode={roomState.estimationMode}
                            availableEstimates={roomState.availableEstimates}
                            results={roomState.results}
                            currentEstimates={roomState.currentEstimates}
                            participants={roomState.participants}
                            isSpectator={isSpectator}
                            onSubmitEstimate={handleSubmitEstimate}
                        />

                        <RoomActions
                            onReveal={() => socket.send({ type: 'REQUEST_REVEAL', itemId: 'TODO' })}
                            onNextItem={() => socket.send({ type: 'REQUEST_NEXT_VOTE' })}
                            phase={roomState.phase}
                            voteCount={voteCount}
                            totalParticipants={totalParticipants}
                        />

                        {isLeader && (
                            <>
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
                        <YourVote
                            result={myResult}
                            estimate={myEstimate}
                            phase={roomState.phase}
                        />
                    </aside>
                </div>
            </div>
            <footer className="room-footer">
                Created in Vancouver, Canada 🇨🇦 by <a href="https://github.com/bollain" target="_blank" rel="noopener noreferrer">@bollain</a>
            </footer>
        </>
    );
}
