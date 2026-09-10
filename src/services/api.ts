import {
  KPISummary,
  SupervisoryFinding,
  NegativeSpaceRow,
  ScenarioDefinition,
  AuditEvent,
  Entity,
  WorkflowFunnel,
  OperationalTrendPoint,
  FindingCorrelation,
  SmartSampleRecommendation,
  SOCBehaviourFingerprint,
  AssessmentTimeline,
  ExaminerFeedbackRecord,
  DynamicSupervisoryAlert,
  DynamicPolicyRule,
  EnterpriseEngineDefinition,
  PasswordResetChallenge,
  PasswordResetVerificationResult,
  PasswordResetExecutionResult
} from '../types';

class ApiService {
  private token: string | null = localStorage.getItem('satsa_auth_token');

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('satsa_auth_token', token);
    } else {
      localStorage.removeItem('satsa_auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errMessage = `API error (${res.status}): ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.error) errMessage = errJson.error;
      } catch {
        // Fall back to status text
      }
      throw new Error(errMessage);
    }

    return res.json() as Promise<T>;
  }

  // Auth
  public async login(usernameOrEmail: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: usernameOrEmail, password })
    });
    this.setToken(data.token);
    return data;
  }

  public async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors during logout
    } finally {
      this.setToken(null);
    }
  }

  public async getMe() {
    return this.request<{ authenticated: boolean; user: any }>('/auth/me');
  }

  public async getUsers() {
    return this.request<{ users: any[] }>('/auth/users');
  }

  public async requestPasswordReset(identifier: string): Promise<PasswordResetChallenge> {
    return this.request<PasswordResetChallenge>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier })
    });
  }

  public async verifyResetCode(resetToken: string, code: string): Promise<PasswordResetVerificationResult> {
    return this.request<PasswordResetVerificationResult>('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ resetToken, code })
    });
  }

  public async resetPassword(
    resetToken: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<PasswordResetExecutionResult> {
    return this.request<PasswordResetExecutionResult>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword, confirmPassword })
    });
  }

  // Analytics
  public async getKPISummary(): Promise<KPISummary> {
    return this.request<KPISummary>('/analytics/summary');
  }

  public async getFindingsBySeverity(): Promise<{ severity: string; count: number; fill: string }[]> {
    return this.request('/analytics/findings-by-severity');
  }

  public async getFindingsByCategory(): Promise<{ category: string; count: number }[]> {
    return this.request('/analytics/findings-by-category');
  }

  public async getWorkflowCompletion(): Promise<WorkflowFunnel[]> {
    return this.request('/analytics/workflow-completion');
  }

  public async getTrends(): Promise<OperationalTrendPoint[]> {
    return this.request('/analytics/trends');
  }

  public async getEntityPriority(): Promise<{ entityId: string; entityName: string; priorityScore: number; findingCount: number; criticalCount: number }[]> {
    return this.request('/analytics/entity-priority');
  }

  public async getNegativeSpaceMatrix(): Promise<NegativeSpaceRow[]> {
    return this.request('/analytics/negative-space-matrix');
  }

  public async getMLAnomalies(): Promise<any[]> {
    return this.request('/analytics/ml-anomalies');
  }

  public async getFullStatistics(): Promise<any> {
    return this.request('/analytics/full-statistics');
  }

  // Findings
  public async getFindings(params: Record<string, string> = {}): Promise<{ total: number; findings: SupervisoryFinding[] }> {
    const query = new URLSearchParams(params).toString();
    return this.request(`/findings${query ? `?${query}` : ''}`);
  }

  public async getFindingById(id: string): Promise<SupervisoryFinding> {
    return this.request(`/findings/${encodeURIComponent(id)}`);
  }

  public async reviewFinding(
    id: string,
    decision: 'CONFIRMED' | 'REJECTED' | 'NEEDS_EVIDENCE' | 'VALID' | 'FALSE_POSITIVE' | 'NEEDS_INVESTIGATION' | 'ACCEPTED_EXCEPTION' | 'CONFIRMED_GAP',
    notes: string,
    recommendedFollowUp?: string
  ): Promise<{ success: boolean; message: string; finding: SupervisoryFinding }> {
    return this.request(`/findings/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes, recommendedFollowUp })
    });
  }

  // Advanced Supervisory Endpoints
  public async getCorrelations(): Promise<FindingCorrelation[]> {
    return this.request('/correlations');
  }

  public async getSmartSample(size: number = 20): Promise<SmartSampleRecommendation> {
    return this.request(`/sampling?size=${size}`);
  }

  public async replaceSampleCandidate(caseIdToReplace: string, newCandidateId?: string): Promise<SmartSampleRecommendation> {
    return this.request('/sampling/replace', {
      method: 'POST',
      body: JSON.stringify({ caseIdToReplace, newCandidateId })
    });
  }

  public async getFingerprints(): Promise<SOCBehaviourFingerprint[]> {
    return this.request('/fingerprints');
  }

  public async getTimeline(): Promise<AssessmentTimeline> {
    return this.request('/timeline');
  }

  public async getFeedbackStats(): Promise<{
    totalReviewed: number;
    falsePositiveRate: number;
    confirmedGaps: number;
    acceptedExceptions: number;
    records: ExaminerFeedbackRecord[];
  }> {
    return this.request('/feedback/stats');
  }

  public async askAssistant(query: string, contextEntityId?: string, contextCaseId?: string): Promise<{
    answer: string;
    intentDetected: string;
    evidenceReferences: { type: string; id: string; title: string; detail: string }[];
    suggestedFollowUps: string[];
    groundedInDataset: boolean;
  }> {
    return this.request('/assistant/query', {
      method: 'POST',
      body: JSON.stringify({ query, contextEntityId, contextCaseId })
    });
  }

  // Entities
  public async getEntities(): Promise<Entity[]> {
    return this.request('/entities');
  }

  // Scenarios
  public async getScenarios(): Promise<{ activeScenarioId: string; scenarios: ScenarioDefinition[] }> {
    return this.request('/scenarios');
  }

  public async loadScenario(scenarioId: string): Promise<any> {
    return this.request('/scenarios/load', {
      method: 'POST',
      body: JSON.stringify({ scenarioId })
    });
  }

  // Upload
  public async uploadSOCData(content: string, mimeType: string = 'text/csv'): Promise<any> {
    return this.request('/upload', {
      method: 'POST',
      body: JSON.stringify({ content, mimeType })
    });
  }

  // Audit Logs
  public async getAuditLogs(limit: number = 100): Promise<{ total: number; events: AuditEvent[] }> {
    return this.request(`/audit/logs?limit=${limit}`);
  }

  // Assessment Report
  public async getAssessmentDossier(): Promise<any> {
    return this.request('/reports/assessment-dossier');
  }

  // ----------------------------------------------------
  // 25 ENTERPRISE ANALYTICS PLATFORM APIS
  // ----------------------------------------------------

  // Feature 1: AI Anomaly Detection Engine
  public async getAIAnomalies(): Promise<{ total: number; findings: any[] }> {
    return this.request('/analytics/anomalies');
  }

  // Feature 2: Peer Benchmarking Engine
  public async getPeerBenchmarks(): Promise<{ totalEntities: number; benchmarks: any[] }> {
    return this.request('/analytics/benchmarks');
  }

  // Feature 3: Smart Sampling & Top 6 Target Lists
  public async getSmartSampling(sampleSize: number = 20): Promise<any> {
    return this.request(`/analytics/smart-sampling?sampleSize=${sampleSize}`);
  }

  // Feature 4: Offline NLP Investigation Quality
  public async getNLPQuality(): Promise<any> {
    return this.request('/analytics/nlp-quality');
  }

  // Feature 7: Evidence Knowledge Graph
  public async getKnowledgeGraph(): Promise<any> {
    return this.request('/analytics/knowledge-graph');
  }

  // Feature 8: Timeline Replay
  public async getTimelineReplays(): Promise<{ total: number; replays: any[] }> {
    return this.request('/analytics/timeline-replays');
  }

  // Feature 9: Root Cause Diagnosis & Recommendation Tree
  public async getRootCause(findingId: string): Promise<any> {
    return this.request(`/analytics/root-cause/${findingId}`);
  }

  // Feature 10: Explainable AI (SHAP Waterfall)
  public async getSHAPExplanation(findingId: string): Promise<any> {
    return this.request(`/analytics/shap/${findingId}`);
  }

  // Feature 11: SOC Health Score Breakdown
  public async getSOCHealthScore(): Promise<any> {
    return this.request('/analytics/soc-health');
  }

  // Feature 12: Governance Maturity Index (GMI)
  public async getGovernanceMaturity(entityId?: string): Promise<any> {
    return this.request(`/analytics/governance-maturity${entityId ? `?entityId=${entityId}` : ''}`);
  }

  // Feature 13: Cyber Resilience Index (CRI)
  public async getCyberResilience(entityId?: string): Promise<any> {
    return this.request(`/analytics/cyber-resilience${entityId ? `?entityId=${entityId}` : ''}`);
  }

  // Feature 14: Predictive Forecasts
  public async getPredictiveForecasts(): Promise<{ forecasts: any[] }> {
    return this.request('/analytics/predictive-forecasts');
  }

  // Feature 15: MITRE ATT&CK Matrix
  public async getMITREMatrix(): Promise<any> {
    return this.request('/analytics/mitre-matrix');
  }

  // Feature 16: Digital Twin Simulator
  public async runDigitalTwin(input: any): Promise<any> {
    return this.request('/analytics/digital-twin', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  // Feature 17: Offline AI Assistant
  public async askOfflineAssistant(query: string): Promise<any> {
    return this.request('/analytics/assistant', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  }

  // Feature 20: Data Validation Report
  public async getDataValidationReport(): Promise<any> {
    return this.request('/analytics/data-validation');
  }

  // Feature 25: Process Mining Model
  public async getProcessMining(): Promise<any> {
    return this.request('/analytics/process-mining');
  }

  // Feature 22: Supervisory Alerts & Statutory Policy Gate Engine
  public async getSupervisoryAlerts(): Promise<{ alerts: DynamicSupervisoryAlert[]; rules: DynamicPolicyRule[] }> {
    return this.request('/analytics/supervisory-alerts');
  }

  public async acknowledgeSupervisoryAlert(id: string): Promise<any> {
    return this.request(`/analytics/supervisory-alerts/${id}/acknowledge`, {
      method: 'POST'
    });
  }

  public async togglePolicyRule(id: string, enabled?: boolean): Promise<any> {
    return this.request(`/analytics/policy-rules/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
  }

  // 25 Enterprise Engines Manifest & Dynamic Controller
  public async getEnterpriseEngines(): Promise<{ total: number; engines: EnterpriseEngineDefinition[] }> {
    return this.request('/analytics/engines');
  }

  public async runEngine(id: string): Promise<any> {
    return this.request(`/analytics/engines/${id}/run`, {
      method: 'POST'
    });
  }
}

export const api = new ApiService();

