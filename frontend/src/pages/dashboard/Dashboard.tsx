import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  BriefcaseIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import PageTransition from '../../components/common/PageTransition';
import Card, { CardHeader, CardBody } from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AnalyticsCharts from '../../components/dashboard/AnalyticsCharts';
import ResumeList from '../../components/dashboard/ResumeList';
import JobList from '../../components/dashboard/JobList';
import { dashboard, Resume, Job } from '../../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Dashboard() {
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboard.getStats,
  });

  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: dashboard.getRecentActivity,
  });

  if (isLoadingStats || isLoadingActivity) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's an overview of your resume matching activity.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats && (
            <>
              <motion.div variants={itemVariants}>
                <Card>
                  <CardBody>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Resumes</p>
                        <div className="flex items-baseline">
                          <p className="text-2xl font-semibold text-gray-900">
                            {stats.totalResumes}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardBody>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <BriefcaseIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Active Jobs</p>
                        <div className="flex items-baseline">
                          <p className="text-2xl font-semibold text-gray-900">
                            {stats.activeJobs}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardBody>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Match Rate</p>
                        <div className="flex items-baseline">
                          <p className="text-2xl font-semibold text-gray-900">
                            {stats.matchRate}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardBody>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ArrowTrendingUpIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Improvement Score</p>
                        <div className="flex items-baseline">
                          <p className="text-2xl font-semibold text-gray-900">
                            {stats.improvementScore}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Analytics Charts */}
        <AnalyticsCharts />

        {/* Resume and Job Lists */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ResumeList onSelectResume={setSelectedResume} />
          <JobList onSelectJob={setSelectedJob} />
        </div>

        {/* Recent Activity */}
        {recentActivity && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              </CardHeader>
              <CardBody>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {recentActivity.map((activity, activityIdx) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {activityIdx !== recentActivity.length - 1 ? (
                            <span
                              className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span
                                className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                  activity.status === 'completed'
                                    ? 'bg-green-500'
                                    : 'bg-yellow-500'
                                }`}
                              >
                                {activity.type === 'resume_upload' ? (
                                  <DocumentTextIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                ) : activity.type === 'job_match' ? (
                                  <BriefcaseIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                ) : (
                                  <ChartBarIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                )}
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                              <div>
                                <p className="text-sm text-gray-900">{activity.title}</p>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  {activity.description}
                                </p>
                              </div>
                              <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                {activity.date}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
} 