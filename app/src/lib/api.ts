/**
 * Utility to resolve API URLs.
 * In a native/mobile application wrapper (e.g. Capacitor, where page origin is file://),
 * relative path fetches will fail. We route them to the live Vercel backend server.
 */
const VERCEL_API_HOST = 'https://trading-journal-7aak6mnss-soumyadip-aiml-alienxs-projects.vercel.app';

export function getApiUrl(path: string): string {
  // Check if we are running in a native webview/Capacitor environment
  const isCapacitor = 
    typeof window !== 'undefined' && 
    (window.location.origin.startsWith('file://') || 
     window.location.origin.startsWith('capacitor://') ||
     window.location.origin.includes('localhost') === false && window.location.origin.includes('127.0.0.1') === false && window.location.origin.startsWith('http://localhost') === false);

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (isCapacitor) {
    return `${VERCEL_API_HOST}${cleanPath}`;
  }

  // Fallback to relative URL for standard browser usage
  return cleanPath;
}
