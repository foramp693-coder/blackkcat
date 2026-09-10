import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { KnowledgeGraphData, KnowledgeGraphNode, KnowledgeGraphEdge } from '../../types';
import {
  Share2,
  Filter,
  Search,
  Shield,
  AlertTriangle,
  Layers,
  User,
  Building,
  CheckCircle,
  FileCheck,
  ChevronRight,
  Info
} from 'lucide-react';

interface Props {
  onSelectFinding?: (finding: any) => void;
}

export const KnowledgeGraphView: React.FC<Props> = ({ onSelectFinding }) => {
  const [graph, setGraph] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<KnowledgeGraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [onlySuspicious, setOnlySuspicious] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getKnowledgeGraph();
        setGraph(res);
        if (res.nodes && res.nodes.length > 0) {
          const findingOrSuspicious = res.nodes.find(n => n.type === 'FINDING' || n.riskScore > 70) || res.nodes[0];
          setSelectedNode(findingOrSuspicious);
        }
      } catch (err) {
        console.error('Failed to load knowledge graph:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-500 text-xs">
        Constructing multidimensional supervisory knowledge graph...
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="py-24 text-center text-zinc-500 text-xs space-y-3">
        <div>Failed to load knowledge graph.</div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredNodes = (graph.nodes || []).filter(n => {
    const matchesType = filterType === 'ALL' || n.type === filterType;
    const matchesSuspicious = !onlySuspicious || (n.riskScore || 0) >= 60;
    const matchesSearch =
      searchQuery === '' ||
      (n.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSuspicious && matchesSearch;
  });

  const connectedEdges = selectedNode
    ? graph.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  const getNodeColor = (type: string, riskScore: number) => {
    if (type === 'FINDING') return 'bg-red-950 text-red-400 border-red-800';
    if (type === 'ALERT') return 'bg-amber-950 text-amber-400 border-amber-800';
    if (type === 'ANALYST') return 'bg-purple-950 text-purple-400 border-purple-800';
    if (type === 'ENTITY') return 'bg-blue-950 text-blue-400 border-blue-800';
    if (type === 'CONTROL') return 'bg-emerald-950 text-emerald-400 border-emerald-800';
    return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              FEATURE 7: RELATIONSHIP TRAVERSAL
            </span>
            <span className="text-xs text-zinc-400 font-mono">MULTI-ENTITY GRAPH ONTOLOGY</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mt-1 flex items-center gap-2.5">
            <Share2 className="w-7 h-7 text-cyan-400" />
            Supervisory Evidence Knowledge Graph
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Cross-entity semantic network interconnecting Alerts, Cases, Analysts, Assets, Regulatory Controls, and Findings to discover multi-hop causal chains and shadow relationships.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
            <input
              type="checkbox"
              checked={onlySuspicious}
              onChange={e => setOnlySuspicious(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-cyan-500 focus:ring-0"
            />
            <span>Highlight High-Risk Nodes</span>
          </label>
        </div>
      </div>

      {/* Filter and Control Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-zinc-400" />
          <span className="text-xs text-zinc-400">Node Type:</span>
          {['ALL', 'ENTITY', 'CASE', 'ALERT', 'ANALYST', 'FINDING', 'CONTROL'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                filterType === t
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2" />
          <input
            type="text"
            placeholder="Search node or entity..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-cyan-500 placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Graph Visual & Node Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Cluster Canvas Grid */}
        <div className="lg:col-span-2 bg-zinc-950 rounded-2xl border border-zinc-800 p-4 min-h-[500px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800/80 pb-2 mb-4">
              <span>Knowledge Graph Matrix ({filteredNodes.length} nodes, {graph.edges.length} relationships)</span>
              <span className="text-[11px] text-cyan-400 font-mono">Interactive Topology</span>
            </div>

            {/* Nodes Layout Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isConnected = selectedNode && connectedEdges.some(e => e.source === node.id || e.target === node.id);

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-zinc-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                        : isConnected
                        ? 'bg-cyan-950/20 border-cyan-800/80'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getNodeColor(node.type, node.riskScore)}`}>
                        {node.type}
                      </span>
                      {node.riskScore > 0 && (
                        <span className={`text-[10px] font-mono font-bold ${node.riskScore >= 70 ? 'text-red-400' : 'text-zinc-400'}`}>
                          {node.riskScore}
                        </span>
                      )}
                    </div>

                    <div className="font-semibold text-xs text-zinc-200 mt-2 truncate">
                      {node.label}
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                      {node.id}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Graph Legend */}
          <div className="border-t border-zinc-800/80 pt-3 mt-4 flex items-center justify-between flex-wrap gap-2 text-[11px] text-zinc-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Entity</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-400" /> Case</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Alert</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Analyst</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Finding</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Control</span>
            </div>
            <div className="text-[10px] text-zinc-500">Click any node to inspect semantic hops</div>
          </div>
        </div>

        {/* Selected Node Details Inspector */}
        <div className="lg:col-span-1 space-y-4">
          {selectedNode ? (
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getNodeColor(selectedNode.type, selectedNode.riskScore)}`}>
                    {selectedNode.type}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">Risk: {selectedNode.riskScore}/100</span>
                </div>
                <h3 className="text-base font-bold text-zinc-100 mt-2">{selectedNode.label}</h3>
                <div className="text-xs font-mono text-zinc-400 mt-0.5">{selectedNode.id}</div>
              </div>

              {/* Node Metadata Attributes */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Node Attributes
                </div>
                <div className="space-y-1.5 text-xs">
                  {Object.entries((selectedNode.metadata || selectedNode.details) || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800/80">
                      <span className="text-zinc-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-mono text-zinc-200 truncate max-w-[160px]">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Relationships (Edges) */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Connected Graph Edges ({connectedEdges.length})
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {connectedEdges.map((edge, idx) => {
                    const isSource = edge.source === selectedNode.id;
                    const neighborId = isSource ? edge.target : edge.source;
                    const neighborNode = graph.nodes.find(n => n.id === neighborId);

                    return (
                      <div
                        key={idx}
                        onClick={() => neighborNode && setSelectedNode(neighborNode)}
                        className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-cyan-700/60 cursor-pointer transition-all text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-400 font-mono text-[11px] font-bold">
                            {isSource ? `→ ${edge.relation || edge.label}` : `← ${edge.relation || edge.label}`}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Weight: {edge.weight ?? 1}</span>
                        </div>
                        <div className="font-medium text-zinc-200 mt-1 truncate">
                          {neighborNode?.label || neighborId}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Regulatory Audit Note */}
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300">
                💡 Supervisory Traversal: This node forms part of an evidence-substantiated audit chain. Hops can be cited directly in legal or supervisory show-cause notices.
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-zinc-500 text-xs">
              Select a node from the graph to inspect its relationship chains.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
