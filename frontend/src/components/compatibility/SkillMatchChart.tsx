import React from 'react';

interface SkillMatchChartProps {
  matchedSkills: string[];
  missingSkills: string[];
}

export const SkillMatchChart = ({ matchedSkills, missingSkills }: SkillMatchChartProps) => {
  const total = matchedSkills.length + missingSkills.length;
  const matchedPercent = total ? (matchedSkills.length / total) * 100 : 0;
  const missingPercent = total ? (missingSkills.length / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex items-center mb-2">
        <span className="text-green-600 font-medium mr-2">Matched</span>
        <div className="flex-1 h-3 bg-green-200 rounded-full overflow-hidden mr-2">
          <div
            className="h-full bg-green-500"
            style={{ width: `${matchedPercent}%` }}
          />
        </div>
        <span className="text-sm">{matchedSkills.length}</span>
      </div>
      <div className="flex items-center">
        <span className="text-red-600 font-medium mr-2">Missing</span>
        <div className="flex-1 h-3 bg-red-200 rounded-full overflow-hidden mr-2">
          <div
            className="h-full bg-red-500"
            style={{ width: `${missingPercent}%` }}
          />
        </div>
        <span className="text-sm">{missingSkills.length}</span>
      </div>
    </div>
  );
}; 