import { motion } from 'framer-motion';
import { MatchCategory } from '../../../backend/app/schemas/compatibility';

interface ImprovementSuggestionsProps {
  suggestions: string[];
  category: MatchCategory;
}

const getCategoryColor = (category: MatchCategory) => {
  switch (category) {
    case 'excellent':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'good':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'fair':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'poor':
      return 'bg-red-100 text-red-800 border-red-200';
  }
};

const getCategoryIcon = (category: MatchCategory) => {
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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

export const ImprovementSuggestions = ({
  suggestions,
  category
}: ImprovementSuggestionsProps) => {
  return (
    <div className={`p-6 rounded-lg border ${getCategoryColor(category)}`}>
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">{getCategoryIcon(category)}</span>
        <div>
          <h3 className="text-lg font-medium capitalize">{category} Match</h3>
          <p className="text-sm opacity-75">
            {category === 'excellent' && 'Your resume is well-aligned with the job requirements!'}
            {category === 'good' && 'Your resume is a good match, but could be improved.'}
            {category === 'fair' && 'Your resume needs some improvements to better match the job.'}
            {category === 'poor' && 'Your resume needs significant improvements to match the job.'}
          </p>
        </div>
      </div>

      <motion.ul
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {suggestions.map((suggestion, index) => (
          <motion.li
            key={index}
            variants={item}
            className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg"
          >
            <span className="text-blue-500 mt-1">💡</span>
            <span className="text-sm">{suggestion}</span>
          </motion.li>
        ))}
      </motion.ul>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6"
      >
        <button
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors
            ${category === 'excellent'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : category === 'good'
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          onClick={() => {
            // TODO: Implement guided resume improvement
            console.log('Improve resume clicked');
          }}
        >
          {category === 'excellent'
            ? 'View Detailed Analysis'
            : 'Get Guided Improvements'}
        </button>
      </motion.div>
    </div>
  );
}; 