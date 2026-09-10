import React from 'react';
import {
  Shield,
  Upload,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  Activity,
  ArrowRight,
  Info,
  Server,
  Users
} from 'lucide-react';
import { KPISummary, Finding, Entity } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface SOCSupervisorDashboardProps {
  kpi: KPISummary | null;
  findings: Finding[];
  entities: Entity[];
  onNavigate: (view: string) => void;
  onOpenUpload: () => void;
}

export const SOCSupervisorDashboard: React.FC<SOCSupervisorDashboardProps> = ({
  kpi,
  findings,
  entities,
  onNavigate,
  onOpenUpload
}) => {
  const { user } = useAuth();

  // Filter findings for assigned operational entities if set
  const assignedCodes = ['CSE-01', 'CSE-02', 'CSE-03', 'CSE-04'];
  const operationalFindings = findings.filter(
    f => assignedCodes.includes(f.entityId) || assignedCodes.some(c => f.entityName.includes(c))
  );

  const pendingActionFindings = operationalFindings.filter(
    f => f.reviewStatus === 'PENDING' || f.reviewStatus === 'NEEDS_EVIDENCE'
  );

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 font-mono font-medium">
                CLEARANCE LEVEL L2 &bull; SOC SUPERVISOR
              </span>
              <span className="text-xs text-slate-400 font-mono">Operational Management Mode</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
              Welcome, {user?.name}
            </h2>
            <p className="text-xs text-slate-400">
              {user?.organization} &bull; Managing 4 Designated Critical Operational Clusters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUpload}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Upload className="h-3.5 w-3.5" />
            Ingest Operational SOC Logs
          </button>
        </div>
      </div>

      {/* Scope Disclaimer / RBAC Boundaries */}
      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3 text-xs text-blue-300">
        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Role Scope:</strong> You have operational write permissions to acknowledge findings, 
          submit operational justifications, upload fresh SOC log datasets, and run Digital Twin simulations. 
          Modifying global policy gates and final regulatory gap certification require Lead Examiner clearance.
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase">Assigned Operational Clusters</span>
            <Server className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{assignedCodes.length}</span>
            <span className="text-xs text-blue-400 font-medium">Active Monitoring</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Banking, Grid, Telco & Defense</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase">Action / Explanation Backlog</span>
            <AlertCircle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{pendingActionFindings.length}</span>
            <span className="text-xs text-slate-400">Items Pending</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Operational notes or evidence needed</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase">Mean Escalation Delay</span>
            <Clock className="h-4 w-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">4.2 hrs</span>
            <span className="text-xs text-rose-400 font-medium">SLA Limit: 6 hrs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Section 70B Regulatory Deadline</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase">Operational Readiness</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">82.6%</span>
            <span className="text-xs text-slate-400">Compliant</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Playbook adherence index</p>
        </div>
      </div>

      {/* Operational Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operational Findings List */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Supervisory Inquiries Requiring Response</h3>
              <p className="text-xs text-slate-400">
                Findings identified by examiners requiring operational justification, explanation, or evidence upload
              </p>
            </div>
            <button
              onClick={() => onNavigate('findings')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              All Findings <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingActionFindings.slice(0, 4).map((f) => (
              <div
                key={f.id}
                onClick={() => onNavigate('findings')}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-200">{f.caseNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-300 border border-blue-500/30">
                      {f.entityName}
                    </span>
                    <span className="text-xs text-amber-400 font-medium">{f.reviewStatus}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200">{f.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-1">{f.whatHappened}</p>
                </div>
                <span className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 font-medium">
                  Provide Notes
                </span>
              </div>
            ))}

            {pendingActionFindings.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                No outstanding inquiries pending operational justification.
              </div>
            )}
          </div>
        </div>

        {/* Quick Tools */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Supervisor Toolset</h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('workflow')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/40 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">Workflow & Case Timeline</p>
                  <p className="text-[11px] text-slate-400">Inspect handover intervals & playbooks</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate('digital-twin')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/40 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">Run Digital Twin Simulation</p>
                  <p className="text-[11px] text-slate-400">Test staffing models & alert thresholds</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </button>

              <button
                onClick={onOpenUpload}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/40 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">Upload Fresh Case Logs</p>
                  <p className="text-[11px] text-slate-400">Support CSV, JSON, or normalized SIEM records</p>
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
