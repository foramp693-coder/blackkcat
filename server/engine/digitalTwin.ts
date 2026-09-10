import {
  DigitalTwinInput,
  DigitalTwinOutput,
  SOCHealthScoreBreakdown
} from '../types';

/**
 * FEATURE 16: DIGITAL TWIN SOC SIMULATOR ENGINE
 * Simulates systemic impacts of operational, architectural, and staffing adjustments on SOC efficacy:
 * Computes projected risk reductions, SLA adherence improvements, and cost efficiencies.
 */

export function runDigitalTwinSimulation(
  baselineHealth: SOCHealthScoreBreakdown,
  input: DigitalTwinInput
): DigitalTwinOutput {
  const baseHealth = baselineHealth.compositeScore;
  const baseRisk = 100 - baseHealth;
  const baseGov = baselineHealth.components.governance;
  const baseResilience = baselineHealth.components.cyberResilience;
  const baseSlaBreachRate = 24; // Baseline 24% breach rate

  // Staffing delta impact: +4% health per analyst added (capped at +15)
  const staffBoost = Math.min(15, Math.max(-20, input.staffingDeltaAnalysts * 4.5));

  // Escalation compliance boost: up to +12% health
  const escBoost = Math.round((input.escalationComplianceImprovementPct / 100) * 12);

  // Missing sensors: +8% health, +15% resilience
  const sensorBoost = input.enableMissingSensors ? 8 : 0;
  const sensorResilienceBoost = input.enableMissingSensors ? 14 : 0;

  // MTTR reduction: up to +10% health
  const mttrBoost = Math.round((input.mttrReductionPct / 100) * 10);

  // Detection rule tuning: up to +6% health
  const tuningBoost = Math.round((input.detectionRuleTuningPct / 100) * 6);

  const totalHealthDelta = staffBoost + escBoost + sensorBoost + mttrBoost + tuningBoost;

  const simHealth = Math.min(99, Math.max(25, baseHealth + totalHealthDelta));
  const simRisk = Math.max(8, Math.min(95, baseRisk - Math.round(totalHealthDelta * 0.95)));
  const simGov = Math.min(98, Math.max(30, baseGov + Math.round(escBoost * 1.5 + (input.enableMissingSensors ? 8 : 0))));
  const simResilience = Math.min(99, Math.max(30, baseResilience + Math.round(sensorResilienceBoost + mttrBoost * 0.8)));

  const slaReductionFactor = (1 - (input.mttrReductionPct / 100) * 0.5) * (input.staffingDeltaAnalysts > 0 ? 0.7 : 1.1);
  const simSlaBreach = Math.max(2, Math.round(baseSlaBreachRate * slaReductionFactor));

  // Projected Annual Operational Metrics
  const hoursSavedPerCase = (input.mttrReductionPct / 100) * 0.75 + (input.detectionRuleTuningPct / 100) * 0.5;
  const projectedAnnualHoursSaved = Math.round(hoursSavedPerCase * 1200);
  const costEfficiencyGainPct = Math.min(45, Math.round((totalHealthDelta / baseHealth) * 65));
  const predictedGapsEliminated = Math.min(12, Math.round((input.escalationComplianceImprovementPct > 50 ? 3 : 0) + (input.enableMissingSensors ? 2 : 0) + (input.staffingDeltaAnalysts >= 2 ? 3 : 1)));

  return {
    baseline: {
      riskScore: baseRisk,
      socHealth: baseHealth,
      governanceScore: baseGov,
      resilienceScore: baseResilience,
      slaBreachRate: baseSlaBreachRate
    },
    simulated: {
      riskScore: simRisk,
      socHealth: simHealth,
      governanceScore: simGov,
      resilienceScore: simResilience,
      slaBreachRate: simSlaBreach
    },
    projectedAnnualHoursSaved,
    costEfficiencyGainPct: Math.max(5, costEfficiencyGainPct),
    predictedGapsEliminated,
    simulatedHealthScore: simHealth,
    baselineHealthScore: baseHealth,
    simulatedResidualRisk: simRisk,
    baselineResidualRisk: baseRisk,
    simulatedSlaBreachPct: simSlaBreach,
    baselineSlaBreachPct: baseSlaBreachRate,
    analystHoursSavedPerMonth: Math.round(projectedAnnualHoursSaved / 12),
    componentDeltas: {
      detectionEfficacy: { baseline: 74, simulated: Math.min(98, 74 + Math.round(tuningBoost)), delta: Math.round(tuningBoost) },
      escalationAdherence: { baseline: 68, simulated: Math.min(98, 68 + Math.round(escBoost)), delta: Math.round(escBoost) },
      meanTimeToRespond: { baseline: 70, simulated: Math.min(98, 70 + Math.round(mttrBoost)), delta: Math.round(mttrBoost) },
      governanceMaturity: { baseline: baseGov, simulated: simGov, delta: simGov - baseGov },
      cyberResilience: { baseline: baseResilience, simulated: simResilience, delta: simResilience - baseResilience }
    }
  };
}
