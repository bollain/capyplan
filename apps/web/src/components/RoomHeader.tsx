import { RoomPhase, EstimationMode } from '@capyplan/protocol';
import { Link } from 'react-router-dom';
import logo from '../assets/capyplan.png';
import SessionStatus from './SessionStatus';

interface Props {
    roomId: string;
    roomName?: string;
    estimationMode: EstimationMode;
    phase: RoomPhase;
    userName?: string;
    voteCount: number;
    totalParticipants: number;
    onInvite: () => void;
}

export default function RoomHeader({ roomId, roomName, estimationMode, phase, userName, voteCount, totalParticipants, onInvite }: Props) {
    return (
        <header className="room-header">

            <div className="header-brand">
                <Link to="/" className="brand-link">
                    <img src={logo} alt="CapyPlan" className="brand-logo-small" />
                    <span className="brand-text-small">CapyPlan</span>
                </Link>
                <div className="divider-vertical"></div>
            </div>

            <div className="header-room-info">
                <div className="room-title-group">
                    <h1 className="room-title" title={`ID: ${roomId} | Name: ${roomName || 'Untitled'}`}>
                        {roomName || roomId}
                    </h1>
                    <span className="room-meta">
                        &nbsp;&middot;&nbsp; Mode:&nbsp;
                        {estimationMode === 'PERT' ? (
                            <a
                                href="https://en.wikipedia.org/wiki/Program_evaluation_and_review_technique"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="meta-link"
                                title="Learn about PERT on Wikipedia"
                            >
                                {estimationMode}
                            </a>
                        ) : (
                            estimationMode
                        )}
                    </span>
                </div>
            </div>

            <div className="header-actions">
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
                    onClick={onInvite}
                    className="share-btn-soft"
                    title="Copy Link"
                >
                    <span className="btn-icon">+</span> Invite Players
                </button>
            </div>
        </header>
    );
}
