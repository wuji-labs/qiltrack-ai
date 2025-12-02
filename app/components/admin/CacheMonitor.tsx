'use client';

import { useState, useEffect } from 'react';

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  total: number;
}

interface CacheData {
  marketData: CacheStats;
  report: CacheStats;
  overall: {
    hitRate: number;
  };
  timestamp: string;
}

export function CacheMonitor() {
  const [stats, setStats] = useState<CacheData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Fetch cache stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/cache');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch cache stats');
      }

      setStats(data.data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Reset cache stats
  const resetStats = async () => {
    if (!confirm('Are you sure you want to reset cache statistics?')) {
      return;
    }

    try {
      setResetting(true);
      setError(null);

      const response = await fetch('/api/admin/cache', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to reset cache stats');
      }

      // Refresh stats
      await fetchStats();
    } catch (err) {
      setError(String(err));
    } finally {
      setResetting(false);
    }
  };

  // Invalidate cache
  const invalidateCache = async (
    type: 'market-data' | 'report' | 'all',
    symbol?: string
  ) => {
    if (!symbol) {
      symbol = prompt('Enter symbol to invalidate:')?.toUpperCase();
      if (!symbol) return;
    }

    try {
      const response = await fetch('/api/admin/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, symbol }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to invalidate cache');
      }

      alert(data.message);
    } catch (err) {
      alert(`Error: ${String(err)}`);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Cache Monitor</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={resetStats}
            disabled={resetting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {resetting ? 'Resetting...' : 'Reset Stats'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">Error: {error}</p>
        </div>
      )}

      {stats && (
        <>
          {/* Overall Hit Rate */}
          <div className="mb-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white">
            <p className="text-sm font-medium opacity-90">Overall Hit Rate</p>
            <p className="text-4xl font-bold mt-2">
              {stats.overall.hitRate.toFixed(2)}%
            </p>
            <p className="text-sm opacity-75 mt-1">
              Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
            </p>
          </div>

          {/* Market Data Stats */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Market Data Cache
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                label="Hits"
                value={stats.marketData.hits}
                color="green"
              />
              <StatCard
                label="Misses"
                value={stats.marketData.misses}
                color="red"
              />
              <StatCard
                label="Hit Rate"
                value={`${stats.marketData.hitRate.toFixed(2)}%`}
                color="blue"
              />
              <StatCard
                label="Total"
                value={stats.marketData.total}
                color="gray"
              />
            </div>
            <div className="mt-3">
              <button
                onClick={() => invalidateCache('market-data')}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Invalidate Market Data
              </button>
            </div>
          </div>

          {/* Report Cache Stats */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Report Cache
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Hits" value={stats.report.hits} color="green" />
              <StatCard
                label="Misses"
                value={stats.report.misses}
                color="red"
              />
              <StatCard
                label="Hit Rate"
                value={`${stats.report.hitRate.toFixed(2)}%`}
                color="blue"
              />
              <StatCard
                label="Total"
                value={stats.report.total}
                color="gray"
              />
            </div>
            <div className="mt-3 flex gap-4">
              <button
                onClick={() => invalidateCache('report')}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Invalidate Report Cache
              </button>
              <button
                onClick={() => invalidateCache('all')}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Invalidate All Caches
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  color: 'green' | 'red' | 'blue' | 'gray';
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
  };

  return (
    <div
      className={`p-4 rounded-lg border ${colorClasses[color]} transition-all hover:shadow-md`}
    >
      <p className="text-xs font-medium opacity-75 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
