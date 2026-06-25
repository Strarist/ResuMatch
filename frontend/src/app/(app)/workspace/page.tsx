'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { workspace, roadmap as roadmapApi } from '@/lib/intelligence-client';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { GlassPanel, SectionLabel, WorkspaceCard } from '@/components/workspace';
import { CoachMessageContent } from '@/components/workspace/CoachMessageContent';
import { Plus, Send, Brain, HelpCircle, ShieldCheck, Pin, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Message { id: string; role: string; content: string; created_at: string; }
interface Session { id: string; title: string; type: string; pinned?: boolean; }
interface RealMilestone {
  skill: string;
  priority: string;
  effortWeeks: number;
  impactEstimate: number;
  reason: string;
  status: string;
}

const SESSION_STORAGE_KEY = 'skillyn:active-workspace-session';

function isPendingReply(msgs: Message[]): boolean {
  if (!msgs.length) return false;
  return msgs[msgs.length - 1]?.role === 'user';
}

function autoTitleFromMessage(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 40) return trimmed;
  return `${trimmed.slice(0, 40).trim()}…`;
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
  const [sessionsFetchError, setSessionsFetchError] = useState(false);
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
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSimSession = Boolean(simulationActive && activeSession?.startsWith('sim-'));

  const loadSessions = useCallback(async () => {
    if (simulationActive) {
      setSessions([{ id: 'sim-session', title: 'Strategic Career Plan', type: 'general' }]);
      setActiveSession('sim-session');
      setSessionsFetchError(false);
      return;
    }

    setSessionsFetchError(false);
    try {
      const d = await workspace.getSessions();
      const s = d.sessions || [];
      setSessions(s);
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_STORAGE_KEY) : null;
      const storedSession = stored ? s.find((item) => item.id === stored) : null;
      if (storedSession) {
        setActiveSession(storedSession.id);
      } else if (s.length > 0 && s[0]) {
        setActiveSession(s[0].id);
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Failed to load workspace sessions:', err);
      setSessionsFetchError(true);
      setActiveSession(null);
    }
  }, [simulationActive]);

  const coachModeLabel = isSimSession
    ? 'Simulation'
    : activeSession
      ? 'Live AI'
      : 'Offline';

  // Fetch sessions on mount
  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const onSandboxExit = () => {
      void loadSessions();
    };
    window.addEventListener('skillyn:sandbox-exit', onSandboxExit);
    return () => window.removeEventListener('skillyn:sandbox-exit', onSandboxExit);
  }, [loadSessions]);

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

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    const d = await workspace.getSession(sessionId);
    const loaded = d.messages || [];
    setMessages(loaded);
    return loaded;
  }, []);

  const startPendingPoll = useCallback((sessionId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setAwaitingReply(true);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const loaded = await loadSessionMessages(sessionId);
        if (!isPendingReply(loaded) || attempts >= 40) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setAwaitingReply(false);
          setSending(false);
        }
      } catch {
        if (attempts >= 40) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setAwaitingReply(false);
          setSending(false);
        }
      }
    }, 3000);
  }, [loadSessionMessages]);

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

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, activeSession);
    }

    loadSessionMessages(activeSession)
      .then((loaded) => {
        if (isPendingReply(loaded)) {
          startPendingPoll(activeSession);
        }
      })
      .catch(() => null);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [activeSession, simulationActive, getContextualWelcomeMessage, loadSessionMessages, startPendingPoll]);

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
      const d = await workspace.createSession('New chat');
      setSessions(prev => [{ id: d.id, title: d.title, type: d.type, pinned: false }, ...prev]);
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

    if (isSimSession) {
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
    let isNewSession = false;
    if (!targetSessionId) {
      try {
        const d = await workspace.createSession('New chat');
        setSessions(prev => [{ id: d.id, title: d.title, type: d.type, pinned: false }, ...prev]);
        targetSessionId = d.id;
        setActiveSession(d.id);
        isNewSession = true;
      } catch {
        setSending(false);
        return;
      }
    }

    const sessionMeta = sessions.find((s) => s.id === targetSessionId);
    const shouldAutoTitle = isNewSession || sessionMeta?.title === 'New chat' || sessionMeta?.title === 'Career Strategy';

    try {
      await workspace.sendMessage(targetSessionId!, content);
      const loaded = await loadSessionMessages(targetSessionId!);
      if (isPendingReply(loaded)) {
        startPendingPoll(targetSessionId!);
      } else {
        setAwaitingReply(false);
      }
      if (shouldAutoTitle) {
        const newTitle = autoTitleFromMessage(content);
        workspace.updateSession(targetSessionId!, { title: newTitle })
          .then((updated) => {
            setSessions((prev) => prev.map((s) => (s.id === updated.id ? { ...s, title: updated.title } : s)));
          })
          .catch(() => null);
      }
    } catch {
      startPendingPoll(targetSessionId!);
      toast.error('Response is still generating — check back shortly.');
    }
    setSending(false);
  };

  const handleRenameSession = async (sessionId: string) => {
    const current = sessions.find((s) => s.id === sessionId);
    const next = window.prompt('Rename session', current?.title || 'New chat');
    if (!next?.trim()) return;
    try {
      const updated = await workspace.updateSession(sessionId, { title: next.trim() });
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title: updated.title } : s)));
    } catch {
      toast.error('Failed to rename session.');
    }
    setMenuSessionId(null);
  };

  const handlePinSession = async (sessionId: string, pinned: boolean) => {
    try {
      const updated = await workspace.updateSession(sessionId, { pinned });
      setSessions((prev) => {
        const next = prev.map((s) => (s.id === sessionId ? { ...s, pinned: updated.pinned } : s));
        return [...next].sort((a, b) => Number(b.pinned) - Number(a.pinned));
      });
    } catch {
      toast.error('Failed to update pin.');
    }
    setMenuSessionId(null);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Delete this session and all its messages?')) return;
    try {
      await workspace.deleteSession(sessionId);
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== sessionId);
        if (activeSession === sessionId) {
          setActiveSession(next[0]?.id ?? null);
        }
        return next;
      });
      if (activeSession === sessionId) setMessages([]);
    } catch {
      toast.error('Failed to delete session.');
    }
    setMenuSessionId(null);
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
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-text">AI Workspace</h1>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                isSimSession
                  ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                  : coachModeLabel === 'Live AI'
                    ? 'text-success border-success/30 bg-success/10'
                    : 'text-text-tertiary border-border bg-surface-inset'
              }`}>
                {coachModeLabel}
              </span>
            </div>
            <p className="text-xs text-text-secondary">Strategic career copilot & portfolio advisor</p>
          </div>
          <button
            onClick={createSession}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-success border border-success/25 bg-success/10 rounded-lg hover:bg-success/15 transition-colors"
          >
            <Plus size={12} /> New Session
          </button>
        </div>

        {sessionsFetchError && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            <span>Could not load AI Coach sessions. Check that the backend is running.</span>
            <button
              type="button"
              onClick={() => void loadSessions()}
              className="shrink-0 rounded-md border border-rose-400/40 px-2 py-1 font-semibold text-rose-100 hover:bg-rose-500/20"
            >
              Retry
            </button>
          </div>
        )}

        {/* Session tabs */}
        {sessions.length > 1 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 shrink-0">
            {sessions.slice(0, 5).map(s => (
              <div key={s.id} className="relative flex items-center">
                <button
                  onClick={() => setActiveSession(s.id)}
                  className={`px-3 py-1.5 text-[11px] rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                    activeSession === s.id
                      ? 'bg-surface-overlay text-text font-medium border border-border'
                      : 'text-text-secondary hover:text-text hover:bg-surface-inset'
                  }`}
                >
                  {s.pinned && <Pin size={10} className="text-success" />}
                  {s.title}
                </button>
                <button
                  onClick={() => setMenuSessionId(menuSessionId === s.id ? null : s.id)}
                  className="ml-0.5 p-1 rounded hover:bg-surface-inset text-text-tertiary"
                  aria-label="Session options"
                >
                  <MoreVertical size={12} />
                </button>
                {menuSessionId === s.id && (
                  <div className="absolute top-full left-0 mt-1 z-20 min-w-[140px] rounded-lg border border-border bg-surface-raised shadow-lg py-1">
                    <button onClick={() => handleRenameSession(s.id)} className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-surface-inset flex items-center gap-2">
                      <Pencil size={11} /> Rename
                    </button>
                    <button onClick={() => handlePinSession(s.id, !s.pinned)} className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-surface-inset flex items-center gap-2">
                      <Pin size={11} /> {s.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button onClick={() => handleDeleteSession(s.id)} className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-surface-inset text-red-400 flex items-center gap-2">
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-surface-raised/60 p-4 space-y-3.5 min-h-0">
          {messages.length === 0 && !sending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed border bg-surface-inset text-text-secondary border-border">
                <div className="flex items-center gap-1 text-[9px] text-success font-bold uppercase tracking-wider mb-2 font-mono border-b border-border-subtle pb-1.5">
                  <Brain size={11} className="text-success" /> Strategic Career Copilot
                </div>
                <CoachMessageContent content={getContextualWelcomeMessage()} role="assistant" />
              </div>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed border ${
                m.role === 'user'
                  ? 'bg-success/10 text-text border-success/20'
                  : 'bg-surface-inset text-text-secondary border-border'
              }`}>
                {m.role === 'assistant' && (
                  <div className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider mb-2 font-mono border-b border-border-subtle pb-1.5 ${
                    m.content.startsWith('[Fallback]') ? 'text-amber-400' : 'text-success'
                  }`}>
                    <Brain size={11} className={m.content.startsWith('[Fallback]') ? 'text-amber-400' : 'text-success'} />
                    {m.content.startsWith('[Fallback]') ? 'Cached Fallback' : 'Strategic Career Copilot'}
                  </div>
                )}
                <CoachMessageContent content={m.content} role={m.role as 'user' | 'assistant'} />
              </div>
            </div>
          ))}
          {(sending || awaitingReply) && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-xl bg-surface-inset border border-border">
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
            <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-wider block">Suggested Prompts</span>
            <div className="flex flex-wrap gap-1.5">
              {promptChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(chip.text)}
                  disabled={sending}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-success/5 border border-success/15 text-success hover:bg-success/10 hover:border-success/25 transition-all font-medium flex items-center gap-1.5 disabled:opacity-55"
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
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-surface-inset text-xs text-text placeholder:text-text-tertiary focus:outline-none focus:border-success/40 transition-colors font-sans"
            disabled={sending}
          />
          <button
            onClick={() => sendMessage()}
            disabled={sending || !input.trim()}
            className="px-4 py-3 bg-success/15 border border-success/30 text-success rounded-xl text-xs disabled:opacity-30 hover:bg-success/25 transition-colors flex items-center justify-center"
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
          <p className="text-[10px] text-text-secondary leading-relaxed mt-1 mb-3">
            Quickly resolve roadmap gaps directly from the workspace. Completing milestones updates matching metrics.
          </p>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {displayRoadmap.filter(node => node.status === 'active').map((rec, i) => (
              <WorkspaceCard key={i} className="p-3.5 space-y-2 border-border-subtle bg-surface-inset">
                <div className="flex items-center justify-between">
                  <span className={`text-[8px] px-1.5 py-0.2 rounded border uppercase font-mono font-bold ${
                    rec.priority === 'high'
                      ? 'border-red-500/20 text-red-400 bg-red-500/[0.04]'
                      : 'border-amber-500/20 text-amber-400 bg-amber-500/[0.04]'
                  }`}>
                    {rec.priority} Priority
                  </span>
                  <span className="text-[8px] text-text-tertiary font-mono">Value: +{rec.impactEstimate} ROI</span>
                </div>
                <h5 className="text-[11px] font-bold text-text leading-tight">{rec.skill}</h5>
                <p className="text-[10px] text-text-secondary leading-normal line-clamp-3">{rec.reason}</p>

                <div className="flex gap-2 pt-1 border-t border-border-subtle">
                  <button
                    onClick={() => handleRecAction(rec.skill, 'accept')}
                    className="flex-1 px-2.5 py-1 text-[9px] text-center text-success border border-success/25 bg-success/10 rounded hover:bg-success/15 font-bold"
                  >
                    Mark Achieved
                  </button>
                  <button
                    onClick={() => handleRecAction(rec.skill, 'defer')}
                    className="px-2 py-1 text-[9px] text-center text-text-secondary border border-border rounded hover:bg-surface-overlay"
                  >
                    Skip
                  </button>
                </div>
              </WorkspaceCard>
            ))}

            {displayRoadmap.filter(node => node.status === 'active').length === 0 && (
              <div className="p-4 border border-dashed border-border rounded-xl text-center py-8">
                <ShieldCheck size={20} className="text-success/60 mx-auto mb-2" />
                <p className="text-[10px] text-text-tertiary">No active gaps to resolve.</p>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
