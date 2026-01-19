import { RoomPhase, RoomState } from '@capyplan/protocol';
import EstimationResults from './EstimationResults';

interface Props {
    phase: RoomPhase;
    results?: RoomState['results'];
    participants: RoomState['participants'];
    onOpenEstimateModal: () => void;
}

export default function CurrentItemArea({ phase, results, participants, onOpenEstimateModal }: Props) {
    return (
        <div className="card">
            <h2>Current Item</h2>
            <div style={{ padding: '2rem', textAlign: 'center', background: '#222', borderRadius: '8px' }}>
                {phase === RoomPhase.REVEALED && results ? (
                    <EstimationResults results={results} participants={participants} />
                ) : (
                    <>
                        <p><em>Item details currently not implemented in scaffold.</em></p>
                        <button onClick={onOpenEstimateModal}>
                            Submit Estimate
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
