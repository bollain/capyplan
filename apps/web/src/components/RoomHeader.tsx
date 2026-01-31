import { RoomPhase, EstimationMode } from '@capyplan/protocol';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/capyplan.png';
import Toast from './Toast';
import SessionStatus from './SessionStatus';

interface Props {
    roomId: string;
    estimationMode: EstimationMode;
    phase: RoomPhase;
    userName?: string;
    voteCount: number;
    totalParticipants: number;
}

export default function RoomHeader({ roomId, estimationMode, phase, userName, voteCount, totalParticipants }: Props) {
    const [showToast, setShowToast] = useState(false);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setShowToast(true);
    };

    return (
        <header className="room-header">
            <Toast
                message="Link copied to clipboard! 📋"
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
            <div className="header-left">
                <Link to="/" className="brand-link">
                    <img src={logo} alt="CapyPlan" className="brand-logo-small" />
                    <span className="brand-text-small">CapyPlan</span>
                </Link>
                <div className="divider-vertical"></div>
                <div className="room-title-group">
                    <h1 className="room-title">{roomId}</h1>
                    <span className="room-meta">&nbsp;&middot;&nbsp; {estimationMode}</span>
                </div>
            </div>
            <div className="header-right">
                <div className="user-pill">
                    <span className="user-avatar">🐹</span>
                    <span className="user-name">{userName}</span>
                </div>

                <SessionStatus
                    phase={phase}
                    voteCount={voteCount}
                    totalParticipants={totalParticipants}
                />

                <button
                    onClick={handleShare}
                    className="share-btn-soft"
                    title="Copy Link"
                >
                    Share
                </button>
            </div>
        </header>
    );
}
