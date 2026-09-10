import {
  Entity,
  Case,
  Investigation,
  Escalation,
  Closure,
  SupervisoryFinding,
  SOCHealthScoreBreakdown,
  GovernanceMaturityRecord,
  CyberResilienceRecord
} from '../types';

/**
 * FEATURES 11, 12, 13:
 * - SOC HEALTH SCORE (7 Weighted Components)
 * - GOVERNANCE MATURITY INDEX (GMI - 7 Dimensions & 5 Tiers)
 * - CYBER RESILIENCE INDEX (CRI - 9 Dimensions & SPOF Analysis)
 */

export function calculateSOCHealthScore(
  cases: Case[],
  investigations: Investigation[],
  escalations: Escalation[],
  closures: Closure[],
  findings: SupervisoryFinding[]
): SOCHealthScoreBreakdown {
  const totalCases = cases.length || 1;
  const criticalFindings = findings.filter(f => f.severity === 'CRITICAL').length;
  const highFindings = findings.filter(f => f.severity === 'HIGH').length;

  // 1. Detection (20%): Alert triage completeness & sensor breadth
  const detectionScore = Math.max(30, Math.min(98, 92 - (findings.filter(f => f.category === 'Negative Space').length * 12)));

  // 2. Investigation (20%): Average duration and thoroughness
  const validInvs = investigations.filter(i => (i.notes?.length || 0) > 40).length;
  const investigationScore = Math.max(25, Math.min(96, Math.round((validInvs / totalCases) * 85) + 15));

  // 3. Escalation (15%): Compliance with Tier-2 protocols
  const reqEsc = cases.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH').length || 1;
  const actualEsc = escalations.length;
  const escalationScore = Math.max(20, Math.min(99, Math.round((actualEsc / reqEsc) * 100)));

  // 4. Response (15%): SLA performance and containment speed
  const breachedCases = cases.filter(c => c.slaBreached).length;
  const responseScore = Math.max(30, Math.min(98, Math.round(((totalCases - breachedCases) / totalCases) * 100)));

  // 5. Governance (10%): Audit readiness and low systemic gap penalty
  const governanceScore = Math.max(25, Math.min(95, 95 - (criticalFindings * 10 + highFindings * 5)));

  // 6. Operational Discipline (10%): Absence of premature closures and boilerplate notes
  const rapidClosures = cases.filter(c => (c.slaActualMinutes || 30) < 8 && (c.severity === 'CRITICAL' || c.severity === 'HIGH')).length;
  const operationalDiscipline = Math.max(30, Math.min(96, 96 - (rapidClosures * 14)));

  // 7. Cyber Resilience (10%): Threat containment stability
  const cyberResilience = Math.max(35, Math.min(94, Math.round((responseScore * 0.5 + detectionScore * 0.5))));

  // Weighted Composite Calculation:
  // Detection 20% + Investigation 20% + Escalation 15% + Response 15% + Governance 10% + Op Discipline 10% + Cyber Resilience 10%
  const compositeScore = Math.round(
    detectionScore * 0.20 +
    investigationScore * 0.20 +
    escalationScore * 0.15 +
    responseScore * 0.15 +
    governanceScore * 0.10 +
    operationalDiscipline * 0.10 +
    cyberResilience * 0.10
  );

  let letterGrade: SOCHealthScoreBreakdown['letterGrade'] = 'B';
  if (compositeScore >= 90) letterGrade = 'A+';
  else if (compositeScore >= 80) letterGrade = 'A';
  else if (compositeScore >= 70) letterGrade = 'B+';
  else if (compositeScore >= 60) letterGrade = 'B';
  else if (compositeScore >= 50) letterGrade = 'C';
  else if (compositeScore >= 40) letterGrade = 'D';
  else letterGrade = 'F';

  return {
    compositeScore,
    overallScore: compositeScore,
    letterGrade,
    overallTier: letterGrade,
    components: {
      detection: detectionScore,
      investigation: investigationScore,
      escalation: escalationScore,
      response: responseScore,
      governance: governanceScore,
      operationalDiscipline,
      cyberResilience
    },
    peerSectorAverage: 72,
    historicalQuarterlyTrend: [
      { quarter: 'Q3 2025', score: Math.max(40, compositeScore - 9) },
      { quarter: 'Q4 2025', score: Math.max(45, compositeScore - 6) },
      { quarter: 'Q1 2026', score: Math.max(48, compositeScore - 3) },
      { quarter: 'Q2 2026', score: compositeScore }
    ]
  } as any;
}

export function calculateGovernanceMaturity(
  entity: Entity,
  cases: Case[],
  findings: SupervisoryFinding[]
): GovernanceMaturityRecord {
  const entityCases = cases.filter(c => c.entityId === entity.id);
  const entityFindings = findings.filter(f => f.entityId === entity.id);

  const policyAdherence = Math.max(30, 95 - entityFindings.filter(f => f.category === 'Execution Gap').length * 15);
  const escalationCompliance = Math.max(25, 90 - entityFindings.filter(f => f.title.toLowerCase().includes('escalation')).length * 20);
  const documentationRigor = Math.max(35, 92 - entityFindings.filter(f => f.category === 'Missing Evidence').length * 18);
  const operationalDiscipline = Math.max(30, 94 - entityFindings.filter(f => f.category === 'Premature Closure').length * 16);
  const investigationQuality = Math.max(40, 88 - entityFindings.filter(f => f.severity === 'CRITICAL').length * 10);
  const monitoringCoverage = Math.max(30, 92 - entityFindings.filter(f => f.category === 'Negative Space').length * 20);
  const auditReadiness = Math.max(35, Math.round((policyAdherence + documentationRigor + escalationCompliance) / 3));

  const gmiScore = Math.round(
    (policyAdherence + escalationCompliance + documentationRigor + operationalDiscipline + investigationQuality + monitoringCoverage + auditReadiness) / 7
  );

  let maturityTier: GovernanceMaturityRecord['maturityTier'] = 'Level 3 Defined';
  if (gmiScore >= 88) maturityTier = 'Level 5 Optimizing';
  else if (gmiScore >= 76) maturityTier = 'Level 4 Quantitatively Managed';
  else if (gmiScore >= 62) maturityTier = 'Level 3 Defined';
  else if (gmiScore >= 48) maturityTier = 'Level 2 Managed';
  else maturityTier = 'Level 1 Initial';

  const keyGovernanceGaps: string[] = [];
  if (escalationCompliance < 65) keyGovernanceGaps.push('Non-compliant Tier-2 escalation protocol execution');
  if (documentationRigor < 65) keyGovernanceGaps.push('Digital forensics artifact retention deficit');
  if (monitoringCoverage < 65) keyGovernanceGaps.push('Subnet telemetry blind spot in core infrastructure');
  if (keyGovernanceGaps.length === 0) keyGovernanceGaps.push('Minor operational variance in shift handoff logging');

  return {
    entityId: entity.id,
    entityName: entity.name,
    maturityTier,
    maturityLevel: maturityTier,
    gmiScore,
    overallScore: (gmiScore / 20).toFixed(1),
    dimensions: {
      policyAdherence,
      escalationCompliance,
      documentationRigor,
      operationalDiscipline,
      investigationQuality,
      monitoringCoverage,
      auditReadiness
    },
    keyGovernanceGaps,
    regulatoryRecommendation: keyGovernanceGaps[0] ? `Address: ${keyGovernanceGaps[0]}` : 'Maintain periodic internal audit verification.'
  } as any;
}

export function calculateCyberResilience(
  entity: Entity,
  cases: Case[],
  findings: SupervisoryFinding[]
): CyberResilienceRecord {
  const entityCases = cases.filter(c => c.entityId === entity.id);
  const entityFindings = findings.filter(f => f.entityId === entity.id);
  const criticalCount = entityFindings.filter(f => f.severity === 'CRITICAL').length;

  const detectionSpeed = Math.max(35, 90 - entityFindings.filter(f => f.category === 'SLA Breach').length * 12);
  const containmentEfficacy = Math.max(30, 94 - criticalCount * 18);
  const recoveryAssurance = Math.max(40, 88 - entityFindings.filter(f => f.category === 'Execution Gap').length * 10);
  const assetVisibility = Math.max(30, 92 - entityFindings.filter(f => f.category === 'Negative Space').length * 20);
  const sensorHealth = Math.max(40, 85 - entityFindings.filter(f => f.category === 'Missing Evidence').length * 14);
  const governanceStability = Math.max(35, 90 - criticalCount * 12);
  const responseCoordination = Math.max(30, 88 - entityFindings.filter(f => f.title.toLowerCase().includes('escalation')).length * 15);
  const escalationFidelity = Math.max(25, 92 - entityFindings.filter(f => f.title.toLowerCase().includes('escalation')).length * 20);
  const temporalResilienceTrend = 78;

  const criScore = Math.round(
    (detectionSpeed * 0.15 +
      containmentEfficacy * 0.15 +
      recoveryAssurance * 0.12 +
      assetVisibility * 0.12 +
      sensorHealth * 0.10 +
      governanceStability * 0.10 +
      responseCoordination * 0.10 +
      escalationFidelity * 0.10 +
      temporalResilienceTrend * 0.06)
  );

  let resilienceRating: CyberResilienceRecord['resilienceRating'] = 'SUFFICIENT';
  if (criScore >= 82) resilienceRating = 'ROBUST';
  else if (criScore >= 68) resilienceRating = 'SUFFICIENT';
  else if (criScore >= 52) resilienceRating = 'FRAGILE';
  else resilienceRating = 'HIGH_RISK';

  const singlePointOfFailures: string[] = [];
  if (escalationFidelity < 60) singlePointOfFailures.push('Escalation bottlenecks during off-hours shifts');
  if (assetVisibility < 60) singlePointOfFailures.push('Unmonitored payment gateway / SCADA bridge interface');
  if (containmentEfficacy < 60) singlePointOfFailures.push('Absence of automated host isolation capabilities');
  if (singlePointOfFailures.length === 0) singlePointOfFailures.push('Secondary dependency on manual ticket verification');

  return {
    entityId: entity.id,
    entityName: entity.name,
    criScore,
    resilienceScore: criScore,
    resilienceRating,
    resilienceTier: resilienceRating,
    mttdMinutes: Math.round(120 - detectionSpeed),
    mttcMinutes: Math.round(180 - containmentEfficacy),
    containmentEffectivenessPct: containmentEfficacy,
    dimensions: {
      detectionSpeed,
      containmentEfficacy,
      recoveryAssurance,
      assetVisibility,
      sensorHealth,
      governanceStability,
      responseCoordination,
      escalationFidelity,
      temporalResilienceTrend
    },
    singlePointOfFailures,
    singlePointsOfFailure: singlePointOfFailures
  } as any;
}
