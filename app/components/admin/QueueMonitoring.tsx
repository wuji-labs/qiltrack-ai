import React from 'react';

/**
 * Admin Queue Monitoring Component
 *
 * Displays queue statistics and recent failed jobs
 */
export default function QueueMonitoring() {
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/queue/stats');
      const data = await res.json();

      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.error?.message || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const retryJob = async (jobId: string) => {
    try {
      const res = await fetch('/api/admin/queue/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Job retried successfully');
        fetchStats();
      } else {
        alert(data.error?.message || 'Failed to retry job');
      }
    } catch (err) {
      alert(String(err));
    }
  };

  React.useEffect(() => {
    fetchStats();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return <div className="p-4">Loading queue stats...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error: {error}
        <button
          onClick={fetchStats}
          className="ml-4 px-3 py-1 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Queue Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-gray-500 text-sm">Waiting</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.stats.waiting || 0}
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="text-gray-500 text-sm">Active</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.stats.active || 0}
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="text-gray-500 text-sm">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {stats?.stats.completed || 0}
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="text-gray-500 text-sm">Failed</div>
            <div className="text-2xl font-bold text-red-600">
              {stats?.stats.failed || 0}
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="text-gray-500 text-sm">Delayed</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.stats.delayed || 0}
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="text-gray-500 text-sm">Total</div>
            <div className="text-2xl font-bold text-gray-800">
              {stats?.stats.total || 0}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Failed Jobs</h2>
        {stats?.failedJobs.length === 0 ? (
          <div className="text-gray-500">No failed jobs</div>
        ) : (
          <div className="space-y-2">
            {stats?.failedJobs.map((job: any) => (
              <div key={job.id} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-sm text-gray-600">
                      {job.id}
                    </div>
                    <div className="mt-1">
                      <span className="font-semibold">Report:</span>{' '}
                      {job.reportRunId}
                    </div>
                    <div className="mt-1">
                      <span className="font-semibold">Language:</span>{' '}
                      {job.language} | <span className="font-semibold">Tone:</span>{' '}
                      {job.tone}
                    </div>
                    <div className="mt-1 text-red-600">
                      <span className="font-semibold">Error:</span>{' '}
                      {job.failedReason}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Attempts: {job.attemptsMade} | Time:{' '}
                      {new Date(job.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => retryJob(job.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
