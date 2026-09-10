import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  User,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  Eye,
  EyeOff,
  HelpCircle,
  FileCheck2,
  Terminal
} from 'lucide-react';
import { api } from '../../services/api';
import { PasswordResetChallenge } from '../../types';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordResetSuccess: (username: string, newPassword: string) => void;
  initialIdentifier?: string;
}

type ResetStep = 'IDENTIFY' | 'CHALLENGE' | 'NEW_PASSWORD' | 'SUCCESS';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onPasswordResetSuccess,
  initialIdentifier = ''
}) => {
  const [step, setStep] = useState<ResetStep>('IDENTIFY');
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [challengeData, setChallengeData] = useState<PasswordResetChallenge | null>(null);
  const [code, setCode] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync initial identifier if modal opens with one
  useEffect(() => {
    if (isOpen) {
      if (initialIdentifier) setIdentifier(initialIdentifier);
      setStep('IDENTIFY');
      setError(null);
      setSuccessMessage(null);
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setAttemptsLeft(3);
    }
  }, [isOpen, initialIdentifier]);

  // Countdown timer for challenge expiry
  useEffect(() => {
    if (step !== 'CHALLENGE' || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setError('Security verification window expired. Please request a fresh challenge.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, secondsRemaining]);

  if (!isOpen) return null;

  // Real-time password validation indicators
  const hasMinLength = newPassword.length >= 10;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch;

  // Step 1: Request challenge
  const handleRequestChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please provide your registered Username or Official Email.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const data = await api.requestPasswordReset(identifier.trim());
      setChallengeData(data);
      setSecondsRemaining(data.expiresInSeconds || 600);
      setStep('CHALLENGE');
      setAttemptsLeft(3);
      if (data.demoOtp) {
        // Preload demo OTP for testing convenience
        setCode(data.demoOtp);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch security challenge. Please verify your identity identifier.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify challenge code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeData?.resetToken) {
      setError('Active session missing. Please restart identity verification.');
      return;
    }
    if (!code.trim() || code.trim().length !== 6) {
      setError('Please enter the 6-digit cryptographic verification code.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await api.verifyResetCode(challengeData.resetToken, code.trim());
      setStep('NEW_PASSWORD');
    } catch (err: any) {
      setError(err?.message || 'Invalid verification code.');
      if (err?.attemptsLeft !== undefined) {
        setAttemptsLeft(err.attemptsLeft);
      } else {
        setAttemptsLeft((prev) => Math.max(0, prev - 1));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeData?.resetToken) {
      setError('Active session missing. Please restart verification.');
      return;
    }
    if (!isPasswordValid) {
      setError('New password does not satisfy the statutory SOC complexity requirements.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.resetPassword(challengeData.resetToken, newPassword, confirmPassword);
      setSuccessMessage(res.message || 'Password credentials securely updated.');
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err?.message || 'Failed to update credentials. Please check criteria.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishAndLogin = () => {
    const updatedUser = challengeData ? identifier : 'lead.examiner';
    onPasswordResetSuccess(updatedUser, newPassword);
    onClose();
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/70 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                SOC Credential Recovery
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono">
                  Protocols: CERT-In 70B
                </span>
              </h3>
              <p className="text-xs text-slate-400">Multi-Factor Identity & Access Verification Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cancel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="px-6 pt-4 pb-2 bg-slate-950/30 border-b border-slate-800/60">
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div
              className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                step === 'IDENTIFY'
                  ? 'border-indigo-500 text-indigo-300 font-semibold'
                  : 'border-slate-800 text-slate-500'
              }`}
            >
              <span className="h-4 w-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center">1</span>
              <span>1. Identity</span>
            </div>
            <div
              className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                step === 'CHALLENGE'
                  ? 'border-indigo-500 text-indigo-300 font-semibold'
                  : step === 'NEW_PASSWORD' || step === 'SUCCESS'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-slate-800 text-slate-500'
              }`}
            >
              <span className="h-4 w-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center">2</span>
              <span>2. Security Challenge</span>
            </div>
            <div
              className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                step === 'NEW_PASSWORD' || step === 'SUCCESS'
                  ? 'border-indigo-500 text-indigo-300 font-semibold'
                  : 'border-slate-800 text-slate-500'
              }`}
            >
              <span className="h-4 w-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center">3</span>
              <span>3. New Password</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-shake font-sans">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Security Challenge Warning</p>
                <p className="mt-0.5 text-rose-300/90">{error}</p>
              </div>
            </div>
          )}

          {/* STEP 1: IDENTITY VERIFICATION */}
          {step === 'IDENTIFY' && (
            <form onSubmit={handleRequestChallenge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Username or Official Agency Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. lead.examiner or examiner@satsa.gov.in"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all font-mono"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Must be registered in the National Supervisory Audit Directory or Critical Sector Portal.
                </p>
              </div>

              {/* Demo Fast-Select Pills */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400 block mb-2">
                  Demonstration Examiner Accounts
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIdentifier('lead.examiner')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-mono transition-colors"
                  >
                    lead.examiner (Dr. Arunima Sen)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifier('soc.supervisor')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-mono transition-colors"
                  >
                    soc.supervisor (Rajeev Menon)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifier('auditor')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-mono transition-colors"
                  >
                    auditor (Sunita Rao)
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2 font-mono">
                <Shield className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Statutory Notice:</strong> Submitting this request triggers an ephemeral cryptographic security
                  token and records an entry in the immutable audit ledger.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating Challenge...</span>
                    </>
                  ) : (
                    <>
                      <span>Dispatch Security Challenge</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: SECURITY CHALLENGE / OTP VERIFICATION */}
          {step === 'CHALLENGE' && challengeData && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-mono text-slate-400">Target Officer:</span>
                  <span className="font-semibold text-white">{identifier}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-mono text-slate-400">Dispatched To:</span>
                  <span className="font-mono text-indigo-300">{challengeData.maskedEmail}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-mono text-slate-400">Time Window Remaining:</span>
                  <span className={`font-mono font-bold flex items-center gap-1 ${secondsRemaining < 60 ? 'text-rose-400' : 'text-amber-300'}`}>
                    <Clock className="h-3.5 w-3.5" />
                    {formatSeconds(secondsRemaining)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-mono text-slate-400">Attempts Remaining:</span>
                  <span className={`font-mono font-bold ${attemptsLeft <= 1 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {attemptsLeft} of 3
                  </span>
                </div>
              </div>

              {/* Simulated SOC Notification Banner for Demo */}
              {challengeData.demoOtp && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5 font-mono">
                  <Terminal className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-300">
                      [SUPERVISORY SIMULATION DISPATCH] One-Time Token (OTP):
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-base font-bold tracking-widest text-white px-2 py-0.5 rounded bg-slate-900 border border-amber-500/40">
                        {challengeData.demoOtp}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCode(challengeData.demoOtp || '')}
                        className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-medium transition-colors"
                      >
                        Autofill Code
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Enter 6-Digit Cryptographic Challenge Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 849201"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-base tracking-widest font-mono text-center transition-all"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Single-use token. Exceeding 3 failed attempts will trigger an automated security lockout.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('IDENTIFY')}
                  className="text-xs text-slate-400 hover:text-slate-200 underline font-mono"
                >
                  Change Account / Email
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || code.length !== 6 || attemptsLeft <= 0}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Security Token</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STEP 3: SET NEW PASSWORD */}
          {step === 'NEW_PASSWORD' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-center gap-2 font-mono">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Identity verified via cryptographic challenge. Specify your updated credentials.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  New Compliant Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all font-mono"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Compliance Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400 block mb-1">
                  SOC Access Control Regulatory Checklist (Section 70B)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Min 10 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Numeric digit (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Special character (!@#$...)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !isPasswordValid}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Authorize Password Update</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 'SUCCESS' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">Credentials Successfully Reset</h4>
                <p className="text-xs text-emerald-300 leading-relaxed">
                  {successMessage || 'Your new supervisory password is now active and enforced.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Identity:</span>
                  <span className="font-semibold text-white">{identifier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Audit Status:</span>
                  <span className="text-emerald-400">PASSWORD_RESET_COMPLETED (Immutable Log)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Session Security:</span>
                  <span className="text-slate-300">All previous tokens invalidated</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinishAndLogin}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
              >
                <span>Return to Sign In with New Credentials</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
