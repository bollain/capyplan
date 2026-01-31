import { useState } from 'react';
import logo from '../assets/capyplan.png';

interface Props {
    roomId: string;
    startName?: string;
    onJoin: (name: string, isSpectator: boolean) => void;
}

export default function JoinRoom({ roomId, startName = '', onJoin }: Props) {
    const [name, setName] = useState(startName);
    const [isSpectator, setIsSpectator] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name) {
            onJoin(name, isSpectator);
        }
    };

    return (
        <div className="join-container">
            <div className="card join-card">
                <div className="join-header">
                    <img src={logo} alt="CapyPlan" className="join-logo" />
                    <h2 className="join-title">Join Room {roomId}</h2>
                </div>
                <form onSubmit={handleSubmit} className="join-form">
                    <div className="form-group">
                        <label>Your Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Capybara Joe"
                            className="form-input"
                            autoFocus
                        />
                    </div>
                    <div className="spectator-toggle" onClick={() => setIsSpectator(!isSpectator)}>
                        <div className={`toggle-track ${isSpectator ? 'active' : ''}`}>
                            <div className={`toggle-thumb ${isSpectator ? 'active' : ''}`} />
                        </div>
                        <label className="spectator-label">Join as Spectator</label>
                    </div>
                    <button type="submit" disabled={!name}>
                        Join Room
                    </button>
                </form>
            </div>
        </div>
    );
}
