import { motion } from 'framer-motion';

interface ExperienceTimelineProps {
  yearsMatch: number;
  roleRelevance: number;
  requiredYears: number;
  actualYears: number;
  gaps?: string[];
}

export const ExperienceTimeline = ({
  yearsMatch,
  roleRelevance,
  requiredYears,
  actualYears,
  gaps
}: ExperienceTimelineProps) => {
  const yearsDiff = requiredYears - actualYears;
  const isOverQualified = yearsDiff < 0;

  return (
    <div className="space-y-6">
      {/* Years Experience */}
      <div className="relative">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Years of Experience</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {actualYears.toFixed(1)} years
            </span>
            <span className="text-sm text-gray-500">/</span>
            <span className="text-sm text-gray-500">
              {requiredYears.toFixed(1)} required
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
          {/* Required years marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
            style={{ left: `${(requiredYears / Math.max(requiredYears, actualYears)) * 100}%` }}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
              Required
            </div>
          </div>

          {/* Actual years progress */}
          <motion.div
            className="absolute top-0 bottom-0 bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${(actualYears / Math.max(requiredYears, actualYears)) * 100}%` }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </div>

        {/* Years match badge */}
        <div className="mt-2 flex justify-end">
          <div
            className={`px-2 py-1 rounded text-xs font-medium ${
              yearsMatch >= 0.8
                ? 'bg-green-100 text-green-800'
                : yearsMatch >= 0.6
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {Math.round(yearsMatch * 100)}% Match
          </div>
        </div>
      </div>

      {/* Role Relevance */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Role Relevance</span>
          <span className="text-sm font-medium">
            {Math.round(roleRelevance * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${roleRelevance * 100}%` }}
            transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
          />
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Experience Insights</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          {isOverQualified ? (
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✅</span>
              You exceed the required experience by {Math.abs(yearsDiff).toFixed(1)} years
            </li>
          ) : yearsDiff > 0 ? (
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">⚠️</span>
              {yearsDiff.toFixed(1)} more years of experience would be ideal
            </li>
          ) : (
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✅</span>
              Your experience matches the requirements
            </li>
          )}

          {roleRelevance < 0.6 && (
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">⚠️</span>
              Your current role responsibilities may not fully align with the job
            </li>
          )}

          {gaps?.map((gap, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-500 mr-2">💡</span>
              {gap}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}; 