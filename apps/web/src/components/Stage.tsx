import { RoomPhase, RoomState, EstimationMode } from '@capyplan/protocol';
import EstimationResults from './EstimationResults';
import VotingArea from './VotingArea';

interface Props {
    phase: RoomPhase;
    mode: EstimationMode;
    availableEstimates?: number[];
    results?: RoomState['results'];
    currentEstimates?: RoomState['currentEstimates'];
    participants: RoomState['participants'];
    isSpectator: boolean;
    onSubmitEstimate: (payload: any) => void;
}

export default function Stage({ phase, mode, availableEstimates, results, currentEstimates, participants, isSpectator, onSubmitEstimate }: Props) {
    return (
        <div className="card">
            {phase === RoomPhase.REVEALED && results ? (
                <EstimationResults results={results} currentEstimates={currentEstimates} participants={participants} estimationMode={mode} />
            ) : (
                <>
                    {isSpectator ? (
                        <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>You are a spectator. Waiting for the team to vote...</p>
                    ) : (
                        <>
                            <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Cast your vote:</p>
                            <VotingArea
                                mode={mode}
                                availableEstimates={availableEstimates}
                                onSubmit={onSubmitEstimate}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
}
