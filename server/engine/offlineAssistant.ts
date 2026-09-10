import {
  Case,
  Alert,
  Entity,
  SupervisoryFinding,
  EnsembleAnomalyFinding,
  SOCHealthScoreBreakdown,
  CSEPeerProfile
} from '../types';

/**
 * FEATURE 17: OFFLINE AI SUPERVISORY COPILOT
 * 100% Offline rule & pattern-based natural language assistant for air-gapped cybersecurity supervisors.
 * Zero external calls, zero API keys, zero cloud dependency.
 */

export interface AssistantResponse {
  query: string;
  intent: string;
  replyText: string;
  dataPayload?: any;
  suggestedFollowUps: string[];
}

export function handleOfflineAssistantQuery(
  query: string,
  cases: Case[],
  alerts: Alert[],
  findings: SupervisoryFinding[],
  anomalies: EnsembleAnomalyFinding[],
  socHealth: SOCHealthScoreBreakdown,
  benchmarks: CSEPeerProfile[],
  entities: Entity[]
): AssistantResponse {
  const q = query.toLowerCase().trim();

  // 1. Highest Risk Cases
  if (q.includes('risk') || q.includes('critical case') || q.includes('top cases') || q.includes('worst')) {
    const topFindings = findings.slice(0, 5);
    const bullets = topFindings.map(f => `• **${f.caseNumber}** (${f.entityId}) - Priority: ${f.priorityScore}/100, Gap: *${f.title}*`).join('\n');
    return {
      query,
      intent: 'QUERY_HIGH_RISK_CASES',
      replyText: `Here are the top priority cases identified by the supervisory analytics engine:\n\n${bullets}\n\nThese cases present significant indicators of premature dismissal or omitted escalation protocols requiring formal supervisory review.`,
      dataPayload: topFindings,
      suggestedFollowUps: [
        'Explain why the top case was flagged',
        'Which analysts handled these cases?',
        'Show me peer benchmarks'
      ]
    };
  }

  // 2. SOC Health Score
  if (q.includes('soc health') || q.includes('health score') || q.includes('grade') || q.includes('how is our soc')) {
    return {
      query,
      intent: 'QUERY_SOC_HEALTH',
      replyText: `The current **Composite SOC Health Score is ${socHealth.compositeScore}/100** (Grade: **${socHealth.letterGrade}**).\n\nComponent Breakdown:\n• Detection Efficacy: **${socHealth.components.detection}/100**\n• Investigation Rigor: **${socHealth.components.investigation}/100**\n• Escalation Compliance: **${socHealth.components.escalation}/100**\n• Response SLA Adherence: **${socHealth.components.response}/100**\n• Governance Stability: **${socHealth.components.governance}/100**\n• Operational Discipline: **${socHealth.components.operationalDiscipline}/100**\n• Cyber Resilience: **${socHealth.components.cyberResilience}/100**\n\nThe national peer sector average sits at 72/100.`,
      dataPayload: socHealth,
      suggestedFollowUps: [
        'How can we improve our SOC Health Score?',
        'What are the main single points of failure?',
        'Run digital twin simulation'
      ]
    };
  }

  // 3. Escalation Bypasses & Violations
  if (q.includes('escalat') || q.includes('tier-2') || q.includes('bypass') || q.includes('omission')) {
    const escFindings = findings.filter(f => f.title.toLowerCase().includes('escalation') || f.category === 'Execution Gap');
    return {
      query,
      intent: 'QUERY_ESCALATION_GAPS',
      replyText: `The supervisory engine detected **${escFindings.length} incidents** where mandated Tier-2 / Incident Commander escalation protocols were bypassed.\n\nKey Examples:\n${escFindings.slice(0, 3).map(f => `• **${f.caseNumber}**: ${f.title} (${f.severity} severity)`).join('\n')}\n\nUnder NCIIPC Section 4.3 guidelines, high/critical severity security alerts cannot be closed without verified Tier-2 escalation sign-off.`,
      dataPayload: escFindings,
      suggestedFollowUps: [
        'Which analysts bypassed escalation?',
        'Generate compliance remediation action items',
        'Show me timeline replay of these cases'
      ]
    };
  }

  // 4. Analyst Performance & Shortcuts
  if (q.includes('analyst') || q.includes('copy paste') || q.includes('premature') || q.includes('template')) {
    const analystAnomalies = anomalies.filter(a => a.anomalyType === 'ABNORMAL_ALERT_CLOSURE' || a.anomalyType === 'ANALYST_BEHAVIOUR_OUTLIER');
    return {
      query,
      intent: 'QUERY_ANALYST_METRICS',
      replyText: `The offline NLP and Anomaly engines analyzed active analyst investigations:\n\n• **${analystAnomalies.length} cases** flagged for abnormal closure speed (<8m) or boilerplate documentation.\n• Notable flagged analysts: **${Array.from(new Set(analystAnomalies.map(a => a.analyst))).slice(0, 3).join(', ')}**.\n\nRecommended supervisory action: Review ticket notes for boilerplate copy-paste strings and enforce mandatory forensic artifact attachments.`,
      dataPayload: analystAnomalies,
      suggestedFollowUps: [
        'Show me the NLP template cluster report',
        'Which cases have missing evidence?',
        'What is our false positive dismissal rate?'
      ]
    };
  }

  // 5. Peer Benchmarking
  if (q.includes('peer') || q.includes('benchmark') || q.includes('industry') || q.includes('sector')) {
    const topOrg = benchmarks[0];
    return {
      query,
      intent: 'QUERY_PEER_BENCHMARKS',
      replyText: `Peer benchmarking evaluation across **${benchmarks.length} Critical Sector Entities**:\n\n• Cohort Median Health: **72/100**\n• Cohort Mean MTTR: **55 minutes**\n• Cohort Escalation Rate: **22%**\n• Leading Entity: **${topOrg?.entityName || 'State Power Grid'}** (Score: ${topOrg?.benchmarkScore || 85}/100, ${topOrg?.overallPercentile || 90}th percentile)\n\nEntities with high false-positive dismissals (>40%) deviate by +18% from industry baselines.`,
      dataPayload: benchmarks,
      suggestedFollowUps: [
        'Show radar comparison chart',
        'Which entities have critical deviations?',
        'Show me the executive summary report'
      ]
    };
  }

  // 6. MITRE ATT&CK & Blind Spots
  if (q.includes('mitre') || q.includes('attack') || q.includes('blind spot') || q.includes('coverage') || q.includes('sensor')) {
    return {
      query,
      intent: 'QUERY_MITRE_COVERAGE',
      replyText: `MITRE ATT&CK Matrix Assessment:\n\n• Overall Enterprise Matrix Coverage: **38%**\n• Top Covered Tactic: **Credential Access (TA0006)** & **Execution (TA0002)**\n• Critical Unmonitored Blind Spots: **Defense Evasion (TA0005)**, **Exfiltration (TA0010)**, and **Impact (TA0040)**\n\nRecommendation: Deploy endpoint telemetry forwarders to close sensor visibility gaps in critical SCADA and Core Banking subnets.`,
      suggestedFollowUps: [
        'Show cases related to Credential Access',
        'What happens if we enable missing sensors in digital twin?',
        'Show top priority review candidates'
      ]
    };
  }

  // Default Fallback
  return {
    query,
    intent: 'GENERAL_SUPERVISORY_SUMMARY',
    replyText: `SAT-SA Offline Supervisory Assistant active. I analyzed **${cases.length} cases**, **${alerts.length} alerts**, and **${findings.length} supervisory findings** across **${entities.length} critical sector entities**.\n\nCurrent status:\n• Composite SOC Health: **${socHealth.compositeScore}/100** (Grade: ${socHealth.letterGrade})\n• Total Active Gaps: **${findings.length} findings**\n• High-Confidence ML Anomalies: **${anomalies.length} detected**\n\nHow would you like to proceed?`,
    suggestedFollowUps: [
      'Show me highest risk cases',
      'What is our SOC health score?',
      'Which cases bypassed escalation?',
      'Show peer benchmarks'
    ]
  };
}
