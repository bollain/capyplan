import { useState } from 'react';
import { PRESETS, DEFAULT_DECK } from '../constants/decks';

interface Props {
    currentDeck: number[] | undefined;
    onUpdateDeck: (estimates: number[]) => void;
}


export default function DeckSelector({ currentDeck, onUpdateDeck }: Props) {
    const [customInput, setCustomInput] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    // Default to Vanilla if no deck is selected
    const effectiveDeck = currentDeck || DEFAULT_DECK;

    // Find if current deck matches a preset
    const currentPresetName = Object.entries(PRESETS).find(
        ([, values]) => JSON.stringify(values) === JSON.stringify(effectiveDeck)
    )?.[0];

    const currentDeckDisplay = currentPresetName || 'Custom';

    if (!isExpanded) {
        return (
            <div className="card deck-config-card">
                <div className="deck-summary">
                    <div className="deck-summary-text">
                        <span className="deck-summary-label">Deck</span>
                        <span className="deck-summary-value">{currentDeckDisplay}</span>
                    </div>
                    <button
                        className="deck-edit-btn"
                        onClick={() => setIsExpanded(true)}
                    >
                        Edit
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card deck-config-card">
            <div className="deck-panel">
                <div className="deck-panel-header">
                    <h4 className="deck-panel-title">Choose Estimation Deck</h4>
                    <button
                        className="deck-close-btn"
                        onClick={() => setIsExpanded(false)}
                        title="Close"
                    >
                        &times;
                    </button>
                </div>

                <div className="deck-presets-grid">
                    {Object.entries(PRESETS).map(([name, values]) => {
                        const isActive = JSON.stringify(effectiveDeck) === JSON.stringify(values);
                        return (
                            <div
                                key={name}
                                onClick={() => onUpdateDeck(values)}
                                className={`deck-option ${isActive ? 'active' : ''}`}
                            >
                                <span className="deck-option-name">{name}</span>
                                <span className="deck-option-values">{values.join(', ')}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="deck-custom-group">
                    <label className="deck-custom-label">Custom:</label>
                    <input
                        className="deck-custom-input"
                        placeholder="e.g. 1, 2, 4, 8, 16"
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                const values = customInput.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
                                if (values.length > 0) onUpdateDeck(values);
                            }
                        }}
                    />
                    <button
                        className="deck-set-btn"
                        onClick={() => {
                            const values = customInput.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
                            if (values.length > 0) onUpdateDeck(values);
                        }}
                    >
                        Set
                    </button>
                </div>
            </div>
        </div>
    );
}
