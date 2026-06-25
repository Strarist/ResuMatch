/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Panel, StatusBadge } from '@/components/ds';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, LogOut, Briefcase, Settings, ShieldCheck, Plus, X, Terminal, Layers, Cpu, Save, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { strategic, resumes as resumesApi, portfolio as portfolioApi, type PortfolioProject } from '@/lib/intelligence-client';
import { normalizeSpecialization, resolveProfileField } from '@/lib/profile-normalize';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { syncLifecycleFromBackend, resumeParseStatus, hasStrategicProfile } = useLivingSystem();
  const [parseStage, setParseStage] = useState<string | null>(null);
  const router = useRouter();

  // Profile data state loaded from DB
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<any[]>([]);
  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [specialization, setSpecialization] = useState('Full Stack');
  const [yearsOfExperience, setYearsOfExperience] = useState(5.0);
  const [completenessScore, setCompletenessScore] = useState(45);

  // Local input states
  const [newSkillInput, setNewSkillInput] = useState('');
  const [originalData, setOriginalData] = useState<any>(null);

  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
  const [resumeProjects, setResumeProjects] = useState<Array<{ name: string; stack?: string[]; description?: string }>>([]);

  const specializationsList = [
    'Full Stack',
    'Backend',
    'Cloud',
    'AI',
    'DevOps',
    'Frontend',
    'General'
  ];

  const formatYears = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };

  const roundYears = (value: number) => Math.round(value * 10) / 10;

  const fetchProfileData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await strategic.getProfile();
      setSkills(data.skills || []);
      setTargetRole(resolveProfileField(data.target_role, 'Senior Full Stack Engineer'));
      setSpecialization(normalizeSpecialization(data.specialization));
      setYearsOfExperience(roundYears(resolveProfileField(data.years_of_experience, 5.0)));
      setCompletenessScore(resolveProfileField(data.completeness_score, 45));

      setOriginalData({
        skills: [...(data.skills || [])],
        target_role: resolveProfileField(data.target_role, 'Senior Full Stack Engineer'),
        specialization: normalizeSpecialization(data.specialization),
        years_of_experience: roundYears(resolveProfileField(data.years_of_experience, 5.0)),
      });

      const resData = await resumesApi.list();
      const resumes = resData.resumes || [];

      try {
        let projectsRes = await portfolioApi.listProjects();
        let projects = projectsRes.projects || [];
        if (!projects.length) {
          try {
            await portfolioApi.syncFromResume();
            projectsRes = await portfolioApi.listProjects();
            projects = projectsRes.projects || [];
          } catch {
            /* backfill optional */
          }
        }
        setPortfolioProjects(projects);
      } catch {
        setPortfolioProjects([]);
      }

      const latestCompleted = resumes
        .filter((r) => r.parse_status === 'completed')
        .sort((a, b) => new Date(b.uploaded_at || 0).getTime() - new Date(a.uploaded_at || 0).getTime())[0];

      const latestParsed = latestCompleted &&
        Array.isArray(latestCompleted.parsed_data?.projects) &&
        latestCompleted.parsed_data.projects.length > 0
        ? latestCompleted
        : null;

      let parsedProjects = (latestParsed?.parsed_data?.projects || []) as Array<{
        name?: string;
        description?: string;
        technology_stack?: string[];
      }>;

      if (!parsedProjects.length && latestCompleted?.parsed_data?.experience) {
        const experience = latestCompleted.parsed_data.experience as Array<{
          title?: string;
          company?: string;
          description?: string;
          skills_used?: string[];
        }>;
        parsedProjects = experience
          .filter((e) => {
            const text = `${e.title || ''} ${e.description || ''}`.toLowerCase();
            return /\b(built|developed|designed|created|implemented|project)\b/.test(text) || (e.skills_used?.length ?? 0) > 0;
          })
          .map((e) => ({
            name: e.title || e.company || 'Professional project',
            description: e.description,
            technology_stack: e.skills_used || [],
          }));
      }

      setResumeProjects(
        parsedProjects.map((p) => ({
          name: p.name || 'Untitled project',
          stack: p.technology_stack || [],
          description: p.description,
        }))
      );

      try {
        const lifecycle = await strategic.getLifecycle();
        setParseStage(lifecycle.parse_stage || null);
      } catch {
        setParseStage(null);
      }
    } catch (e) {
      console.error('Profile fetching error', e);
      if (!isSilent) toast.error('Connection to profile server failed.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
    refreshUser().catch(() => null);
  }, [fetchProfileData, refreshUser]);

  useEffect(() => {
    const onParseComplete = () => {
      void fetchProfileData(true);
      void syncLifecycleFromBackend();
    };
    window.addEventListener('skillyn:resume-parse-complete', onParseComplete);
    return () => window.removeEventListener('skillyn:resume-parse-complete', onParseComplete);
  }, [fetchProfileData, syncLifecycleFromBackend]);

  const isParsingResume =
    (resumeParseStatus === 'processing' || resumeParseStatus === 'pending') && !hasStrategicProfile;
  const isEnrichingProfile = parseStage === 'enriching_profile';

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;

    // Check for duplicates case-insensitively
    if (skills.some(s => (typeof s === 'string' ? s : s.name).toLowerCase() === trimmed.toLowerCase())) {
      toast.warning('Skill already listed in your identity matrix');
      return;
    }

    const updated = [...skills, { name: trimmed, origin: 'user' }];
    setSkills(updated);
    setNewSkillInput('');
    toast.success(`Added "${trimmed}" to draft skills`);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = skills.filter(s => (typeof s === 'string' ? s : s.name) !== skillToRemove);
    setSkills(updated);
    toast.info(`Removed "${skillToRemove}" from draft skills`);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const flattenedSkills = skills.map(s => typeof s === 'string' ? s : s.name);

    try {
      await strategic.updateProfile({
        skills: flattenedSkills,
        target_role: targetRole,
        specialization,
        years_of_experience: roundYears(Number(yearsOfExperience)),
      });

      toast.success('Career Identity Hub updated and synced successfully!');
      setOriginalData({
        skills: [...skills],
        target_role: targetRole,
        specialization,
        years_of_experience: roundYears(Number(yearsOfExperience)),
      });

      await fetchProfileData(true);
      await syncLifecycleFromBackend();
      await refreshUser();
    } catch (e) {
      console.error('Profile saving error', e);
      toast.error('Network error during profile sync.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!originalData) return;
    setSkills([...originalData.skills]);
    setTargetRole(originalData.target_role);
    setSpecialization(originalData.specialization);
    setYearsOfExperience(originalData.years_of_experience);
    toast.info('Reverted all unsaved changes.');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
      toast.success('Successfully logged out');
    } catch {
      toast.error('Failed to logout');
    }
  };

  // Determine if state is dirty (has changes compared to original)
  const isDirty = originalData && (
    JSON.stringify(skills.map(s => typeof s === 'string' ? s : s.name).sort()) !==
    JSON.stringify(originalData.skills.map((s: any) => typeof s === 'string' ? s : s.name).sort()) ||
    targetRole !== originalData.target_role ||
    specialization !== originalData.specialization ||
    Number(yearsOfExperience) !== originalData.years_of_experience
  );

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mx-auto mb-4" />
        <p className="text-text-secondary text-sm">Compiling active user strategy vectors...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8 animate-fade-in">
      {/* Top Banner Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text flex items-center gap-2">
            <Layers className="w-8 h-8 text-accent" />
            Career Identity Hub
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Single Source of Truth calibrating your AI search engines, roadmaps, and recruiter matchmaking lists.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleLogout} variant="outline" className="border-border hover:bg-surface-raised flex items-center gap-2">
            <LogOut className="w-4 h-4 text-text-tertiary" />
            Sign Out
          </Button>
          {isDirty && (
            <Button onClick={handleReset} variant="ghost" className="text-text-secondary hover:text-text">
              Reset Changes
            </Button>
          )}
          <Button
            onClick={handleSaveProfile}
            disabled={saving || !isDirty}
            className="bg-accent text-black font-semibold hover:bg-accent-bright shadow-lg shadow-accent/15 flex items-center gap-2"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Sync Hub changes
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Core Career Identifiers (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          <Panel className="bg-surface/50 border border-border rounded-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Terminal className="w-32 h-32 text-accent" />
            </div>

            <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2 border-b border-border/50 pb-2">
              <Briefcase className="w-5 h-5 text-accent" />
              Career Profile Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Target Role input */}
              <div className="space-y-2">
                <Label htmlFor="targetRole" className="text-text-secondary text-xs uppercase tracking-wider font-semibold">
                  Target Role
                </Label>
                <Input
                  id="targetRole"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="bg-surface-inset border-border text-text focus:border-accent"
                  placeholder="e.g. Senior Software Engineer"
                />
                <p className="text-[11px] text-text-tertiary">Used to generate relevant learning goals on your career roadmap.</p>
              </div>

              {/* Specialization selector */}
              <div className="space-y-2">
                <Label htmlFor="specialization" className="text-text-secondary text-xs uppercase tracking-wider font-semibold">
                  Specialization Track
                </Label>
                <Select value={specialization} onValueChange={setSpecialization}>
                  <SelectTrigger id="specialization" className="bg-surface-inset border-border text-text focus:border-accent">
                    <SelectValue placeholder="Select path..." />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-overlay border-border">
                    {specializationsList.map((spec) => (
                      <SelectItem key={spec} value={spec} className="hover:bg-surface-raised text-text">
                        {spec} Engineering
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-text-tertiary">Filters job matches based on your target specialization.</p>
              </div>

              {/* Experience slider/input */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="yearsExp" className="text-text-secondary text-xs uppercase tracking-wider font-semibold">
                    Years of Relevant Experience
                  </Label>
                  <span className="text-accent text-sm font-semibold">{formatYears(yearsOfExperience)} years</span>
                </div>
                <Input
                  id="yearsExp"
                  type="number"
                  step="0.5"
                  min="0"
                  max="30"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(parseFloat(e.target.value) || 0)}
                  onBlur={() => setYearsOfExperience(roundYears(yearsOfExperience))}
                  className="bg-surface-inset border-border text-text focus:border-accent w-full"
                />
                <p className="text-[11px] text-text-tertiary">Determines experience level filters when matching opportunities.</p>
              </div>
            </div>
          </Panel>

          <Panel className="bg-surface/50 border border-border rounded-2xl relative">
            <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2 border-b border-border/50 pb-2">
              <Cpu className="w-5 h-5 text-accent" />
              Portfolio Projects
            </h3>
            <p className="text-text-secondary text-xs mb-4">
              Projects linked to your account from resume parsing and the portfolio engine.
            </p>

            {portfolioProjects.length === 0 && resumeProjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-surface-inset/40 p-6 text-center">
                <p className="text-sm text-text-secondary">No portfolio projects yet.</p>
                <p className="text-xs text-text-tertiary mt-2">
                  Upload a resume first — parsed projects will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(portfolioProjects.length > 0
                  ? portfolioProjects.map((proj) => ({
                      id: proj.id,
                      name: proj.name,
                      stack: proj.stack,
                      live_url: proj.live_url,
                      readiness: proj.production_readiness,
                      source: 'portfolio' as const,
                    }))
                  : resumeProjects.map((proj, idx) => ({
                      id: `resume-${idx}`,
                      name: proj.name,
                      stack: proj.stack,
                      live_url: undefined,
                      readiness: undefined,
                      source: 'resume' as const,
                    }))
                ).map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-surface-inset border border-border/50 rounded-xl p-4 hover:border-accent/40 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-text">{proj.name}</h4>
                        <p className="text-xs text-text-secondary mt-1">
                          {proj.stack?.length ? proj.stack.join(' · ') : 'Stack not listed'}
                        </p>
                        {proj.source === 'resume' && (
                          <p className="text-[10px] text-text-tertiary mt-1">From resume</p>
                        )}
                        {proj.live_url && (
                          <a href={proj.live_url} target="_blank" rel="noreferrer" className="text-xs text-accent mt-1 inline-block">
                            View live project
                          </a>
                        )}
                      </div>
                      {typeof proj.readiness === 'number' && (
                        <Badge variant="secondary" className="bg-accent/10 text-accent text-[10px] shrink-0">
                          {Math.round(proj.readiness * 100)}% ready
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Account and Security Info */}
          <Panel className="bg-surface/30 border border-border/50 rounded-2xl">
            <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-text-secondary" />
              Account Settings & Preferences
            </h3>
            <div className="space-y-4 text-sm text-text-secondary">
              <div className="flex items-center gap-3 border-b border-border/30 pb-3 justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-text-tertiary shrink-0" />
                  <span className="shrink-0">Email:</span>
                  <span className="font-medium text-text truncate">{user.email}</span>
                </div>
                <StatusBadge status="success">Verified</StatusBadge>
              </div>
              {user.name && (
                <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                  <Briefcase className="w-4 h-4 text-text-tertiary" />
                  <span>Name:</span>
                  <span className="font-medium text-text">{user.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                <Terminal className="w-4 h-4 text-text-tertiary" />
                <span>Account ID:</span>
                <span className="font-mono text-xs text-text-tertiary">{user.sub?.slice(0, 8)}…</span>
              </div>
              <div className="flex items-center gap-2 justify-between">
                <span className="text-xs">Account Status:</span>
                <span className="text-xs font-semibold text-text bg-success/10 border border-success/20 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
            </div>
          </Panel>
        </div>

        {/* Verified Skills Vector (Right Column) */}
        <div className="space-y-6">
          <Panel className="bg-surface/50 border border-border rounded-2xl flex flex-col h-full">
            <h3 className="text-lg font-semibold text-text mb-2 flex items-center gap-2 border-b border-border/50 pb-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              Verified Core Skills
            </h3>
            <p className="text-text-secondary text-xs mb-4 leading-relaxed">
              These are the skills extracted from your resume and manually verified. Remove outdated skills or add new technologies below to update your matching jobs.
            </p>

            {isParsingResume && (
              <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/25 text-amber-200 rounded-xl flex items-center gap-3 animate-pulse shadow-md shadow-amber-950/10">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400 flex-shrink-0" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold block text-text text-xs">Resume Parsing Active</span>
                  Extracting technological signals... Status: <span className="font-semibold text-accent capitalize">{resumeParseStatus}</span>
                </div>
              </div>
            )}

            {!isParsingResume && isEnrichingProfile && (
              <div className="mb-4 p-3.5 bg-surface-inset border border-border text-text-secondary rounded-xl flex items-center gap-3">
                <RefreshCw className="w-4 h-4 animate-spin text-success flex-shrink-0" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold block text-text text-xs">Enhancing roadmap</span>
                  Your profile is ready. Generating personalized roadmap and opportunities in the background.
                </div>
              </div>
            )}

            {/* Add Skill Form */}
            <div className="flex gap-2 mb-4">
              <Input
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Enter skill tag (e.g. Redis)"
                className="bg-surface-inset border-border text-text text-sm focus:border-accent"
              />
              <Button
                onClick={handleAddSkill}
                className="bg-surface-raised border border-border text-text hover:bg-surface-overlay"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Completeness Meter */}
            <div className="bg-surface-inset p-3 rounded-xl mb-4 border border-border/40 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-text-secondary uppercase">
                  Identity Completeness
                </span>
                <span className="text-xs font-bold text-accent">{completenessScore}%</span>
              </div>
              <div className="w-full bg-surface-raised h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-500 ease-out-expo"
                  style={{ width: `${completenessScore}%` }}
                />
              </div>
            </div>

            {/* Skills List */}
            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[350px] p-2 bg-surface-inset rounded-xl border border-border-subtle">
              {skills.length === 0 ? (
                <p className="text-xs text-text-tertiary italic p-3 text-center w-full">
                  No verified skills loaded. Add some above or re-run onboarding.
                </p>
              ) : (
                skills.map((s) => {
                  const sName = typeof s === 'string' ? s : s.name;
                  const sOrigin = typeof s === 'string' ? 'resume' : (s.origin || 'resume');

                  // Color indicators based on origin trust tag
                  let dotColor = 'bg-emerald-400';
                  let originLabel = 'Resume';

                  if (sOrigin === 'user') {
                    dotColor = 'bg-blue-400';
                    originLabel = 'User-Added';
                  } else if (sOrigin === 'project') {
                    dotColor = 'bg-purple-400';
                    originLabel = 'Project';
                  } else if (sOrigin === 'ai') {
                    dotColor = 'bg-amber-400';
                    originLabel = 'AI Suggest';
                  }

                  return (
                    <Badge
                      key={sName}
                      className="bg-surface-overlay border border-border/85 text-text text-xs px-2.5 py-1 rounded-md flex items-center gap-2 hover:border-accent/40 transition-all group"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} title={`Source: ${originLabel}`} />
                      <span>{sName}</span>
                      <button
                        onClick={() => handleRemoveSkill(sName)}
                        className="text-text-tertiary hover:text-rose-400 focus:outline-none transition-colors"
                        title={`Remove ${sName}`}
                      >
                        <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      </button>
                    </Badge>
                  );
                })
              )}
            </div>

            {/* Skill Provenance Legend */}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] text-text-tertiary bg-surface-inset p-3 rounded-lg border border-border/40">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Resume Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span>User-Added</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                <span>Project-Inferred</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>AI Suggested</span>
              </div>
            </div>

            <div className="mt-4 text-[10px] text-text-tertiary italic text-center leading-relaxed">
              * Removing major items will degrade matching align scores until new gap proofs are uploaded.
            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
}
