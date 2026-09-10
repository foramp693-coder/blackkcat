import {
  ExaminerPriorityBreakdown,
  PriorityLevel,
  ScoreContributors,
  SeverityLevel
} from '../types';

export interface PriorityCalculationInput {
  severity: SeverityLevel;
  hasWorkflowGap: boolean;
  workflowGapType?: 'MISSING_ESCALATION' | 'PREMATURE_CLOSURE' | 'MISSING_INVESTIGATION' | 'INVALID_TRANSITION' | 'NONE';
  missingEvidenceCount: number;
  slaBreached: boolean;
  entityCriticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isStatisticalOutlier?: boolean;
  recurrenceCount?: number;
  hasLegitimateMitigator?: boolean;
  mitigatorReason?: string;
  dataCompleteness?: number; // 0 - 100%
  detectionRuleId?: string;
}

export function calculateExaminerPriority(params: PriorityCalculationInput): ExaminerPriorityBreakdown {
  const reasons: { label: string; points: number; evidenceRef: string }[] = [];

  // 1. Severity contribution
  let severityPts = 0;
  if (params.severity === 'CRITICAL') {
    severityPts = 20;
    reasons.push({ label: 'Critical Incident Severity', points: 20, evidenceRef: 'Alert & Case Impact Classification' });
  } else if (params.severity === 'HIGH') {
    severityPts = 15;
    reasons.push({ label: 'High Incident Severity', points: 15, evidenceRef: 'Alert & Case Impact Classification' });
  } else if (params.severity === 'MEDIUM') {
    severityPts = 8;
    reasons.push({ label: 'Medium Incident Severity', points: 8, evidenceRef: 'Alert & Case Impact Classification' });
  } else {
    severityPts = 4;
    reasons.push({ label: 'Routine Low Severity Baseline', points: 4, evidenceRef: 'Baseline Severity' });
  }

  // 2. Workflow Deviation
  let workflowPts = 0;
  if (params.hasWorkflowGap) {
    if (params.workflowGapType === 'MISSING_ESCALATION') {
      workflowPts = 18;
      reasons.push({ label: 'Missing Escalation Evidence on Critical/High Workflow', points: 18, evidenceRef: 'Escalation State Transition Log' });
    } else if (params.workflowGapType === 'PREMATURE_CLOSURE') {
      workflowPts = 15;
      reasons.push({ label: 'Premature Closure Pattern (Triage-to-Close in <15m)', points: 15, evidenceRef: 'Investigation Timestamp Delta' });
    } else if (params.workflowGapType === 'MISSING_INVESTIGATION') {
      workflowPts = 16;
      reasons.push({ label: 'Direct Dismissal without Assigned Investigation', points: 16, evidenceRef: 'Investigation Assignment Table' });
    } else {
      workflowPts = 12;
      reasons.push({ label: 'Unverified Workflow Stage Bypass', points: 12, evidenceRef: 'Lifecycle Transition Audit' });
    }
  }

  // 3. Missing Expected Evidence (Negative Space)
  let missingEvdPts = 0;
  if (params.missingEvidenceCount > 0) {
    missingEvdPts = Math.min(15, params.missingEvidenceCount * 7.5);
    reasons.push({
      label: `Missing Mandatory Artifacts (${params.missingEvidenceCount} expected record types absent)`,
      points: Math.round(missingEvdPts),
      evidenceRef: 'Digital Evidence & Hash Ledger'
    });
  }

  // 4. SLA Deviation
  let slaPts = 0;
  if (params.slaBreached) {
    slaPts = 12;
    reasons.push({ label: 'Regulatory / Operational SLA Deviation Exceeded', points: 12, evidenceRef: 'Statutory Response Time Matrix' });
  }

  // 5. Repeated Occurrence / Recurrence
  let recurrencePts = 0;
  const count = params.recurrenceCount || 1;
  if (count >= 5) {
    recurrencePts = 10;
    reasons.push({ label: `Similar Issue Repeated ${count} Times Across Entity`, points: 10, evidenceRef: 'Longitudinal Entity Registry' });
  } else if (count >= 2) {
    recurrencePts = 6;
    reasons.push({ label: `Pattern Observed in ${count} Correlated Cases`, points: 6, evidenceRef: 'Case Cluster Index' });
  }

  // 6. Entity Criticality
  let entityPts = 0;
  if (params.entityCriticality === 'CRITICAL') {
    entityPts = 10;
    reasons.push({ label: 'Tier-1 Critical Information Infrastructure (CII) Host', points: 10, evidenceRef: 'Regulatory Entity Classification' });
  } else if (params.entityCriticality === 'HIGH') {
    entityPts = 8;
    reasons.push({ label: 'High Value Regulated Asset Entity', points: 8, evidenceRef: 'Regulatory Entity Classification' });
  } else if (params.entityCriticality === 'MEDIUM') {
    entityPts = 5;
    reasons.push({ label: 'Standard Sector Entity Criticality', points: 5, evidenceRef: 'Entity Baseline' });
  } else {
    entityPts = 2;
  }

  // 7. Behavioural / Statistical Unusualness
  let anomalyPts = 0;
  if (params.isStatisticalOutlier) {
    anomalyPts = 8;
    reasons.push({ label: 'Multivariate Behavioural Velocity / Duration Outlier', points: 8, evidenceRef: 'Cohort Anomaly Detector' });
  }

  // 8. Mitigators (Legitimate approved exceptions)
  let mitigatorPts = 0;
  if (params.hasLegitimateMitigator) {
    mitigatorPts = -12;
    reasons.push({
      label: `Mitigating Factor on File: ${params.mitigatorReason || 'Approved Change Window / Documented Exception'}`,
      points: -12,
      evidenceRef: 'Supervisory Exception Registry'
    });
  }

  const rawTotal = severityPts + workflowPts + missingEvdPts + slaPts + recurrencePts + entityPts + anomalyPts + mitigatorPts;
  const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

  let priorityLevel: PriorityLevel = 'LOW';
  if (totalScore >= 75) priorityLevel = 'CRITICAL';
  else if (totalScore >= 55) priorityLevel = 'HIGH';
  else if (totalScore >= 35) priorityLevel = 'MEDIUM';
  else priorityLevel = 'LOW';

  // Data completeness & Evidence quality
  const dataCompleteness = params.dataCompleteness ?? (params.missingEvidenceCount === 0 ? 98 : params.missingEvidenceCount === 1 ? 84 : 68);
  let evidenceQuality: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT' = 'HIGH';
  if (dataCompleteness < 70) evidenceQuality = 'LOW';
  else if (dataCompleteness < 85) evidenceQuality = 'MODERATE';

  // Expected vs Observed Behaviors
  let expectedBehaviour = 'Standard incident response lifecycle: Alert receipt -> Triage -> Case opening -> Full forensic investigation -> Escalation to incident management -> Controlled closure with artifact hashing.';
  let observedBehaviour = 'Workflow proceeded through observed phases, but execution deviations were registered.';
  let missingEvidenceDesc = 'No critical evidentiary records appear completely unsubmitted.';
  let recommendedAction = 'Perform standard supervisory audit verification against entity standard operating procedures.';
  const alternativeExplanations: string[] = [
    'Telemetry forwarder may have experienced intermittent network timeout, delaying record synchronization.',
    'Entity may have logged step in an internal out-of-band communication system.'
  ];

  if (params.workflowGapType === 'MISSING_ESCALATION') {
    expectedBehaviour = 'Cases of Critical or High severity require documented escalation to Tier-2/Tier-3 engineering or incident commander.';
    observedBehaviour = 'Case reached Closed resolution status with zero recorded internal or regulatory escalation events.';
    missingEvidenceDesc = 'Tier-2 dispatch ticket or regulatory notification timestamp is absent in submitted dataset.';
    recommendedAction = 'Request and inspect out-of-band escalation evidence or authorized exception dispatch logs.';
    alternativeExplanations.unshift(
      'Escalation was executed via direct emergency call or encrypted chat channel without API bridge.',
      'Entity security incident triage playbook authorized sole handling by senior Tier-3 analyst on duty.'
    );
  } else if (params.workflowGapType === 'PREMATURE_CLOSURE') {
    expectedBehaviour = 'Thorough forensic triage and host log analysis expected before dismissing high-severity indicators (typically >15-30m).';
    observedBehaviour = 'Incident ticket was marked Closed within minutes of alert registration.';
    missingEvidenceDesc = 'Detailed investigation hypotheses, host IOC verification notes, and remediation confirmations are absent.';
    recommendedAction = 'Validate whether this was a true known benign false positive or an analyst shortcut bypassing forensic verification.';
    alternativeExplanations.unshift(
      'Analyst recognized known synthetic monitoring alert / recurring scheduled vulnerability scan.',
      'Resolution was verified in external EDR console and ticket closed administratively.'
    );
  } else if (params.slaBreached) {
    expectedBehaviour = 'Incident resolution within designated statutory target timeframe.';
    observedBehaviour = 'Total case duration exceeded target SLA window without formal extension waiver.';
    missingEvidenceDesc = 'Approved SLA extension request or shift handoff delay explanation is absent.';
    recommendedAction = 'Review staffing roster and operational queue depth during the period of incident handling.';
    alternativeExplanations.unshift(
      'External vendor or third-party forensic dependency delayed final containment sign-off.',
      'Ticket remained administratively open post-containment pending business-day supervisor sign-off.'
    );
  }

  return {
    totalScore,
    priorityLevel,
    severity: params.severity,
    confidence: params.workflowGapType ? 92 : 84,
    evidenceQuality,
    dataCompleteness,
    dataCompletenessPct: dataCompleteness,
    supportingRecordCount: reasons.length + 2,
    detectionRuleId: params.detectionRuleId || 'WF-DET-001',
    expectedBehaviour,
    observedBehaviour,
    missingEvidenceDesc,
    recommendedAction,
    alternativeExplanations,
    scoreReasons: reasons,
    reasons: reasons.map(r => ({ factor: r.label, points: r.points, evidenceRef: r.evidenceRef }))
  };
}

// Backward-compatible wrapper for existing callers
export function calculatePriorityScore(params: {
  severity: SeverityLevel;
  hasWorkflowGap: boolean;
  missingEvidenceCount: number;
  slaBreached: boolean;
  entityCriticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isStatisticalOutlier?: boolean;
}): { priorityScore: number; priorityLevel: PriorityLevel; contributors: ScoreContributors } {
  const result = calculateExaminerPriority({
    severity: params.severity,
    hasWorkflowGap: params.hasWorkflowGap,
    missingEvidenceCount: params.missingEvidenceCount,
    slaBreached: params.slaBreached,
    entityCriticality: params.entityCriticality,
    isStatisticalOutlier: params.isStatisticalOutlier
  });

  return {
    priorityScore: result.totalScore,
    priorityLevel: result.priorityLevel,
    contributors: {
      severity: result.scoreReasons.find(r => r.label.includes('Severity'))?.points || 15,
      workflowImpact: result.scoreReasons.find(r => r.label.includes('Workflow') || r.label.includes('Escalation') || r.label.includes('Closure'))?.points || 15,
      missingEvidence: result.scoreReasons.find(r => r.label.includes('Missing Mandatory'))?.points || 10,
      slaImpact: result.scoreReasons.find(r => r.label.includes('SLA'))?.points || 10,
      entityCriticality: result.scoreReasons.find(r => r.label.includes('CII') || r.label.includes('Criticality') || r.label.includes('Regulated'))?.points || 8,
      statisticalAbnormality: result.scoreReasons.find(r => r.label.includes('Outlier'))?.points || 6
    }
  };
}
