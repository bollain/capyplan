import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Toast from '../Toast';

describe('Toast', () => {
    it('renders nothing when isVisible is false', () => {
        render(<Toast message="Hello" isVisible={false} onClose={() => { }} />);
        expect(screen.queryByText('Hello')).not.toBeInTheDocument();
    });

    it('renders message when isVisible is true', () => {
        render(<Toast message="Something happened" isVisible={true} onClose={() => { }} />);
        expect(screen.getByText('Something happened')).toBeInTheDocument();
    });

    it('calls onClose after duration', () => {
        vi.useFakeTimers();
        const handleClose = vi.fn();

        render(<Toast message="Timed" isVisible={true} onClose={handleClose} duration={1000} />);

        expect(handleClose).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(handleClose).toHaveBeenCalled();
        vi.useRealTimers();
    });
});
