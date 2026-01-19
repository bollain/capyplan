interface Props {
    onReveal: () => void;
    onNextItem: () => void;
}

export default function LeaderControls({ onReveal, onNextItem }: Props) {
    return (
        <div className="card" style={{ border: '1px solid var(--color-primary)' }}>
            <h3>Leader Controls</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={onReveal}>
                    Reveal Estimates
                </button>
                <button
                    onClick={onNextItem}
                    style={{ backgroundColor: 'var(--color-secondary)' }}
                >
                    Next Item
                </button>
            </div>
        </div>
    );
}
