import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket.ts';
import { RoomState, ServerMessage, RoomPhase } from '@capyplan/protocol';
import EstimationModal from '../components/EstimationModal';
import RoomHeader from '../components/RoomHeader';
import CurrentItemArea from '../components/CurrentItemArea';
import ParticipantList from '../components/ParticipantList';
import LeaderControls from '../components/LeaderControls';
import DeckSelector from '../components/DeckSelector';

export default function Room() {
    const { roomId } = useParams<{ roomId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const name = location.state?.name; // Simplification: passed from Home

    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Connect and Join
    useEffect(() => {
        if (!roomId || !name) {
            navigate('/');
            return;
        }

        let mounted = true;
        socket.connect();

        socket.waitForOpen().then(() => {
            if (mounted) {
                socket.send({
                    type: 'JOIN_ROOM',
                    roomId,
                    name
                });
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

    if (!roomState) {
        return <div className="container">Loading Room...</div>;
    }
    console.log({ RoomPhase });

    const isLeader = roomState.participants[0]?.name === name; // Simplification: name-based leader check matching server hack

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
                    <CurrentItemArea
                        phase={roomState.phase}
                        results={roomState.results}
                        participants={roomState.participants}
                        onOpenEstimateModal={() => setIsModalOpen(true)}
                    />

                    {isLeader && (
                        <>
                            <LeaderControls
                                onReveal={() => socket.send({ type: 'REQUEST_REVEAL', itemId: 'TODO' })}
                                onNextItem={() => socket.send({ type: 'REQUEST_NEXT_ITEM' })}
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

            {isModalOpen && (
                <EstimationModal
                    mode={roomState.estimationMode}
                    availableEstimates={roomState.availableEstimates}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={(payload) => {
                        socket.send({
                            type: 'SUBMIT_ESTIMATE',
                            itemId: 'TODO-ITEM-ID',
                            estimationMode: roomState.estimationMode,
                            payload
                        });
                        setIsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}
