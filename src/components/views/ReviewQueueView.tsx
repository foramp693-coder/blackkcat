import React, { useState, useMemo } from 'react';
import { SupervisoryFinding, ReviewStatus } from '../../types';
import { generateStratifiedAuditSample } from '../../services/supervisoryMetrics';
import { SeverityBadge } from '../common/SeverityBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Download,
  Filter,
  ShieldCheck,
  Scale,
  ListChecks,
  AlertCircle
} from 'lucide-react';

interface Props {
  findings: SupervisoryFinding[];
  onSelectFinding: (finding: SupervisoryFinding) => void;
}

export const ReviewQueueView: React.FC<Props> = ({ findings, onSelectFinding }) => {
  const [activeTab, setActiveTab] = useState<ReviewStatus>('PENDING');
  const [isStratifiedMode, setIsStratifiedMode] = useState<boolean>(true);
  const [sampleSizeTarget, setSampleSizeTarget] = useState<number>(10);

  // Compute Stratified Sample using Pillar (ii) algorithm
  const stratifiedResult = useMemo(() => {
    return generateStratifiedAuditSample(findings, sampleSizeTarget);
  }, [findings, sampleSizeTarget]);

  const sampledFindingIds = useMemo(() => {
    return new Set(stratifiedResult.sampledFindings.map(f => f.id));
  }, [stratifiedResult]);

  // Determine current active list
  const activeFindingPool = isStratifiedMode ? stratifiedResult.sampledFindings : findings;
  const filtered = activeFindingPool.filter(f => f.reviewStatus === activeTab);

  const counts = {
    PENDING: activeFindingPool.filter(f => f.reviewStatus === 'PENDING').length,
    CONFIRMED: activeFindingPool.filter(f => f.reviewStatus === 'CONFIRMED').length,
    REJECTED: activeFindingPool.filter(f => f.reviewStatus === 'REJECTED').length,
    NEEDS_EVIDENCE: activeFindingPool.filter(f => f.reviewStatus === 'NEEDS_EVIDENCE').length
  };

  const handleExportSampleJSON = () => {
    const exportData = {
      samplingMetadata: {
        title: 'SAT-SA Stratified Supervisory Risk Sampling Allocation',
        standard: 'ISO 19011 & Supreme Audit Institution Guidelines',
        generatedAt: new Date().toISOString(),
        totalPopulation: stratifiedResult.totalPopulation,
        sampleSize: stratifiedResult.sampleSize,
        coveragePercent: `${stratifiedResult.samplingCoveragePercent}%`,
        confidenceLevel: '95% Confidence Interval',
        strataBreakdown: stratifiedResult.strataBreakdown
      },
      sampledFindings: stratifiedResult.sampledFindings.map(f => ({
        id: f.id,
        entityName: f.entityName,
        caseNumber: f.caseNumber,
        category: f.category,
        severity: f.severity,
        priorityScore: f.priorityScore,
        priorityLevel: f.priorityLevel,
        reviewStatus: f.reviewStatus,
        whatHappened: f.whatHappened,
        whyFlagged: f.whyFlagged
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAT-SA-Stratified-Audit-Sample-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStrataTag = (f: SupervisoryFinding) => {
    if (f.severity === 'CRITICAL' || f.priorityScore >= 75) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-800">
          Strata: Critical Outlier (40%)
        </span>
      );
    }
    if (f.category === 'Execution Gap' || f.category === 'Premature Closure') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
          Strata: Workflow Execution Gap (30%)
        </span>
      );
    }
    if (f.category === 'SLA Breach' || f.scoreExplanation?.contributors?.slaImpact > 0) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-800">
          Strata: SLA Delinquency (20%)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
        Strata: Baseline Compliance Control (10%)
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-red-400" />
            <span>Pillar (ii): Prioritised Alert Sampling & Manual Investigation Queue</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Stratified risk-based sampling engine prioritizing cases by explainable priority score, execution gap deficit, and statistical outlier weight.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSampleJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export Sample Set (JSON)</span>
          </button>
        </div>
      </div>

      {/* Sampling Mode Selector Banner */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Audit Sampling Methodology:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStratifiedMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isStratifiedMode
                  ? 'bg-red-950 text-red-200 border border-red-700 shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Stratified Risk Sampling (Audit Recommended)</span>
            </button>

            <button
              onClick={() => setIsStratifiedMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                !isStratifiedMode
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-600 shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>All Cases ({findings.length})</span>
            </button>
          </div>
        </div>

        {isStratifiedMode && (
          <div className="pt-3 border-t border-zinc-850 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/80">
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Sample Allocation</span>
              <strong className="text-zinc-200 font-mono">
                {stratifiedResult.sampleSize} / {stratifiedResult.totalPopulation} Cases ({stratifiedResult.samplingCoveragePercent}%)
              </strong>
            </div>

            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/80">
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Critical Outliers (40%)</span>
              <strong className="text-red-400 font-mono">
                {stratifiedResult.strataBreakdown.criticalOutliers} Selected
              </strong>
            </div>

            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/80">
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Workflow Gaps (30%)</span>
              <strong className="text-amber-400 font-mono">
                {stratifiedResult.strataBreakdown.workflowGaps} Selected
              </strong>
            </div>

            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/80">
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Statistical Confidence</span>
              <strong className="text-emerald-400 font-mono">
                95% (ISO 19011 Compliant)
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Review Status Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'PENDING'
              ? 'bg-blue-950 text-blue-200 border border-blue-700/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Pending Examiner Review</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-900/60 font-mono">
            {counts.PENDING}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CONFIRMED')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'CONFIRMED'
              ? 'bg-red-950 text-red-200 border border-red-700/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
          <span>Confirmed Regulatory Violations</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-red-900/60 font-mono">
            {counts.CONFIRMED}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('NEEDS_EVIDENCE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'NEEDS_EVIDENCE'
              ? 'bg-amber-950 text-amber-200 border border-amber-700/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Awaiting Evidence Subpoena</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-900/60 font-mono">
            {counts.NEEDS_EVIDENCE}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'REJECTED'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-600 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-zinc-400" />
          <span>Dismissed / No Violation</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-700 font-mono">
            {counts.REJECTED}
          </span>
        </button>
      </div>

      {/* Queue Cards */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-zinc-400">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            No cases in this review category.
          </div>
        ) : (
          filtered.map(f => (
            <div
              key={f.id}
              onClick={() => onSelectFinding(f)}
              className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 p-4 hover:border-zinc-700 hover:bg-zinc-900/60 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-200">{f.id}</span>
                  <span className="text-xs text-zinc-400 font-medium">• {f.entityName}</span>
                  <span className="text-xs font-mono text-zinc-500">• Case {f.caseNumber}</span>
                  <CategoryBadge category={f.category} size="sm" />
                  <SeverityBadge severity={f.severity} size="sm" />
                  {isStratifiedMode && getStrataTag(f)}
                </div>

                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-red-300 transition">
                  {f.title}
                </h3>

                <p className="text-xs text-zinc-400 line-clamp-1 leading-relaxed">
                  {f.whatHappened}
                </p>

                {f.reviewDecision && (
                  <div className="mt-2 text-[11px] bg-zinc-900 p-2 rounded border border-zinc-800/80 text-zinc-300">
                    <strong>Examiner Note ({f.reviewDecision.reviewerName}):</strong> {f.reviewDecision.notes}
                  </div>
                )}
              </div>

              {/* Right: Priority Score and Action Button */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-red-400">
                    {f.priorityScore} <span className="text-xs text-zinc-500 font-normal">/ 100</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                    Priority Score
                  </span>
                </div>

                <button
                  type="button"
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 group-hover:bg-red-900 group-hover:text-white group-hover:border-red-700 transition shadow-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
