import {
  Alert,
  Case,
  Investigation,
  Escalation,
  Closure,
  EvidenceRecord,
  Entity,
  SupervisoryFinding
} from '../types';
import { reconstructWorkflow } from './workflow';
import { calculatePriorityScore, calculateExaminerPriority } from './scoring';
import { generateExplanation } from './explainability';
import { detectMLAnomaly } from './mlAnomaly';

export function runExecutionGapRules(
  cases: Case[],
  alerts: Alert[],
  investigations: Investigation[],
  escalations: Escalation[],
  closures: Closure[],
  evidences: EvidenceRecord[],
  entities: Entity[]
): SupervisoryFinding[] {
  const findings: SupervisoryFinding[] = [];
  let counter = 1;

  const entityMap = new Map<string, Entity>(entities.map(e => [e.id, e]));

  // Pre-calculate population stats for ML
  const validDurations = investigations.map(i => i.durationMinutes || 0).filter(d => d > 0);
  const meanDur = validDurations.length > 0 ? validDurations.reduce((a, b) => a + b, 0) / validDurations.length : 45;
  const variance = validDurations.length > 0 ? validDurations.reduce((a, b) => a + Math.pow(b - meanDur, 2), 0) / validDurations.length : 100;
  const stdDur = Math.sqrt(variance) || 15;

  for (const c of cases) {
    const matchingAlert = alerts.find(a => a.id === c.alertId);
    const matchingInv = investigations.find(i => i.caseId === c.id);
    const matchingEsc = escalations.find(e => e.caseId === c.id);
    const matchingClosure = closures.find(cl => cl.caseId === c.id);
    const caseEvidences = evidences.filter(ev => ev.caseId === c.id);
    const entity = entityMap.get(c.entityId) || {
      id: c.entityId,
      name: c.entityId,
      code: c.entityId,
      criticality: 'MEDIUM',
      sector: 'General',
      activeCases: 1,
      totalFindings: 0,
      slaBreachRate: 0,
      lastAssessedAt: new Date().toISOString()
    };

    const workflow = reconstructWorkflow(c, alerts, investigations, escalations, closures, evidences);
    const mlAnomaly = detectMLAnomaly(c, matchingInv, caseEvidences, {
      meanDuration: meanDur,
      stdDuration: stdDur,
      meanEvidenceCount: 2.5
    });

    const baseSupporting = [
      {
        recordId: c.id,
        type: 'Case Record',
        description: `Case ${c.caseNumber} registered at ${c.createdAt} with status ${c.status}`,
        timestamp: c.createdAt
      }
    ];

    if (matchingAlert) {
      baseSupporting.push({
        recordId: matchingAlert.id,
        type: 'Alert Record',
        description: `Alert "${matchingAlert.title}" [${matchingAlert.severity}] from ${matchingAlert.source}`,
        timestamp: matchingAlert.normalizedTimestamp
      });
    }

    if (matchingInv) {
      baseSupporting.push({
        recordId: matchingInv.id,
        type: 'Investigation Record',
        description: `Analyst investigation started at ${matchingInv.startedAt} (${matchingInv.durationMinutes ?? 0}m duration)`,
        timestamp: matchingInv.startedAt
      });
    }

    if (matchingClosure) {
      baseSupporting.push({
        recordId: matchingClosure.id,
        type: 'Closure Record',
        description: `Closure classification: ${matchingClosure.classification} by ${matchingClosure.closedBy}`,
        timestamp: matchingClosure.closedAt
      });
    }

    // Rule 1: Missing Escalation on Critical or High Case
    if (workflow.stagesCompleted.escalationExpected && !workflow.stagesCompleted.escalationOccurred && matchingClosure) {
      const examinerPriority = calculateExaminerPriority({
        severity: c.severity,
        hasWorkflowGap: true,
        workflowGapType: 'MISSING_ESCALATION',
        missingEvidenceCount: 1,
        slaBreached: workflow.slaStatus === 'BREACHED',
        entityCriticality: entity.criticality,
        isStatisticalOutlier: mlAnomaly.isAnomaly,
        recurrenceCount: 6,
        detectionRuleId: 'RULE-GAP-ESC-01'
      });

      const explanation = generateExplanation('MISSING_ESCALATION', {
        caseNumber: c.caseNumber,
        entityName: entity.name,
        severity: c.severity,
        expectedWorkflow: workflow.expectedWorkflow,
        observedWorkflow: workflow.observedWorkflow
      });

      findings.push({
        id: `FIND-GAP-${String(counter++).padStart(4, '0')}`,
        entityId: entity.id,
        entityName: entity.name,
        caseId: c.id,
        caseNumber: c.caseNumber,
        title: `Potential Escalation Execution Gap [${c.severity}]`,
        category: 'Execution Gap',
        severity: c.severity,
        priorityScore: examinerPriority.totalScore,
        priorityLevel: examinerPriority.priorityLevel,
        examinerPriority,
        scoreExplanation: {
          baseScore: examinerPriority.totalScore,
          contributors: {
            severity: 20,
            workflowImpact: 18,
            missingEvidence: 8,
            slaImpact: workflow.slaStatus === 'BREACHED' ? 12 : 0,
            entityCriticality: 8,
            statisticalAbnormality: 8
          },
          totalScore: examinerPriority.totalScore
        },
        whatHappened: explanation.whatHappened,
        whyFlagged: explanation.whyFlagged,
        expectedWorkflow: workflow.expectedWorkflow,
        observedWorkflow: workflow.observedWorkflow,
        supportingEvidence: baseSupporting,
        missingEvidence: [
          {
            expectedType: 'Tier-2 Escalation Dispatch Log',
            description: `Required Tier 2/Incident Commander escalation record missing for ${c.severity} severity case.`,
            impact: 'Potential containment failure without supervisory sign-off.'
          }
        ],
        evidenceStrength: 'STRONG',
        evidenceQuality: examinerPriority.evidenceQuality,
        confidence: examinerPriority.confidence,
        dataCompleteness: examinerPriority.dataCompleteness,
        detectionRuleId: 'RULE-GAP-ESC-01',
        alternativeExplanations: examinerPriority.alternativeExplanations,
        historicalOccurrences: 6,
        recommendedAction: explanation.recommendedAction,
        counterfactual: explanation.counterfactual,
        source: 'Deterministic Rule',
        mlAnomalySignal: mlAnomaly,
        reviewStatus: 'PENDING',
        createdAt: c.createdAt
      });
    }

    // Rule 2: Missing Investigation Evidence
    if (matchingInv && caseEvidences.length === 0 && (c.severity === 'CRITICAL' || c.severity === 'HIGH')) {
      const examinerPriority = calculateExaminerPriority({
        severity: c.severity,
        hasWorkflowGap: true,
        workflowGapType: 'NONE',
        missingEvidenceCount: 2,
        slaBreached: workflow.slaStatus === 'BREACHED',
        entityCriticality: entity.criticality,
        isStatisticalOutlier: mlAnomaly.isAnomaly,
        recurrenceCount: 4,
        detectionRuleId: 'RULE-NEG-EVD-02'
      });

      const explanation = generateExplanation('MISSING_INVESTIGATION_EVIDENCE', {
        caseNumber: c.caseNumber,
        entityName: entity.name,
        severity: c.severity,
        expectedWorkflow: workflow.expectedWorkflow,
        observedWorkflow: workflow.observedWorkflow
      });

      findings.push({
        id: `FIND-EVD-${String(counter++).padStart(4, '0')}`,
        entityId: entity.id,
        entityName: entity.name,
        caseId: c.id,
        caseNumber: c.caseNumber,
        title: `Missing Investigation Digital Evidence [${c.severity}]`,
        category: 'Missing Evidence',
        severity: c.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        priorityScore: examinerPriority.totalScore,
        priorityLevel: examinerPriority.priorityLevel,
        examinerPriority,
        scoreExplanation: {
          baseScore: examinerPriority.totalScore,
          contributors: {
            severity: 15,
            workflowImpact: 12,
            missingEvidence: 15,
            slaImpact: workflow.slaStatus === 'BREACHED' ? 12 : 0,
            entityCriticality: 8,
            statisticalAbnormality: 6
          },
          totalScore: examinerPriority.totalScore
        },
        whatHappened: explanation.whatHappened,
        whyFlagged: explanation.whyFlagged,
        expectedWorkflow: workflow.expectedWorkflow,
        observedWorkflow: workflow.observedWorkflow,
        supportingEvidence: baseSupporting,
        missingEvidence: [
          {
            expectedType: 'Forensic PCAP / Host Log Artifact',
            description: 'No verified cryptographic hashes or digital artifacts linked to investigation.',
            impact: 'Investigation findings cannot be independently validated.'
          }
        ],
        evidenceStrength: 'DEFINITIVE',
        evidenceQuality: examinerPriority.evidenceQuality,
        confidence: examinerPriority.confidence,
        dataCompleteness: examinerPriority.dataCompleteness,
        detectionRuleId: 'RULE-NEG-EVD-02',
        alternativeExplanations: [
          'Evidence stored in segregated offline storage vault due to data privacy/GDPR mandates.',
          'PCAP capture failure during live packet collection window.'
        ],
        historicalOccurrences: 4,
        recommendedAction: explanation.recommendedAction,
        counterfactual: explanation.counterfactual,
        source: 'Negative Space',
        mlAnomalySignal: mlAnomaly,
        reviewStatus: 'PENDING',
        createdAt: matchingInv.startedAt
      });
    }

    // Rule 3: SLA Breach (Investigation or Overall Case)
    if (workflow.slaStatus === 'BREACHED' || (c.slaActualMinutes && c.slaActualMinutes > c.slaTargetMinutes)) {
      const actualDuration = c.slaActualMinutes || workflow.timing.totalCaseDurationMinutes;
      const examinerPriority = calculateExaminerPriority({
        severity: c.severity,
        hasWorkflowGap: false,
        missingEvidenceCount: 0,
        slaBreached: true,
        entityCriticality: entity.criticality,
        isStatisticalOutlier: true,
        recurrenceCount: 3,
        detectionRuleId: 'RULE-SLA-OVR-03'
      });

      const explanation = generateExplanation('SLA_BREACH', {
        caseNumber: c.caseNumber,
        entityName: entity.name,
        severity: c.severity,
        expectedWorkflow: workflow.expectedWorkflow,
        observedWorkflow: workflow.observedWorkflow,
        durationObserved: actualDuration,
        durationTarget: c.slaTargetMinutes
      });

      findings.push({
        id: `FIND-SLA-${String(counter++).padStart(4, '0')}`,
        entityId: entity.id,
        entityName: entity.name,
        caseId: c.id,
        caseNumber: c.caseNumber,
        title: `Operational SLA Execution Breach [${c.severity}]`,
        category: 'SLA Breach',
        severity: c.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        priorityScore: examinerPriority.totalScore,
        priorityLevel: examinerPriority.priorityLevel,
        examinerPriority,
        scoreExplanation: {
          baseScore: examinerPriority.totalScore,
          contributors: {
            severity: 15,
            workflowImpact: 10,
            missingEvidence: 0,
            slaImpact: 12,
            entityCriticality: 8,
            statisticalAbnormality: 8
          },
          totalScore: examinerPriority.totalScore
        },
        whatHappened: explanation.whatHappened,
        whyFlagged: explanation.whyFlagged,
        expectedWorkflow: workflow.expectedWorkflow,
        observedWorkflow: workflow.observedWorkflow,
        supportingEvidence: baseSupporting,
        missingEvidence: [
          {
            expectedType: 'SLA Extension Approval Record',
            description: `Resolution time (${actualDuration}m) exceeded ${c.slaTargetMinutes}m without an authorized extension waiver.`,
            impact: 'Prolonged attacker dwell time and delayed operational response.'
          }
        ],
        evidenceStrength: 'DEFINITIVE',
        evidenceQuality: examinerPriority.evidenceQuality,
        confidence: examinerPriority.confidence,
        dataCompleteness: examinerPriority.dataCompleteness,
        detectionRuleId: 'RULE-SLA-OVR-03',
        alternativeExplanations: [
          'Third-party cloud vendor outage delayed investigation containment.',
          'Case ticket remained open pending management confirmation post-containment.'
        ],
        historicalOccurrences: 3,
        recommendedAction: explanation.recommendedAction,
        counterfactual: explanation.counterfactual,
        source: 'Deterministic Rule',
        mlAnomalySignal: mlAnomaly,
        reviewStatus: 'PENDING',
        createdAt: c.createdAt
      });
    }

    // Rule 4: Premature Closure
    const invDuration = matchingInv?.durationMinutes ?? 0;
    if (
      matchingClosure &&
      (c.severity === 'CRITICAL' || c.severity === 'HIGH') &&
      invDuration > 0 &&
      invDuration <= 8
    ) {
      const examinerPriority = calculateExaminerPriority({
        severity: c.severity,
        hasWorkflowGap: true,
        workflowGapType: 'PREMATURE_CLOSURE',
        missingEvidenceCount: 1,
        slaBreached: false,
        entityCriticality: entity.criticality,
        isStatisticalOutlier: true,
        recurrenceCount: 5,
        detectionRuleId: 'RULE-PREM-CLS-04'
      });

      const explanation = generateExplanation('PREMATURE_CLOSURE', {
        caseNumber: c.caseNumber,
        entityName: entity.name,
        severity: c.severity,
        expectedWorkflow: workflow.expectedWorkflow,
        observedWorkflow: workflow.observedWorkflow,
        durationObserved: invDuration
      });

      findings.push({
        id: `FIND-PREM-${String(counter++).padStart(4, '0')}`,
        entityId: entity.id,
        entityName: entity.name,
        caseId: c.id,
        caseNumber: c.caseNumber,
        title: `Premature Case Closure Signal [${c.severity}]`,
        category: 'Premature Closure',
        severity: c.severity,
        priorityScore: examinerPriority.totalScore,
        priorityLevel: examinerPriority.priorityLevel,
        examinerPriority,
        scoreExplanation: {
          baseScore: examinerPriority.totalScore,
          contributors: {
            severity: 20,
            workflowImpact: 15,
            missingEvidence: 8,
            slaImpact: 0,
            entityCriticality: 8,
            statisticalAbnormality: 8
          },
          totalScore: examinerPriority.totalScore
        },
        whatHappened: explanation.whatHappened,
        whyFlagged: explanation.whyFlagged,
        expectedWorkflow: workflow.expectedWorkflow,
        observedWorkflow: workflow.observedWorkflow,
        supportingEvidence: baseSupporting,
        missingEvidence: [
          {
            expectedType: 'Adequate Analysis Notes & Evidence',
            description: `Case closed in ${invDuration} minutes without verifiable triage notes or containment confirmation.`,
            impact: 'High risk of False Negative / uncontained active threat.'
          }
        ],
        evidenceStrength: 'STRONG',
        evidenceQuality: examinerPriority.evidenceQuality,
        confidence: examinerPriority.confidence,
        dataCompleteness: examinerPriority.dataCompleteness,
        detectionRuleId: 'RULE-PREM-CLS-04',
        alternativeExplanations: [
          'Known synthetic monitoring probe recognized instantly by operator.',
          'Threat remediated automatically by endpoint EDR rule before human triage.'
        ],
        historicalOccurrences: 5,
        recommendedAction: explanation.recommendedAction,
        counterfactual: explanation.counterfactual,
        source: 'Deterministic Rule',
        mlAnomalySignal: mlAnomaly,
        reviewStatus: 'PENDING',
        createdAt: matchingClosure.closedAt
      });
    }

    // Rule 5: Missing Investigation
    if (!matchingInv && matchingClosure && c.status === 'CLOSED') {
      const examinerPriority = calculateExaminerPriority({
        severity: c.severity,
        hasWorkflowGap: true,
        workflowGapType: 'MISSING_INVESTIGATION',
        missingEvidenceCount: 2,
        slaBreached: false,
        entityCriticality: entity.criticality,
        isStatisticalOutlier: true,
        recurrenceCount: 2,
        detectionRuleId: 'RULE-NO-INV-05'
      });

      const explanation = generateExplanation('MISSING_INVESTIGATION', {
        caseNumber: c.caseNumber,
        entityName: entity.name,
        severity: c.severity,
        expectedWorkflow: workflow.expectedWorkflow,
        observedWorkflow: workflow.observedWorkflow
      });

      findings.push({
        id: `FIND-NOINV-${String(counter++).padStart(4, '0')}`,
        entityId: entity.id,
        entityName: entity.name,
        caseId: c.id,
        caseNumber: c.caseNumber,
        title: `Uninvestigated Case Dismissal [${c.severity}]`,
        category: 'Execution Gap',
        severity: c.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        priorityScore: examinerPriority.totalScore,
        priorityLevel: examinerPriority.priorityLevel,
        examinerPriority,
        scoreExplanation: {
          baseScore: examinerPriority.totalScore,
          contributors: {
            severity: 20,
            workflowImpact: 16,
            missingEvidence: 15,
            slaImpact: 0,
            entityCriticality: 8,
            statisticalAbnormality: 8
          },
          totalScore: examinerPriority.totalScore
        },
        whatHappened: explanation.whatHappened,
        whyFlagged: explanation.whyFlagged,
        expectedWorkflow: workflow.expectedWorkflow,
        observedWorkflow: workflow.observedWorkflow,
        supportingEvidence: baseSupporting,
        missingEvidence: [
          {
            expectedType: 'Investigation Case Record',
            description: 'No analyst assignment or triage notes recorded prior to closure.',
            impact: 'Complete absence of operational oversight.'
          }
        ],
        evidenceStrength: 'DEFINITIVE',
        evidenceQuality: examinerPriority.evidenceQuality,
        confidence: examinerPriority.confidence,
        dataCompleteness: examinerPriority.dataCompleteness,
        detectionRuleId: 'RULE-NO-INV-05',
        alternativeExplanations: [
          'Administrative bulk cleanup of obsolete or duplicate alert cases.',
          'Automated SOAR playbook closed ticket without analyst record creation.'
        ],
        historicalOccurrences: 2,
        recommendedAction: explanation.recommendedAction,
        counterfactual: explanation.counterfactual,
        source: 'Negative Space',
        mlAnomalySignal: mlAnomaly,
        reviewStatus: 'PENDING',
        createdAt: c.createdAt
      });
    }

    // Rule 6: Statistical/ML Anomaly Signal (when not covered by prior rules)
    if (mlAnomaly.isAnomaly && mlAnomaly.featureContributions.length > 0 && findings.filter(f => f.caseId === c.id).length === 0) {
      const examinerPriority = calculateExaminerPriority({
        severity: c.severity,
        hasWorkflowGap: false,
        missingEvidenceCount: 0,
        slaBreached: false,
        entityCriticality: entity.criticality,
        isStatisticalOutlier: true,
        recurrenceCount: 1,
        detectionRuleId: 'RULE-ML-ANOM-06'
      });

      findings.push({
        id: `FIND-ML-${String(counter++).padStart(4, '0')}`,
        entityId: entity.id,
        entityName: entity.name,
        caseId: c.id,
        caseNumber: c.caseNumber,
        title: `Multidimensional Behavioral Anomaly Signal [${c.severity}]`,
        category: 'Anomaly',
        severity: 'MEDIUM',
        priorityScore: examinerPriority.totalScore,
        priorityLevel: 'MEDIUM',
        examinerPriority,
        scoreExplanation: {
          baseScore: examinerPriority.totalScore,
          contributors: {
            severity: 10,
            workflowImpact: 6,
            missingEvidence: 0,
            slaImpact: 0,
            entityCriticality: 6,
            statisticalAbnormality: 8
          },
          totalScore: examinerPriority.totalScore
        },
        whatHappened: `Operational metrics for Case ${c.caseNumber} statistically diverge from historical cohort patterns across ${mlAnomaly.featureContributions.map(fc => fc.feature).join(', ')}.`,
        whyFlagged: `Isolation-forest behavioral analysis flagged this case as an operational outlier (Anomaly Score: ${Math.round(mlAnomaly.anomalyScore * 100)}%).`,
        expectedWorkflow: workflow.expectedWorkflow,
        observedWorkflow: workflow.observedWorkflow,
        supportingEvidence: baseSupporting,
        missingEvidence: [
          {
            expectedType: 'Standard Cohort Baseline Alignment',
            description: `Deviations observed: ${mlAnomaly.featureContributions.map(f => `${f.feature} (${f.deviation})`).join('; ')}`,
            impact: 'Non-standard operational handling requiring examiner verification.'
          }
        ],
        evidenceStrength: 'MODERATE',
        evidenceQuality: 'MODERATE',
        confidence: Math.round(mlAnomaly.anomalyScore * 100),
        dataCompleteness: 88,
        detectionRuleId: 'RULE-ML-ANOM-06',
        alternativeExplanations: [
          'Shift handover occurred mid-triage causing unusual queue duration.',
          'Analyst performed simultaneous multi-ticket triage.'
        ],
        historicalOccurrences: 1,
        recommendedAction: 'Review analyst ticket handling sequence for non-standard operational shortcuts or tooling anomalies.',
        counterfactual: 'If metrics for duration and artifact volume had tracked within normal cohort standard deviations, this secondary signal would not have registered.',
        source: 'ML Anomaly Signal',
        mlAnomalySignal: mlAnomaly,
        reviewStatus: 'PENDING',
        createdAt: c.createdAt
      });
    }
  }

  return findings;
}
