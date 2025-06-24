'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowUpTrayIcon, DocumentIcon } from '@heroicons/react/24/outline'
import PDFPreview from './PDFPreview'
import LoadingSkeleton from './LoadingSkeleton'

export default function UploadZone() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    setFile(file)
    handleUpload(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    multiple: false
  })

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    
    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setUploadProgress(i)
      }
      
      // TODO: Implement actual file upload
      await new Promise(resolve => setTimeout(resolve, 500))
      // Redirect to matches page after successful upload
      window.location.href = '/matches'
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`
          relative rounded-xl border-2 border-dashed p-12 text-center
          transition-all duration-300 ease-in-out
          ${isDragActive 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-700 hover:border-gray-600'
          }
          ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          animate-slide-in
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {file ? (
            <>
              <DocumentIcon className="mx-auto h-12 w-12 text-blue-500" />
              <div className="text-sm text-gray-400">
                {uploading ? `Uploading... ${uploadProgress}%` : file.name}
              </div>
              {uploading && (
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="text-gray-300">
                {isDragActive ? (
                  <p>Drop your resume here...</p>
                ) : (
                  <p>
                    <span className="text-blue-500">Click to upload</span> or drag and drop your resume
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {file && file.type === 'application/pdf' && (
        <div className="flex justify-center animate-fade-in">
          <PDFPreview file={file} className="w-[300px]" />
        </div>
      )}
    </div>
  )
} 