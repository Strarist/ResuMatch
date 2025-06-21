import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResumeCard from './ResumeCard';
import { Resume } from '../../lib/api';

interface ResumeGridProps {
  resumes: Resume[];
  loading?: boolean;
  onAnalyze: (id: string) => Promise<void>;
  onEditTags: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  loadingIds?: string[];
  uploadProgressMap?: Record<string, number>;
}

const ResumeGrid: React.FC<ResumeGridProps> = ({
  resumes,
  loading = false,
  onAnalyze,
  onEditTags,
  onDelete,
  loadingIds = [],
  uploadProgressMap = {},
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-56 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }
  if (!resumes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="text-7xl mb-6 animate-bounce">📄</div>
        <p className="text-xl text-gray-500 dark:text-gray-400 font-medium mb-2">No resumes uploaded yet</p>
        <p className="text-md text-gray-400 dark:text-gray-500">Start by uploading your first resume above!</p>
      </div>
    );
  }
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.08 },
        },
      }}
    >
      <AnimatePresence>
        {resumes.map((resume) => (
          <ResumeCard
            key={resume.id}
            resume={resume}
            onAnalyze={onAnalyze}
            onEditTags={onEditTags}
            onDelete={onDelete}
            isLoading={loadingIds.includes(resume.id)}
            uploadProgress={uploadProgressMap[resume.id] || 0}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default ResumeGrid; 