import React, { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, AlertTriangle, CheckCircle, ArrowRight, Activity, Terminal, KeyRound } from 'lucide-react';
import { useAuth, PRESET_ACCOUNTS, PresetDemoAccount } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('lead.examiner');
  const [password, setPassword] = useState('examiner123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccessNotice, setResetSuccessNotice] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username/email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login(username.trim(), password.trim());
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPreset = async (account: PresetDemoAccount, autoSubmit: boolean = false) => {
    setUsername(account.username);
    setPassword(account.pass);
    setError(null);

    if (autoSubmit) {
      setIsSubmitting(true);
      try {
        await login(account.username, account.pass);
        onLoginSuccess?.();
      } catch (err: any) {
        setError(err?.message || 'Authentication failed.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top classification banner */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-1.5 text-center text-xs tracking-wider uppercase text-slate-400 font-mono flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        RESTRICTED ACCESS — REGULATORY GATEWAY & SOC SUPERVISORY CONTROL SYSTEM (SAT-SA v4.2)
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Mission & Demo Profiles */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6 bg-slate-900/60 p-6 sm:p-8 rounded-2xl border border-slate-800/90 shadow-2xl backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Shield className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    SAT-SA Platform
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
                      RBAC Enforced
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400">Supervisory Analytics Tool for SOC Assessment</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Statutory regulatory assessment platform monitoring cyber resilience, detecting workflow gaps, 
                and certifying operational compliance across designated Critical Sector Entities (CSEs).
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    Select Demonstration Persona
                  </span>
                  <span className="text-[11px] text-slate-400">Click to autofill or sign in</span>
                </div>

                {PRESET_ACCOUNTS.map((acc) => {
                  const isSelected = username === acc.username;
                  const roleBadgeColor = 
                    acc.role === 'Lead Examiner' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                    acc.role === 'SOC Supervisor' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' :
                    'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';

                  return (
                    <div
                      key={acc.username}
                      className={`group p-3.5 rounded-xl border transition-all text-left ${
                        isSelected 
                          ? 'bg-slate-800/90 border-indigo-500/60 shadow-lg shadow-indigo-950/40' 
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100">{acc.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-medium ${roleBadgeColor}`}>
                            {acc.role} ({acc.accessLevel})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectPreset(acc, true)}
                          disabled={isSubmitting || loading}
                          className="opacity-90 group-hover:opacity-100 text-xs px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 transition-colors"
                        >
                          Sign In <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                        {acc.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                        <span>User: <strong className="text-slate-300">{acc.username}</strong></span>
                        <span>Pass: <strong className="text-slate-300">{acc.pass}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleSelectPreset(acc, false)}
                          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                        >
                          Prefill Form
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                Auth Gate: Active
              </span>
              <span>HMAC-SHA256 Token Session</span>
            </div>
          </div>

          {/* Right Column: Active Login Form */}
          <div className="lg:col-span-6 flex flex-col justify-center bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">Supervisory Portal Login</h2>
              <p className="text-sm text-slate-400 mt-1">
                Enter your authorized credentials to establish an authenticated supervisory session.
              </p>
            </div>

            {resetSuccessNotice && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3 animate-fadeIn">
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-200">Credentials Updated Successfully</p>
                  <p className="text-xs leading-relaxed text-emerald-300/90">{resetSuccessNotice}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-shake">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-200">Authentication Failed</p>
                  <p className="text-xs leading-relaxed text-rose-300/90">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  Username or Official Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (resetSuccessNotice) setResetSuccessNotice(null);
                    }}
                    placeholder="e.g. lead.examiner or examiner@satsa.gov.in"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    Passcode / Security Token
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setIsForgotPasswordOpen(true);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors hover:underline flex items-center gap-1 font-mono"
                  >
                    <KeyRound className="h-3 w-3" />
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (resetSuccessNotice) setResetSuccessNotice(null);
                    }}
                    placeholder="Enter secure password"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 h-3.5 w-3.5"
                  />
                  <span>Enforce Token Persistence (24h)</span>
                </label>
                <span className="text-indigo-400/80 hover:text-indigo-300 font-mono text-[11px]">
                  TLS 1.3 / Strict Origin
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm tracking-wide transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials & Permissions...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Authenticate & Access Workspace</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-500 leading-normal">
                Notice: All supervisory activities, session tokens, analytical evaluations, and regulatory queries are 
                permanently logged in the append-only cryptographic audit ledger in accordance with statutory guidelines.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Forgot Password Security Protocol Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialIdentifier={username}
        onPasswordResetSuccess={(updatedUser, newPass) => {
          setUsername(updatedUser);
          setPassword(newPass);
          setResetSuccessNotice(`Your password has been securely updated for ${updatedUser}. Click "Authenticate & Access Workspace" to log in.`);
          setError(null);
        }}
      />

      {/* Footer */}
      <div className="bg-slate-950 border-t border-slate-900 px-4 py-3 text-center text-xs text-slate-400 font-mono">
        National Cyber Coordination & Supervisory Analytics Architecture &bull; Official Use Only
      </div>
    </div>
  );
};
