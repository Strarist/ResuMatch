'use client';

import { useState, useEffect, useCallback } from 'react';
import { Squares2X2Icon, ListBulletIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Upload, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { env } from '@/lib/env';
import UploadZone from '@/components/UploadZone';

interface ResumeItem {
  id: string;
  filename: string;
  skills: string[] | null;
  uploaded_at: string | null;
}

export default function ResumesPage() {
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/resumes`, { headers });
      if (res.ok) {
        const data = await res.json();
        // Backend returns resumes inside a list or wrapper
        setResumes(data.resumes || data || []);
      }
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

  return (
    <main className="container mx-auto px-4 py-8 animate-fade-in text-white">
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

      {loading ? (
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
              className="flex items-center justify-between rounded-xl bg-slate-900/40 p-4 border border-white/[0.04] shadow hover:border-white/[0.08] transition-all animate-slide-in-bottom"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <FileText className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white/80 truncate">{resume.filename}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-wide">
                    Uploaded: {resume.uploaded_at ? new Date(resume.uploaded_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              {resume.skills && resume.skills.length > 0 && (
                <div className="hidden md:flex flex-wrap gap-1 max-w-[40%] justify-end">
                  {resume.skills.slice(0, 4).map((skill, sIdx) => (
                    <span key={sIdx} className="text-[9px] px-1.5 py-0.5 rounded border border-white/[0.06] text-white/40 bg-white/[0.01]">
                      {skill}
                    </span>
                  ))}
                  {resume.skills.length > 4 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/[0.06] text-white/20 bg-white/[0.01]">
                      +{resume.skills.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {resumes.map((resume, i) => (
            <div
              key={resume.id}
              className="rounded-2xl bg-slate-900/40 p-6 border border-white/[0.04] hover:border-white/[0.08] shadow-lg flex flex-col items-center gap-4 transition-all"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div className="p-4 rounded-full bg-white/[0.02] border border-white/[0.04]">
                <FileText className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="text-sm font-medium text-white/85 text-center truncate w-full">{resume.filename}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">
                {resume.uploaded_at ? new Date(resume.uploaded_at).toLocaleDateString() : 'N/A'}
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
          ))}
        </div>
      )}
    </main>
  );
}
