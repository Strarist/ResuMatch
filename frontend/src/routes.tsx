import { Routes, Route, Navigate } from 'react-router-dom';
import { PageTransition } from './components/common';
import { useAuthStore } from './store/auth';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Resumes from './pages/resumes/Resumes';
import Jobs from './pages/jobs/Jobs';
import Analysis from './pages/analysis/Analysis';
import Profile from './pages/profile/Profile';
import { TestAPI } from './pages/TestAPI';
import { Debug } from './pages/Debug';
import { TestScoreBadge } from './pages/TestScoreBadge';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

export const AppRoutes = () => {
  return (
    <Layout>
      <PageTransition>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/debug" element={<Debug />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resumes"
            element={
              <ProtectedRoute>
                <Resumes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis"
            element={
              <ProtectedRoute>
                <Analysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test-api"
            element={
              <ProtectedRoute>
                <TestAPI />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test-score-badge"
            element={
              <ProtectedRoute>
                <TestScoreBadge />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </Layout>
  );
}; 