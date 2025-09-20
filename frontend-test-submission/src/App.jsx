import React, { useState, useEffect } from 'react';
import './App.css';

// --- Reusable Logging Function ---
// Moved directly into this file to resolve import issues.
const Log = async (stack, level, packageName, message) => {
  const API_ENDPOINT = 'http://20.244.56.144/evaluation-service/logs';
  const ALLOWED_STACKS = new Set(['backend', 'frontend']);
  const ALLOWED_LEVELS = new Set(['debug', 'info', 'warn', 'error', 'fatal']);
  const upperCaseLevel = level ? level.toUpperCase() : 'INFO';

  // Console logging for immediate feedback
  switch (upperCaseLevel) {
    case 'ERROR':
    case 'FATAL':
      console.error(`[${packageName}]`, message, { stack });
      break;
    case 'WARN':
      console.warn(`[${packageName}]`, message);
      break;
    case 'SUCCESS':
      console.log(`%c[${packageName}] ${message}`, 'color: green; font-weight: bold;');
      break;
    default:
      console.log(`[${packageName}]`, message);
  }

  // Prepare and validate data for the API
  const apiStack = stack ? String(stack).toLowerCase() : 'frontend';
  let apiLevel = String(upperCaseLevel).toLowerCase();
  if (apiLevel === 'success') {
    apiLevel = 'info'; // Map SUCCESS to 'info' for the API
  }

  if (!ALLOWED_STACKS.has(apiStack) || !ALLOWED_LEVELS.has(apiLevel) || !packageName || !message) {
    if (!ALLOWED_STACKS.has(apiStack)) console.error(`[Logging] Invalid stack: "${apiStack}"`);
    if (!ALLOWED_LEVELS.has(apiLevel)) console.error(`[Logging] Invalid level: "${apiLevel}"`);
    if (!packageName) console.error(`[Logging] Package name is required.`);
    if (!message) console.error(`[Logging] Message is required.`);
    return;
  }

  const logData = { stack: apiStack, level: apiLevel, package: packageName, message };

  // Send log to the remote server
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });
    if (!response.ok) {
      console.error(`[Logging] API Error: ${response.status}. Failed to send log.`);
    }
  } catch (error) {
    console.error('[Logging] Network error occurred while sending the log.', error);
  }
};


// --- Helper Components ---
const InputField = ({ id, value, onChange, placeholder, type = "text" }) => (
  <input
    id={id}
    name={id}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
  />
);

const UrlEntry = ({ index, url, updateUrl, removeUrl }) => (
  <div className="p-4 bg-white rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center animate-fade-in">
    <div className="md:col-span-6">
      <label htmlFor={`longUrl-${index}`} className="font-semibold text-slate-700 text-sm mb-1 block">Original URL*</label>
      <InputField id={`longUrl-${index}`} value={url.longUrl} onChange={(e) => updateUrl(index, 'longUrl', e.target.value)} placeholder="https://example.com/my-super-long-link" />
    </div>
    <div className="md:col-span-2">
      <label htmlFor={`validity-${index}`} className="font-semibold text-slate-700 text-sm mb-1 block">Validity (Mins)</label>
      <InputField id={`validity-${index}`} value={url.validity} onChange={(e) => updateUrl(index, 'validity', e.target.value)} placeholder="60" type="number" />
    </div>
    <div className="md:col-span-3">
       <label htmlFor={`shortcode-${index}`} className="font-semibold text-slate-700 text-sm mb-1 block">Preferred Code</label>
      <InputField id={`shortcode-${index}`} value={url.shortcode} onChange={(e) => updateUrl(index, 'shortcode', e.target.value)} placeholder="mylink" />
    </div>
    <div className="md:col-span-1 flex items-end justify-center">
      <button onClick={() => removeUrl(index)} className="w-10 h-10 mt-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition">
        &times;
      </button>
    </div>
  </div>
);

const ResultDisplay = ({ result }) => (
    <div className="bg-green-50 border border-green-200 p-4 rounded-lg mt-4 animate-fade-in">
        <p className="text-slate-600 text-sm break-all">Original: <span className="font-mono">{result.original}</span></p>
        <p className="font-semibold text-green-800 mt-2">Short URL: <a href={result.short} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">{result.short}</a></p>
        <p className="text-slate-500 text-xs mt-1">Expires: {result.expiry}</p>
    </div>
);


// --- Main App Component ---
function App() {
  const [urls, setUrls] = useState([{ id: 1, longUrl: '', validity: '', shortcode: '' }]);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Using 'frontend' as the stack for all client-side logs.
    Log('frontend', 'INFO', 'App.jsx', 'URL Shortener component has mounted.');
  }, []);

  const addUrl = () => {
    if (urls.length < 5) {
      const newId = (urls[urls.length - 1]?.id || 0) + 1;
      setUrls([...urls, { id: newId, longUrl: '', validity: '', shortcode: '' }]);
      Log('frontend', 'DEBUG', 'App.jsx', `Added a new URL input field. Total fields: ${urls.length + 1}`);
    } else {
      Log('frontend', 'WARN', 'App.jsx', 'User tried to add more than 5 URL fields.');
      // Replaced alert with a more modern approach (e.g., a toast notification would be ideal).
      // For this example, we'll set a temporary error message.
      setErrors(["You can only shorten up to 5 URLs at a time."]);
      setTimeout(() => setErrors(null), 3000); // Clear error after 3 seconds
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
      Log('frontend', 'DEBUG', 'App.jsx', `Removed URL field at index ${index}.`);
    }
  };

  const validateAndShorten = () => {
    setErrors(null);
    setResults([]);
    let validationPassed = true;
    let localErrors = [];

    urls.forEach((url, index) => {
      // Ensure there's a URL to validate
      if (!url.longUrl) {
          validationPassed = false;
          localErrors.push(`Row ${index + 1}: Original URL cannot be empty.`);
          Log('frontend', 'WARN', 'Validation', `Empty URL for input #${index + 1}.`);
          return; // Skip further checks for this entry
      }

      try {
        new URL(url.longUrl);
      } catch (_) {
        validationPassed = false;
        localErrors.push(`Row ${index + 1}: Invalid URL format.`);
        Log('frontend', 'WARN', 'Validation', `Invalid URL format for input #${index + 1}: ${url.longUrl}`);
      }

      if (url.validity && (!Number.isInteger(Number(url.validity)) || Number(url.validity) <= 0)) {
        validationPassed = false;
        localErrors.push(`Row ${index + 1}: Validity must be a positive whole number.`);
        Log('frontend', 'WARN', 'Validation', `Invalid data type for validity on input #${index + 1}. Expected positive integer, got: "${url.validity}"`);
      }
    });

    if (!validationPassed) {
      setErrors(localErrors);
      Log('frontend', 'ERROR', 'App.jsx', 'Client-side validation failed for one or more URLs.');
      return;
    }

    Log('frontend', 'INFO', 'App.jsx', 'All URLs passed validation. Simulating API call.');
    setIsLoading(true);
    
    // Mock API Call
    const mockApiCall = new Promise(resolve => {
        setTimeout(() => {
            const mockResults = urls.map((url, i) => ({
                original: url.longUrl,
                short: `https://sh.rt/${url.shortcode || `xyz${123 + i}`}`,
                expiry: new Date(Date.now() + (Number(url.validity || 60) * 60000)).toLocaleString()
            }));
            resolve(mockResults);
        }, 1000);
    });

    mockApiCall.then(data => {
        setResults(data);
        setIsLoading(false);
        // Using 'SUCCESS' level for console, which maps to 'info' for the API
        Log('frontend', 'SUCCESS', 'App.jsx', `Successfully received ${data.length} shortened URLs from mock API.`);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800">SwiftLink</h1>
          <p className="text-slate-500 mt-2">Shorten up to 5 URLs at once.</p>
        </header>

        <main className="space-y-4">
          {urls.map((url, index) => (
            <UrlEntry key={url.id} index={index} url={url} updateUrl={updateUrl} removeUrl={removeUrl} />
          ))}

          <div className="flex justify-between items-center pt-2">
            <button onClick={addUrl} disabled={urls.length >= 5} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition">
              + Add URL
            </button>
            <button onClick={validateAndShorten} disabled={isLoading} className="px-6 py-3 font-semibold bg-sky-600 text-white rounded-md hover:bg-sky-700 transition shadow-sm disabled:bg-sky-400">
              {isLoading ? 'Shortening...' : 'Shorten Links'}
            </button>
          </div>
          
          {errors && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mt-4 animate-fade-in">
                <p className="font-semibold mb-2">Please fix the following issues:</p>
                <ul className="list-disc list-inside space-y-1">
                    {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-slate-800 text-center mb-4">Your Shortened Links</h2>
                <div className="space-y-3">
                  {results.map((res, i) => <ResultDisplay key={i} result={res} />)}
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

