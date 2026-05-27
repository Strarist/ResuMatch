"use client";

import React from 'react';
import { History } from 'lucide-react';

export function LongitudinalTimeline() {
  const shifts = [
    {
      date: "May 20",
      type: "Strategic Convergence",
      before: "Fragmented Specialization",
      after: "Focused Platform Engineering",
      impact: "High Leverage"
    },
    {
      date: "May 22",
      type: "Recruiter Breakthrough",
      before: "Visibility: Low",
      after: "Visibility: Competitive",
      impact: "Recruiter Signal Spike"
    },
    {
      date: "May 26",
      type: "Opportunity Expansion",
      before: "Backend Engineer matches",
      after: "Infrastructure AI Engineer paths unlocked",
      impact: "Market Alignment Jump"
    }
  ];

  return (
    <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-6 shadow-xl h-full">
      <h3 className="text-sm font-medium uppercase tracking-wider text-white/60 mb-6 flex items-center gap-2">
        <History size={14} />
        Longitudinal Career Timeline
      </h3>

      <div className="space-y-6">
        {shifts.map((shift, idx) => (
          <div key={idx} className="relative pl-6 border-l border-white/10">
            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#0c0c0c] border-2 border-white/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            </div>

            <div className="flex justify-between items-start mb-2 -mt-1">
              <div>
                <span className="text-[10px] text-white/40 font-mono tracking-wider">{shift.date}</span>
                <h4 className="text-sm font-semibold text-white/90">{shift.type}</h4>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-sm">
                {shift.impact}
              </span>
            </div>

            <div className="bg-black border border-white/[0.05] rounded-lg p-3 text-xs grid grid-cols-2 gap-2">
              <div className="border-r border-white/10 pr-2">
                <span className="block text-white/30 text-[10px] uppercase mb-1">Before</span>
                <span className="text-white/60 line-through decoration-red-500/50">{shift.before}</span>
              </div>
              <div className="pl-2">
                <span className="block text-white/30 text-[10px] uppercase mb-1">After</span>
                <span className="text-emerald-400 font-medium">{shift.after}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
