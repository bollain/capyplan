import { RoomState, EstimationMode } from '@capyplan/protocol';
import PertResults from './PertResults';

interface Props {
    results: NonNullable<RoomState['results']>;
    participants: RoomState['participants'];
    currentEstimates: RoomState['currentEstimates'];
    estimationMode: EstimationMode;
}

export default function EstimationResults({ results, participants, currentEstimates, estimationMode }: Props) {
    if (estimationMode === EstimationMode.PERT) {
        return <PertResults results={results} participants={participants} currentEstimates={currentEstimates} />;
    }

    return <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>Unsupported Estimation Mode: {estimationMode}</div>;
}
