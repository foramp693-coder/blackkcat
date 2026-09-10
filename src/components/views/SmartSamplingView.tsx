import React, { useState, useEffect } from 'react';
import { SmartSampleRecommendation, SamplingCandidate, SupervisoryFinding } from '../../types';
import { api } from '../../services/api';
import { SeverityBadge } from '../common/SeverityBadge';
import {
  Sparkles,
  Shuffle,
  Download,
  CheckCircle2,
  Filter,
  Layers,
  ArrowUpDown,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';

interface Props {
  onSelectFindingByCaseId?: (caseId: string) => void;
  findings?: SupervisoryFinding[];
}

export const SmartSamplingView: React.FC<Props> = ({ onSelectFindingByCaseId, findings = [] }) => {
  const [sampleSize, setSampleSize] = useState<number>(20);
  const [data, setData] = useState<SmartSampleRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStrata, setFilterStrata] = useState<string>('ALL');
  const [replacingCaseId, setReplacingCaseId] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<boolean>(false);

  const fetchSample = async (size: number) => {
    setLoading(true);
    try {
      const res = await api.getSmartSample(size);
      setData(res);
    } catch (err) {
      console.error('Failed to load smart sample:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSample(sampleSize);
  }, [sampleSize]);

  const handleReplace = async (caseId: string) => {
    setReplacingCaseId(caseId);
    try {
      const updated = await api.replaceSampleCandidate(caseId);
      setData(updated);
    } catch (err) {
      console.error('Failed to replace candidate:', err);
    } finally {
      setReplacingCaseId(null);
    }
  };

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAT-SA-Smart-Sample-ISO19011-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredCandidates = data?.candidates.filter(c => {
    if (filterStrata === 'ALL') return true;
    return c.samplingStrata === filterStrata;
  }) || [];

  const getStrataColor = (strata: string) => {
    switch (strata) {
      case 'HIGH_PRIORITY_OUTLIER':
        return 'bg-red-950 text-red-300 border-red-800';
      case 'UNUSUAL_ANOMALY':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'REPEATED_PATTERN':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'SLA_BOUNDARY':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'RANDOM_CONTROL':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const getStrataLabel = (strata: string) => {
    switch (strata) {
      case 'HIGH_PRIORITY_OUTLIER': return 'High-Priority Outlier';
      case 'UNUSUAL_ANOMALY': return 'Unusual Anomaly';
      case 'REPEATED_PATTERN': return 'Repeated Pattern';
      case 'SLA_BOUNDARY': return 'SLA Boundary';
      case 'RANDOM_CONTROL': return 'Random Control';
      default: return strata;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-indigo-950 border border-indigo-700 text-indigo-300">
                ISO 19011 Risk-Based Sampling
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-800 text-zinc-300">
                Deterministic Search Space Reduction
              </span>
            </div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-red-500" />
              Smart Examiner Sampling Engine
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
              Examiners cannot manually inspect thousands of SOC records. This engine mathematically selects a defensible,
              stratified sample across <strong className="text-zinc-200">High-Priority Outliers</strong>, <strong className="text-zinc-200">Unusual Behavioral Anomalies</strong>, <strong className="text-zinc-200">Repeated Gaps</strong>, <strong className="text-zinc-200">SLA Boundary Cases</strong>, and <strong className="text-zinc-200">Random Controls</strong> to eliminate confirmation bias.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportJSON}
              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export Sample Manifest
            </button>
            <button
              onClick={() => setAccepted(true)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all ${
                accepted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {accepted ? 'Sample Accepted for Audit' : 'Accept Sample'}
            </button>
          </div>
        </div>

        {/* Stratified Quota Overview */}
        {data && (
          <div className="mt-6 pt-4 border-t border-zinc-850 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.composition.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  const keyMap: Record<string, string> = {
                    'High-Priority Outliers': 'HIGH_PRIORITY_OUTLIER',
                    'Unusual Operational Cases': 'UNUSUAL_ANOMALY',
                    'Repeated Pattern Clusters': 'REPEATED_PATTERN',
                    'SLA Boundary Cases': 'SLA_BOUNDARY',
                    'Random Baseline Controls': 'RANDOM_CONTROL'
                  };
                  const mapped = keyMap[item.strata] || 'ALL';
                  setFilterStrata(filterStrata === mapped ? 'ALL' : mapped);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  filterStrata === (idx === 0 ? 'HIGH_PRIORITY_OUTLIER' : idx === 1 ? 'UNUSUAL_ANOMALY' : idx === 2 ? 'REPEATED_PATTERN' : idx === 3 ? 'SLA_BOUNDARY' : 'RANDOM_CONTROL')
                    ? 'border-indigo-500 bg-indigo-950/40 shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-zinc-300">{item.strata}</span>
                  <span className="text-xs font-bold font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-200">
                    {item.count}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 line-clamp-2 leading-tight">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control Bar: Sample Size & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-medium">Target Sample Size:</span>
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            {[10, 20, 50].map(sz => (
              <button
                key={sz}
                onClick={() => setSampleSize(sz)}
                className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
                  sampleSize === sz
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {sz} Cases
              </button>
            ))}
          </div>
          <span className="text-xs text-zinc-500 font-mono hidden md:inline">
            (From {data?.totalPopulationCases || 4280} cases / ~20,000 records)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-400">Filter Strata:</span>
          <select
            value={filterStrata}
            onChange={(e) => setFilterStrata(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500"
          >
            <option value="ALL">All Strata ({data?.candidates.length || 0})</option>
            <option value="HIGH_PRIORITY_OUTLIER">High-Priority Outliers</option>
            <option value="UNUSUAL_ANOMALY">Unusual Anomalies</option>
            <option value="REPEATED_PATTERN">Repeated Patterns</option>
            <option value="SLA_BOUNDARY">SLA Boundary Cases</option>
            <option value="RANDOM_CONTROL">Random Controls</option>
          </select>
        </div>
      </div>

      {/* Candidate List Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-200">
              Recommended Case Inspection Roster ({filteredCandidates.length} Candidates)
            </h2>
          </div>
          <span className="text-[11px] text-zinc-500">
            Click candidate to inspect evidence or replace with another case
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-zinc-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-red-500" />
            <span>Calculating stratified risk quotas...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 font-mono text-[11px] uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Case # / Entity</th>
                  <th className="py-3 px-4">Sampling Strata</th>
                  <th className="py-3 px-4">Priority Score</th>
                  <th className="py-3 px-4">Selection Rationale</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Examiner Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 font-sans">
                {filteredCandidates.map((candidate) => {
                  const isReplacing = replacingCaseId === candidate.caseId;
                  const matchingFinding = findings.find(f => f.caseId === candidate.caseId);

                  return (
                    <tr key={candidate.caseId} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-zinc-200">
                          {candidate.caseNumber}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {candidate.entityName}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getStrataColor(candidate.samplingStrata)}`}>
                          {getStrataLabel(candidate.samplingStrata)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 text-center font-mono font-bold text-xs">
                            {candidate.priorityScore}
                          </div>
                          <div className="w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                candidate.priorityScore >= 75
                                  ? 'bg-red-500'
                                  : candidate.priorityScore >= 55
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${candidate.priorityScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-md">
                        <div className="text-[11px] text-zinc-300">
                          {candidate.selectionRationale}
                        </div>
                        {candidate.flaggedGaps.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {candidate.flaggedGaps.map((gap, i) => (
                              <span key={i} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-750 text-zinc-400">
                                {gap}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                        {candidate.durationMinutes}m
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {matchingFinding && onSelectFindingByCaseId && (
                            <button
                              onClick={() => onSelectFindingByCaseId(candidate.caseId)}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors"
                            >
                              Inspect Evidence
                            </button>
                          )}
                          <button
                            onClick={() => handleReplace(candidate.caseId)}
                            disabled={isReplacing}
                            title="Substitute with another candidate from cohort"
                            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            <Shuffle className={`w-3.5 h-3.5 ${isReplacing ? 'animate-spin text-amber-400' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
