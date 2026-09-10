import React, { useState, useEffect } from 'react';
import { SOCBehaviourFingerprint, Entity } from '../../types';
import { api } from '../../services/api';
import {
  Fingerprint,
  Activity,
  Clock,
  Send,
  CheckCircle2,
  FileCheck2,
  Layers,
  Search,
  Download,
  Building2,
  AlertCircle
} from 'lucide-react';

export const SOCFingerprintView: React.FC = () => {
  const [fingerprints, setFingerprints] = useState<SOCBehaviourFingerprint[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [fps, ents] = await Promise.all([
          api.getFingerprints(),
          api.getEntities()
        ]);
        setFingerprints(fps);
        setEntities(ents);
        if (fps.length > 0) {
          setSelectedEntityId(fps[0].entityId);
        }
      } catch (err) {
        console.error('Failed to load fingerprints:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeFingerprint = fingerprints.find(f => f.entityId === selectedEntityId) || fingerprints[0];
  const activeEntity = entities.find(e => e.id === activeFingerprint?.entityId);

  const handleExportJSON = () => {
    if (!activeFingerprint) return;
    const blob = new Blob([JSON.stringify(activeFingerprint, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOC-Fingerprint-${activeFingerprint.entityId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-purple-950 border border-purple-700 text-purple-300">
                Descriptive Profiling Engine
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-800 text-zinc-300">
                Non-Judgmental Operational Archetypes
              </span>
            </div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
              <Fingerprint className="w-5 h-5 text-purple-400" />
              SOC Behaviour Fingerprints
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
              Constructs an empirical operational profile across velocity, escalation habits, closure concentration,
              and artifact completeness. Profiles are descriptive, not judgmental—highlighting operational tendencies for examiner verification.
            </p>
          </div>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-2 shadow-sm transition-all self-start"
          >
            <Download className="w-3.5 h-3.5" />
            Export Profile JSON
          </button>
        </div>

        {/* Entity Selector Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-zinc-850">
          {fingerprints.map(fp => (
            <button
              key={fp.entityId}
              onClick={() => setSelectedEntityId(fp.entityId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                selectedEntityId === fp.entityId
                  ? 'bg-purple-900/60 border border-purple-500 text-purple-200 shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{fp.entityName}</span>
            </button>
          ))}
        </div>
      </div>

      {activeFingerprint && (
        <>
          {/* Summary Banner */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-zinc-850">
              <div>
                <div className="text-[11px] font-mono text-zinc-400">Descriptive Operational Signature</div>
                <h2 className="text-base font-bold text-zinc-100 mt-0.5">{activeFingerprint.entityName}</h2>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs font-mono text-zinc-300">
                Criticality: <span className="font-bold text-red-400">{activeEntity?.criticality || 'HIGH'}</span> | Sector: {activeEntity?.sector || 'Critical Infrastructure'}
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-lg bg-purple-950/20 border border-purple-900/40">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">
                Synthesized Behavioral Profile
              </div>
              <div className="text-sm font-semibold text-zinc-200">
                "{activeFingerprint.summaryProfile}"
              </div>
            </div>
          </div>

          {/* Fingerprint Dimensions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Investigation Velocity */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Investigation Velocity
                </div>
                <span className="text-xs font-mono text-zinc-400">{activeFingerprint.investigationVelocity.score}/100</span>
              </div>
              <div className="text-xs text-zinc-300 font-semibold">
                {activeFingerprint.investigationVelocity.label}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-850 text-xs font-mono">
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">P50 Duration</div>
                  <div className="text-sm font-bold text-zinc-200">{activeFingerprint.investigationVelocity.p50Duration}m</div>
                </div>
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">P90 Duration</div>
                  <div className="text-sm font-bold text-zinc-200">{activeFingerprint.investigationVelocity.p90Duration}m</div>
                </div>
              </div>
            </div>

            {/* 2. Escalation Propensity */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                  <Send className="w-4 h-4 text-amber-400" />
                  Escalation Propensity
                </div>
                <span className="text-xs font-mono text-zinc-400">{activeFingerprint.escalationPropensity.ratePct}%</span>
              </div>
              <div className="text-xs text-zinc-300 font-semibold">
                {activeFingerprint.escalationPropensity.label}
              </div>
              <div className="pt-2 border-t border-zinc-850">
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${activeFingerprint.escalationPropensity.ratePct}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 mt-1.5 flex justify-between font-mono">
                  <span>Critical/High Cases Escalated</span>
                  <span>{activeFingerprint.escalationPropensity.ratePct}%</span>
                </div>
              </div>
            </div>

            {/* 3. Closure Concentration */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                  <Activity className="w-4 h-4 text-rose-400" />
                  Closure Concentration
                </div>
                <span className="text-xs font-mono text-zinc-400">{activeFingerprint.closureConcentration.offHoursBurstPct}%</span>
              </div>
              <div className="text-xs text-zinc-300 font-semibold">
                {activeFingerprint.closureConcentration.label}
              </div>
              <div className="pt-2 border-t border-zinc-850">
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${activeFingerprint.closureConcentration.offHoursBurstPct}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 mt-1.5 flex justify-between font-mono">
                  <span>Night-Shift (22:00-06:00 UTC)</span>
                  <span>{activeFingerprint.closureConcentration.offHoursBurstPct}% of total</span>
                </div>
              </div>
            </div>

            {/* 4. Evidence Completeness */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  Cryptographic Evidence Completeness
                </div>
                <span className="text-xs font-mono text-zinc-400">{activeFingerprint.evidenceCompleteness.hashCoveragePct}%</span>
              </div>
              <div className="text-xs text-zinc-300 font-semibold">
                {activeFingerprint.evidenceCompleteness.label}
              </div>
              <div className="pt-2 border-t border-zinc-850">
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${activeFingerprint.evidenceCompleteness.hashCoveragePct}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 mt-1.5 flex justify-between font-mono">
                  <span>SHA-256 / PCAP Linked Rate</span>
                  <span>{activeFingerprint.evidenceCompleteness.hashCoveragePct}%</span>
                </div>
              </div>
            </div>

            {/* 5. SLA Adherence */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  SLA Adherence Matrix
                </div>
                <span className="text-xs font-mono text-zinc-400">{100 - activeFingerprint.slaAdherence.breachRatePct}%</span>
              </div>
              <div className="text-xs text-zinc-300 font-semibold">
                {activeFingerprint.slaAdherence.label}
              </div>
              <div className="pt-2 border-t border-zinc-850">
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{ width: `${100 - activeFingerprint.slaAdherence.breachRatePct}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 mt-1.5 flex justify-between font-mono">
                  <span>SLA Met Rate</span>
                  <span>{100 - activeFingerprint.slaAdherence.breachRatePct}% (Breaches: {activeFingerprint.slaAdherence.breachRatePct}%)</span>
                </div>
              </div>
            </div>

            {/* 6. Repeated Workflow Gaps */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  Repeated Workflow Gaps
                </div>
                <span className="text-xs font-mono text-zinc-400">{activeFingerprint.repeatedGapsRate.gapCount} gaps</span>
              </div>
              <div className="text-xs text-zinc-300 font-semibold">
                {activeFingerprint.repeatedGapsRate.label}
              </div>
              <div className="pt-2 border-t border-zinc-850 text-[11px] text-zinc-400">
                Concentration of procedural omissions (such as missing escalation verification or uninvestigated closures) across the supervisory period.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
