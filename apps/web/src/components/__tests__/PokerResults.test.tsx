import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PokerResults from '../PokerResults';
import { RoomState } from '@capyplan/protocol';

describe('PokerResults', () => {
    const mockParticipants: RoomState['participants'] = [
        { id: 'user1', name: 'Alice', isSpectator: false, connected: true },
        { id: 'user2', name: 'Bob', isSpectator: false, connected: true },
    ];

    const mockResults: NonNullable<RoomState['results']> = {
        user1: { score: 5 },
        user2: { score: 8 },
    };

    it('renders participants and their votes', () => {
        render(<PokerResults participants={mockParticipants} results={mockResults} />);
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('calculates the correct average', () => {
        render(<PokerResults participants={mockParticipants} results={mockResults} />);
        // 5 + 8 = 13 / 2 = 6.5
        expect(screen.getByText('6.5')).toBeInTheDocument();
    });
});
