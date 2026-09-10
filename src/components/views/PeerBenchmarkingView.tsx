import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CSEPeerProfile } from '../../types';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Building,
  Shield,
  Layers,
  Award,
  AlertCircle,
  Filter,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface Props {
  onSelectEntity?: (entityId: string) => void;
}

export const PeerBenchmarkingView: React.FC<Props> = ({ onSelectEntity }) => {
  const [benchmarks, setBenchmarks] = useState<CSEPeerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getPeerBenchmarks();
        setBenchmarks(res.benchmarks || []);
        if (res.benchmarks && res.benchmarks.length > 0) {
          setSelectedEntityId(res.benchmarks[0].entityId);
        }
      } catch (err) {
        console.error('Failed to load peer benchmarks:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sectors = Array.from(new Set(benchmarks.map(b => b.sector).filter(Boolean)));
  const filtered = benchmarks.filter(b => selectedSector === 'ALL' || b.sector === selectedSector);
  const activeProfile = benchmarks.find(b => b.entityId === selectedEntityId) || benchmarks[0];
  const indAvg = activeProfile?.industryAverages || {
    slaCompliancePct: 85,
    escalationRatePct: 15,
    investigationQualityScore: 80,
    mttaMinutes: 12,
    mttrMinutes: 45
  };

  const radarData = activeProfile ? [
    { subject: 'SLA Compliance', entity: activeProfile.slaCompliancePct || 0, sector: indAvg.slaCompliancePct, fullMark: 100 },
    { subject: 'Escalation Integrity', entity: Math.min(100, (activeProfile.escalationRatePct || 0) * 3), sector: Math.min(100, indAvg.escalationRatePct * 3), fullMark: 100 },
    { subject: 'Inv Quality', entity: activeProfile.investigationQualityScore || 0, sector: indAvg.investigationQualityScore, fullMark: 100 },
    { subject: 'MTTA Velocity', entity: Math.max(10, 100 - (activeProfile.mttaMinutes || 0) * 3), sector: Math.max(10, 100 - indAvg.mttaMinutes * 3), fullMark: 100 },
    { subject: 'MTTR Efficiency', entity: Math.max(10, 100 - (activeProfile.mttrMinutes || 0) / 3), sector: Math.max(10, 100 - indAvg.mttrMinutes / 3), fullMark: 100 }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
              FEATURE 2: PEER BENCHMARKING
            </span>
            <span className="text-xs text-zinc-400 font-mono">SECTOR QUARTILE DEVIATION ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mt-1 flex items-center gap-2.5">
            <BarChart2 className="w-7 h-7 text-blue-400" />
            CSE Peer Benchmarking & Industry Standards
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Statistical peer-group comparison against critical sector benchmarks. Pinpoints operational drift, under-escalation anomalies, and performance divergence across Critical Sector Entities (CSEs).
          </p>
        </div>

        {/* Sector Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={selectedSector}
            onChange={e => setSelectedSector(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Sectors ({benchmarks.length} CSEs)</option>
            {sectors.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-500 text-xs">Computing sector quartile distributions...</div>
      ) : (
        <>
          {/* Main Inspection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Entity Selector List */}
            <div className="space-y-2 lg:col-span-1">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                Monitored Entities ({filtered.length})
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filtered.map(b => {
                  const isSelected = b.entityId === selectedEntityId;
                  return (
                    <button
                      key={b.entityId}
                      onClick={() => setSelectedEntityId(b.entityId)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-zinc-900 border-blue-600 shadow-md ring-1 ring-blue-600/30'
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-zinc-200">{b.entityName}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          b.quartile === 'TOP_25' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          b.quartile === 'MEDIAN' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                          'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {b.quartile.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">{b.sector}</div>
                      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-zinc-800 text-[10px]">
                        <div>
                          <div className="text-zinc-500">SLA Comp.</div>
                          <div className={`font-mono font-bold ${b.slaCompliancePct < 85 ? 'text-red-400' : 'text-zinc-300'}`}>
                            {b.slaCompliancePct}%
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-500">MTTR</div>
                          <div className="font-mono font-bold text-zinc-300">{b.mttrMinutes}m</div>
                        </div>
                        <div>
                          <div className="text-zinc-500">Esc. Rate</div>
                          <div className="font-mono font-bold text-zinc-300">{b.escalationRatePct}%</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Entity Diagnostic Comparison Panel */}
            {activeProfile && (
              <div className="lg:col-span-2 space-y-6">
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6">
                  {/* Entity Profile Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div>
                      <div className="text-xs text-blue-400 font-mono font-bold">{activeProfile.sector} Sector</div>
                      <h2 className="text-xl font-bold text-zinc-100">{activeProfile.entityName}</h2>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Performance Percentile: <strong className="text-zinc-200">{activeProfile.percentileRank}th</strong> across industry cohort
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-zinc-500">Investigation Score</div>
                        <div className="text-lg font-bold text-zinc-100 font-mono">
                          {activeProfile.investigationQualityScore}/100
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Comparison: Radar & Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Radar Chart */}
                    <div className="h-64 flex flex-col items-center justify-center bg-zinc-950/60 rounded-xl border border-zinc-800/80 p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Multivariate Maturity Comparison
                      </div>
                      <ResponsiveContainer width="100%" height="85%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#27272a" />
                          <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis stroke="#3f3f46" domain={[0, 100]} tick={false} />
                          <Radar name={activeProfile.entityName} dataKey="entity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                          <Radar name="Sector Benchmark" dataKey="sector" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
                        </RadarChart>
                      </ResponsiveContainer>
                      <div className="flex items-center gap-4 text-[10px] mt-1">
                        <span className="flex items-center gap-1 text-blue-400">
                          <span className="w-2 h-2 rounded-full bg-blue-500" /> Current CSE
                        </span>
                        <span className="flex items-center gap-1 text-purple-400">
                          <span className="w-2 h-2 rounded-full bg-purple-500" /> Sector Benchmark
                        </span>
                      </div>
                    </div>

                    {/* Metric Differences List */}
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">SLA Compliance Rate</span>
                          <span className={`font-mono font-bold ${(activeProfile.slaCompliancePct || 0) >= indAvg.slaCompliancePct ? 'text-emerald-400' : 'text-red-400'}`}>
                            {activeProfile.slaCompliancePct || 0}% (Ind. Avg: {indAvg.slaCompliancePct}%)
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className={`h-full ${(activeProfile.slaCompliancePct || 0) >= 85 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${activeProfile.slaCompliancePct || 0}%` }} />
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Mean Time to Acknowledge (MTTA)</span>
                          <span className="font-mono font-bold text-zinc-200">
                            {activeProfile.mttaMinutes || 0} min (Ind. Avg: {indAvg.mttaMinutes} min)
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">
                          {(activeProfile.mttaMinutes || 0) > indAvg.mttaMinutes ? '⚠️ Slower alert triage velocity than peer median' : '✅ Swift response velocity'}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Escalation Rate</span>
                          <span className="font-mono font-bold text-zinc-200">
                            {activeProfile.escalationRatePct || 0}% (Ind. Avg: {indAvg.escalationRatePct}%)
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">
                          {(activeProfile.escalationRatePct || 0) < 10 ? '🚨 Suspected under-escalation and local suppression' : 'Normal tier-2 handoff frequency'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Supervisory Deviation Alerts */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                      Statistically Significant Peer Deviations
                    </div>
                    <div className="space-y-2">
                      {(activeProfile.deviations || []).map((dev, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-start gap-3 ${
                            dev.severity === 'CRITICAL' ? 'bg-red-950/40 border-red-800/80 text-red-200' :
                            dev.severity === 'HIGH' ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' :
                            'bg-blue-950/40 border-blue-800/80 text-blue-200'
                          }`}
                        >
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="text-xs">
                            <div className="font-bold">{dev.metric}: {dev.deviationPct > 0 ? `+${dev.deviationPct}%` : `${dev.deviationPct}%`} vs Peer Benchmark</div>
                            <div className="text-[11px] opacity-90 mt-0.5">{dev.supervisoryImplication}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 6-Month Historical Trajectory */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                      6-Month Historical Compliance Drift
                    </div>
                    <div className="h-44 bg-zinc-950/60 rounded-xl border border-zinc-800/80 p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activeProfile.historicalTrend || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="month" stroke="#71717a" fontSize={10} />
                          <YAxis domain={[50, 100]} stroke="#71717a" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', fontSize: '11px' }} />
                          <Line type="monotone" dataKey="slaCompliancePct" stroke="#3b82f6" name="SLA Compliance %" strokeWidth={2} />
                          <Line type="monotone" dataKey="qualityScore" stroke="#10b981" name="Quality Score" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
