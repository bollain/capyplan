import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeckSelector from '../DeckSelector';
import { EstimationMode } from '@capyplan/protocol';

describe('DeckSelector', () => {
    const defaultProps = {
        currentDeck: [1, 2, 3],
        onUpdateDeck: vi.fn(),
        currentMode: EstimationMode.PERT,
        onUpdateMode: vi.fn()
    };

    it('renders room settings', () => {
        render(<DeckSelector {...defaultProps} />);
        
        // Before clicking edit, it just shows the deck summary
        expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('updates estimation mode when radio is clicked', () => {
        render(<DeckSelector {...defaultProps} />);
        const toggleBtn = screen.getByText('Edit');
        fireEvent.click(toggleBtn);

        const pokerRadio = screen.getByLabelText('Planning Poker');
        fireEvent.click(pokerRadio);
        expect(defaultProps.onUpdateMode).toHaveBeenCalledWith(EstimationMode.POKER);
    });
});
