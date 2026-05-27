"use client";

import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

type Explanation = {
  id: string;
  explanation_type: string;
  affected_domain: string;
  reasoning_summary: string;
  confidence_score: string;
  impact_delta: string;
  created_at: string;
};

export function IntelligenceMutationFeed() {
  const [feed, setFeed] = useState<Explanation[]>([]);

  useEffect(() => {
    const fetchExplanations = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/intelligence/explanations?limit=5`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        setFeed(data || []);
      } catch {
        console.error("Failed to fetch explanations");
      }
    };
    fetchExplanations();
  }, []);

  return (
    <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-6 shadow-xl h-full flex flex-col">
      <h3 className="text-sm font-medium uppercase tracking-wider text-white/60 mb-6 flex items-center gap-2">
        <Activity size={14} />
        Intelligence Mutations
      </h3>

      <div className="space-y-6 overflow-y-auto pr-2 flex-grow">
        {feed.length === 0 ? (
          <div className="text-sm text-white/30 text-center py-8">Awaiting operational telemetry...</div>
        ) : (
          feed.map((item) => (
            <div key={item.id} className="relative pl-4 border-l border-white/10">
              <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-black border-2 border-blue-500" />

              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{item.affected_domain.replace('_', ' ')} Updated</span>
                <span className={`text-xs font-semibold ${item.impact_delta?.includes('+') ? 'text-emerald-400' : 'text-white/60'}`}>
                  {item.impact_delta}
                </span>
              </div>

              <p className="text-xs text-white/50 leading-relaxed mb-2">
                {item.reasoning_summary}
              </p>

              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/30 font-mono">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={10} className={
                    item.confidence_score === 'high' ? 'text-emerald-400' :
                    item.confidence_score === 'medium' ? 'text-amber-400' : 'text-red-400'
                  } />
                  {item.confidence_score} confidence
                </span>
                <span>•</span>
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
