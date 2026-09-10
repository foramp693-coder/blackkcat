import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  UploadCloud,
  FileText,
  ChevronDown,
  Sparkles,
  LogOut,
  User,
  Shield,
  Lock
} from 'lucide-react';
import { ScenarioDefinition } from '../../types';

interface Props {
  scenarios: ScenarioDefinition[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
  onOpenUpload: () => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<Props> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onOpenUpload,
  onOpenReport
}) => {
  const { user, logout, hasRole } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false);

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  const roleBadgeStyle =
    user?.role === 'Lead Examiner'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : user?.role === 'SOC Supervisor'
      ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 backdrop-blur px-6 py-3">
      {/* Brand & Mission */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-400 shadow-md">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wider text-slate-100">SAT-SA</span>
              <span className="rounded bg-slate-800/90 border border-slate-700 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-indigo-400">
                SIH26157
              </span>
              <span className={`rounded border px-2 py-0.5 text-[10px] font-mono font-semibold ${roleBadgeStyle}`}>
                {user?.role} ({user?.accessLevel})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
              Supervisory Analytics Tool for SOC Assessment
            </p>
          </div>
        </div>
      </div>

      {/* Center: Scenario Switcher (Lead Examiner has scenario selection, others view active tag) */}
      <div className="relative">
        {hasRole('Lead Examiner') ? (
          <>
            <button
              onClick={() => setScenarioMenuOpen(!scenarioMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-indigo-900/50 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 hover:border-indigo-600 hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="text-slate-400">Scenario:</span>
              <span className="font-semibold text-indigo-300 truncate max-w-[200px]">
                {activeScenario?.name.split(':')[1] || activeScenario?.name || 'Scenario 2'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {scenarioMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1 font-mono">
                  Select Regulatory Dataset Scenario
                </div>
                {scenarios.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectScenario(s.id);
                      setScenarioMenuOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex flex-col gap-0.5 mb-1 ${
                      s.id === activeScenarioId
                        ? 'bg-indigo-950/70 border border-indigo-600/70 text-indigo-200'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                        {s.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 line-clamp-1">{s.description}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Scenario: {activeScenario?.name.split(':')[0] || 'Active SOC Dataset'}</span>
          </div>
        )}
      </div>

      {/* Right Controls: Ingest (Role guarded), Report, Authenticated User Profile */}
      <div className="flex items-center gap-3">
        {/* Ingest Button: Only Lead Examiner and SOC Supervisor */}
        {hasRole('Lead Examiner', 'SOC Supervisor') && (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-800 transition"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ingest Evidence</span>
          </button>
        )}

        {/* Dossier Report: Available to all authenticated roles */}
        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/60 transition"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Dossier</span>
        </button>

        {/* Authenticated User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:bg-slate-800/90 transition shadow-sm"
          >
            <div className="h-6 w-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <span className="font-semibold block text-slate-200 text-xs">{user?.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">{user?.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 mb-2.5">
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Clearance Level:</span>
                  <span className={`px-2 py-0.5 rounded-full border font-semibold ${roleBadgeStyle}`}>
                    {user?.accessLevel} &bull; {user?.role}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-400 leading-tight">
                  {user?.organization}
                </div>
              </div>

              <div className="px-2 py-1 text-xs text-slate-300 space-y-1 font-mono text-[11px] border-b border-slate-800 pb-2 mb-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Username:</span>
                  <span className="text-slate-200">{user?.username}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Auth Method:</span>
                  <span className="text-emerald-400">Bearer JWT (24h)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Audit Trail:</span>
                  <span className="text-emerald-400">Enforced</span>
                </div>
              </div>

              <button
                onClick={async () => {
                  setProfileMenuOpen(false);
                  await logout();
                }}
                className="w-full p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
