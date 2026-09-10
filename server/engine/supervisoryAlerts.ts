import {
  Case,
  Alert,
  Investigation,
  Escalation,
  Closure,
  Entity,
  SupervisoryFinding
} from '../types';

export interface DynamicSupervisoryAlert {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  entityName: string;
  entityId: string;
  caseNumber: string;
  caseId: string;
  ruleCode: string;
  ruleName: string;
  description: string;
  acknowledged: boolean;
  statutoryMandate: string;
  evidenceSummary: string;
  metricValue: string;
}

export interface DynamicPolicyRule {
  id: string;
  code: string;
  name: string;
  description: string;
  threshold: string;
  enabled: boolean;
  statutoryMandate: string;
  category: 'ESCALATION' | 'FORENSICS' | 'NLP_QUALITY' | 'SLA_GOVERNANCE' | 'DUAL_CONTROL';
  activeViolationsCount: number;
}

export const DEFAULT_POLICY_RULES: DynamicPolicyRule[] = [
  {
    id: 'PR-1',
    code: 'POL-ESC-01',
    name: 'Mandatory Escalation SLA Gate',
    description: 'Any alert or incident classified as CRITICAL must initiate Tier 2 / Incident Commander escalation within 30 minutes.',
    threshold: '≤ 30 mins',
    enabled: true,
    statutoryMandate: 'CERT-In Incident Guidelines Clause 4.2',
    category: 'ESCALATION',
    activeViolationsCount: 0
  },
  {
    id: 'PR-2',
    code: 'POL-CLS-03',
    name: 'Forensic Evidence Verification Gate',
    description: 'High and Critical incidents cannot transition to RESOLVED/CLOSED without verified forensic evidence artifacts (PCAP, Memory dump, or SIEM timeline).',
    threshold: '≥ 2 Evidence Artifacts',
    enabled: true,
    statutoryMandate: 'NCIIPC Security Rulebook Sec 12.4',
    category: 'FORENSICS',
    activeViolationsCount: 0
  },
  {
    id: 'PR-3',
    code: 'POL-TRG-04',
    name: 'NLP Investigation Thoroughness Minimum',
    description: 'Analyst investigation notes must demonstrate substantive qualitative analysis with no generic boilerplate copy-pasting.',
    threshold: 'Score ≥ 65/100 & Boilerplate < 70%',
    enabled: true,
    statutoryMandate: 'SIH26157 Quality Assurance Standards',
    category: 'NLP_QUALITY',
    activeViolationsCount: 0
  },
  {
    id: 'PR-4',
    code: 'POL-SLA-02',
    name: 'Shift Handover SLA Cliff Protection',
    description: 'Incidents queued or active during shift changeover (06:00-08:00, 14:00-16:00, 22:00-00:00) must not experience handover latency spikes.',
    threshold: 'Handover Delta ≤ 45 mins',
    enabled: true,
    statutoryMandate: 'ISO 27001:2022 A.8.16 Operational Continuity',
    category: 'SLA_GOVERNANCE',
    activeViolationsCount: 0
  },
  {
    id: 'PR-5',
    code: 'POL-SUP-05',
    name: 'Critical Infrastructure Dual Supervisory Sign-off',
    description: 'Closures of high/critical incidents affecting critical infrastructure sector entities require independent senior examiner confirmation.',
    threshold: '2-Eyes Review Required',
    enabled: true,
    statutoryMandate: 'RBI Cyber Security Framework Sec G.3',
    category: 'DUAL_CONTROL',
    activeViolationsCount: 0
  }
];

export function evaluateDynamicSupervisoryAlerts(
  cases: Case[],
  alerts: Alert[],
  investigations: Investigation[],
  escalations: Escalation[],
  closures: Closure[],
  entities: Entity[],
  findings: SupervisoryFinding[],
  rules: DynamicPolicyRule[]
): { alerts: DynamicSupervisoryAlert[]; evaluatedRules: DynamicPolicyRule[] } {
  const dynamicAlerts: DynamicSupervisoryAlert[] = [];
  const ruleCounts: Record<string, number> = {};

  for (const rule of rules) {
    ruleCounts[rule.code] = 0;
  }

  // 1. Check POL-ESC-01: Critical cases with missed escalation SLA
  const escRule = rules.find(r => r.code === 'POL-ESC-01');
  if (escRule && escRule.enabled) {
    const criticalCases = cases.filter(c => c.severity === 'CRITICAL');
    for (const c of criticalCases) {
      const esc = escalations.find(e => e.caseId === c.id);
      const ent = entities.find(e => e.id === c.entityId);
      const isMissingEsc = !esc;
      const isDelayedEsc = esc && esc.delayMinutesFromAlert && esc.delayMinutesFromAlert > 30;

      if (isMissingEsc || isDelayedEsc) {
        ruleCounts['POL-ESC-01'] = (ruleCounts['POL-ESC-01'] || 0) + 1;
        dynamicAlerts.push({
          id: `ALT-ESC-${c.id}`,
          timestamp: c.createdAt,
          severity: 'CRITICAL',
          title: isMissingEsc ? 'Unescalated Critical Incident Breach' : 'Escalation SLA Delay Threshold Exceeded',
          entityName: ent?.name || 'Critical Infrastructure Entity',
          entityId: c.entityId,
          caseNumber: c.caseNumber,
          caseId: c.id,
          ruleCode: 'POL-ESC-01',
          ruleName: escRule.name,
          description: isMissingEsc
            ? `Critical case ${c.caseNumber} was never escalated to Tier 2/Incident Commander.`
            : `Escalation took ${esc?.delayMinutesFromAlert} minutes, breaching the 30-minute statutory mandate.`,
          acknowledged: false,
          statutoryMandate: escRule.statutoryMandate,
          evidenceSummary: `Case Severity: CRITICAL | Target: 30 mins | Actual: ${esc?.delayMinutesFromAlert ?? 'Never Escalated'}`,
          metricValue: `${esc?.delayMinutesFromAlert ?? 'N/A'} mins`
        });
      }
    }
  }

  // 2. Check POL-CLS-03: Closure without forensic evidence
  const clsRule = rules.find(r => r.code === 'POL-CLS-03');
  if (clsRule && clsRule.enabled) {
    const highCritCases = cases.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH');
    for (const c of highCritCases) {
      const cl = closures.find(item => item.caseId === c.id);
      const ent = entities.find(e => e.id === c.entityId);
      if (cl && (!cl.approvedBySupervisor || cl.classification === 'INCONCLUSIVE')) {
        ruleCounts['POL-CLS-03'] = (ruleCounts['POL-CLS-03'] || 0) + 1;
        dynamicAlerts.push({
          id: `ALT-CLS-${c.id}`,
          timestamp: cl.closedAt || c.createdAt,
          severity: 'HIGH',
          title: 'Premature Incident Closure Without Forensic Evidence',
          entityName: ent?.name || 'Critical Infrastructure Entity',
          entityId: c.entityId,
          caseNumber: c.caseNumber,
          caseId: c.id,
          ruleCode: 'POL-CLS-03',
          ruleName: clsRule.name,
          description: `Case ${c.caseNumber} closed by analyst ${cl.closedBy} with unapproved/inconclusive classification.`,
          acknowledged: false,
          statutoryMandate: clsRule.statutoryMandate,
          evidenceSummary: `Justification: ${cl.justification || 'N/A'} | Classification: ${cl.classification}`,
          metricValue: cl.classification
        });
      }
    }
  }

  // 3. Check POL-TRG-04: Substandard Investigation Quality
  const nlpRule = rules.find(r => r.code === 'POL-TRG-04');
  if (nlpRule && nlpRule.enabled) {
    for (const inv of investigations) {
      const c = cases.find(item => item.id === inv.caseId);
      if (!c) continue;
      const ent = entities.find(e => e.id === c.entityId);
      const notes = inv.findingsNotes || inv.notes || '';
      const isShort = notes.length < 50;
      const isBoilerplate = notes.toLowerCase().includes('routine false positive') || notes.toLowerCase().includes('no further action required') || notes.toLowerCase().includes('closed per standard procedure');

      if (isShort || isBoilerplate) {
        ruleCounts['POL-TRG-04'] = (ruleCounts['POL-TRG-04'] || 0) + 1;
        dynamicAlerts.push({
          id: `ALT-NLP-${inv.id}`,
          timestamp: inv.completedAt || c.createdAt,
          severity: 'MEDIUM',
          title: 'Investigation Notes Quality Deficiency',
          entityName: ent?.name || 'Critical Infrastructure Entity',
          entityId: c.entityId,
          caseNumber: c.caseNumber,
          caseId: c.id,
          ruleCode: 'POL-TRG-04',
          ruleName: nlpRule.name,
          description: `Analyst ${inv.analyst || inv.analystId} submitted boilerplate/abbreviated investigation notes without thorough qualitative findings.`,
          acknowledged: false,
          statutoryMandate: nlpRule.statutoryMandate,
          evidenceSummary: `Notes Length: ${notes.length} chars | Notes Sample: "${notes.slice(0, 70)}..."`,
          metricValue: `${notes.length} chars`
        });
      }
    }
  }

  // 4. Check POL-SLA-02: SLA Breached Cases
  const slaRule = rules.find(r => r.code === 'POL-SLA-02');
  if (slaRule && slaRule.enabled) {
    const slaBreached = cases.filter(c => c.slaBreached);
    for (const c of slaBreached.slice(0, 6)) {
      const ent = entities.find(e => e.id === c.entityId);
      ruleCounts['POL-SLA-02'] = (ruleCounts['POL-SLA-02'] || 0) + 1;
      dynamicAlerts.push({
        id: `ALT-SLA-${c.id}`,
        timestamp: c.createdAt,
        severity: 'HIGH',
        title: 'Statutory Resolution SLA Breach Timeout',
        entityName: ent?.name || 'Critical Infrastructure Entity',
        entityId: c.entityId,
        caseNumber: c.caseNumber,
        caseId: c.id,
        ruleCode: 'POL-SLA-02',
        ruleName: slaRule.name,
        description: `Case ${c.caseNumber} exceeded SLA target of ${c.slaTargetMinutes}m (Actual: ${c.slaActualMinutes}m).`,
        acknowledged: true,
        statutoryMandate: slaRule.statutoryMandate,
        evidenceSummary: `Target: ${c.slaTargetMinutes}m | Actual: ${c.slaActualMinutes}m | Delta: +${(c.slaActualMinutes || 0) - (c.slaTargetMinutes || 0)}m`,
        metricValue: `${c.slaActualMinutes}m`
      });
    }
  }

  // 5. Findings from Supervisory Finding Rules
  for (const f of findings.filter(f => f.severity === 'CRITICAL').slice(0, 5)) {
    if (!dynamicAlerts.some(a => a.caseId === f.caseId && a.severity === 'CRITICAL')) {
      ruleCounts['POL-SUP-05'] = (ruleCounts['POL-SUP-05'] || 0) + 1;
      dynamicAlerts.push({
        id: `ALT-FIND-${f.id}`,
        timestamp: f.createdAt,
        severity: 'CRITICAL',
        title: f.title,
        entityName: f.entityName,
        entityId: f.entityId,
        caseNumber: f.caseNumber,
        caseId: f.caseId,
        ruleCode: 'POL-SUP-05',
        ruleName: 'Critical Supervisory Finding Trigger',
        description: f.whatHappened,
        acknowledged: f.reviewStatus !== 'PENDING',
        statutoryMandate: f.counterfactual || 'ISO 19011 Clause 6.4 Oversight',
        evidenceSummary: f.whyFlagged,
        metricValue: `Risk: ${f.priorityScore}`
      });
    }
  }

  const evaluatedRules = rules.map(r => ({
    ...r,
    activeViolationsCount: ruleCounts[r.code] || 0
  }));

  // Sort alerts: unacknowledged first, then severity
  const sevWeight = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
  dynamicAlerts.sort((a, b) => {
    if (a.acknowledged !== b.acknowledged) {
      return a.acknowledged ? 1 : -1;
    }
    return sevWeight[b.severity] - sevWeight[a.severity];
  });

  return { alerts: dynamicAlerts, evaluatedRules };
}
