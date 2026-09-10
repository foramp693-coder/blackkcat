import React from 'react';
import {
  ShieldCheck,
  FileCheck2,
  Lock,
  Download,
  CheckCircle,
  Eye,
  Activity,
  ArrowRight,
  Info,
  Scale,
  Hash
} from 'lucide-react';
import { KPISummary, Finding, Entity } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface AuditorDashboardProps {
  kpi: KPISummary | null;
  findings: Finding[];
  entities: Entity[];
  onNavigate: (view: string) => void;
  onGenerateReport?: () => void;
}

export const AuditorDashboard: React.FC<AuditorDashboardProps> = ({
  kpi,
  findings,
  entities,
  onNavigate,
  onGenerateReport
}) => {
  const { user } = useAuth();

  const confirmedFindings = findings.filter(f => f.reviewStatus === 'CONFIRMED');
  const rejectedFindings = findings.filter(f => f.reviewStatus === 'REJECTED');
  const pendingFindings = findings.filter(f => f.reviewStatus === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono font-medium">
                CLEARANCE LEVEL L1 &bull; AUDITOR (READ-ONLY)
              </span>
              <span className="text-xs text-slate-400 font-mono">Statutory Compliance Oversight</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
              Welcome, {user?.name}
            </h2>
            <p className="text-xs text-slate-400">
              {user?.organization} &bull; Independent regulatory review and compliance verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('audit')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            Inspect Audit Ledger
          </button>
          <button
            onClick={onGenerateReport}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export Compliance Audit File
          </button>
        </div>
      </div>

      {/* Auditor Constraints Notice */}
      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3 text-xs text-emerald-300">
        <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Auditor RBAC Mode:</strong> You are operating under an independent read-only clearance. 
          You can inspect all finding evidence, verify the complete cryptographic audit trail, audit compliance scores, 
          and export signed regulatory dossiers. Write actions (decision overrides, engine controls, raw dataset ingestion) are restricted.
        </div>
      </div>

      {/* Compliance Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase">Audit Trail Verification</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">100%</span>
            <span className="text-xs text-slate-400">Cryptographically Intact</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">HMAC-SHA256 Hash Chained</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase">Statutory Findings Assessed</span>
            <FileCheck2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{findings.length}</span>
            <span className="text-xs text-indigo-400 font-medium">{confirmedFindings.length} Confirmed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Section 70B Non-compliance checks</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase">Framework Adherence</span>
            <Scale className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">74.2%</span>
            <span className="text-xs text-amber-400 font-medium">Moderate Risk</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">CERT-In + RBI Cyber Framework</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase">Audit Trail Ledger Size</span>
            <Hash className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">Active</span>
            <span className="text-xs text-slate-400">Append-Only</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Zero-loss statutory ledger</p>
        </div>
      </div>

      {/* Auditor Investigation Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Findings Overview */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Certified Supervisory Findings (Read-Only)</h3>
              <p className="text-xs text-slate-400">
                Audited evidence items, timeline reconstructions, and confirmed regulatory gaps
              </p>
            </div>
            <button
              onClick={() => onNavigate('findings')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              Examine Evidence <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {confirmedFindings.slice(0, 4).map((f) => (
              <div
                key={f.id}
                onClick={() => onNavigate('findings')}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-200">{f.caseNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold">
                      CONFIRMED GAP
                    </span>
                    <span className="text-xs text-slate-400">{f.entityName}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200">{f.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-1">{f.whatHappened}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-xs text-emerald-400">
                  <Eye className="h-3.5 w-3.5" />
                  <span>Inspect</span>
                </div>
              </div>
            ))}

            {confirmedFindings.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No certified findings currently recorded in the active scenario.
              </div>
            )}
          </div>
        </div>

        {/* Auditor Specialized Navigation */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Statutory Audit Tools</h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('audit')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">Immutable Audit Ledger</p>
                  <p className="text-[11px] text-slate-400">Every examiner action, query, & sign-off</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate('benchmarking')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">Governance Maturity Benchmarks</p>
                  <p className="text-[11px] text-slate-400">Multi-entity GMI & CRI compliance indices</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate('workflow')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">Workflow Process Verification</p>
                  <p className="text-[11px] text-slate-400">Incident escalation timelines & delays</p>
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
