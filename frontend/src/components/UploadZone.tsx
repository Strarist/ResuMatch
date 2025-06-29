'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowUpTrayIcon, DocumentIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import PDFPreview from './PDFPreview'
import LoadingSkeleton from './LoadingSkeleton'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function UploadZone() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle')
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0])
    handleUpload(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false,
    maxSize: 5 * 1024 * 1024 // 5MB
  })

  const handleUpload = async (file: File) => {
    if (!file) return;
    
    setUploading(true)
    setUploadStatus('uploading')
    setUploadProgress(0)
    
    try {
      // Create FormData
      const formData = new FormData()
      formData.append('file', file)
      
      // Upload file
      const response = await fetch('/api/v1/resumes', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Upload failed')
      }
      
      setUploadProgress(50)
      setUploadStatus('processing')
      
      const result = await response.json()
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setUploadProgress(100)
      setUploadStatus('success')
      
      toast.success('Resume uploaded successfully!')
      
      // Redirect to analysis page after a short delay
      setTimeout(() => {
        router.push('/analysis')
      }, 1500)
      
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadStatus('error')
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
      case 'error':
        return <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
      case 'uploading':
      case 'processing':
        return <LoadingSkeleton />
      default:
        return <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'success':
        return 'Upload successful! Redirecting to analysis...'
      case 'error':
        return 'Upload failed. Please try again.'
      case 'uploading':
        return 'Uploading resume...'
      case 'processing':
        return 'Processing resume with AI...'
      default:
        return isDragActive ? 'Drop your resume here...' : 'Click to upload or drag and drop your resume'
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
            : uploadStatus === 'success'
            ? 'border-green-500 bg-green-500/10'
            : uploadStatus === 'error'
            ? 'border-red-500 bg-red-500/10'
            : 'border-gray-700 hover:border-gray-600'
          }
          ${uploading ? 'pointer-events-none' : 'cursor-pointer'}
          animate-slide-in
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {getStatusIcon()}
          
          <div className="text-gray-300">
            <p>{getStatusText()}</p>
          </div>

          {file && (
            <div className="text-sm text-gray-400">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          {/* Progress bar */}
          {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {file && file.type === 'application/pdf' && uploadStatus === 'idle' && (
        <div className="flex justify-center animate-fade-in">
          <PDFPreview file={file} className="w-[300px]" />
        </div>
      )}

      {/* Upload guidelines */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-blue-200 text-sm">
        <strong>Upload Guidelines:</strong>
        <ul className="mt-2 space-y-1">
          <li>• PDF format only (max 5MB)</li>
          <li>• No personal information (SSN, address)</li>
          <li>• All files are deeply sanitized for security</li>
          <li>• AI will extract skills, education, and experience</li>
        </ul>
      </div>
    </div>
  )
} 