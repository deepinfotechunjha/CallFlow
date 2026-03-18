import React, { useEffect, useMemo } from 'react';
import useSalesStore from '../store/salesStore';

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

const makeUserSummary = (entries) => {
  const summary = {};
  const now = Date.now();
  const cutoff = now - THIRTY_DAYS_MS;

  entries.forEach((entry) => {
    const user = entry.createdBy || 'Unknown';
    if (!summary[user]) {
      summary[user] = {
        entries: 0,
        calls: 0,
        visits: 0,
        lastActivity: 0,
      };
    }

    summary[user].entries += 1;
    summary[user].calls += entry.callCount || 0;
    summary[user].visits += entry.visitCount || 0;

    const createdAt = entry.createdAt ? new Date(entry.createdAt).getTime() : 0;
    const lastLoggedAt = entry.lastLoggedAt ? new Date(entry.lastLoggedAt).getTime() : 0;
    const mostRecent = Math.max(createdAt, lastLoggedAt);

    let mostRecentType = 'Created';
    if (lastLoggedAt && lastLoggedAt >= createdAt) {
      mostRecentType = entry.lastLogType ? (entry.lastLogType === 'VISIT' ? 'Visit' : 'Call') : 'Call/Visit';
    }

    if (mostRecent > summary[user].lastActivity) {
      summary[user].lastActivity = mostRecent;
      summary[user].lastActivityType = mostRecentType;
    }
  });

  return Object.entries(summary).map(([user, data]) => ({
    user,
    ...data,
    active: data.lastActivity >= cutoff,
    lastActivity: data.lastActivity ? new Date(data.lastActivity) : null,
    lastActivityType: data.lastActivityType || 'Created',
  }));
};

const formatDateTime = (date) => {
  if (!date) return '-';
  return date.toLocaleString();
};

const SalesReport = () => {
  const { entries, fetchEntries, loading } = useSalesStore();

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const totalStats = useMemo(() => {
    const totalEntries = entries.length;
    const totalCalls = entries.reduce((sum, e) => sum + (e.callCount || 0), 0);
    const totalVisits = entries.reduce((sum, e) => sum + (e.visitCount || 0), 0);
    return { totalEntries, totalCalls, totalVisits };
  }, [entries]);

  const userSummary = useMemo(() => makeUserSummary(entries), [entries]);
  const sortedUsers = useMemo(
    () => [...userSummary].sort((a, b) => b.entries - a.entries),
    [userSummary]
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sales Report</h1>
          <p className="text-gray-600 mt-1">
            Overview of sales executive activity (entries, calls, visits). Users are marked
            active if they have any activity in the last 30 days.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-2">Total Sales Entries</h2>
          <p className="text-3xl font-bold text-blue-700">{totalStats.totalEntries}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-2">Total Calls</h2>
          <p className="text-3xl font-bold text-purple-700">{totalStats.totalCalls}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-2">Total Visits</h2>
          <p className="text-3xl font-bold text-green-700">{totalStats.totalVisits}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Sales Executive Activity</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Loading report...</p>
          </div>
        ) : userSummary.length === 0 ? (
          <p className="text-gray-500">No data to display.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Entries</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Calls</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Visits</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Last Activity</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Activity Type</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedUsers.map((user) => (
                  <tr key={user.user} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{user.user}</td>
                    <td className="px-4 py-3">{user.entries}</td>
                    <td className="px-4 py-3">{user.calls}</td>
                    <td className="px-4 py-3">{user.visits}</td>
                    <td className="px-4 py-3">{formatDateTime(user.lastActivity)}</td>
                    <td className="px-4 py-3">{user.lastActivityType}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
