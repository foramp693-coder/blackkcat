import React, { useState, useMemo } from 'react';
import { Entity, SupervisoryFinding, SupervisoryAttentionLevel } from '../../types';
import { evaluateEntitySupervisoryAttention } from '../../services/supervisoryMetrics';
import { SeverityBadge } from '../common/SeverityBadge';
import { EntityDossierModal } from '../modals/EntityDossierModal';
import {
  Building2,
  ShieldAlert,
  ArrowRight,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Search,
  Eye
} from 'lucide-react';

interface Props {
  entities: Entity[];
  allFindings?: SupervisoryFinding[];
  onSelectEntity: (entityId: string) => void;
  onSelectFinding?: (finding: SupervisoryFinding) => void;
}

export const EntitiesView: React.FC<Props> = ({
  entities,
  allFindings = [],
  onSelectEntity,
  onSelectFinding = () => {}
}) => {
  const [selectedEntityForDossier, setSelectedEntityForDossier] = useState<Entity | null>(null);
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [attentionFilter, setAttentionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'RISK' | 'FINDINGS' | 'SLA' | 'NAME'>('RISK');

  // Compute evaluations for all entities
  const evaluations = useMemo(() => {
    const map = new Map<string, ReturnType<typeof evaluateEntitySupervisoryAttention>>();
    entities.forEach(e => {
      map.set(e.id, evaluateEntitySupervisoryAttention(e, allFindings));
    });
    return map;
  }, [entities, allFindings]);

  // Sector list
  const sectors = ['ALL', ...Array.from(new Set(entities.map(e => e.sector)))];

  // Counts
  const actionRequiredCount = entities.filter(
    e => evaluations.get(e.id)?.attentionLevel === 'ACTION_REQUIRED'
  ).length;

  const elevatedWatchCount = entities.filter(
    e => evaluations.get(e.id)?.attentionLevel === 'ELEVATED_WATCH'
  ).length;

  const monitoredStableCount = entities.filter(
    e => evaluations.get(e.id)?.attentionLevel === 'MONITORED_STABLE'
  ).length;

  // Filter entities
  let filtered = entities.filter(e => {
    const evalData = evaluations.get(e.id);
    if (sectorFilter !== 'ALL' && e.sector !== sectorFilter) return false;
    if (attentionFilter !== 'ALL' && evalData?.attentionLevel !== attentionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.sector.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort entities
  filtered.sort((a, b) => {
    const evalA = evaluations.get(a.id);
    const evalB = evaluations.get(b.id);
    if (sortBy === 'RISK') {
      return (evalB?.exposureIndex || 0) - (evalA?.exposureIndex || 0);
    }
    if (sortBy === 'FINDINGS') {
      return b.totalFindings - a.totalFindings;
    }
    if (sortBy === 'SLA') {
      return b.slaBreachRate - a.slaBreachRate;
    }
    return a.name.localeCompare(b.name);
  });

  const getAttentionBadge = (level?: SupervisoryAttentionLevel) => {
    switch (level) {
      case 'ACTION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-300 border border-red-700 animate-pulse">
            <Flame className="w-3 h-3 text-red-400" />
            <span>Action Required</span>
          </span>
        );
      case 'ELEVATED_WATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-700">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Elevated Watch</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Monitored Stable</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-400" />
            <span>Pillar (i): Regulated Strategic Entities & Supervisory Attention Registry</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time regulatory attention classification, exposure weighting, and systemic resilience profiling across critical national infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            {entities.length} Strategic Entities
          </span>
        </div>
      </div>

      {/* Supervisory Attention Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setAttentionFilter(attentionFilter === 'ACTION_REQUIRED' ? 'ALL' : 'ACTION_REQUIRED')}
          className={`cursor-pointer rounded-xl border p-4 transition shadow-sm ${
            attentionFilter === 'ACTION_REQUIRED'
              ? 'bg-red-950/50 border-red-700'
              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-400" />
              <span>Action Required</span>
            </span>
            <span className="text-xl font-bold font-mono text-red-400">{actionRequiredCount}</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Entities with critical execution gaps, severe SLA breaches, or high systemic exposure.
          </p>
        </div>

        <div
          onClick={() => setAttentionFilter(attentionFilter === 'ELEVATED_WATCH' ? 'ALL' : 'ELEVATED_WATCH')}
          className={`cursor-pointer rounded-xl border p-4 transition shadow-sm ${
            attentionFilter === 'ELEVATED_WATCH'
              ? 'bg-amber-950/50 border-amber-700'
              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Elevated Watch</span>
            </span>
            <span className="text-xl font-bold font-mono text-amber-400">{elevatedWatchCount}</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Entities exhibiting moderate procedural anomalies or recurring evidence deficits.
          </p>
        </div>

        <div
          onClick={() => setAttentionFilter(attentionFilter === 'MONITORED_STABLE' ? 'ALL' : 'MONITORED_STABLE')}
          className={`cursor-pointer rounded-xl border p-4 transition shadow-sm ${
            attentionFilter === 'MONITORED_STABLE'
              ? 'bg-emerald-950/50 border-emerald-700'
              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Monitored Stable</span>
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400">{monitoredStableCount}</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Entities adhering to operational SLAs with complete lifecycle evidence.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by entity name, sector, or regulator code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Sector filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {sectors.map(s => (
              <button
                key={s}
                onClick={() => setSectorFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  sectorFilter === s
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-600'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                {s === 'ALL' ? 'All Sectors' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort:</span>
          </span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 focus:outline-none"
          >
            <option value="RISK">Systemic Exposure Index</option>
            <option value="FINDINGS">Total Supervisory Signals</option>
            <option value="SLA">SLA Breach Rate</option>
            <option value="NAME">Entity Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid of Entity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(e => {
          const evalData = evaluations.get(e.id);
          return (
            <div
              key={e.id}
              onClick={() => setSelectedEntityForDossier(e)}
              className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 p-5 hover:border-zinc-700 hover:bg-zinc-900/60 transition shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {e.code}
                    </span>
                    <SeverityBadge severity={e.criticality} size="sm" />
                  </div>
                  {getAttentionBadge(evalData?.attentionLevel)}
                </div>

                <h2 className="text-sm font-bold text-zinc-100 group-hover:text-red-300 transition">
                  {e.name}
                </h2>
                <span className="text-[11px] text-zinc-500 font-mono block mt-0.5">
                  Sector: {e.sector}
                </span>

                <div className="mt-4 pt-3 border-t border-zinc-850 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-zinc-900 p-2 border border-zinc-800/80">
                    <div className="text-[10px] uppercase text-zinc-500 font-mono">Resilience</div>
                    <div className={`text-sm font-bold font-mono ${
                      (evalData?.resilienceScore || 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {evalData?.resilienceScore}%
                    </div>
                  </div>

                  <div className="rounded-lg bg-zinc-900 p-2 border border-zinc-800/80">
                    <div className="text-[10px] uppercase text-zinc-500 font-mono">Signals</div>
                    <div className={`text-sm font-bold ${e.totalFindings > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {e.totalFindings}
                    </div>
                  </div>

                  <div className="rounded-lg bg-zinc-900 p-2 border border-zinc-800/80">
                    <div className="text-[10px] uppercase text-zinc-500 font-mono">SLA Breach</div>
                    <div className={`text-sm font-bold ${e.slaBreachRate > 15 ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {e.slaBreachRate}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 font-mono text-[10px]">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span>Assessed: {new Date(e.lastAssessedAt).toLocaleDateString()}</span>
                </span>
                <span className="text-red-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Dossier</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Entity Dossier Modal */}
      {selectedEntityForDossier && (
        <EntityDossierModal
          entity={selectedEntityForDossier}
          allFindings={allFindings}
          onClose={() => setSelectedEntityForDossier(null)}
          onSelectFinding={onSelectFinding}
          onFilterFindingsForEntity={onSelectEntity}
        />
      )}
    </div>
  );
};
