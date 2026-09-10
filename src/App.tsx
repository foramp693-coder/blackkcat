import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { LoginPage } from './components/auth/LoginPage';
import { AccessDeniedPage } from './components/auth/AccessDeniedPage';
import { LeadExaminerDashboard } from './components/views/dashboards/LeadExaminerDashboard';
import { SOCSupervisorDashboard } from './components/views/dashboards/SOCSupervisorDashboard';
import { AuditorDashboard } from './components/views/dashboards/AuditorDashboard';
import { DashboardView } from './components/views/DashboardView';
import { NegativeSpaceView } from './components/views/NegativeSpaceView';
import { FindingsView } from './components/views/FindingsView';
import { ReviewQueueView } from './components/views/ReviewQueueView';
import { EntitiesView } from './components/views/EntitiesView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { ReportsView } from './components/views/ReportsView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { SmartSamplingView } from './components/views/SmartSamplingView';
import { SOCFingerprintView } from './components/views/SOCFingerprintView';
import { TimelineView } from './components/views/TimelineView';
import { ExaminerAssistantView } from './components/views/ExaminerAssistantView';
import { FindingDetailModal } from './components/views/FindingDetailModal';
import { DataIngestionModal } from './components/modals/DataIngestionModal';
// 25 Enterprise Views
import { AIAnomalyEngineView } from './components/views/AIAnomalyEngineView';
import { PeerBenchmarkingView } from './components/views/PeerBenchmarkingView';
import { NLPInvestigationQualityView } from './components/views/NLPInvestigationQualityView';
import { KnowledgeGraphView } from './components/views/KnowledgeGraphView';
import { TimelineReplayView } from './components/views/TimelineReplayView';
import { SOCHealthMaturityView } from './components/views/SOCHealthMaturityView';
import { MITREMatrixView } from './components/views/MITREMatrixView';
import { DigitalTwinSimulatorView } from './components/views/DigitalTwinSimulatorView';
import { SupervisoryAlertsView } from './components/views/SupervisoryAlertsView';
import { DataIngestionValidationView } from './components/views/DataIngestionValidationView';
import { ProcessMiningView } from './components/views/ProcessMiningView';
import { EnterpriseEnginesHubView } from './components/views/EnterpriseEnginesHubView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { api } from './services/api';
import {
  KPISummary,
  SupervisoryFinding,
  NegativeSpaceRow,
  ScenarioDefinition,
  Entity,
  WorkflowFunnel,
  OperationalTrendPoint,
  FindingCorrelation,
  ReviewStatus
} from './types';

export const AppContent: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading, logout, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scenario-2');
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [kpi, setKpi] = useState<KPISummary | null>(null);
  const [severityData, setSeverityData] = useState<{ severity: string; count: number; fill: string }[]>([]);
  const [categoryData, setCategoryData] = useState<{ category: string; count: number }[]>([]);
  const [workflowFunnel, setWorkflowFunnel] = useState<WorkflowFunnel[]>([]);
  const [trends, setTrends] = useState<OperationalTrendPoint[]>([]);
  const [entityRankings, setEntityRankings] = useState<any[]>([]);
  const [negativeSpaceMatrix, setNegativeSpaceMatrix] = useState<NegativeSpaceRow[]>([]);
  const [findings, setFindings] = useState<SupervisoryFinding[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [correlations, setCorrelations] = useState<FindingCorrelation[]>([]);

  // Modals & Drill-down selections
  const [selectedFinding, setSelectedFinding] = useState<SupervisoryFinding | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [findingCategoryFilter, setFindingCategoryFilter] = useState<string>('ALL');
  const [findingSeverityFilter, setFindingSeverityFilter] = useState<string>('ALL');
  const [findingEntityFilter, setFindingEntityFilter] = useState<string>('ALL');
  const [leadExaminerViewMode, setLeadExaminerViewMode] = useState<'overview' | 'deep_analytics'>('overview');

  const [loading, setLoading] = useState<boolean>(true);

  // Load all central state from API
  const refreshData = useCallback(async () => {
    try {
      const [
        kpiRes,
        scenRes,
        sevRes,
        catRes,
        funnelRes,
        trendRes,
        rankRes,
        matrixRes,
        findingsRes,
        entitiesRes,
        corrRes
      ] = await Promise.all([
        api.getKPISummary(),
        api.getScenarios(),
        api.getFindingsBySeverity(),
        api.getFindingsByCategory(),
        api.getWorkflowCompletion(),
        api.getTrends(),
        api.getEntityPriority(),
        api.getNegativeSpaceMatrix(),
        api.getFindings(),
        api.getEntities(),
        api.getCorrelations().catch(() => [])
      ]);

      setKpi(kpiRes);
      setScenarios(scenRes.scenarios);
      setActiveScenarioId(scenRes.activeScenarioId);
      setSeverityData(sevRes);
      setCategoryData(catRes);
      setWorkflowFunnel(funnelRes);
      setTrends(trendRes);
      setEntityRankings(rankRes);
      setNegativeSpaceMatrix(matrixRes);
      setFindings(Array.isArray(findingsRes) ? findingsRes : findingsRes.findings || []);
      setEntities(entitiesRes);
      setCorrelations(corrRes);
    } catch (err) {
      console.error('Failed to load initial dataset:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [refreshData, isAuthenticated]);

  // Scenario loading handler
  const handleSelectScenario = async (scenarioId: string) => {
    try {
      setLoading(true);
      await api.loadScenario(scenarioId);
      await refreshData();
    } catch (err) {
      console.error('Error switching scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  // Human examiner review decision handler
  const handleReviewSubmit = async (
    id: string,
    decision: ReviewStatus,
    notes: string,
    followUp?: string
  ) => {
    if (decision === 'PENDING') return;
    const res = await api.reviewFinding(id, decision as 'CONFIRMED' | 'REJECTED' | 'NEEDS_EVIDENCE', notes, followUp);
    if (res.finding) {
      setSelectedFinding(res.finding);
    }
    await refreshData();
  };

  // Interactive Graph-to-Finding navigation
  const navigateToCategory = (category: string) => {
    setFindingCategoryFilter(category);
    setFindingSeverityFilter('ALL');
    setActiveTab('findings');
  };

  const navigateToSeverity = (severity: string) => {
    setFindingSeverityFilter(severity);
    setFindingCategoryFilter('ALL');
    setActiveTab('findings');
  };

  const navigateToEntity = (entityId: string) => {
    setFindingEntityFilter(entityId);
    setActiveTab('findings');
  };

  // Negative space drilldown
  const handleSelectFindingId = async (findingId: string) => {
    try {
      const finding = await api.getFindingById(findingId);
      setSelectedFinding(finding);
    } catch (err) {
      console.error('Finding lookup error:', err);
    }
  };

  // 1. Loading screen while verifying JWT session credentials
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-300 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-slate-200 font-bold tracking-wider">VERIFYING SUPERVISORY CLEARANCE SESSION...</span>
          <span className="text-[11px] text-slate-500">SIH26157 &bull; Cryptographic Clearance Authentication</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state -> Real Login System
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => refreshData()} />;
  }

  // 3. Initial data loading after successful login
  if (loading && !kpi) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-300 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-slate-200 font-semibold tracking-wider">Booting SAT-SA Supervisory Engine (SIH26157)...</span>
          <span className="text-[11px] text-slate-500">Mounting 25 Analytics Pipelines for {user?.name}</span>
        </div>
      </div>
    );
  }

  // Helper to render role-specific dashboard for activeTab === 'dashboard'
  const renderDashboardView = () => {
    if (!kpi) return null;

    if (user?.role === 'Lead Examiner') {
      return (
        <div className="space-y-6">
          {/* View toggle between Lead Examiner Command and Deep Statistical Telemetry */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLeadExaminerViewMode('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  leadExaminerViewMode === 'overview'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lead Examiner Command View
              </button>
              <button
                onClick={() => setLeadExaminerViewMode('deep_analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  leadExaminerViewMode === 'deep_analytics'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Supervisory Analytics Matrix
              </button>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Clearance: L3 &bull; Full Statutory Authority
            </span>
          </div>

          {leadExaminerViewMode === 'overview' ? (
            <LeadExaminerDashboard
              kpi={kpi}
              findings={findings}
              entities={entities}
              onNavigate={(view) => setActiveTab(view as NavTab)}
              onOpenUpload={() => setIsUploadOpen(true)}
              onGenerateReport={() => setActiveTab('reports')}
              onSelectFinding={setSelectedFinding}
            />
          ) : (
            <DashboardView
              kpi={kpi}
              severityData={severityData}
              categoryData={categoryData}
              workflowFunnel={workflowFunnel}
              trends={trends}
              entityRankings={entityRankings}
              findings={findings}
              correlations={correlations}
              onSelectFinding={setSelectedFinding}
              onNavigateToCategory={navigateToCategory}
              onNavigateToEntity={navigateToEntity}
              onNavigateToSeverity={navigateToSeverity}
              onNavigateToTab={(tab) => setActiveTab(tab as NavTab)}
            />
          )}
        </div>
      );
    }

    if (user?.role === 'SOC Supervisor') {
      return (
        <SOCSupervisorDashboard
          kpi={kpi}
          findings={findings}
          entities={entities}
          onNavigate={(view) => setActiveTab(view as NavTab)}
          onOpenUpload={() => setIsUploadOpen(true)}
        />
      );
    }

    if (user?.role === 'Auditor') {
      return (
        <AuditorDashboard
          kpi={kpi}
          findings={findings}
          entities={entities}
          onNavigate={(view) => setActiveTab(view as NavTab)}
          onGenerateReport={() => setActiveTab('reports')}
        />
      );
    }

    // Default fallback
    return (
      <DashboardView
        kpi={kpi}
        severityData={severityData}
        categoryData={categoryData}
        workflowFunnel={workflowFunnel}
        trends={trends}
        entityRankings={entityRankings}
        findings={findings}
        correlations={correlations}
        onSelectFinding={setSelectedFinding}
        onNavigateToCategory={navigateToCategory}
        onNavigateToEntity={navigateToEntity}
        onNavigateToSeverity={navigateToSeverity}
        onNavigateToTab={(tab) => setActiveTab(tab as NavTab)}
      />
    );
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenReport={() => setActiveTab('reports')}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingReviewCount={kpi?.pendingReviewCount || 0}
          totalFindingsCount={kpi?.totalFindings || 0}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-900/30">
          <ErrorBoundary key={activeTab}>
            {/* Dashboard View (Role-based) */}
            {activeTab === 'dashboard' && renderDashboardView()}

            {/* Smart Sampling (Lead Examiner only) */}
            {activeTab === 'smart-sample' && (
              hasRole('Lead Examiner') ? (
                <SmartSamplingView
                  findings={findings}
                  onSelectFindingByCaseId={(caseId) => {
                    const f = findings.find(x => x.caseId === caseId);
                    if (f) setSelectedFinding(f);
                  }}
                />
              ) : (
                <AccessDeniedPage
                  requiredRole="Lead Examiner"
                  actionAttempted="Access to ISO 19011 Smart Sampling Engine"
                  onReturnToDashboard={() => setActiveTab('dashboard')}
                  onSwitchAccount={logout}
                />
              )
            )}

            {/* Negative Space Matrix (Lead Examiner only) */}
            {activeTab === 'negative-space' && (
              hasRole('Lead Examiner') ? (
                <NegativeSpaceView
                  matrix={negativeSpaceMatrix}
                  findings={findings}
                  onSelectFindingId={handleSelectFindingId}
                  onOpenFindingByCase={setSelectedFinding}
                />
              ) : (
                <AccessDeniedPage
                  requiredRole="Lead Examiner"
                  actionAttempted="Access to Signature of Failure Negative Space Matrix"
                  onReturnToDashboard={() => setActiveTab('dashboard')}
                  onSwitchAccount={logout}
                />
              )
            )}

            {/* Enterprise Engines Hub (Lead Examiner only) */}
            {activeTab === 'enterprise-engines' && (
              hasRole('Lead Examiner') ? (
                <EnterpriseEnginesHubView onNavigateTab={(tab) => setActiveTab(tab)} />
              ) : (
                <AccessDeniedPage
                  requiredRole="Lead Examiner"
                  actionAttempted="Direct Enterprise Analytics Engines Hub"
                  onReturnToDashboard={() => setActiveTab('dashboard')}
                  onSwitchAccount={logout}
                />
              )
            )}

            {/* Review Queue (Lead Examiner & SOC Supervisor) */}
            {activeTab === 'review-queue' && (
              hasRole('Lead Examiner', 'SOC Supervisor') ? (
                <ReviewQueueView
                  findings={findings}
                  onSelectFinding={setSelectedFinding}
                />
              ) : (
                <AccessDeniedPage
                  requiredRole="Lead Examiner or SOC Supervisor"
                  actionAttempted="Access to Human Review & Decision Queue"
                  onReturnToDashboard={() => setActiveTab('dashboard')}
                  onSwitchAccount={logout}
                />
              )
            )}

            {/* Fingerprint View (Lead Examiner & Auditor) */}
            {activeTab === 'fingerprint' && (
              <SOCFingerprintView />
            )}

            {/* Timeline View */}
            {activeTab === 'timeline' && (
              <TimelineView />
            )}

            {/* Assistant View */}
            {activeTab === 'assistant' && (
              <ExaminerAssistantView
                findings={findings}
                onSelectFinding={setSelectedFinding}
              />
            )}

            {/* Findings View */}
            {activeTab === 'findings' && (
              <FindingsView
                findings={findings}
                onSelectFinding={setSelectedFinding}
                initialCategoryFilter={findingCategoryFilter}
                initialSeverityFilter={findingSeverityFilter}
                initialEntityFilter={findingEntityFilter}
              />
            )}

            {/* Entities View */}
            {activeTab === 'entities' && (
              <EntitiesView
                entities={entities}
                allFindings={findings}
                onSelectEntity={(entityId) => {
                  navigateToEntity(entityId);
                }}
                onSelectFinding={setSelectedFinding}
              />
            )}

            {/* Analytics View */}
            {activeTab === 'analytics' && <AnalyticsView />}

            {/* Reports View */}
            {activeTab === 'reports' && <ReportsView />}

            {/* Audit Logs View */}
            {activeTab === 'audit-logs' && <AuditLogsView />}

            {/* Enterprise Engines */}
            {activeTab === 'ai-anomalies' && (
              <AIAnomalyEngineView onSelectFinding={setSelectedFinding} />
            )}

            {activeTab === 'peer-benchmarks' && (
              <PeerBenchmarkingView onSelectEntity={navigateToEntity} />
            )}

            {activeTab === 'nlp-quality' && (
              <NLPInvestigationQualityView />
            )}

            {activeTab === 'knowledge-graph' && (
              <KnowledgeGraphView onSelectFinding={setSelectedFinding} />
            )}

            {activeTab === 'timeline-replay' && (
              <TimelineReplayView />
            )}

            {activeTab === 'soc-health' && (
              <SOCHealthMaturityView />
            )}

            {activeTab === 'mitre-matrix' && (
              <MITREMatrixView />
            )}

            {activeTab === 'digital-twin' && (
              <DigitalTwinSimulatorView />
            )}

            {activeTab === 'supervisory-alerts' && (
              <SupervisoryAlertsView />
            )}

            {activeTab === 'data-validation' && (
              <DataIngestionValidationView />
            )}

            {activeTab === 'process-mining' && (
              <ProcessMiningView />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* 10-Section Evidence-First Finding Detail Modal */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          allFindings={findings}
          onClose={() => setSelectedFinding(null)}
          onReviewSubmit={handleReviewSubmit}
        />
      )}

      {/* Evidence Ingestion Modal (Restricted to Lead Examiner and SOC Supervisor) */}
      {hasRole('Lead Examiner', 'SOC Supervisor') && (
        <DataIngestionModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            refreshData();
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
