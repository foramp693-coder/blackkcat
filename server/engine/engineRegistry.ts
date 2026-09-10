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

export const ENTERPRISE_ENGINES_METADATA: Omit<EnterpriseEngineDefinition, 'status' | 'metrics' | 'lastRunTimestamp'>[] = [
  {
    id: 'ai-anomaly-ensemble',
    number: 1,
    name: 'AI Anomaly Detection Ensemble',
    shortName: 'AI Anomaly Ensemble',
    category: 'ANOMALY_DETECTION',
    description: 'Ensemble multi-model detection combining Isolation Forest, Local Outlier Factor (LOF), DBSCAN clustering, and Autoencoder reconstruction error.',
    algorithm: 'Ensemble iForest (300 trees) + LOF (k=20) + DBSCAN (eps=0.35) + Deep Autoencoder',
    statutoryStandard: 'NCIIPC Framework Clause 7.1',
    tabId: 'ai-anomalies',
    apiEndpoint: '/api/analytics/anomalies',
    icon: 'BrainCircuit'
  },
  {
    id: 'peer-benchmarking',
    number: 2,
    name: 'Peer Benchmarking & Cohort Engine',
    shortName: 'Peer Benchmarking',
    category: 'BENCHMARKING',
    description: 'Comparative operational benchmarking across Critical Sector Entities (CSEs) with sector medians, percentile rankings, and multi-axis radar scorecards.',
    algorithm: 'Normalized Z-score Sector Cohort Distribution & Multi-variate Distance Modeling',
    statutoryStandard: 'CERT-In CSE Comparative Audit Protocol',
    tabId: 'peer-benchmarks',
    apiEndpoint: '/api/analytics/benchmarks',
    icon: 'BarChart2'
  },
  {
    id: 'smart-sampling-engine',
    number: 3,
    name: 'Smart Sampling & Top Target Engine',
    shortName: 'Smart Sampling (ISO 19011)',
    category: 'SUPERVISORY_CORE',
    description: 'Statistically rigorous stratified sampling algorithm conforming to ISO 19011 auditing principles to extract high-risk supervisory candidates.',
    algorithm: 'Stratified Risk-Weighted Reservoir Sampling with Kolmogorov-Smirnov representativeness check',
    statutoryStandard: 'ISO 19011:2018 Guidelines for Auditing Management Systems',
    tabId: 'smart-sampling',
    apiEndpoint: '/api/analytics/smart-sampling',
    icon: 'Layers'
  },
  {
    id: 'nlp-investigation-quality',
    number: 4,
    name: 'NLP Investigation Quality & Boilerplate Audit',
    shortName: 'NLP Quality Audit',
    category: 'INVESTIGATION_QUALITY',
    description: 'Air-gapped linguistic engine detecting copy-pasted boilerplate justifications, superficial triage notes, and rubber-stamping analysts.',
    algorithm: 'Jaccard N-gram (n=3) Similarity + Term Frequency Saliency + Regex Pattern Heuristics',
    statutoryStandard: 'SIH26157 Quality Assurance Standard',
    tabId: 'nlp-quality',
    apiEndpoint: '/api/analytics/nlp-quality',
    icon: 'FileText'
  },
  {
    id: 'shift-fatigue-engine',
    number: 5,
    name: 'Shift Handover & Circadian Fatigue Engine',
    shortName: 'Circadian Fatigue Engine',
    category: 'SUPERVISORY_CORE',
    description: 'Detects SLA cliffs, anomalous latency spikes, and escalation suppression occurring across analyst shift changeovers and graveyard hours.',
    algorithm: 'Diurnal Time-Series Wavelet Decomposition & Shift-Boundary Window Analysis',
    statutoryStandard: 'ISO 27001:2022 A.8.16 SOC Operational Resilience',
    tabId: 'analytics',
    apiEndpoint: '/api/trends',
    icon: 'Clock'
  },
  {
    id: 'execution-gap-rules',
    number: 6,
    name: 'Deterministic Execution Gap Rules Engine',
    shortName: 'Execution Gap Rules',
    category: 'SUPERVISORY_CORE',
    description: 'Deterministic supervisory rule engine evaluating SOC triage, escalation, and closure records against statutory operational mandates.',
    algorithm: 'Forward-Chaining Rule Induction & State Machine Verification',
    statutoryStandard: 'CERT-In Mandate Clause 4.2 & NCIIPC Guidelines',
    tabId: 'findings',
    apiEndpoint: '/api/findings',
    icon: 'ShieldAlert'
  },
  {
    id: 'evidence-knowledge-graph',
    number: 7,
    name: 'Evidence Knowledge Graph & Entity Topology',
    shortName: 'Evidence Knowledge Graph',
    category: 'FORENSIC_GRAPH',
    description: 'Constructs a multi-relational graph linking entities, analysts, cases, alerts, and forensic evidence artifacts to reveal hidden relationships.',
    algorithm: 'Force-Directed Graph Theory + Eigenvector Centrality + Path Finding (Dijkstra)',
    statutoryStandard: 'ISO/IEC 27037 Digital Evidence Handling',
    tabId: 'knowledge-graph',
    apiEndpoint: '/api/analytics/knowledge-graph',
    icon: 'Share2'
  },
  {
    id: 'timeline-replay-engine',
    number: 8,
    name: 'Incident Timeline Replay & Velocity Engine',
    shortName: 'Incident Timeline Replay',
    category: 'FORENSIC_GRAPH',
    description: 'Step-by-step chronological replay of incident handling lifecycles with suspicious delay flags, phase velocity calculations, and audit milestones.',
    algorithm: 'Discrete-Event Simulation Trace Reconstruction & Velocity Differential Analysis',
    statutoryStandard: 'NCIIPC SOP on Incident Handling Verification',
    tabId: 'timeline-replay',
    apiEndpoint: '/api/analytics/timeline-replays',
    icon: 'History'
  },
  {
    id: 'root-cause-decision-tree',
    number: 9,
    name: 'Root Cause Analysis & Recommendation Tree',
    shortName: 'Root Cause Diagnosis',
    category: 'INVESTIGATION_QUALITY',
    description: 'Diagnostic engine identifying the systemic failure driver behind supervisory gaps with structured remediation recommendations.',
    algorithm: 'Heuristic 5-Whys Diagnostic Decision Tree with Confidence Weighting',
    statutoryStandard: 'ITIL 4 Problem Management & ISO 27001 Continuous Improvement',
    tabId: 'findings',
    apiEndpoint: '/api/analytics/root-cause/FND-001',
    icon: 'GitBranch'
  },
  {
    id: 'shap-explainable-ai',
    number: 10,
    name: 'SHAP Explainable AI Waterfall Engine',
    shortName: 'Explainable AI (SHAP)',
    category: 'ANOMALY_DETECTION',
    description: 'Calculates Shapley additive feature values explaining why individual cases or findings were assigned high supervisory risk scores.',
    algorithm: 'KernelSHAP Feature Attribution Approximation',
    statutoryStandard: 'EU AI Act / IEEE Transparency Standard P7001',
    tabId: 'findings',
    apiEndpoint: '/api/analytics/shap/FND-001',
    icon: 'Sparkles'
  },
  {
    id: 'soc-health-scorecard',
    number: 11,
    name: 'SOC Health Score Composite Engine',
    shortName: 'SOC Health Scorecard',
    category: 'MATURITY_GOVERNANCE',
    description: 'Evaluates SOC health across 7 vital dimensions: Detection, Triage, Investigation, Escalation, Forensics, SLA Adherence, and Staffing Balance.',
    algorithm: 'Multi-Criteria Decision Analysis (MCDA) Weighted Composite Aggregation',
    statutoryStandard: 'NIST CSF 2.0 & ISO/IEC 27004 Measurement',
    tabId: 'soc-health',
    apiEndpoint: '/api/analytics/soc-health',
    icon: 'Activity'
  },
  {
    id: 'governance-maturity-index',
    number: 12,
    name: 'Governance Maturity Index (GMI) Engine',
    shortName: 'Governance Maturity (GMI)',
    category: 'MATURITY_GOVERNANCE',
    description: 'Quantitative maturity scoring across 5 operational tiers (Ad-hoc to Continuously Optimized) measuring institutional governance rigor.',
    algorithm: 'CMMI-Aligned Cyber Governance Maturity Model (Tiers 1-5)',
    statutoryStandard: 'RBI Cyber Security Framework Sec G.3',
    tabId: 'soc-health',
    apiEndpoint: '/api/analytics/governance-maturity',
    icon: 'Award'
  },
  {
    id: 'cyber-resilience-index',
    number: 13,
    name: 'Cyber Resilience Index (CRI) Engine',
    shortName: 'Cyber Resilience (CRI)',
    category: 'MATURITY_GOVERNANCE',
    description: 'Measures an organization’s operational endurance under attack stress, MTTR containment velocity, and forensic recovery capacity.',
    algorithm: 'Dynamic Stress-Resistance Indexing with Recovery Half-Life Calculation',
    statutoryStandard: 'NCIIPC Guidelines for Critical Sector Cyber Resilience',
    tabId: 'soc-health',
    apiEndpoint: '/api/analytics/cyber-resilience',
    icon: 'ShieldCheck'
  },
  {
    id: 'predictive-time-series-forecast',
    number: 14,
    name: 'Predictive Analytics & Time-Series Forecaster',
    shortName: 'Predictive Forecasts',
    category: 'SIMULATION_PREDICTION',
    description: 'Projects 30, 60, and 90-day trajectory forecasts for incident breach rates, false positive saturation, and analyst burnout risk.',
    algorithm: 'Holt-Winters Triple Exponential Smoothing & Linear Drift Projection',
    statutoryStandard: 'ISO 31000 Risk Assessment & Predictive Modeling',
    tabId: 'soc-health',
    apiEndpoint: '/api/analytics/predictive-forecasts',
    icon: 'TrendingUp'
  },
  {
    id: 'mitre-attack-coverage',
    number: 15,
    name: 'MITRE ATT&CK Matrix & Coverage Engine',
    shortName: 'MITRE ATT&CK Coverage',
    category: 'ANOMALY_DETECTION',
    description: 'Maps all observed alert telemetry across 14 MITRE ATT&CK enterprise tactics to illuminate surveillance blind spots and missed adversary stages.',
    algorithm: 'STIX/TAXII Adversary Matrix Mapping & Blind Spot Heatmap Computation',
    statutoryStandard: 'MITRE ATT&CK Enterprise Matrix v14',
    tabId: 'mitre-matrix',
    apiEndpoint: '/api/analytics/mitre-matrix',
    icon: 'ShieldAlert'
  },
  {
    id: 'digital-twin-simulator',
    number: 16,
    name: 'Digital Twin SOC Simulator Engine',
    shortName: 'Digital Twin Simulator',
    category: 'SIMULATION_PREDICTION',
    description: 'Simulates the systemic impact of adding analysts, tuning detection rules, deploying missing sensors, and accelerating SLA handovers.',
    algorithm: 'Monte Carlo Sensitivity Simulation & Operational Queue Perturbation',
    statutoryStandard: 'ISO 22301 Business Continuity & Simulation Verification',
    tabId: 'digital-twin',
    apiEndpoint: '/api/analytics/digital-twin',
    icon: 'Sliders'
  },
  {
    id: 'offline-supervisory-copilot',
    number: 17,
    name: 'Offline AI Supervisory Copilot',
    shortName: 'Evidence AI Assistant',
    category: 'INVESTIGATION_QUALITY',
    description: 'Evidence-grounded conversational supervisory assistant providing statutory cross-examinations without leaking telemetry outside air-gap.',
    algorithm: 'Strict Evidence-Grounded TF-IDF Cosine Retrieval & Heuristic Dialogue Synthesizer',
    statutoryStandard: 'Air-Gapped Sovereign AI Compliance Guideline',
    tabId: 'assistant',
    apiEndpoint: '/api/analytics/assistant',
    icon: 'Bot'
  },
  {
    id: 'negative-space-matrix',
    number: 18,
    name: 'Negative Space Matrix & Absence Detector',
    shortName: 'Negative Space Matrix',
    category: 'SUPERVISORY_CORE',
    description: 'Audits what is conspicuously ABSENT: unescalated high-risk alerts, missing logs, silent critical infrastructure nodes, and zero-evidence closures.',
    algorithm: 'Expectation Matrix Differential & Negative Sampling Verification',
    statutoryStandard: 'NCIIPC Critical Infrastructure Detection Assurance',
    tabId: 'negative-space',
    apiEndpoint: '/api/negative-space',
    icon: 'EyeOff'
  },
  {
    id: 'soc-behaviour-fingerprinting',
    number: 19,
    name: 'SOC Behavioural Fingerprinting Engine',
    shortName: 'SOC Behaviour Fingerprints',
    category: 'BENCHMARKING',
    description: 'Constructs behavioral profiles characterizing each entity’s operational rhythms, closure velocities, and triage disposition patterns.',
    algorithm: 'Empirical Distribution Function (EDF) Signature Extraction & Chi-Square Fit',
    statutoryStandard: 'CERT-In Entity Operational Profiling Directive',
    tabId: 'fingerprints',
    apiEndpoint: '/api/fingerprints',
    icon: 'Fingerprint'
  },
  {
    id: 'data-ingestion-validation',
    number: 20,
    name: 'Data Validation & Cryptographic Guard',
    shortName: 'Data Validation Guard',
    category: 'INGESTION_INTEGRITY',
    description: 'Cryptographically verifies ingested CSV, JSON, and syslog datasets with SHA-256 integrity hashes, schema normalizers, and anomaly checks.',
    algorithm: 'SHA-256 Merkle Block Verification + Schema Constraint Validation',
    statutoryStandard: 'ISO/IEC 27037 Legal Admissibility of Electronic Evidence',
    tabId: 'data-validation',
    apiEndpoint: '/api/analytics/data-validation',
    icon: 'FileCheck'
  },
  {
    id: 'statistical-funnel-analyzer',
    number: 21,
    name: 'Statistical Funnel & Outlier Analysis Engine',
    shortName: 'Statistical Funnel',
    category: 'SUPERVISORY_CORE',
    description: 'Calculates end-to-end operational funnel throughput rates, box-plot distribution quartiles, and statistical Z-score outliers.',
    algorithm: 'Non-Parametric Interquartile Range (IQR) & Gaussian Kernel Density Estimation',
    statutoryStandard: 'ISO 27004 Information Security Measurement',
    tabId: 'analytics',
    apiEndpoint: '/api/analytics/statistics',
    icon: 'BarChart3'
  },
  {
    id: 'supervisory-alerts-engine',
    number: 22,
    name: 'Supervisory Alerts & Policy Gate Engine',
    shortName: 'Alerts & Policy Gate',
    category: 'SUPERVISORY_CORE',
    description: 'Monitors compliance against active statutory policy rules (Escalation SLAs, Evidence Sufficiency, Dual Approvals) and triggers examiner alerts.',
    algorithm: 'Active Policy Threshold Interceptor & Real-time Statutory Validator',
    statutoryStandard: 'CERT-In Incident Guidelines & RBI Master Directions',
    tabId: 'supervisory-alerts',
    apiEndpoint: '/api/analytics/supervisory-alerts',
    icon: 'Bell'
  },
  {
    id: 'evidence-corroboration-sampler',
    number: 23,
    name: 'Evidence Corroboration & Replacement Sampler',
    shortName: 'Evidence Sampler',
    category: 'SUPERVISORY_CORE',
    description: 'Enables dynamic replacement of sampled candidates when initial examination proves insufficient, tracking chain of custody.',
    algorithm: 'Deterministic Nearest-Neighbor Replacement with Diversity Preservation',
    statutoryStandard: 'ISO 19011:2018 Clause 6.4 Auditing Protocols',
    tabId: 'smart-sampling',
    apiEndpoint: '/api/sampling',
    icon: 'CheckCircle2'
  },
  {
    id: 'systemic-correlation-engine',
    number: 24,
    name: 'Systemic Correlation & Pattern Clustering',
    shortName: 'Systemic Pattern Correlation',
    category: 'FORENSIC_GRAPH',
    description: 'Clusters disconnected supervisory findings across multiple entities to uncover systemic vendor vulnerabilities and coordinated gaps.',
    algorithm: 'Agglomerative Hierarchical Clustering with TF-IDF Weighted Entity Graph',
    statutoryStandard: 'NCIIPC Threat Correlation Standard',
    tabId: 'findings',
    apiEndpoint: '/api/correlations',
    icon: 'Network'
  },
  {
    id: 'process-mining-discovery',
    number: 25,
    name: 'Process Mining & Conformance Discovery Engine',
    shortName: 'Process Mining Discovery',
    category: 'PROCESS_MINING',
    description: 'Discovers the empirical operational lifecycle paths traversed by security cases, pinpointing triage loops, bypasses, and handover bottlenecks.',
    algorithm: 'Alpha-Miner Transition Graph Discovery + Conformance Frequency Weighting',
    statutoryStandard: 'IEEE Process Mining Standard & ISO 9001 Process Governance',
    tabId: 'process-mining',
    apiEndpoint: '/api/analytics/process-mining',
    icon: 'GitFork'
  }
];
