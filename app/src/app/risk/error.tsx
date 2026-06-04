'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-bold text-white">Page Error</h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Something went wrong loading this page. You can try again or navigate back to the dashboard.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <pre className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg p-4 text-left overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="btn-primary text-xs px-5 py-2 cursor-pointer"
          >
            🔄 Try Again
          </button>
          <Link href="/" className="btn-secondary text-xs px-5 py-2">
            🏠 Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
