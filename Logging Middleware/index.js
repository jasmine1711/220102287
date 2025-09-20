const API_ENDPOINT = 'http://20.244.56.144/evaluation-service/logs';

// As per constraints, these are the only accepted lowercase values for the API.
const ALLOWED_STACKS = new Set(['backend', 'frontend']);
const ALLOWED_LEVELS = new Set(['debug', 'info', 'warn', 'error', 'fatal']);

/**
 * A reusable logging function that sends log data to a test server.
 *
 * @param {string | null} stack - The execution stack, 'frontend' or 'backend'. Defaults to 'frontend'.
 * @param {'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'SUCCESS'} level - The severity level of the log.
 * @param {string} packageName - The name of the package or module where the log originates.
 * @param {string} message - The descriptive log message.
 */
export async function Log(stack, level, packageName, message) {
  const upperCaseLevel = level ? level.toUpperCase() : 'INFO';

  // --- Console Logging ---
  // This provides immediate feedback in the browser's developer tools.
  switch (upperCaseLevel) {
    case 'ERROR':
    case 'FATAL':
      console.error(`[${packageName}]`, message, { stack });
      break;
    case 'WARN':
      console.warn(`[${packageName}]`, message);
      break;
    case 'SUCCESS':
      // The SUCCESS level is for console display only; it will be logged as 'info' to the server.
      console.log(`%c[${packageName}] ${message}`, 'color: green; font-weight: bold;');
      break;
    default: // Catches INFO, DEBUG, etc.
      console.log(`[${packageName}]`, message);
  }

  // --- API Payload Preparation ---
  // Convert inputs to the format required by the logging API.
  const apiStack = stack ? String(stack).toLowerCase() : 'frontend';
  
  // Map the function's level parameter to the API's allowed lowercase values.
  let apiLevel = String(upperCaseLevel).toLowerCase();
  if (apiLevel === 'success') {
    apiLevel = 'info'; // Map SUCCESS to 'info' for the API.
  }
  
  // --- Input Validation for API ---
  if (!ALLOWED_STACKS.has(apiStack)) {
    console.error(`[Logging Middleware] Invalid stack for API: "${apiStack}".`);
    return;
  }
  if (!ALLOWED_LEVELS.has(apiLevel)) {
    console.error(`[Logging Middleware] Invalid level for API: "${apiLevel}".`);
    return;
  }
  if (!packageName || String(packageName).trim() === '') {
      console.error(`[Logging Middleware] Package name cannot be empty for API log.`);
      return;
  }
  if (!message || String(message).trim() === '') {
      console.error(`[Logging Middleware] Log message cannot be empty for API log.`);
      return;
  }

  // Construct the payload with the 'package' key as expected by the server.
  const logData = {
    stack: apiStack,
    level: apiLevel,
    package: packageName,
    message: message,
  };

  // --- API Call ---
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: The API is protected. An Authorization header might be needed here.
        // 'Authorization': 'Bearer YOUR_AUTH_TOKEN'
      },
      body: JSON.stringify(logData),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Logging Middleware] API Error: ${response.status}. Failed to send log.`, { details: errorBody });
    }
  } catch (error) {
    console.error('[Logging Middleware] A network error occurred while sending the log.', error);
  }
}
