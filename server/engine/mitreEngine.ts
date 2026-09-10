import {
  Alert,
  MITREMatrixPayload,
  MITRETacticCoverage,
  MITRETechniqueItem
} from '../types';

/**
 * FEATURE 15: MITRE ATT&CK MATRIX & COVERAGE ENGINE
 * Maps organizational SOC alert stream to the MITRE ATT&CK Enterprise Matrix:
 * Detects monitored techniques, coverage gaps, and unmonitored blind spot tactics.
 */

const MITRE_TACTICS_DEF = [
  { id: 'TA0001', name: 'Initial Access', knownCount: 9 },
  { id: 'TA0002', name: 'Execution', knownCount: 14 },
  { id: 'TA0003', name: 'Persistence', knownCount: 19 },
  { id: 'TA0004', name: 'Privilege Escalation', knownCount: 13 },
  { id: 'TA0005', name: 'Defense Evasion', knownCount: 42 },
  { id: 'TA0006', name: 'Credential Access', knownCount: 17 },
  { id: 'TA0007', name: 'Discovery', knownCount: 30 },
  { id: 'TA0008', name: 'Lateral Movement', knownCount: 9 },
  { id: 'TA0009', name: 'Collection', knownCount: 17 },
  { id: 'TA0010', name: 'Exfiltration', knownCount: 9 },
  { id: 'TA0011', name: 'Command and Control', knownCount: 16 },
  { id: 'TA0040', name: 'Impact', knownCount: 14 }
];

export function generateMITREMatrixCoverage(alerts: Alert[]): MITREMatrixPayload {
  // Aggregate alerts to techniques
  const techniqueMap = new Map<string, {
    tactic: string;
    name: string;
    alertCount: number;
    severity: Alert['severity'];
  }>();

  // Baseline standard techniques mapped from alert content
  for (const a of alerts) {
    const text = (a.title + ' ' + a.category).toLowerCase();
    let techId = 'T1059';
    let techName = 'Command and Scripting Interpreter';
    let tactic = 'Execution';

    if (text.includes('brute') || text.includes('password') || text.includes('credential')) {
      techId = 'T1110';
      techName = 'Brute Force';
      tactic = 'Credential Access';
    } else if (text.includes('phish') || text.includes('cve') || text.includes('exploit') || text.includes('access')) {
      techId = 'T1190';
      techName = 'Exploit Public-Facing Application';
      tactic = 'Initial Access';
    } else if (text.includes('privilege') || text.includes('uac') || text.includes('sudo')) {
      techId = 'T1078';
      techName = 'Valid Accounts';
      tactic = 'Privilege Escalation';
    } else if (text.includes('exfiltration') || text.includes('upload') || text.includes('transfer')) {
      techId = 'T1041';
      techName = 'Exfiltration Over C2 Channel';
      tactic = 'Exfiltration';
    } else if (text.includes('powershell') || text.includes('cmd') || text.includes('script')) {
      techId = 'T1059.001';
      techName = 'PowerShell Scripting';
      tactic = 'Execution';
    } else if (text.includes('ransomware') || text.includes('encrypt') || text.includes('destroy')) {
      techId = 'T1486';
      techName = 'Data Encrypted for Impact';
      tactic = 'Impact';
    }

    const existing = techniqueMap.get(techId) || { tactic, name: techName, alertCount: 0, severity: a.severity };
    existing.alertCount++;
    if (a.severity === 'CRITICAL') existing.severity = 'CRITICAL';
    techniqueMap.set(techId, existing);
  }

  const topTechniques: MITRETechniqueItem[] = Array.from(techniqueMap.entries()).map(([id, t]) => ({
    id,
    tactic: t.tactic,
    name: t.name,
    alertCount: t.alertCount,
    coveredAlerts: t.alertCount,
    coverageStatus: t.alertCount >= 3 ? 'FULLY_MONITORED' : 'PARTIAL_COVERAGE',
    severity: t.severity
  }));

  // Build tactics coverage
  const tactics: MITRETacticCoverage[] = MITRE_TACTICS_DEF.map(tDef => {
    const matched = topTechniques.filter(item => item.tactic.toLowerCase() === tDef.name.toLowerCase());
    const coveredTechniques = matched.length;
    const alertVolume = matched.reduce((a, b) => a + b.alertCount, 0);
    const coveragePct = Math.round((coveredTechniques / tDef.knownCount) * 100);

    let riskLevel: MITRETacticCoverage['riskLevel'] = 'LOW';
    if (coveragePct === 0) riskLevel = 'CRITICAL';
    else if (coveragePct < 25) riskLevel = 'HIGH';
    else if (coveragePct < 50) riskLevel = 'MEDIUM';

    // Build mock representative techniques for tactical visualization
    const techniques = [
      ...matched.map(m => ({ id: m.id, name: m.name, covered: true })),
      { id: `${tDef.id}.01`, name: `${tDef.name} Telemetry Probe`, covered: coveredTechniques > 0 },
      { id: `${tDef.id}.02`, name: `${tDef.name} Heuristic Signature`, covered: false }
    ];

    return {
      tacticId: tDef.id,
      tacticName: tDef.name,
      totalKnownTechniques: tDef.knownCount,
      coveredTechniques,
      coveragePct,
      alertVolume,
      riskLevel,
      techniques
    };
  });

  const unmonitoredBlindSpotTactics = tactics
    .filter(t => t.coveragePct === 0)
    .map(t => t.tacticName);

  const totalKnown = MITRE_TACTICS_DEF.reduce((a, b) => a + b.knownCount, 0);
  const totalCovered = topTechniques.length;
  const overallAttackCoveragePct = Math.max(22, Math.round((totalCovered / totalKnown) * 100));

  const blindSpots = unmonitoredBlindSpotTactics.map((tName, i) => ({
    techniqueId: `T10${40 + i}`,
    tacticName: tName,
    techniqueName: `Unmonitored ${tName} Activity`,
    riskReason: 'No active SIEM or EDR correlation rule detects this vector.'
  }));

  return {
    tactics,
    topTechniques,
    unmonitoredBlindSpotTactics,
    overallAttackCoveragePct,
    overallCoveragePct: overallAttackCoveragePct,
    totalTechniquesCovered: totalCovered,
    blindSpots
  };
}
