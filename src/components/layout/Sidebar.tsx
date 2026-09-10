import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  AlertOctagon,
  CheckSquare,
  Grid,
  FileCheck2,
  History,
  Shield,
  Layers,
  Fingerprint,
  Calendar,
  Sparkles,
  Zap,
  Users,
  FileText,
  Network,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Bell,
  Database,
  GitFork,
  Cpu,
  BrainCircuit,
  TrendingUp,
  Activity,
  Award,
  Bot,
  EyeOff,
  FileCheck,
  CheckCircle2,
  GitBranch,
  Share2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { EnterpriseEngineDefinition } from '../../types';

export type NavTab =
  | 'dashboard'
  | 'smart-sample'
  | 'fingerprint'
  | 'timeline'
  | 'assistant'
  | 'negative-space'
  | 'findings'
  | 'review-queue'
  | 'entities'
  | 'analytics'
  | 'reports'
  | 'audit-logs'
  // Enterprise Analytics Engines
  | 'enterprise-engines'
  | 'ai-anomalies'
  | 'peer-benchmarks'
  | 'nlp-quality'
  | 'knowledge-graph'
  | 'timeline-replay'
  | 'soc-health'
  | 'mitre-matrix'
  | 'digital-twin'
  | 'supervisory-alerts'
  | 'data-validation'
  | 'process-mining';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingReviewCount: number;
  totalFindingsCount: number;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  BrainCircuit,
  BarChart2: BarChart3,
  BarChart3,
  Layers,
  FileText,
  Clock,
  ShieldAlert,
  Share2,
  History,
  GitBranch,
  Sparkles,
  Activity,
  Award,
  ShieldCheck,
  TrendingUp,
  Sliders,
  Bot,
  EyeOff,
  Fingerprint,
  FileCheck,
  Bell,
  CheckCircle2,
  Network,
  GitFork,
  Cpu,
  Zap,
  Users,
  Database
};

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  pendingReviewCount,
  totalFindingsCount
}) => {
  const [dynamicEngines, setDynamicEngines] = useState<EnterpriseEngineDefinition[]>([]);
  const [enginesExpanded, setEnginesExpanded] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    api.getEnterpriseEngines()
      .then(res => {
        if (isMounted && res && res.engines) {
          setDynamicEngines(res.engines);
        }
      })
      .catch(err => console.error('Sidebar engine load error:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  const coreNavItems = [
    { id: 'dashboard' as NavTab, label: 'Supervisory Dashboard', icon: LayoutDashboard },
    { id: 'enterprise-engines' as NavTab, label: '25 Enterprise Engines', icon: Cpu, badge: '25 Active', highlight: true },
    { id: 'smart-sample' as NavTab, label: 'Smart Examiner Sampling', icon: Layers, badge: 'ISO 19011' },
    { id: 'findings' as NavTab, label: 'Supervisory Findings', icon: AlertOctagon, count: totalFindingsCount },
    { id: 'review-queue' as NavTab, label: 'Examiner Review Queue', icon: CheckSquare, count: pendingReviewCount, countHighlight: true },
    { id: 'fingerprint' as NavTab, label: 'SOC Behaviour Fingerprint', icon: Fingerprint },
    { id: 'timeline' as NavTab, label: 'Assessment Timeline', icon: Calendar, badge: 'Drift' },
    { id: 'negative-space' as NavTab, label: 'Negative Space Matrix', icon: Grid, badge: 'Signature' },
    { id: 'assistant' as NavTab, label: 'Evidence AI Assistant', icon: Sparkles, badge: 'Offline' },
    { id: 'entities' as NavTab, label: 'Critical Entities', icon: Building2 },
    { id: 'analytics' as NavTab, label: 'Workflow & Statistics', icon: BarChart3 },
    { id: 'reports' as NavTab, label: 'Assessment Dossier', icon: FileCheck2 },
    { id: 'audit-logs' as NavTab, label: 'Supervisory Audit Trail', icon: History }
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between py-4 px-3 flex-shrink-0 overflow-y-auto max-h-screen">
      <div className="space-y-4">
        {/* Core Navigation Section */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Supervisory Oversight
          </div>

          <div className="space-y-0.5">
            {coreNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? item.highlight
                        ? 'bg-indigo-950/80 text-indigo-100 border border-indigo-700 shadow-sm'
                        : 'bg-zinc-800/90 text-zinc-100 border border-zinc-700 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? (item.highlight ? 'text-indigo-400' : 'text-red-400') : 'text-zinc-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.highlight
                        ? 'bg-indigo-900 text-indigo-200 border border-indigo-600/70 font-mono'
                        : 'bg-indigo-950 border border-indigo-700/60 text-indigo-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}

                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.countHighlight
                          ? 'bg-red-950 text-red-300 border border-red-700/60'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic 25 Enterprise Engines Section */}
        <div className="pt-2 border-t border-zinc-900">
          <div
            onClick={() => setEnginesExpanded(!enginesExpanded)}
            className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center justify-between cursor-pointer select-none hover:text-indigo-300"
          >
            <div className="flex items-center gap-1.5">
              <span>Dynamic Engines ({dynamicEngines.length || 25})</span>
              {enginesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>
            <span className="text-[9px] font-mono text-emerald-400">ONLINE</span>
          </div>

          {enginesExpanded && (
            <div className="space-y-0.5 max-h-[380px] overflow-y-auto pr-1">
              {dynamicEngines.map(engine => {
                const Icon = ICON_MAP[engine.icon] || Cpu;
                const isActive = activeTab === engine.tabId;

                return (
                  <button
                    key={engine.id}
                    onClick={() => onSelectTab(engine.tabId as NavTab)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-950/70 text-indigo-200 border border-indigo-700 shadow-sm font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-mono font-bold text-zinc-500 w-4 text-left">
                        {engine.number.toString().padStart(2, '0')}
                      </span>
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      <span className="truncate text-[11px]">{engine.shortName}</span>
                    </div>

                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 ml-1" title="Dynamic Engine Active" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Core Principle */}
      <div className="rounded-lg border border-zinc-850 bg-zinc-900/60 p-3 text-zinc-400 mt-4">
        <div className="flex items-center gap-2 mb-1 text-zinc-300 font-semibold text-xs">
          <Shield className="w-3.5 h-3.5 text-red-400" />
          <span>Air-Gapped SIH26157</span>
        </div>
        <p className="text-[10px] leading-relaxed text-zinc-500">
          25 enterprise engines computed 100% dynamically on-premise. Zero cloud telemetry egress.
        </p>
      </div>
    </aside>
  );
};
