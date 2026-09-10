import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, XCircle, AlertTriangle, Info, Clock, ShieldCheck, X } from 'lucide-react';

interface Props {
  expectedWorkflow: string[];
  observedWorkflow: string[];
  caseNumber?: string;
  evidenceItems?: {
    stage?: string;
    timestamp?: string;
    sourceType?: string;
    description?: string;
  }[];
  className?: string;
}

export const WorkflowDiagram: React.FC<Props> = ({
  expectedWorkflow,
  observedWorkflow,
  caseNumber,
  evidenceItems = [],
  className = ''
}) => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const getStageMetadata = (stage: string) => {
    const isObserved = observedWorkflow.includes(stage);
    const relatedEvidence = evidenceItems.filter(e =>
      (e.stage && e.stage.toLowerCase() === stage.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(stage.toLowerCase()))
    );

    let expectedPolicy = 'Standard SOC operational baseline requires documented evidence and timestamped analyst action.';
    let examinerCheckpoint = 'Verify whether secondary channel (Slack, phone, ticketing bridge) contains the missing record.';

    switch (stage.toLowerCase()) {
      case 'alert':
      case 'detection':
        expectedPolicy = 'SIEM / EDR ingestion rule triggered with cryptographic hash and rule ID.';
        examinerCheckpoint = 'Inspect alert correlation rule and raw log capture integrity.';
        break;
      case 'triage':
        expectedPolicy = 'L1 Analyst assigns severity, tags assets, and performs initial false-positive elimination within 15 mins.';
        examinerCheckpoint = 'Check analyst notes to determine if initial triage was automated or manual.';
        break;
      case 'case':
        expectedPolicy = 'Formal security incident case created in ticketing system (Jira/ServiceNow/SOAR).';
        examinerCheckpoint = 'Verify case creation timestamp against alert detection timestamp.';
        break;
      case 'investigation':
        expectedPolicy = 'Enrichment, IOC lookup, host memory/process verification, and scoping.';
        examinerCheckpoint = 'Confirm whether forensic artifacts (PCAP, memory dump, host logs) were attached before closing.';
        break;
      case 'escalation':
        expectedPolicy = 'Mandatory routing to L2/L3 or CISO according to Severity Escalation Matrix.';
        examinerCheckpoint = 'CRITICAL: Check escalation approval signature. Missing escalation evidence is a high supervisory risk.';
        break;
      case 'containment':
        expectedPolicy = 'Host isolation, credential revocation, or firewall block documented with timestamp.';
        examinerCheckpoint = 'Confirm whether containment was verified before moving to recovery.';
        break;
      case 'resolution':
      case 'closure':
        expectedPolicy = 'Root cause identified, closure summary written, signed off by Tier 2 or SOC Lead.';
        examinerCheckpoint = 'Inspect rapid closures under 2 minutes for premature ticket closure patterns.';
        break;
    }

    return {
      isObserved,
      relatedEvidence,
      expectedPolicy,
      examinerCheckpoint
    };
  };

  return (
    <div className={`space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 ${className}`}>
      {/* Expected Sequence */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Expected Standard SOC Workflow
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">Prescribed Operational Baseline</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {expectedWorkflow.map((stage, idx) => (
            <React.Fragment key={`exp-${stage}-${idx}`}>
              <div
                onClick={() => setSelectedStage(stage)}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-950/40 border border-emerald-700/50 hover:border-emerald-500 text-emerald-300 text-xs font-medium shadow-sm transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{stage}</span>
              </div>
              {idx < expectedWorkflow.length - 1 && (
                <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-800/80 my-2" />

      {/* Observed Sequence */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Observed Operational Workflow (Click Node to Inspect Gap)
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">Forensically Reconstructed</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {expectedWorkflow.map((stage, idx) => {
            const isObserved = observedWorkflow.includes(stage);
            const isSelected = selectedStage === stage;
            return (
              <React.Fragment key={`obs-${stage}-${idx}`}>
                <div
                  onClick={() => setSelectedStage(stage)}
                  className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border shadow-sm transition-all ${
                    isObserved
                      ? isSelected
                        ? 'bg-zinc-800 border-zinc-500 text-zinc-100 ring-2 ring-zinc-400/40'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-zinc-500'
                      : isSelected
                      ? 'bg-rose-950 border-rose-500 text-rose-200 ring-2 ring-rose-500/60'
                      : 'bg-rose-950/60 border-rose-600/80 text-rose-300 ring-1 ring-rose-500/40 hover:bg-rose-900/60'
                  }`}
                >
                  {isObserved ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  )}
                  <span className={!isObserved ? 'font-semibold line-through decoration-rose-500' : ''}>
                    {stage}
                  </span>
                  {!isObserved && (
                    <span className="ml-1 text-[9px] uppercase font-bold text-rose-400 bg-rose-900/60 px-1 py-0.2 rounded">
                      Gapped
                    </span>
                  )}
                </div>
                {idx < expectedWorkflow.length - 1 && (
                  <ArrowRight
                    className={`w-4 h-4 flex-shrink-0 ${
                      isObserved ? 'text-zinc-600' : 'text-rose-700/60'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Interactive Workflow Node Inspector Drawer */}
      {selectedStage && (() => {
        const meta = getStageMetadata(selectedStage);
        return (
          <div className="mt-3 p-4 rounded-lg bg-zinc-900 border border-zinc-750 text-xs space-y-3 relative animate-fadeIn">
            <button
              onClick={() => setSelectedStage(null)}
              className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-100 p-1 rounded hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-zinc-400">
                Workflow Stage Inspector:
              </span>
              <span className="text-sm font-bold text-zinc-100">{selectedStage}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                meta.isObserved
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-red-950 text-red-300 border border-red-800'
              }`}>
                {meta.isObserved ? 'OBSERVED IN EVIDENCE' : 'MISSING / GAPPED'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-zinc-400 font-semibold block">Expected Policy Requirement:</span>
                <p className="text-zinc-300">{meta.expectedPolicy}</p>
              </div>

              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-amber-400 font-semibold block">Examiner Checkpoint:</span>
                <p className="text-zinc-300">{meta.examinerCheckpoint}</p>
              </div>
            </div>

            {meta.relatedEvidence.length > 0 && (
              <div className="pt-2 border-t border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Attached Stage Evidence Items ({meta.relatedEvidence.length})
                </span>
                <div className="space-y-1">
                  {meta.relatedEvidence.map((ev, i) => (
                    <div key={i} className="p-2 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-300">{ev.description || 'Raw audit artifact'}</span>
                      <span className="text-zinc-500">{ev.timestamp || 'Recorded'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
