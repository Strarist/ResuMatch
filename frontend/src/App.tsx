import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, ThemeToggle } from './components/common';
import { AuthStatus } from './components/common/AuthStatus';
import { AppRoutes } from './routes';
import { useEffect, useState } from 'react';
import Logo from './components/common/Logo';
import { initializeAuth } from './lib/api';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    // Initialize authentication with test token
    initializeAuth();
    
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <>
      <div className="app-bg" />
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 animate-gradient-move text-black dark:text-white">
            <div className="fixed top-4 right-4 z-50">
              <ThemeToggle />
            </div>
            <div className="flex-1 w-full">
              <header className="flex items-center justify-between py-4 px-6 bg-white dark:bg-gray-900 shadow-md">
                <a href="/" className="flex items-center gap-3">
                  <Logo size={44} />
                  <span className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 drop-shadow-lg">ResuMatch AI</span>
                </a>
                <AuthStatus />
              </header>
              <AppRoutes />
            </div>
            <Toaster />
          </div>
        </Router>
      </QueryClientProvider>
    </>
  );
}

export default App;
