import { motion } from 'framer-motion';
import { MatchCategory } from '../../../backend/app/schemas/compatibility';

interface RoleFitScoreProps {
  titleSimilarity: number;
  categoryMatch: number;
  overallScore: number;
  category: MatchCategory;
}

const getCategoryColor = (category: MatchCategory) => {
  switch (category) {
    case 'excellent':
      return 'bg-green-100 text-green-800';
    case 'good':
      return 'bg-blue-100 text-blue-800';
    case 'fair':
      return 'bg-yellow-100 text-yellow-800';
    case 'poor':
      return 'bg-red-100 text-red-800';
  }
};

const getCategoryEmoji = (category: MatchCategory) => {
  switch (category) {
    case 'excellent':
      return '🎯';
    case 'good':
      return '👍';
    case 'fair':
      return '🤔';
    case 'poor':
      return '⚠️';
  }
};

export const RoleFitScore = ({
  titleSimilarity,
  categoryMatch,
  overallScore,
  category
}: RoleFitScoreProps) => {
  return (
    <div className="space-y-6">
      {/* Overall Score Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getCategoryEmoji(category)}</span>
          <span className="text-lg font-medium capitalize">{category} Match</span>
        </div>
        <div className={`px-3 py-1 rounded-full ${getCategoryColor(category)}`}>
          {Math.round(overallScore * 100)}%
        </div>
      </div>

      {/* Title Similarity */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Title Similarity</span>
          <span className="text-sm font-medium">
            {Math.round(titleSimilarity * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${titleSimilarity * 100}%` }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Category Match */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Category Match</span>
          <span className="text-sm font-medium">
            {Math.round(categoryMatch * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${categoryMatch * 100}%` }}
            transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
          />
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Insights</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          {titleSimilarity < 0.6 && (
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">⚠️</span>
              Your current role title differs significantly from the job title
            </li>
          )}
          {categoryMatch < 0.6 && (
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">⚠️</span>
              Your experience category may not align with the job category
            </li>
          )}
          {overallScore >= 0.8 && (
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✅</span>
              Strong alignment with the role requirements
            </li>
          )}
          {overallScore >= 0.6 && overallScore < 0.8 && (
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">ℹ️</span>
              Good match, but could be improved with more relevant experience
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}; 