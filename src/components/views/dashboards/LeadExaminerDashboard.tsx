import React from 'react';
import {
  Shield,
  FileCheck,
  AlertTriangle,
  Cpu,
  Layers,
  Sparkles,
  Download,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowRight,
  Database,
  Sliders
} from 'lucide-react';
import { KPISummary, Finding, Entity } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface LeadExaminerDashboardProps {
  kpi: KPISummary | null;
  findings: Finding[];
  entities: Entity[];
  onNavigate: (view: string) => void;
  onLoadScenario?: (id: string) => void;
  onGenerateReport?: () => void;
  onOpenUpload?: () => void;
  onSelectFinding?: (finding: any) => void;
}

export const LeadExaminerDashboard: React.FC<LeadExaminerDashboardProps> = ({
  kpi,
  findings,
  entities,
  onNavigate,
  onLoadScenario,
  onGenerateReport,
  onOpenUpload,
  onSelectFinding
}) => {
  const { user } = useAuth();

  const criticalPending = findings.filter(
    f => (f.severity === 'CRITICAL' || f.severity === 'HIGH') && f.reviewStatus === 'PENDING'
  );
  const confirmedGaps = findings.filter(f => f.reviewStatus === 'CONFIRMED');

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-medium">
                CLEARANCE LEVEL L3 &bull; LEAD EXAMINER
              </span>
              <span className="text-xs text-slate-400 font-mono">Full Supervisory Authority</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
              Welcome, {user?.name}
            </h2>
            <p className="text-xs text-slate-400">
              {user?.organization} &bull; Cross-sector supervisory authority over all {entities.length} monitored Critical Sector Entities.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('scenarios')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            Switch Scenario
          </button>
          <button
            onClick={onGenerateReport}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-600/20 transition-all"
          >
            <Download className="h-3.5 w-3.5 text-slate-950" />
            Export Supervisory Dossier
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase">Supervisory Health</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{kpi?.socHealthScore || 78.4}%</span>
            <span className="text-xs text-emerald-400 font-medium">Certified Stable</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${kpi?.socHealthScore || 78.4}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase">Critical Pending Review</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">{criticalPending.length}</span>
            <span className="text-xs text-slate-400">of {findings.length} findings</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Requires supervisory confirmation</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase">Confirmed Gaps</span>
            <FileCheck className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{confirmedGaps.length}</span>
            <span className="text-xs text-indigo-400 font-medium">Statutory Notices</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Certified supervisory deficiencies</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase">Monitored CSE Entities</span>
            <Database className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{entities.length}</span>
            <span className="text-xs text-amber-400 font-medium">Critical Sectors</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Banking, Energy, Telecom, Defense</p>
        </div>
      </div>

      {/* Primary Supervisory Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Findings Requiring Action */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Examiner Review Priority Queue</h3>
                <p className="text-xs text-slate-400">
                  Critical execution gaps and detection anomalies requiring lead examiner confirmation
                </p>
              </div>
              <button
                onClick={() => onNavigate('findings')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                View All Findings <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {criticalPending.slice(0, 4).map((f) => (
                <div
                  key={f.id}
                  onClick={() => onNavigate('findings')}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-200">{f.caseNumber}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        f.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {f.severity}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{f.entityName}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">{f.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{f.whatHappened}</p>
                  </div>
                  <span className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium">
                    Review
                  </span>
                </div>
              ))}

              {criticalPending.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  All critical findings have been confirmed or reviewed.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Section 70B Non-Compliance Detection: Automated</span>
            <span className="text-indigo-400 font-mono">Lead Examiner Signature Required</span>
          </div>
        </div>

        {/* Lead Examiner Modules Quick Nav */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Advanced Supervisory Modules
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('negative-space')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/40 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">Negative Space Analysis</p>
                  <p className="text-[11px] text-slate-400">Silent failures, suppression, omitted alerts</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate('policy-rules')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/40 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">Policy Rules & Statutory Gates</p>
                  <p className="text-[11px] text-slate-400">Tune regulatory thresholds & rule toggles</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate('benchmarking')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/40 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">Cross-Entity Benchmarking</p>
                  <p className="text-[11px] text-slate-400">GMI & CRI peer ranking across sectors</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate('digital-twin')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/40 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">Digital Twin Simulator</p>
                  <p className="text-[11px] text-slate-400">Stress-test SOC under simulated attack surges</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
