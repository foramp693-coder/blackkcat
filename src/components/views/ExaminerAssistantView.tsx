import React, { useState } from 'react';
import { api } from '../../services/api';
import { SupervisoryFinding } from '../../types';
import {
  Sparkles,
  Send,
  ShieldCheck,
  FileSearch,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Clock,
  Layers,
  Search,
  MessageSquare
} from 'lucide-react';

interface Props {
  onSelectFinding?: (finding: SupervisoryFinding) => void;
  findings?: SupervisoryFinding[];
}

interface ChatMessage {
  id: string;
  sender: 'EXAMINER' | 'ASSISTANT';
  text: string;
  intent?: string;
  evidenceReferences?: {
    type: string;
    id: string;
    title: string;
    detail: string;
  }[];
  suggestedFollowUps?: string[];
  timestamp: string;
}

export const ExaminerAssistantView: React.FC<Props> = ({ onSelectFinding, findings = [] }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'ASSISTANT',
      text: `**SAT-SA Supervisory Decision-Support AI Assistant (Offline-Grounded)**\n\nI am grounded strictly in the verified forensic evidence, case logs, and supervisory findings of the currently loaded inspection cycle. I do not hallucinate, speculate, or infer culpability.\n\nYou can ask me:\n• *"Why should I review Case C-1042?"*\n• *"Which 10 cases should I review first?"*\n• *"What changed compared with the previous assessment?"*\n• *"What workflow step is missing?"*\n• *"What alternative explanations exist?"*`,
      suggestedFollowUps: [
        'Which 10 cases should I review first?',
        'What changed compared with the previous assessment?',
        'What workflow step is missing?'
      ],
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'EXAMINER',
      text: q,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.askAssistant(q);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'ASSISTANT',
        text: res.answer,
        intent: res.intentDetected,
        evidenceReferences: res.evidenceReferences,
        suggestedFollowUps: res.suggestedFollowUps,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Assistant query failed:', err);
      const errMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'ASSISTANT',
        text: 'SAT-SA offline assistant encountered an error resolving dataset references.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleEvidenceClick = (ref: { type: string; id: string }) => {
    if (ref.type === 'FINDING' || ref.type === 'CASE') {
      const matched = findings.find(f => f.id === ref.id || f.caseId === ref.id || f.caseNumber.toLowerCase() === ref.id.toLowerCase());
      if (matched && onSelectFinding) {
        onSelectFinding(matched);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-md">
      {/* Assistant Header */}
      <div className="px-6 py-4 border-b border-zinc-850 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/80 text-red-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-100">
                Evidence-Grounded Examiner AI Assistant
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
                100% Offline Capable
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                Zero Hallucination
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Supervisory query engine constrained strictly to loaded incident tickets, hashes, SLA matrices, and findings.
            </p>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.sender === 'EXAMINER';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-zinc-500">
                <span>{isUser ? 'Supervisory Examiner' : 'SAT-SA Grounded Knowledge Engine'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
                {msg.intent && (
                  <span className="px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    Intent: {msg.intent}
                  </span>
                )}
              </div>

              <div
                className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                    : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800 shadow-sm'
                }`}
              >
                {msg.text}

                {/* Evidence References Pill Box */}
                {msg.evidenceReferences && msg.evidenceReferences.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-800 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <FileSearch className="w-3.5 h-3.5 text-blue-400" />
                      Direct Evidence References (From Dataset)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.evidenceReferences.map((ref, i) => (
                        <button
                          key={i}
                          onClick={() => handleEvidenceClick(ref)}
                          className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-750 hover:border-blue-500 hover:text-blue-300 text-zinc-300 text-[10px] font-mono flex items-center gap-1.5 transition-colors"
                        >
                          <span className="font-bold text-blue-400">[{ref.type}]</span>
                          <span>{ref.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Follow-Ups */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-2xl">
                  {msg.suggestedFollowUps.map((su, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(su)}
                      className="px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 hover:border-red-600 hover:text-zinc-100 text-zinc-400 text-[11px] transition-colors"
                    >
                      {su}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/40 p-3 rounded-lg border border-zinc-850 w-fit">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            <span>Retrieving verified evidence records & compiling structured answer...</span>
          </div>
        )}
      </div>

      {/* Query Input Bar */}
      <div className="p-4 border-t border-zinc-850 bg-zinc-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about cases, entities, missing evidence, sampling, or longitudinal drift..."
            className="flex-1 bg-zinc-900 border border-zinc-750 rounded-lg px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
