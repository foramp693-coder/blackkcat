import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccessDeniedPageProps {
  requiredRole?: string | string[];
  requiredPermission?: string;
  attemptedView?: string;
  actionAttempted?: string;
  onNavigateHome?: () => void;
  onReturnToDashboard?: () => void;
  onSwitchAccount?: () => void;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  requiredRole,
  requiredPermission,
  attemptedView,
  actionAttempted,
  onNavigateHome,
  onReturnToDashboard,
  onSwitchAccount
}) => {
  const { user, logout } = useAuth();
  const handleHome = onReturnToDashboard || onNavigateHome || (() => {});
  const handleSwitch = onSwitchAccount || logout;
  const viewTitle = actionAttempted || attemptedView || 'Restricted Supervisory Module';
  const rolesList = Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : [];

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-5 mb-6">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="h-8 w-8 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs font-semibold uppercase tracking-wider">
                RBAC Security Policy Violation
              </span>
              <span className="text-xs text-slate-500 font-mono">HTTP 403 Forbidden</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Access Restricted — Insufficient Privileges
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Your assigned supervisory role does not possess the requisite clearance or permissions to inspect or alter this module.
            </p>
          </div>
        </div>

        {/* Security Assessment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-xs uppercase tracking-wider font-mono text-slate-500 block mb-1">
              Current Identity & Clearance
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">{user?.name} ({user?.username})</p>
              <p className="text-xs text-slate-400">
                Active Role: <span className="font-semibold text-indigo-300">{user?.role}</span> ({user?.accessLevel})
              </p>
              <p className="text-xs text-slate-400">
                Organization: <span className="text-slate-300">{user?.organization}</span>
              </p>
            </div>
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider font-mono text-slate-500 block mb-1">
              Target Resource & Policy Constraint
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">{viewTitle}</p>
              {rolesList.length > 0 && (
                <p className="text-xs text-rose-300">
                  Authorized Roles: <span className="font-mono">{rolesList.join(', ')}</span>
                </p>
              )}
              {requiredPermission && (
                <p className="text-xs text-amber-300">
                  Required Permission: <span className="font-mono">{requiredPermission}</span>
                </p>
              )}
              <p className="text-xs text-slate-400">
                Statutory Authority: Section 70B Statutory Cybersecurity Direction
              </p>
            </div>
          </div>
        </div>

        {/* Audit Log Notification */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5 mb-6 font-mono">
          <Lock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Compliance Audit Notice:</strong> This unauthorized access attempt has been cryptographically recorded
            in the immutable audit ledger with your user ID, IP address, timestamp, and attempted action.
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <button
            onClick={handleHome}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Authorized Dashboard
          </button>

          <button
            onClick={handleSwitch}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-medium border border-slate-700 flex items-center gap-2 transition-all"
          >
            <LogOut className="h-4 w-4 text-slate-400" />
            Switch / Sign in with Higher Clearance Account
          </button>
        </div>
      </div>
    </div>
  );
};
