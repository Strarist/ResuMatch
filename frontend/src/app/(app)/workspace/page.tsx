'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { workspace, roadmap as roadmapApi } from '@/lib/intelligence-client';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { GlassPanel, SectionLabel, WorkspaceCard } from '@/components/workspace';
import { Plus, Send, Brain, HelpCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Message { id: string; role: string; content: string; created_at: string; }
interface Session { id: string; title: string; type: string; }
interface RealMilestone {
  skill: string;
  priority: string;
  effortWeeks: number;
  impactEstimate: number;
  reason: string;
  status: string;
}

export default function WorkspacePage() {
  const {
    simulationActive,
    roadmap,
    opportunities,
    activePersona,
    hasStrategicProfile,
    completeRoadmapNode,
  } = useLivingSystem();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [realRoadmap, setRealRoadmap] = useState<RealMilestone[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const fetchRealRoadmap = useCallback(async () => {
    if (simulationActive) return;
    try {
      const d = await roadmapApi.getState();
      if (d.state?.snapshot?.milestones) {
        setRealRoadmap(d.state.snapshot.milestones.map((m) => ({
          skill: m.skill,
          priority: m.priority || 'medium',
          effortWeeks: m.effort_weeks || 4,
          impactEstimate: m.impact_estimate || 80,
          reason: m.reason || '',
          status: m.status || 'active',
        })));
      }
    } catch { /* */ }
  }, [simulationActive]);

  useEffect(() => {
    fetchRealRoadmap();
  }, [fetchRealRoadmap, activeSession]);

  const displayRoadmap = simulationActive ? roadmap : realRoadmap;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch sessions on mount
  useEffect(() => {
    if (!simulationActive) {
      workspace.getSessions()
        .then((d) => {
          const s = d.sessions || [];
          setSessions(s);
          if (s.length > 0 && s[0]) setActiveSession(s[0].id);
        })
        .catch(() => null);
    } else {
      setSessions([{ id: 'sim-session', title: 'Strategic Career Plan', type: 'general' }]);
      setActiveSession('sim-session');
    }
  }, [simulationActive]);

  // Preloaded static message in fallback state
  const getContextualWelcomeMessage = useCallback(() => {
    if (!hasStrategicProfile) {
      return "Hello! I am your career mentor. I've initialized a personalized Career Advisory session for you.\n\nI am here to help you evaluate your career goals, build a clean upskilling learning plan, prepare for interviews, or check salary growth potentials in the current market. To get started with custom, real-world advice, feel free to ask a question or upload a resume to your portfolio!";
    }

    const gapsStr = displayRoadmap
      .filter((n) => n.status === 'active')
      .map((n) => `* **${n.skill}** (Priority: ${n.priority}) - *${n.reason}*`)
      .join('\n');

    const oppsStr = opportunities
      .slice(0, 2)
      .map((o) => `* **${o.company}** targeting **${o.title}** (${Math.round(o.alignmentScore * 100)}% match)`)
      .join('\n');

    return `Hello! I am your career mentor. I have carefully reviewed your profile as a **${activePersona.name}** and mapped out the best path forward.

Here is the current focus area we are targeting:
* **Target Role**: ${activePersona.targetRole}
* **Verified Skills**: ${activePersona.strongestSkills.slice(0, 3).join(', ') || 'None'}

**High-Priority Skill Gaps to Address**:
${gapsStr || 'No outstanding skill gaps detected.'}

**Recommended Job Pipelines**:
${oppsStr || 'No matched opportunities.'}

I can help you draft a custom learning plan, design portfolio projects to prove your skills, or prepare for technical interviews. What shall we focus on first to advance your career?`;
  }, [activePersona, displayRoadmap, opportunities, hasStrategicProfile]);

  // Fetch messages for active session
  useEffect(() => {
    if (!activeSession) return;

    if (activeSession === 'sim-session') {
      // Set simulated welcome message
      setMessages([
        {
          id: 'sim-welcome',
          role: 'assistant',
          content: getContextualWelcomeMessage(),
          created_at: new Date().toISOString(),
        },
      ]);
      return;
    }

    if (!activeSession) return;

    workspace.getSession(activeSession)
      .then((d) => setMessages(d.messages || []))
      .catch(() => null);
  }, [activeSession, simulationActive, getContextualWelcomeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createSession = async () => {
    if (simulationActive) {
      const newId = `sim-session-${Date.now()}`;
      setSessions(prev => [{ id: newId, title: 'New Career Strategy', type: 'general' }, ...prev]);
      setActiveSession(newId);
      setMessages([
        {
          id: `sim-welcome-${Date.now()}`,
          role: 'assistant',
          content: getContextualWelcomeMessage(),
          created_at: new Date().toISOString(),
        },
      ]);
      return;
    }

    try {
      const d = await workspace.createSession('Career Strategy');
      setSessions(prev => [{ id: d.id, title: d.title, type: d.type }, ...prev]);
      setActiveSession(d.id);
      setMessages([]);
    } catch {
      toast.error('Failed to create session.');
    }
  };

  const sendMessage = async (overrideContent?: string) => {
    const content = (overrideContent || input).trim();
    if (!content || sending) return;

    if (!overrideContent) {
      setInput('');
    }
    setSending(true);

    // Append user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    if (simulationActive || activeSession === 'sim-session') {
      // Simulate highly customized response
      await new Promise(resolve => setTimeout(resolve, 1000));

      let reply = '';
      const lowercaseContent = content.toLowerCase();

      // Find matching skill in roadmap to customize response
      const matchedSkill = roadmap.find(n => lowercaseContent.includes(n.skill.toLowerCase()) || n.skill.toLowerCase().split(' ')[0] && lowercaseContent.includes(nodeFirstWord(n.skill)));

      function nodeFirstWord(s: string) {
        return s.split(' ')[0]?.toLowerCase() || '';
      }

      if (matchedSkill) {
        reply = `Here is a customized strategic learning plan to bridge your **${matchedSkill.skill}** gap for the **${activePersona.targetRole}** role:

### 1. Curriculum Roadmap & Milestones (2-3 Weeks)
* **Core Concepts**: Study the design patterns, interface bindings, and standard configuration templates.
* **Practical Practice**: Build a standalone sandbox application (e.g. mock queries/routers or container orchestrations).
* **Telemetry Validation**: Measure throughput and document metrics changes compared to baseline standards.

### 2. High-Impact GitHub Project Proof
* Clone the target open-source repositories (e.g. Apollo Federation, HashiCorp plugins, or PyTorch models).
* Create a repository named \`skillyn-${matchedSkill.skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}\`.
* Code a functional proof, configure Github Actions validation tests, and write a structured README detailing performance stats.

### 3. Resume Proof Description
Add this statement to your portfolio experience block:
> *"Architected and deployed custom ${matchedSkill.skill} schema layers, optimizing transaction performance pipelines by up to 35%."*

*Tip: After you complete this project, click **"Mark Achieved"** on the Trajectory Roadmap tab to instantly update recruiter signal indices.*`;
      } else {
        reply = `I've analyzed your query regarding: "${content}".

As a **${activePersona.name}**, your trajectory is highly dependent on validating core platform requirements. To maximize your callback rate for companies like **${opportunities[0]?.company || 'target firms'}**:

1. Focus on resolving outstanding skill gaps like **${roadmap.find(n => n.status === 'active')?.skill || 'key stack requirements'}**.
2. Align portfolio proofs to show direct compensation-related outcomes (e.g. reduced cloud spend, higher inference speed).
3. Ask me to outline specific implementation details of any roadmap milestones.

Would you like me to draft a custom learning sprint or design a mock interview question matching your validated skills?`;
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
      setSending(false);
      return;
    }

    let targetSessionId = activeSession;
    if (!targetSessionId) {
      try {
        const d = await workspace.createSession('Career Strategy');
        setSessions(prev => [{ id: d.id, title: d.title, type: d.type }, ...prev]);
        targetSessionId = d.id;
        setActiveSession(d.id);
      } catch {
        setSending(false);
        return;
      }
    }

    try {
      const d = await workspace.sendMessage(targetSessionId!, content);
      setMessages(prev => {
        const filtered = prev.filter(m => !m.id.startsWith('temp-'));
        return [...filtered, { id: `user-${Date.now()}`, role: 'user', content, created_at: new Date().toISOString() }, d.message];
      });
    } catch {
      toast.error('Failed to get response from server.');
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
    }
    setSending(false);
  };

  // Generate suggested prompt chips dynamically from active gaps
  const activeGaps = displayRoadmap.filter((n) => n.status === 'active').slice(0, 3);
  const promptChips = activeGaps.map((node) => ({
    label: `Bridge ${node.skill}`,
    text: `How do I bridge my "${node.skill}" gap for the "${activePersona.targetRole}" trajectory? Please draft a structured learning sprint and suggest a portfolio project proof.`,
  }));

  // Add default prompt chips if no active gaps
  if (promptChips.length === 0) {
    promptChips.push(
      {
        label: 'Optimize Resume Summary',
        text: 'How can I optimize my professional summary section to align with recruiters hiring for Senior Roles?',
      },
      {
        label: 'Analyze Market Trends',
        text: `Tell me about salary metrics and demand growth trajectories for ${activePersona.targetRole} roles.`,
      }
    );
  }

  // Handle accepting a roadmap recommendation card in the Action Center
  const handleRecAction = async (recTitle: string, action: 'accept' | 'defer') => {
    if (simulationActive) {
      if (action === 'accept') {
        completeRoadmapNode(recTitle);
        toast.success(`Completed milestone: ${recTitle}`);
      } else {
        toast(`Deferred recommendation: ${recTitle}`);
      }
      return;
    }

    try {
      if (action === 'accept') {
        await roadmapApi.completeNode(recTitle);
      } else {
        await roadmapApi.deferNode(recTitle);
      }
      toast.success(`${action === 'accept' ? 'Completed' : 'Deferred'} milestone: ${recTitle}`);
      fetchRealRoadmap();
    } catch {
      toast.error(`Failed to update milestone: ${recTitle}`);
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-6.5rem)]">
      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0 font-sans">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h1 className="text-lg font-semibold text-white">AI Workspace</h1>
            <p className="text-xs text-white/40">Strategic career copilot & portfolio advisor</p>
          </div>
          <button
            onClick={createSession}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-400/20 bg-emerald-500/[0.06] rounded-lg hover:bg-emerald-500/[0.1] transition-colors"
          >
            <Plus size={12} /> New Session
          </button>
        </div>

        {/* Session tabs */}
        {sessions.length > 1 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 shrink-0">
            {sessions.slice(0, 5).map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                className={`px-3 py-1.5 text-[11px] rounded-lg whitespace-nowrap transition-colors ${
                  activeSession === s.id
                    ? 'bg-white/[0.08] text-white font-medium border border-white/[0.06]'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#080c14]/60 p-4 space-y-3.5 min-h-0">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed border ${
                m.role === 'user'
                  ? 'bg-emerald-500/10 text-white/90 border-emerald-500/20'
                  : 'bg-white/[0.02] text-slate-300 border-white/[0.05]'
              }`}>
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold uppercase tracking-wider mb-2 font-mono border-b border-white/[0.03] pb-1.5">
                    <Brain size={11} className="text-emerald-400" /> Strategic Career Copilot
                  </div>
                )}
                <div className="whitespace-pre-wrap font-sans font-medium">{m.content}</div>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Prompt Chips */}
        {hasStrategicProfile && (
          <div className="mt-3 space-y-1 shrink-0">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Suggested Prompts</span>
            <div className="flex flex-wrap gap-1.5">
              {promptChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(chip.text)}
                  disabled={sending}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all font-medium flex items-center gap-1.5 disabled:opacity-55"
                >
                  <HelpCircle size={10} /> {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 mt-3 shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={`Ask about bridging gaps for your ${activePersona.name} roadmap...`}
            className="flex-1 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/30 transition-colors font-sans"
            disabled={sending}
          />
          <button
            onClick={() => sendMessage()}
            disabled={sending || !input.trim()}
            className="px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs disabled:opacity-30 hover:bg-emerald-500/30 transition-colors flex items-center justify-center"
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Action Center Sidebar */}
      <div className="w-72 shrink-0 hidden lg:block overflow-y-auto font-sans h-full">
        <GlassPanel className="h-full flex flex-col">
          <SectionLabel>Roadmap Quick Actions</SectionLabel>
          <p className="text-[10px] text-slate-400 leading-relaxed mt-1 mb-3">
            Quickly resolve roadmap gaps directly from the workspace. Completing milestones updates matching metrics.
          </p>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {displayRoadmap.filter(node => node.status === 'active').map((rec, i) => (
              <WorkspaceCard key={i} className="p-3.5 space-y-2 border-white/[0.03] bg-white/[0.005]">
                <div className="flex items-center justify-between">
                  <span className={`text-[8px] px-1.5 py-0.2 rounded border uppercase font-mono font-bold ${
                    rec.priority === 'high'
                      ? 'border-red-500/20 text-red-400 bg-red-500/[0.04]'
                      : 'border-amber-500/20 text-amber-400 bg-amber-500/[0.04]'
                  }`}>
                    {rec.priority} Priority
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">Value: +{rec.impactEstimate} ROI</span>
                </div>
                <h5 className="text-[11px] font-bold text-white/90 leading-tight">{rec.skill}</h5>
                <p className="text-[10px] text-slate-400 leading-normal line-clamp-3">{rec.reason}</p>

                <div className="flex gap-2 pt-1 border-t border-white/[0.02]">
                  <button
                    onClick={() => handleRecAction(rec.skill, 'accept')}
                    className="flex-1 px-2.5 py-1 text-[9px] text-center text-emerald-400 border border-emerald-500/20 bg-emerald-500/[0.04] rounded hover:bg-emerald-500/[0.1] font-bold"
                  >
                    Mark Achieved
                  </button>
                  <button
                    onClick={() => handleRecAction(rec.skill, 'defer')}
                    className="px-2 py-1 text-[9px] text-center text-slate-400 border border-white/[0.05] rounded hover:bg-white/[0.03]"
                  >
                    Skip
                  </button>
                </div>
              </WorkspaceCard>
            ))}

            {displayRoadmap.filter(node => node.status === 'active').length === 0 && (
              <div className="p-4 border border-dashed border-white/[0.06] rounded-xl text-center py-8">
                <ShieldCheck size={20} className="text-emerald-400/60 mx-auto mb-2" />
                <p className="text-[10px] text-slate-500">No active gaps to resolve.</p>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
