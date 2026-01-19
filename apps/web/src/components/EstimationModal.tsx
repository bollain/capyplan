import { useState } from 'react';
import { EstimationMode } from '@capyplan/protocol';

interface Props {
    mode: EstimationMode;
    availableEstimates?: number[] | undefined;
    onClose: () => void;
    onSubmit: (payload: any) => void;
}

export default function EstimationModal({ mode, availableEstimates, onClose, onSubmit }: Props) {
    // PERTybara state
    const [optimistic, setOptimistic] = useState('');
    const [mostLikely, setMostLikely] = useState('');
    const [pessimistic, setPessimistic] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation / conversion
        const payload = {
            optimistic: Number(optimistic),
            mostLikely: Number(mostLikely),
            pessimistic: Number(pessimistic),
        };
        onSubmit(payload);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h2>Submit Estimate</h2>
                <p>Mode: {mode}</p>

                {mode === EstimationMode.PERT ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {['optimistic', 'mostLikely', 'pessimistic'].map((field) => (
                            <div key={field}>
                                <label style={{ display: 'block', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                                    {field.replace(/([A-Z])/g, ' $1').trim()}
                                </label>
                                {availableEstimates ? (
                                    <select
                                        value={field === 'optimistic' ? optimistic : field === 'mostLikely' ? mostLikely : pessimistic}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (field === 'optimistic') setOptimistic(val);
                                            else if (field === 'mostLikely') setMostLikely(val);
                                            else setPessimistic(val);
                                        }}
                                        required
                                        style={{ width: '100%', padding: '0.5rem' }}
                                    >
                                        <option value="" disabled>Select value</option>
                                        {availableEstimates.map(val => (
                                            <option key={val} value={val}>{val}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={field === 'optimistic' ? optimistic : field === 'mostLikely' ? mostLikely : pessimistic}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (field === 'optimistic') setOptimistic(val);
                                            else if (field === 'mostLikely') setMostLikely(val);
                                            else setPessimistic(val);
                                        }}
                                        required
                                    />
                                )}
                            </div>
                        ))}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={onClose} style={{ backgroundColor: '#ccc' }}>Cancel</button>
                            <button type="submit">Submit</button>
                        </div>
                    </form>
                ) : (
                    <p>Mode not supported in this modal yet.</p>
                )}
            </div>
        </div>
    );
}
