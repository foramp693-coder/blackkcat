import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DynamicSupervisoryAlert, DynamicPolicyRule } from '../../types';
import {
  Bell,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Lock,
  RefreshCw,
  Clock,
  FileCheck2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const SupervisoryAlertsView: React.FC = () => {
  const [alerts, setAlerts] = useState<DynamicSupervisoryAlert[]>([]);
  const [policyRules, setPolicyRules] = useState<DynamicPolicyRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'POLICIES'>('ALERTS');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const loadData = async (isManual: boolean = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.getSupervisoryAlerts();
      if (res && res.alerts) {
        setAlerts(res.alerts);
        setPolicyRules(res.rules || []);
      }
    } catch (err) {
      console.error('Failed to load dynamic supervisory alerts:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcknowledge = async (id: string) => {
    // Optimistic UI update
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    try {
      await api.acknowledgeSupervisoryAlert(id);
    } catch (err) {
      console.error(`Failed to acknowledge alert ${id}:`, err);
    }
  };

  const handleToggleRule = async (id: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    // Optimistic update
    setPolicyRules(prev => prev.map(r => r.id === id ? { ...r, enabled: newEnabled } : r));
    try {
      const res = await api.togglePolicyRule(id, newEnabled);
      if (res && res.allRules) {
        setPolicyRules(res.allRules);
      }
      // Refresh alerts as rule toggle changes evaluations
      const updatedAlerts = await api.getSupervisoryAlerts();
      if (updatedAlerts && updatedAlerts.alerts) {
        setAlerts(updatedAlerts.alerts);
      }
    } catch (err) {
      console.error(`Failed to toggle policy rule ${id}:`, err);
    }
  };

  const filteredAlerts = alerts.filter(a => filterSeverity === 'ALL' || a.severity === filterSeverity);
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
              FEATURE 22: CONTINUOUS SUPERVISORY GUARDRAILS
            </span>
            <span className="text-xs text-zinc-400 font-mono">DYNAMIC POLICY ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mt-1 flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-amber-400" />
            Supervisory Alerting & Policy Enforcement Engine
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Live dynamic evaluation of statutory thresholds (Escalation SLAs, forensic evidence sufficiency, NLP quality, and dual review gates) across active critical sector entity telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Re-evaluate all statutory policy rules against current database state"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>Re-evaluate</span>
          </button>

          {/* Tab Toggle */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('ALERTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'ALERTS'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Active Alerts</span>
              {unacknowledgedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unacknowledgedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('POLICIES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'POLICIES'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Policy Rules ({policyRules.length})</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-500 font-mono text-xs flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
          <span>Evaluating dynamic supervisory policies across critical entities...</span>
        </div>
      ) : activeTab === 'ALERTS' ? (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 font-medium">Total Evaluated Alerts</div>
              <div className="text-xl font-bold text-zinc-100 mt-1 font-mono">{alerts.length}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Continuous automated audit</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-red-900/40">
              <div className="text-[11px] text-red-400 font-medium">Unacknowledged Breaches</div>
              <div className="text-xl font-bold text-red-300 mt-1 font-mono">{unacknowledgedCount}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Requires supervisory action</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 font-medium">Active Policy Gates</div>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                {policyRules.filter(r => r.enabled).length} / {policyRules.length}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Statutory rules armed</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 font-medium">Statutory Framework</div>
              <div className="text-xs font-bold text-amber-300 mt-2 font-mono">CERT-In / NCIIPC</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">ISO 27037 & RBI Aligned</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-mono uppercase">Filter Severity:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    filterSeverity === sev
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div className="text-xs text-zinc-400 font-mono">
              Showing {filteredAlerts.length} Alerts
            </div>
          </div>

          {/* Alert Cards */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-zinc-300">All Statutory Policies Fully Compliant</p>
                <p className="text-xs text-zinc-500 mt-1">No policy breaches detected for the selected filter.</p>
              </div>
            ) : (
              filteredAlerts.map(alt => (
                <div
                  key={alt.id}
                  className={`p-4 rounded-xl border transition-all ${
                    !alt.acknowledged
                      ? 'bg-zinc-900/90 border-amber-800/80 shadow-lg ring-1 ring-amber-700/30'
                      : 'bg-zinc-950 border-zinc-800/80 opacity-75'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        alt.severity === 'CRITICAL'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : alt.severity === 'HIGH'
                          ? 'bg-orange-950 text-orange-300 border border-orange-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {alt.severity}
                      </span>
                      <span className="font-mono text-xs font-bold text-zinc-400">{alt.id}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-xs text-zinc-200 font-bold">{alt.title}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        {new Date(alt.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px]">
                        {alt.ruleCode}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-300 mt-2 leading-relaxed">{alt.description}</div>

                  {alt.evidenceSummary && (
                    <div className="mt-2 text-[11px] font-mono text-amber-300/90 bg-amber-950/30 px-2.5 py-1 rounded border border-amber-900/40">
                      Metric Evaluation: {alt.evidenceSummary}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-zinc-800 text-xs">
                    <div className="flex items-center gap-2 text-zinc-400 flex-wrap">
                      <span>Entity: <strong className="text-zinc-200">{alt.entityName}</strong></span>
                      <span>• Case: <strong className="font-mono text-zinc-200">{alt.caseNumber}</strong></span>
                      <span className="text-zinc-600 hidden sm:inline">|</span>
                      <span className="text-zinc-500 text-[11px] font-mono">{alt.statutoryMandate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {alt.acknowledged ? (
                        <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged by Lead Examiner
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledge(alt.id)}
                          className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow"
                        >
                          Acknowledge & Flag Case
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Policy Rules Section */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-zinc-100">Deterministic Statutory Enforcement Gates</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                Rules dynamically intercept triage, SLA escalation, forensic attachments, and closure notes. Toggling rules immediately recalculates active non-compliance findings across all monitored Critical Sector Entities.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policyRules.map(rule => (
              <div
                key={rule.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  rule.enabled
                    ? 'bg-zinc-900/80 border-zinc-700'
                    : 'bg-zinc-950 border-zinc-900 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800">
                      {rule.code}
                    </span>
                    <h3 className="text-xs font-bold text-zinc-100">{rule.name}</h3>
                  </div>

                  <button
                    onClick={() => handleToggleRule(rule.id, rule.enabled)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase transition-colors ${
                      rule.enabled
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{rule.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs font-mono">
                  <span className="text-zinc-500">Threshold: <strong className="text-zinc-200">{rule.threshold}</strong></span>
                  <span className="text-amber-400 text-[10px]">{rule.statutoryMandate}</span>
                </div>

                {rule.activeViolationsCount > 0 && (
                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-red-400">
                    <span>Violations in Current Cohort:</span>
                    <span className="font-bold">{rule.activeViolationsCount} Cases</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
