import React from 'react';
import { ScoreBadge, ScoreBadgeSimple } from '../components/common/ScoreBadge';

export const TestScoreBadge: React.FC = () => {
  const testScores = [25, 45, 65, 85, 95];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          ScoreBadge Component Test
        </h1>
        
        {/* Animated ScoreBadge Examples */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Animated ScoreBadge (with Framer Motion)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testScores.map((score) => (
              <div key={score} className="flex flex-col items-center space-y-2">
                <ScoreBadge score={score} size="lg" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Score: {score}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Different Sizes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Different Sizes
          </h2>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <ScoreBadge score={85} size="sm" />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Small</p>
            </div>
            <div className="text-center">
              <ScoreBadge score={85} size="md" />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Medium</p>
            </div>
            <div className="text-center">
              <ScoreBadge score={85} size="lg" />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Large</p>
            </div>
          </div>
        </div>

        {/* Simple Version (No Animations) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Simple ScoreBadge (No Animations - Performance Optimized)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testScores.map((score) => (
              <div key={score} className="flex flex-col items-center space-y-2">
                <ScoreBadgeSimple score={score} size="md" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Score: {score}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Color Range Test */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Color Range Test (0-100)
          </h2>
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 11 }, (_, i) => i * 10).map((score) => (
              <div key={score} className="flex flex-col items-center space-y-2">
                <ScoreBadge score={score} size="sm" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {score}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 