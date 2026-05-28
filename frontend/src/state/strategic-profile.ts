import { PersonaProfile } from '../data/baseline-profiles';
import { LifecycleStage } from './user-lifecycle';

export interface StrategicProfile {
  personaId: string;
  specialization: string;
  targetRole: string;
  strongestSkills: string[];
  weakestSkills: string[];
  recruiterAlignment: number;    // Maps to recruiterConfidence in UI
  marketAlignment: number;       // Maps to marketFit in UI
  opportunityReadiness: number;  // Combined percentage of matching skills
  confidenceScore: number;       // Maps to matchScore in UI
  executionVelocity: number;     // Maps to careerVelocity in UI
  activeMilestonesCount: number;
  lifecycleStage: LifecycleStage;
}

export function deriveStrategicProfile(
  persona: PersonaProfile,
  stage: LifecycleStage
): StrategicProfile {
  // If Stage 1 (Onboarding): the metrics are "uncalibrated"
  if (stage === 1) {
    return {
      personaId: persona.id,
      specialization: 'Uncalibrated Portfolio',
      targetRole: 'Awaiting Target Role Calibration',
      strongestSkills: [],
      weakestSkills: [...persona.strongestSkills, ...persona.weakestSkills],
      recruiterAlignment: 25.0,
      marketAlignment: 30.0,
      opportunityReadiness: 15.0,
      confidenceScore: 35.0,
      executionVelocity: 10.0,
      activeMilestonesCount: persona.roadmap.length,
      lifecycleStage: 1,
    };
  }

  // If Stage 2 (Parsing): intermediate metrics
  if (stage === 2) {
    return {
      personaId: persona.id,
      specialization: `${persona.specialization} (Parsing...)`,
      targetRole: persona.targetRole,
      strongestSkills: persona.strongestSkills.slice(0, 1), // Only some initialized
      weakestSkills: [...persona.strongestSkills.slice(1), ...persona.weakestSkills],
      recruiterAlignment: 45.0,
      marketAlignment: 50.0,
      opportunityReadiness: 35.0,
      confidenceScore: 55.0,
      executionVelocity: 25.0,
      activeMilestonesCount: persona.roadmap.length,
      lifecycleStage: 2,
    };
  }

  // If Stage 3 (Calibrated): normal metrics
  if (stage === 3) {
    return {
      personaId: persona.id,
      specialization: persona.specialization,
      targetRole: persona.targetRole,
      strongestSkills: persona.strongestSkills,
      weakestSkills: persona.weakestSkills,
      recruiterAlignment: persona.metrics.recruiterConfidence,
      marketAlignment: persona.metrics.marketFit,
      opportunityReadiness: Math.round(
        (persona.strongestSkills.length /
          (persona.strongestSkills.length + persona.weakestSkills.length)) *
          100
      ),
      confidenceScore: persona.metrics.matchScore,
      executionVelocity: persona.metrics.careerVelocity,
      activeMilestonesCount: persona.roadmap.filter((n) => n.status === 'active').length,
      lifecycleStage: 3,
    };
  }

  // Stage 4 (Optimized): slightly elevated metrics due to AI copilot recommendations and optimization
  return {
    personaId: persona.id,
    specialization: persona.specialization,
    targetRole: persona.targetRole,
    strongestSkills: persona.strongestSkills,
    weakestSkills: persona.weakestSkills,
    recruiterAlignment: Math.min(99.0, persona.metrics.recruiterConfidence + 4.5),
    marketAlignment: Math.min(99.0, persona.metrics.marketFit + 3.0),
    opportunityReadiness: Math.round(
      ((persona.strongestSkills.length + 1) /
        (persona.strongestSkills.length + persona.weakestSkills.length)) *
        100
    ),
    confidenceScore: Math.min(99.0, persona.metrics.matchScore + 3.5),
    executionVelocity: Math.min(99.0, persona.metrics.careerVelocity + 5.0),
    activeMilestonesCount: persona.roadmap.filter((n) => n.status === 'active').length,
    lifecycleStage: 4,
  };
}
