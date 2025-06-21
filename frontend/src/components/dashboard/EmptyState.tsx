import { DocumentTextIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  onUpload: () => void;
  onAddJob: () => void;
}

export default function EmptyState({ onUpload, onAddJob }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="flex gap-4 mb-6">
        <DocumentTextIcon className="h-12 w-12 text-blue-400" />
        <BriefcaseIcon className="h-12 w-12 text-yellow-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Get started with Smart Resume Analyzer</h2>
      <p className="text-gray-500 mb-6">Upload your first resume or add a job to see insights and matches.</p>
      <div className="flex gap-4">
        <button className="btn-primary" onClick={onUpload}>Upload Resume</button>
        <button className="btn-secondary" onClick={onAddJob}>Add Job</button>
      </div>
    </div>
  );
} 