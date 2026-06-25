'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Squares2X2Icon, ListBulletIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Upload, ChevronDown, ChevronUp, FileText, Trash2, RefreshCw, Eye, Download, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { env } from '@/lib/env';
import UploadZone from '@/components/UploadZone';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { resumes as resumesApi, type ResumeItem as ApiResumeItem } from '@/lib/intelligence-client';

interface ResumeItem extends ApiResumeItem {
  parse_error?: string;
  parsed_data?: {
    skills?: string[];
    education?: { degree?: string; institution?: string; year?: string }[];
    experience?: { title?: string; company?: string; duration?: string; description?: string }[];
    projects?: { name?: string; description?: string; technology_stack?: string[]; role?: string }[];
    certifications?: string[];
    metadata?: { name?: string; email?: string; phone?: string; location?: string };
    inferred_specialization?: string;
    inferred_target_role?: string;
    years_of_experience?: number;
  } | null;
}

export default function ResumesPage() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [selectedResume, setSelectedResume] = useState<ResumeItem | null>(null);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await resumesApi.list();
      setResumes((data.resumes || []) as ResumeItem[]);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const uploadParam = searchParams.get('upload');
    if (uploadParam === '1' || uploadParam === 'true') {
      setShowUpload(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const hasParsingResumes = resumes.some(
    (r) => r.parse_status && !['completed', 'failed'].includes(r.parse_status)
  );
  const failedResumes = resumes.filter((r) => r.parse_status === 'failed');

  useEffect(() => {
    if (!hasParsingResumes) return;
    const interval = setInterval(() => {
      void fetchResumes();
    }, 5000);
    return () => clearInterval(interval);
  }, [hasParsingResumes, fetchResumes]);

  const handleUploadComplete = () => {
    setShowUpload(false);
    fetchResumes();
  };

  const handleDelete = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume from your portfolio?')) return;

    const previous = resumes;
    setResumes((prev) => prev.filter((r) => r.id !== resumeId));
    if (selectedResume?.id === resumeId) {
      setSelectedResume(null);
    }

    try {
      await resumesApi.delete(resumeId);
      toast.success('Resume deleted successfully!');
      await fetchResumes();
    } catch (err) {
      console.error(err);
      setResumes(previous);
      toast.error('Deletion failed.');
    }
  };

  const handleReplaceClick = (resumeId: string) => {
    setReplacingId(resumeId);
    document.getElementById(`replace-input-${resumeId}`)?.click();
  };

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>, resumeId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported for replacement.');
      return;
    }

    setLoading(true);
    try {
      await resumesApi.replace(resumeId, file);
      toast.success('Resume replaced and calibrated successfully!');
      await fetchResumes();
    } catch (err) {
      console.error(err);
      toast.error('Replacement failed.');
    } finally {
      setLoading(false);
      setReplacingId(null);
    }
  };

  const formatTimestamp = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    const now = new Date();

    const isToday = d.getDate() === now.getDate() &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.getDate() === yesterday.getDate() &&
                        d.getMonth() === yesterday.getMonth() &&
                        d.getFullYear() === yesterday.getFullYear();

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;

    if (isToday) {
      return `Today • ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday • ${timeStr}`;
    } else {
      return `${d.toLocaleDateString()} • ${timeStr}`;
    }
  };

  return (
    <div className="animate-fade-in text-text relative">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Resume Portfolio</h1>
          <p className="text-sm text-text-secondary mt-1">Manage and upload your structural validation profiles.</p>
        </div>

        <div className="flex gap-2 items-center self-start sm:self-auto">
          {/* Collapse/Expand Upload Zone */}
          <button
            onClick={() => setShowUpload(!showUpload)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              showUpload
                ? 'bg-slate-800 border-slate-700 text-text'
                : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-black font-bold'
            }`}
          >
            <Upload size={14} />
            {showUpload ? 'Close Uploader' : 'Upload New'}
            {showUpload ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            className={`p-2 rounded-lg border transition-colors ${view === 'list' ? 'bg-surface-overlay border-border text-text' : 'bg-transparent border-border text-text-secondary hover:text-text'}`}
            onClick={() => setView('list')}
            aria-label="List view"
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>

          <button
            className={`p-2 rounded-lg border transition-colors ${view === 'grid' ? 'bg-surface-overlay border-border text-text' : 'bg-transparent border-border text-text-secondary hover:text-text'}`}
            onClick={() => setView('grid')}
            aria-label="Grid view"
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expandable Upload Panel */}
      {showUpload && (
        <div className="mb-8 rounded-2xl border border-border bg-surface-raised p-4 shadow-md animate-slide-in-bottom">
          <UploadZone variant="embedded" onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {failedResumes.length > 0 && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2 text-sm text-rose-200">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-semibold text-rose-100">
                {failedResumes.length} resume{failedResumes.length > 1 ? 's' : ''} failed to parse
              </p>
              <p className="text-xs text-rose-200/80 mt-1">
                {failedResumes[0].parse_error || 'Re-upload a standard PDF with a readable text layer.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowUpload(true);
              if (failedResumes[0]) setSelectedResume(failedResumes[0]);
            }}
            className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wide transition-colors"
          >
            Re-upload Resume
          </button>
        </div>
      )}

      {loading && resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-6 h-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
          <div className="text-xs font-mono text-text-secondary tracking-widest uppercase">Fetching portfolios...</div>
        </div>
      ) : resumes.length === 0 && !showUpload ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl bg-surface-raised">
          <DocumentTextIcon className="h-12 w-12 text-text-tertiary mb-4" />
          <div className="text-text-secondary text-sm mb-4">No resumes found in your portfolio.</div>
          <button
            onClick={() => setShowUpload(true)}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs transition-all shadow-lg hover-lift"
          >
            Upload Your First Resume
          </button>
        </div>
      ) : view === 'list' ? (
        <div className="grid gap-4">
          {resumes.map((resume, i) => (
            <div
              key={resume.id}
              onClick={() => setSelectedResume(resume)}
              className="flex flex-col md:flex-row md:items-center justify-between rounded-xl bg-slate-900/40 p-4 border border-border shadow hover:border-border gap-4 transition-all animate-slide-in-bottom cursor-pointer hover:bg-slate-800/20"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-2.5 rounded-lg bg-surface-inset border border-border">
                  <FileText className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text truncate">{resume.filename}</div>
                  <div className="text-[10px] font-mono text-text-tertiary mt-1 uppercase tracking-wide">
                    Uploaded: {formatTimestamp(resume.uploaded_at)}
                  </div>
                  {resume.parse_status === 'failed' && (
                    <div className="text-[10px] font-mono text-rose-400 mt-1 uppercase tracking-wide">
                      Parse failed — replace or re-upload
                    </div>
                  )}
                </div>
              </div>

              {resume.skills && resume.skills.length > 0 && (
                <div className="hidden lg:flex flex-wrap gap-1 max-w-[30%]">
                  {resume.skills.slice(0, 3).map((skill, sIdx) => (
                    <span key={sIdx} className="text-[9px] px-1.5 py-0.5 rounded border border-border text-text-secondary bg-surface-raised">
                      {skill}
                    </span>
                  ))}
                  {resume.skills.length > 3 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-border text-text-tertiary bg-surface-raised">
                      +{resume.skills.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-auto" onClick={(e) => e.stopPropagation()}>
                <a
                  href={`${env.NEXT_PUBLIC_API_URL}/v1/resumes/${resume.id}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all"
                >
                  <Eye size={12} />
                  View
                </a>
                <a
                  href={`${env.NEXT_PUBLIC_API_URL}/v1/resumes/${resume.id}/file`}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all"
                >
                  <Download size={12} />
                  Download
                </a>
                <button
                  onClick={() => handleReplaceClick(resume.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all"
                >
                  <RefreshCw size={12} className={replacingId === resume.id ? 'animate-spin' : ''} />
                  Replace
                </button>
                <button
                  onClick={() => handleDelete(resume.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                >
                  <Trash2 size={12} />
                  Delete
                </button>

                {/* Hidden input specific to this resume for replacing */}
                <input
                  type="file"
                  id={`replace-input-${resume.id}`}
                  accept=".pdf"
                  onChange={(e) => handleReplaceFileChange(e, resume.id)}
                  className="hidden"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {resumes.map((resume, i) => (
            <div
              key={resume.id}
              onClick={() => setSelectedResume(resume)}
              className="rounded-2xl bg-slate-900/40 p-6 border border-border hover:border-border shadow-lg flex flex-col justify-between gap-4 transition-all cursor-pointer hover:bg-slate-800/10"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-surface-inset border border-border">
                  <FileText className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="text-sm font-medium text-text/85 text-center truncate w-full">{resume.filename}</div>
                <div className="text-[10px] font-mono text-text-tertiary uppercase tracking-wide text-center">
                  {formatTimestamp(resume.uploaded_at)}
                </div>

                {resume.skills && resume.skills.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                    {resume.skills.slice(0, 3).map((skill, sIdx) => (
                      <span key={sIdx} className="text-[8px] px-1.5 py-0.5 rounded border border-border text-text-tertiary bg-surface-raised">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid Actions */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
                <a
                  href={`${env.NEXT_PUBLIC_API_URL}/v1/resumes/${resume.id}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 py-2 text-[10px] font-extrabold uppercase tracking-wider rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all"
                >
                  <Eye size={11} />
                  View
                </a>
                <a
                  href={`${env.NEXT_PUBLIC_API_URL}/v1/resumes/${resume.id}/file`}
                  download
                  className="flex items-center justify-center gap-1 py-2 text-[10px] font-extrabold uppercase tracking-wider rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all"
                >
                  <Download size={11} />
                  Get
                </a>
                <button
                  onClick={() => handleReplaceClick(resume.id)}
                  className="flex items-center justify-center gap-1 py-2 text-[10px] font-extrabold uppercase tracking-wider rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all"
                >
                  <RefreshCw size={11} className={replacingId === resume.id ? 'animate-spin' : ''} />
                  Replace
                </button>
                <button
                  onClick={() => handleDelete(resume.id)}
                  className="flex items-center justify-center gap-1 py-2 text-[10px] font-extrabold uppercase tracking-wider rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                >
                  <Trash2 size={11} />
                  Delete
                </button>

                <input
                  type="file"
                  id={`replace-input-${resume.id}`}
                  accept=".pdf"
                  onChange={(e) => handleReplaceFileChange(e, resume.id)}
                  className="hidden"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sliding Insights Drawer */}
      <AnimatePresence>
        {selectedResume && (
          <>
            {/* Backdrop */}
            <motion.div
              key="resume-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResume(null)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              key="resume-drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-slate-950 border-l border-border shadow-2xl p-6 overflow-y-auto text-text font-sans"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-surface-inset border border-border">
                    <FileText className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text max-w-md truncate">{selectedResume.filename}</h3>
                    <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider font-semibold">Resume Portfolio Insights</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedResume(null)}
                  className="p-1.5 rounded-lg border border-border hover:bg-surface-inset text-text-secondary hover:text-text transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="space-y-6">
                {/* 1. Summary Card */}
                <div className="p-4 rounded-xl border border-border bg-surface-raised space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">File Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-text-tertiary block">Uploaded At</span>
                      <span className="font-semibold text-text">{formatTimestamp(selectedResume.uploaded_at)}</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block">File Size</span>
                      <span className="font-semibold text-text font-mono">
                        {selectedResume.file_size_bytes
                          ? `${(selectedResume.file_size_bytes / 1024).toFixed(1)} KB`
                          : 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block">Resume Version</span>
                      <span className="font-semibold text-emerald-400 font-mono">v1.0 (Active)</span>
                    </div>
                  </div>
                </div>

                {/* 2. Parsing Health Card */}
                <div className="p-4 rounded-xl border border-border bg-surface-raised space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">Parsing Health Status</h4>
                    {selectedResume.parse_status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                        Success ✓
                      </span>
                    ) : selectedResume.parse_status === 'pending' || selectedResume.parse_status === 'extracting_text' || selectedResume.parse_status === 'parsing_resume' || selectedResume.parse_status === 'extracting_skills' || selectedResume.parse_status === 'building_profile' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-500/10 border border-amber-500/25 text-amber-400">
                        {selectedResume.parse_status === 'pending' ? 'Pending' : 'Processing'} ⏳
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-rose-500/10 border border-rose-500/25 text-rose-400">
                        Failed ⚠
                      </span>
                    )}
                  </div>

                  {/* Healthy Warning/Details */}
                  <div className="text-xs space-y-1.5 leading-relaxed">
                    {selectedResume.parse_status === 'completed' ? (
                      <>
                        <div className="text-slate-300">
                          The resume text was successfully extracted, sanitized, and modeled against live recruiter signals.
                        </div>
                        {(!selectedResume.parsed_data?.experience?.length || !selectedResume.parsed_data?.education?.length) ? (
                          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/15 text-amber-300 text-[11px] flex gap-2 items-start mt-2">
                            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-400" />
                            <div>
                              <strong>Warning:</strong> The parser detected missing core profile fields (e.g. empty work history or educational parameters). Ensure your PDF is standard and contains legible text layers.
                            </div>
                          </div>
                        ) : (
                          <div className="text-emerald-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 mt-2">
                            <CheckCircle size={12} />
                            All structural parameters successfully verified
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-rose-400 space-y-3">
                        <p>
                          {selectedResume.parse_error ||
                            'Standard entity parser reported errors during structure extraction or validation. Check files for corrupt PDF structures.'}
                        </p>
                        <button
                          onClick={() => handleReplaceClick(selectedResume.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all"
                        >
                          <RefreshCw size={12} />
                          Retry with new file
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Tabbed/Detailed Extracted Data */}
                {selectedResume.parsed_data && (
                  <div className="space-y-6">
                    {/* Inferred Career Metadata */}
                    <div className="p-4 rounded-xl border border-border bg-surface-raised space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">Inferred Trajectory</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-text-tertiary block">Target Role Projection</span>
                          <span className="font-semibold text-text mt-0.5 block">{selectedResume.parsed_data.inferred_target_role || 'Senior Developer'}</span>
                        </div>
                        <div>
                          <span className="text-text-tertiary block">Domain Specialization</span>
                          <span className="font-semibold text-text mt-0.5 block">{selectedResume.parsed_data.inferred_specialization || 'Software Engineering'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-text-tertiary block">Years of Industry Experience</span>
                          <span className="font-semibold text-text mt-0.5 block font-mono">{selectedResume.parsed_data.years_of_experience ?? 0.0} yrs</span>
                        </div>
                      </div>
                    </div>

                    {/* Extracted Skills */}
                    {selectedResume.parsed_data.skills && selectedResume.parsed_data.skills.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">Extracted Stack Skills ({selectedResume.parsed_data.skills.length})</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedResume.parsed_data.skills.map((skill) => (
                            <span key={skill} className="text-[10px] px-2.5 py-0.5 rounded border border-border text-slate-300 bg-surface-raised">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience Extracted */}
                    {selectedResume.parsed_data.experience && selectedResume.parsed_data.experience.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">Work Experience</h4>
                        <div className="space-y-3">
                          {selectedResume.parsed_data.experience.map((exp, idx) => (
                            <div key={idx} className="p-3.5 rounded-lg border border-border-subtle bg-surface-inset space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold gap-2">
                                <span className="text-text">{exp.title}</span>
                                <span className="text-text-secondary font-mono text-[10px] flex-shrink-0">{exp.duration}</span>
                              </div>
                              <div className="text-[11px] text-emerald-400 font-medium">{exp.company}</div>
                              {exp.description && (
                                <p className="text-[11px] text-text-secondary leading-relaxed pt-2 border-t border-border-subtle font-sans">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects Extracted */}
                    {selectedResume.parsed_data.projects && selectedResume.parsed_data.projects.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">Portfolio Projects</h4>
                        <div className="space-y-3">
                          {selectedResume.parsed_data.projects.map((proj, idx) => (
                            <div key={idx} className="p-3.5 rounded-lg border border-border-subtle bg-surface-inset space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold gap-2">
                                <span className="text-text">{proj.name}</span>
                                {proj.role && <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-bold uppercase tracking-wide flex-shrink-0">{proj.role}</span>}
                              </div>
                              {proj.description && <p className="text-[11px] text-text-secondary leading-relaxed font-sans">{proj.description}</p>}
                              {proj.technology_stack && proj.technology_stack.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-border-subtle">
                                  {proj.technology_stack.map(tech => (
                                    <span key={tech} className="text-[9px] px-1.5 py-0.5 rounded bg-surface-inset border border-border text-text-secondary">{tech}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education Extracted */}
                    {selectedResume.parsed_data.education && selectedResume.parsed_data.education.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">Education Details</h4>
                        <div className="space-y-2.5">
                          {selectedResume.parsed_data.education.map((edu, idx) => (
                            <div key={idx} className="flex justify-between items-start text-xs border-b border-border-subtle pb-2.5 last:border-0">
                              <div>
                                <div className="font-semibold text-text">{edu.degree}</div>
                                <div className="text-[11px] text-text-secondary mt-0.5">{edu.institution}</div>
                              </div>
                              <span className="text-text-tertiary font-mono text-[10px] flex-shrink-0">{edu.year}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications Extracted */}
                    {selectedResume.parsed_data.certifications && selectedResume.parsed_data.certifications.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">Certifications</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedResume.parsed_data.certifications.map((c) => (
                            <span key={c} className="text-[10px] px-2.5 py-1 rounded bg-slate-900 border border-border text-slate-300">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
