import React, { useState, useEffect } from 'react';

// --- Reusable Logging Function ---
const Log = async (stack, level, packageName, message) => {
  const API_ENDPOINT = 'http://20.244.56.144/evaluation-service/logs';
  const ALLOWED_STACKS = new Set(['backend', 'frontend']);
  const ALLOWED_LEVELS = new Set(['debug', 'info', 'warn', 'error', 'fatal']);
  const upperCaseLevel = level ? level.toUpperCase() : 'INFO';

  // Console logging for immediate feedback in the browser
  switch (upperCaseLevel) {
    case 'ERROR': case 'FATAL': console.error(`[${packageName}]`, message, { stack }); break;
    case 'WARN': console.warn(`[${packageName}]`, message); break;
    case 'SUCCESS': console.log(`%c[${packageName}] ${message}`, 'color: green; font-weight: bold;'); break;
    default: console.log(`[${packageName}]`, message);
  }

  // Prepare and validate data for the API
  const apiStack = stack ? String(stack).toLowerCase() : 'frontend';
  let apiLevel = String(upperCaseLevel).toLowerCase();
  if (apiLevel === 'success') apiLevel = 'info'; 

  if (!ALLOWED_STACKS.has(apiStack) || !ALLOWED_LEVELS.has(apiLevel) || !packageName || !message) {
    if (!ALLOWED_STACKS.has(apiStack)) console.error(`[Logging] Invalid stack: "${apiStack}"`);
    if (!ALLOWED_LEVELS.has(apiLevel)) console.error(`[Logging] Invalid level: "${apiLevel}"`);
    return;
  }

  const logData = { stack: apiStack, level: apiLevel, package: packageName, message };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });
    if (!response.ok) console.error(`[Logging] API Error: ${response.status}.`);
  } catch (error) {
    console.error('[Logging] Network error.', error);
  }
};


// --- Shortener Page Component ---
const ShortenerPage = () => {
  const [urls, setUrls] = useState([{ id: 1, longUrl: '', validity: '', shortcode: '' }]);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Log('frontend', 'INFO', 'ShortenerPage.jsx', 'Component mounted.');
  }, []);

  const addUrl = () => {
    if (urls.length < 5) {
      const newId = (urls[urls.length - 1]?.id || 0) + 1;
      setUrls([...urls, { id: newId, longUrl: '', validity: '', shortcode: '' }]);
      Log('frontend', 'DEBUG', 'ShortenerPage.jsx', `Added new URL field. Total: ${urls.length + 1}`);
    } else {
      Log('frontend', 'WARN', 'ShortenerPage.jsx', 'Attempted to add more than 5 URLs.');
      setErrors(["You can only shorten up to 5 URLs at a time."]);
      setTimeout(() => setErrors(null), 3000);
    }
  };

  const updateUrl = (index, field, value) => {
    const newUrls = [...urls];
    newUrls[index][field] = value;
    setUrls(newUrls);
  };

  const removeUrl = (index) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
      Log('frontend', 'DEBUG', 'ShortenerPage.jsx', `Removed URL field at index ${index}.`);
    }
  };

  const validateAndShorten = () => {
    setErrors(null);
    let validationPassed = true;
    const localErrors = [];

    urls.forEach((url, index) => {
      if (!url.longUrl) {
        validationPassed = false;
        localErrors.push(`Row ${index + 1}: Original URL is required.`);
        return;
      }
      try { new URL(url.longUrl); }
      catch (_) {
        validationPassed = false;
        localErrors.push(`Row ${index + 1}: Invalid URL format.`);
        Log('frontend', 'WARN', 'Validation', `Invalid URL: ${url.longUrl}`);
      }
      if (url.validity && (!Number.isInteger(Number(url.validity)) || Number(url.validity) <= 0)) {
        validationPassed = false;
        localErrors.push(`Row ${index + 1}: Validity must be a positive number.`);
        Log('frontend', 'WARN', 'Validation', `Invalid validity: ${url.validity}`);
      }
    });

    if (!validationPassed) {
      setErrors(localErrors);
      Log('frontend', 'ERROR', 'ShortenerPage.jsx', 'Client-side validation failed.');
      return;
    }

    Log('frontend', 'INFO', 'ShortenerPage.jsx', 'Validation passed. Mocking API call.');
    setIsLoading(true);

    const mockApiCall = new Promise(resolve => {
      setTimeout(() => {
        const mockResults = urls.map((url, i) => ({
          original: url.longUrl,
          short: `https://sh.rt/${url.shortcode || `xyz${123 + i}`}`,
          expiry: new Date(Date.now() + (Number(url.validity || 60) * 60000)).toLocaleString(),
        }));
        resolve(mockResults);
      }, 1000);
    });

    mockApiCall.then(data => {
      setResults(data);
      setIsLoading(false);
      Log('frontend', 'SUCCESS', 'ShortenerPage.jsx', `Received ${data.length} shortened URLs.`);
    });
  };
    
  // --- JSX for Shortener Page ---
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
        <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800">SwiftLink</h1>
            <p className="text-slate-500 mt-2">Shorten up to 5 URLs at once.</p>
        </header>

        <main className="space-y-4">
            {urls.map((url, index) => (
                <UrlEntry key={url.id} index={index} url={url} updateUrl={updateUrl} removeUrl={removeUrl} />
            ))}
            <div className="flex justify-between items-center pt-2">
                <button onClick={addUrl} disabled={urls.length >= 5} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 disabled:opacity-50 transition">
                    + Add URL
                </button>
                <button onClick={validateAndShorten} disabled={isLoading} className="px-6 py-3 font-semibold bg-sky-600 text-white rounded-md hover:bg-sky-700 shadow-sm disabled:bg-sky-400 transition">
                    {isLoading ? 'Shortening...' : 'Shorten Links'}
                </button>
            </div>
            {errors && <ErrorDisplay errors={errors} />}
            {results.length > 0 && <ResultsDisplay results={results} />}
        </main>
    </div>
  );
};

// --- Statistics Page Component ---
const StatisticsPage = () => {
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Log('frontend', 'INFO', 'StatisticsPage.jsx', 'Component mounted.');
    // Mock fetching data from a backend
    const mockFetchStats = new Promise(resolve => {
        setTimeout(() => {
            resolve([
                { 
                    shortUrl: "https://sh.rt/abc", 
                    createdAt: "2025-09-20T12:00:00Z", 
                    expiresAt: "2025-09-21T12:00:00Z", 
                    clicks: 102,
                    clickData: [
                        { timestamp: "2025-09-20T12:05:14Z", source: "direct", location: "New York, USA" },
                        { timestamp: "2025-09-20T12:15:22Z", source: "qr-code", location: "London, UK" }
                    ]
                },
                { 
                    shortUrl: "https://sh.rt/xyz123", 
                    createdAt: "2025-09-19T10:30:00Z", 
                    expiresAt: "2025-09-20T10:30:00Z", 
                    clicks: 58,
                    clickData: [
                        { timestamp: "2025-09-19T11:00:31Z", source: "social", location: "Tokyo, Japan" }
                    ]
                }
            ]);
        }, 800);
    });

    mockFetchStats.then(data => {
        setStats(data);
        setIsLoading(false);
        Log('frontend', 'SUCCESS', 'StatisticsPage.jsx', `Fetched ${data.length} stat entries.`);
    });
  }, []);

  // --- JSX for Statistics Page ---
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
        <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800">URL Statistics</h1>
            <p className="text-slate-500 mt-2">An overview of your shortened links.</p>
        </header>
        {isLoading ? (
            <p className="text-center text-slate-500">Loading statistics...</p>
        ) : (
            <div className="space-y-6">
                {stats.map(stat => <StatCard key={stat.shortUrl} stat={stat} />)}
            </div>
        )}
    </div>
  );
};

// --- Helper Components for Both Pages ---
const UrlEntry = ({ index, url, updateUrl, removeUrl }) => (
    <div className="p-4 bg-white rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-6">
            <label htmlFor={`longUrl-${index}`} className="font-semibold text-slate-700 text-sm mb-1 block">Original URL*</label>
            <input id={`longUrl-${index}`} value={url.longUrl} onChange={(e) => updateUrl(index, 'longUrl', e.target.value)} placeholder="https://example.com/my-super-long-link" className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
        </div>
        <div className="md:col-span-2">
            <label htmlFor={`validity-${index}`} className="font-semibold text-slate-700 text-sm mb-1 block">Validity (Mins)</label>
            <input id={`validity-${index}`} value={url.validity} onChange={(e) => updateUrl(index, 'validity', e.target.value)} placeholder="60" type="number" className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
        </div>
        <div className="md:col-span-3">
            <label htmlFor={`shortcode-${index}`} className="font-semibold text-slate-700 text-sm mb-1 block">Preferred Code</label>
            <input id={`shortcode-${index}`} value={url.shortcode} onChange={(e) => updateUrl(index, 'shortcode', e.target.value)} placeholder="mylink" className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
        </div>
        <div className="md:col-span-1 flex items-end justify-center">
            <button onClick={() => removeUrl(index)} className="w-10 h-10 mt-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition">&times;</button>
        </div>
    </div>
);

const ResultsDisplay = ({ results }) => (
    <div className="mt-8">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-4">Your Shortened Links</h2>
        <div className="space-y-3">
            {results.map((res, i) => (
                <div key={i} className="bg-green-50 border border-green-200 p-4 rounded-lg animate-fade-in">
                    <p className="text-slate-600 text-sm break-all">Original: <span className="font-mono">{res.original}</span></p>
                    <p className="font-semibold text-green-800 mt-2">Short URL: <a href={res.short} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">{res.short}</a></p>
                    <p className="text-slate-500 text-xs mt-1">Expires: {res.expiry}</p>
                </div>
            ))}
        </div>
    </div>
);

const StatCard = ({ stat }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div>
                    <div className="text-sm text-slate-500">Short URL</div>
                    <a href={stat.shortUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-600 hover:underline">{stat.shortUrl}</a>
                </div>
                <div>
                    <div className="text-sm text-slate-500">Total Clicks</div>
                    <div className="font-semibold text-2xl text-slate-800">{stat.clicks}</div>
                </div>
                <div>
                    <div className="text-sm text-slate-500">Created / Expires</div>
                    <div className="font-semibold text-slate-800 text-sm">
                        {new Date(stat.createdAt).toLocaleString()} <br/> {new Date(stat.expiresAt).toLocaleString()}
                    </div>
                </div>
                <div className="text-right">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition">
                        {isExpanded ? 'Hide' : 'Show'} Details
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-2">Click Data</h4>
                    <ul className="space-y-2 text-sm">
                        {stat.clickData.map((click, i) => (
                            <li key={i} className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-md">
                                <div><span className="font-medium text-slate-600">Time:</span> {new Date(click.timestamp).toLocaleString()}</div>
                                <div><span className="font-medium text-slate-600">Source:</span> {click.source}</div>
                                <div><span className="font-medium text-slate-600">Location:</span> {click.location}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const ErrorDisplay = ({ errors }) => (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mt-4 animate-fade-in">
        <p className="font-semibold mb-2">Please fix the following issues:</p>
        <ul className="list-disc list-inside space-y-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
    </div>
);


// --- Main App Component with Navigation ---
function App() {
  const [activePage, setActivePage] = useState('shortener'); // 'shortener' or 'statistics'

  const navigateTo = (page) => {
    setActivePage(page);
    Log(null, 'INFO', 'App.jsx', `User navigated to the ${page} page.`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm">
        <div className="w-full max-w-5xl mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>
                <h1 className="text-2xl font-bold text-slate-800">SwiftLink</h1>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => navigateTo('shortener')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${activePage === 'shortener' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                URL Shortener
              </button>
              <button
                onClick={() => navigateTo('statistics')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${activePage === 'statistics' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Statistics
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="p-4 md:p-8">
        {activePage === 'shortener' && <ShortenerPage />}
        {activePage === 'statistics' && <StatisticsPage />}
      </main>
    </div>
  );
}

export default App;

