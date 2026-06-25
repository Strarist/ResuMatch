'use client';

import { useCallback, useEffect, useState } from 'react';
import { SectionHeader } from '@/components/ds';
import {
  RoadmapSummary,
  RoadmapMilestoneCard,
  RoadmapInsightsSidebar,
  type MilestoneNode,
  type AlignmentItem,
} from '@/components/roadmap';
import { roadmap } from '@/lib/intelligence-client';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { HardenedRoadmapNode } from '@/data/baseline-profiles';
import { Zap, Info, Compass } from 'lucide-react';
import { toast } from 'sonner';

interface RoadmapNode {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  effort_weeks: number;
  impact_estimate: number;
  reason: string;
  status: 'active' | 'completed' | 'deferred';
  dependency?: string;
  recommended_sprint?: string;
}

export default function AdaptiveRoadmapPage() {
  const [apiState, setApiState] = useState<{
    target_role: string;
    version: number;
    milestones: RoadmapNode[];
    last_generated_at?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const formatTimestamp = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Never';
    const d = new Date(dateString);
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${hours}:${minutes} ${ampm}`;

    if (isToday) return `Today • ${timeStr}`;
    if (isYesterday) return `Yesterday • ${timeStr}`;
    return `${d.toLocaleDateString()} • ${timeStr}`;
  };

  const {
    simulationActive,
    roadmap: simRoadmap,
    completeRoadmapNode,
    deferRoadmapNode,
    revertRoadmapNode,
    triggerSystemScan,
    systemStatus,
    metrics,
    activePersona,
    lifecycleStage,
    hasStrategicProfile,
  } = useLivingSystem();

  const [recalibrating, setRecalibrating] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const handleRealRecalibrate = async () => {
    setRecalibrating(true);
    try {
      await roadmap.recalibrate();
      toast.success('Roadmap updated successfully');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Recalibration failed.');
    } finally {
      setRecalibrating(false);
    }
  };

  const fetchData = useCallback(async () => {
    setFetchError(false);
    try {
      const d = await roadmap.getState();
      if (d.state) {
        setApiState({
          target_role: d.state.target_role,
          version: d.state.version,
          last_generated_at: (d.state as { last_generated_at?: string | null }).last_generated_at,
          milestones:
            d.state.snapshot?.milestones?.map((m) => ({
              skill: m.skill,
              priority: (m.priority as RoadmapNode['priority']) || 'medium',
              effort_weeks: m.effort_weeks || 4,
              impact_estimate: (m as { impact_estimate?: number }).impact_estimate || 80,
              reason: m.reason || '',
              status: (m.status as RoadmapNode['status']) || 'active',
              dependency: (m as { dependency?: string }).dependency || (m.priority === 'high' ? 'None' : 'Core Language Stack'),
              recommended_sprint: (m as { recommended_sprint?: string }).recommended_sprint || `Sprint: ${m.skill} foundations`,
            })) || [],
        });
      }
    } catch (err) {
      console.error('Failed to load roadmap:', err);
      setFetchError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!simulationActive) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [simulationActive, fetchData]);

  const markComplete = async (skill: string) => {
    if (simulationActive || !apiState) {
      completeRoadmapNode(skill);
      return;
    }
    await roadmap.completeNode(skill);
    fetchData();
  };

  const markDeferred = async (skill: string) => {
    if (simulationActive || !apiState) {
      deferRoadmapNode(skill);
      return;
    }
    await roadmap.deferNode(skill);
    fetchData();
  };

  const undoComplete = async (skill: string) => {
    if (simulationActive || !apiState) {
      revertRoadmapNode(skill);
      return;
    }
    await roadmap.undoNode(skill);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Career Roadmap" subtitle="Loading your adaptive career vectors..." />
        <RoadmapSkeleton />
      </div>
    );
  }

  const hasRealData = !!apiState && apiState.milestones.length > 0;
  const isSimulation = simulationActive;

  const targetRole = isSimulation
    ? activePersona.targetRole
    : hasRealData
    ? apiState!.target_role
    : 'Not configured';

  const activeVersion = isSimulation ? (lifecycleStage >= 3 ? 3 : 1) : hasRealData ? apiState!.version : 1;

  const activeMilestones: MilestoneNode[] = (isSimulation ? simRoadmap : hasRealData ? apiState!.milestones : []).map(
    (m) => {
      const isSimNode = 'effortWeeks' in m;
      if (isSimNode) {
        const hNode = m as unknown as HardenedRoadmapNode;
        return {
          skill: hNode.skill,
          priority: hNode.priority,
          effortWeeks: hNode.effortWeeks,
          reason: hNode.reason,
          strategicRationale: hNode.strategicRationale || hNode.reason,
          status: hNode.status,
        };
      }
      const legacyNode = m as unknown as RoadmapNode & {
        effort_weeks?: number;
        reason?: string;
      };
      return {
        skill: legacyNode.skill,
        priority: legacyNode.priority,
        effortWeeks: legacyNode.effort_weeks || 4,
        reason: legacyNode.reason,
        strategicRationale: legacyNode.reason,
        status: legacyNode.status,
      };
    }
  );

  const completedCount = activeMilestones.filter((m) => m.status === 'completed').length;
  const totalCount = activeMilestones.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const marketAlignment = isSimulation ? `${Math.round(metrics.marketFit)}%` : '—';
  const activeSpecialization = isSimulation ? activePersona.specialization : hasRealData ? 'From your profile' : 'Not configured';

  const openGaps = activeMilestones.filter((m) => m.status !== 'completed');
  const topGapSkill = openGaps[0]?.skill;

  const activeAlignments: AlignmentItem[] = isSimulation
    ? activePersona.opportunities.map((opp) => ({
        role: opp.title,
        company: opp.company,
        match: `${Math.round(opp.alignmentScore * 100)}%`,
        window: opp.hiringWindow || 'Immediate',
        readiness: `${Math.round(opp.confidence * 100)}%`,
        comp: opp.compensation || '—',
        shift: opp.recruiterPressure === 'high' ? 'Upward' : 'Stable',
      }))
    : [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Career Roadmap"
        subtitle={
          isSimulation
            ? `${targetRole} • v${activeVersion} (Simulation Sandbox)`
            : `${targetRole} • v${activeVersion}`
        }
        action={
          <div className="flex items-center gap-4">
            {!isSimulation && apiState?.last_generated_at && (
              <span className="hidden sm:inline text-xs font-mono text-text-tertiary uppercase tracking-wider font-semibold">
                Last recalibrated: {formatTimestamp(apiState.last_generated_at)}
              </span>
            )}
            <button
              onClick={async () => {
                if (isSimulation) {
                  await triggerSystemScan();
                } else {
                  await handleRealRecalibrate();
                }
              }}
              disabled={systemStatus === 'syncing' || !hasStrategicProfile || recalibrating}
              className="rounded-lg px-3 py-1.5 text-xs bg-success/10 text-success hover:bg-success/20 transition-colors flex items-center gap-1.5 disabled:opacity-50 font-bold border border-success/20"
            >
              <Zap size={11} className={systemStatus === 'syncing' || recalibrating ? 'animate-spin' : ''} />
              {systemStatus === 'syncing' || recalibrating ? 'Recalculating...' : '↻ Recalibrate Roadmap'}
            </button>
          </div>
        }
      />

      {fetchError && (
        <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200">
          Could not load roadmap data.{' '}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="underline"
          >
            Retry
          </button>
        </div>
      )}

      {!hasStrategicProfile && (
        <div className="p-4 rounded-xl border border-info/20 bg-info/5 flex items-start gap-4 animate-fade-in">
          <div className="p-2 rounded-lg bg-info/10 text-info">
            <Info size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text mb-0.5">Standby Mode</h3>
            <p className="text-small text-text-secondary leading-relaxed">
              Your career roadmap will appear after you upload a resume or configure your profile on the{' '}
              <a href="/resumes" className="text-accent underline hover:text-accent-hover">
                Resumes
              </a>{' '}
              or{' '}
              <a href="/profile" className="text-accent underline hover:text-accent-hover">
                Profile
              </a>{' '}
              pages.
            </p>
          </div>
        </div>
      )}

      {(isSimulation || hasRealData) && (
        <RoadmapSummary
          completionPercent={completionPercent}
          targetRole={targetRole}
          activeSpecialization={activeSpecialization}
          marketAlignment={marketAlignment}
        />
      )}

      {!isSimulation && !hasRealData ? (
        <div className="p-8 rounded-2xl border border-border bg-surface-raised text-center max-w-2xl mx-auto my-12 space-y-6">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-accent">
            <Compass size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-text">Generate Your Career Roadmap</h3>
            <p className="text-small text-text-secondary leading-relaxed">
              Upload your resume or configure your career profile to generate custom milestones and map real opportunities.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <a
              href="/resumes"
              className="rounded-lg px-4 py-2 bg-accent hover:bg-accent-hover text-text-inverse text-xs font-bold transition-colors"
            >
              Upload Resume
            </a>
            <a
              href="/profile"
              className="rounded-lg px-4 py-2 border border-border hover:bg-surface-inset text-text text-xs font-bold transition-colors"
            >
              Configure Profile
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Skills Roadmap</h3>
              <span className="text-xs text-text-tertiary">{activeMilestones.length} milestones</span>
            </div>

            <div className="space-y-3">
              {activeMilestones.map((node) => (
                <RoadmapMilestoneCard
                  key={node.skill}
                  node={node}
                  hasStrategicProfile={hasStrategicProfile}
                  onComplete={markComplete}
                  onDefer={markDeferred}
                  onUndo={undoComplete}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <RoadmapInsightsSidebar
              topGapSkill={topGapSkill}
              hasOpenGaps={openGaps.length > 0}
              alignments={activeAlignments}
              isSimulation={isSimulation}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-surface-raised space-y-2 h-20">
            <div className="h-3 w-16 bg-surface-inset rounded" />
            <div className="h-6 w-24 bg-surface-overlay rounded mt-1" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-5 w-32 bg-surface-inset rounded mb-2" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-surface-raised space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-surface-inset" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-surface-overlay rounded" />
                  <div className="h-3 w-1/3 bg-surface-inset rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="h-5 w-24 bg-surface-inset rounded mb-2" />
          <div className="p-4 rounded-xl border border-border bg-surface-raised h-28" />
          <div className="p-4 rounded-xl border border-border bg-surface-raised h-20" />
        </div>
      </div>
    </div>
  );
}
