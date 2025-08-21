import { supabase } from '@/lib/supabase/client';

interface PointRecoveryStats {
  totalUsersProcessed: number;
  totalPointsRecovered: number;
  largestPointChange: {
    twitterHandle: string;
    oldPoints: number;
    newPoints: number;
    difference: number;
  };
  recentRecoveries: Array<{
    twitterHandle: string;
    oldPoints: number;
    newPoints: number;
    timestamp: string;
    ogStatus: {
      wasOG: boolean;
      isNowOG: boolean;
    };
  }>;
  errorLogs: Array<{
    twitterHandle: string;
    error: string;
    timestamp: string;
  }>;
}

async function getPointRecoveryStats(): Promise<PointRecoveryStats> {
  const { data: logs } = await supabase
    .from('point_recovery_logs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (!logs) return {
    totalUsersProcessed: 0,
    totalPointsRecovered: 0,
    largestPointChange: {
      twitterHandle: '',
      oldPoints: 0,
      newPoints: 0,
      difference: 0
    },
    recentRecoveries: [],
    errorLogs: []
  };

  let largestChange = logs.reduce((max, log) => {
    const diff = Math.abs(log.new_points - log.old_points);
    return diff > Math.abs(max.new_points - max.old_points) ? log : max;
  }, logs[0]);

  return {
    totalUsersProcessed: logs.length,
    totalPointsRecovered: logs.reduce((sum, log) => sum + (log.new_points - log.old_points), 0),
    largestPointChange: {
      twitterHandle: largestChange.twitter_handle,
      oldPoints: largestChange.old_points,
      newPoints: largestChange.new_points,
      difference: largestChange.new_points - largestChange.old_points
    },
    recentRecoveries: logs.slice(0, 10).map(log => ({
      twitterHandle: log.twitter_handle,
      oldPoints: log.old_points,
      newPoints: log.new_points,
      timestamp: new Date(log.timestamp).toLocaleString(),
      ogStatus: log.og_status
    })),
    errorLogs: logs
      .filter(log => log.error)
      .map(log => ({
        twitterHandle: log.twitter_handle,
        error: log.error,
        timestamp: new Date(log.timestamp).toLocaleString()
      }))
  };
}

export default async function PointRecoveryDashboard() {
  const stats = await getPointRecoveryStats();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Point Recovery Dashboard</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Total Users Processed</h3>
          <p className="text-4xl">{stats.totalUsersProcessed}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Total Points Recovered</h3>
          <p className="text-4xl">{stats.totalPointsRecovered.toLocaleString()}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Largest Point Change</h3>
          <p className="text-sm">{stats.largestPointChange.twitterHandle}</p>
          <p className="text-xl">
            {stats.largestPointChange.oldPoints.toLocaleString()} → {stats.largestPointChange.newPoints.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recent Recoveries */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recent Recoveries</h2>
        <div className="bg-white/10 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5">
                <th className="p-4 text-left">User</th>
                <th className="p-4 text-left">Old Points</th>
                <th className="p-4 text-left">New Points</th>
                <th className="p-4 text-left">OG Status</th>
                <th className="p-4 text-left">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentRecoveries.map((recovery, i) => (
                <tr key={i} className="border-t border-white/10">
                  <td className="p-4">{recovery.twitterHandle}</td>
                  <td className="p-4">{recovery.oldPoints.toLocaleString()}</td>
                  <td className="p-4">{recovery.newPoints.toLocaleString()}</td>
                  <td className="p-4">
                    {recovery.ogStatus.wasOG === recovery.ogStatus.isNowOG ? (
                      recovery.ogStatus.isNowOG ? 'OG' : 'Non-OG'
                    ) : (
                      `${recovery.ogStatus.wasOG ? 'OG' : 'Non-OG'} → ${recovery.ogStatus.isNowOG ? 'OG' : 'Non-OG'}`
                    )}
                  </td>
                  <td className="p-4">{recovery.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Logs */}
      {stats.errorLogs.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Error Logs</h2>
          <div className="bg-white/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="p-4 text-left">User</th>
                  <th className="p-4 text-left">Error</th>
                  <th className="p-4 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {stats.errorLogs.map((log, i) => (
                  <tr key={i} className="border-t border-white/10">
                    <td className="p-4">{log.twitterHandle}</td>
                    <td className="p-4">{log.error}</td>
                    <td className="p-4">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
