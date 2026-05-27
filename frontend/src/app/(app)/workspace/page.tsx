'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { env } from '@/lib/env';
import { GlassPanel, SectionLabel, WorkspaceCard, EmptyState } from '@/components/workspace';
import { MessageSquare, Plus, Send, Brain, Sparkles } from 'lucide-react';

interface Message { id: string; role: string; content: string; created_at: string; }
interface Session { id: string; title: string; type: string; }
interface Recommendation { type: string; title: string; explanation: string; priority: string; confidence: number; }

export default function WorkspacePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const headers = useCallback((): Record<string, string> => { const t = localStorage.getItem('access_token'); return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }; }, []);

  useEffect(() => {
    const h = headers();
    fetch(`${env.NEXT_PUBLIC_API_URL}/v1/workspace/sessions`, { headers: h }).then(r => r.ok ? r.json() : null).then(d => { if (d) setSessions(d.sessions || []); });
    fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/recommendations`, { headers: h }).then(r => r.ok ? r.json() : null).then(d => { if (d) setRecommendations(d.recommendations || []); });
  }, [headers]);

  useEffect(() => {
    if (!activeSession) return;
    fetch(`${env.NEXT_PUBLIC_API_URL}/v1/workspace/session/${activeSession}`, { headers: headers() }).then(r => r.ok ? r.json() : null).then(d => { if (d) setMessages(d.messages || []); });
  }, [activeSession, headers]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const createSession = async () => {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/workspace/session`, { method: 'POST', headers: headers(), body: JSON.stringify({ title: 'Career Strategy' }) });
    if (res.ok) { const d = await res.json(); setSessions(prev => [{ id: d.id, title: d.title, type: d.type }, ...prev]); setActiveSession(d.id); setMessages([]); }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeSession || sending) return;
    const content = input.trim();
    setInput(''); setSending(true);
    setMessages(prev => [...prev, { id: `temp-${Date.now()}`, role: 'user', content, created_at: new Date().toISOString() }]);
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/workspace/session/${activeSession}/message`, { method: 'POST', headers: headers(), body: JSON.stringify({ content }) });
    if (res.ok) { const d = await res.json(); setMessages(prev => [...prev, d.message]); }
    setSending(false);
  };

  const handleRecAction = async (rec: Recommendation, action: string) => {
    await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/workspace/recommendations/action`, { method: 'POST', headers: headers(), body: JSON.stringify({ recommendation_type: rec.type, recommendation_title: rec.title, action }) });
    setRecommendations(prev => prev.filter(r => r.title !== rec.title));
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-6rem)]">
      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-white">AI Workspace</h1>
            <p className="text-xs text-white/40">Strategic career copilot</p>
          </div>
          <button onClick={createSession} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-300 border border-blue-400/20 bg-blue-500/[0.06] rounded-lg hover:bg-blue-500/[0.1] transition-colors">
            <Plus size={12} /> New Session
          </button>
        </div>

        {/* Session tabs */}
        {sessions.length > 0 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            {sessions.slice(0, 5).map(s => (
              <button key={s.id} onClick={() => setActiveSession(s.id)} className={`px-3 py-1.5 text-[11px] rounded-lg whitespace-nowrap transition-colors ${activeSession === s.id ? 'bg-white/[0.08] text-white font-medium' : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'}`}>
                {s.title}
              </button>
            ))}
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#080c14]/60 p-4 space-y-3">
          {!activeSession ? (
            <EmptyState icon={MessageSquare} title="No active session" description="Create a new session to start a strategic conversation with your AI copilot." />
          ) : messages.length === 0 ? (
            <EmptyState icon={Sparkles} title="Start a conversation" description="Ask about your roadmap, salary, roles, projects, or career strategy." />
          ) : (
            messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-500/20 text-white/80 border border-blue-400/10' : 'bg-white/[0.03] text-white/60 border border-white/[0.06]'}`}>
                  {m.role === 'assistant' && <Brain size={12} className="text-blue-400/50 mb-1" />}
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))
          )}
          {sending && <div className="flex justify-start"><div className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"><div className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400/40 animate-pulse" /><span className="w-1.5 h-1.5 rounded-full bg-blue-400/40 animate-pulse" style={{ animationDelay: '0.2s' }} /><span className="w-1.5 h-1.5 rounded-full bg-blue-400/40 animate-pulse" style={{ animationDelay: '0.4s' }} /></div></div></div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {activeSession && (
          <div className="flex gap-2 mt-3">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Ask about your career strategy..." className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-400/30 transition-colors" disabled={sending} />
            <button onClick={sendMessage} disabled={sending || !input.trim()} className="px-4 py-2.5 bg-blue-500/20 border border-blue-400/20 text-blue-300 rounded-xl text-sm disabled:opacity-30 hover:bg-blue-500/30 transition-colors" aria-label="Send message">
              <Send size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Action Center */}
      <div className="w-72 shrink-0 hidden lg:block overflow-y-auto">
        <GlassPanel>
          <SectionLabel>Action Center</SectionLabel>
          {recommendations.length === 0 ? (
            <p className="text-xs text-white/25 mt-2">No pending recommendations.</p>
          ) : (
            <div className="space-y-2.5 mt-2">
              {recommendations.slice(0, 5).map((rec, i) => (
                <WorkspaceCard key={i} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${rec.priority === 'high' ? 'border-red-400/20 text-red-400 bg-red-500/[0.06]' : 'border-amber-400/20 text-amber-400 bg-amber-500/[0.06]'}`}>{rec.priority}</span>
                    <span className="text-[9px] text-white/20">{rec.type.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-[11px] font-medium text-white/70 mb-1">{rec.title}</p>
                  <p className="text-[10px] text-white/30 mb-2 line-clamp-2">{rec.explanation}</p>
                  <div className="flex gap-1">
                    <button onClick={() => handleRecAction(rec, 'accept')} className="px-2 py-0.5 text-[9px] text-emerald-400 border border-emerald-400/20 bg-emerald-500/[0.06] rounded hover:bg-emerald-500/[0.1]">Accept</button>
                    <button onClick={() => handleRecAction(rec, 'add_to_roadmap')} className="px-2 py-0.5 text-[9px] text-blue-400 border border-blue-400/20 bg-blue-500/[0.06] rounded hover:bg-blue-500/[0.1]">+Roadmap</button>
                    <button onClick={() => handleRecAction(rec, 'defer')} className="px-2 py-0.5 text-[9px] text-white/30 border border-white/[0.06] rounded hover:bg-white/[0.04]">Defer</button>
                  </div>
                </WorkspaceCard>
              ))}
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
