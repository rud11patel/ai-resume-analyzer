import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Minus, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Skills Match Assessment
            {summary && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                {summary.matchedCount} of {summary.totalIdentified || totalSkills} skills aligned ({summary.percentage}%)
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Comparative analysis between job requirements and resume proficiencies.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl flex-wrap">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({totalSkills})
          </button>
          <button
            type="button"
            onClick={() => setFilter('matched')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'matched'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Matched ({matchedSkills.length})
          </button>
          {partiallyMatchedSkills.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('partial')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'partial'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Partial ({partiallyMatchedSkills.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setFilter('missing')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'missing'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Missing ({missingSkills.length})
          </button>
          {uncertainSkills.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('uncertain')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'uncertain'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
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
              <span className="text-[11px] font-mono uppercase text-slate-500 font-bold tracking-wider">
                Extracted Resume Evidence:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {matchedSkills
                  .filter((s) => s.evidence)
                  .map((skill, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px]"
                    >
                      <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                        <span>{skill.name}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {skill.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-slate-400 italic">"{skill.evidence}"</p>
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Partially Matched Skills & Related Ecosystems ({partiallyMatchedSkills.length})
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
                className="p-3 rounded-xl bg-amber-950/15 border border-amber-500/20 text-xs text-amber-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">{skill.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {skill.confidence}% similarity
                  </span>
                </div>
                <p className="text-amber-200/90 text-[11px] leading-relaxed">
                  {skill.explanation || skill.matchBasis}
                </p>
                {skill.evidence && (
                  <p className="text-slate-400 italic text-[10px] mt-1.5 pt-1.5 border-t border-amber-500/10">
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Missing or Underrepresented Skills ({missingSkills.length})
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
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{skill.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      {skill.priority} Priority
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{skill.context}</p>
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
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Uncertain Evidence / Unverified Mentions ({uncertainSkills.length})
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
                className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200"
              >
                <span className="font-semibold text-white">{skill.name}</span>
                <p className="text-purple-300/80 text-[11px] mt-1 leading-relaxed">
                  {skill.reason}
                </p>
                {skill.context && (
                  <p className="text-slate-400 italic text-[10px] mt-1">
                    Context: "{skill.context}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ethical Advisory Notice */}
      <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-start gap-2.5 text-xs text-indigo-300 mt-4">
        <ShieldAlert className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white font-semibold">Integrity Guideline:</strong> Only add skills
          or tools that accurately represent your genuine practical experience. Never fabricate credentials or projects to inflate ATS keyword scores.
        </div>
      </div>
    </div>
  );
}
