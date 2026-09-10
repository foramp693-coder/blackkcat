import React, { useState, useEffect } from 'react';
import { AssessmentTimeline } from '../../types';
import { api } from '../../services/api';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  ArrowRight,
  Shield,
  Download
} from 'lucide-react';

export const TimelineView: React.FC = () => {
  const [timeline, setTimeline] = useState<AssessmentTimeline | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getTimeline();
        setTimeline(data);
      } catch (err) {
        console.error('Failed to load assessment timeline:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExportJSON = () => {
    if (!timeline) return;
    const blob = new Blob([JSON.stringify(timeline, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAT-SA-Assessment-Timeline-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-950 border border-blue-700 text-blue-300">
                Longitudinal Assessment Comparison
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-800 text-zinc-300">
                Multi-Period Operational Drift
              </span>
            </div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-blue-400" />
              Assessment Timeline & Drift Tracking
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
              Supervisors must not evaluate SOC operations in isolation. This longitudinal view tracks systemic drift across
              successive assessment cycles (Assessment 1, Assessment 2, Assessment 3), highlighting worsening gaps and validated improvements.
            </p>
          </div>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-2 shadow-sm transition-all self-start"
          >
            <Download className="w-3.5 h-3.5" />
            Export Timeline Data
          </button>
        </div>
      </div>

      {timeline && (
        <>
          {/* Assessment Periods Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {timeline.periods.map((period, idx) => {
              const isCurrent = idx === timeline.periods.length - 1;
              return (
                <div
                  key={period.periodId}
                  className={`rounded-xl border p-5 transition-all ${
                    isCurrent
                      ? 'border-blue-500/80 bg-zinc-950 shadow-md ring-1 ring-blue-500/20'
                      : 'border-zinc-800 bg-zinc-950/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isCurrent
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}>
                      {isCurrent ? 'Current Inspection Cycle' : `Historical Cycle ${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">{period.dateRange}</span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-100 mb-4">{period.label}</h3>

                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-zinc-900/60 border border-zinc-850">
                      <span className="text-zinc-400 font-sans text-[11px]">Total Cases Analyzed:</span>
                      <span className="font-bold text-zinc-200">{period.totalCases.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-zinc-900/60 border border-zinc-850">
                      <span className="text-zinc-400 font-sans text-[11px]">Escalation Evidence Gaps:</span>
                      <span className="font-bold text-red-400">{period.escalationGapsCount} cases</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-zinc-900/60 border border-zinc-850">
                      <span className="text-zinc-400 font-sans text-[11px]">Investigation Delays:</span>
                      <span className="font-bold text-amber-400">{period.investigationDelayCount} cases</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-zinc-900/60 border border-zinc-850">
                      <span className="text-zinc-400 font-sans text-[11px]">SLA Breach Rate:</span>
                      <span className="font-bold text-zinc-300">{period.slaBreachRate}%</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-zinc-900/60 border border-zinc-850">
                      <span className="text-zinc-400 font-sans text-[11px]">Avg Lifecycle Duration:</span>
                      <span className="font-bold text-zinc-300">{period.avgDurationMins} mins</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Longitudinal Drift & Trend Analysis */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-zinc-200">
                  Longitudinal Operational Drift Trends (Supervisory Analysis)
                </h2>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                Assessed across 3 sequential audit periods
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {timeline.trends.map((trend, idx) => {
                const isWorsening = trend.direction === 'WORSENING';
                const isImproving = trend.direction === 'IMPROVING';

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border transition-all ${
                      isWorsening
                        ? 'border-red-900/40 bg-red-950/10'
                        : isImproving
                        ? 'border-emerald-900/40 bg-emerald-950/10'
                        : 'border-zinc-800 bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-200">{trend.metric}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isWorsening
                          ? 'bg-red-950 text-red-300 border-red-800'
                          : isImproving
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}>
                        {isWorsening && <TrendingUp className="w-3 h-3 text-red-400" />}
                        {isImproving && <TrendingDown className="w-3 h-3 text-emerald-400" />}
                        {!isWorsening && !isImproving && <Minus className="w-3 h-3 text-zinc-400" />}
                        {trend.direction}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {trend.detail}
                    </p>

                    <div className="mt-3 pt-2 border-t border-zinc-850/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>Previous: {trend.previousValue}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="font-bold text-zinc-300">Current: {trend.currentValue}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* New Recurring vs Resolved Findings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Recurring Findings */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                New Recurring Finding Patterns (Requiring Examiner Follow-Up)
              </div>
              <div className="space-y-2">
                {timeline.newRecurringFindings.map((rec, i) => (
                  <div key={i} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
                    <span className="text-amber-400 font-bold mt-0.5">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolved Signals */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Remediated Historical Weaknesses (Verified from Dataset)
              </div>
              <div className="space-y-2">
                {timeline.resolvedSignals.map((res, i) => (
                  <div key={i} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{res}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Causal Disclaimer */}
          <div className="rounded-lg border border-zinc-850 bg-zinc-900/40 p-4 text-zinc-400 flex items-start gap-3 text-xs">
            <Shield className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-zinc-300">Methodological Guardrail:</span> SAT-SA establishes empirical, mathematical trends across submitted operational data. It identifies statistical correlation and operational drift over time. Causality and culpability must be validated by the human examiner through on-site audit or supervisory inquiry.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
