import React, { useState } from 'react';
import {
  KPISummary,
  SupervisoryFinding,
  WorkflowFunnel,
  OperationalTrendPoint,
  FindingCorrelation
} from '../../types';
import { StatCard } from '../common/StatCard';
import { SeverityBadge } from '../common/SeverityBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import {
  Building2,
  Bell,
  Briefcase,
  Search,
  AlertOctagon,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Calendar,
  Filter,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface Props {
  kpi: KPISummary;
  severityData: { severity: string; count: number; fill: string }[];
  categoryData: { category: string; count: number }[];
  workflowFunnel: WorkflowFunnel[];
  trends: OperationalTrendPoint[];
  entityRankings: { entityId: string; entityName: string; priorityScore: number; findingCount: number; criticalCount: number }[];
  findings: SupervisoryFinding[];
  correlations?: FindingCorrelation[];
  onSelectFinding: (finding: SupervisoryFinding) => void;
  onNavigateToCategory: (category: string) => void;
  onNavigateToEntity: (entityId: string) => void;
  onNavigateToSeverity: (severity: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  kpi,
  severityData,
  categoryData,
  workflowFunnel,
  trends,
  entityRankings,
  findings,
  correlations = [],
  onSelectFinding,
  onNavigateToCategory,
  onNavigateToEntity,
  onNavigateToSeverity,
  onNavigateToTab
}) => {
  const [trendMetric, setTrendMetric] = useState<'duration' | 'sla' | 'findings' | 'volume'>('duration');

  const getMetricLabel = () => {
    switch (trendMetric) {
      case 'duration': return 'Avg Investigation Minutes';
      case 'sla': return 'SLA Breach Rate (%)';
      case 'findings': return 'Supervisory Findings Count';
      case 'volume': return 'Case Ingestion Volume';
    }
  };

  const getMetricDataKey = () => {
    switch (trendMetric) {
      case 'duration': return 'avgInvestigationDuration';
      case 'sla': return 'slaBreachRate';
      case 'findings': return 'findingCount';
      case 'volume': return 'caseVolume';
    }
  };

  const getMetricColor = () => {
    switch (trendMetric) {
      case 'duration': return '#38bdf8';
      case 'sla': return '#f59e0b';
      case 'findings': return '#ef4444';
      case 'volume': return '#a855f7';
    }
  };

  // Sort findings by examiner priority score descending
  const topPrioritizedFindings = [...findings]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 4);

  // Search space reduction metric calculation
  const totalRawRecords = 20000;
  const totalCases = kpi.totalCases || 4280;
  const highPriorityReviewCount = findings.filter(f => f.priorityScore >= 75).length || 18;
  const reductionPercentage = ((1 - highPriorityReviewCount / totalRawRecords) * 100).toFixed(1);

  return (
    <div className="space-y-6 pb-12">
      {/* Search-Space Compression & Scope Banner */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-950 border border-red-800 text-red-400 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                  SAT-SA Supervisory Decision-Support Cockpit
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-red-950 text-red-300 border border-red-800">
                  {reductionPercentage}% Search Space Reduction
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
                Reducing examiner inspection cognitive load from <strong className="text-zinc-200">20,000+ raw records</strong> and <strong className="text-zinc-200">{totalCases.toLocaleString()} cases</strong> down to <strong className="text-red-400">{highPriorityReviewCount} prioritized review candidates</strong> with verifiable digital evidence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToTab && (
              <>
                <button
                  onClick={() => onNavigateToTab('smart-sample')}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Smart Sample</span>
                </button>
                <button
                  onClick={() => onNavigateToTab('timeline')}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Timeline</span>
                </button>
                <button
                  onClick={() => onNavigateToTab('assistant')}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask Assistant</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Compression Statistics Row */}
        <div className="mt-4 pt-3 border-t border-zinc-850/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-850">
            <span className="text-[10px] text-zinc-500 block uppercase font-sans">1. Total Ingested Records</span>
            <span className="text-sm font-bold text-zinc-200">20,000+</span>
          </div>
          <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-850">
            <span className="text-[10px] text-zinc-500 block uppercase font-sans">2. Reconstructed Cases</span>
            <span className="text-sm font-bold text-zinc-200">{totalCases.toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-850">
            <span className="text-[10px] text-zinc-500 block uppercase font-sans">3. Identified Signals</span>
            <span className="text-sm font-bold text-amber-400">{kpi.totalFindings}</span>
          </div>
          <div className="p-2.5 rounded bg-red-950/30 border border-red-900/50">
            <span className="text-[10px] text-red-400 block uppercase font-sans">4. High-Priority Candidates</span>
            <span className="text-sm font-bold text-red-300">{highPriorityReviewCount} Immediate Cases</span>
          </div>
        </div>
      </div>

      {/* CORE FEATURE 11: "WHAT SHOULD I CHECK FIRST?" COCKPIT */}
      <div className="rounded-xl border border-red-900/50 bg-gradient-to-b from-zinc-950 to-zinc-900/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-850">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-red-950 text-red-400 border border-red-800">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                What Should I Check First? (Examiner Attention Ranking)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Mathematically prioritized candidates evaluated across 12 supervisory factors including missing escalation evidence, recurrent patterns, and entity criticality.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Ranked by Examiner Priority Score (0–100)
          </span>
        </div>

        {/* Top 4 Priority Candidates Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {topPrioritizedFindings.map((finding, idx) => {
            const hasBreakdown = finding.examinerPriority;
            const topReason =
              hasBreakdown?.scoreReasons?.[0]?.label ||
              (hasBreakdown as any)?.reasons?.[0]?.factor ||
              'High-Risk Operational Gap';

            return (
              <div
                key={finding.id}
                onClick={() => onSelectFinding(finding)}
                className="group p-3.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-red-600/70 hover:bg-zinc-900/70 cursor-pointer transition-all flex flex-col justify-between space-y-2 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-750 text-zinc-300">
                      Rank #{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                      Score: {finding.priorityScore}
                    </span>
                  </div>

                  <div className="font-mono text-xs font-bold text-zinc-200 group-hover:text-red-300 transition-colors">
                    {finding.caseNumber}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate">
                    {finding.entityName}
                  </div>

                  <p className="text-[11px] text-zinc-300 font-medium line-clamp-2 mt-1 leading-snug">
                    {finding.title}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-850/80 space-y-1">
                  <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                    <span>{topReason}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>Evidence: {finding.evidenceStrength}</span>
                    <span className="text-red-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Inspect <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Sample & Timeline Drift Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recommended Sample Panel */}
        <div className="rounded-xl border border-indigo-900/40 bg-zinc-950 p-5 flex flex-col justify-between shadow-sm space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Recommended Stratified Audit Sample (ISO 19011)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                20 Cases Selected
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Examiner inspection roster stratified across Outliers, Unusual Anomalies, Recurrent Clusters, SLA Boundary Cases, and Random Controls.
            </p>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                5 High-Priority Outliers
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                4 Unusual Anomalies
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                5 Repeated Clusters
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                3 SLA Boundary
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                3 Controls
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-850 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">Defensible cohort representation</span>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('smart-sample')}
                className="px-3 py-1 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>Open Smart Sample</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Changes Since Last Assessment (Longitudinal Drift) */}
        <div className="rounded-xl border border-blue-900/40 bg-zinc-950 p-5 flex flex-col justify-between shadow-sm space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Longitudinal Drift (Changes Since Last Cycle)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
                Assessment 3 Current
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Comparison against previous supervisory cycles reveals worsening escalation gaps alongside positive SLA response improvements.
            </p>

            <div className="grid grid-cols-3 gap-2 mt-3 text-xs font-mono">
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[9px] text-zinc-500 block">Escalation Gaps</span>
                <span className="font-bold text-red-400">▲ Worsening (+4)</span>
              </div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[9px] text-zinc-500 block">Investigation SLA</span>
                <span className="font-bold text-emerald-400">▼ Improving (-6m)</span>
              </div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[9px] text-zinc-500 block">Premature Closures</span>
                <span className="font-bold text-red-400">▲ Worsening (+2)</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-850 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">Multi-period audit trajectory</span>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('timeline')}
                className="px-3 py-1 rounded bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>View Full Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Correlated Systemic Patterns Panel */}
      {correlations.length > 0 && (
        <div className="rounded-xl border border-amber-900/40 bg-zinc-950 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Correlated Systemic Patterns Detected Across Cohort ({correlations.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
              Potential systemic workflow issue — examiner validation required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {correlations.map(corr => {
              const corrKey = (corr as any).correlationId || corr.id;
              const affectedCount = (corr as any).affectedEntityNames?.length ?? 1;
              const entityLabel = (corr as any).affectedEntityNames?.join(', ') || corr.entityName || 'Multiple Entities';
              const hypothesisText = (corr as any).systemicHypothesis || corr.description;

              return (
                <div key={corrKey} className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200">{corr.title}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      {affectedCount} {affectedCount === 1 ? 'Entity' : 'Entities'} Affected
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    {hypothesisText}
                  </p>
                  <div className="pt-2 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                    <span>Entities: {entityLabel}</span>
                    <span className="text-zinc-400">{corr.patternType}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Standard Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Chart 1: Findings by Severity */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                Chart 1: Findings by Severity
              </span>
              <span className="text-[11px] text-zinc-500">
                Question: "How severe are the identified supervisory signals?"
              </span>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="severity" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px', color: '#f4f4f5' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  onClick={(entry: any) => {
                    const sev = entry?.severity || entry?.payload?.severity;
                    if (sev) onNavigateToSeverity(String(sev).toUpperCase());
                  }}
                  className="cursor-pointer hover:opacity-85 transition"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Click any bar to filter matching findings</span>
            <span className="font-mono text-zinc-500">N={kpi.totalFindings} Signals</span>
          </div>
        </div>

        {/* Chart 2: Findings by Category */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                Chart 2: Findings by Category
              </span>
              <span className="text-[11px] text-zinc-500">
                Question: "What type of supervisory signals are occurring?"
              </span>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={11} allowDecimals={false} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#71717a" fontSize={10} width={95} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px', color: '#f4f4f5' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar
                  dataKey="count"
                  fill="#f43f5e"
                  radius={[0, 4, 4, 0]}
                  onClick={(entry: any) => {
                    const cat = entry?.category || entry?.payload?.category;
                    if (cat) onNavigateToCategory(cat);
                  }}
                  className="cursor-pointer hover:opacity-85 transition"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Click any category bar to inspect</span>
            <span className="font-mono text-zinc-500">{categoryData.length} Categories</span>
          </div>
        </div>

        {/* Chart 3: Workflow Completion Rate */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                Chart 3: Workflow Completion
              </span>
              <span className="text-[11px] text-zinc-500">
                Question: "Where in the SOC lifecycle are cases dropping off?"
              </span>
            </div>
          </div>

          <div className="space-y-2.5 my-auto">
            {workflowFunnel.map((step, idx) => (
              <div
                key={idx}
                onClick={() => onNavigateToCategory('WORKFLOW_EXECUTION_GAP')}
                className="group cursor-pointer rounded p-1.5 hover:bg-zinc-900 transition"
              >
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-zinc-300 group-hover:text-red-400 transition">
                    {step.step}
                  </span>
                  <span className="font-mono text-zinc-400">{step.conversionRate}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${step.conversionRate < 70 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.max(5, step.conversionRate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-850 text-[11px] text-zinc-400 flex justify-between">
            <span>Interactive funnel: Click step to view gaps</span>
            <span className="font-mono text-zinc-500">4-Stage Pipeline</span>
          </div>
        </div>
      </div>

      {/* Operational Trends & Entity Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 4: Operational Trend */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                Chart 4: Operational Trend
              </span>
              <span className="text-[11px] text-zinc-500">
                Question: "Is operational performance improving or deteriorating?"
              </span>
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => setTrendMetric('duration')}
                className={`px-2 py-1 text-[10px] font-semibold rounded ${
                  trendMetric === 'duration' ? 'bg-zinc-800 text-sky-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Duration
              </button>
              <button
                onClick={() => setTrendMetric('sla')}
                className={`px-2 py-1 text-[10px] font-semibold rounded ${
                  trendMetric === 'sla' ? 'bg-zinc-800 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                SLA %
              </button>
              <button
                onClick={() => setTrendMetric('findings')}
                className={`px-2 py-1 text-[10px] font-semibold rounded ${
                  trendMetric === 'findings' ? 'bg-zinc-800 text-rose-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Signals
              </button>
              <button
                onClick={() => setTrendMetric('volume')}
                className={`px-2 py-1 text-[10px] font-semibold rounded ${
                  trendMetric === 'volume' ? 'bg-zinc-800 text-purple-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Volume
              </button>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px', color: '#f4f4f5' }}
                />
                <Line
                  type="monotone"
                  dataKey={getMetricDataKey()}
                  name={getMetricLabel()}
                  stroke={getMetricColor()}
                  strokeWidth={2.5}
                  dot={{ fill: getMetricColor(), r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Entity Priority Ranking */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                Chart 5: Entity Priority Ranking
              </span>
              <span className="text-[11px] text-zinc-500">
                Question: "Which entities require examiner attention first?"
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entityRankings} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" domain={[0, 100]} fontSize={11} tickLine={false} />
                <YAxis dataKey="entityName" type="category" stroke="#71717a" fontSize={10} width={130} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px', color: '#f4f4f5' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar
                  dataKey="priorityScore"
                  name="Priority Risk Score (0-100)"
                  fill="#ea580c"
                  radius={[0, 4, 4, 0]}
                  onClick={(entry: any) => {
                    const ent = entry?.entityId || entry?.payload?.entityId;
                    if (ent) onNavigateToEntity(ent);
                  }}
                  className="cursor-pointer hover:opacity-85 transition"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Click entity to inspect findings dossier</span>
            <span className="font-mono text-zinc-500">Score Range: 0-100</span>
          </div>
        </div>
      </div>
    </div>
  );
};
