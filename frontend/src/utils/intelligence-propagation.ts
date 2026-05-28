import { PersonaProfile, HardenedRoadmapNode, HardenedOpportunityMatch } from '../data/baseline-profiles';
import { LifecycleStage } from '../state/user-lifecycle';
import { RecruiterSignalProfile } from '../context/LivingSystemContext';

export function propagateIntelligence(
  basePersona: PersonaProfile,
  stage: LifecycleStage,
  completedSkills: string[],
  deferredSkills: string[]
): PersonaProfile {
  // Deep clone the persona profile to avoid mutation issues
  const persona = JSON.parse(JSON.stringify(basePersona)) as PersonaProfile;

  // 1. Process roadmap status updates
  persona.roadmap = persona.roadmap.map((node: HardenedRoadmapNode) => {
    if (completedSkills.includes(node.skill)) {
      return { ...node, status: 'completed' as const };
    }
    if (deferredSkills.includes(node.skill)) {
      return { ...node, status: 'deferred' as const };
    }
    return node;
  });

  // 2. Adjust strongest/weakest skills list
  completedSkills.forEach((skill) => {
    if (!persona.strongestSkills.includes(skill)) {
      persona.strongestSkills.push(skill);
    }
    const idx = persona.weakestSkills.indexOf(skill);
    if (idx !== -1) {
      persona.weakestSkills.splice(idx, 1);
    }
  });

  deferredSkills.forEach((skill) => {
    // Deferred skills remain in weakestSkills but might change priority in roadmap
    if (!persona.weakestSkills.includes(skill)) {
      persona.weakestSkills.push(skill);
    }
  });

  // 3. Dynamic metric adjustments based on milestones & stage
  const matchScoreBoost = completedSkills.length * 2.5 - deferredSkills.length * 1.5;
  const velocityBoost = completedSkills.length * 3.5 - deferredSkills.length * 2.0;
  const recruiterBoost = completedSkills.length * 4.0 - deferredSkills.length * 2.5;
  const marketFitBoost = completedSkills.length * 1.5;

  // Stage multipliers
  if (stage === 1) {
    // Dormant/baseline
    persona.metrics = {
      matchScore: 35.0,
      careerVelocity: 10.0,
      marketFit: 30.0,
      recruiterConfidence: 25.0,
    };
  } else if (stage === 2) {
    // Parsing
    persona.metrics = {
      matchScore: 55.0,
      careerVelocity: 25.0,
      marketFit: 50.0,
      recruiterConfidence: 45.0,
    };
  } else {
    // Calibrated or Optimized (Stage 3 or 4)
    const baseMetrics = basePersona.metrics;

    // Add extra bump for Stage 4
    const stage4Bonus = stage === 4 ? 4.0 : 0.0;

    persona.metrics = {
      matchScore: parseFloat(Math.min(99.0, Math.max(10.0, baseMetrics.matchScore + matchScoreBoost + stage4Bonus)).toFixed(1)),
      careerVelocity: parseFloat(Math.min(99.0, Math.max(10.0, baseMetrics.careerVelocity + velocityBoost + (stage4Bonus * 1.2))).toFixed(1)),
      marketFit: parseFloat(Math.min(99.0, Math.max(10.0, baseMetrics.marketFit + marketFitBoost + (stage4Bonus * 0.8))).toFixed(1)),
      recruiterConfidence: parseFloat(Math.min(99.0, Math.max(10.0, baseMetrics.recruiterConfidence + recruiterBoost + (stage4Bonus * 1.5))).toFixed(1)),
    };
  }

  // 4. Propagate changes to opportunities
  persona.opportunities = persona.opportunities.map((opp: HardenedOpportunityMatch) => {
    // Filter out completed requirements
    const missingRequirements = opp.missingRequirements.filter(
      (req) => !completedSkills.includes(req)
    );

    // Filter out proof gaps if corresponding skill was completed
    const proofGaps = opp.proofGaps.filter(
      (gap) => !completedSkills.some((skill) => gap.toLowerCase().includes(skill.toLowerCase()))
    );

    // Calculate score dynamic changes
    const gapReductionFactor = opp.missingRequirements.length > 0
      ? (opp.missingRequirements.length - missingRequirements.length) / opp.missingRequirements.length
      : 1;

    const alignmentBonus = gapReductionFactor * 0.08; // completes gap -> boosts alignment score
    const confidenceBonus = gapReductionFactor * 0.06;

    let alignmentScore = parseFloat(Math.min(0.99, opp.alignmentScore + alignmentBonus).toFixed(3));
    let confidence = parseFloat(Math.min(0.99, opp.confidence + confidenceBonus).toFixed(3));

    // If stage 1, make opportunities feel highly speculative or uncalibrated
    if (stage === 1) {
      alignmentScore = parseFloat((alignmentScore * 0.5).toFixed(3));
      confidence = parseFloat((confidence * 0.4).toFixed(3));
    }

    return {
      ...opp,
      missingRequirements,
      proofGaps,
      alignmentScore,
      confidence,
    };
  });

  // 5. Propagate changes to recruiter profile
  if (persona.recruiterProfile) {
    const rec = persona.recruiterProfile as RecruiterSignalProfile;

    let hiringConfidence = rec.hiringConfidence;
    let productionReadiness = rec.productionReadiness;

    if (stage === 1) {
      hiringConfidence = 0.25;
      productionReadiness = 0.20;
    } else if (stage === 2) {
      hiringConfidence = 0.45;
      productionReadiness = 0.40;
    } else {
      const skillsCompletedCount = completedSkills.length;
      hiringConfidence = parseFloat(Math.min(0.99, rec.hiringConfidence + (skillsCompletedCount * 0.04) - (deferredSkills.length * 0.02)).toFixed(3));
      productionReadiness = parseFloat(Math.min(0.99, rec.productionReadiness + (skillsCompletedCount * 0.03)).toFixed(3));
    }

    const roleFit = rec.roleFit.map((fit) => {
      const missing = fit.missing.filter((m) => !completedSkills.includes(m));
      const gapFactor = fit.missing.length > 0 ? (fit.missing.length - missing.length) / fit.missing.length : 1;

      return {
        ...fit,
        missing,
        skillReadiness: parseFloat(Math.min(1.0, fit.skillReadiness + (gapFactor * 0.08)).toFixed(3)),
        proofAdjusted: parseFloat(Math.min(1.0, fit.proofAdjusted + (gapFactor * 0.09)).toFixed(3)),
      };
    });

    persona.recruiterProfile = {
      ...rec,
      hiringConfidence,
      productionReadiness,
      roleFit,
    };
  }

  // 6. Generate causality alerts / live audit feed events depending on actions
  // If market demand is high, roadmap prioritization increases. Let's make that explicit in the UI.

  return persona;
}
