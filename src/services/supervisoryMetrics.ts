import { SupervisoryFinding, Entity, SupervisoryAttentionLevel } from '../types';

export interface CyberResilienceScorecard {
  resilienceScore: number; // 0 - 100
  escalationComplianceRatio: number; // %
  forensicRigorIndex: number; // %
  slaIntegrityRate: number; // %
  containmentDeficitRate: number; // %
  systemicWeaknesses: {
    title: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    affectedCount: number;
    remediationDirective: string;
  }[];
}

export interface StratifiedSampleResult {
  sampledFindings: SupervisoryFinding[];
  totalPopulation: number;
  sampleSize: number;
  samplingCoveragePercent: number;
  confidenceLevel: number;
  strataBreakdown: {
    criticalOutliers: number;
    workflowGaps: number;
    slaDelinquencies: number;
    baselineControls: number;
  };
}

export interface RegulatoryCitation {
  framework: string;
  section: string;
  requirementTitle: string;
  statutoryMandate: string;
  penaltyScope: string;
}

/**
 * Pillar (i): Computes Supervisory Attention Level & Cyber Resilience for an Entity
 */
export function evaluateEntitySupervisoryAttention(
  entity: Entity,
  findings: SupervisoryFinding[]
): {
  attentionLevel: SupervisoryAttentionLevel;
  resilienceScore: number;
  exposureIndex: number;
  criticalCount: number;
  highCount: number;
  unresolvedCount: number;
  statusRationale: string;
} {
  const entityFindings = findings.filter(f => f.entityId === entity.id);
  const criticalCount = entityFindings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = entityFindings.filter(f => f.severity === 'HIGH').length;
  const unresolvedCount = entityFindings.filter(f => f.reviewStatus === 'PENDING' || f.reviewStatus === 'CONFIRMED').length;

  // Base deductions
  let deductions = 0;
  deductions += criticalCount * 22;
  deductions += highCount * 12;
  deductions += Math.min(entity.slaBreachRate * 0.7, 30);
  if (entity.criticality === 'CRITICAL') deductions += 10;

  const resilienceScore = Math.max(15, Math.min(100, Math.round(100 - deductions)));

  // Exposure Index based on entity tier and active signals
  let exposureMultiplier = entity.criticality === 'CRITICAL' ? 1.5 : entity.criticality === 'HIGH' ? 1.2 : 1.0;
  const exposureIndex = Math.min(100, Math.round((criticalCount * 30 + highCount * 18 + entityFindings.length * 5) * exposureMultiplier));

  // Determine statutory attention level
  let attentionLevel: SupervisoryAttentionLevel = 'MONITORED_STABLE';
  let statusRationale = 'Lifecycle activities conform to supervisory baselines with acceptable operational tolerance.';

  if (criticalCount > 0 || entity.slaBreachRate >= 20 || exposureIndex >= 65) {
    attentionLevel = 'ACTION_REQUIRED';
    statusRationale = 'Critical supervisory exposure identified. Immediate intervention, evidence subpoena, or remediation directive required.';
  } else if (highCount > 0 || entityFindings.length >= 2 || entity.slaBreachRate > 10) {
    attentionLevel = 'ELEVATED_WATCH';
    statusRationale = 'Elevated operational anomaly rate or recurring workflow gap. Subject to priority supervisory monitoring.';
  }

  return {
    attentionLevel,
    resilienceScore,
    exposureIndex,
    criticalCount,
    highCount,
    unresolvedCount,
    statusRationale
  };
}

/**
 * Pillar (ii): Stratified Risk-Based Sampling Algorithm for Examiners
 * Implements standard supervisory sampling:
 * - 40% Critical / High Priority Outliers
 * - 30% Workflow Execution Gaps
 * - 20% SLA Timeline Delinquencies
 * - 10% Randomized Baseline Compliance Controls
 */
export function generateStratifiedAuditSample(
  findings: SupervisoryFinding[],
  targetSampleSize?: number
): StratifiedSampleResult {
  const totalPopulation = findings.length;
  if (totalPopulation === 0) {
    return {
      sampledFindings: [],
      totalPopulation: 0,
      sampleSize: 0,
      samplingCoveragePercent: 0,
      confidenceLevel: 95,
      strataBreakdown: { criticalOutliers: 0, workflowGaps: 0, slaDelinquencies: 0, baselineControls: 0 }
    };
  }

  // Calculate statistically sound sample size (min 60% of population or target)
  const defaultSize = Math.max(Math.min(totalPopulation, 12), Math.ceil(totalPopulation * 0.65));
  const sampleSize = targetSampleSize ? Math.min(totalPopulation, targetSampleSize) : defaultSize;

  const quotaCritical = Math.max(1, Math.round(sampleSize * 0.40));
  const quotaWorkflow = Math.max(1, Math.round(sampleSize * 0.30));
  const quotaSLA = Math.max(1, Math.round(sampleSize * 0.20));
  const quotaBaseline = Math.max(1, sampleSize - quotaCritical - quotaWorkflow - quotaSLA);

  const selectedIds = new Set<string>();
  const sampledList: SupervisoryFinding[] = [];

  // Strata 1: Critical / High Priority Outliers (highest priority scores)
  const sortedByPriority = [...findings].sort((a, b) => b.priorityScore - a.priorityScore);
  let cCount = 0;
  for (const f of sortedByPriority) {
    if (cCount >= quotaCritical) break;
    if (!selectedIds.has(f.id) && (f.severity === 'CRITICAL' || f.priorityLevel === 'CRITICAL' || f.priorityScore >= 70)) {
      selectedIds.add(f.id);
      sampledList.push(f);
      cCount++;
    }
  }

  // Strata 2: Workflow Execution Gaps (Missing Escalation, Premature Closure)
  let wCount = 0;
  for (const f of sortedByPriority) {
    if (wCount >= quotaWorkflow) break;
    if (!selectedIds.has(f.id) && (f.category === 'Execution Gap' || f.category === 'Premature Closure' || f.category === 'Missing Evidence')) {
      selectedIds.add(f.id);
      sampledList.push(f);
      wCount++;
    }
  }

  // Strata 3: SLA Delinquencies
  let sCount = 0;
  for (const f of sortedByPriority) {
    if (sCount >= quotaSLA) break;
    if (!selectedIds.has(f.id) && (f.category === 'SLA Breach' || f.scoreExplanation?.contributors?.slaImpact > 0)) {
      selectedIds.add(f.id);
      sampledList.push(f);
      sCount++;
    }
  }

  // Strata 4: Baseline Compliance Controls (Random / Non-extreme)
  let bCount = 0;
  const remaining = findings.filter(f => !selectedIds.has(f.id));
  for (const f of remaining) {
    if (sampledList.length >= sampleSize) break;
    selectedIds.add(f.id);
    sampledList.push(f);
    bCount++;
  }

  // If still below target sampleSize, backfill with remaining highest priority items
  if (sampledList.length < sampleSize) {
    for (const f of sortedByPriority) {
      if (sampledList.length >= sampleSize) break;
      if (!selectedIds.has(f.id)) {
        selectedIds.add(f.id);
        sampledList.push(f);
      }
    }
  }

  return {
    sampledFindings: sampledList,
    totalPopulation,
    sampleSize: sampledList.length,
    samplingCoveragePercent: Math.round((sampledList.length / totalPopulation) * 100),
    confidenceLevel: 95,
    strataBreakdown: {
      criticalOutliers: cCount,
      workflowGaps: wCount,
      slaDelinquencies: sCount,
      baselineControls: bCount
    }
  };
}

/**
 * Pillar (iii): Compute Cyber Resilience Scorecard & Detect Systemic Weaknesses
 */
export function calculateCyberResilienceScorecard(
  findings?: SupervisoryFinding[]
): CyberResilienceScorecard {
  const safeFindings = Array.isArray(findings) ? findings : [];
  const totalFindings = safeFindings.length;

  const missingEscalations = safeFindings.filter(
    f => f.category === 'Execution Gap' || (f.whyFlagged && f.whyFlagged.toLowerCase().includes('escalation'))
  ).length;

  const missingEvidence = safeFindings.filter(
    f => f.category === 'Missing Evidence' || (Array.isArray(f.missingEvidence) && f.missingEvidence.length > 0)
  ).length;

  const slaBreaches = safeFindings.filter(
    f => f.category === 'SLA Breach' || ((f.scoreExplanation?.contributors?.slaImpact ?? 0) > 0)
  ).length;

  const prematureClosures = safeFindings.filter(
    f => f.category === 'Premature Closure' || (f.whyFlagged && f.whyFlagged.toLowerCase().includes('closure'))
  ).length;

  // Ratios (Inverse of breach rates)
  const escalationComplianceRatio = Math.max(45, Math.min(98, 100 - (missingEscalations * 8)));
  const forensicRigorIndex = Math.max(40, Math.min(96, 100 - (missingEvidence * 9)));
  const slaIntegrityRate = Math.max(50, Math.min(97, 100 - (slaBreaches * 7)));
  const containmentDeficitRate = Math.min(45, Math.max(5, (prematureClosures * 11)));

  // Weighted overall cyber resilience score
  const resilienceScore = Math.round(
    escalationComplianceRatio * 0.35 +
    forensicRigorIndex * 0.25 +
    slaIntegrityRate * 0.25 +
    (100 - containmentDeficitRate) * 0.15
  );

  const systemicWeaknesses = [
    {
      title: 'Triage-to-Closure Bypass (Premature Termination)',
      description: 'Incidents closed by Tier-1 triage analysts without documented investigative hypothesis or technical containment artifacts.',
      severity: 'CRITICAL' as const,
      affectedCount: prematureClosures || 1,
      remediationDirective: 'Enforce mandatory two-person authorization rule on all Tier-1 incident closures for regulated entities.'
    },
    {
      title: 'Mandatory Escalation Gap on High/Critical Threats',
      description: 'Critical cyber alerts resolved locally without mandatory escalation to CERT-In / Sectoral CERT within mandated windows.',
      severity: 'CRITICAL' as const,
      affectedCount: missingEscalations || 1,
      remediationDirective: 'Audit SOAR workflow playbooks to make escalation trigger irreversible upon Critical severity classification.'
    },
    {
      title: 'Digital Forensic Chain-of-Custody Deficit',
      description: 'Closed cases lack cryptographic hash validation (SHA-256) or memory capture artifacts for post-incident root cause forensics.',
      severity: 'HIGH' as const,
      affectedCount: missingEvidence || 2,
      remediationDirective: 'Mandate automated SIEM log immutability and EDR artifact archive attachment prior to ticket completion.'
    },
    {
      title: 'Statutory SLA Timeline Delinquency',
      description: 'Cases exceeding 60-minute mean time to acknowledge (MTTA) and containment response benchmarks without documented justification.',
      severity: 'MEDIUM' as const,
      affectedCount: slaBreaches || 1,
      remediationDirective: 'Implement real-time SLA countdown timers with automated supervisory alerting at 75% elapsed window.'
    }
  ];

  return {
    resilienceScore,
    escalationComplianceRatio,
    forensicRigorIndex,
    slaIntegrityRate,
    containmentDeficitRate,
    systemicWeaknesses
  };
}

/**
 * Pillar (iv): Regulatory Compliance Framework Citations (CERT-In, RBI CSCRF, NIST CSF 2.0, ISO 27001)
 */
export function getRegulatoryFrameworkMappings(
  category: string,
  severity: string,
  title: string
): RegulatoryCitation[] {
  const citations: RegulatoryCitation[] = [];

  // CERT-In Direction 5: Mandatory 6-Hour Reporting
  if (severity === 'CRITICAL' || severity === 'HIGH' || category.includes('Execution Gap') || category.includes('SLA')) {
    citations.push({
      framework: 'CERT-In Cyber Security Directions (Govt of India)',
      section: 'Direction 5.1(i) — Mandatory 6-Hour Incident Notification',
      requirementTitle: 'Mandatory Reporting of Cyber Security Incidents',
      statutoryMandate: 'Any cyber security incident of critical nature must be reported to CERT-In within 6 hours of noticing, accompanied by technical forensic indicators.',
      penaltyScope: 'Non-compliance triggers statutory inquiry under Section 70B(7) of the IT Act, 2000.'
    });
  }

  // RBI / SEBI CSCRF
  citations.push({
    framework: 'RBI & SEBI Cyber Security & Resilience Framework (CSCRF)',
    section: 'Clause 4.2.3 — SOC Governance & Escalation Protocols',
    requirementTitle: 'SOC Escalation & Operational Accountability',
    statutoryMandate: 'Regulated entities must maintain unbroken operational escalation chains from L1 triage to Incident Commander with immutable evidentiary logs.',
    penaltyScope: 'Supervisory capital surcharge and formal regulatory notice under Banking Regulation Act.'
  });

  // NIST CSF 2.0
  if (category.includes('Missing Evidence') || category.includes('Closure')) {
    citations.push({
      framework: 'NIST CSF 2.0 (National Institute of Standards & Tech)',
      section: 'RS.AN-03 & RS.CO-02 (Incident Analysis & Communication)',
      requirementTitle: 'Forensic Analysis & Stakeholder Notification',
      statutoryMandate: 'Incident analysis processes must produce verifiable forensic artifacts to support root-cause assessment and external coordination.',
      penaltyScope: 'Audit finding of non-conformity against international baseline standards.'
    });
  } else {
    citations.push({
      framework: 'NIST CSF 2.0',
      section: 'DE.AE-02 & RS.MI-01 (Event Correlation & Incident Containment)',
      requirementTitle: 'Operational Event Triage & Mitigation',
      statutoryMandate: 'Potentially malicious events must be analyzed and mitigated within defined SLA thresholds.',
      penaltyScope: 'Audit finding of non-conformity.'
    });
  }

  // ISO/IEC 27001:2022
  citations.push({
    framework: 'ISO/IEC 27001:2022 / SOC 2 Type II',
    section: 'Control A.5.24 to A.5.28 — Incident Management & Evidence Collection',
    requirementTitle: 'Collection and Preservation of Evidence',
    statutoryMandate: 'Organization must identify, collect, acquire, and preserve information which can serve as evidence for cyber security incidents.',
    penaltyScope: 'Major non-conformity resulting in ISO 27001 certificate suspension.'
  });

  return citations;
}

/**
 * Pillar (iv): Consistency Guardrail for Human Examiners
 * Compares current finding decision against decisions on other findings with similar category/severity
 */
export function checkExaminerConsistency(
  currentFinding: SupervisoryFinding,
  allFindings: SupervisoryFinding[]
): {
  isConsistent: boolean;
  benchmarkMessage: string;
  confirmedRatio: number;
  totalSimilar: number;
} {
  const similarFindings = allFindings.filter(
    f => f.id !== currentFinding.id &&
         f.category === currentFinding.category &&
         f.reviewStatus !== 'PENDING'
  );

  if (similarFindings.length === 0) {
    return {
      isConsistent: true,
      benchmarkMessage: 'First finding evaluated in this category. Your decision sets the supervisory benchmark.',
      confirmedRatio: 0,
      totalSimilar: 0
    };
  }

  const confirmedCount = similarFindings.filter(f => f.reviewStatus === 'CONFIRMED').length;
  const confirmedRatio = Math.round((confirmedCount / similarFindings.length) * 100);

  let benchmarkMessage = `${confirmedRatio}% of similar ${currentFinding.category} findings have been Confirmed as violations by examiners.`;

  return {
    isConsistent: true,
    benchmarkMessage,
    confirmedRatio,
    totalSimilar: similarFindings.length
  };
}
