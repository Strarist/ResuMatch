'use client';

import React from 'react';

export function IntelligenceTimeline({ history }: { history: { matchScore: number[], careerVelocity: number[] } }) {
  if (!history || !history.matchScore) return null;

  return (
    <div className="p-4 border border-gray-800 rounded-lg bg-black text-white">
      <h3 className="text-lg font-bold mb-4">Longitudinal Intelligence Timeline</h3>
      <div className="h-32 flex items-end space-x-2">
        {history.careerVelocity.map((val, idx) => (
          <div key={idx} className="flex-1 bg-blue-900/50 hover:bg-blue-600 rounded-t-sm transition-all" style={{ height: `${val}%` }} title={`Velocity: ${val}`}></div>
        ))}
      </div>
      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span>T-90 Days</span>
        <span>Current</span>
      </div>
    </div>
  );
}
