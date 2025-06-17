import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, LoadingBlur } from '../common';
import { useToast } from '../../hooks/useToast';
import { useResumeAnalysis } from '../../hooks/useResumeAnalysis';

interface ResumeUploadProps {
  onUploadComplete?: (resumeId: string) => void;
}

export const ResumeUpload = ({ onUploadComplete }: ResumeUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();
  const { status, progress, error } = useResumeAnalysis();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.pdf', '.docx', '.doc'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(ext)) {
      showToast('Invalid file type. Please upload PDF or DOCX.', 'error');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File too large. Maximum size is 5MB.', 'error');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/v1/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      showToast('Resume uploaded successfully', 'success');
      onUploadComplete?.(data.id);
    } catch (error) {
      showToast('Error uploading resume', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [showToast, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <GlassCard
        className={`p-8 transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50/10' : ''
        }`}
      >
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50/10'
                : 'border-gray-300 hover:border-blue-400'
            }`}
        >
          <input {...getInputProps()} />
          <LoadingBlur isLoading={isUploading}>
            <div className="space-y-4">
              <div className="text-6xl mb-4">📄</div>
              {isDragActive ? (
                <p className="text-lg text-blue-500">Drop your resume here</p>
              ) : (
                <>
                  <p className="text-lg">
                    Drag and drop your resume here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supported formats: PDF, DOCX (max 5MB)
                  </p>
                </>
              )}
            </div>
          </LoadingBlur>
        </div>

        {status && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {status === 'parsing' && 'Parsing resume...'}
                {status === 'extracting_skills' && 'Extracting skills...'}
                {status === 'analyzing' && 'Analyzing content...'}
                {status === 'completed' && 'Analysis complete!'}
              </span>
              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}
      </GlassCard>
    </div>
  );
}; 