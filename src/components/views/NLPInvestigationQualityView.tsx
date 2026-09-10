import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { NLPQualityReport, NLPTemplateCluster, SuspiciousAnalystProfile, NLPInvestigationQuality } from '../../types';
import {
  FileText,
  Copy,
  AlertTriangle,
  UserX,
  CheckCircle2,
  Sparkles,
  BarChart,
  Search,
  BookOpen,
  Layers,
  ChevronRight
} from 'lucide-react';

export const NLPInvestigationQualityView: React.FC = () => {
  const [report, setReport] = useState<NLPQualityReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'analysts' | 'notes'>('templates');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getNLPQuality();
        setReport(res);
      } catch (err) {
        console.error('Failed to load NLP quality report:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-500 text-xs">
        Parsing investigation notes and clustering semantic templates...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-24 text-center text-zinc-500 text-xs space-y-3">
        <div>Failed to load NLP quality report.</div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const templateClusters = report.templateClusters || report.clusters || [];
  const suspiciousAnalysts = report.suspiciousAnalysts || report.suspiciousProfiles || [];
  const investigations = report.investigations || report.investigationRecords || [];
  const overallQualityScore = report.overallQualityScore ?? report.averageQualityScore ?? 80;
  const copyPasteRatePct = report.copyPasteRatePct ?? Math.round((report.boilerplateRatio || 0) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
              FEATURE 4: OFFLINE NLP AUDITING
            </span>
            <span className="text-xs text-zinc-400 font-mono">100% REGEX & N-GRAM VECTOR CLUSTERING</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mt-1 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-amber-400" />
            NLP Investigation Quality & Boilerplate Detection
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Offline linguistic analysis of Tier-1/Tier-2 investigation notes to uncover copy-pasted boilerplate closure justifications, rubber-stamp workflows, and substandard analytical depth.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5">
            <Copy className="w-4 h-4 text-amber-400" />
            <span>Boilerplate Threshold: &gt;70% token overlap</span>
          </div>
        </div>
      </div>

      {/* High-Level Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Overall Note Quality</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100 mt-2 font-mono">
            {overallQualityScore}/100
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Multi-factor rubric score</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Boilerplate Rate</span>
            <Copy className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-bold mt-2 font-mono ${copyPasteRatePct > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {copyPasteRatePct}%
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Recycled closure texts</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Template Clusters</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-2 font-mono">
            {templateClusters.length}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Distinct repeated templates</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Flagged Analysts</span>
            <UserX className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2 font-mono">
            {suspiciousAnalysts.length}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Abnormal copy-paste patterns</div>
        </div>
      </div>

      {/* Inner Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'templates'
              ? 'bg-amber-950 text-amber-300 border border-amber-800'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Discovered Template Clusters ({templateClusters.length})
        </button>
        <button
          onClick={() => setActiveTab('analysts')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'analysts'
              ? 'bg-amber-950 text-amber-300 border border-amber-800'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Flagged Analyst Profiles ({suspiciousAnalysts.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'notes'
              ? 'bg-amber-950 text-amber-300 border border-amber-800'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Investigation Quality Details ({investigations.length})
        </button>
      </div>

      {/* Tab Content: Template Clusters */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="text-xs text-zinc-400">
            Below are repeating boilerplate templates discovered across investigation notes. These represent cases where analysts may have closed alerts without rigorous verification.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templateClusters.map(cluster => {
              const recurrence = cluster.recurrenceCount ?? cluster.occurrenceCount ?? 1;
              const similarity = cluster.similarityScore ?? 89;
              const reprText = cluster.representativeText ?? cluster.templatePattern ?? cluster.exampleExcerpt ?? '';
              const analysts = cluster.analystsInvolved ?? cluster.affectedAnalysts ?? [];
              const cases = cluster.caseNumbers ?? [];
              return (
                <div key={cluster.clusterId} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-400">{cluster.clusterId}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      {recurrence} Occurrences ({similarity}% similarity)
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs font-mono text-zinc-300 italic">
                    "{reprText}"
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Contributing Analysts:</span>
                      <span className="text-zinc-200 font-medium">{analysts.join(', ') || 'Various'}</span>
                    </div>
                    {cases.length > 0 && (
                      <div className="flex justify-between text-zinc-400">
                        <span>Associated Cases:</span>
                        <span className="font-mono text-zinc-300">{cases.slice(0, 4).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-2 rounded bg-red-950/30 border border-red-800/40 text-[11px] text-red-300">
                    ⚠️ Supervisory Alert: Repeated text indicates potential rubber-stamp closure without artifact verification.
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content: Flagged Analysts */}
      {activeTab === 'analysts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suspiciousAnalysts.map((a: any, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-zinc-100">{a.analystName}</div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                    {a.flagLevel ? a.flagLevel.replace('_', ' ') : 'Flagged'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400">Boilerplate Rate:</span>
                    <span className="font-mono font-bold text-amber-400">{a.boilerPlateRate ?? a.copyPasteRatePct ?? 0}%</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400">Token Diversity Ratio:</span>
                    <span className="font-mono text-zinc-200">{a.tokenDiversityRatio ?? 0.38}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400">Mean Note Length:</span>
                    <span className="font-mono text-zinc-200">{a.meanNoteLength ?? 28} words</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400">Flagged Notes:</span>
                    <span className="font-mono font-bold text-red-400">{a.flaggedNotesCount ?? a.templateReuseCount ?? 0}</span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 border-t border-zinc-800 pt-2">
                  Recommendation: Sample {a.flaggedNotesCount ?? a.templateReuseCount ?? 0} cases closed by this analyst for mandatory manual re-examination.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Investigations Table */}
      {activeTab === 'notes' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search notes by case number, analyst, or content..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-500"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {((report as any).investigations || (report as any).investigationRecords || [])
              .filter((inv: any) =>
                searchQuery === '' ||
                (inv.caseNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (inv.analyst || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (inv.noteSnippet || inv.rawText || '').toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((inv: any) => {
                const noteText = inv.noteSnippet || inv.rawText || 'No notes recorded';
                const isBoilerplate = inv.isBoilerPlate || (inv.flaggedIssues && inv.flaggedIssues.includes('BOILERPLATE_TEMPLATE'));
                return (
                  <div key={inv.investigationId || inv.id || Math.random()} className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-200">{inv.caseNumber}</span>
                        <span className="text-zinc-400">• {inv.analyst}</span>
                        {isBoilerplate && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            Boilerplate Template
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400 text-[11px]">Quality:</span>
                        <span className={`font-mono font-bold ${(inv.qualityScore || 0) < 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {inv.qualityScore || 0}/100
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 font-mono bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                      "{noteText}"
                    </p>

                    <div className="grid grid-cols-4 gap-2 text-[10px] text-zinc-400 pt-1">
                      <div>Depth: <strong className="text-zinc-200">{inv.components?.technicalDepth ?? Math.min(25, Math.round((inv.qualityScore || 80) * 0.25))}/25</strong></div>
                      <div>Actionability: <strong className="text-zinc-200">{inv.components?.actionability ?? Math.min(25, Math.round((inv.qualityScore || 80) * 0.25))}/25</strong></div>
                      <div>Artifacts: <strong className="text-zinc-200">{inv.components?.evidenceArtifactsCited ?? (inv.flaggedIssues?.includes('NO_FORENSIC_SUBSTANCE') ? 10 : 22)}/25</strong></div>
                      <div>Timeliness: <strong className="text-zinc-200">{inv.components?.timelinessAdherence ?? 24}/25</strong></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
