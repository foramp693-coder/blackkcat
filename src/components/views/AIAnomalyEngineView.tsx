import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { EnsembleAnomalyFinding } from '../../types';
import {
  BrainCircuit,
  ShieldAlert,
  Cpu,
  Activity,
  GitBranch,
  Layers,
  Filter,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Search,
  ChevronDown
} from 'lucide-react';

interface Props {
  onSelectCase?: (caseId: string) => void;
  onSelectFinding?: (finding: any) => void;
}

export const AIAnomalyEngineView: React.FC<Props> = ({ onSelectCase, onSelectFinding }) => {
  const [findings, setFindings] = useState<EnsembleAnomalyFinding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getAIAnomalies();
        setFindings(res.findings || []);
        if (res.findings && res.findings.length > 0) {
          setExpandedId(res.findings[0].id);
        }
      } catch (err) {
        console.error('Failed to load AI anomalies:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = findings.filter(f => {
    const matchesType = selectedType === 'ALL' || f.anomalyType === selectedType;
    const matchesSearch =
      searchQuery === '' ||
      (f.caseNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.entityName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.analyst || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.evidenceSummary || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const avgRisk = findings.length > 0 ? Math.round(findings.reduce((a, b) => a + b.riskScore, 0) / findings.length) : 0;
  const highConfCount = findings.filter(f => f.confidenceScore >= 85).length;
  const closureAnomalies = findings.filter(f => f.anomalyType === 'ABNORMAL_ALERT_CLOSURE').length;
  const escalationAnomalies = findings.filter(f => f.anomalyType === 'ESCALATION_ANOMALY').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
              FEATURE 1: MULTI-MODEL ML
            </span>
            <span className="text-xs text-zinc-400 font-mono">ISO 19011 / NCIIPC SEC 4.3</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mt-1 flex items-center gap-2.5">
            <BrainCircuit className="w-7 h-7 text-purple-400" />
            AI Anomaly Detection Engine
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Ensemble unsupervised machine learning combining Isolation Forest, Local Outlier Factor (LOF), DBSCAN clustering, and Autoencoder reconstruction error to detect multivariate behavioral deviations and SLA shortcuts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="font-mono font-bold text-emerald-400">100% Offline</span> ML Inference
          </div>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Ensemble Outliers</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100 mt-2">{findings.length}</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Multi-model consensus</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Mean Outlier Risk</span>
            <Activity className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">{avgRisk}/100</div>
          <div className="text-[11px] text-zinc-400 mt-1">Severity-weighted risk index</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Abnormal Fast Closures</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{closureAnomalies}</div>
          <div className="text-[11px] text-zinc-400 mt-1">&lt;8 mins without evidence</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Escalation Omissions</span>
            <GitBranch className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-2">{escalationAnomalies}</div>
          <div className="text-[11px] text-zinc-400 mt-1">Tier-2 protocol bypassed</div>
        </div>
      </div>

      {/* Model Specifications Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-zinc-200">Isolation Forest</div>
            <div className="text-[11px] text-zinc-400">Random hyperplane depth partitioning h(x)</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-zinc-200">Local Outlier Factor (LOF)</div>
            <div className="text-[11px] text-zinc-400">k-distance density ratio vs local cohort</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-zinc-200">DBSCAN Clustering</div>
            <div className="text-[11px] text-zinc-400">Epsilon-neighborhood noise point detection</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-zinc-200">Autoencoder Residuals</div>
            <div className="text-[11px] text-zinc-400">Bottleneck neural reconstruction error</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Anomaly Types ({findings.length})</option>
            <option value="ABNORMAL_ALERT_CLOSURE">Abnormal Alert Closure</option>
            <option value="ESCALATION_ANOMALY">Escalation Anomaly</option>
            <option value="SUSPICIOUS_INVESTIGATION_DURATION">Suspicious Duration</option>
            <option value="ANALYST_BEHAVIOUR_OUTLIER">Analyst Behaviour Outlier</option>
            <option value="OPERATIONAL_DISTRIBUTION_SKEW">Operational Skew</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2" />
          <input
            type="text"
            placeholder="Search case, entity, analyst..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-purple-500 placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Findings List */}
      {loading ? (
        <div className="py-16 text-center text-zinc-500 text-xs">Computing multi-model ML inference vectors...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 text-xs bg-zinc-900/30 rounded-xl border border-zinc-800">
          No anomaly findings match the selected criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => {
            const isExpanded = expandedId === f.id;
            return (
              <div
                key={f.id}
                className={`rounded-xl border transition-all ${
                  isExpanded
                    ? 'bg-zinc-900/90 border-purple-800/80 shadow-lg'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : f.id)}
                  className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-start md:items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      f.riskScore >= 80 ? 'bg-red-950 text-red-400 border border-red-800' :
                      f.riskScore >= 60 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-purple-950 text-purple-400 border border-purple-800'
                    }`}>
                      {f.riskScore}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-zinc-100">{f.caseNumber}</span>
                        <span className="text-xs text-zinc-400">• {f.entityName}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {f.anomalyType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {f.confidenceScore}% Confidence
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1">{f.evidenceSummary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    <div className="text-right text-[11px]">
                      <div className="text-zinc-400">Analyst</div>
                      <div className="font-medium text-zinc-200">{f.analyst}</div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Algorithmic Diagnostics */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-zinc-800/80 space-y-4">
                    {/* Algorithm Consensus Breakdown */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Individual Algorithm Evidence Vectors
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                          <div className="text-[10px] text-zinc-500 uppercase">Isolation Forest</div>
                          <div className="font-mono font-bold text-xs text-purple-400 mt-0.5">
                            Score: {((f.algorithms?.isolationForest?.score || 0) * 100).toFixed(0)}%
                          </div>
                          <div className="text-[10px] text-zinc-400">Path: {f.algorithms?.isolationForest?.pathLength || 'N/A'}</div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                          <div className="text-[10px] text-zinc-500 uppercase">Local Outlier Factor</div>
                          <div className="font-mono font-bold text-xs text-blue-400 mt-0.5">
                            Ratio: {f.algorithms?.lof?.score || 'N/A'}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {f.algorithms?.lof?.isAnomaly ? 'Density Outlier' : 'In-Cohort'}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                          <div className="text-[10px] text-zinc-500 uppercase">DBSCAN Cluster</div>
                          <div className="font-mono font-bold text-xs text-emerald-400 mt-0.5">
                            {f.algorithms?.dbscan?.isNoise ? 'Noise (Outlier)' : `Cluster ${f.algorithms?.dbscan?.clusterId || 0}`}
                          </div>
                          <div className="text-[10px] text-zinc-400">Core Dist: {f.algorithms?.dbscan?.coreDistance || 'N/A'}</div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                          <div className="text-[10px] text-zinc-500 uppercase">Autoencoder</div>
                          <div className="font-mono font-bold text-xs text-amber-400 mt-0.5">
                            Residual: {f.algorithms?.autoencoder?.reconstructionError || 'N/A'}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {f.algorithms?.autoencoder?.isAnomaly ? 'Reconstruction Fail' : 'Conformant'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Feature Attribution Matrix */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Multivariate Feature Contributions
                      </div>
                      <div className="space-y-1.5">
                        {(f.featureContributions || []).map((fc, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-zinc-950/60 border border-zinc-800/60">
                            <span className="text-zinc-300 font-medium">{fc.feature}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-zinc-400 text-[11px]">{fc.observation}</span>
                              <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 font-mono text-[10px]">
                                +{fc.weight}% weight
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Root Cause Candidate & Action */}
                    <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-purple-400">Systemic Root Cause Candidate</div>
                        <div className="text-xs text-zinc-200 mt-0.5">{f.rootCauseCandidate}</div>
                      </div>

                      {onSelectCase && (
                        <button
                          onClick={() => onSelectCase(f.caseId)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white flex items-center gap-1.5 flex-shrink-0 transition-colors"
                        >
                          <span>Open Case File</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
