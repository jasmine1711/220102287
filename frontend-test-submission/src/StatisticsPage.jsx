import React, { useState, useEffect } from 'react';
import { Log } from 'custom-logging-middleware';

// --- Mock Data ---
// In a real application, this would come from an API call.
const MOCK_STATS_DATA = [
  {
    id: 'xyz123',
    shortUrl: 'https://sh.rt/xyz123',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    expiresAt: new Date(Date.now() + 86400000 * 28).toISOString(), // 28 days from now
    clicks: [
      { timestamp: new Date(Date.now() - 3600000).toISOString(), source: 'direct', location: 'New York, USA' },
      { timestamp: new Date(Date.now() - 7200000).toISOString(), source: 'google.com', location: 'London, UK' },
      { timestamp: new Date(Date.now() - 9000000).toISOString(), source: 'twitter.com', location: 'Tokyo, JP' },
    ]
  },
  {
    id: 'mylink',
    shortUrl: 'https://sh.rt/mylink',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
    clicks: [
      { timestamp: new Date(Date.now() - 60000).toISOString(), source: 'facebook.com', location: 'Paris, FR' },
    ]
  },
  {
    id: 'abc987',
    shortUrl: 'https://sh.rt/abc987',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
    expiresAt: null, // No expiry
    clicks: []
  }
];

// --- Helper Component for a Single Stat Row ---
const StatRow = ({ stat }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div
        className="grid grid-cols-12 gap-4 p-4 items-center cursor-pointer hover:bg-slate-50 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="col-span-12 md:col-span-5 font-semibold text-sky-600 break-all">
          <a href={stat.shortUrl} target="_blank" rel="noopener noreferrer">{stat.shortUrl}</a>
        </div>
        <div className="col-span-6 md:col-span-3 text-slate-600 text-sm">
          {new Date(stat.createdAt).toLocaleString()}
        </div>
        <div className="col-span-6 md:col-span-2 text-slate-600 text-sm">
          {stat.expiresAt ? new Date(stat.expiresAt).toLocaleString() : 'Never'}
        </div>
        <div className="col-span-12 md:col-span-2 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-lg">{stat.clicks.length} Clicks</span>
          {stat.clicks.length > 0 && (
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
          )}
        </div>
      </div>

      {isExpanded && stat.clicks.length > 0 && (
        <div className="bg-slate-50 border-t border-slate-200 p-4">
          <h4 className="font-semibold text-slate-700 mb-2">Click Details:</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-200 text-slate-600">
                <tr>
                  <th className="p-2">Timestamp</th>
                  <th className="p-2">Source</th>
                  <th className="p-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {stat.clicks.map((click, index) => (
                  <tr key={index} className="border-b border-slate-200 last:border-b-0">
                    <td className="p-2 font-mono">{new Date(click.timestamp).toLocaleString()}</td>
                    <td className="p-2">{click.source}</td>
                    <td className="p-2">{click.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Main Statistics Page Component ---
export function StatisticsPage() {
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Log(null, 'INFO', 'StatisticsPage.jsx', 'Statistics component has mounted. Fetching data.');
    
    // Simulate fetching data from an API
    const timer = setTimeout(() => {
      setStats(MOCK_STATS_DATA);
      setIsLoading(false);
      Log(null, 'SUCCESS', 'StatisticsPage.jsx', `Successfully fetched ${MOCK_STATS_DATA.length} stat entries.`);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-800">URL Statistics</h1>
        <p className="text-slate-500 mt-2">An overview of all your shortened links.</p>
      </header>

      <main>
        {isLoading ? (
          <p className="text-center text-slate-500">Loading statistics...</p>
        ) : (
          <div className="space-y-4">
             <div className="hidden md:grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-slate-500">
                <div className="col-span-5">Short URL</div>
                <div className="col-span-3">Created At</div>
                <div className="col-span-2">Expires At</div>
                <div className="col-span-2">Total Clicks</div>
            </div>
            {stats.map(stat => <StatRow key={stat.id} stat={stat} />)}
          </div>
        )}
      </main>
    </div>
  );
}

