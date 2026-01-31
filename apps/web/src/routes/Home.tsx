import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket.ts';
import logo from '../assets/capyplan.png';

export default function Home() {
    const [name, setName] = useState('');
    const [isSpectator, setIsSpectator] = useState(false);
    const [roomInput, setRoomInput] = useState(''); // Can be name (for create) or ID (for join)
    const [isCreating, setIsCreating] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        socket.connect();
    }, []);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !roomInput) return;

        // Save name for persistence on refresh
        localStorage.setItem('capyplan_username', name);

        let targetRoomId = roomInput;
        let roomName: string | undefined = undefined;

        if (isCreating) {
            // If creating, generate a random ID and use input as name
            targetRoomId = crypto.randomUUID();
            roomName = roomInput;
        }

        navigate(`/room/${targetRoomId}`, {
            state: {
                name,
                isSpectator,
                roomName // Pass roomName to the route state
            }
        });
    };

    return (
        <div className="container home-container">
            <div className="logo-header">
                <img src={logo} alt="CapyPlan Logo" className="logo-img" />
                <h1>CapyPlan</h1>
            </div>
            <p className="text-center">Collaborative Estimation Tool</p>

            <div className="card join-card">
                <form onSubmit={handleJoin} className="join-form">
                    <div className="form-group">
                        <label>Your Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Capybara Joe"
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>
                            {isCreating ? 'Room Name' : 'Room ID'}
                        </label>
                        <input
                            value={roomInput}
                            onChange={e => setRoomInput(e.target.value)}
                            placeholder={isCreating ? "Sprint Planning 34" : "paste-room-id-here"}
                            className="form-input"
                        />
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                            {isCreating ? (
                                <span onClick={() => setIsCreating(false)} style={{ cursor: 'pointer', textDecoration: 'underline', color: '#888' }}>
                                    or join existing room by ID
                                </span>
                            ) : (
                                <span onClick={() => setIsCreating(true)} style={{ cursor: 'pointer', textDecoration: 'underline', color: '#888' }}>
                                    or create a new room
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="spectator-toggle" onClick={() => setIsSpectator(!isSpectator)}>
                        <div className={`toggle-track ${isSpectator ? 'active' : ''}`}>
                            <div className={`toggle-thumb ${isSpectator ? 'active' : ''}`} />
                        </div>
                        <label style={{ cursor: 'pointer', fontSize: '1rem' }}>Join as Spectator</label>
                    </div>
                    <button type="submit" disabled={!name || !roomInput}>
                        {isCreating ? 'Create Room' : 'Join Room'}
                    </button>
                </form>
            </div>

            <footer className="home-footer">
                Created in Vancouver, Canada 🇨🇦 by <a href="https://github.com/bollain" target="_blank" rel="noopener noreferrer">@bollain</a>
            </footer>
        </div>
    );
}
