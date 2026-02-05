import { RoomPhase, RoomState } from '@capyplan/protocol';
import { useState, useEffect, useMemo } from 'react';
import InterludePill from './InterludePill';
import { calculateTeamStats } from '../lib/pert';
import { DisagreementLevel } from '../constants/interludeMessages';


interface Props {
    onReveal: () => void;
    onNextItem: () => void;
    phase: RoomPhase;
    voteCount: number;
    totalParticipants: number;
    results?: RoomState['results'];
}

const COOLDOWN_SECONDS = 2;

export default function RoomActions({ onReveal, onNextItem, phase, voteCount, totalParticipants, results }: Props) {
    const allVoted = totalParticipants > 0 && voteCount >= totalParticipants;
    const [cooldown, setCooldown] = useState(phase === RoomPhase.REVEALED ? COOLDOWN_SECONDS : 0);
    const [prevPhase, setPrevPhase] = useState(phase);

    // Adjust state during render when phase changes (recommended React pattern)
    if (phase !== prevPhase) {
        setPrevPhase(phase);
        setCooldown(phase === RoomPhase.REVEALED ? COOLDOWN_SECONDS : 0);
    }

    // Always use compact layout for voting phase to prevent jumps
    const isVoting = phase === RoomPhase.VOTING;
    const cardClass = isVoting ? 'action-card-compact' : 'action-card-standard';

    // Calculate disagreement level for the interlude
    const disagreementLevel = useMemo(() => {
        if (!results || phase !== RoomPhase.REVEALED) return DisagreementLevel.Low;

        // Use the shared PERT logic to determine disagreement
        // We cast results to any because calculateTeamStats expects a specific shape 
        // essentially Record<string, {score: number}> which matches runtime but ts can be strict about index signatures
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stats = calculateTeamStats(results as any);

        // Map string 'Low' | 'Medium' | 'High' to our Enum
        // They happen to match exactly in value, but let's be safe/explicit if needed
        return stats.disagreementLevel as DisagreementLevel;
    }, [results, phase]);

    // Handle cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => {
                setCooldown(c => Math.max(0, c - 1));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

    return (
        <div className={`card room-actions-card ${cardClass}`}>
            <div className="room-actions-row">
                {phase === RoomPhase.VOTING && (
                    <button
                        onClick={onReveal}
                        disabled={voteCount === 0}
                        className={allVoted ? 'btn-prominent-std' : (voteCount > 0 ? '' : 'btn-waiting')}
                        title={voteCount === 0 ? `Waiting for votes... (${voteCount}/${totalParticipants})` : (allVoted ? 'Reveal all estimates' : 'Reveal current estimates')}
                    >
                        {allVoted ? '⚡ Reveal All Estimates' : (voteCount > 0 ? `Reveal Estimates (${voteCount}/${totalParticipants})` : `Waiting for Votes...`)}
                    </button>
                )}

                {phase === RoomPhase.REVEALED && (
                    <>
                        {cooldown > 0 ? (
                            <InterludePill isVisible={true} disagreementLevel={disagreementLevel} />
                        ) : (
                            <button
                                onClick={onNextItem}
                                className="btn-prominent"
                            >
                                Start New Estimation
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
