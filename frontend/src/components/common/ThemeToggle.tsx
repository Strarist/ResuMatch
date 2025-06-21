import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

export const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
    }
  }, []);

  return (
    <motion.button
      whileHover={{ scale: 1.1, boxShadow: isDark ? '0 0 16px #facc15' : '0 0 16px #2563eb' }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsDark(!isDark)}
      className="relative p-2 rounded-full bg-white/30 dark:bg-gray-900/40 shadow-2xl border border-white/30 dark:border-gray-700/40 backdrop-blur-md transition-colors duration-300 flex items-center justify-center"
      aria-label="Toggle theme"
      style={{ width: 44, height: 44 }}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.4 }}
        className="w-7 h-7 flex items-center justify-center"
      >
        {isDark ? (
          <MoonIcon className="w-7 h-7 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
        ) : (
          <SunIcon className="w-7 h-7 text-blue-500 drop-shadow-[0_0_8px_rgba(37,99,235,0.7)]" />
        )}
      </motion.div>
      <span className="sr-only">Toggle theme</span>
    </motion.button>
  );
};

// Example usage:
// <ThemeToggle /> 