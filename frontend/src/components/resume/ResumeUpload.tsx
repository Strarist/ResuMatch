import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { GlassCard } from '../common';
import { useToast } from '../../hooks/useToast';
import { useResumeAnalysis } from '../../hooks/useResumeAnalysis';
import { resumes, Resume, API_URL, api } from '../../lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProgressBar from '../common/ProgressBar';

interface ResumeUploadProps {
  onUploadComplete?: (resumeId: string) => void;
}

export const ResumeUpload = ({ onUploadComplete }: ResumeUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { showToast } = useToast();
  const { status, progress } = useResumeAnalysis();
  const queryClient = useQueryClient();
  const [fileName, setFileName] = useState('');

  // Fetch recent resumes
  const { data: recentResumes, refetch } = useQuery<{ items: Resume[]; total: number }>({
    queryKey: ['resumes'],
    queryFn: resumes.list,
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setUploadProgress(0);

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
    try {
      // Use Axios directly for upload progress
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`${API_URL}/resumes/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      });
      showToast('Resume uploaded successfully', 'success');
      setUploadProgress(100);
      onUploadComplete?.('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error uploading resume';
      showToast(message, 'error');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, [showToast, onUploadComplete, refetch, queryClient]);

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

  // Show recent resumes below upload box
  return (
    <div className="w-full max-w-2xl mx-auto">
      <GlassCard className={`p-8 transition-colors relative ${isDragActive ? 'border-blue-500 bg-blue-50/10' : ''}`}> 
        {isUploading && (
          <div className="absolute top-0 left-0 w-full z-20">
            <ProgressBar percent={uploadProgress} label={uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : undefined} />
          </div>
        )}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50/10' : 'border-gray-300 hover:border-blue-400'}`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="text-6xl mb-4">📄</div>
            {isDragActive ? (
              <p className="text-lg text-blue-500">Drop your resume here</p>
            ) : (
              <>
                <p className="text-lg">Drag and drop your resume here, or click to select</p>
                <p className="text-sm text-gray-500">Supported formats: PDF, DOCX (max 5MB)</p>
                {fileName && <p className="text-xs text-gray-400 mt-2">Selected: {fileName}</p>}
              </>
            )}
          </div>
        </div>
      </GlassCard>
      {/* Recent resumes list */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recently Uploaded Resumes</h3>
        {(() => {
          const items: Resume[] = Array.isArray(recentResumes?.items) ? recentResumes.items : [];
          if (!recentResumes) return <div className="text-gray-400">Loading...</div>;
          if (!Array.isArray(recentResumes?.items)) return <div className="text-red-500">Error: resumes data is not an array</div>;
          if (items.length === 0) return <div className="text-gray-400">No resumes uploaded yet.</div>;
          return (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.slice(0, 8).map((resume) => (
                <li key={resume.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{resume.title || resume.filename}</div>
                    <div className="text-xs text-gray-500">Uploaded: {resume.upload_date ? new Date(resume.upload_date).toLocaleDateString() : '-'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${resume.status === 'ready' ? 'bg-green-100 text-green-700' : resume.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{resume.status}</span>
                    {resume.matchScore !== undefined && (
                      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{resume.matchScore}%</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          );
        })()}
      </div>
    </div>
  );
}; 