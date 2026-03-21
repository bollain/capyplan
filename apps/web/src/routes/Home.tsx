import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket.ts';
import { EstimationMode } from '@capyplan/protocol';
import logo from '../assets/capyplan.png';
import ThemeToggle from '../components/ThemeToggle';

export default function Home() {
    const [name, setName] = useState('');
    const [isSpectator, setIsSpectator] = useState(false);
    const [roomInput, setRoomInput] = useState(''); // Can be name (for create) or ID (for join)
    const [isCreating, setIsCreating] = useState(true);
    const [estimationMode, setEstimationMode] = useState<EstimationMode>(EstimationMode.PERT);
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
                roomName, // Pass roomName to the route state
                estimationMode: isCreating ? estimationMode : undefined
            }
        });
    };

    return (
        <div className="container home-container">
            <div className="theme-toggle-container">
                <ThemeToggle />
            </div>
            <div className="logo-header">
                <img src={logo} alt="CapyPlan Logo" className="logo-img" />
                <h1>CapyPlan</h1>
            </div>
            <p className="text-center my-0-5">Collaborative Estimation Tool</p>

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
                        <div className="form-subtext">
                            {isCreating ? (
                                <span onClick={() => setIsCreating(false)} className="form-link">
                                    or join existing room by ID
                                </span>
                            ) : (
                                <span onClick={() => setIsCreating(true)} className="form-link">
                                    or create a new room
                                </span>
                            )}
                        </div>
                    </div>
                    {isCreating && (
                        <div className="form-group">
                            <label>Voting Method</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input 
                                        type="radio" 
                                        name="estimationMode" 
                                        value={EstimationMode.PERT}
                                        checked={estimationMode === EstimationMode.PERT}
                                        onChange={() => setEstimationMode(EstimationMode.PERT)}
                                    />
                                    PERT (3-point)
                                </label>
                                <label className="radio-label">
                                    <input 
                                        type="radio" 
                                        name="estimationMode" 
                                        value={EstimationMode.POKER}
                                        checked={estimationMode === EstimationMode.POKER}
                                        onChange={() => setEstimationMode(EstimationMode.POKER)}
                                    />
                                    Planning Poker
                                </label>
                            </div>
                        </div>
                    )}
                    <div className="spectator-toggle" onClick={() => setIsSpectator(!isSpectator)}>
                        <div className={`toggle-track ${isSpectator ? 'active' : ''}`}>
                            <div className={`toggle-thumb ${isSpectator ? 'active' : ''}`} />
                        </div>
                        <label className="spectator-label">Join as Spectator</label>
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
