import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  ChevronRight,
  Lock
} from 'lucide-react';
import { api } from '../../services/api';
import { EnterpriseEngineDefinition, UserRole } from '../../types';

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
  const { user, hasRole } = useAuth();
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

  // Define tab restrictions
  // If allowedRoles is omitted, all authenticated roles can access
  interface NavItemDef {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
    count?: number;
    countHighlight?: boolean;
    highlight?: boolean;
    allowedRoles?: UserRole[];
  }

  const allNavItems: NavItemDef[] = [
    {
      id: 'dashboard',
      label: user?.role === 'Lead Examiner' ? 'Supervisory Dashboard' :
             user?.role === 'SOC Supervisor' ? 'Operational Dashboard' :
             'Compliance Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'enterprise-engines',
      label: '25 Enterprise Engines',
      icon: Cpu,
      badge: '25 Active',
      highlight: true,
      allowedRoles: ['Lead Examiner']
    },
    {
      id: 'smart-sample',
      label: 'Smart Examiner Sampling',
      icon: Layers,
      badge: 'ISO 19011',
      allowedRoles: ['Lead Examiner']
    },
    {
      id: 'findings',
      label: user?.role === 'SOC Supervisor' ? 'Operational Findings' : 'Supervisory Findings',
      icon: AlertOctagon,
      count: totalFindingsCount
    },
    {
      id: 'review-queue',
      label: user?.role === 'SOC Supervisor' ? 'Operational Inquiries' : 'Examiner Review Queue',
      icon: CheckSquare,
      count: pendingReviewCount,
      countHighlight: true,
      allowedRoles: ['Lead Examiner', 'SOC Supervisor']
    },
    {
      id: 'fingerprint',
      label: 'SOC Behaviour Fingerprint',
      icon: Fingerprint,
      allowedRoles: ['Lead Examiner', 'Auditor']
    },
    {
      id: 'timeline',
      label: 'Assessment Timeline',
      icon: Calendar,
      badge: 'Drift'
    },
    {
      id: 'negative-space',
      label: 'Negative Space Matrix',
      icon: Grid,
      badge: 'L3 Only',
      allowedRoles: ['Lead Examiner']
    },
    {
      id: 'assistant',
      label: 'Evidence AI Assistant',
      icon: Sparkles,
      badge: 'Offline'
    },
    {
      id: 'entities',
      label: user?.role === 'SOC Supervisor' ? 'Assigned Entities (4)' : 'Critical Entities',
      icon: Building2
    },
    {
      id: 'analytics',
      label: 'Workflow & Statistics',
      icon: BarChart3
    },
    {
      id: 'reports',
      label: user?.role === 'Auditor' ? 'Audit Dossier Export' : 'Assessment Dossier',
      icon: FileCheck2
    },
    {
      id: 'audit-logs',
      label: user?.role === 'SOC Supervisor' ? 'Operational Audit Trail' : 'Statutory Audit Trail',
      icon: History,
      badge: user?.role === 'Auditor' ? 'Verified' : undefined
    }
  ];

  // Filter items or show locked indicator
  const visibleNavItems = allNavItems.filter(item => {
    if (!item.allowedRoles) return true;
    if (!user) return false;
    return item.allowedRoles.includes(user.role);
  });

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between py-4 px-3 flex-shrink-0 overflow-y-auto max-h-screen">
      <div className="space-y-4">
        {/* Core Navigation Section */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center justify-between">
            <span>Navigation ({user?.role?.split(' ')[0]})</span>
            <span className="text-slate-600">{user?.accessLevel}</span>
          </div>

          <div className="space-y-0.5">
            {visibleNavItems.map(item => {
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
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? (item.highlight ? 'text-indigo-400' : 'text-amber-400') : 'text-slate-500'}`} />
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
                          ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
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
        <div className="pt-2 border-t border-slate-900">
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
            <div className="space-y-0.5 max-h-[360px] overflow-y-auto pr-1">
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
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-mono font-bold text-slate-500 w-4 text-left">
                        {engine.number.toString().padStart(2, '0')}
                      </span>
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
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

      {/* Footer Classification & Role Badge */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-slate-400 mt-4 font-mono text-[10px]">
        <div className="flex items-center justify-between mb-1 text-slate-300 font-semibold">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>RBAC Protected</span>
          </div>
          <span className="text-emerald-400">JWT 24H</span>
        </div>
        <p className="text-slate-500 leading-tight">
          Authenticated: {user?.username} ({user?.accessLevel})
        </p>
      </div>
    </aside>
  );
};
