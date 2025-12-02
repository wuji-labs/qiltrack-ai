'use client';

import { useState, useEffect } from 'react';

interface MetricsData {
  reports: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byTone: Record<string, number>;
    byLanguage: Record<string, number>;
    avgGenerationTime: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
  };
  credits: {
    totalConsumed: number;
    totalGranted: number;
    avgBalance: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  };
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/metrics');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch metrics');
      }

      setMetrics(data.data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Business Metrics</h2>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Reports"
          value={metrics.reports.total}
          subtitle={`${metrics.reports.today} today`}
          color="blue"
        />
        <MetricCard
          title="Total Users"
          value={metrics.users.total}
          subtitle={`${metrics.users.active} active`}
          color="green"
        />
        <MetricCard
          title="Credits Consumed"
          value={metrics.credits.totalConsumed}
          subtitle={`Avg balance: ${metrics.credits.avgBalance}`}
          color="purple"
        />
        <MetricCard
          title="Cache Hit Rate"
          value={`${metrics.performance.cacheHitRate.toFixed(1)}%`}
          subtitle="Last hour"
          color="indigo"
        />
      </div>

      {/* Report Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Report Generation Trends</h3>
        <div className="grid grid-cols-3 gap-4">
          <TrendCard label="Today" value={metrics.reports.today} />
          <TrendCard label="This Week" value={metrics.reports.thisWeek} />
          <TrendCard label="This Month" value={metrics.reports.thisMonth} />
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Avg Generation Time: <span className="font-bold">{metrics.reports.avgGenerationTime}ms</span>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Tone */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Reports by Tone</h3>
          <div className="space-y-2">
            {Object.entries(metrics.reports.byTone).map(([tone, count]) => (
              <BarItem key={tone} label={tone} value={count} total={metrics.reports.total} />
            ))}
          </div>
        </div>

        {/* By Language */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Reports by Language</h3>
          <div className="space-y-2">
            {Object.entries(metrics.reports.byLanguage).map(([lang, count]) => (
              <BarItem key={lang} label={lang} value={count} total={metrics.reports.total} />
            ))}
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">User Statistics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.users.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Active (7d)</p>
            <p className="text-2xl font-bold text-green-600">{metrics.users.active}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">New (7d)</p>
            <p className="text-2xl font-bold text-blue-600">{metrics.users.new}</p>
          </div>
        </div>
      </div>

      {/* Credit System */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Credit System</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Consumed</p>
            <p className="text-2xl font-bold text-red-600">{metrics.credits.totalConsumed}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Granted</p>
            <p className="text-2xl font-bold text-green-600">{metrics.credits.totalGranted}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg Balance</p>
            <p className="text-2xl font-bold text-blue-600">{metrics.credits.avgBalance}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'indigo';
}

function MetricCard({ title, value, subtitle, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    indigo: 'bg-indigo-50 border-indigo-200',
  };

  const textClasses = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    purple: 'text-purple-900',
    indigo: 'text-indigo-900',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className={`text-3xl font-bold ${textClasses[color]} mt-2`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function TrendCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-lg p-3 text-center">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function BarItem({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-gray-600">
          {value} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
