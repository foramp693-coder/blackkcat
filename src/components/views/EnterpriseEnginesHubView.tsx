import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { EnterpriseEngineDefinition } from '../../types';
import {
  Cpu,
  RefreshCw,
  Search,
  Filter,
  Play,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Zap,
  Layers,
  BrainCircuit,
  FileText,
  Clock,
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
  BarChart3,
  Bell,
  GitFork,
  Network
} from 'lucide-react';
import { NavTab } from '../layout/Sidebar';

interface Props {
  onNavigateTab: (tab: NavTab) => void;
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
  GitFork
};

export const EnterpriseEnginesHubView: React.FC<Props> = ({ onNavigateTab }) => {
  const [engines, setEngines] = useState<EnterpriseEngineDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningEngineId, setRunningEngineId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadEngines = async () => {
    try {
      const res = await api.getEnterpriseEngines();
      if (res && res.engines) {
        setEngines(res.engines);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to load enterprise engines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEngines();
  }, []);

  const handleRunEngine = async (engineId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRunningEngineId(engineId);
    try {
      const res = await api.runEngine(engineId);
      if (res && res.allEngines) {
        setEngines(res.allEngines);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error(`Failed to run engine ${engineId}:`, err);
    } finally {
      setTimeout(() => {
        setRunningEngineId(null);
      }, 400);
    }
  };

  const categories = [
    { id: 'ALL', label: 'All 25 Engines' },
    { id: 'ANOMALY_DETECTION', label: 'Anomaly & Detection' },
    { id: 'BENCHMARKING', label: 'Benchmarking & Cohorts' },
    { id: 'INVESTIGATION_QUALITY', label: 'Investigation & NLP' },
    { id: 'FORENSIC_GRAPH', label: 'Forensic & Graphs' },
    { id: 'MATURITY_GOVERNANCE', label: 'Maturity & Governance' },
    { id: 'SIMULATION_PREDICTION', label: 'Simulation & AI' },
    { id: 'SUPERVISORY_CORE', label: 'Supervisory Core' },
    { id: 'PROCESS_MINING', label: 'Process Mining' },
    { id: 'INGESTION_INTEGRITY', label: 'Ingestion Integrity' }
  ];

  const filteredEngines = engines.filter(engine => {
    const matchesSearch =
      engine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      engine.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      engine.algorithm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      engine.statutoryStandard.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || engine.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              NATIONAL CYBER OVERSIGHT ARCHITECTURE
            </span>
            <span className="text-xs text-zinc-400 font-mono">25 ENTERPRISE ENGINES DIRECTORY</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mt-1 flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-indigo-400" />
            25 Enterprise Analytical & Supervisory Engines
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Complete dynamic catalog of air-gapped supervisory, forensic graph, behavioral profiling, and predictive intelligence engines operating in accordance with CERT-In and NCIIPC directives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
              Synchronized: {lastRefreshed}
            </span>
          )}
          <button
            onClick={loadEngines}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 font-medium">Enterprise Engines</div>
          <div className="text-2xl font-bold text-indigo-300 mt-1 font-mono">{engines.length || 25} Active</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">100% Air-Gapped Execution</div>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 font-medium">Compliance Standards</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">14 Standards</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">CERT-In, NCIIPC, ISO 27037/19011</div>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 font-medium">Orchestration Cycle</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">Continuous</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Automated Event-Driven Pipeline</div>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 font-medium">Engine Isolation</div>
          <div className="text-2xl font-bold text-zinc-100 mt-1 font-mono">Zero Egress</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Sovereign On-Premise Sandbox</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search engines by name, algorithm, or statutory standard..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of All 25 Dynamic Engines */}
      {loading ? (
        <div className="p-16 text-center text-zinc-500 font-mono text-xs flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Polling 25 Enterprise Engine telemetry and status metrics...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEngines.map(engine => {
            const IconComponent = ICON_MAP[engine.icon] || Cpu;
            const isRunning = runningEngineId === engine.id;

            return (
              <div
                key={engine.id}
                onClick={() => onNavigateTab(engine.tabId as NavTab)}
                className="group p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-900 hover:border-indigo-700/80 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden shadow-sm hover:shadow-md"
              >
                {/* Accent indicator line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-800 group-hover:bg-indigo-500 transition-colors" />

                <div>
                  {/* Top Bar: Number, Status & Category */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800">
                        #{engine.number.toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        {engine.category.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                        engine.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : engine.status === 'OPTIMAL'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        ● {engine.status}
                      </span>
                    </div>
                  </div>

                  {/* Engine Name and Icon */}
                  <div className="flex items-start gap-3 mt-3">
                    <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50 group-hover:border-indigo-600/50 transition-colors flex-shrink-0">
                      <IconComponent className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-zinc-100 group-hover:text-indigo-200 transition-colors truncate">
                        {engine.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {engine.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Algorithm & Statutory Standard */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 text-[11px]">
                  <div className="text-zinc-400">
                    <span className="text-zinc-500 font-mono text-[10px]">Algorithm: </span>
                    <span className="font-mono text-zinc-300 text-[10px]">{engine.algorithm}</span>
                  </div>
                  <div className="text-zinc-400">
                    <span className="text-zinc-500 font-mono text-[10px]">Mandate: </span>
                    <span className="text-amber-400 font-mono text-[10px]">{engine.statutoryStandard}</span>
                  </div>
                </div>

                {/* Bottom Dynamic Metric & Action Controls */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] text-zinc-500 font-medium">{engine.metrics.label}</div>
                    <div className="text-xs font-bold text-zinc-100 font-mono truncate">
                      {engine.metrics.value}
                    </div>
                    {engine.metrics.sublabel && (
                      <div className="text-[9px] text-zinc-400 truncate">{engine.metrics.sublabel}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => handleRunEngine(engine.id, e)}
                      disabled={isRunning}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-indigo-900/60 hover:border-indigo-700 text-zinc-300 hover:text-indigo-200 border border-zinc-700 text-[10px] font-semibold flex items-center gap-1 transition-all"
                      title="Trigger dynamic re-computation of this engine"
                    >
                      <Play className={`w-2.5 h-2.5 ${isRunning ? 'animate-spin text-indigo-400' : ''}`} />
                      <span>{isRunning ? 'Evaluating...' : 'Run'}</span>
                    </button>

                    <span className="p-1 rounded bg-zinc-800 text-zinc-400 group-hover:text-indigo-300 transition-colors">
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
