import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DigitalTwinInput, DigitalTwinOutput, SOCHealthScoreBreakdown } from '../../types';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Clock,
  Shield,
  Users,
  Activity,
  CheckCircle2,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';

export const DigitalTwinSimulatorView: React.FC = () => {
  const [params, setParams] = useState<DigitalTwinInput>({
    staffingDeltaAnalysts: 2,
    escalationComplianceImprovementPct: 25,
    enableMissingSensors: true,
    mttrReductionPct: 20,
    detectionRuleTuningPct: 15
  });

  const [simulation, setSimulation] = useState<DigitalTwinOutput | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runSimulation = async (inputParams: DigitalTwinInput) => {
    setLoading(true);
    try {
      const res = await api.runDigitalTwin(inputParams);
      const outputData = res?.output || res;
      setSimulation(outputData);
    } catch (err) {
      console.error('Failed to run digital twin simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation(params);
  }, []);

  const handleReset = () => {
    const defaultParams: DigitalTwinInput = {
      staffingDeltaAnalysts: 0,
      escalationComplianceImprovementPct: 0,
      enableMissingSensors: false,
      mttrReductionPct: 0,
      detectionRuleTuningPct: 0
    };
    setParams(defaultParams);
    runSimulation(defaultParams);
  };

  const handleApply = () => {
    runSimulation(params);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
              FEATURE 16: OPERATIONAL SIMULATOR
            </span>
            <span className="text-xs text-zinc-400 font-mono">100% DETERMINISTIC MONTE-CARLO MODEL</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mt-1 flex items-center gap-2.5">
            <Sliders className="w-7 h-7 text-teal-400" />
            Digital Twin SOC Operational Simulator
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Simulate the impact of staffing adjustments, escalation enforcement, telemetry sensor activation, and rule tuning on SOC maturity, SLA breach reduction, and analyst burnout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Simulation</span>
          </button>
        </div>
      </div>

      {/* Main Simulator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Controls Sidebar */}
        <div className="lg:col-span-1 space-y-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-300 border-b border-zinc-800 pb-2 flex items-center justify-between">
            <span>Simulation Levers</span>
            <span className="text-[10px] text-teal-400 font-mono">Real-time</span>
          </div>

          {/* Lever 1: Staffing Delta */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                Additional Analysts (FTE)
              </span>
              <span className="font-mono font-bold text-teal-400">
                {params.staffingDeltaAnalysts >= 0 ? `+${params.staffingDeltaAnalysts}` : params.staffingDeltaAnalysts}
              </span>
            </div>
            <input
              type="range"
              min="-2"
              max="10"
              step="1"
              value={params.staffingDeltaAnalysts}
              onChange={e => {
                const val = parseInt(e.target.value);
                const next = { ...params, staffingDeltaAnalysts: val };
                setParams(next);
                runSimulation(next);
              }}
              className="w-full accent-teal-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>-2 (Downsizing)</span>
              <span>0 (Baseline)</span>
              <span>+10 (Expansion)</span>
            </div>
          </div>

          {/* Lever 2: Escalation Compliance */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Escalation Rigor Improvement
              </span>
              <span className="font-mono font-bold text-blue-400">+{params.escalationComplianceImprovementPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={params.escalationComplianceImprovementPct}
              onChange={e => {
                const val = parseInt(e.target.value);
                const next = { ...params, escalationComplianceImprovementPct: val };
                setParams(next);
                runSimulation(next);
              }}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>0% (Status Quo)</span>
              <span>+40%</span>
              <span>+80% (Strict)</span>
            </div>
          </div>

          {/* Lever 3: MTTR Reduction */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                MTTR Speedup / Playbook Automation
              </span>
              <span className="font-mono font-bold text-emerald-400">-{params.mttrReductionPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={params.mttrReductionPct}
              onChange={e => {
                const val = parseInt(e.target.value);
                const next = { ...params, mttrReductionPct: val };
                setParams(next);
                runSimulation(next);
              }}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Lever 4: Rule Tuning */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                Detection Rule Optimization
              </span>
              <span className="font-mono font-bold text-purple-400">+{params.detectionRuleTuningPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={params.detectionRuleTuningPct}
              onChange={e => {
                const val = parseInt(e.target.value);
                const next = { ...params, detectionRuleTuningPct: val };
                setParams(next);
                runSimulation(next);
              }}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Lever 5: Sensor Activation Toggle */}
          <div className="pt-2 border-t border-zinc-800/80">
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-xs text-zinc-300">Activate Missing Telemetry Sensors</span>
              <input
                type="checkbox"
                checked={params.enableMissingSensors}
                onChange={e => {
                  const val = e.target.checked;
                  const next = { ...params, enableMissingSensors: val };
                  setParams(next);
                  runSimulation(next);
                }}
                className="rounded bg-zinc-800 border-zinc-700 text-teal-500 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Simulation Output Projections */}
        <div className="lg:col-span-2 space-y-6">
          {simulation ? (
            <div className="space-y-6">
              {/* Top Projected Deltas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[11px] text-zinc-400">Projected SOC Health</div>
                  <div className="text-2xl font-bold text-teal-400 mt-1 font-mono">
                    {simulation.simulatedHealthScore}/100
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                    +{simulation.simulatedHealthScore - simulation.baselineHealthScore} pts gain
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[11px] text-zinc-400">Projected Residual Risk</div>
                  <div className="text-2xl font-bold text-zinc-100 mt-1 font-mono">
                    {simulation.simulatedResidualRisk}/100
                  </div>
                  <div className="text-[11px] text-teal-400 font-semibold mt-1">
                    {simulation.simulatedResidualRisk - simulation.baselineResidualRisk} pts reduction
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[11px] text-zinc-400">Projected SLA Breach</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                    {simulation.simulatedSlaBreachPct}%
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    Down from {simulation.baselineSlaBreachPct}%
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[11px] text-zinc-400">Analyst Hours Saved</div>
                  <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">
                    {simulation.analystHoursSavedPerMonth}h
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">Per month capacity gain</div>
                </div>
              </div>

              {/* Component Projection Comparison Table */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Component-Level Health Projections
                </div>

                <div className="space-y-2">
                  {Object.entries(simulation.componentDeltas || {}).map(([compName, delta]: [string, any]) => (
                    <div key={compName} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-zinc-200 capitalize">
                          {compName.replace(/([A-Z])/g, ' $1')}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          Baseline: {delta.baseline}/100
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-zinc-800 h-2 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-teal-500 h-full"
                            style={{ width: `${delta.simulated}%` }}
                          />
                        </div>

                        <div className="text-right font-mono">
                          <span className="font-bold text-zinc-100">{delta.simulated}/100</span>
                          <span className="text-[11px] text-emerald-400 ml-2 font-bold">
                            (+{delta.delta})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Executive Takeaway */}
              <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-800/60 text-xs text-teal-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  Supervisory Simulation Recommendation
                </div>
                <div className="text-[11px] opacity-90">
                  Implementing this modeled configuration recovers approximately <strong className="text-white">{simulation.analystHoursSavedPerMonth} hours</strong> of monthly investigative capacity and compresses SLA breaches to <strong className="text-white">{simulation.simulatedSlaBreachPct}%</strong>, directly satisfying NCIIPC Chapter 4 cybersecurity supervisory guidelines.
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-zinc-500 text-xs">
              Calculating deterministic digital twin projections...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
