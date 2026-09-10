import React from 'react';
import { Entity, SupervisoryFinding } from '../../types';
import { evaluateEntitySupervisoryAttention } from '../../services/supervisoryMetrics';
import { SeverityBadge } from '../common/SeverityBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import {
  X,
  Building2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  FileCheck2,
  ExternalLink,
  Flame,
  CheckCircle2,
  BarChart3
} from 'lucide-react';

interface Props {
  entity: Entity;
  allFindings: SupervisoryFinding[];
  onClose: () => void;
  onSelectFinding: (finding: SupervisoryFinding) => void;
  onFilterFindingsForEntity: (entityId: string) => void;
}

export const EntityDossierModal: React.FC<Props> = ({
  entity,
  allFindings,
  onClose,
  onSelectFinding,
  onFilterFindingsForEntity
}) => {
  const evaluation = evaluateEntitySupervisoryAttention(entity, allFindings);
  const entityFindings = allFindings.filter(f => f.entityId === entity.id);

  const getAttentionBadge = (level: string) => {
    switch (level) {
      case 'ACTION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-950 text-red-300 border border-red-700 shadow-sm animate-pulse">
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>Action Required</span>
          </span>
        );
      case 'ELEVATED_WATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-700 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Elevated Watch</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Monitored Stable</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/80">
              <Building2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100">{entity.name}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {entity.code}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Strategic Sector: <strong className="text-zinc-200">{entity.sector}</strong> • Designated Critical Infrastructure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getAttentionBadge(evaluation.attentionLevel)}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Statutory Assessment Alert Banner */}
          <div className={`p-4 rounded-xl border ${
            evaluation.attentionLevel === 'ACTION_REQUIRED'
              ? 'bg-red-950/30 border-red-800/80 text-red-200'
              : evaluation.attentionLevel === 'ELEVATED_WATCH'
              ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
              : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
          }`}>
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider block">
                  Supervisory Attention Diagnosis:
                </span>
                <p className="text-xs leading-relaxed">{evaluation.statusRationale}</p>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
              <div className="text-[10px] uppercase font-mono text-zinc-500">Resilience Index</div>
              <div className={`text-xl font-bold font-mono mt-1 ${
                evaluation.resilienceScore >= 80 ? 'text-emerald-400' : evaluation.resilienceScore >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {evaluation.resilienceScore}%
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Weighted lifecycle posture</div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
              <div className="text-[10px] uppercase font-mono text-zinc-500">Exposure Index</div>
              <div className="text-xl font-bold font-mono text-zinc-200 mt-1">
                {evaluation.exposureIndex} / 100
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Tier risk multiplier</div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
              <div className="text-[10px] uppercase font-mono text-zinc-500">SLA Breach Rate</div>
              <div className={`text-xl font-bold font-mono mt-1 ${entity.slaBreachRate > 15 ? 'text-amber-400' : 'text-zinc-200'}`}>
                {entity.slaBreachRate}%
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Timeline non-compliance</div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
              <div className="text-[10px] uppercase font-mono text-zinc-500">Critical Signals</div>
              <div className={`text-xl font-bold font-mono mt-1 ${evaluation.criticalCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {evaluation.criticalCount} Critical
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{evaluation.unresolvedCount} pending review</div>
            </div>
          </div>

          {/* Active Supervisory Signals Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-red-400" />
                <span>Supervisory Signals & Evidence Gaps for this Entity ({entityFindings.length})</span>
              </h3>
              <button
                onClick={() => {
                  onFilterFindingsForEntity(entity.id);
                  onClose();
                }}
                className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition"
              >
                <span>View in Findings Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {entityFindings.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-zinc-800/80 bg-zinc-900/40 text-xs text-zinc-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                No active supervisory execution gaps or evidence deficits detected for this entity.
              </div>
            ) : (
              <div className="space-y-2">
                {entityFindings.map(f => (
                  <div
                    key={f.id}
                    onClick={() => {
                      onSelectFinding(f);
                      onClose();
                    }}
                    className="group cursor-pointer rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-3.5 hover:border-zinc-700 hover:bg-zinc-800/60 transition shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-zinc-300">{f.id}</span>
                        <CategoryBadge category={f.category} size="sm" />
                        <SeverityBadge severity={f.severity} size="sm" />
                        <span className="text-xs font-mono text-zinc-500">Case {f.caseNumber}</span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-200 group-hover:text-red-300 transition">
                        {f.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{f.whatHappened}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-red-400">{f.priorityScore} pts</span>
                        <span className="text-[10px] text-zinc-500 block">Priority</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-6 py-3.5 bg-zinc-900/80 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">
            Last Evaluated: {new Date(entity.lastAssessedAt).toLocaleString()}
          </span>
          <button
            onClick={() => {
              onFilterFindingsForEntity(entity.id);
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/80 hover:bg-red-800 text-white font-semibold text-xs transition shadow"
          >
            <span>Open All {entity.name} Signals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
