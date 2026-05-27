"use client";

import React, { useState } from 'react';
import { Network } from 'lucide-react';

export function AdaptiveInfluenceGraph() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes = [
    { id: 'portfolio', label: 'Portfolio Proof', x: 10, y: 50 },
    { id: 'recruiter', label: 'Recruiter Trust', x: 40, y: 30 },
    { id: 'opportunity', label: 'Opportunity Expansion', x: 40, y: 70 },
    { id: 'salary', label: 'Salary Trajectory', x: 70, y: 30 },
    { id: 'roadmap', label: 'Roadmap Priorities', x: 70, y: 70 },
  ];

  const edges = [
    { source: 'portfolio', target: 'recruiter' },
    { source: 'portfolio', target: 'opportunity' },
    { source: 'recruiter', target: 'salary' },
    { source: 'opportunity', target: 'roadmap' },
  ];

  const isConnected = (id1: string, id2: string) => {
    return edges.some(e => (e.source === id1 && e.target === id2) || (e.source === id2 && e.target === id1));
  };

  return (
    <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-6 shadow-xl h-full flex flex-col relative overflow-hidden group">
      <h3 className="text-sm font-medium uppercase tracking-wider text-white/60 mb-6 flex items-center gap-2">
        <Network size={14} />
        Intelligence Graph
      </h3>

      <div className="flex-grow relative min-h-[220px]">
        {/* DOM-based graph for high performance without heavy libraries */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {edges.map((edge, i) => {
            const s = nodes.find(n => n.id === edge.source);
            const t = nodes.find(n => n.id === edge.target);
            if (!s || !t) return null;

            const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
            const opacity = hoveredNode ? (isHighlighted ? 0.8 : 0.1) : 0.3;
            const strokeWidth = isHighlighted ? 2 : 1;

            return (
              <line
                key={i}
                x1={`${s.x}%`} y1={`${s.y}%`}
                x2={`${t.x}%`} y2={`${t.y}%`}
                stroke="#60a5fa"
                strokeOpacity={opacity}
                strokeWidth={strokeWidth}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {nodes.map(node => {
          const isHighlighted = hoveredNode === node.id || (hoveredNode && isConnected(hoveredNode, node.id));
          const opacity = hoveredNode ? (isHighlighted ? 1 : 0.2) : 1;

          return (
            <div
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-crosshair transition-all duration-300"
              style={{ left: `${node.x}%`, top: `${node.y}%`, opacity }}
            >
              <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-medium whitespace-nowrap ${
                isHighlighted
                  ? 'bg-blue-900/40 border-blue-500 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-black border-white/20 text-white/70'
              }`}>
                {node.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Hover Details */}
      <div className="h-8 mt-2 text-xs text-white/40 flex items-center justify-center">
        {hoveredNode ? (
          <span className="animate-fade-in">Tracing propagation paths for: <strong className="text-white">{nodes.find(n => n.id === hoveredNode)?.label}</strong></span>
        ) : (
          <span>Hover nodes to trace systemic propagation impacts.</span>
        )}
      </div>
    </div>
  );
}
