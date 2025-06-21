import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resumes, dashboard, jobs } from '../lib/api';
import { useAuthStore } from '../store/auth';

export const TestAPI: React.FC = () => {
  const { user, isAuthenticated, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'resumes' | 'dashboard' | 'jobs'>('resumes');

  const { data: resumesData, isLoading: resumesLoading, error: resumesError } = useQuery({
    queryKey: ['resumes-test'],
    queryFn: resumes.list,
    enabled: isAuthenticated,
  });

  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['dashboard-test'],
    queryFn: dashboard.get,
    enabled: isAuthenticated,
  });

  const { data: jobsData, isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['jobs-test'],
    queryFn: jobs.list,
    enabled: isAuthenticated,
  });

  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['analytics-test'],
    queryFn: dashboard.getAnalytics,
    enabled: isAuthenticated,
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">API Test Page</h1>
      
      {/* Authentication Status */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
        <div className="space-y-2">
          <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
          <p><strong>User:</strong> {user?.email || 'None'}</p>
          <p><strong>Token:</strong> {token ? '✅ Present' : '❌ Missing'}</p>
        </div>
      </div>

      {/* API Test Tabs */}
      <div className="mb-6">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('resumes')}
            className={`px-4 py-2 rounded ${activeTab === 'resumes' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Resumes API
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded ${activeTab === 'dashboard' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Dashboard API
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded ${activeTab === 'jobs' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Jobs API
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
          {activeTab === 'resumes' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Resumes API Test</h3>
              {resumesLoading && <p>Loading...</p>}
              {resumesError && <p className="text-red-500">Error: {JSON.stringify(resumesError)}</p>}
              {resumesData && (
                <div>
                  <p className="text-green-500 mb-2">✅ API call successful!</p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
                    {JSON.stringify(resumesData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Dashboard API Test</h3>
              {dashboardLoading && <p>Loading...</p>}
              {dashboardError && <p className="text-red-500">Error: {JSON.stringify(dashboardError)}</p>}
              {dashboardData && (
                <div>
                  <p className="text-green-500 mb-2">✅ API call successful!</p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
                    {JSON.stringify(dashboardData, null, 2)}
                  </pre>
                </div>
              )}
              
              <h4 className="text-md font-semibold mt-6 mb-4">Analytics API Test</h4>
              {analyticsLoading && <p>Loading...</p>}
              {analyticsError && <p className="text-red-500">Error: {JSON.stringify(analyticsError)}</p>}
              {analyticsData && (
                <div>
                  <p className="text-green-500 mb-2">✅ Analytics API call successful!</p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
                    {JSON.stringify(analyticsData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Jobs API Test</h3>
              {jobsLoading && <p>Loading...</p>}
              {jobsError && <p className="text-red-500">Error: {JSON.stringify(jobsError)}</p>}
              {jobsData && (
                <div>
                  <p className="text-green-500 mb-2">✅ API call successful!</p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
                    {JSON.stringify(jobsData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 