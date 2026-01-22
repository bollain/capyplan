import { RoomState, EstimationMode } from '@capyplan/protocol';
import PertResults from './PertResults';

interface Props {
    results: NonNullable<RoomState['results']>;
    participants: RoomState['participants'];
    estimationMode: EstimationMode;
}

export default function EstimationResults({ results, participants, estimationMode }: Props) {
    if (estimationMode === EstimationMode.PERT) {
        return <PertResults results={results} participants={participants} />;
    }

    return <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>Unsupported Estimation Mode: {estimationMode}</div>;
}
