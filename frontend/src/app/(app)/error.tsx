'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App route error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-md px-4">
        <h2 className="text-xl font-bold text-red-400">Page Error</h2>
        <p className="text-gray-400">{error.message || 'Failed to load this page'}</p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
