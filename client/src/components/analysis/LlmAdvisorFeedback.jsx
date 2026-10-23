import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Target, 
  Zap, 
  Layers
} from 'lucide-react';

/**
 * LlmAdvisorFeedback Component
 * 
 * Displays personalized AI Recruiter critique, grounded candidate strengths,
 * categorized gap analysis, and tailored bullet point rewrites.
 */
export function LlmAdvisorFeedback({ llmFeedback }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // If no LLM feedback was generated or available, render nothing to client users
  if (!llmFeedback) {
    return null;
  }

  const {
    executiveSummary,
    strengths = [],
    criticalGaps = [],
    actionableRecommendations = [],
  } = llmFeedback;

  // If feedback object exists but has no substantive content, avoid rendering an empty card
  if (!executiveSummary && strengths.length === 0 && criticalGaps.length === 0 && actionableRecommendations.length === 0) {
    return null;
  }

  return (
    <section className="p-6 sm:p-7 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#232734]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
              AI Recruiter Critique & Fit Advisor
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Deep contextual analysis synthesized from your resume vs target posting.
            </p>
          </div>
        </div>

        {/* Client-Facing Assessment Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#141824] text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Executive Assessment</span>
          </span>
        </div>
      </div>

      {/* 1. Executive Summary */}
      {executiveSummary && (
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#141824]/60 via-[#10131A] to-[#141824]/60 border border-[#262C3D] relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <span>Executive Fit Assessment</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed italic">
            "{executiveSummary}"
          </p>
        </div>
      )}

      {/* 2. Side-by-Side: Strengths vs Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Confirmed Strengths */}
        <div className="p-5 rounded-xl bg-[#0D0F14] border border-[#232734] space-y-3.5 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E222D]">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Verified Core Strengths ({strengths.length})
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Grounded Evidence</span>
          </div>

          {strengths.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-2">No specific strengths isolated.</p>
          ) : (
            <ul className="space-y-2.5 flex-1">
              {strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Critical Gaps & Missing Evidence */}
        <div className="p-5 rounded-xl bg-[#0D0F14] border border-[#232734] space-y-3.5 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E222D]">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Critical Gaps & Missing Evidence ({criticalGaps.length})
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Target Posting Alignment</span>
          </div>

          {criticalGaps.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-2">No critical gaps identified.</p>
          ) : (
            <ul className="space-y-2.5 flex-1">
              {criticalGaps.map((gap, idx) => {
                const isMissingEvidence = gap.toLowerCase().includes('missing evidence');
                return (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                    <span
                      className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isMissingEvidence ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                    />
                    <span>{gap}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* 3. Actionable Context-Specific Recommendations */}
      {actionableRecommendations.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#232734]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs sm:text-sm font-semibold text-zinc-200">
                Context-Specific Action Plan & Phrasing Optimizations
              </h4>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              {actionableRecommendations.length} tailored upgrades
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {actionableRecommendations.map((item, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-xl bg-[#0D0F14] border border-[#232734] hover:border-zinc-700 transition-colors space-y-3"
              >
                {/* Section Tag */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#141824] text-indigo-300 border border-indigo-500/20">
                    <Layers className="w-3 h-3 text-indigo-400" />
                    {item.section}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Step #{idx + 1}</span>
                </div>

                {/* Observation & Strategic Advice */}
                <div className="space-y-1.5 text-xs">
                  <p className="text-zinc-400">
                    <strong className="text-zinc-300">Observation:</strong> {item.currentObservation}
                  </p>
                  <p className="text-zinc-300">
                    <strong className="text-indigo-300">Recommendation:</strong> {item.suggestedImprovement}
                  </p>
                </div>

                {/* Example High-Impact Rewrite with Copy Button */}
                {item.exampleRewrite && (
                  <div className="mt-2 p-3.5 rounded-lg bg-[#141820] border border-[#222838] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Suggested High-Impact Rewrite:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.exampleRewrite, idx)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors text-[11px] font-medium cursor-pointer"
                        title="Copy suggested rewrite to clipboard"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-zinc-100 font-medium leading-relaxed font-sans">
                      "{item.exampleRewrite}"
                    </p>
                    <p className="text-[10px] text-zinc-500 italic">
                      Note: Replace bracketed placeholders like <span className="text-zinc-300">[X%]</span> with your verified accomplishments. Never fabricate metrics.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
