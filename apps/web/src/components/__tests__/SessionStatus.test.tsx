import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SessionStatus from '../SessionStatus';

describe('SessionStatus', () => {
    it('displays Voting status correctly', () => {
        render(<SessionStatus phase="VOTING" voteCount={3} totalParticipants={5} />);
        expect(screen.getByText('Voting')).toBeInTheDocument();
        expect(screen.getByText('3 of 5 voted')).toBeInTheDocument();
    });

    it('displays Revealed status correctly', () => {
        render(<SessionStatus phase="REVEALED" voteCount={5} totalParticipants={5} />);
        expect(screen.getByText('Revealed')).toBeInTheDocument();
        expect(screen.getByText('Estimates shown')).toBeInTheDocument();
    });

    it('displays custom phase correctly', () => {
        // @ts-ignore - testing unknown phase fallback
        render(<SessionStatus phase="UNKNOWN_PHASE" voteCount={0} totalParticipants={0} />);
        expect(screen.getByText('UNKNOWN_PHASE')).toBeInTheDocument();
    });
});
