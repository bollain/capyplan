import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket.ts';
import logo from '../assets/capyplan.png';

export default function Home() {
    const [name, setName] = useState('');
    const [isSpectator, setIsSpectator] = useState(false);
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
        navigate(`/room/${roomId}`, { state: { name, isSpectator } });
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
                        <label>Room ID</label>
                        <input
                            value={roomId}
                            onChange={e => setRoomId(e.target.value)}
                            placeholder="room-123"
                            className="form-input"
                        />
                    </div>
                    <div className="spectator-toggle" onClick={() => setIsSpectator(!isSpectator)}>
                        <div className={`toggle-track ${isSpectator ? 'active' : ''}`}>
                            <div className={`toggle-thumb ${isSpectator ? 'active' : ''}`} />
                        </div>
                        <label style={{ cursor: 'pointer', fontSize: '1rem' }}>Join as Spectator</label>
                    </div>
                    <button type="submit" disabled={!name || !roomId}>
                        Join Room
                    </button>
                </form>
            </div>

            <footer className="home-footer">
                Created in Vancouver, Canada 🇨🇦 by <a href="https://github.com/bollain" target="_blank" rel="noopener noreferrer">@bollain</a>
            </footer>
        </div>
    );
}
