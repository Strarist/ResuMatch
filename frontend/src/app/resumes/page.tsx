'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Squares2X2Icon, ListBulletIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useAuth } from "@/auth/AuthContext"
import { useRouter } from "next/navigation"

const mockResumes = [
  { id: 1, name: 'Resume_June2024.pdf', uploaded: '2024-06-20' },
  { id: 2, name: 'Resume_DevRole.pdf', uploaded: '2024-06-10' },
  { id: 3, name: 'Resume_Designer.pdf', uploaded: '2024-05-30' },
]

export default function ResumesPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [view, setView] = useState<'grid' | 'list'>('list')
  const resumes = mockResumes // Replace with real data later

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, loading, router])

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-12 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">My Resumes</h1>
        <div className="flex gap-2 items-center">
          <button
            className={`p-2 rounded-lg ${view === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'} hover:bg-blue-600 transition-colors`}
            onClick={() => setView('list')}
            aria-label="List view"
          >
            <ListBulletIcon className="h-5 w-5" />
          </button>
          <button
            className={`p-2 rounded-lg ${view === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'} hover:bg-blue-600 transition-colors`}
            onClick={() => setView('grid')}
            aria-label="Grid view"
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <Link href="/upload" className="ml-4 px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg transition-all hover-lift">Upload New</Link>
        </div>
      </div>

      {resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
          <DocumentTextIcon className="h-16 w-16 text-gray-700 animate-bounce-in mb-4" />
          <div className="text-gray-400 text-lg mb-2">No resumes uploaded yet.</div>
          <Link href="/upload" className="px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg transition-all hover-lift">Upload your first resume</Link>
        </div>
      ) : view === 'list' ? (
        <div className="grid gap-4">
          {resumes.map((resume, i) => (
            <div
              key={resume.id}
              className="flex items-center justify-between rounded-lg bg-gray-900/60 p-4 border border-gray-800 shadow hover-lift hover:shadow-xl transition-all animate-slide-in-left"
              style={{ animationDelay: `${0.1 * i}s` }}
            >
              <div className="flex items-center gap-4">
                <DocumentTextIcon className="h-8 w-8 text-blue-400" />
                <div>
                  <div className="text-white font-medium">{resume.name}</div>
                  <div className="text-xs text-gray-400">Uploaded: {resume.uploaded}</div>
                </div>
              </div>
              <button className="px-4 py-1 rounded bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold transition-all hover-scale active:scale-95">View</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {resumes.map((resume, i) => (
            <div
              key={resume.id}
              className="rounded-xl bg-gray-900/60 p-6 border border-gray-800 shadow-lg flex flex-col items-center gap-4 hover-lift hover:shadow-2xl transition-all animate-scale-in"
              style={{ animationDelay: `${0.1 * i}s` }}
            >
              <DocumentTextIcon className="h-10 w-10 text-blue-400 mb-2" />
              <div className="text-white font-medium text-center">{resume.name}</div>
              <div className="text-xs text-gray-400 mb-2">Uploaded: {resume.uploaded}</div>
              <button className="px-4 py-1 rounded bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold transition-all hover-scale active:scale-95">View</button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
} 