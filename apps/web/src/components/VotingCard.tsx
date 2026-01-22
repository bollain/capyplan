
interface Props {
    value: number;
    isSelected: boolean;
    onClick: () => void;
}

export default function VotingCard({ value, isSelected, onClick }: Props) {
    return (
        <button
            onClick={onClick}
            style={{
                width: '3rem',
                height: '4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isSelected ? '2px solid #646cff' : '1px solid #444',
                borderRadius: '8px',
                backgroundColor: isSelected ? 'rgba(100, 108, 255, 0.2)' : '#2a2a2a',
                color: isSelected ? '#fff' : '#aaa',
                cursor: 'pointer',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected ? '0 4px 12px rgba(100, 108, 255, 0.3)' : 'none'
            }}
        >
            {value}
        </button>
    );
}
