export type LifecycleStage = 1 | 2 | 3 | 4;

export const LIFECYCLE_STAGES = {
  STAGE_1_ONBOARDING: 1 as LifecycleStage,     // New User - upload encouragement, fallback/dormant simulation
  STAGE_2_PARSING: 2 as LifecycleStage,        // Uploaded - parsing processing, synthesis loading
  STAGE_3_CALIBRATED: 3 as LifecycleStage,     // Calibrated - market intel, matching, roadmap active
  STAGE_4_OPTIMIZED: 4 as LifecycleStage,      // Advanced Optimization - predictive copilot, recruiter alignment active
};

export const getLifecycleStageLabel = (stage: LifecycleStage): string => {
  switch (stage) {
    case 1:
      return 'Stage 1: Onboarding';
    case 2:
      return 'Stage 2: Parsing Portfolio';
    case 3:
      return 'Stage 3: Profile Calibrated';
    case 4:
      return 'Stage 4: Trajectory Optimized';
    default:
      return 'Onboarding';
  }
};
