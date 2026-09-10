import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CaseTimelineReplay, TimelineStep } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  Shield,
  History,
  Activity,
  ArrowRight
} from 'lucide-react';

export const TimelineReplayView: React.FC = () => {
  const [replays, setReplays] = useState<CaseTimelineReplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per step

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getTimelineReplays();
        setReplays(res.replays || []);
        if (res.replays && res.replays.length > 0) {
          setSelectedCaseId(res.replays[0].caseId);
          setCurrentStepIndex(0);
        }
      } catch (err) {
        console.error('Failed to load timeline replays:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const rawActiveReplay = replays.find(r => r.caseId === selectedCaseId) || replays[0];

  const activeReplay = rawActiveReplay
    ? {
        ...rawActiveReplay,
        title: rawActiveReplay.title || `Case ${rawActiveReplay.caseNumber}: Security Investigation (${rawActiveReplay.entityName})`,
        slaBreached: rawActiveReplay.slaBreached ?? rawActiveReplay.hasSuspiciousDelay,
        totalDurationMinutes: rawActiveReplay.totalDurationMinutes ?? rawActiveReplay.totalLifecycleMinutes ?? 60,
        steps: (rawActiveReplay.steps && rawActiveReplay.steps.length > 0)
          ? rawActiveReplay.steps
          : (rawActiveReplay.stages || []).map((s: any, idx: number) => ({
              stepNumber: idx + 1,
              stage: s.stage,
              deltaMinutes: s.durationMinutesFromPrev || 0,
              action: s.stage.replace(/_/g, ' '),
              description: s.details || '',
              actor: s.actor || 'System',
              timestamp: s.timestamp || new Date().toISOString(),
              isSuspiciousDelay: !!s.isSuspiciousDelay,
              suspiciousReason: s.delayNotice
            }))
      }
    : null;

  // Auto-play timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && activeReplay && activeReplay.steps) {
      timer = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev < activeReplay.steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeReplay, playbackSpeed]);

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-500 text-xs">
        Synthesizing forensic timeline replays from event journals...
      </div>
    );
  }

  if (!activeReplay) {
    return (
      <div className="py-24 text-center text-zinc-500 text-xs space-y-3">
        <div>No timeline replays available.</div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentStep = activeReplay.steps[currentStepIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              FEATURE 8: FORENSIC PLAYBACK
            </span>
            <span className="text-xs text-zinc-400 font-mono">CHRONOLOGICAL EXECUTION AUDIT</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mt-1 flex items-center gap-2.5">
            <History className="w-7 h-7 text-emerald-400" />
            Incident Timeline Forensic Replay Engine
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Step-by-step interactive lifecycle replay of critical cases. Visualizes exact timestamps, analyst handoffs, duration deltas, and SLA breach points to uncover operational drag and missed containment steps.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Replay'}</span>
          </button>

          <button
            onClick={() => setCurrentStepIndex(Math.min(activeReplay.steps.length - 1, currentStepIndex + 1))}
            disabled={currentStepIndex === activeReplay.steps.length - 1}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={handleRestart}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="border-l border-zinc-800 pl-2 ml-1 text-xs text-zinc-400 font-mono">
            {currentStepIndex + 1} / {activeReplay.steps.length}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Selector */}
        <div className="space-y-2 lg:col-span-1">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
            Available Case Timelines ({replays.length})
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {replays.map(r => {
              const isSelected = r.caseId === selectedCaseId;
              return (
                <button
                  key={r.caseId}
                  onClick={() => handleSelectCase(r.caseId)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-zinc-900 border-emerald-600 shadow-md ring-1 ring-emerald-600/30'
                      : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-zinc-200">{r.caseNumber}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      (r.slaBreached ?? r.hasSuspiciousDelay) ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {(r.slaBreached ?? r.hasSuspiciousDelay) ? 'SLA BREACHED' : 'ON TIME'}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-zinc-300 mt-1 truncate">{r.title || `Incident ${r.caseNumber}`}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{r.entityName}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 font-mono">
                    <span>{(r.steps || r.stages || []).length} Lifecycle Steps</span>
                    <span>Duration: {r.totalDurationMinutes ?? r.totalLifecycleMinutes ?? 0} min</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Timeline Player Canvas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Case Meta Header */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-zinc-100">{activeReplay.caseNumber}</span>
                  <span className="text-xs text-zinc-400">• {activeReplay.entityName}</span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-300 mt-0.5">{activeReplay.title}</h3>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Total Time</div>
                  <div className="font-bold text-zinc-200">{activeReplay.totalDurationMinutes}m</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">SLA Target</div>
                  <div className="font-bold text-zinc-200">{activeReplay.slaTargetMinutes}m</div>
                </div>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${((currentStepIndex + 1) / activeReplay.steps.length) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1.5 font-mono">
                <span>Start: Step 1</span>
                <span>Current: Step {currentStepIndex + 1} of {activeReplay.steps.length}</span>
                <span>Closure: Step {activeReplay.steps.length}</span>
              </div>
            </div>

            {/* Current Active Step Highlight Card */}
            {currentStep && (
              <div className={`p-4 rounded-xl border transition-all ${
                currentStep.isSuspiciousDelay
                  ? 'bg-amber-950/30 border-amber-800 text-amber-200'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-200'
              }`}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 font-mono">
                    Step {currentStep.stepNumber}: {currentStep.stage}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>+{currentStep.deltaMinutes}m from previous step</span>
                  </div>
                </div>

                <div className="text-sm font-bold text-zinc-100">{currentStep.action}</div>
                <div className="text-xs text-zinc-300 mt-1">{currentStep.description}</div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/80 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Actor: <strong className="text-zinc-200">{currentStep.actor}</strong></span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    {new Date(currentStep.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                {currentStep.isSuspiciousDelay && (
                  <div className="mt-3 p-2 rounded bg-amber-950/60 border border-amber-800/80 text-xs text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Supervisory Flag: {currentStep.suspiciousReason || 'Abnormal duration gap between lifecycle stages.'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Vertical Flow of All Steps in Case */}
            <div className="space-y-2 mt-4 pt-4 border-t border-zinc-800">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                All Lifecycle Sequence Milestones
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {activeReplay.steps.map((step, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  const isPast = idx < currentStepIndex;
                  return (
                    <div
                      key={step.stepNumber}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'bg-zinc-900 border-emerald-500 ring-1 ring-emerald-500/30 font-semibold'
                          : isPast
                          ? 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                          : 'bg-zinc-950/30 border-zinc-900 text-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                          isCurrent ? 'bg-emerald-500 text-black' : isPast ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-900 text-zinc-600'
                        }`}>
                          {step.stepNumber}
                        </span>
                        <div>
                          <div className="text-zinc-200">{step.action}</div>
                          <div className="text-[10px] text-zinc-500">{step.actor} • {step.stage}</div>
                        </div>
                      </div>

                      <div className="text-right font-mono text-[10px] text-zinc-500">
                        <div>+{step.deltaMinutes}m</div>
                        {step.isSuspiciousDelay && <div className="text-amber-400 font-bold">⚠️ Gap</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
