'use client';

import { useState, useEffect, useCallback } from 'react';
import { Squares2X2Icon, ListBulletIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Upload, ChevronDown, ChevronUp, FileText, Trash2, RefreshCw, Eye, Download, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { env } from '@/lib/env';
import UploadZone from '@/components/UploadZone';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { resumes as resumesApi, type ResumeItem as ApiResumeItem } from '@/lib/intelligence-client';

interface ResumeItem extends ApiResumeItem {
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
    fetchResumes();
  }, [fetchResumes]);

  const handleUploadComplete = () => {
    setShowUpload(false);
    fetchResumes();
  };

  const handleDelete = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume from your portfolio?')) return;
    setLoading(true);
    try {
      await resumesApi.delete(resumeId);
      toast.success('Resume deleted successfully!');
      if (selectedResume?.id === resumeId) {
        setSelectedResume(null);
      }
      await fetchResumes();
    } catch (err) {
      console.error(err);
      toast.error('Deletion failed.');
    } finally {
      setLoading(false);
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
    <main className="container mx-auto px-4 py-8 animate-fade-in text-white relative">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Resume Portfolio</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and upload your structural validation profiles.</p>
        </div>

        <div className="flex gap-2 items-center self-start sm:self-auto">
          {/* Collapse/Expand Upload Zone */}
          <button
            onClick={() => setShowUpload(!showUpload)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              showUpload
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-black font-bold'
            }`}
          >
            <Upload size={14} />
            {showUpload ? 'Close Uploader' : 'Upload New'}
            {showUpload ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            className={`p-2 rounded-lg border transition-colors ${view === 'list' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-transparent border-white/10 text-slate-400 hover:text-slate-200'}`}
            onClick={() => setView('list')}
            aria-label="List view"
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>

          <button
            className={`p-2 rounded-lg border transition-colors ${view === 'grid' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-transparent border-white/10 text-slate-400 hover:text-slate-200'}`}
            onClick={() => setView('grid')}
            aria-label="Grid view"
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expandable Upload Panel */}
      {showUpload && (
        <div className="mb-8 p-6 rounded-2xl border border-white/[0.08] bg-[#0c0c0c] shadow-2xl animate-slide-in-bottom">
          <UploadZone onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {loading && resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-6 h-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
          <div className="text-xs font-mono text-white/40 tracking-widest uppercase">Fetching portfolios...</div>
        </div>
      ) : resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <DocumentTextIcon className="h-12 w-12 text-slate-600 mb-4" />
          <div className="text-slate-400 text-sm mb-4">No resumes found in your portfolio.</div>
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
              className="flex flex-col md:flex-row md:items-center justify-between rounded-xl bg-slate-900/40 p-4 border border-white/[0.04] shadow hover:border-white/[0.08] gap-4 transition-all animate-slide-in-bottom cursor-pointer hover:bg-slate-800/20"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <FileText className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white/80 truncate">{resume.filename}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-wide">
                    Uploaded: {formatTimestamp(resume.uploaded_at)}
                  </div>
                </div>
              </div>

              {resume.skills && resume.skills.length > 0 && (
                <div className="hidden lg:flex flex-wrap gap-1 max-w-[30%]">
                  {resume.skills.slice(0, 3).map((skill, sIdx) => (
                    <span key={sIdx} className="text-[9px] px-1.5 py-0.5 rounded border border-white/[0.06] text-white/40 bg-white/[0.01]">
                      {skill}
                    </span>
                  ))}
                  {resume.skills.length > 3 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/[0.06] text-white/20 bg-white/[0.01]">
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
              className="rounded-2xl bg-slate-900/40 p-6 border border-white/[0.04] hover:border-white/[0.08] shadow-lg flex flex-col justify-between gap-4 transition-all cursor-pointer hover:bg-slate-800/10"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-white/[0.02] border border-white/[0.04]">
                  <FileText className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="text-sm font-medium text-white/85 text-center truncate w-full">{resume.filename}</div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wide text-center">
                  {formatTimestamp(resume.uploaded_at)}
                </div>

                {resume.skills && resume.skills.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                    {resume.skills.slice(0, 3).map((skill, sIdx) => (
                      <span key={sIdx} className="text-[8px] px-1.5 py-0.5 rounded border border-white/[0.06] text-white/30 bg-white/[0.01]">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid Actions */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/[0.04]" onClick={(e) => e.stopPropagation()}>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResume(null)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-slate-950 border-l border-white/[0.08] shadow-2xl p-6 overflow-y-auto text-white font-sans"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <FileText className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white max-w-md truncate">{selectedResume.filename}</h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Resume Portfolio Insights</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedResume(null)}
                  className="p-1.5 rounded-lg border border-white/10 hover:bg-white/[0.03] text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="space-y-6">
                {/* 1. Summary Card */}
                <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">File Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Uploaded At</span>
                      <span className="font-semibold text-white/90">{formatTimestamp(selectedResume.uploaded_at)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">File Size</span>
                      <span className="font-semibold text-white/90 font-mono">
                        {selectedResume.file_size_bytes
                          ? `${(selectedResume.file_size_bytes / 1024).toFixed(1)} KB`
                          : 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Resume Version</span>
                      <span className="font-semibold text-emerald-400 font-mono">v1.0 (Active)</span>
                    </div>
                  </div>
                </div>

                {/* 2. Parsing Health Card */}
                <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Parsing Health Status</h4>
                    {selectedResume.parse_status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                        Success ✓
                      </span>
                    ) : selectedResume.parse_status === 'pending' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-500/10 border border-amber-500/25 text-amber-400">
                        Pending ⏳
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
                      <div className="text-rose-400">
                        Standard entity parser reported errors during structure extraction or validation. Check files for corrupt PDF structures.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Tabbed/Detailed Extracted Data */}
                {selectedResume.parsed_data && (
                  <div className="space-y-6">
                    {/* Inferred Career Metadata */}
                    <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Inferred Trajectory</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 block">Target Role Projection</span>
                          <span className="font-semibold text-white/95 mt-0.5 block">{selectedResume.parsed_data.inferred_target_role || 'Senior Developer'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Domain Specialization</span>
                          <span className="font-semibold text-white/95 mt-0.5 block">{selectedResume.parsed_data.inferred_specialization || 'Software Engineering'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block">Years of Industry Experience</span>
                          <span className="font-semibold text-white/95 mt-0.5 block font-mono">{selectedResume.parsed_data.years_of_experience ?? 0.0} yrs</span>
                        </div>
                      </div>
                    </div>

                    {/* Extracted Skills */}
                    {selectedResume.parsed_data.skills && selectedResume.parsed_data.skills.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Extracted Stack Skills ({selectedResume.parsed_data.skills.length})</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedResume.parsed_data.skills.map((skill) => (
                            <span key={skill} className="text-[10px] px-2.5 py-0.5 rounded border border-white/[0.06] text-slate-300 bg-white/[0.015]">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience Extracted */}
                    {selectedResume.parsed_data.experience && selectedResume.parsed_data.experience.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Work Experience</h4>
                        <div className="space-y-3">
                          {selectedResume.parsed_data.experience.map((exp, idx) => (
                            <div key={idx} className="p-3.5 rounded-lg border border-white/[0.03] bg-white/[0.005] space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold gap-2">
                                <span className="text-white/90">{exp.title}</span>
                                <span className="text-slate-400 font-mono text-[10px] flex-shrink-0">{exp.duration}</span>
                              </div>
                              <div className="text-[11px] text-emerald-400 font-medium">{exp.company}</div>
                              {exp.description && (
                                <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-white/[0.02] font-sans">
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
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Portfolio Projects</h4>
                        <div className="space-y-3">
                          {selectedResume.parsed_data.projects.map((proj, idx) => (
                            <div key={idx} className="p-3.5 rounded-lg border border-white/[0.03] bg-white/[0.005] space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold gap-2">
                                <span className="text-white/90">{proj.name}</span>
                                {proj.role && <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-bold uppercase tracking-wide flex-shrink-0">{proj.role}</span>}
                              </div>
                              {proj.description && <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{proj.description}</p>}
                              {proj.technology_stack && proj.technology_stack.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-white/[0.02]">
                                  {proj.technology_stack.map(tech => (
                                    <span key={tech} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/[0.04] text-white/50">{tech}</span>
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
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Education Details</h4>
                        <div className="space-y-2.5">
                          {selectedResume.parsed_data.education.map((edu, idx) => (
                            <div key={idx} className="flex justify-between items-start text-xs border-b border-white/[0.03] pb-2.5 last:border-0">
                              <div>
                                <div className="font-semibold text-white/90">{edu.degree}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">{edu.institution}</div>
                              </div>
                              <span className="text-slate-500 font-mono text-[10px] flex-shrink-0">{edu.year}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications Extracted */}
                    {selectedResume.parsed_data.certifications && selectedResume.parsed_data.certifications.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Certifications</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedResume.parsed_data.certifications.map((c) => (
                            <span key={c} className="text-[10px] px-2.5 py-1 rounded bg-slate-900 border border-white/[0.04] text-slate-300">
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
    </main>
  );
}
