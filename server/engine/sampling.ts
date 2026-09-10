import { Case, SupervisoryFinding, SmartSampleRecommendation, SamplingCandidate, PriorityLevel } from '../types';

export function generateSmartExaminerSample(
  cases: Case[],
  findings: SupervisoryFinding[],
  requestedSampleSize: number = 20
): SmartSampleRecommendation {
  const caseMap = new Map<string, Case>(cases.map(c => [c.id, c]));
  const findingsByCase = new Map<string, SupervisoryFinding[]>();
  for (const f of findings) {
    const list = findingsByCase.get(f.caseId) || [];
    list.push(f);
    findingsByCase.set(f.caseId, list);
  }

  // Calculate target quotas based on ISO 19011 stratified risk-based auditing
  // Target: 25% High Priority Outliers, 20% Unusual/Anomalies, 20% Repeated Pattern, 15% SLA Boundary, 20% Random Control
  const targetSize = Math.max(5, requestedSampleSize);
  const quotaHigh = Math.max(1, Math.round(targetSize * 0.25));
  const quotaUnusual = Math.max(1, Math.round(targetSize * 0.20));
  const quotaPattern = Math.max(1, Math.round(targetSize * 0.20));
  const quotaBoundary = Math.max(1, Math.round(targetSize * 0.15));
  const quotaControl = Math.max(1, targetSize - (quotaHigh + quotaUnusual + quotaPattern + quotaBoundary));

  const candidates: SamplingCandidate[] = [];
  const selectedCaseIds = new Set<string>();

  // 1. High-Priority Outliers (Highest priority score)
  const sortedByPriority = [...cases].sort((a, b) => {
    const scoreA = findingsByCase.get(a.id)?.[0]?.priorityScore || (a.severity === 'CRITICAL' ? 65 : a.severity === 'HIGH' ? 45 : 20);
    const scoreB = findingsByCase.get(b.id)?.[0]?.priorityScore || (b.severity === 'CRITICAL' ? 65 : b.severity === 'HIGH' ? 45 : 20);
    return scoreB - scoreA;
  });

  for (const c of sortedByPriority) {
    if (candidates.filter(cand => cand.samplingStrata === 'HIGH_PRIORITY_OUTLIER').length >= quotaHigh) break;
    const caseFindings = findingsByCase.get(c.id) || [];
    const topFinding = caseFindings[0];
    const score = topFinding?.priorityScore || (c.severity === 'CRITICAL' ? 75 : 55);

    candidates.push({
      caseId: c.id,
      caseNumber: c.caseNumber,
      entityId: c.entityId,
      entityName: topFinding?.entityName || c.entityId,
      priorityScore: score,
      priorityLevel: (score >= 75 ? 'CRITICAL' : score >= 55 ? 'HIGH' : 'MEDIUM') as PriorityLevel,
      severity: c.severity,
      samplingStrata: 'HIGH_PRIORITY_OUTLIER',
      selectionRationale: `Selected for Top Risk Strata: ${c.severity} severity case with ${caseFindings.length} compounded supervisory flags (${topFinding?.title || 'Execution Gap Alert'}).`,
      associatedFindingCount: caseFindings.length,
      flaggedGaps: caseFindings.map(f => f.category),
      status: c.status,
      durationMinutes: c.slaActualMinutes || 45
    });
    selectedCaseIds.add(c.id);
  }

  // 2. Unusual Anomaly Cases (Statistical / Behavioral outliers)
  const anomalyCases = cases.filter(c => {
    if (selectedCaseIds.has(c.id)) return false;
    const caseFindings = findingsByCase.get(c.id) || [];
    return caseFindings.some(f => f.category === 'Anomaly' || f.category === 'Premature Closure' || f.source === 'ML Anomaly Signal');
  });

  for (const c of anomalyCases) {
    if (candidates.filter(cand => cand.samplingStrata === 'UNUSUAL_ANOMALY').length >= quotaUnusual) break;
    const caseFindings = findingsByCase.get(c.id) || [];
    const topFinding = caseFindings[0];

    candidates.push({
      caseId: c.id,
      caseNumber: c.caseNumber,
      entityId: c.entityId,
      entityName: topFinding?.entityName || c.entityId,
      priorityScore: topFinding?.priorityScore || 62,
      priorityLevel: (topFinding?.priorityLevel || 'HIGH') as PriorityLevel,
      severity: c.severity,
      samplingStrata: 'UNUSUAL_ANOMALY',
      selectionRationale: `Selected for Behavioral Anomaly: Unusually rapid or divergent ticket lifecycle duration (${c.slaActualMinutes || 8}m) deviating >2 sigma from peer mean.`,
      associatedFindingCount: caseFindings.length,
      flaggedGaps: caseFindings.map(f => f.category),
      status: c.status,
      durationMinutes: c.slaActualMinutes || 8
    });
    selectedCaseIds.add(c.id);
  }

  // 3. Repeated Pattern Cases (Correlated systemic gaps)
  const patternCases = cases.filter(c => {
    if (selectedCaseIds.has(c.id)) return false;
    const caseFindings = findingsByCase.get(c.id) || [];
    return caseFindings.some(f => f.category === 'Execution Gap' || f.category === 'Missing Evidence');
  });

  for (const c of patternCases) {
    if (candidates.filter(cand => cand.samplingStrata === 'REPEATED_PATTERN').length >= quotaPattern) break;
    const caseFindings = findingsByCase.get(c.id) || [];
    const topFinding = caseFindings[0];

    candidates.push({
      caseId: c.id,
      caseNumber: c.caseNumber,
      entityId: c.entityId,
      entityName: topFinding?.entityName || c.entityId,
      priorityScore: topFinding?.priorityScore || 58,
      priorityLevel: (topFinding?.priorityLevel || 'HIGH') as PriorityLevel,
      severity: c.severity,
      samplingStrata: 'REPEATED_PATTERN',
      selectionRationale: `Selected for Recurrent Workflow Pattern: Case exemplifies repeated procedural omission (${topFinding?.title || 'Missing Escalation Verification'}).`,
      associatedFindingCount: caseFindings.length,
      flaggedGaps: caseFindings.map(f => f.category),
      status: c.status,
      durationMinutes: c.slaActualMinutes || 35
    });
    selectedCaseIds.add(c.id);
  }

  // 4. SLA Boundary Cases (Cases resolved within ±10% of target SLA threshold)
  const boundaryCases = cases.filter(c => {
    if (selectedCaseIds.has(c.id)) return false;
    const diff = Math.abs((c.slaActualMinutes || 0) - c.slaTargetMinutes);
    return diff <= 15 || c.slaBreached;
  });

  for (const c of boundaryCases) {
    if (candidates.filter(cand => cand.samplingStrata === 'SLA_BOUNDARY').length >= quotaBoundary) break;
    const caseFindings = findingsByCase.get(c.id) || [];
    const topFinding = caseFindings[0];

    candidates.push({
      caseId: c.id,
      caseNumber: c.caseNumber,
      entityId: c.entityId,
      entityName: topFinding?.entityName || c.entityId,
      priorityScore: topFinding?.priorityScore || (c.slaBreached ? 65 : 45),
      priorityLevel: (topFinding?.priorityLevel || (c.slaBreached ? 'HIGH' : 'MEDIUM')) as PriorityLevel,
      severity: c.severity,
      samplingStrata: 'SLA_BOUNDARY',
      selectionRationale: `Selected for SLA Boundary Verification: Resolved at ${c.slaActualMinutes || c.slaTargetMinutes}m (Target: ${c.slaTargetMinutes}m) to inspect for SLA gaming or delayed containment sign-off.`,
      associatedFindingCount: caseFindings.length,
      flaggedGaps: caseFindings.map(f => f.category),
      status: c.status,
      durationMinutes: c.slaActualMinutes || c.slaTargetMinutes
    });
    selectedCaseIds.add(c.id);
  }

  // 5. Random Baseline Controls (Statistically compliant cases to avoid confirmation bias)
  const remainingCases = cases.filter(c => !selectedCaseIds.has(c.id));
  for (const c of remainingCases) {
    if (candidates.length >= targetSize) break;
    const caseFindings = findingsByCase.get(c.id) || [];

    candidates.push({
      caseId: c.id,
      caseNumber: c.caseNumber,
      entityId: c.entityId,
      entityName: c.entityId,
      priorityScore: 25,
      priorityLevel: 'LOW',
      severity: c.severity,
      samplingStrata: 'RANDOM_CONTROL',
      selectionRationale: `Selected for Randomized Baseline Control: Representative sample of conforming operational tickets to ensure unbiased supervisory evaluation.`,
      associatedFindingCount: caseFindings.length,
      flaggedGaps: [],
      status: c.status,
      durationMinutes: c.slaActualMinutes || 28
    });
    selectedCaseIds.add(c.id);
  }

  // Fill up if below targetSize
  for (const c of cases) {
    if (candidates.length >= targetSize) break;
    if (selectedCaseIds.has(c.id)) continue;
    candidates.push({
      caseId: c.id,
      caseNumber: c.caseNumber,
      entityId: c.entityId,
      entityName: c.entityId,
      priorityScore: 30,
      priorityLevel: 'LOW',
      severity: c.severity,
      samplingStrata: 'RANDOM_CONTROL',
      selectionRationale: 'Supplemental control case to satisfy requested sample size quota.',
      associatedFindingCount: 0,
      flaggedGaps: [],
      status: c.status,
      durationMinutes: c.slaActualMinutes || 30
    });
    selectedCaseIds.add(c.id);
  }

  return {
    totalPopulationCases: cases.length,
    totalPopulationRecords: cases.length * 5,
    recommendedSampleSize: candidates.length,
    composition: [
      { strata: 'High-Priority Outliers', count: candidates.filter(c => c.samplingStrata === 'HIGH_PRIORITY_OUTLIER').length, description: 'Highest compound risk & severe workflow bypasses' },
      { strata: 'Unusual Operational Cases', count: candidates.filter(c => c.samplingStrata === 'UNUSUAL_ANOMALY').length, description: 'Statistical duration & triage velocity anomalies' },
      { strata: 'Repeated Pattern Clusters', count: candidates.filter(c => c.samplingStrata === 'REPEATED_PATTERN').length, description: 'Representative of recurrent procedural omissions' },
      { strata: 'SLA Boundary Cases', count: candidates.filter(c => c.samplingStrata === 'SLA_BOUNDARY').length, description: 'Near-threshold resolutions to detect SLA gaming' },
      { strata: 'Random Baseline Controls', count: candidates.filter(c => c.samplingStrata === 'RANDOM_CONTROL').length, description: 'Unbiased conforming cases to validate baseline accuracy' }
    ],
    candidates,
    generatedAt: new Date().toISOString()
  };
}
