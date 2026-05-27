import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gray-400">404</h1>
        <p className="text-gray-500">Page not found</p>
        <Link href="/" className="inline-block px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  );
}
