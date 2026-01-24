interface Props {
    onReveal: () => void;
    onNextItem: () => void;
}

export default function LeaderControls({ onReveal, onNextItem }: Props) {
    return (
        <div className="card leader-card">
            <h3>Leader Controls</h3>
            <div className="leader-actions">
                <button onClick={onReveal}>
                    Reveal Estimates
                </button>
                <button
                    onClick={onNextItem}
                    className="btn-secondary"
                >
                    New Estimation
                </button>
            </div>
        </div>
    );
}
