/**
 * Cache Statistics Card
 *
 * Displays real-time cache performance metrics
 */

'use client';

import { useEffect, useState } from 'react';

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

interface CacheStatsData {
  marketData: CacheStats;
  report: CacheStats;
  overall: CacheStats & { requests: number };
  timestamp: string;
}

export function CacheStatsCard() {
  const [stats, setStats] = useState<CacheStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/cache/stats');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setStats(data.data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(String(err));
      console.error('Failed to fetch cache stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetStats = async () => {
    if (!confirm('Are you sure you want to reset cache statistics?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/cache/stats', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to reset stats');
      }

      // Refresh stats after reset
      await fetchStats();
    } catch (err) {
      setError(String(err));
      console.error('Failed to reset cache stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Statistics</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Statistics</h3>
        <p className="text-red-500">Error: {error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const getHitRateColor = (hitRate: number) => {
    if (hitRate >= 70) return 'text-green-600';
    if (hitRate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Cache Statistics</h3>
        <div className="flex gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={resetStats}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Overall Stats */}
        <div className="border-b pb-4">
          <h4 className="font-medium mb-2">Overall</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-2xl font-semibold">{stats.overall.requests}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hits</p>
              <p className="text-2xl font-semibold text-green-600">
                {stats.overall.hits}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hit Rate</p>
              <p
                className={`text-2xl font-semibold ${getHitRateColor(
                  stats.overall.hitRate
                )}`}
              >
                {stats.overall.hitRate.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Market Data Cache */}
        <div className="border-b pb-4">
          <h4 className="font-medium mb-2">Market Data Cache</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Hits</p>
              <p className="text-lg font-semibold">{stats.marketData.hits}</p>
            </div>
            <div>
              <p className="text-gray-500">Misses</p>
              <p className="text-lg font-semibold">{stats.marketData.misses}</p>
            </div>
            <div>
              <p className="text-gray-500">Hit Rate</p>
              <p
                className={`text-lg font-semibold ${getHitRateColor(
                  stats.marketData.hitRate
                )}`}
              >
                {stats.marketData.hitRate.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Report Cache */}
        <div>
          <h4 className="font-medium mb-2">Report Cache</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Hits</p>
              <p className="text-lg font-semibold">{stats.report.hits}</p>
            </div>
            <div>
              <p className="text-gray-500">Misses</p>
              <p className="text-lg font-semibold">{stats.report.misses}</p>
            </div>
            <div>
              <p className="text-gray-500">Hit Rate</p>
              <p
                className={`text-lg font-semibold ${getHitRateColor(
                  stats.report.hitRate
                )}`}
              >
                {stats.report.hitRate.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 pt-2">
          <p>
            Last refresh:{' '}
            {lastRefresh.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
