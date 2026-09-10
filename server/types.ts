export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FindingCategory =
  | 'Execution Gap'
  | 'SLA Breach'
  | 'Missing Evidence'
  | 'Negative Space'
  | 'Anomaly'
  | 'Premature Closure'
  | 'Invalid Transition';

export type ReviewStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'NEEDS_EVIDENCE';
export type UserRole = 'Lead Examiner' | 'SOC Supervisor' | 'Auditor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  organization: string;
  createdAt: string;
}

export interface Entity {
  id: string;
  name: string;
  code: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sector: string;
  activeCases: number;
  totalFindings: number;
  slaBreachRate: number;
  lastAssessedAt: string;
}

export interface Alert {
  id: string;
  entityId: string;
  assetId: string;
  title: string;
  severity: SeverityLevel;
  source: string;
  rawTimestamp: string;
  normalizedTimestamp: string;
  category: string;
  description: string;
  status: 'NEW' | 'TRIAGED' | 'ESCALATED' | 'DISMISSED';
}

export interface Case {
  id: string;
  caseNumber: string;
  alertId: string;
  entityId: string;
  title: string;
  severity: SeverityLevel;
  status: 'OPEN' | 'IN_INVESTIGATION' | 'ESCALATED' | 'CLOSED' | 'REOPENED';
  assignedAnalyst: string;
  createdAt: string;
  acknowledgedAt?: string;
  closedAt?: string;
  slaTargetMinutes: number;
  slaActualMinutes?: number;
  slaBreached: boolean;
  closureReason?: string;
}

export interface Investigation {
  id: string;
  caseId: string;
  analystId: string;
  analyst?: string;
  startedAt: string;
  completedAt?: string;
  durationMinutes?: number;
  hypothesis: string;
  evidenceIds: string[];
  findingsNotes: string;
  notes?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED';
}

export interface Escalation {
  id: string;
  caseId: string;
  escalatedBy: string;
  escalatedTo: string;
  escalatedAt: string;
  delayMinutesFromAlert: number;
  escalationReason: string;
  priority: SeverityLevel;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'CISO / Incident Commander';
}

export interface EvidenceRecord {
  id: string;
  caseId: string;
  type: 'LOG_ARCHIVE' | 'PCAP' | 'MEMORY_DUMP' | 'HOST_ARTIFACT' | 'COMMUNICATION_RECORD' | 'CONFIGURATION';
  name: string;
  hash: string;
  collectedAt: string;
  collectedBy: string;
  sourceSystem: string;
  verified: boolean;
}

export interface Closure {
  id: string;
  caseId: string;
  closedBy: string;
  closedAt: string;
  classification: 'TRUE_POSITIVE' | 'FALSE_POSITIVE' | 'BENIGN_TRUE_POSITIVE' | 'INCONCLUSIVE';
  justification: string;
  approvedBySupervisor: boolean;
  rootCauseCategory?: string;
  closureReason?: string;
}

export interface WorkflowReconstruction {
  caseId: string;
  entityId: string;
  expectedWorkflow: string[];
  observedWorkflow: string[];
  missingStages: string[];
  timing: {
    alertToCaseMinutes: number;
    caseToInvestigationMinutes: number;
    investigationDurationMinutes: number;
    escalationDelayMinutes?: number;
    totalCaseDurationMinutes: number;
  };
  stagesCompleted: {
    alertExists: boolean;
    caseExists: boolean;
    investigationExists: boolean;
    investigationEvidenceExists: boolean;
    escalationExpected: boolean;
    escalationOccurred: boolean;
    acknowledgementExists: boolean;
    closureExists: boolean;
  };
  slaStatus: 'MET' | 'BREACHED' | 'NOT_APPLICABLE';
}

export interface ScoreContributors {
  severity: number;
  workflowImpact: number;
  missingEvidence: number;
  slaImpact: number;
  entityCriticality: number;
  statisticalAbnormality: number;
}

export interface ExaminerPriorityBreakdown {
  totalScore: number;
  priorityLevel: PriorityLevel;
  severity: SeverityLevel;
  confidence: number;
  evidenceQuality: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';
  dataCompleteness: number;
  dataCompletenessPct?: number;
  supportingRecordCount: number;
  detectionRuleId: string;
  expectedBehaviour: string;
  observedBehaviour: string;
  missingEvidenceDesc: string;
  recommendedAction: string;
  alternativeExplanations: string[];
  scoreReasons: { label: string; points: number; evidenceRef: string }[];
  reasons?: { factor: string; points: number; evidenceRef?: string }[];
}

export interface FindingCorrelation {
  id: string;
  title: string;
  patternType: 'SYSTEMIC_WORKFLOW_ISSUE' | 'BURST_CLOSURE_ANOMALY' | 'RECURRING_ESCALATION_GAP' | 'SHIFT_HANDOFF_VOID';
  description: string;
  warningStatement: string; // e.g. "Potential systemic workflow issue — examiner validation required."
  findingIds: string[];
  caseIds: string[];
  entityId: string;
  entityName: string;
  sharedCharacteristics: { key: string; value: string }[];
  confidence: number;
  caseCount: number;
}

export interface SamplingCandidate {
  caseId: string;
  caseNumber: string;
  entityId: string;
  entityName: string;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  severity: SeverityLevel;
  samplingStrata: 'HIGH_PRIORITY_OUTLIER' | 'UNUSUAL_ANOMALY' | 'REPEATED_PATTERN' | 'SLA_BOUNDARY' | 'RANDOM_CONTROL';
  selectionRationale: string;
  associatedFindingCount: number;
  flaggedGaps: string[];
  status: string;
  durationMinutes: number;
}

export interface SmartSampleRecommendation {
  totalPopulationCases: number;
  totalPopulationRecords: number;
  recommendedSampleSize: number;
  composition: { strata: string; count: number; description: string }[];
  candidates: SamplingCandidate[];
  generatedAt: string;
}

export interface SOCBehaviourFingerprint {
  entityId: string;
  entityName: string;
  investigationVelocity: { score: number; label: string; p50Duration: number; p90Duration: number };
  escalationPropensity: { score: number; label: string; ratePct: number };
  closureConcentration: { score: number; label: string; offHoursBurstPct: number };
  evidenceCompleteness: { score: number; label: string; hashCoveragePct: number };
  slaAdherence: { score: number; label: string; breachRatePct: number };
  repeatedGapsRate: { score: number; label: string; gapCount: number };
  summaryProfile: string;
}

export interface AssessmentTimelinePeriod {
  periodId: string;
  label: string;
  dateRange: string;
  totalCases: number;
  escalationGapsCount: number;
  investigationDelayCount: number;
  closureAnomaliesCount: number;
  evidenceDeficiencyCount: number;
  slaBreachRate: number;
  avgDurationMins: number;
}

export interface AssessmentTimelineTrend {
  metric: string;
  direction: 'WORSENING' | 'IMPROVING' | 'STABLE';
  detail: string;
  previousValue: number | string;
  currentValue: number | string;
}

export interface AssessmentTimeline {
  periods: AssessmentTimelinePeriod[];
  trends: AssessmentTimelineTrend[];
  newRecurringFindings: string[];
  resolvedSignals: string[];
}

export interface ExaminerFeedbackRecord {
  findingId: string;
  decision: 'VALID' | 'FALSE_POSITIVE' | 'NEEDS_INVESTIGATION' | 'ACCEPTED_EXCEPTION' | 'CONFIRMED_GAP';
  reason: string;
  reviewedAt: string;
  reviewerBadge: string;
  caseNumber: string;
  entityName: string;
}

export interface SupervisoryFinding {
  id: string;
  entityId: string;
  entityName: string;
  caseId: string;
  caseNumber: string;
  title: string;
  category: FindingCategory;
  severity: SeverityLevel;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  examinerPriority: ExaminerPriorityBreakdown;
  scoreExplanation: {
    baseScore: number;
    contributors: ScoreContributors;
    totalScore: number;
  };
  whatHappened: string;
  whyFlagged: string;
  expectedWorkflow: string[];
  observedWorkflow: string[];
  supportingEvidence: {
    recordId: string;
    type: string;
    description: string;
    timestamp: string;
  }[];
  missingEvidence: {
    expectedType: string;
    description: string;
    impact: string;
  }[];
  evidenceStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'DEFINITIVE';
  evidenceQuality: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';
  confidence: number; // 0-100
  dataCompleteness: number; // 0-100%
  detectionRuleId: string;
  alternativeExplanations: string[];
  historicalOccurrences: number;
  correlatedGroupId?: string;
  recommendedAction: string;
  counterfactual: string;
  source: 'Deterministic Rule' | 'Negative Space' | 'Statistical Outlier' | 'ML Anomaly Signal';
  mlAnomalySignal?: {
    isAnomaly: boolean;
    anomalyScore: number; // 0-1
    featureContributions: { feature: string; deviation: string }[];
  };
  reviewStatus: ReviewStatus;
  reviewDecision?: {
    decision: ReviewStatus;
    reviewerId: string;
    reviewerName: string;
    reviewedAt: string;
    notes: string;
    recommendedFollowUp?: string;
  };
  createdAt: string;
}

export interface NegativeSpaceRow {
  entityId: string;
  entityName: string;
  investigationStatus: 'PRESENT' | 'MISSING' | 'ABNORMAL';
  escalationStatus: 'PRESENT' | 'MISSING' | 'ABNORMAL';
  closureStatus: 'PRESENT' | 'MISSING' | 'ABNORMAL';
  associatedFindingIds: {
    investigation?: string[];
    escalation?: string[];
    closure?: string[];
  };
  severity: SeverityLevel;
  findingCount: number;
}

export interface AuditEvent {
  id: string;
  actorEmail: string;
  actorName: string;
  actorRole: UserRole;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'FINDING_VIEWED'
    | 'FINDING_REVIEWED'
    | 'REPORT_GENERATED'
    | 'DATA_UPLOAD'
    | 'ANALYTICS_EXECUTED'
    | 'SCENARIO_SWITCHED'
    | 'ADMIN_ACTION';
  timestamp: string;
  targetType: 'FINDING' | 'CASE' | 'REPORT' | 'DATASET' | 'AUTH' | 'SCENARIO';
  targetId: string;
  metadata: Record<string, any>;
}

export interface KPISummary {
  totalEntities: number;
  totalAlerts: number;
  totalCases: number;
  totalInvestigations: number;
  totalFindings: number;
  highFindings: number;
  criticalFindings: number;
  slaBreachRate: number; // percentage
  reviewedFindingsCount: number;
  pendingReviewCount: number;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  badge: string;
  description: string;
  expectedOutcome: string;
  keyGaps: string[];
}

// ----------------------------------------------------
// FEATURE 1: AI ANOMALY DETECTION ENGINE
// ----------------------------------------------------
export interface IsolationForestResult {
  score: number; // 0-1
  isAnomaly: boolean;
  pathLength: number;
  averageDepth: number;
}

export interface LOFResult {
  score: number; // LOF ratio (> 1.25 is anomalous)
  isAnomaly: boolean;
  localReachabilityDensity: number;
}

export interface DBSCANResult {
  clusterId: number; // -1 = noise/outlier
  isNoise: boolean;
  coreDistance: number;
}

export interface AutoencoderResult {
  reconstructionError: number;
  isAnomaly: boolean;
  featureResiduals: { feature: string; residual: number }[];
}

export interface EnsembleAnomalyFinding {
  id: string;
  caseId: string;
  caseNumber: string;
  entityId: string;
  entityName: string;
  analyst: string;
  riskScore: number; // 0-100
  confidenceScore: number; // 0-100
  anomalyType:
    | 'ABNORMAL_ALERT_CLOSURE'
    | 'SUSPICIOUS_INVESTIGATION_DURATION'
    | 'ANALYST_BEHAVIOUR_OUTLIER'
    | 'ESCALATION_ANOMALY'
    | 'OPERATIONAL_DISTRIBUTION_SKEW'
    | 'WORKFLOW_SHORTCUT'
    | 'REPEATED_DISMISSAL_PATTERN';
  algorithms: {
    isolationForest: IsolationForestResult;
    lof: LOFResult;
    dbscan: DBSCANResult;
    autoencoder: AutoencoderResult;
    ensembleScore: number;
  };
  evidenceSummary: string;
  rootCauseCandidate: string;
  featureContributions: { feature: string; weight: number; observation: string }[];
  detectedAt: string;
}

// ----------------------------------------------------
// FEATURE 2: PEER BENCHMARKING ENGINE
// ----------------------------------------------------
export interface CSEBenchmarkMetric {
  metricKey: string;
  label: string;
  cseValue: number;
  peerAverage: number;
  peerMedian: number;
  percentileRank: number; // 0-100
  unit: string;
  deviationPercent: number; // e.g. +35% or -20%
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'ATTENTION' | 'CRITICAL_DEVIATION';
}

export interface CSEPeerProfile {
  entityId: string;
  entityName: string;
  sector: string;
  criticality: string;
  metrics: CSEBenchmarkMetric[];
  benchmarkScore: number; // 0-100
  overallPercentile: number;
  radarData: { category: string; cseScore: number; peerMean: number }[];
  historicalMonthlyTrends: { month: string; cseScore: number; peerAverage: number }[];
}

// ----------------------------------------------------
// FEATURE 3: SMART SAMPLING TOP ENTITIES
// ----------------------------------------------------
export interface TopSupervisoryTarget {
  id: string;
  name: string;
  category: 'TOP_ALERT' | 'TOP_CASE' | 'TOP_ANALYST' | 'TOP_ASSET' | 'TOP_ORGANIZATION' | 'TOP_CONTROL';
  entityName: string;
  priorityScore: number;
  riskDrivers: string[];
  recommendedAction: string;
  severity: SeverityLevel;
}

// ----------------------------------------------------
// FEATURE 4: NLP INVESTIGATION QUALITY ANALYSIS
// ----------------------------------------------------
export interface NLPInvestigationQuality {
  investigationId: string;
  caseNumber: string;
  entityName: string;
  analyst: string;
  rawText: string;
  wordCount: number;
  qualityScore: number; // 0-100
  flaggedIssues: ('COPY_PASTE' | 'BOILERPLATE_TEMPLATE' | 'TRUNCATED_NOTES' | 'NO_FORENSIC_SUBSTANCE' | 'MEANINGLESS_COMMENT')[];
  similarityToClusterTemplatePct: number;
  matchedTemplateSnippet?: string;
  writingFingerprintHash: string;
}

export interface NLPTemplateCluster {
  clusterId: string;
  clusterName: string;
  templatePattern: string;
  occurrenceCount: number;
  affectedAnalysts: string[];
  averageQualityScore: number;
  exampleExcerpt: string;
  recurrenceCount?: number;
  similarityScore?: number;
  representativeText?: string;
  analystsInvolved?: string[];
  caseNumbers?: string[];
}

export interface SuspiciousAnalystProfile {
  analystName: string;
  entityName: string;
  totalInvestigations: number;
  averageQualityScore: number;
  copyPasteRatePct: number;
  templateReuseCount: number;
  averageDurationMinutes: number;
  flagLevel: 'HIGH_CONCERN' | 'ELEVATED' | 'NORMAL';
}

// ----------------------------------------------------
// FEATURE 7: KNOWLEDGE GRAPH
// ----------------------------------------------------
export type GraphNodeType = 'ALERT' | 'CASE' | 'ANALYST' | 'ASSET' | 'CONTROL' | 'ESCALATION' | 'MITRE' | 'ENTITY' | 'FINDING';

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  severity?: SeverityLevel;
  riskScore?: number;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  isSuspicious?: boolean;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  suspiciousPathCount: number;
  totalEntitiesCount: number;
}

// ----------------------------------------------------
// FEATURE 8: TIMELINE REPLAY
// ----------------------------------------------------
export interface TimelineReplayStage {
  stage: 'ALERT_CREATED' | 'ASSIGNED' | 'INVESTIGATED' | 'ESCALATED' | 'CONTAINMENT_RESPONSE' | 'CLOSED';
  timestamp: string;
  actor: string;
  durationMinutesFromPrev: number;
  isSuspiciousDelay: boolean;
  delayNotice?: string;
  details: string;
}

export interface CaseTimelineReplay {
  caseId: string;
  caseNumber: string;
  entityName: string;
  severity: SeverityLevel;
  stages: TimelineReplayStage[];
  totalLifecycleMinutes: number;
  slaTargetMinutes: number;
  hasSuspiciousDelay: boolean;
  gapSummary?: string;
}

// ----------------------------------------------------
// FEATURE 9: ROOT CAUSE ANALYSIS
// ----------------------------------------------------
export interface RootCauseDiagnosis {
  category:
    | 'Poor Governance'
    | 'Missing Detection Rules'
    | 'Weak Monitoring'
    | 'Broken Sensors'
    | 'Poor Analyst Training'
    | 'Alert Fatigue'
    | 'High Workload'
    | 'Missing Playbooks';
  confidence: number;
  evidencePoints: string[];
  recommendationTree: {
    immediateStep: string;
    systemicFix: string;
    regulatoryMandateRef: string;
  };
}

// ----------------------------------------------------
// FEATURE 10: SHAP EXPLAINABLE AI WATERFALL
// ----------------------------------------------------
export interface SHAPWaterfallStep {
  feature: string;
  attributionValue: number; // positive increases risk, negative decreases
  runningScore: number;
  observationNote: string;
  shapContribution?: number;
  runningTotal?: number;
  description?: string;
}

export interface SHAPExplainabilityRecord {
  findingId: string;
  caseNumber: string;
  baseValue: number; // expected average risk (e.g. 35)
  finalRiskScore: number;
  steps: SHAPWaterfallStep[];
  decisionNarrative: string;
  confidenceScore: number;
}

// ----------------------------------------------------
// FEATURE 11: SOC HEALTH SCORE (7 COMPONENTS)
// ----------------------------------------------------
export interface SOCHealthScoreBreakdown {
  compositeScore: number; // 0-100
  letterGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  components: {
    detection: number; // 20%
    investigation: number; // 20%
    escalation: number; // 15%
    response: number; // 15%
    governance: number; // 10%
    operationalDiscipline: number; // 10%
    cyberResilience: number; // 10%
  };
  peerSectorAverage: number;
  historicalQuarterlyTrend: { quarter: string; score: number }[];
}

// ----------------------------------------------------
// FEATURE 12: GOVERNANCE MATURITY INDEX (GMI)
// ----------------------------------------------------
export interface GovernanceMaturityRecord {
  entityId: string;
  entityName: string;
  maturityTier: 'Level 1 Initial' | 'Level 2 Managed' | 'Level 3 Defined' | 'Level 4 Quantitatively Managed' | 'Level 5 Optimizing';
  gmiScore: number; // 0-100
  dimensions: {
    policyAdherence: number;
    escalationCompliance: number;
    documentationRigor: number;
    operationalDiscipline: number;
    investigationQuality: number;
    monitoringCoverage: number;
    auditReadiness: number;
  };
  keyGovernanceGaps: string[];
}

// ----------------------------------------------------
// FEATURE 13: CYBER RESILIENCE INDEX (CRI)
// ----------------------------------------------------
export interface CyberResilienceRecord {
  entityId: string;
  entityName: string;
  criScore: number; // 0-100
  resilienceRating: 'ROBUST' | 'SUFFICIENT' | 'FRAGILE' | 'HIGH_RISK';
  dimensions: {
    detectionSpeed: number;
    containmentEfficacy: number;
    recoveryAssurance: number;
    assetVisibility: number;
    sensorHealth: number;
    governanceStability: number;
    responseCoordination: number;
    escalationFidelity: number;
    temporalResilienceTrend: number;
  };
  singlePointOfFailures: string[];
}

// ----------------------------------------------------
// FEATURE 14: PREDICTIVE ANALYTICS FORECAST
// ----------------------------------------------------
export interface PredictiveForecastItem {
  horizon: '7_DAYS' | '30_DAYS' | '90_DAYS';
  predictedSOCHealth: number;
  predictedRiskScore: number;
  predictedAlertVolume: number;
  predictedAnalystWorkloadHours: number;
  predictedEscalationLoad: number;
  governanceDriftProbPct: number;
  confidenceLower: number;
  confidenceUpper: number;
  trendDirection: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  projectedSlaBreachRatePct?: number;
  projectedHealthScore?: number;
  confidenceIntervalPct?: number;
  riskAdvisory?: string;
}

// ----------------------------------------------------
// FEATURE 15: MITRE ATT&CK MAPPING
// ----------------------------------------------------
export interface MITRETechniqueItem {
  id: string; // e.g. T1190
  tactic: string; // e.g. Initial Access
  name: string;
  alertCount: number;
  coveredAlerts: number;
  coverageStatus: 'FULLY_MONITORED' | 'PARTIAL_COVERAGE' | 'UNMONITORED_BLIND_SPOT';
  severity: SeverityLevel;
}

export interface MITRETacticCoverage {
  tacticId: string; // e.g. TA0001
  tacticName: string;
  totalKnownTechniques: number;
  coveredTechniques: number;
  coveragePct: number;
  alertVolume: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  techniques?: {
    id: string;
    name: string;
    covered: boolean;
    alertCount?: number;
  }[];
}

export interface MITREMatrixPayload {
  tactics: MITRETacticCoverage[];
  topTechniques: MITRETechniqueItem[];
  unmonitoredBlindSpotTactics: string[];
  overallAttackCoveragePct: number;
  overallCoveragePct?: number;
  totalTechniquesCovered?: number;
  blindSpots?: any[];
}

// ----------------------------------------------------
// FEATURE 16: DIGITAL TWIN SIMULATOR
// ----------------------------------------------------
export interface DigitalTwinInput {
  staffingDeltaAnalysts: number; // -5 to +10
  escalationComplianceImprovementPct: number; // 0 to 60%
  enableMissingSensors: boolean;
  mttrReductionPct: number; // 0 to 50%
  detectionRuleTuningPct: number; // 0 to 40%
}

export interface DigitalTwinOutput {
  baseline: {
    riskScore: number;
    socHealth: number;
    governanceScore: number;
    resilienceScore: number;
    slaBreachRate: number;
  };
  simulated: {
    riskScore: number;
    socHealth: number;
    governanceScore: number;
    resilienceScore: number;
    slaBreachRate: number;
  };
  projectedAnnualHoursSaved: number;
  costEfficiencyGainPct: number;
  predictedGapsEliminated: number;
  simulatedHealthScore?: number;
  baselineHealthScore?: number;
  simulatedResidualRisk?: number;
  baselineResidualRisk?: number;
  simulatedSlaBreachPct?: number;
  baselineSlaBreachPct?: number;
  analystHoursSavedPerMonth?: number;
  componentDeltas?: Record<string, { baseline: number; simulated: number; delta: number }>;
}

// ----------------------------------------------------
// FEATURE 20: DATA VALIDATION REPORT
// ----------------------------------------------------
export interface DataValidationIssue {
  type: 'DUPLICATE_ALERT' | 'INVALID_SEVERITY' | 'BROKEN_REFERENCE' | 'MISSING_ASSET' | 'MISSING_ESCALATION' | 'TIMELINE_INVERSION' | 'CORRUPTED_RECORD';
  recordId: string;
  table: 'ALERTS' | 'CASES' | 'INVESTIGATIONS' | 'ESCALATIONS' | 'CLOSURES';
  description: string;
  impact: 'CRITICAL' | 'WARNING' | 'INFORMATIONAL';
}

export interface DataValidationReport {
  timestamp: string;
  totalRecordsScanned: number;
  validRecordsCount: number;
  issueCount: number;
  healthScorePct: number;
  issues: DataValidationIssue[];
  totalRecords?: number;
  validRecords?: number;
  completenessPct?: number;
  passedSchema?: boolean;
  sha256DataHash?: string;
  tables?: {
    tableName: string;
    recordCount: number;
    completenessPct: number;
    missingFieldCount: number;
  }[];
}

// ----------------------------------------------------
// FEATURE 25: PROCESS MINING WORKFLOW MODEL
// ----------------------------------------------------
export interface ProcessMiningPath {
  pathSignature: string; // e.g. "Alert -> Case -> Investigation -> Escalation -> Closure"
  pathType: 'COMPLIANT_IDEAL_PATH' | 'PREMATURE_SHORTCUT' | 'ESCALATION_BYPASS' | 'STAGNANT_STALL';
  caseCount: number;
  frequencyPct: number;
  averageDurationMinutes: number;
  slaBreachRatePct: number;
}

export interface ProcessMiningModel {
  paths: ProcessMiningPath[];
  topBottleneckStage: string;
  averageEndToEndMinutes: number;
  compliantExecutionRatePct: number;
  conformanceRatePct?: number;
  totalPathsDiscovered?: number;
  bottlenecks?: any[];
}

