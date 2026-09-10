import { Router, Request, Response } from 'express';
import { db } from './db';
import { verifyPassword, signToken, verifyToken, PRESET_USERS } from './auth';
import { validateAndNormalizeSOCData } from './engine/normalizer';
import { generateAssessmentDossier } from './engine/reporting';
import { SCENARIO_DEFINITIONS } from './engine/scenarios';

export const apiRouter = Router();

// Middleware to extract authenticated user from Authorization header
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return verifyToken(token);
}

// ----------------------------------------------------
// AUTHENTICATION & USERS
// ----------------------------------------------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase().trim());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });

  db.addAuditLog({
    actorEmail: user.email,
    actorName: user.name,
    actorRole: user.role,
    action: 'LOGIN',
    targetType: 'AUTH',
    targetId: user.id,
    metadata: { ip: req.ip, userAgent: req.headers['user-agent'] }
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization
    }
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    // Provide default fallback user if not authenticated for seamless demo inspection
    const defaultUser = PRESET_USERS[0];
    return res.json({
      authenticated: false,
      user: {
        id: defaultUser.id,
        email: defaultUser.email,
        name: defaultUser.name,
        role: defaultUser.role,
        organization: defaultUser.organization
      }
    });
  }

  const user = db.users.find(u => u.id === authUser.userId) || PRESET_USERS[0];
  res.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization
    }
  });
});

apiRouter.get('/auth/users', (req: Request, res: Response) => {
  res.json({
    users: db.users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      organization: u.organization
    }))
  });
});

// ----------------------------------------------------
// ANALYTICS & KPIS
// ----------------------------------------------------
apiRouter.get('/analytics/summary', (req: Request, res: Response) => {
  res.json(db.getKPISummary());
});

apiRouter.get('/analytics/findings-by-severity', (req: Request, res: Response) => {
  const counts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };

  for (const f of db.findings) {
    counts[f.severity] = (counts[f.severity] || 0) + 1;
  }

  const data = [
    { severity: 'Critical', count: counts.CRITICAL, fill: '#dc2626' },
    { severity: 'High', count: counts.HIGH, fill: '#ea580c' },
    { severity: 'Medium', count: counts.MEDIUM, fill: '#eab308' },
    { severity: 'Low', count: counts.LOW, fill: '#3b82f6' }
  ];

  res.json(data);
});

apiRouter.get('/analytics/findings-by-category', (req: Request, res: Response) => {
  const counts: Record<string, number> = {};
  for (const f of db.findings) {
    counts[f.category] = (counts[f.category] || 0) + 1;
  }

  const data = Object.entries(counts).map(([category, count]) => ({
    category,
    count
  })).sort((a, b) => b.count - a.count);

  res.json(data);
});

apiRouter.get('/analytics/workflow-completion', (req: Request, res: Response) => {
  const stats = db.getStatistics();
  res.json(stats.conversionFunnel);
});

apiRouter.get('/analytics/trends', (req: Request, res: Response) => {
  const stats = db.getStatistics();
  res.json(stats.trends);
});

apiRouter.get('/analytics/entity-priority', (req: Request, res: Response) => {
  const stats = db.getStatistics();
  res.json(stats.entityRankings);
});

apiRouter.get('/analytics/negative-space-matrix', (req: Request, res: Response) => {
  res.json(db.getNegativeSpaceMatrix());
});

apiRouter.get('/analytics/full-statistics', (req: Request, res: Response) => {
  res.json(db.getStatistics());
});

apiRouter.get('/analytics/ml-anomalies', (req: Request, res: Response) => {
  const mlFindings = db.findings.filter(f => f.mlAnomalySignal?.isAnomaly);
  res.json(mlFindings.map(f => ({
    findingId: f.id,
    caseNumber: f.caseNumber,
    entityName: f.entityName,
    title: f.title,
    severity: f.severity,
    anomalyScore: f.mlAnomalySignal?.anomalyScore,
    featureContributions: f.mlAnomalySignal?.featureContributions
  })));
});

// ----------------------------------------------------
// FINDINGS & DETAILS
// ----------------------------------------------------
apiRouter.get('/findings', (req: Request, res: Response) => {
  let list = [...db.findings];

  const { severity, priority, category, entity, status, search, sort } = req.query;

  if (severity && severity !== 'ALL') {
    list = list.filter(f => f.severity.toUpperCase() === String(severity).toUpperCase());
  }
  if (priority && priority !== 'ALL') {
    list = list.filter(f => f.priorityLevel.toUpperCase() === String(priority).toUpperCase());
  }
  if (category && category !== 'ALL') {
    list = list.filter(f => f.category.toLowerCase() === String(category).toLowerCase());
  }
  if (entity && entity !== 'ALL') {
    list = list.filter(f => f.entityId === entity || f.entityName.toLowerCase().includes(String(entity).toLowerCase()));
  }
  if (status && status !== 'ALL') {
    list = list.filter(f => f.reviewStatus.toUpperCase() === String(status).toUpperCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      f =>
        f.id.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.caseNumber.toLowerCase().includes(q) ||
        f.entityName.toLowerCase().includes(q) ||
        f.whatHappened.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sort === 'oldest') {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sort === 'severity') {
    const sevWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    list.sort((a, b) => sevWeight[b.severity] - sevWeight[a.severity]);
  } else if (sort === 'newest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    // Default: priority
    list.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  res.json({
    total: list.length,
    findings: list
  });
});

apiRouter.get('/findings/:id', (req: Request, res: Response) => {
  const finding = db.findings.find(f => f.id === req.params.id);
  if (!finding) {
    return res.status(404).json({ error: `Finding ${req.params.id} not found` });
  }

  // Audit view
  const authUser = getAuthUser(req);
  db.addAuditLog({
    actorEmail: authUser?.email || 'examiner@satsa.gov.in',
    actorName: authUser?.name || 'Dr. Arunima Sen',
    actorRole: authUser?.role || 'Lead Examiner',
    action: 'FINDING_VIEWED',
    targetType: 'FINDING',
    targetId: finding.id,
    metadata: { title: finding.title }
  });

  res.json(finding);
});

// ----------------------------------------------------
// ADVANCED SUPERVISORY EXAMINER DECISION SUPPORT ENDPOINTS
// ----------------------------------------------------
apiRouter.get('/correlations', (req: Request, res: Response) => {
  res.json(db.getCorrelations());
});

apiRouter.get('/sampling', (req: Request, res: Response) => {
  const size = parseInt(req.query.size as string) || 20;
  res.json(db.getSmartSample(size));
});

apiRouter.post('/sampling/replace', (req: Request, res: Response) => {
  const { caseIdToReplace, newCandidateId } = req.body || {};
  if (!caseIdToReplace) {
    return res.status(400).json({ error: 'caseIdToReplace is required' });
  }
  const sample = db.replaceSampleCandidate(caseIdToReplace, newCandidateId);
  res.json(sample);
});

apiRouter.get('/fingerprints', (req: Request, res: Response) => {
  res.json(db.getFingerprints());
});

apiRouter.get('/timeline', (req: Request, res: Response) => {
  res.json(db.getTimeline());
});

apiRouter.get('/feedback/stats', (req: Request, res: Response) => {
  res.json(db.getFeedbackStats());
});

apiRouter.post('/assistant/query', (req: Request, res: Response) => {
  const { query, contextEntityId, contextCaseId } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query string is required' });
  }

  const response = db.askAssistant(query, contextEntityId, contextCaseId);
  res.json(response);
});

apiRouter.post('/findings/:id/review', (req: Request, res: Response) => {
  const { decision, notes, recommendedFollowUp } = req.body || {};
  const validDecisions = ['CONFIRMED', 'REJECTED', 'NEEDS_EVIDENCE', 'VALID', 'FALSE_POSITIVE', 'NEEDS_INVESTIGATION', 'ACCEPTED_EXCEPTION', 'CONFIRMED_GAP'];
  if (!decision || !validDecisions.includes(decision)) {
    return res.status(400).json({ error: `Valid decision is required (${validDecisions.join(', ')})` });
  }

  const authUser = getAuthUser(req);
  const reviewer = {
    id: authUser?.userId || 'USR-001',
    name: authUser?.name || 'Dr. Arunima Sen',
    email: authUser?.email || 'examiner@satsa.gov.in',
    role: authUser?.role || 'Lead Examiner'
  };

  const updated = db.reviewFinding(req.params.id, decision as any, reviewer, notes || 'Review decision submitted.', recommendedFollowUp);
  if (!updated) {
    return res.status(404).json({ error: `Finding ${req.params.id} not found` });
  }

  res.json({
    success: true,
    message: `Finding ${req.params.id} recorded as ${decision}`,
    finding: updated
  });
});

// ----------------------------------------------------
// ENTITIES
// ----------------------------------------------------
apiRouter.get('/entities', (req: Request, res: Response) => {
  res.json(db.entities);
});

// ----------------------------------------------------
// SCENARIOS & DEMO MODE
// ----------------------------------------------------
apiRouter.get('/scenarios', (req: Request, res: Response) => {
  res.json({
    activeScenarioId: db.activeScenarioId,
    scenarios: SCENARIO_DEFINITIONS
  });
});

apiRouter.post('/scenarios/load', (req: Request, res: Response) => {
  const { scenarioId } = req.body || {};
  if (!scenarioId) {
    return res.status(400).json({ error: 'scenarioId is required' });
  }

  const authUser = getAuthUser(req);
  db.loadScenario(scenarioId, authUser?.name || 'Lead Examiner');

  res.json({
    success: true,
    activeScenarioId: db.activeScenarioId,
    kpi: db.getKPISummary(),
    findingsCount: db.findings.length
  });
});

// ----------------------------------------------------
// DATA INGESTION (CSV / JSON / SQL DB DUMPS / REST API)
// ----------------------------------------------------
const handleIngestion = (req: Request, res: Response) => {
  const { content, mimeType = 'text/csv', records } = req.body || {};
  let payloadContent = content;

  // If directly posted JSON records via REST API
  if (!payloadContent && records && Array.isArray(records)) {
    payloadContent = JSON.stringify(records);
  }

  if (!payloadContent) {
    return res.status(400).json({ error: 'Uploaded content payload or records array is required' });
  }

  const authUser = getAuthUser(req);
  const result = validateAndNormalizeSOCData(payloadContent, mimeType);

  if (!result.success && result.errors.length > 0 && result.normalizedCases.length === 0) {
    return res.status(422).json({
      error: 'Data validation and normalization failed',
      errors: result.errors
    });
  }

  db.ingestCustomDataset(result.normalizedCases, result.normalizedAlerts, authUser?.email || 'examiner@satsa.gov.in');

  res.json({
    success: true,
    ingestion: result,
    newSummary: db.getKPISummary()
  });
};

apiRouter.post('/upload', handleIngestion);
apiRouter.post('/ingest', handleIngestion);

// ----------------------------------------------------
// AUDIT LOGS
// ----------------------------------------------------
apiRouter.get('/audit/logs', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  res.json({
    total: db.auditEvents.length,
    events: db.auditEvents.slice(0, limit)
  });
});

// ----------------------------------------------------
// ASSESSMENT REPORT / DOSSIER
// ----------------------------------------------------
apiRouter.get('/reports/assessment-dossier', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const examinerName = authUser ? `${authUser.name} (${authUser.role})` : 'Dr. Arunima Sen (Lead Examiner)';
  const dossier = generateAssessmentDossier(examinerName);

  db.addAuditLog({
    actorEmail: authUser?.email || 'examiner@satsa.gov.in',
    actorName: authUser?.name || 'Dr. Arunima Sen',
    actorRole: authUser?.role || 'Lead Examiner',
    action: 'REPORT_GENERATED',
    targetType: 'REPORT',
    targetId: dossier.metadata.reportId,
    metadata: { totalFindings: dossier.findingsDossier.length }
  });

  res.json(dossier);
});

// ----------------------------------------------------
// 25 ENTERPRISE-GRADE ANALYTICS ENGINE API ENDPOINTS
// ----------------------------------------------------

// Feature 1: AI Anomaly Detection Engine (iForest, LOF, DBSCAN, Autoencoder)
apiRouter.get('/analytics/anomalies', (req: Request, res: Response) => {
  res.json({
    total: db.getAIAnomalies().length,
    findings: db.getAIAnomalies()
  });
});

// Feature 2: Peer Benchmarking Engine
apiRouter.get('/analytics/benchmarks', (req: Request, res: Response) => {
  res.json({
    totalEntities: db.getPeerBenchmarks().length,
    benchmarks: db.getPeerBenchmarks()
  });
});

// Feature 3: Smart Sampling Engine & Top 6 Target Lists
apiRouter.get('/analytics/smart-sampling', (req: Request, res: Response) => {
  const sampleSize = parseInt(req.query.sampleSize as string) || 20;
  res.json(db.getSmartSamplingReport(sampleSize));
});

// Feature 4: Offline NLP Investigation Quality Analysis
apiRouter.get('/analytics/nlp-quality', (req: Request, res: Response) => {
  res.json(db.getNLPQualityReport());
});

// Feature 7: Evidence Knowledge Graph
apiRouter.get('/analytics/knowledge-graph', (req: Request, res: Response) => {
  res.json(db.getKnowledgeGraph());
});

// Feature 8: Investigation Timeline Replays
apiRouter.get('/analytics/timeline-replays', (req: Request, res: Response) => {
  res.json({
    total: db.getTimelineReplays().length,
    replays: db.getTimelineReplays()
  });
});

// Feature 9: Root Cause Analysis & Recommendation Tree
apiRouter.get('/analytics/root-cause/:findingId', (req: Request, res: Response) => {
  const findingId = req.params.findingId;
  res.json(db.getRootCauseDiagnosis(findingId));
});

// Feature 10: Explainable AI (SHAP Waterfall)
apiRouter.get('/analytics/shap/:findingId', (req: Request, res: Response) => {
  const findingId = req.params.findingId;
  res.json(db.getSHAPExplanation(findingId));
});

// Feature 11: SOC Health Score Breakdown
apiRouter.get('/analytics/soc-health', (req: Request, res: Response) => {
  res.json(db.getSOCHealthScore());
});

// Feature 12: Governance Maturity Index (GMI)
apiRouter.get('/analytics/governance-maturity', (req: Request, res: Response) => {
  const entityId = req.query.entityId as string | undefined;
  res.json(db.getGovernanceMaturity(entityId));
});

// Feature 13: Cyber Resilience Index (CRI)
apiRouter.get('/analytics/cyber-resilience', (req: Request, res: Response) => {
  const entityId = req.query.entityId as string | undefined;
  res.json(db.getCyberResilience(entityId));
});

// Feature 14: Predictive Forecasts
apiRouter.get('/analytics/predictive-forecasts', (req: Request, res: Response) => {
  res.json({
    forecasts: db.getPredictiveForecasts()
  });
});

// Feature 15: MITRE ATT&CK Matrix Coverage
apiRouter.get('/analytics/mitre-matrix', (req: Request, res: Response) => {
  res.json(db.getMITREMatrix());
});

// Feature 16: Digital Twin SOC Simulator
apiRouter.post('/analytics/digital-twin', (req: Request, res: Response) => {
  const body = req.body || {};
  const simulationInput = {
    staffingDeltaAnalysts: parseInt(body.staffingDeltaAnalysts) || 0,
    escalationComplianceImprovementPct: parseInt(body.escalationComplianceImprovementPct) || 0,
    enableMissingSensors: !!body.enableMissingSensors,
    mttrReductionPct: parseInt(body.mttrReductionPct) || 0,
    detectionRuleTuningPct: parseInt(body.detectionRuleTuningPct) || 0
  };

  const output = db.runDigitalTwin(simulationInput);
  res.json({
    input: simulationInput,
    output
  });
});

// Feature 17: Offline AI Supervisory Copilot
apiRouter.post('/analytics/assistant', (req: Request, res: Response) => {
  const { query } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required' });
  }

  const response = db.askOfflineAssistant(query);
  res.json(response);
});

// Feature 20: Data Ingestion Validation Report
apiRouter.get('/analytics/data-validation', (req: Request, res: Response) => {
  res.json(db.getDataValidationReport());
});

// Feature 25: Process Mining Discovery Model
apiRouter.get('/analytics/process-mining', (req: Request, res: Response) => {
  res.json(db.getProcessMining());
});

// Feature 22: Supervisory Alerts & Statutory Policy Gate Engine
apiRouter.get('/analytics/supervisory-alerts', (req: Request, res: Response) => {
  res.json(db.getSupervisoryAlerts());
});

apiRouter.post('/analytics/supervisory-alerts/:id/acknowledge', (req: Request, res: Response) => {
  const success = db.acknowledgeSupervisoryAlert(req.params.id);
  if (!success) {
    return res.status(404).json({ error: `Alert ${req.params.id} not found` });
  }
  res.json({ success: true, message: `Alert ${req.params.id} acknowledged` });
});

apiRouter.post('/analytics/policy-rules/:id/toggle', (req: Request, res: Response) => {
  const { enabled } = req.body || {};
  const rule = db.togglePolicyRule(req.params.id, enabled);
  if (!rule) {
    return res.status(404).json({ error: `Policy rule ${req.params.id} not found` });
  }
  res.json({ success: true, rule, allRules: db.policyRules });
});

// 25 Enterprise Engines Manifest & Dynamic Controller
apiRouter.get('/analytics/engines', (req: Request, res: Response) => {
  res.json({
    total: 25,
    engines: db.getEnterpriseEnginesSummary()
  });
});

apiRouter.post('/analytics/engines/:id/run', (req: Request, res: Response) => {
  const result = db.runEngine(req.params.id);
  res.json(result);
});


