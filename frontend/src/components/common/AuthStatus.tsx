import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/auth';
import { auth } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

export const AuthStatus: React.FC = () => {
  const { user, isAuthenticated, logout, initialize } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex-1">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Not authenticated. Some features may not work.
          </p>
        </div>
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
      <div className="flex-1">
        <p className="text-sm text-green-800 dark:text-green-200">
          Logged in as <strong>{user?.email}</strong>
        </p>
        <p className="text-xs text-green-600 dark:text-green-300">
          Test user - Development mode
        </p>
      </div>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}; 