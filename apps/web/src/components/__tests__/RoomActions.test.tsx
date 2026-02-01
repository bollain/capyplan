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

    it('renders Waiting state when votes are missing', () => {
        render(<RoomActions {...defaultProps} voteCount={1} totalParticipants={3} />);
        expect(screen.getByText('Waiting for Votes (1/3)')).toBeInTheDocument();
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('renders Reveal button when all voted', () => {
        render(<RoomActions {...defaultProps} voteCount={3} totalParticipants={3} />);
        expect(screen.getByText(/Reveal Estimates/i)).toBeInTheDocument();
        const button = screen.getByRole('button');
        expect(button).not.toBeDisabled();
    });

    it('renders Next Vote button in REVEALED phase', () => {
        render(<RoomActions {...defaultProps} phase={RoomPhase.REVEALED} />);
        expect(screen.getByText('Start New Estimation')).toBeInTheDocument();
    });

    it('calls onReveal when clicked', () => {
        const handleReveal = vi.fn();
        render(<RoomActions {...defaultProps} voteCount={3} totalParticipants={3} onReveal={handleReveal} />);

        const button = screen.getByText(/Reveal Estimates/i);
        fireEvent.click(button);

        expect(handleReveal).toHaveBeenCalled();
    });
});
