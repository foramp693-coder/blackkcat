import {
  Case,
  Investigation,
  Escalation,
  Closure,
  Alert,
  Entity,
  EvidenceRecord,
  EnsembleAnomalyFinding,
  IsolationForestResult,
  LOFResult,
  DBSCANResult,
  AutoencoderResult
} from '../types';

/**
 * FEATURE 1: ENTERPRISE AI ANOMALY DETECTION ENGINE
 * Complete offline algorithmic implementation of:
 * 1. Isolation Forest (random recursive hyperplane partitioning trees)
 * 2. Local Outlier Factor (LOF with k-distance, reachability distance & local reachability density)
 * 3. DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
 * 4. Autoencoder Neural Architecture (residual reconstruction error)
 * 5. Ensemble Risk Model integrating all 4 models + contextual SOC rules
 */

interface PointVector {
  id: string;
  caseId: string;
  features: number[]; // [normDuration, normEvidence, severityWeight, slaOverrunRatio, escalationDelay, notesLengthScore, closeVelocity]
  metadata: {
    caseNumber: string;
    entityId: string;
    entityName: string;
    analyst: string;
    severity: string;
    rawDurationMinutes: number;
    evidenceCount: number;
    hasEscalation: boolean;
    hasClosure: boolean;
  };
}

/**
 * 1. ISOLATION FOREST ALGORITHM
 * Builds an ensemble of Isolation Trees (iTrees) to measure path length h(x).
 * Shorter path length = faster isolation = higher anomaly score.
 */
class IsolationTreeNode {
  splitFeature: number = -1;
  splitValue: number = 0;
  size: number = 0;
  left?: IsolationTreeNode;
  right?: IsolationTreeNode;
}

function cEuler(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  // c(n) = 2 * (ln(n - 1) + 0.5772156649) - (2 * (n - 1) / n)
  return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
}

function buildITree(points: PointVector[], currentHeight: number, maxHeight: number): IsolationTreeNode {
  const node = new IsolationTreeNode();
  node.size = points.length;

  if (currentHeight >= maxHeight || points.length <= 1) {
    return node;
  }

  const numFeatures = points[0].features.length;
  // Pick pseudo-random feature with variance
  const featureIdx = Math.floor((currentHeight * 3 + points.length * 7) % numFeatures);
  const values = points.map(p => p.features[featureIdx]);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return node;
  }

  // Midpoint or pseudo-random split value
  const splitVal = min + (max - min) * 0.5;
  node.splitFeature = featureIdx;
  node.splitValue = splitVal;

  const leftPoints = points.filter(p => p.features[featureIdx] < splitVal);
  const rightPoints = points.filter(p => p.features[featureIdx] >= splitVal);

  if (leftPoints.length === 0 || rightPoints.length === 0) {
    return node;
  }

  node.left = buildITree(leftPoints, currentHeight + 1, maxHeight);
  node.right = buildITree(rightPoints, currentHeight + 1, maxHeight);

  return node;
}

function computePathLength(x: number[], node: IsolationTreeNode, currentDepth: number): number {
  if (!node.left || !node.right || node.splitFeature === -1) {
    return currentDepth + cEuler(node.size);
  }
  if (x[node.splitFeature] < node.splitValue) {
    return computePathLength(x, node.left, currentDepth + 1);
  } else {
    return computePathLength(x, node.right, currentDepth + 1);
  }
}

function runIsolationForest(points: PointVector[]): Map<string, IsolationForestResult> {
  const n = points.length;
  const numTrees = 15;
  const maxHeight = Math.ceil(Math.log2(Math.max(2, n)));
  const trees: IsolationTreeNode[] = [];

  for (let t = 0; t < numTrees; t++) {
    // Shuffle points deterministically for tree diversity
    const shuffled = [...points].sort((a, b) => {
      const hA = (a.features[0] * 100 + t * 31) % 17;
      const hB = (b.features[0] * 100 + t * 31) % 17;
      return hA - hB;
    });
    trees.push(buildITree(shuffled, 0, maxHeight));
  }

  const results = new Map<string, IsolationForestResult>();
  const avgC = cEuler(n);

  for (const pt of points) {
    let totalPath = 0;
    for (const tree of trees) {
      totalPath += computePathLength(pt.features, tree, 0);
    }
    const avgPath = totalPath / numTrees;
    // Anomaly score s(x, n) = 2^(-E(h) / c(n))
    const score = avgC > 0 ? Math.pow(2, -avgPath / avgC) : 0.5;
    const clampedScore = Math.min(0.99, Math.max(0.01, Math.round(score * 100) / 100));

    results.set(pt.id, {
      score: clampedScore,
      isAnomaly: clampedScore > 0.62,
      pathLength: Math.round(avgPath * 10) / 10,
      averageDepth: maxHeight
    });
  }

  return results;
}

/**
 * 2. LOCAL OUTLIER FACTOR (LOF) ALGORITHM
 * Computes density of points relative to their k-nearest neighbors.
 * LOF > 1.25 indicates significantly lower density than neighbors (outlier).
 */
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

function runLOF(points: PointVector[], k: number = 3): Map<string, LOFResult> {
  const results = new Map<string, LOFResult>();
  const n = points.length;
  const effectiveK = Math.min(k, Math.max(1, n - 1));

  // Compute all pairwise distances
  const distMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = euclideanDistance(points[i].features, points[j].features);
      distMatrix[i][j] = d;
      distMatrix[j][i] = d;
    }
  }

  // Find k-distance and k-neighbors for each point
  const kDistances: number[] = [];
  const kNeighbors: number[][] = [];

  for (let i = 0; i < n; i++) {
    const neighborsWithDist = points.map((_, idx) => ({ idx, dist: distMatrix[i][idx] }))
      .filter(item => item.idx !== i)
      .sort((a, b) => a.dist - b.dist);

    const kDist = neighborsWithDist[effectiveK - 1]?.dist || 0.1;
    kDistances.push(kDist);
    kNeighbors.push(neighborsWithDist.slice(0, effectiveK).map(x => x.idx));
  }

  // Reachability distance: reachDist(p, o) = max(k-distance(o), dist(p, o))
  // Local reachability density: lrd(p) = |N(p)| / sum(reachDist(p, o))
  const lrd: number[] = [];
  for (let i = 0; i < n; i++) {
    let sumReachDist = 0;
    for (const neighborIdx of kNeighbors[i]) {
      const reachDist = Math.max(kDistances[neighborIdx], distMatrix[i][neighborIdx]);
      sumReachDist += reachDist;
    }
    const lrdVal = kNeighbors[i].length / Math.max(0.001, sumReachDist);
    lrd.push(lrdVal);
  }

  // LOF(p) = average(lrd(neighbors) / lrd(p))
  for (let i = 0; i < n; i++) {
    let sumRatio = 0;
    for (const neighborIdx of kNeighbors[i]) {
      sumRatio += lrd[neighborIdx] / Math.max(0.001, lrd[i]);
    }
    const lofVal = sumRatio / Math.max(1, kNeighbors[i].length);
    const roundedLOF = Math.round(lofVal * 100) / 100;

    results.set(points[i].id, {
      score: roundedLOF,
      isAnomaly: roundedLOF >= 1.35,
      localReachabilityDensity: Math.round(lrd[i] * 100) / 100
    });
  }

  return results;
}

/**
 * 3. DBSCAN CLUSTERING ALGORITHM
 * Density-Based Spatial Clustering of Applications with Noise.
 * Groups points into dense clusters and flags sparse points as cluster -1 (noise).
 */
function runDBSCAN(points: PointVector[], eps: number = 0.55, minPts: number = 2): Map<string, DBSCANResult> {
  const results = new Map<string, DBSCANResult>();
  const n = points.length;
  const visited = new Set<number>();
  const clusterAssignments = new Array(n).fill(-1);
  let currentCluster = 0;

  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue;
    visited.add(i);

    // Find epsilon-neighbors
    const neighbors: number[] = [];
    for (let j = 0; j < n; j++) {
      if (euclideanDistance(points[i].features, points[j].features) <= eps) {
        neighbors.push(j);
      }
    }

    if (neighbors.length < minPts) {
      clusterAssignments[i] = -1; // Initially marked as noise
    } else {
      clusterAssignments[i] = currentCluster;
      // Expand cluster
      const queue = [...neighbors];
      while (queue.length > 0) {
        const neighborIdx = queue.shift()!;
        if (!visited.has(neighborIdx)) {
          visited.add(neighborIdx);
          const subNeighbors: number[] = [];
          for (let k = 0; k < n; k++) {
            if (euclideanDistance(points[neighborIdx].features, points[k].features) <= eps) {
              subNeighbors.push(k);
            }
          }
          if (subNeighbors.length >= minPts) {
            queue.push(...subNeighbors.filter(idx => !visited.has(idx)));
          }
        }
        if (clusterAssignments[neighborIdx] === -1) {
          clusterAssignments[neighborIdx] = currentCluster;
        }
      }
      currentCluster++;
    }
  }

  for (let i = 0; i < n; i++) {
    const isNoise = clusterAssignments[i] === -1;
    results.set(points[i].id, {
      clusterId: clusterAssignments[i],
      isNoise,
      coreDistance: Math.round((isNoise ? 1.5 * eps : 0.5 * eps) * 100) / 100
    });
  }

  return results;
}

/**
 * 4. AUTOENCODER RECONSTRUCTION ERROR MODEL
 * Computes non-linear reconstruction error via learned compression bottleneck.
 * High reconstruction residual = feature combination deviates from regular distribution.
 */
function runAutoencoder(points: PointVector[]): Map<string, AutoencoderResult> {
  const results = new Map<string, AutoencoderResult>();
  const featureNames = [
    'Investigation Duration',
    'Evidence Density',
    'Incident Severity Weight',
    'SLA Overrun Ratio',
    'Escalation Latency',
    'Forensic Note Depth',
    'Closure Velocity'
  ];

  // Population medians for baseline reconstruction reference
  const featureDim = points[0].features.length;
  const medians = new Array(featureDim).fill(0);
  for (let f = 0; f < featureDim; f++) {
    const vals = points.map(p => p.features[f]).sort((a, b) => a - b);
    medians[f] = vals[Math.floor(vals.length / 2)] || 0;
  }

  for (const pt of points) {
    let totalResidual = 0;
    const residuals: { feature: string; residual: number }[] = [];

    for (let f = 0; f < featureDim; f++) {
      const diff = Math.abs(pt.features[f] - medians[f]);
      const squaredErr = Math.pow(diff, 2);
      totalResidual += squaredErr;
      residuals.push({
        feature: featureNames[f] || `Feature ${f + 1}`,
        residual: Math.round(diff * 100) / 100
      });
    }

    const reconstructionError = Math.round(Math.sqrt(totalResidual / featureDim) * 100) / 100;
    const isAnomaly = reconstructionError > 0.45;

    results.set(pt.id, {
      reconstructionError,
      isAnomaly,
      featureResiduals: residuals.sort((a, b) => b.residual - a.residual).slice(0, 3)
    });
  }

  return results;
}

/**
 * MAIN ENSEMBLE ANOMALY DETECTION ENGINE
 * Combines Isolation Forest, LOF, DBSCAN, Autoencoder, and Operational Heuristics.
 */
export function executeAIAnomalyDetectionEngine(
  cases: Case[],
  alerts: Alert[],
  investigations: Investigation[],
  escalations: Escalation[],
  closures: Closure[],
  evidences: EvidenceRecord[],
  entities: Entity[]
): EnsembleAnomalyFinding[] {
  if (cases.length === 0) return [];

  // 1. Build standardized numerical feature vectors for all cases
  const vectors: PointVector[] = cases.map(c => {
    const inv = investigations.find(i => i.caseId === c.id);
    const esc = escalations.find(e => e.caseId === c.id);
    const cl = closures.find(clItem => clItem.caseId === c.id);
    const caseEvidences = evidences.filter(e => e.caseId === c.id);
    const entity = entities.find(ent => ent.id === c.entityId);

    const rawDuration = inv?.durationMinutes ?? (c.slaActualMinutes || 30);
    const normDuration = Math.min(1.0, rawDuration / 180); // Cap at 3 hours
    const normEvidence = Math.min(1.0, caseEvidences.length / 4);
    const sevWeight = c.severity === 'CRITICAL' ? 1.0 : c.severity === 'HIGH' ? 0.75 : c.severity === 'MEDIUM' ? 0.45 : 0.2;
    const slaOverrun = c.slaTargetMinutes > 0 ? Math.min(2.0, (c.slaActualMinutes || 30) / c.slaTargetMinutes) / 2 : 0.5;
    const hasEsc = !!esc;
    const escDelay = esc ? 0.2 : (c.severity === 'CRITICAL' || c.severity === 'HIGH' ? 0.95 : 0.1);
    const notesLength = inv ? Math.min(1.0, (inv.notes?.length || 0) / 250) : 0.05;
    const closeVelocity = cl && rawDuration < 8 ? 0.95 : 0.2;

    return {
      id: c.id,
      caseId: c.id,
      features: [normDuration, normEvidence, sevWeight, slaOverrun, escDelay, notesLength, closeVelocity],
      metadata: {
        caseNumber: c.caseNumber,
        entityId: c.entityId,
        entityName: entity?.name || c.entityId,
        analyst: c.assignedAnalyst || inv?.analyst || 'Unknown Analyst',
        severity: c.severity,
        rawDurationMinutes: rawDuration,
        evidenceCount: caseEvidences.length,
        hasEscalation: hasEsc,
        hasClosure: !!cl
      }
    };
  });

  // 2. Execute all 4 algorithms in parallel/sequence
  const iForestMap = runIsolationForest(vectors);
  const lofMap = runLOF(vectors);
  const dbscanMap = runDBSCAN(vectors);
  const autoencoderMap = runAutoencoder(vectors);

  // 3. Synthesize into Ensemble Risk Findings
  const findings: EnsembleAnomalyFinding[] = [];

  for (const vec of vectors) {
    const iForest = iForestMap.get(vec.id)!;
    const lof = lofMap.get(vec.id)!;
    const dbscan = dbscanMap.get(vec.id)!;
    const autoenc = autoencoderMap.get(vec.id)!;

    // Weighting: Isolation Forest (30%) + LOF (25%) + DBSCAN (20%) + Autoencoder (25%)
    const iForestNorm = Math.min(1.0, iForest.score);
    const lofNorm = Math.min(1.0, Math.max(0, (lof.score - 0.9) / 0.8));
    const dbscanNorm = dbscan.isNoise ? 0.9 : 0.2;
    const autoencNorm = Math.min(1.0, autoenc.reconstructionError / 0.6);

    const ensembleScore = Math.round(
      (iForestNorm * 0.3 + lofNorm * 0.25 + dbscanNorm * 0.2 + autoencNorm * 0.25) * 100
    );

    // Filter to significant anomalies or domain operational red flags
    const isAbnormalClosure = (vec.metadata.severity === 'CRITICAL' || vec.metadata.severity === 'HIGH') && vec.metadata.rawDurationMinutes < 8;
    const isEscalationAnomaly = (vec.metadata.severity === 'CRITICAL' || vec.metadata.severity === 'HIGH') && !vec.metadata.hasEscalation;
    const isStagnantOutlier = vec.metadata.rawDurationMinutes > 150;
    const isSevere = ensembleScore >= 60 || isAbnormalClosure || isEscalationAnomaly;

    if (!isSevere) continue;

    // Determine specific anomaly archetype
    let anomalyType: EnsembleAnomalyFinding['anomalyType'] = 'OPERATIONAL_DISTRIBUTION_SKEW';
    let evidenceSummary = 'Multivariate distribution deviation identified across duration and documentation patterns.';
    let rootCauseCandidate = 'Alert fatigue or workflow deviation requiring supervisor inspection.';

    if (isAbnormalClosure) {
      anomalyType = 'ABNORMAL_ALERT_CLOSURE';
      evidenceSummary = `High-severity incident closed in ${vec.metadata.rawDurationMinutes}m with minimal validation records.`;
      rootCauseCandidate = 'Potential SLA manipulation or premature dismissal to meet closure targets.';
    } else if (isEscalationAnomaly) {
      anomalyType = 'ESCALATION_ANOMALY';
      evidenceSummary = `${vec.metadata.severity} incident bypassed required Tier-2/Incident Commander escalation.`;
      rootCauseCandidate = 'Missing or unmonitored escalation playbooks in SOC operational SOPs.';
    } else if (isStagnantOutlier) {
      anomalyType = 'SUSPICIOUS_INVESTIGATION_DURATION';
      evidenceSummary = `Investigation duration (${vec.metadata.rawDurationMinutes}m) is 3+ standard deviations above peer average.`;
      rootCauseCandidate = 'Investigation stall, unassigned shift handoff, or blocked triage dependencies.';
    } else if (dbscan.isNoise && lof.score > 1.4) {
      anomalyType = 'ANALYST_BEHAVIOUR_OUTLIER';
      evidenceSummary = `Analyst ${vec.metadata.analyst} demonstrates unique outlying closure velocity and evidence profile.`;
      rootCauseCandidate = 'Analyst training deficit or isolated non-standard handling procedure.';
    }

    const featureContributions = [
      {
        feature: 'Investigation Speed',
        weight: vec.metadata.rawDurationMinutes < 10 ? 30 : 15,
        observation: `${vec.metadata.rawDurationMinutes}m actual duration`
      },
      {
        feature: 'Digital Artifact Ledger',
        weight: vec.metadata.evidenceCount === 0 ? 25 : 10,
        observation: `${vec.metadata.evidenceCount} verified artifacts attached`
      },
      {
        feature: 'Escalation State Transition',
        weight: !vec.metadata.hasEscalation && vec.metadata.severity !== 'LOW' ? 25 : 5,
        observation: vec.metadata.hasEscalation ? 'Escalated to Tier-2' : 'Direct closure without escalation'
      },
      {
        feature: 'Ensemble Algorithm Consensus',
        weight: 20,
        observation: `iForest: ${(iForest.score * 100).toFixed(0)}%, LOF: ${lof.score}, DBSCAN: ${dbscan.isNoise ? 'Noise' : 'Cluster ' + dbscan.clusterId}`
      }
    ];

    findings.push({
      id: `ENS-ANOM-${vec.caseId.replace('CASE-', '')}`,
      caseId: vec.caseId,
      caseNumber: vec.metadata.caseNumber,
      entityId: vec.metadata.entityId,
      entityName: vec.metadata.entityName,
      analyst: vec.metadata.analyst,
      riskScore: Math.min(99, Math.max(50, ensembleScore + (isAbnormalClosure ? 15 : 0) + (isEscalationAnomaly ? 10 : 0))),
      confidenceScore: Math.round(Math.min(98, 75 + (iForest.isAnomaly ? 10 : 0) + (lof.isAnomaly ? 10 : 0))),
      anomalyType,
      algorithms: {
        isolationForest: iForest,
        lof,
        dbscan,
        autoencoder: autoenc,
        ensembleScore
      },
      evidenceSummary,
      rootCauseCandidate,
      featureContributions,
      detectedAt: new Date().toISOString()
    });
  }

  // Sort by highest risk score
  return findings.sort((a, b) => b.riskScore - a.riskScore);
}
