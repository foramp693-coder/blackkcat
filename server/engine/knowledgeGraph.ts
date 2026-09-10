import {
  Alert,
  Case,
  Investigation,
  Escalation,
  Closure,
  Entity,
  SupervisoryFinding,
  KnowledgeGraphData,
  GraphNode,
  GraphEdge
} from '../types';

/**
 * FEATURE 7: ENTERPRISE EVIDENCE KNOWLEDGE GRAPH
 * Constructs a fully connected, traversable graph linking:
 * Alert -> Case -> Analyst -> Asset -> Control -> Escalation -> MITRE ATT&CK -> Entity -> Findings
 * Compatible with NetworkX JSON node-link export specification.
 */

export function buildKnowledgeGraph(
  cases: Case[],
  alerts: Alert[],
  investigations: Investigation[],
  escalations: Escalation[],
  closures: Closure[],
  entities: Entity[],
  findings: SupervisoryFinding[]
): KnowledgeGraphData {
  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  let suspiciousPathCount = 0;

  const addNode = (node: GraphNode) => {
    if (!nodesMap.has(node.id)) {
      nodesMap.set(node.id, node);
    }
  };

  const addEdge = (source: string, target: string, label: string, isSuspicious: boolean = false) => {
    const id = `edge-${source}-${target}-${label.replace(/\s+/g, '_')}`;
    edges.push({ id, source, target, label, isSuspicious });
    if (isSuspicious) suspiciousPathCount++;
  };

  // 1. Entities Nodes
  for (const ent of entities) {
    addNode({
      id: `ENT-${ent.id}`,
      label: ent.name,
      type: 'ENTITY',
      severity: ent.criticality,
      details: { sector: ent.sector, activeCases: ent.activeCases }
    });
  }

  // 2. Regulatory Controls Nodes
  const controls = [
    { id: 'CTRL-ESC-01', label: 'AC-04: Tier-2 Escalation Protocol' },
    { id: 'CTRL-SLA-01', label: 'IR-08: Triage Response SLA' },
    { id: 'CTRL-EVD-01', label: 'IR-05: Digital Artifact Retention' },
    { id: 'CTRL-CLS-01', label: 'CA-07: Incident Dismissal Verification' }
  ];
  for (const c of controls) {
    addNode({
      id: c.id,
      label: c.label,
      type: 'CONTROL'
    });
  }

  // 3. MITRE ATT&CK Tactics Nodes
  const mitreTactics = [
    { id: 'MITRE-TA0001', label: 'Initial Access (TA0001)' },
    { id: 'MITRE-TA0002', label: 'Execution (TA0002)' },
    { id: 'MITRE-TA0003', label: 'Persistence (TA0003)' },
    { id: 'MITRE-TA0004', label: 'Privilege Escalation (TA0004)' },
    { id: 'MITRE-TA0005', label: 'Defense Evasion (TA0005)' },
    { id: 'MITRE-TA0006', label: 'Credential Access (TA0006)' },
    { id: 'MITRE-TA0010', label: 'Exfiltration (TA0010)' }
  ];
  for (const m of mitreTactics) {
    addNode({
      id: m.id,
      label: m.label,
      type: 'MITRE'
    });
  }

  // 4. Alerts, Assets, Cases, Analysts, Escalations
  for (const c of cases) {
    const matchingAlert = alerts.find(a => a.id === c.alertId);
    const matchingInv = investigations.find(i => i.caseId === c.id);
    const matchingEsc = escalations.find(e => e.caseId === c.id);
    const relatedFindings = findings.filter(f => f.caseId === c.id);

    const isSuspiciousCase = relatedFindings.length > 0 || c.severity === 'CRITICAL';

    // Case Node
    const caseNodeId = `CASE-${c.id}`;
    addNode({
      id: caseNodeId,
      label: c.caseNumber,
      type: 'CASE',
      severity: c.severity,
      riskScore: relatedFindings[0]?.priorityScore || (c.severity === 'CRITICAL' ? 75 : 40),
      details: { title: c.title, status: c.status, duration: c.slaActualMinutes }
    });

    // Link Case -> Entity
    addEdge(caseNodeId, `ENT-${c.entityId}`, 'MANAGED_BY');

    // Alert Node
    if (matchingAlert) {
      const alertNodeId = `ALT-${matchingAlert.id}`;
      addNode({
        id: alertNodeId,
        label: matchingAlert.title.slice(0, 24) + '...',
        type: 'ALERT',
        severity: matchingAlert.severity,
        details: { category: matchingAlert.category, source: matchingAlert.source }
      });
      addEdge(alertNodeId, caseNodeId, 'ESCALATED_INTO');

      // Asset Node
      const assetNodeId = `AST-${matchingAlert.assetId}`;
      addNode({
        id: assetNodeId,
        label: matchingAlert.assetId,
        type: 'ASSET',
        details: {
          criticality: matchingAlert.assetId.includes('SWIFT') || matchingAlert.assetId.includes('SCADA') ? 'HIGH' : 'MEDIUM'
        }
      });
      addEdge(alertNodeId, assetNodeId, 'TARGETS_ASSET');

      // Link Asset -> Entity
      addEdge(assetNodeId, `ENT-${c.entityId}`, 'LOCATED_AT');

      // Map to MITRE
      const mitreTarget = matchingAlert.category.toLowerCase().includes('brute') ? 'MITRE-TA0006' :
        matchingAlert.category.toLowerCase().includes('malware') || matchingAlert.category.toLowerCase().includes('cve') ? 'MITRE-TA0001' :
        matchingAlert.category.toLowerCase().includes('powershell') ? 'MITRE-TA0002' : 'MITRE-TA0005';
      addEdge(alertNodeId, mitreTarget, 'MAPS_TO_ATTACK');
    }

    // Analyst Node
    const analystName = c.assignedAnalyst || matchingInv?.analyst || 'Analyst-Ops';
    const analystNodeId = `ANL-${analystName.replace(/\s+/g, '-').toLowerCase()}`;
    addNode({
      id: analystNodeId,
      label: analystName,
      type: 'ANALYST',
      details: { role: 'Tier 1/2 SOC Analyst' }
    });
    addEdge(caseNodeId, analystNodeId, 'INVESTIGATED_BY');

    // Escalation Node or Missing Escalation Edge
    if (matchingEsc) {
      const escNodeId = `ESC-${matchingEsc.id}`;
      addNode({
        id: escNodeId,
        label: `Escalated (${matchingEsc.escalatedTo})`,
        type: 'ESCALATION',
        details: { rationale: matchingEsc.escalationReason }
      });
      addEdge(caseNodeId, escNodeId, 'ESCALATED_VIA');
      addEdge(escNodeId, 'CTRL-ESC-01', 'COMPLIES_WITH');
    } else if (c.severity === 'CRITICAL' || c.severity === 'HIGH') {
      // Suspicious path: case bypassed escalation control
      addEdge(caseNodeId, 'CTRL-ESC-01', 'VIOLATES_CONTROL', true);
    }

    // Findings Nodes
    for (const f of relatedFindings) {
      const findingNodeId = `FND-${f.id}`;
      addNode({
        id: findingNodeId,
        label: f.title.slice(0, 24) + '...',
        type: 'FINDING',
        severity: f.severity,
        riskScore: f.priorityScore,
        details: { category: f.category }
      });
      addEdge(caseNodeId, findingNodeId, 'EVIDENCED_IN', true);
      addEdge(findingNodeId, `ENT-${f.entityId}`, 'IMPACTS_ENTITY');
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    edges,
    suspiciousPathCount,
    totalEntitiesCount: entities.length
  };
}
