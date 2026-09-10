import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { calculateCyberResilienceScorecard } from '../../services/supervisoryMetrics';
import { SupervisoryFinding } from '../../types';
import {
  BarChart3,
  Activity,
  Sparkles,
  TrendingUp,
  Clock,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AnalyticsView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [mlAnomalies, setMLAnomalies] = useState<any[]>([]);
  const [findings, setFindings] = useState<SupervisoryFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedAlert, setSimulatedAlert] = useState<string | null>(null);
  const [trendMetric, setTrendMetric] = useState<'duration' | 'sla' | 'volume'>('duration');

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, mlData, findingsRes] = await Promise.all([
          api.getFullStatistics(),
          api.getMLAnomalies(),
          api.getFindings()
        ]);
        setStats(statsData || {});
        setMLAnomalies(Array.isArray(mlData) ? mlData : []);
        setFindings(Array.isArray(findingsRes?.findings) ? findingsRes.findings : []);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSimulateTelemetry = () => {
    setIsSimulating(true);
    setSimulatedAlert(null);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulatedAlert('Simulated Live Telemetry Stream Ingested: 24 new raw syslog events analyzed. Operational Weakness engine triggered: "Triage-to-Closure Bypass" flagged on Apex Payment Grid (Case #CASE-9921) with 86ms processing latency.');
    }, 1200);
  };

  if (loading || !stats) {
    return (
      <div className="py-16 text-center text-xs text-zinc-500 font-mono">
        Loading statistical analytics models...
      </div>
    );
  }

  const durations = stats.durations || {};
  const rawWorkloads = stats.analystWorkloads || stats.analystWorkload || [];
  const analystWorkload = (Array.isArray(rawWorkloads) ? rawWorkloads : []).map((a: any) => ({
    analystId: a.analystId || a.analyst || 'Operator',
    caseCount: Number(a.caseCount || 0),
    openCases: Number(a.openCases || 0)
  }));
  const resilienceScorecard = calculateCyberResilienceScorecard(findings || []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-red-400" />
            <span>Pillar (iii): Operational Weaknesses & Cyber Resilience Engine</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Systemic resilience diagnostics, procedural compliance indexes, execution-gap weakness vectors, and statistical outlier models.
          </p>
        </div>

        {/* Live Stream Simulator Button */}
        <button
          onClick={handleSimulateTelemetry}
          disabled={isSimulating}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-semibold hover:bg-zinc-800 transition shadow-sm disabled:opacity-50"
        >
          <Radio className={`w-4 h-4 text-emerald-400 ${isSimulating ? 'animate-ping' : ''}`} />
          <span>{isSimulating ? 'Processing Live Stream...' : 'Simulate Live Telemetry Ingestion'}</span>
        </button>
      </div>

      {/* Simulated Live Alert Banner */}
      {simulatedAlert && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs flex items-start justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="leading-relaxed">{simulatedAlert}</p>
          </div>
          <button
            onClick={() => setSimulatedAlert(null)}
            className="text-emerald-400 hover:text-emerald-100 font-bold ml-2 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Institutional Cyber Resilience Scorecard */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-red-950/80 border border-red-800 text-red-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
                Institutional Cyber Resilience & Governance Scorecard
              </h2>
              <p className="text-[11px] text-zinc-400">
                Mathematical index evaluating systemic containment reliability, forensic chain of custody, and escalation adherence.
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {resilienceScorecard.resilienceScore}%
            </div>
            <span className="text-[10px] uppercase font-mono text-zinc-500 block">
              Overall Resilience Index
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-lg bg-zinc-900/60 p-3 border border-zinc-800/80">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Escalation Compliance</div>
            <div className="text-lg font-bold font-mono text-zinc-200 mt-1">
              {resilienceScorecard.escalationComplianceRatio}%
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">High/Critical escalation adherence</div>
          </div>

          <div className="rounded-lg bg-zinc-900/60 p-3 border border-zinc-800/80">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Forensic Rigor Index</div>
            <div className="text-lg font-bold font-mono text-zinc-200 mt-1">
              {resilienceScorecard.forensicRigorIndex}%
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Cryptographic hash retention</div>
          </div>

          <div className="rounded-lg bg-zinc-900/60 p-3 border border-zinc-800/80">
            <div className="text-[10px] uppercase font-mono text-zinc-500">SLA Timeline Integrity</div>
            <div className="text-lg font-bold font-mono text-zinc-200 mt-1">
              {resilienceScorecard.slaIntegrityRate}%
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Acknowledge & containment SLAs</div>
          </div>

          <div className="rounded-lg bg-zinc-900/60 p-3 border border-zinc-800/80">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Containment Deficit</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">
              {resilienceScorecard.containmentDeficitRate}%
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Closures lacking proof</div>
          </div>
        </div>
      </div>

      {/* Systemic Operational Weakness Matrix */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Systemic Operational Weakness Matrix (Identified Vectors)
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {resilienceScorecard?.systemicWeaknesses?.length || 0} Weakness Vectors Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(resilienceScorecard?.systemicWeaknesses || []).map((w, idx) => (
            <div key={idx} className="rounded-lg border border-zinc-855 bg-zinc-900/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                  w.severity === 'CRITICAL'
                    ? 'bg-red-950 text-red-300 border-red-800'
                    : w.severity === 'HIGH'
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-blue-950 text-blue-300 border-blue-800'
                }`}>
                  {w.severity} Weakness
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {w.affectedCount} Incidents Affected
                </span>
              </div>

              <h3 className="text-xs font-bold text-zinc-200">{w.title}</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{w.description}</p>

              <div className="pt-2 border-t border-zinc-800 text-[11px] text-red-300/90 font-medium">
                <strong>Supervisory Directive:</strong> {w.remediationDirective}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lifecycle Durations Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-[10px] uppercase font-mono text-zinc-500">Median Investigation Time</div>
          <div className="text-xl font-bold text-zinc-200 mt-1 font-mono">
            {durations.medianInvestigationMinutes ?? 0} mins
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Typical analyst engagement</div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-[10px] uppercase font-mono text-zinc-500">Mean Investigation Time</div>
          <div className="text-xl font-bold text-zinc-200 mt-1 font-mono">
            {durations.meanInvestigationMinutes ?? durations.avgInvestigationMinutes ?? 0} mins
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Arithmetic operational average</div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-[10px] uppercase font-mono text-zinc-500">90th Percentile (P90)</div>
          <div className="text-xl font-bold text-amber-300 mt-1 font-mono">
            {durations.p90InvestigationMinutes ?? Math.round((durations.avgInvestigationMinutes || 60) * 1.5)} mins
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Upper boundary threshold</div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-[10px] uppercase font-mono text-zinc-500">99th Percentile (P99 Outlier)</div>
          <div className="text-xl font-bold text-red-400 mt-1 font-mono">
            {durations.p99InvestigationMinutes ?? Math.round((durations.avgInvestigationMinutes || 60) * 2.2)} mins
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Statistical stall threshold</div>
        </div>
      </div>

      {/* Multi-Period Operational Trends & Temporal Analysis */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Multi-Period Operational Trends (Historical Time Series Analysis)</span>
            </h2>
            <p className="text-[11px] text-zinc-500">
              Evaluates metric drift across historical inspection periods to detect degrading performance patterns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTrendMetric('duration')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
                trendMetric === 'duration'
                  ? 'bg-red-950 border-red-800 text-red-200 font-bold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Investigation Duration
            </button>
            <button
              onClick={() => setTrendMetric('sla')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
                trendMetric === 'sla'
                  ? 'bg-amber-950 border-amber-800 text-amber-200 font-bold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              SLA Breach Rate (%)
            </button>
            <button
              onClick={() => setTrendMetric('volume')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
                trendMetric === 'volume'
                  ? 'bg-blue-950 border-blue-800 text-blue-200 font-bold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Case Volume
            </button>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px', color: '#f4f4f5' }}
              />
              {trendMetric === 'duration' && (
                <Line
                  type="monotone"
                  dataKey="avgInvestigationDuration"
                  name="Avg Duration (mins)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ fill: '#f43f5e', r: 4 }}
                />
              )}
              {trendMetric === 'sla' && (
                <Line
                  type="monotone"
                  dataKey="slaBreachRate"
                  name="SLA Breach Rate (%)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                />
              )}
              {trendMetric === 'volume' && (
                <Line
                  type="monotone"
                  dataKey="caseVolume"
                  name="Case Volume"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ fill: '#38bdf8', r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analyst Workload Chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Analyst Caseload Distribution & Operational Variance
            </h2>
            <p className="text-[11px] text-zinc-500">
              Measures case handling volume across triage and tier-2 responders.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {analystWorkload.length} Operators Active
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analystWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="analystId" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px', color: '#f4f4f5' }}
              />
              <Bar dataKey="caseCount" name="Assigned Cases" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Machine Learning Behavioral Anomaly Models */}
      <div className="rounded-xl border border-cyan-950/80 bg-cyan-950/20 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                Machine Learning Behavioral Anomaly Signals (Isolation Forest)
              </h2>
              <p className="text-[11px] text-cyan-400/80">
                Identifies multivariate statistical deviations from normalized peer baseline. Used as a secondary corroboration signal.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            {mlAnomalies?.length || 0} Flagged Anomalies
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(mlAnomalies || []).map((m, i) => (
            <div key={i} className="rounded-lg border border-cyan-900/60 bg-zinc-950 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-cyan-300 font-bold">{m.findingId}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  Score: {Math.round((m.anomalyScore || 0) * 100)}%
                </span>
              </div>
              <div className="text-xs font-semibold text-zinc-200">{m.title}</div>
              <div className="text-[11px] text-zinc-400 font-mono">Entity: {m.entityName} • Case {m.caseNumber}</div>

              <div className="pt-2 border-t border-zinc-850 space-y-1">
                {m.featureContributions?.map((fc: any, fidx: number) => (
                  <div key={fidx} className="text-[11px] text-zinc-300 flex justify-between">
                    <span className="text-zinc-400">{fc.feature}:</span>
                    <span className="font-mono text-cyan-300 font-medium">{fc.deviation}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
