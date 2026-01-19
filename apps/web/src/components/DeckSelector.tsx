import { useState } from 'react';

interface Props {
    currentDeck: number[] | undefined;
    onUpdateDeck: (estimates: number[]) => void;
}

const PRESETS = {
    'Fibonacci': [0, 1, 2, 3, 5, 8],
    'Standard': [0, 0.5, 1, 2, 3, 5, 8],
    'T-Shirt (mapped)': [1, 2, 3, 5, 8], // XS, S, M, L, XL
};

export default function DeckSelector({ currentDeck, onUpdateDeck }: Props) {
    const [customInput, setCustomInput] = useState('');


    return (
        <div className="card" style={{ marginTop: '1rem', border: '1px dashed #444' }}>
            <h4>⚙️ Deck Configuration</h4>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {Object.entries(PRESETS).map(([name, values]) => (
                    <button
                        key={name}
                        onClick={() => onUpdateDeck(values)}
                        style={{
                            fontSize: '0.8rem',
                            backgroundColor: JSON.stringify(currentDeck) === JSON.stringify(values) ? 'var(--color-primary)' : '#333'
                        }}
                    >
                        {name}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem' }}>Custom (comma separated):</label>
                <input
                    style={{ flex: 1, padding: '0.3rem' }}
                    placeholder="e.g. 1, 2, 4, 8, 16"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                />
                <button
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => {
                        const values = customInput.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
                        if (values.length > 0) onUpdateDeck(values);
                    }}
                >
                    Set
                </button>
            </div>

            {currentDeck && (
                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                    Active Deck: {currentDeck.join(', ')}
                </p>
            )}
        </div>
    );
}
