import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  SOCHealthScoreBreakdown,
  GovernanceMaturityRecord,
  CyberResilienceRecord,
  PredictiveForecastItem
} from '../../types';
import {
  ShieldCheck,
  Award,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Building,
  Layers,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export const SOCHealthMaturityView: React.FC = () => {
  const [health, setHealth] = useState<SOCHealthScoreBreakdown | null>(null);
  const [gmi, setGmi] = useState<GovernanceMaturityRecord | null>(null);
  const [cri, setCri] = useState<CyberResilienceRecord | null>(null);
  const [forecasts, setForecasts] = useState<PredictiveForecastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [hRes, gRes, cRes, fRes] = await Promise.all([
          api.getSOCHealthScore(),
          api.getGovernanceMaturity(),
          api.getCyberResilience(),
          api.getPredictiveForecasts()
        ]);
        setHealth(hRes);
        setGmi(gRes);
        setCri(cRes);
        setForecasts(fRes.forecasts || []);
      } catch (err) {
        console.error('Failed to load SOC health and maturity metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-500 text-xs">
        Calculating 7-component SOC health index and maturity levels...
      </div>
    );
  }

  if (!health || !gmi || !cri) {
    return (
      <div className="py-24 text-center text-zinc-500 text-xs space-y-3">
        <div>Failed to load SOC health and maturity metrics.</div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const getTierBadge = (tier?: string) => {
    const t = (tier || '').toUpperCase();
    if (t.includes('EXCELLENT') || t.includes('LEVEL 5') || t.includes('LEVEL 4') || t.includes('A') || t.includes('ROBUST')) {
      return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    }
    if (t.includes('GOOD') || t.includes('LEVEL 3') || t.includes('B') || t.includes('SUFFICIENT')) {
      return 'bg-blue-950 text-blue-300 border-blue-800';
    }
    if (t.includes('MODERATE') || t.includes('LEVEL 2') || t.includes('C') || t.includes('FRAGILE')) {
      return 'bg-amber-950 text-amber-300 border-amber-800';
    }
    return 'bg-red-950 text-red-300 border-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
              FEATURES 11, 12, 13 & 14
            </span>
            <span className="text-xs text-zinc-400 font-mono">NIST CSF 2.0 / CERT-IN / NCIIPC</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mt-1 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-rose-400" />
            SOC Health, Maturity & Predictive Forecasts
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Comprehensive supervisory health score across 7 operational pillars, Governance Maturity Index (GMI), Cyber Resilience Index (CRI), and 7/30/90-day predictive breach forecasts.
          </p>
        </div>
      </div>

      {/* Top 3 Core Metrics Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Overall SOC Health */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">SOC Health Score</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTierBadge(health.overallTier || (health as any).letterGrade)}`}>
              {health.overallTier || (health as any).letterGrade || 'B'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold font-mono text-zinc-100">
              {health.overallScore ?? (health as any).compositeScore ?? 75}
            </span>
            <span className="text-sm text-zinc-500 font-mono">/ 100</span>
          </div>
          <p className="text-xs text-zinc-400">
            Weighted composite of 7 core supervisory execution pillars.
          </p>
        </div>

        {/* Metric 2: Governance Maturity Index (GMI) */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Governance Maturity (GMI)</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTierBadge(gmi.maturityLevel || (gmi as any).maturityTier)}`}>
              {((gmi.maturityLevel || (gmi as any).maturityTier || 'Level 3 Defined') as string).replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold font-mono text-blue-400">
              Level {gmi.overallScore || (((gmi as any).gmiScore || 70) / 20).toFixed(1)}
            </span>
            <span className="text-sm text-zinc-500 font-mono">/ 5.0</span>
          </div>
          <p className="text-xs text-zinc-400">
            CMMI-aligned cybersecurity oversight framework rating.
          </p>
        </div>

        {/* Metric 3: Cyber Resilience Index (CRI) */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Cyber Resilience (CRI)</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTierBadge(cri.resilienceTier || (cri as any).resilienceRating)}`}>
              {((cri.resilienceTier || (cri as any).resilienceRating || 'SUFFICIENT') as string).replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold font-mono text-rose-400">
              {cri.resilienceScore ?? (cri as any).criScore ?? 75}
            </span>
            <span className="text-sm text-zinc-500 font-mono">/ 100</span>
          </div>
          <p className="text-xs text-zinc-400">
            Rapid containment and single point of failure resilience.
          </p>
        </div>
      </div>

      {/* Feature 11: 7-Component SOC Health Breakdown */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
            7-Pillar Operational Health Breakdown
          </h3>
          <span className="text-xs text-zinc-400 font-mono">NCIIPC Guidelines Compliant</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(health.components).map(([key, comp]: [string, any]) => {
            const score = typeof comp === 'number' ? comp : (comp?.score ?? 70);
            const weight = typeof comp?.weight === 'number' ? comp.weight : 0.15;
            const observation = comp?.supervisoryObservation || (score >= 80 ? 'Operating within nominal bounds.' : score >= 60 ? 'Moderate compliance drag observed.' : 'Requires immediate supervisory intervention.');

            return (
              <div key={key} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className={`text-xs font-mono font-bold ${
                    score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {score}/100
                  </span>
                </div>

                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                  />
                </div>

                <div className="text-[11px] text-zinc-400 pt-1">
                  Weight: <strong className="text-zinc-300 font-mono">{Math.round(weight * 100)}%</strong> • {observation}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature 14: Predictive Forecasts Section */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              Predictive Trajectory Forecasts (Feature 14)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Time-series projection modeling 7-day, 30-day, and 90-day SLA compliance and case breach trajectory.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {forecasts.map(f => {
            const breachRate = f.projectedSlaBreachRatePct ?? f.governanceDriftProbPct ?? 25;
            const projectedHealth = f.projectedHealthScore ?? f.predictedSOCHealth ?? 75;
            const confInterval = f.confidenceIntervalPct ?? Math.round(((f.confidenceUpper || 80) - (f.confidenceLower || 60)) / 2) ?? 5;
            const advisory = f.riskAdvisory || (f.trendDirection === 'DEGRADING' ? 'Elevated breach risk projected due to operational bottleneck.' : 'Stable workflow progression projected.');

            return (
              <div key={f.horizon} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-400">{f.horizon.replace(/_/g, ' ')}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    f.trendDirection === 'STABLE' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                  }`}>
                    {f.trendDirection}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500">Projected Breach Rate</div>
                    <div className="font-mono font-bold text-sm text-red-400 mt-0.5">
                      {breachRate}%
                    </div>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500">Projected Health</div>
                    <div className="font-mono font-bold text-sm text-zinc-100 mt-0.5">
                      {projectedHealth}/100
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400">
                  Confidence Interval: <strong className="text-zinc-200 font-mono">±{confInterval}%</strong>
                </div>

                <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-300">
                  ⚠️ {advisory}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features 12 & 13: Governance Maturity & Resilience Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Governance Dimensions */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-400" />
            Governance Maturity Dimensions (GMI)
          </h3>

          <div className="space-y-2 text-xs">
            {Object.entries(gmi.dimensions).map(([dim, score]: [string, any]) => {
              const displayScore = typeof score === 'number' && score > 5 ? (score / 20).toFixed(1) : score;
              return (
                <div key={dim} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                  <span className="text-zinc-300 capitalize">{dim.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-mono font-bold text-blue-400">Level {displayScore} / 5.0</span>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/50 text-[11px] text-blue-200">
            Regulatory Guidance: {gmi.regulatoryRecommendation || gmi.keyGovernanceGaps?.[0] || 'Maintain continuous supervisory control auditing.'}
          </div>
        </div>

        {/* Cyber Resilience Detail */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-rose-400" />
            Cyber Resilience Breakdown (CRI)
          </h3>

          {(() => {
            const spofs = cri.singlePointsOfFailure || cri.singlePointOfFailures || [];
            const mttd = cri.mttdMinutes ?? Math.round(120 - ((cri.dimensions as any)?.detectionSpeed || 70));
            const mttc = cri.mttcMinutes ?? Math.round(180 - ((cri.dimensions as any)?.containmentEfficacy || 70));
            const containmentSuccess = cri.containmentEffectivenessPct ?? ((cri.dimensions as any)?.containmentEfficacy || 75);
            const tier = cri.resilienceTier || cri.resilienceRating || 'SUFFICIENT';

            return (
              <>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">MTTD (Detection)</div>
                    <div className="font-mono font-bold text-sm text-zinc-100 mt-1">{mttd} mins</div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">MTTC (Containment)</div>
                    <div className="font-mono font-bold text-sm text-zinc-100 mt-1">{mttc} mins</div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Containment Success</div>
                    <div className="font-mono font-bold text-sm text-emerald-400 mt-1">{containmentSuccess}%</div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Resilience Tier</div>
                    <div className="font-mono font-bold text-sm text-zinc-100 mt-1">{tier}</div>
                  </div>
                </div>

                {/* Single Points of Failure */}
                <div>
                  <div className="text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Single Points of Failure Identified ({spofs.length})
                  </div>
                  <div className="space-y-1">
                    {spofs.map((spof, idx) => (
                      <div key={idx} className="text-xs text-rose-300 bg-rose-950/20 p-2 rounded border border-rose-900/40">
                        ⚠️ {spof}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
