import UploadZone from '@/components/UploadZone'

export default function UploadPage() {
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
        
        <UploadZone />
        
        <div className="text-center text-sm text-gray-400">
          Supported formats: PDF, DOCX, DOC
        </div>
      </div>
    </main>
  )
} 