import { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { CompatibilityReport } from '../../../backend/app/schemas/compatibility';

interface CompatibilityRadarProps {
  report: CompatibilityReport;
}

interface Dimension {
  name: string;
  value: number;
  description: string;
  icon: string;
}

export const CompatibilityRadar = ({ report }: CompatibilityRadarProps) => {
  const [activeDimension, setActiveDimension] = useState<Dimension | null>(null);

  // Transform report data into radar dimensions
  const dimensions: Dimension[] = [
    {
      name: 'Skills',
      value: report.average_skill_score * 100,
      description: `${report.matched_skills_count} skills matched, ${report.missing_skills_count} missing`,
      icon: '💡'
    },
    {
      name: 'Role Fit',
      value: report.role_match.overall_score * 100,
      description: `Title similarity: ${Math.round(report.role_match.title_similarity * 100)}%, Category match: ${Math.round(report.role_match.category_match * 100)}%`,
      icon: '🎯'
    },
    {
      name: 'Experience',
      value: report.experience_match.overall_score * 100,
      description: `${report.experience_match.actual_years.toFixed(1)} years vs ${report.experience_match.required_years.toFixed(1)} required`,
      icon: '⏳'
    },
    {
      name: 'Education',
      value: 85, // TODO: Add education match to backend
      description: 'Education level and field alignment',
      icon: '🎓'
    },
    {
      name: 'Overall',
      value: report.overall_score * 100,
      description: `Overall match: ${report.category}`,
      icon: '📊'
    }
  ];

  const data = dimensions.map(d => ({
    ...d,
    fullMark: 100
  }));

  return (
    <div className="relative">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="80%"
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="name"
              tick={({ payload, x, y, textAnchor }) => (
                <g
                  transform={`translate(${x},${y})`}
                  onMouseEnter={() => setActiveDimension(dimensions.find(d => d.name === payload.value) || null)}
                  onMouseLeave={() => setActiveDimension(null)}
                  className="cursor-pointer"
                >
                  <text
                    x={0}
                    y={0}
                    dy={16}
                    textAnchor={textAnchor}
                    fill="#4b5563"
                    className="text-sm font-medium"
                  >
                    {payload.value}
                  </text>
                </g>
              )}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tickCount={6}
              tickFormatter={(value) => `${value}%`}
              stroke="#9ca3af"
            />
            <Radar
              name="Match Score"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              animationDuration={2000}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {activeDimension && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-0 right-0 w-64 p-4 bg-white rounded-lg shadow-lg border border-gray-200"
          >
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">{activeDimension.icon}</span>
              <h3 className="text-lg font-medium">{activeDimension.name}</h3>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${activeDimension.value}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-gray-600">{activeDimension.description}</p>
            
            {/* Additional insights based on dimension */}
            {activeDimension.name === 'Skills' && report.skill_matches.length > 0 && (
              <div className="mt-2 text-sm">
                <div className="font-medium text-gray-700">Top Skills:</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {report.skill_matches
                    .filter(s => s.is_matched)
                    .slice(0, 3)
                    .map(skill => (
                      <span
                        key={skill.name}
                        className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {skill.name}
                      </span>
                    ))}
                </div>
              </div>
            )}
            
            {activeDimension.name === 'Role Fit' && report.role_match.overall_score < 0.8 && (
              <div className="mt-2 text-sm text-yellow-600">
                Consider highlighting more relevant responsibilities
              </div>
            )}
            
            {activeDimension.name === 'Experience' && report.experience_match.gaps && (
              <div className="mt-2 text-sm">
                <div className="font-medium text-gray-700">Gaps to Address:</div>
                <ul className="mt-1 space-y-1">
                  {report.experience_match.gaps.map((gap, index) => (
                    <li key={index} className="text-yellow-600">• {gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 