import { useState, useEffect } from 'react';
import { useMarketsWithCache } from '../../hooks/useMarketsWithCache';
import OddsTable from '../../components/betting/OddsTable';
import { Calendar, RefreshCw, Filter, ChevronDown } from 'lucide-react';

export function OddsPage() {
  const [selectedSports, setSelectedSports] = useState(['americanfootball_nfl']);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [marketKeys, setMarketKeys] = useState(['h2h', 'spreads', 'totals']);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real odds data from API
  const {
    games,
    loading,
    error,
    refresh: refreshMarkets,
  } = useMarketsWithCache(
    selectedSports,
    ['us'],
    marketKeys,
    { date: selectedDate, autoRefresh: true }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMarkets();
    setIsRefreshing(false);
  };

  const sports = [
    { id: 'americanfootball_nfl', name: 'NFL' },
    { id: 'basketball_nba', name: 'NBA' },
    { id: 'basketball_ncaab', name: 'NCAAB' },
    { id: 'baseball_mlb', name: 'MLB' },
    { id: 'icehockey_nhl', name: 'NHL' },
    { id: 'soccer_epl', name: 'Soccer' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold">Live Odds</h1>
          <p className="text-white/60 font-semibold mt-2">Real-time odds comparison across 39+ sportsbooks</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-400/30 text-emerald-300 rounded-xl hover:from-emerald-500/30 hover:to-teal-500/30 transition-all font-bold shadow-lg shadow-emerald-500/10 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Sports Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setSelectedSports([sport.id])}
            className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${
              selectedSports.includes(sport.id)
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/5 backdrop-blur-xl border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {sport.name}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <input 
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-xl focus:outline-none focus:border-purple-400/40 font-bold"
        />
        <button className="flex items-center gap-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-bold">
          <Filter className="w-4 h-4" />
          Market Type
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 font-semibold">Error loading odds: {error.message}</p>
        </div>
      )}

      {/* Odds Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <OddsTable
          games={games}
          mode="game"
          pageSize={15}
          loading={loading}
          error={error}
          bookFilter={selectedBooks}
          marketFilter={marketKeys}
          initialSort={{ key: 'ev', dir: 'desc' }}
        />
      </div>
    </div>
  );
}
