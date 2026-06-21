import { strategic } from '@/lib/intelligence-client';
import type { LifecycleStage } from '@/state/user-lifecycle';

export interface LifecycleBackendState {
  lifecycleStage: LifecycleStage;
  hasStrategicProfile: boolean;
  resumeParseStatus: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
}

/** Derive lifecycle stage from backend resume + strategic profile state. */
export function deriveLifecycleStage(
  hasProfile: boolean,
  parseStatus: LifecycleBackendState['resumeParseStatus'],
  currentStage: LifecycleStage,
): LifecycleStage {
  if (hasProfile) {
    return currentStage >= 4 ? 4 : 3;
  }
  if (parseStatus === 'processing' || parseStatus === 'pending') {
    return 2;
  }
  return 1;
}

/** Single lightweight lifecycle endpoint — one request instead of two. */
export async function fetchLifecycleBackendState(): Promise<LifecycleBackendState> {
  try {
    const data = await strategic.getLifecycle();
    const parseStatus = (data.resume_parse_status || 'none') as LifecycleBackendState['resumeParseStatus'];
    const hasProfile = Boolean(data.has_strategic_profile);

    return {
      lifecycleStage: (data.lifecycle_stage ?? deriveLifecycleStage(hasProfile, parseStatus, 1)) as LifecycleStage,
      hasStrategicProfile: hasProfile,
      resumeParseStatus: parseStatus,
    };
  } catch (err) {
    console.error('[lifecycle-sync] Failed to fetch backend state:', err);
    return {
      lifecycleStage: 1,
      hasStrategicProfile: false,
      resumeParseStatus: 'none',
    };
  }
}

/** Poll interval based on current lifecycle state. */
export function getLifecyclePollIntervalMs(state: LifecycleBackendState): number | null {
  if (state.hasStrategicProfile && state.resumeParseStatus !== 'processing') {
    return null;
  }
  if (state.resumeParseStatus === 'processing' || state.resumeParseStatus === 'pending') {
    return 5000;
  }
  return 30000;
}
