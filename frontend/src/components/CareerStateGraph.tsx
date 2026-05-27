'use client';

import React from 'react';

export function CareerStateGraph({ metrics }: { metrics: { recruiterConfidence?: number } }) {
  return (
    <div className="p-4 border border-gray-800 rounded-lg bg-black text-white">
      <h3 className="text-lg font-bold mb-4">Intelligence Propagation Graph</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 border border-gray-800 rounded bg-gray-900/50">
          <p className="text-gray-500 mb-1">Portfolio Maturity</p>
          <p className="font-bold text-green-400">Production-Grade</p>
        </div>
        <div className="flex items-center justify-center text-gray-500">
          Propagates to &rarr;
        </div>
        <div className="p-3 border border-gray-800 rounded bg-gray-900/50">
          <p className="text-gray-500 mb-1">Recruiter Confidence</p>
          <p className="font-bold text-blue-400">{metrics.recruiterConfidence || 87.0}%</p>
        </div>
      </div>
    </div>
  );
}
