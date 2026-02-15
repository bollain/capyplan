import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchRoomStats, RoomStats } from '../lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useTheme } from '../hooks/useTheme';



export default function Analytics() {
    const { roomId } = useParams<{ roomId: string }>();
    const [stats, setStats] = useState<RoomStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { theme } = useTheme();

    useEffect(() => {
        if (roomId) {
            fetchRoomStats(roomId)
                .then(setStats)
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [roomId]);

    if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!stats) return null;

    // Transform distribution for chart
    const distData = Object.entries(stats.voteDistribution).map(([value, count]) => ({
        value,
        count
    })).sort((a, b) => Number(a.value) - Number(b.value));

    // Format dates
    const consensusData = stats.consensusHistory.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString()
    }));

    const participationData = stats.participation.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString()
    }));


    const isDark = theme === 'dark';
    const textColor = isDark ? '#fff' : '#000';
    const gridColor = isDark ? '#444' : '#ccc';

    return (
        <div className="min-h-screen bg-background text-text p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{stats.roomName} Analytics</h1>
                        <p className="opacity-70">
                            {stats.totalSessions} Sessions • {stats.totalVotes} Total Votes
                        </p>
                    </div>
                    <Link to={`/room/${roomId}`} className="px-4 py-2 bg-primary text-white rounded hover:opacity-90 transition">
                        Back to Room
                    </Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Consensus Trend */}
                    <div className="p-6 bg-surface rounded-lg shadow-lg border border-border">
                        <h2 className="text-xl font-semibold mb-4">Consensus Trend</h2>
                        <div style={{ width: '100%', height: 300, minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                                <LineChart data={consensusData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                    <XAxis dataKey="date" stroke={textColor} type="category" allowDuplicatedCategory={true} />
                                    <YAxis stroke={textColor} />
                                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: gridColor }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="consensus" stroke="#8884d8" name="Avg Estimate" strokeWidth={2} />
                                    <Line type="monotone" dataKey="variance" stroke="#82ca9d" name="Variance" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Participation */}
                    <div className="p-6 bg-surface rounded-lg shadow-lg border border-border">
                        <h2 className="text-xl font-semibold mb-4">Participation</h2>
                        <div style={{ width: '100%', height: 300, minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                                <BarChart data={participationData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                    <XAxis dataKey="date" stroke={textColor} type="category" />
                                    <YAxis stroke={textColor} />
                                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: gridColor }} />
                                    <Legend />
                                    <Bar dataKey="count" fill="#ffc658" name="Voters" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Vote Distribution */}
                    <div className="p-6 bg-surface rounded-lg shadow-lg border border-border md:col-span-2">
                        <h2 className="text-xl font-semibold mb-4">Overall Vote Distribution</h2>
                        <div style={{ width: '100%', height: 300, minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                                <BarChart data={distData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                    <XAxis dataKey="value" stroke={textColor} label={{ value: 'Estimate Value', position: 'insideBottom', offset: -5, fill: textColor }} type="category" />
                                    <YAxis stroke={textColor} />
                                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: gridColor }} />
                                    <Bar dataKey="count" fill="#8884d8" name="Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
