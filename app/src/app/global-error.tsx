'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0c] text-white font-sans antialiased min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">💥</div>
          <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            An unexpected error occurred in the application. This has been logged for review.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <pre className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg p-4 text-left overflow-auto max-h-40">
              {error.message}
            </pre>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:brightness-110 transition-all cursor-pointer"
          >
            🔄 Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
