import { RoomPhase, EstimationMode } from '@capyplan/protocol';
import logo from '../assets/capyplan.png';

interface Props {
    roomId: string;
    estimationMode: EstimationMode;
    phase: RoomPhase;
    userName?: string;
}

export default function RoomHeader({ roomId, estimationMode, phase, userName }: Props) {
    return (
        <header className="room-header">
            <div className="header-left">
                <div className="brand-container">
                    <img src={logo} alt="CapyPlan" className="brand-logo" />
                    <span className="brand-text">CapyPlan</span>
                </div>
                <div className="room-info">
                    <h1>Room: {roomId}</h1>
                    <span className="mode-badge">
                        Mode: {estimationMode}
                    </span>
                </div>
            </div>
            <div className="header-right">
                <div className="user-info">
                    🐹 <strong>{userName}</strong>
                </div>
                <div className="status-info">
                    Status: <strong>{phase}</strong>
                </div>
            </div>
        </header>
    );
}
