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
import { CompatibilityReport } from '../../types/compatibility';
import React from 'react';
import { cn } from '../../utils';

interface CompatibilityRadarProps {
  report: CompatibilityReport;
}

interface Dimension {
  name: string;
  value: number;
  description: string;
  icon: string;
}

interface RadarChartProps {
  data: {
    label: string;
    value: number;
    maxValue?: number;
  }[];
  size?: number;
  className?: string;
  color?: string;
  showLabels?: boolean;
  showValues?: boolean;
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
            {activeDimension.name === 'Skills' && Array.isArray(report.skill_matches) && report.skill_matches.length > 0 && (
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

export const CustomRadarChart: React.FC<RadarChartProps> = ({
  data,
  size = 300,
  className = '',
  color = '#3b82f6',
  showLabels = true,
  showValues = true,
}) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = Math.min(centerX, centerY) - 40;

  const generatePolygonPoints = (values: number[]) => {
    const points = values.map((value, index) => {
      const angle = (index * 2 * Math.PI) / values.length - Math.PI / 2;
      const r = (value / 100) * radius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      return `${x},${y}`;
    });
    return points.join(' ');
  };

  const generateGridPoints = (levels: number) => {
    const gridPoints = [];
    for (let i = 1; i <= levels; i++) {
      const values = data.map(() => (i / levels) * 100);
      gridPoints.push(generatePolygonPoints(values));
    }
    return gridPoints;
  };

  const values = data.map(d => d.value);
  const gridPoints = generateGridPoints(5);

  return (
    <div className={cn('relative', className)}>
      <svg width={size} height={size} className="mx-auto">
        {/* Grid circles */}
        {gridPoints.map((points, index) => (
          <polygon
            key={index}
            points={points}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
            className="dark:stroke-gray-600"
          />
        ))}

        {/* Axis lines */}
        {data.map((_, index) => {
          const angle = (index * 2 * Math.PI) / data.length - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              className="dark:stroke-gray-600"
            />
          );
        })}

        {/* Data polygon */}
        <motion.polygon
          points={generatePolygonPoints(values)}
          fill={color}
          fillOpacity="0.2"
          stroke={color}
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />

        {/* Data points */}
        {values.map((value, index) => {
          const angle = (index * 2 * Math.PI) / values.length - Math.PI / 2;
          const r = (value / 100) * radius;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          return (
            <motion.circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill={color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            />
          );
        })}

        {/* Labels */}
        {showLabels && data.map((item, index) => {
          const angle = (index * 2 * Math.PI) / data.length - Math.PI / 2;
          const x = centerX + (radius + 20) * Math.cos(angle);
          const y = centerY + (radius + 20) * Math.sin(angle);
          const textAnchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : 
                           Math.cos(angle) > 0 ? 'start' : 'end';
          const dominantBaseline = Math.abs(Math.sin(angle)) < 0.1 ? 'middle' : 
                                 Math.sin(angle) > 0 ? 'hanging' : 'auto';
          
          return (
            <text
              key={index}
              x={x}
              y={y}
              textAnchor={textAnchor}
              dominantBaseline={dominantBaseline}
              className="text-xs font-medium fill-gray-700 dark:fill-gray-300"
            >
              {item.label}
            </text>
          );
        })}

        {/* Values */}
        {showValues && values.map((value, index) => {
          const angle = (index * 2 * Math.PI) / values.length - Math.PI / 2;
          const r = (value / 100) * radius;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          
          return (
            <text
              key={index}
              x={x}
              y={y - 8}
              textAnchor="middle"
              className="text-xs font-bold fill-gray-900 dark:fill-white"
            >
              {Math.round(value)}%
            </text>
          );
        })}
      </svg>
    </div>
  );
}; 