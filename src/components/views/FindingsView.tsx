import React, { useState } from 'react';
import { SupervisoryFinding } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import { Search, Filter, ArrowUpDown, ArrowRight, ShieldAlert } from 'lucide-react';

interface Props {
  findings: SupervisoryFinding[];
  onSelectFinding: (finding: SupervisoryFinding) => void;
  initialCategoryFilter?: string;
  initialSeverityFilter?: string;
  initialEntityFilter?: string;
}

export const FindingsView: React.FC<Props> = ({
  findings,
  onSelectFinding,
  initialCategoryFilter = 'ALL',
  initialSeverityFilter = 'ALL',
  initialEntityFilter = 'ALL'
}) => {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState(initialEntityFilter);
  const [severityFilter, setSeverityFilter] = useState(initialSeverityFilter);
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timePeriodFilter, setTimePeriodFilter] = useState<'ALL' | '24H' | '7D' | '30D' | 'QUARTER'>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'severity' | 'newest' | 'oldest'>('priority');

  const entities = Array.from(new Set(findings.map(f => f.entityName)));

  // Filter logic
  const filtered = findings.filter(f => {
    if (entityFilter !== 'ALL' && f.entityName !== entityFilter && f.entityId !== entityFilter) return false;
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (categoryFilter !== 'ALL' && f.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (statusFilter !== 'ALL' && f.reviewStatus !== statusFilter) return false;

    if (timePeriodFilter !== 'ALL') {
      const findingTime = new Date(f.createdAt).getTime();
      const now = Date.now();
      const diffHours = (now - findingTime) / (1000 * 60 * 60);
      if (timePeriodFilter === '24H' && diffHours > 24) return false;
      if (timePeriodFilter === '7D' && diffHours > 168) return false;
      if (timePeriodFilter === '30D' && diffHours > 720) return false;
      if (timePeriodFilter === 'QUARTER' && diffHours > 2160) return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const match =
        f.id.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.entityName.toLowerCase().includes(q) ||
        f.caseNumber.toLowerCase().includes(q) ||
        f.whatHappened.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sort logic
  filtered.sort((a, b) => {
    if (sortBy === 'priority') return b.priorityScore - a.priorityScore;
    if (sortBy === 'severity') {
      const weights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return weights[b.severity] - weights[a.severity];
    }
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return 0;
  });

  const categories = Array.from(new Set(findings.map(f => f.category)));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span>Supervisory Findings & Signals Repository</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Deterministic rule triggers, negative-space gaps, and behavioral anomaly signals under supervisory review.
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          Showing {filtered.length} of {findings.length} Signals
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID, title, entity, case, or keyword..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-red-600 focus:outline-none"
            />
          </div>

          {/* Entity Filter */}
          <div>
            <select
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-red-600 focus:outline-none"
            >
              <option value="ALL">All Entities ({entities.length})</option>
              {entities.map(ent => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          {/* Time Period Filter */}
          <div>
            <select
              value={timePeriodFilter}
              onChange={e => setTimePeriodFilter(e.target.value as any)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-red-600 focus:outline-none"
            >
              <option value="ALL">All Time Periods</option>
              <option value="24H">Past 24 Hours</option>
              <option value="7D">Past 7 Days</option>
              <option value="30D">Past 30 Days</option>
              <option value="QUARTER">Current Quarter (90D)</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-red-600 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-red-600 focus:outline-none"
            >
              <option value="priority">Priority Score (High-Low)</option>
              <option value="severity">Severity</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Findings List Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-mono text-[11px] uppercase">
                <th className="py-3 px-4">Finding ID</th>
                <th className="py-3 px-4">Regulated Entity</th>
                <th className="py-3 px-4">Case #</th>
                <th className="py-3 px-4">Supervisory Signal</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Priority Score</th>
                <th className="py-3 px-4">Evidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 font-sans">
              {filtered.map(f => (
                <tr
                  key={f.id}
                  onClick={() => onSelectFinding(f)}
                  className="hover:bg-zinc-900/60 cursor-pointer transition"
                >
                  <td className="py-3 px-4 font-mono font-medium text-zinc-300">{f.id}</td>
                  <td className="py-3 px-4 font-medium text-zinc-200">{f.entityName}</td>
                  <td className="py-3 px-4 font-mono text-zinc-400">{f.caseNumber}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-zinc-100">{f.title}</div>
                    <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{f.whatHappened}</div>
                  </td>
                  <td className="py-3 px-4">
                    <CategoryBadge category={f.category} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <SeverityBadge severity={f.severity} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-red-300">
                    {f.priorityScore} <span className="text-[10px] text-zinc-500 font-normal">({f.priorityLevel})</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {f.evidenceStrength}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        f.reviewStatus === 'CONFIRMED'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : f.reviewStatus === 'REJECTED'
                          ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          : f.reviewStatus === 'NEEDS_EVIDENCE'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                      }`}
                    >
                      {f.reviewStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelectFinding(f);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-zinc-500 text-xs">
                    No supervisory findings matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
