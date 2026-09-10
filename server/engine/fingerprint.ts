import { Entity, Case, Investigation, Escalation, Closure, EvidenceRecord, SupervisoryFinding, SOCBehaviourFingerprint } from '../types';

export function generateSOCBehaviourFingerprints(
  entities: Entity[],
  cases: Case[],
  investigations: Investigation[],
  escalations: Escalation[],
  closures: Closure[],
  evidences: EvidenceRecord[],
  findings: SupervisoryFinding[]
): SOCBehaviourFingerprint[] {
  const fingerprints: SOCBehaviourFingerprint[] = [];

  for (const entity of entities) {
    const entityCases = cases.filter(c => c.entityId === entity.id);
    const entityFindings = findings.filter(f => f.entityId === entity.id);
    const entityInvs = investigations.filter(i => entityCases.some(c => c.id === i.caseId));
    const entityEscs = escalations.filter(e => entityCases.some(c => c.id === e.caseId));
    const entityEvds = evidences.filter(ev => entityCases.some(c => c.id === ev.caseId));

    // 1. Investigation Velocity (P50 & P90 durations)
    const durations = entityInvs.map(i => i.durationMinutes || 0).filter(d => d > 0).sort((a, b) => a - b);
    const p50 = durations.length > 0 ? durations[Math.floor(durations.length * 0.5)] : 35;
    const p90 = durations.length > 0 ? durations[Math.floor(durations.length * 0.9)] : 90;

    let invLabel = 'Normative Investigation Velocity';
    let invScore = 65;
    if (p50 < 12) {
      invLabel = 'Rapid Triage Velocity (<15m)';
      invScore = 85;
    } else if (p50 > 60) {
      invLabel = 'Extended Deliberative Investigation (>60m)';
      invScore = 40;
    }

    // 2. Escalation Propensity
    const critHighCases = entityCases.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH');
    const escCount = entityEscs.length;
    const escRatePct = critHighCases.length > 0 ? Math.round((escCount / critHighCases.length) * 100) : 50;

    let escLabel = 'Normative Escalation Frequency';
    let escScore = 60;
    if (escRatePct < 20) {
      escLabel = 'Below-Baseline Escalation Retention (<20%)';
      escScore = 25;
    } else if (escRatePct > 70) {
      escLabel = 'High Upward Escalation Routing (>70%)';
      escScore = 80;
    }

    // 3. Closure Concentration (Off-hours / End-of-shift burst pattern)
    let offHoursClosures = 0;
    for (const c of entityCases) {
      if (c.closedAt) {
        const h = new Date(c.closedAt).getUTCHours();
        if (h >= 22 || h <= 6) offHoursClosures++;
      }
    }
    const offHoursPct = entityCases.length > 0 ? Math.round((offHoursClosures / entityCases.length) * 100) : 15;
    let closureLabel = 'Balanced 24/7 Shift Resolution Flow';
    let closureScore = 70;
    if (offHoursPct > 35) {
      closureLabel = 'Elevated Night-Shift Closure Burst (>35%)';
      closureScore = 35;
    }

    // 4. Evidence Completeness
    const casesWithEvidence = new Set(entityEvds.map(ev => ev.caseId));
    const coveragePct = entityCases.length > 0 ? Math.round((casesWithEvidence.size / entityCases.length) * 100) : 40;
    let evdLabel = 'Moderate Artifact Corroboration';
    let evdScore = 55;
    if (coveragePct > 75) {
      evdLabel = 'High Cryptographic Artifact Completeness (>75%)';
      evdScore = 88;
    } else if (coveragePct < 30) {
      evdLabel = 'Low Evidentiary Artifact Density (<30%)';
      evdScore = 20;
    }

    // 5. SLA Adherence
    const breachedCases = entityCases.filter(c => c.slaBreached);
    const breachRatePct = entityCases.length > 0 ? Math.round((breachedCases.length / entityCases.length) * 100) : 0;
    let slaLabel = 'High SLA Milestone Conformance';
    let slaScore = 90;
    if (breachRatePct > 25) {
      slaLabel = 'Elevated SLA Deviation Rate (>25%)';
      slaScore = 30;
    } else if (breachRatePct > 10) {
      slaLabel = 'Moderate SLA Deviation Pattern';
      slaScore = 60;
    }

    // 6. Repeated Gaps Rate
    const gapCount = entityFindings.filter(f => f.category === 'Execution Gap' || f.category === 'Missing Evidence').length;
    let gapLabel = 'Low Recurrent Workflow Deviation Rate';
    let gapScore = 80;
    if (gapCount >= 4) {
      gapLabel = `Repeated Escalation / Evidentiary Gap Cluster (${gapCount} flags)`;
      gapScore = 25;
    } else if (gapCount >= 2) {
      gapLabel = `Occasional Procedural Gaps (${gapCount} flags)`;
      gapScore = 55;
    }

    // Synthesize descriptive summary profile
    const summaryTraits: string[] = [];
    if (p50 < 15) summaryTraits.push('Fast Investigation');
    else if (p50 > 60) summaryTraits.push('Deliberative Triage');
    else summaryTraits.push('Normative Investigation');

    if (escRatePct < 25) summaryTraits.push('Low Escalation Frequency');
    else if (escRatePct > 65) summaryTraits.push('High Escalation Ratio');

    if (gapCount >= 3) summaryTraits.push('Repeated Escalation Evidence Gaps');

    if (breachRatePct > 20) summaryTraits.push('Moderate SLA Deviation');
    else summaryTraits.push('Tight SLA Adherence');

    if (coveragePct < 40) summaryTraits.push('Low Evidence Completeness');
    else summaryTraits.push('Verified Evidence Trail');

    fingerprints.push({
      entityId: entity.id,
      entityName: entity.name,
      investigationVelocity: { score: invScore, label: invLabel, p50Duration: p50, p90Duration: p90 },
      escalationPropensity: { score: escScore, label: escLabel, ratePct: escRatePct },
      closureConcentration: { score: closureScore, label: closureLabel, offHoursBurstPct: offHoursPct },
      evidenceCompleteness: { score: evdScore, label: evdLabel, hashCoveragePct: coveragePct },
      slaAdherence: { score: slaScore, label: slaLabel, breachRatePct },
      repeatedGapsRate: { score: gapScore, label: gapLabel, gapCount },
      summaryProfile: summaryTraits.join(', ')
    });
  }

  return fingerprints;
}
