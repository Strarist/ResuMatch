import React, { useCallback, useState } from 'react';
import { PageTransition } from '../../components/common/PageTransition';
import { ResumeUpload } from '../../components/resume/ResumeUpload';
import ResumeGrid from '../../components/resume/ResumeGrid';
import EditTagsModal from '../../components/resume/EditTagsModal';
import { AnalysisResultModal, AnalysisResult } from '../../components/resume/AnalysisResultModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumes, Resume } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

const Resumes: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [editTagsId, setEditTagsId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [selectedResumeTitle, setSelectedResumeTitle] = useState('');

  // Fetch all resumes
  const { data, isLoading, isError } = useQuery<{ items: Resume[]; total: number }>({
    queryKey: ['resumes', search, sortBy],
    queryFn: resumes.list,
  });

  let resumesList = Array.isArray(data?.items) ? data.items : [];
  if (search) {
    resumesList = resumesList.filter(r => r.title && r.title.toLowerCase().includes(search.toLowerCase()));
  }
  if (sortBy) {
    resumesList = [...resumesList].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'createdAt') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'updatedAt') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      return 0;
    });
  }

  // Mutations
  const analyzeMutation = useMutation({
    mutationFn: (id: string) => resumes.analyze(id),
    onMutate: (id) => setLoadingIds(ids => [...ids, id]),
    onSuccess: (data, id) => {
      const resume = resumesList.find(r => r.id === id);
      setSelectedResumeTitle(resume?.title || '');
      setAnalysisResult(data);
      setAnalysisModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      showToast('Analysis complete!', 'success');
    },
    onError: () => {
      showToast('Failed to complete analysis', 'error');
    },
    onSettled: (data, error, id) => {
      setLoadingIds(ids => ids.filter(x => x !== id));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumes.delete(id),
    onMutate: (id) => setLoadingIds(ids => [...ids, id]),
    onSettled: (data, error, id) => {
      setLoadingIds(ids => ids.filter(x => x !== id));
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      if (error) showToast('Failed to delete resume', 'error');
      else showToast('Resume deleted', 'success');
    },
  });

  // Tag editing (simulate allTags for demo)
  const allTags = Array.from(new Set(resumesList.flatMap(r => r.skills || []))).map(t => ({ label: t, value: t }));
  const currentTags = (id: string) => {
    const resume = resumesList.find(r => r.id === id);
    return (resume?.skills || []).map(t => ({ label: t, value: t }));
  };
  const handleEditTags = (id: string) => setEditTagsId(id);
  const handleSaveTags = async (tags: { label: string; value: string }[]) => {
    if (!editTagsId) return;
    try {
      setLoadingIds(ids => [...ids, editTagsId]);
      await fetch(`/api/v1/resumes/${editTagsId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: tags.map(t => t.value) }),
      });
      showToast('Tags updated!', 'success');
      setEditTagsId(null);
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    } catch {
      showToast('Failed to update tags', 'error');
    } finally {
      setLoadingIds(ids => ids.filter(x => x !== editTagsId));
    }
  };

  // Upload complete handler
  const handleUploadComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['resumes'] });
  }, [queryClient]);

  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 max-w-screen-2xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-8 text-center tracking-tight drop-shadow-lg">Your Resumes</h1>
        <div className="mb-10 flex justify-center">
          <ResumeUpload onUploadComplete={handleUploadComplete} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <input
            type="text"
            placeholder="Search resumes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-1/3 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full sm:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="createdAt">Newest</option>
            <option value="updatedAt">Recently Updated</option>
            <option value="matchScore">Best Match</option>
            <option value="title">Title</option>
          </select>
        </div>
        <ResumeGrid
          resumes={resumesList}
          loading={isLoading}
          onAnalyze={id => analyzeMutation.mutateAsync(id)}
          onEditTags={handleEditTags}
          onDelete={async id => { setDeleteId(id); }}
          loadingIds={loadingIds}
        />
        {/* Analysis Modal */}
        <AnalysisResultModal
          isOpen={isAnalysisModalOpen}
          onClose={() => setAnalysisModalOpen(false)}
          analysis={analysisResult}
          resumeTitle={selectedResumeTitle}
        />
        {/* Edit Tags Modal */}
        <EditTagsModal
          open={!!editTagsId}
          initialTags={editTagsId ? currentTags(editTagsId) : []}
          allTags={allTags}
          onSubmit={handleSaveTags}
          onClose={() => setEditTagsId(null)}
        />
        {/* Delete Confirmation Dialog */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-sm mx-auto z-10">
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Delete Resume?</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300">Are you sure you want to delete this resume? This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setDeleteId(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                  onClick={() => deleteMutation.mutateAsync(deleteId)}
                  disabled={loadingIds.includes(deleteId)}
                >
                  {loadingIds.includes(deleteId) ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Resumes; 