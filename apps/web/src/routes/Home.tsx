import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket.ts';

export default function Home() {
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        socket.connect();
    }, []);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !roomId) return;

        // We navigate first, and the Room component will handle the JOIN_ROOM message logic
        // passing the name via state or just localstorage. 
        // For simplicity, let's pass name in navigation state.
        navigate(`/room/${roomId}`, { state: { name } });
    };

    return (
        <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
            <h1>CapyPlan 🧉</h1>
            <p>Collaborative Estimation Tool</p>

            <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Your Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Capybara Joe"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Room ID</label>
                        <input
                            value={roomId}
                            onChange={e => setRoomId(e.target.value)}
                            placeholder="room-123"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <button type="submit" disabled={!name || !roomId}>
                        Join Room
                    </button>
                </form>
            </div>
        </div>
    );
}
