'use client'

import React, { useState, useCallback, useId } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { resumes, ApiError } from '@/lib/intelligence-client'

interface UploadZoneProps {
  onUploadComplete?: (resumeId: string) => void
  variant?: 'standalone' | 'embedded'
}

export default function UploadZone({ onUploadComplete, variant = 'standalone' }: UploadZoneProps) {
  const inputId = useId().replace(/:/g, '')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [statusText, setStatusText] = useState('Uploading…')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isEmbedded = variant === 'embedded'

  const handleUpload = useCallback(async (file: File) => {
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      toast.error('Please upload a PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)
    setUploadComplete(false)
    setStatusText('Uploading…')
    setError(null)
    setUploadedFile(file)

    try {
      const data = await resumes.upload(file) as { resume_id?: string; message?: string }
      setUploadComplete(true)
      setStatusText('Uploaded — parsing in background')
      toast.success('Resume uploaded — parsing started in the background')

      if (onUploadComplete && data.resume_id) {
        onUploadComplete(data.resume_id)
      }
    } catch (err) {
      const msg = err instanceof ApiError
        ? (typeof err.message === 'string' ? err.message : 'Upload failed')
        : err instanceof Error
          ? err.message
          : 'Failed to upload resume. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }, [onUploadComplete])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleUpload(files[0]!)
    }
  }, [handleUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleUpload(files[0]!)
    }
  }, [handleUpload])

  const resetUpload = useCallback(() => {
    setUploadedFile(null)
    setUploadComplete(false)
    setStatusText('Uploading…')
    setError(null)
  }, [])

  const dropZone = !uploadedFile ? (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        isDragging
          ? 'border-emerald-500 bg-emerald-500/5'
          : 'border-white/10 hover:border-white/20'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById(inputId)?.click()}
    >
      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2 text-white/90">
        Drop your resume here
      </h3>
      <p className="text-slate-400 mb-4 text-sm">
        or click to browse files
      </p>
      <Button
        type="button"
        disabled={uploading}
        className="flex items-center gap-2 mx-auto bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
      >
        <FileText className="w-4 h-4" />
        Choose File
      </Button>
      <input
        id={inputId}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      <p className="text-xs text-slate-500 mt-4">
        Supports PDF files up to 10MB
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.04] rounded-lg text-white">
        <FileText className="w-8 h-8 text-emerald-400" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white/90 truncate">{uploadedFile.name}</p>
          <p className="text-xs text-slate-400">
            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        {uploading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-300 font-mono font-bold">{statusText}</span>
          </div>
        ) : uploadComplete ? (
          <CheckCircle className="w-6 h-6 text-emerald-400" />
        ) : (
          <X className="w-6 h-6 text-rose-500" />
        )}
      </div>

      {!uploading && uploadComplete && (
        <p className="text-xs text-slate-400 text-center font-semibold font-mono">
          {statusText}
        </p>
      )}

      {error && (
        <Alert variant="destructive" className="bg-rose-950/20 border-rose-500/30 text-rose-200">
          <AlertCircle className="h-4 w-4 text-rose-400" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          onClick={resetUpload}
          variant="outline"
          className="flex-1 border-white/10 hover:bg-white/[0.03] text-white"
        >
          Upload Another
        </Button>
        {uploadComplete && (
          <Button
            onClick={() => onUploadComplete && onUploadComplete('')}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  )

  if (isEmbedded) {
    return <div className="w-full space-y-4">{dropZone}</div>
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-white/[0.08] bg-slate-900/60 backdrop-blur-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Upload className="w-5 h-5 text-emerald-400" />
          Upload Resume
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dropZone}
      </CardContent>
    </Card>
  )
}
