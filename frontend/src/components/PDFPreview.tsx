'use client'

import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import LoadingSkeleton from './LoadingSkeleton'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFPreviewProps {
  file: File
  className?: string
}

export default function PDFPreview({ file, className = '' }: PDFPreviewProps) {
  const [url, setUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (file) {
      const fileUrl = URL.createObjectURL(file)
      setUrl(fileUrl)
      return () => URL.revokeObjectURL(fileUrl)
    }
  }, [file])

  if (!url) return null

  return (
    <div className={`relative ${className}`}>
      {loading && <LoadingSkeleton className="absolute inset-0" />}
      
      <Document
        file={url}
        loading={null}
        error={() => setError('Error loading PDF')}
        onLoadSuccess={() => setLoading(false)}
        className="relative"
      >
        <Page
          pageNumber={1}
          width={300}
          loading={null}
          error={() => setError('Error loading page')}
          className="rounded-lg overflow-hidden shadow-xl"
        />
      </Document>

      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  )
} 