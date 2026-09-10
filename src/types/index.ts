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
  organization: string;
}

export type SupervisoryAttentionLevel = 'ACTION_REQUIRED' | 'ELEVATED_WATCH' | 'MONITORED_STABLE';

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
  attentionLevel?: SupervisoryAttentionLevel;
  resilienceScore?: number;
  exposureIndex?: number;
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
  warningStatement: string;
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
  examinerPriority?: ExaminerPriorityBreakdown;
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
  evidenceQuality?: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';
  confidence: number;
  dataCompleteness?: number;
  detectionRuleId?: string;
  alternativeExplanations?: string[];
  historicalOccurrences?: number;
  correlatedGroupId?: string;
  recommendedAction: string;
  counterfactual: string;
  source: 'Deterministic Rule' | 'Negative Space' | 'Statistical Outlier' | 'ML Anomaly Signal';
  mlAnomalySignal?: {
    isAnomaly: boolean;
    anomalyScore: number;
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

export interface KPISummary {
  totalEntities: number;
  totalAlerts: number;
  totalCases: number;
  totalInvestigations: number;
  totalFindings: number;
  highFindings: number;
  criticalFindings: number;
  slaBreachRate: number;
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

export interface WorkflowFunnel {
  step: string;
  sourceCount: number;
  targetCount: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface OperationalTrendPoint {
  date: string;
  avgInvestigationDuration: number;
  slaBreachRate: number;
  findingCount: number;
  caseVolume: number;
}

export interface AuditEvent {
  id: string;
  actorEmail: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  timestamp: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, any>;
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
  riskScore: number;
  confidenceScore: number;
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
  percentileRank: number;
  unit: string;
  deviationPercent: number;
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'ATTENTION' | 'CRITICAL_DEVIATION';
}

export interface CSEPeerProfile {
  entityId: string;
  entityName: string;
  sector: string;
  criticality: string;
  metrics: CSEBenchmarkMetric[];
  benchmarkScore: number;
  overallPercentile: number;
  radarData: { category: string; cseScore: number; peerMean: number }[];
  historicalMonthlyTrends: { month: string; cseScore: number; peerAverage: number }[];
  industryAverages?: {
    slaCompliancePct: number;
    escalationRatePct: number;
    investigationQualityScore: number;
    mttaMinutes: number;
    mttrMinutes: number;
  };
  slaCompliancePct?: number;
  escalationRatePct?: number;
  investigationQualityScore?: number;
  mttaMinutes?: number;
  mttrMinutes?: number;
  quartile?: 'TOP_25' | 'MEDIAN' | 'BOTTOM_25' | string;
  percentileRank?: number;
  deviations?: {
    metric: string;
    deviationPct: number;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    supervisoryImplication: string;
  }[];
  historicalTrend?: {
    month: string;
    slaCompliancePct: number;
    qualityScore: number;
  }[];
}

// ----------------------------------------------------
// FEATURE 3: SMART SAMPLING TOP TARGETS
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
// FEATURE 4: NLP INVESTIGATION QUALITY
// ----------------------------------------------------
export interface NLPInvestigationQuality {
  investigationId: string;
  caseNumber: string;
  entityName: string;
  analyst: string;
  rawText: string;
  wordCount: number;
  qualityScore: number;
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
  relation?: string;
  weight?: number;
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
  stage: 'ALERT_CREATED' | 'ASSIGNED' | 'INVESTIGATED' | 'ESCALATED' | 'CONTAINMENT_RESPONSE' | 'CLOSED' | string;
  timestamp: string;
  actor: string;
  durationMinutesFromPrev: number;
  isSuspiciousDelay: boolean;
  delayNotice?: string;
  details: string;
  stepNumber?: number;
  deltaMinutes?: number;
  action?: string;
  description?: string;
  suspiciousReason?: string;
}

export interface CaseTimelineReplay {
  caseId: string;
  caseNumber: string;
  entityName: string;
  severity: SeverityLevel;
  stages: TimelineReplayStage[];
  steps?: TimelineReplayStage[];
  totalLifecycleMinutes: number;
  totalDurationMinutes?: number;
  slaTargetMinutes: number;
  hasSuspiciousDelay: boolean;
  slaBreached?: boolean;
  title?: string;
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
// FEATURE 10: SHAP WATERFALL
// ----------------------------------------------------
export interface SHAPWaterfallStep {
  feature: string;
  attributionValue: number;
  runningScore: number;
  observationNote: string;
  shapContribution?: number;
  runningTotal?: number;
  description?: string;
}

export interface SHAPExplainabilityRecord {
  findingId: string;
  caseNumber: string;
  baseValue: number;
  finalRiskScore: number;
  steps: SHAPWaterfallStep[];
  decisionNarrative: string;
  confidenceScore: number;
}

// ----------------------------------------------------
// FEATURE 11: SOC HEALTH SCORE
// ----------------------------------------------------
export interface SOCHealthScoreBreakdown {
  compositeScore: number;
  overallScore?: number;
  letterGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  overallTier?: string;
  components: {
    detection: number;
    investigation: number;
    escalation: number;
    response: number;
    governance: number;
    operationalDiscipline: number;
    cyberResilience: number;
  };
  peerSectorAverage: number;
  historicalQuarterlyTrend: { quarter: string; score: number }[];
}

// ----------------------------------------------------
// FEATURE 12: GOVERNANCE MATURITY INDEX
// ----------------------------------------------------
export interface GovernanceMaturityRecord {
  entityId: string;
  entityName: string;
  maturityTier: 'Level 1 Initial' | 'Level 2 Managed' | 'Level 3 Defined' | 'Level 4 Quantitatively Managed' | 'Level 5 Optimizing';
  maturityLevel?: string;
  gmiScore: number;
  overallScore?: string | number;
  regulatoryRecommendation?: string;
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
// FEATURE 13: CYBER RESILIENCE INDEX
// ----------------------------------------------------
export interface CyberResilienceRecord {
  entityId: string;
  entityName: string;
  criScore: number;
  resilienceScore?: number;
  resilienceRating: 'ROBUST' | 'SUFFICIENT' | 'FRAGILE' | 'HIGH_RISK';
  resilienceTier?: string;
  mttdMinutes?: number;
  mttcMinutes?: number;
  containmentEffectivenessPct?: number;
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
  singlePointsOfFailure?: string[];
}

// ----------------------------------------------------
// FEATURE 14: PREDICTIVE FORECAST
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
// FEATURE 15: MITRE ATT&CK
// ----------------------------------------------------
export interface MITRETechniqueItem {
  id: string;
  tactic: string;
  name: string;
  alertCount: number;
  coveredAlerts: number;
  coverageStatus: 'FULLY_MONITORED' | 'PARTIAL_COVERAGE' | 'UNMONITORED_BLIND_SPOT';
  severity: SeverityLevel;
}

export interface MITRETacticCoverage {
  tacticId: string;
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
  blindSpots?: {
    techniqueId: string;
    tacticName: string;
    techniqueName: string;
    riskReason: string;
  }[];
}

// ----------------------------------------------------
// FEATURE 16: DIGITAL TWIN SIMULATOR
// ----------------------------------------------------
export interface DigitalTwinInput {
  staffingDeltaAnalysts: number;
  escalationComplianceImprovementPct: number;
  enableMissingSensors: boolean;
  mttrReductionPct: number;
  detectionRuleTuningPct: number;
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
// FEATURE 20: DATA VALIDATION
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
// FEATURE 25: PROCESS MINING
// ----------------------------------------------------
export interface ProcessMiningPath {
  pathSignature: string;
  pathType: 'COMPLIANT_IDEAL_PATH' | 'PREMATURE_SHORTCUT' | 'ESCALATION_BYPASS' | 'STAGNANT_STALL';
  pathId?: string;
  name?: string;
  stages?: string[];
  caseCount: number;
  frequencyPct: number;
  averageDurationMinutes: number;
  avgDurationMinutes?: number;
  slaBreachRatePct: number;
  isConformant?: boolean;
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

// Type aliases and exported interfaces for views
export type KnowledgeGraphNode = GraphNode;
export type KnowledgeGraphEdge = GraphEdge;
export type TimelineStep = TimelineReplayStage;
export type ProcessPath = ProcessMiningPath;

export interface NLPQualityReport {
  investigations: NLPInvestigationQuality[];
  investigationRecords?: NLPInvestigationQuality[];
  clusters: NLPTemplateCluster[];
  templateClusters?: NLPTemplateCluster[];
  suspiciousProfiles: SuspiciousAnalystProfile[];
  suspiciousAnalysts?: SuspiciousAnalystProfile[];
  averageQualityScore: number;
  overallQualityScore?: number;
  boilerplateRatio: number;
  copyPasteRatePct?: number;
  totalNotesAnalyzed?: number;
  notesEvaluated?: number;
}

export interface ProcessBottleneck {
  stage: string;
  avgDurationMinutes: number;
  anomalyRatePct: number;
  description: string;
}

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

export interface EnterpriseEngineDefinition {
  id: string;
  number: number;
  name: string;
  shortName: string;
  category:
    | 'ANOMALY_DETECTION'
    | 'BENCHMARKING'
    | 'INVESTIGATION_QUALITY'
    | 'FORENSIC_GRAPH'
    | 'MATURITY_GOVERNANCE'
    | 'SIMULATION_PREDICTION'
    | 'INGESTION_INTEGRITY'
    | 'PROCESS_MINING'
    | 'SUPERVISORY_CORE';
  description: string;
  algorithm: string;
  statutoryStandard: string;
  tabId: string;
  apiEndpoint: string;
  icon: string;
  status: 'ACTIVE' | 'OPTIMAL' | 'EVALUATING' | 'READY';
  metrics: {
    label: string;
    value: string | number;
    trend?: string;
    sublabel?: string;
  };
  lastRunTimestamp: string;
}

