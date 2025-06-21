import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import SkillChart from '../../components/dashboard/SkillChart';
import ActivityLog from '../../components/dashboard/ActivityLog';
import EmptyState from '../../components/dashboard/EmptyState';
import { PageTransition } from '../../components/common/PageTransition';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { resumes, jobs, dashboard, Resume, Job } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  // Fetch real data
  const { data: resumeList, isLoading: loadingResumes } = useQuery<{ items: Resume[]; total: number }>({
    queryKey: ['resumes'],
    queryFn: resumes.list,
  });
  const { data: jobList, isLoading: loadingJobs } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: jobs.list,
  });
  const { data: stats, isLoading: loadingStats } = useQuery<any>({
    queryKey: ['dashboard-stats'],
    queryFn: dashboard.get,
  });
  const { data: analytics, isLoading: loadingAnalytics } = useQuery<any>({
    queryKey: ['dashboard-analytics'],
    queryFn: dashboard.getAnalytics,
  });
  const { data: activity, isLoading: loadingActivity } = useQuery<any[]>({
    queryKey: ['recent-activity'],
    queryFn: dashboard.getRecentActivity,
  });

  // Debug: Log dashboard data
  console.log('Dashboard stats:', stats);
  console.log('Dashboard analytics:', analytics);
  console.log('Dashboard activity:', activity);

  // Top skills/trends from analytics
  const topSkills = Array.isArray(analytics?.topSkills) ? analytics.topSkills : [];

  // Responsive grid
  const gridCols = 'grid grid-cols-1 md:grid-cols-2 gap-8';

  // Skeleton loader
  const Skeleton = () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-32 w-full" />;

  // Recent resumes section
  const recentResumes = Array.isArray(resumeList?.items) ? resumeList.items.slice(0, 5) : [];

  // Empty state
  if (!loadingResumes && !loadingJobs && (!resumeList?.items?.length && !jobList?.length)) {
    return (
      <PageTransition>
        <EmptyState
          onUpload={() => navigate('/resumes')}
          onAddJob={() => navigate('/jobs')}
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Dashboard</h1>
            <p className="text-lg text-gray-500 dark:text-gray-300">AI-powered insights and matching at a glance.</p>
          </div>
          <button
            className="rounded-full p-2 bg-gray-200 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition"
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark mode"
          >
            {dark ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-blue-500" />}
          </button>
        </div>

        {/* Stats and Skills */}
        <div className={gridCols + ' mb-8'}>
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {loadingStats ? <Skeleton /> : <StatCard icon="📄" label="Total Resumes" value={stats?.total_resumes ?? 0} loading={loadingStats} />}
              {loadingStats ? <Skeleton /> : <StatCard icon="💼" label="Active Jobs" value={stats?.total_jobs ?? 0} loading={loadingStats} />}
              {loadingStats ? <Skeleton /> : <StatCard icon="📊" label="Match Rate" value={typeof stats?.average_score === 'number' ? `${stats.average_score}%` : '0%'} loading={loadingStats} />}
              {loadingStats ? <Skeleton /> : <StatCard icon="🚀" label="Improvement Score" value={stats?.improvementScore ?? 0} loading={loadingStats} />}
            </div>
            {loadingAnalytics ? <Skeleton /> : <SkillChart data={topSkills} loading={loadingAnalytics} />}
          </div>
          {/* Recent Resumes */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Resumes</h2>
              <button className="btn-primary" onClick={() => navigate('/resumes')}>Go to Resumes</button>
            </div>
            {loadingResumes ? (
              <Skeleton />
            ) : recentResumes.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No resumes uploaded yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentResumes.map((resume) => (
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
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recent Activity</h2>
          {loadingActivity ? <Skeleton /> : <ActivityLog activities={Array.isArray(activity) ? activity : []} />}
        </div>
      </div>
    </PageTransition>
  );
} 