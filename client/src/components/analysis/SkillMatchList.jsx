import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Minus, HelpCircle, ShieldAlert } from 'lucide-react';
import { SkillBadge } from './SkillBadge';

export function SkillMatchList({
  matchedSkills = [],
  partiallyMatchedSkills = [],
  missingSkills = [],
  uncertainSkills = [],
  summary,
}) {
  const [filter, setFilter] = useState('all'); // 'all', 'matched', 'partial', 'missing', 'uncertain'

  const totalSkills =
    matchedSkills.length +
    partiallyMatchedSkills.length +
    missingSkills.length +
    uncertainSkills.length;

  return (
    <div className="space-y-6">
      {/* Tab Filter and Counts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#232734]">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            Skills Assessment
            {summary && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-normal">
                {summary.matchedCount} of {summary.totalIdentified || totalSkills} skills aligned ({summary.percentage}%)
              </span>
            )}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Comparative analysis between job requirements and extracted resume capabilities.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0D0F14] border border-[#232734] rounded-xl flex-wrap">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-zinc-800 text-white font-medium shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({totalSkills})
          </button>
          <button
            type="button"
            onClick={() => setFilter('matched')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'matched'
                ? 'bg-zinc-800 text-white font-medium shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Matched ({matchedSkills.length})
          </button>
          {partiallyMatchedSkills.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('partial')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'partial'
                  ? 'bg-zinc-800 text-white font-medium shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Partial ({partiallyMatchedSkills.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setFilter('missing')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'missing'
                ? 'bg-zinc-800 text-white font-medium shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Missing ({missingSkills.length})
          </button>
          {uncertainSkills.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('uncertain')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'uncertain'
                  ? 'bg-zinc-800 text-white font-medium shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Uncertain ({uncertainSkills.length})
            </button>
          )}
        </div>
      </div>

      {/* 1. Matched Skills Block */}
      {(filter === 'all' || filter === 'matched') && matchedSkills.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Matched Candidate Skills ({matchedSkills.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {matchedSkills.map((skill, idx) => (
              <SkillBadge
                key={idx}
                name={skill.name}
                category={skill.category}
                status="matched"
                level={skill.level}
              />
            ))}
          </div>
          {matchedSkills.some((s) => s.evidence) && (
            <div className="space-y-2 mt-3">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold tracking-wider">
                Extracted Resume Evidence:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {matchedSkills
                  .filter((s) => s.evidence)
                  .map((skill, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#0D0F14] border border-[#232734] text-[11px]"
                    >
                      <div className="flex items-center justify-between text-zinc-200 font-medium mb-1">
                        <span>{skill.name}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {skill.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-zinc-400 italic">"{skill.evidence}"</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Partially Matched Skills Block */}
      {(filter === 'all' || filter === 'partial') && partiallyMatchedSkills.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Minus className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Partially Matched Skills ({partiallyMatchedSkills.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {partiallyMatchedSkills.map((skill, idx) => (
              <SkillBadge
                key={idx}
                name={skill.name}
                category={skill.category}
                status="partial"
                matchBasis={skill.matchBasis}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2">
            {partiallyMatchedSkills.map((skill, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#14151B] border border-[#262A37] text-xs text-zinc-300"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-100">{skill.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
                    {skill.confidence}% similarity
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  {skill.explanation || skill.matchBasis}
                </p>
                {skill.evidence && (
                  <p className="text-zinc-500 italic text-[10px] mt-1.5 pt-1.5 border-t border-[#232734]">
                    Detected in resume: "{skill.evidence}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Missing Skills Block */}
      {(filter === 'all' || filter === 'missing') && missingSkills.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Missing Skills in Resume ({missingSkills.length})
            </h4>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill, idx) => (
                <SkillBadge
                  key={idx}
                  name={skill.name}
                  category={skill.category}
                  status="missing"
                  priority={skill.priority}
                />
              ))}
            </div>

            {/* Context details for missing skills */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {missingSkills.map((skill, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#0D0F14] border border-[#232734] text-xs text-zinc-300"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-zinc-100">{skill.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/25">
                      {skill.priority} Priority
                    </span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">{skill.context}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Uncertain Skills Block */}
      {(filter === 'all' || filter === 'uncertain') && uncertainSkills.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Unverified Evidence ({uncertainSkills.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {uncertainSkills.map((skill, idx) => (
              <SkillBadge
                key={idx}
                name={skill.name}
                status="uncertain"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {uncertainSkills.map((skill, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#0D0F14] border border-[#232734] text-xs text-zinc-300"
              >
                <span className="font-medium text-zinc-100">{skill.name}</span>
                <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                  {skill.reason}
                </p>
                {skill.context && (
                  <p className="text-zinc-500 italic text-[10px] mt-1">
                    Context: "{skill.context}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ethical Advisory Notice */}
      <div className="p-3.5 rounded-xl bg-[#111318] border border-[#232734] flex items-start gap-2.5 text-xs text-zinc-400 mt-4">
        <ShieldAlert className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-zinc-200 font-semibold">Integrity Guideline:</strong> Only incorporate competencies that reflect your authentic practical skills. Never fabricate experience to satisfy ATS filtering.
        </div>
      </div>
    </div>
  );
}
