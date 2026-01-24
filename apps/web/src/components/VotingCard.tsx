
interface Props {
    value: number;
    isSelected: boolean;
    onClick: () => void;
}

export default function VotingCard({ value, isSelected, onClick }: Props) {
    return (
        <button
            onClick={onClick}
            className={`voting-card ${isSelected ? 'selected' : ''}`}
        >
            {value}
        </button>
    );
}
