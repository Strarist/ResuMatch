'use client'

import Link from 'next/link'
import { ArrowUpTrayIcon } from '@heroicons/react/24/solid'

export default function FabUpload() {
  return (
    <Link
      href="/upload"
      className="fixed bottom-8 right-8 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-xl p-4 flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-blue-400 animate-bounce-in"
      aria-label="Upload Resume"
      tabIndex={0}
    >
      <ArrowUpTrayIcon className="h-7 w-7" />
    </Link>
  )
} 