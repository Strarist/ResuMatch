import UploadZone from '@/components/UploadZone'
import { useAuth } from '@/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UploadPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading || !isAuthenticated) {
    return null // or a spinner
  }

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            ResuMatch
          </h1>
          <p className="text-lg text-gray-300">
            Drop your resume and let AI find your perfect job match
          </p>
        </div>
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-blue-200 text-sm text-center mb-2">
          <strong>Upload Guidelines:</strong> PDF only, max 5MB. No personal info (SSN, address). All files are deeply sanitized for your security.
        </div>
        <UploadZone />
        <div className="text-center text-sm text-gray-400">
          Supported formats: PDF, DOCX, DOC
        </div>
      </div>
    </main>
  )
} 