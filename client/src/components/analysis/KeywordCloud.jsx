import React from 'react';
import { Tag, Check, AlertTriangle } from 'lucide-react';

export function KeywordCloud({ keywordsFound = [], keywordsMissing = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Keywords Found */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#111318] border border-[#232734]">
        <div className="flex items-center gap-2 mb-3">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Check className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Keywords Detected in Resume</h4>
            <p className="text-[11px] text-zinc-400">High-frequency terms matched in your resume text</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {keywordsFound.length > 0 ? (
            keywordsFound.map((item, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16181F] text-xs text-zinc-200 border border-[#262A37]"
              >
                <span>{item.keyword}</span>
                {item.count && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1 rounded">
                    {item.count}x
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-zinc-500">No specific keywords matched.</p>
          )}
        </div>
      </div>

      {/* Keywords Missing */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#111318] border border-[#232734]">
        <div className="flex items-center gap-2 mb-3">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Target Job Keywords Missing</h4>
            <p className="text-[11px] text-zinc-400">Important phrases present in job posting but absent in resume</p>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {keywordsMissing.length > 0 ? (
            keywordsMissing.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#0D0F14] border border-[#232734] text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-100">{item.keyword}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
                    {item.importance} Importance
                  </span>
                </div>
                {item.suggestion && (
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    {item.suggestion}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-zinc-500">All key phrases were identified.</p>
          )}
        </div>
      </div>
    </div>
  );
}
