'use client';

import Link from 'next/link';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4 max-w-md px-4">
        <h2 className="text-xl font-bold text-red-400">Authentication Error</h2>
        <p className="text-gray-400">{error.message || 'Something went wrong'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors">
            Retry
          </button>
          <Link href="/" className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
