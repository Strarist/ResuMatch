import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PencilSquareIcon, TrashIcon, MagnifyingGlassCircleIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import ProgressBar from '../common/ProgressBar';
import { ScoreBadge } from '../common/ScoreBadge';
import { Resume } from '../../lib/api';

interface ResumeCardProps {
  resume: Resume;
  onAnalyze: (id: string) => Promise<void>;
  onEditTags: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
  uploadProgress?: number;
}

const statusStyles: Record<string, string> = {
  ready: 'bg-green-100 text-green-700',
  processing: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
};
const statusIcons: Record<string, React.ReactElement> = {
  ready: <CheckCircleIcon className="w-4 h-4 mr-1 text-green-500" />,
  processing: <ExclamationCircleIcon className="w-4 h-4 mr-1 text-yellow-500" />,
  error: <ExclamationCircleIcon className="w-4 h-4 mr-1 text-red-500" />,
};
const tagColors = [
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-indigo-100 text-indigo-800',
];

const ResumeCard: React.FC<ResumeCardProps> = ({
  resume,
  onAnalyze,
  onEditTags,
  onDelete,
  isLoading = false,
  uploadProgress = 0,
}) => {
  const [showAllTags, setShowAllTags] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(resume.id);
    setDeleting(false);
  };
  const handleAnalyze = async () => {
    setAnalyzing(true);
    await onAnalyze(resume.id);
    setAnalyzing(false);
  };

  const tags = Array.isArray(resume.skills)
    ? resume.skills
    : typeof resume.skills === 'string'
    ? (resume.skills as string).split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];
  const maxTags = 5;
  const visibleTags = showAllTags ? tags : tags.slice(0, maxTags);
  const overflowCount = tags.length - maxTags;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow p-6 flex flex-col min-h-[220px] border border-gray-100 dark:border-gray-800"
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center z-10 rounded-xl">
            <ProgressBar percent={uploadProgress} label={uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : undefined} />
          </div>
        )}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📄</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                {resume.title}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">Uploaded: {resume.upload_date ? new Date(resume.upload_date).toLocaleDateString() : '-'}</p>
            </div>
          </div>
          <span className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[resume.status] || 'bg-gray-200 text-gray-700'}`}>
            {statusIcons[resume.status]}
            {resume.status ? resume.status.charAt(0).toUpperCase() + resume.status.slice(1) : 'Unknown'}
          </span>
        </div>
        <div className="mb-2 flex flex-wrap gap-2 relative">
          {visibleTags.map((skill, idx) => (
            <span
              key={skill}
              className={`px-2 py-1 text-xs rounded-full font-medium shadow-sm ${tagColors[idx % tagColors.length]} transition-colors`}
            >
              {skill}
            </span>
          ))}
          {overflowCount > 0 && !showAllTags && (
            <button
              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none"
              onClick={() => setShowAllTags(true)}
            >
              +{overflowCount} more
            </button>
          )}
          {showAllTags && (
            <button
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full ml-1 focus:outline-none"
              onClick={() => setShowAllTags(false)}
            >
              Show less
            </button>
          )}
        </div>
        <div className="flex justify-between items-center mt-auto pt-2">
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 rounded bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 flex items-center gap-2"
              onClick={handleAnalyze}
              disabled={isLoading || analyzing}
            >
              {analyzing && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              )}
              AI Analyze
            </button>
            <button
              className="px-3 py-1 rounded bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
              onClick={() => onEditTags(resume.id)}
              disabled={isLoading}
            >
              Edit Tags
            </button>
            <button
              className="px-3 py-1 rounded bg-red-500 text-white text-sm font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={() => onDelete(resume.id)}
              disabled={isLoading}
            >
              Delete
            </button>
          </div>
          {resume.matchScore !== undefined && (
            <div className="flex items-center">
              <ScoreBadge score={resume.matchScore} size="sm" />
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default ResumeCard; 