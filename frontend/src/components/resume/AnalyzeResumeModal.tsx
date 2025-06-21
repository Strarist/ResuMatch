import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface AnalyzeResumeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
  autoCloseMs?: number;
  resume?: any; // Accept resume object for pre-fill
}

const API_URL = '/api/v1/analyze-resume';

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500 stroke-green-500';
  if (score >= 60) return 'text-yellow-500 stroke-yellow-500';
  return 'text-red-500 stroke-red-500';
};

const AnalyzeResumeModal: React.FC<AnalyzeResumeModalProps> = ({ open, onClose, onSuccess, autoCloseMs = 5000, resume }) => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [autoCloseTimeout, setAutoCloseTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap and escape-to-close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Pre-fill resume file if available
  useEffect(() => {
    if (resume && resume.file && typeof resume.file === 'object') {
      setResumeFile(resume.file);
    } else if (resume && resume.filename) {
      // Optionally, fetch the file from server if needed
      // For now, just show filename as pre-filled (read-only)
      setResumeFile(null);
    }
  }, [resume, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!resumeFile) {
      setError('Please upload a resume file (.pdf, .docx, .txt)');
      toast.error('Please upload a resume file (.pdf, .docx, .txt)');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please paste a job description.');
      toast.error('Please paste a job description.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume_file', resumeFile);
      formData.append('job_description', jobDescription);
      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Analysis failed.');
      }
      const data = await res.json();
      setResult(data);
      onSuccess?.(data);
      toast.success('Analysis complete!');
      // Auto-close after X ms
      const timeout = setTimeout(() => {
        onClose();
        setResult(null);
      }, autoCloseMs);
      setAutoCloseTimeout(timeout);
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
      toast.error(err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup timeout on close
  useEffect(() => {
    if (!open && autoCloseTimeout) {
      clearTimeout(autoCloseTimeout);
      setAutoCloseTimeout(null);
    }
    if (!open) {
      setResult(null);
      setError(null);
      setResumeFile(null);
      setJobDescription('');
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ToastContainer position="top-center" autoClose={3000} hideProgressBar theme="colored" />
          <motion.div
            ref={modalRef}
            className="glass-card bg-white/70 dark:bg-gray-900/80 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 relative backdrop-blur-md border border-gray-200 dark:border-gray-700"
            initial={{ scale: 0.95, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            tabIndex={-1}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white"
              onClick={onClose}
              aria-label="Close"
              disabled={loading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">AI Resume Analysis</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Resume File</label>
                {resumeFile ? (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-700 dark:text-gray-200 font-semibold">{resumeFile.name || resume?.filename || 'Resume file selected'}</span>
                    <button
                      type="button"
                      className="text-xs text-blue-500 hover:underline"
                      onClick={() => setResumeFile(null)}
                      disabled={loading}
                    >
                      Replace
                    </button>
                  </div>
                ) : null}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="block w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onChange={handleFileChange}
                  disabled={loading || !!resumeFile}
                  style={{ display: resumeFile ? 'none' : undefined }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Job Description</label>
                <textarea
                  className="block w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[100px]"
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  disabled={loading}
                  required
                />
              </div>
              {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={loading}
              >
                {loading && <span className="loader mr-2" />}
                Analyze Resume
              </button>
            </form>

            {/* Full-screen spinner overlay while loading */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  className="mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex flex-col items-center mb-4">
                    <div className="relative w-24 h-24 mb-2">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                        <motion.circle
                          cx="50" cy="50" r="45" fill="none"
                          strokeWidth="10"
                          className={getScoreColor(result.match_score)}
                          strokeDasharray={282.6}
                          strokeDashoffset={282.6 - (result.match_score / 100) * 282.6}
                          initial={{ strokeDashoffset: 282.6 }}
                          animate={{ strokeDashoffset: 282.6 - (result.match_score / 100) * 282.6 }}
                          transition={{ duration: 1 }}
                          strokeLinecap="round"
                        />
                        <text x="50" y="55" textAnchor="middle" fontSize="2em" className={getScoreColor(result.match_score)} fontWeight="bold">
                          {result.match_score}%
                        </text>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-indigo-600 dark:text-indigo-400">
                        Match
                      </div>
                    </div>
                  </div>
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Missing Skills</h3>
                    {result.missing_skills && result.missing_skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {result.missing_skills.map((skill: string) => (
                          <span key={skill} className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-green-600 text-sm">No major skill gaps!</span>
                    )}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Suggestions</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {result.suggestions && result.suggestions.map((s: string, i: number) => (
                        <li key={i} className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <span>💡</span> {s}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                  <div className="flex justify-end mt-6">
                    <button
                      className="btn-secondary px-4 py-2 rounded-lg"
                      onClick={onClose}
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnalyzeResumeModal; 