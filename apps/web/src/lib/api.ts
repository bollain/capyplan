export interface RoomStats {
    roomName: string;
    consensusHistory: {
        date: string;
        consensus: number;
        variance: number;
    }[];
    voteDistribution: Record<string, number>;
    participation: {
        date: string;
        count: number;
    }[];
    totalSessions: number;
    totalVotes: number;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function fetchRoomStats(slug: string): Promise<RoomStats> {
    const res = await fetch(`${API_BASE}/rooms/${slug}/stats`);
    if (!res.ok) {
        throw new Error('Failed to fetch stats');
    }
    return res.json();
}
