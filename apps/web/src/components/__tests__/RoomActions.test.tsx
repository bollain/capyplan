import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoomActions from '../RoomActions';
import { RoomPhase } from '@capyplan/protocol';

describe('RoomActions', () => {
    const defaultProps = {
        phase: RoomPhase.VOTING,
        // isLeader/isSpectator are NOT props of this component; logic is handled by parent or disabled state
        voteCount: 0,
        totalParticipants: 3,
        onReveal: vi.fn(),
        onNextItem: vi.fn(),
    };

    it('renders Waiting state when no votes cast', () => {
        render(<RoomActions {...defaultProps} voteCount={0} totalParticipants={3} />);
        expect(screen.getByText(/Waiting for Votes/i)).toBeInTheDocument();
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('renders Reveal button when all voted', () => {
        render(<RoomActions {...defaultProps} voteCount={3} totalParticipants={3} />);
        expect(screen.getByRole('button', { name: /Reveal All Estimates/i })).toBeInTheDocument();
        const button = screen.getByRole('button');
        expect(button).not.toBeDisabled();
    });

    it('renders Interlude waiting pill then Next Vote button in REVEALED phase', async () => {
        vi.useFakeTimers();
        // Provide results to trigger disagreement calculation (though pill shows regardless of level)
        const results = {
            'user1': { score: 1, stdDev: 0 },
            'user2': { score: 13, stdDev: 0 },
        };
        render(<RoomActions {...defaultProps} phase={RoomPhase.REVEALED} results={results} />);

        // Initially should show the loading state (InterludePill)
        // Since InterludePill messages are random, we check for absent button or presence of "Start New Estimation" later
        expect(screen.queryByText('Start New Estimation')).not.toBeInTheDocument();

        // Advance time by 2 seconds + buffer
        await vi.advanceTimersByTimeAsync(6000);

        expect(screen.getByText('Start New Estimation')).toBeInTheDocument();
        vi.useRealTimers();
    });

    it('calls onReveal when clicked', () => {
        const handleReveal = vi.fn();
        render(<RoomActions {...defaultProps} voteCount={3} totalParticipants={3} onReveal={handleReveal} />);

        const button = screen.getByRole('button', { name: /Reveal All Estimates/i });
        fireEvent.click(button);

        expect(handleReveal).toHaveBeenCalled();
    });
});
