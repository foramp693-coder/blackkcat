import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MITREMatrixPayload, MITRETacticCoverage } from '../../types';
import {
  ShieldAlert,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  ArrowUpRight
} from 'lucide-react';

export const MITREMatrixView: React.FC = () => {
  const [matrix, setMatrix] = useState<MITREMatrixPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTactic, setSelectedTactic] = useState<string>('ALL');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getMITREMatrix();
        setMatrix(res);
      } catch (err) {
        console.error('Failed to load MITRE matrix:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-500 text-xs">
        Mapping enterprise alert telemetry to MITRE ATT&CK matrix...
      </div>
    );
  }

  if (!matrix) {
    return (
      <div className="py-24 text-center text-zinc-500 text-xs space-y-3">
        <div>Failed to load MITRE ATT&CK matrix coverage data.</div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const tactics = matrix.tactics || [];
  const blindSpots = matrix.blindSpots || [];
  const overallCoverage = matrix.overallCoveragePct ?? matrix.overallAttackCoveragePct ?? 35;
  const filteredTactics = tactics.filter(t => selectedTactic === 'ALL' || t.tacticId === selectedTactic);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950 text-orange-300 border border-orange-800">
              FEATURE 15: THREAT FRAMEWORK MAPPING
            </span>
            <span className="text-xs text-zinc-400 font-mono">MITRE ATT&CK V14 ENTERPRISE</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mt-1 flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-orange-400" />
            MITRE ATT&CK Matrix & Detection Blind Spots
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Audit detection rule coverage across adversary tactics. Pinpoints critical enterprise blind spots where critical national infrastructure entities lack active telemetry rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-zinc-400 uppercase">Framework Coverage</div>
              <div className="text-lg font-bold font-mono text-orange-400">
                {overallCoverage}%
              </div>
            </div>
            <div className="w-12 bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full" style={{ width: `${overallCoverage}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-xs text-zinc-400">Total Monitored Tactics</div>
          <div className="text-2xl font-bold text-zinc-100 mt-1 font-mono">{tactics.length}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Enterprise Kill Chain</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-xs text-zinc-400">Covered Techniques</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{matrix.totalTechniquesCovered ?? matrix.topTechniques?.length ?? 0}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Active detection rules</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-xs text-zinc-400">Critical Blind Spots</div>
          <div className="text-2xl font-bold text-red-400 mt-1 font-mono">{blindSpots.length}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Unmonitored techniques</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-xs text-zinc-400">Supervisory Risk Index</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
            {100 - overallCoverage} / 100
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Detection gap exposure</div>
        </div>
      </div>

      {/* Critical Blind Spots Warning Banner */}
      {blindSpots.length > 0 && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/60 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-red-400">
            <EyeOff className="w-4 h-4" />
            <span>High-Priority Detection Blind Spots Requiring Supervisory Mandate</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {blindSpots.map(bs => (
              <div key={bs.techniqueId} className="p-2.5 rounded-lg bg-zinc-950 border border-red-900/40 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-red-300">{bs.techniqueId}</span>
                  <span className="text-[10px] text-zinc-400">{bs.tacticName}</span>
                </div>
                <div className="font-semibold text-zinc-200 mt-1">{bs.techniqueName}</div>
                <div className="text-[11px] text-red-400/90 mt-1">{bs.riskReason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Matrix Heatmap Columns */}
      <div className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Tactical Coverage Heatmap Matrix
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTactics.map(tactic => (
            <div key={tactic.tacticId} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-orange-400">{tactic.tacticId}</span>
                  <h4 className="text-xs font-bold text-zinc-100">{tactic.tacticName}</h4>
                </div>
                <span className={`text-xs font-mono font-bold ${
                  tactic.coveragePct >= 60 ? 'text-emerald-400' : tactic.coveragePct >= 30 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {tactic.coveragePct}%
                </span>
              </div>

              {/* Techniques Chips */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {(tactic.techniques || []).map(tech => (
                  <div
                    key={tech.id}
                    className={`p-2 rounded text-xs flex items-center justify-between ${
                      tech.covered
                        ? 'bg-emerald-950/20 border border-emerald-900/40 text-zinc-200'
                        : 'bg-zinc-950 border border-zinc-800/80 text-zinc-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${tech.covered ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                      <span className="font-mono text-[10px] text-zinc-400">{tech.id}</span>
                      <span className="truncate max-w-[150px]">{tech.name}</span>
                    </div>

                    {tech.covered ? (
                      <span className="text-[10px] font-mono text-emerald-400">{tech.alertCount ?? 1} alerts</span>
                    ) : (
                      <span className="text-[10px] text-red-400 font-mono">Unmonitored</span>
                    )}
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
