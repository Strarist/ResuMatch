'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <div className="text-center space-y-4 max-w-md px-4">
          <h1 className="text-2xl font-bold text-red-400">Something went wrong</h1>
          <p className="text-gray-400">{error.message || 'An unexpected error occurred'}</p>
          {error.digest && <p className="text-xs text-gray-600">Error ID: {error.digest}</p>}
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
