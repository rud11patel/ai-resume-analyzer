import React from 'react';
import { Check, AlertCircle, Minus, HelpCircle } from 'lucide-react';

export function SkillBadge({ name, category, status = 'matched', priority = 'Medium', level, matchBasis }) {
  if (status === 'matched') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
        <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </span>
        <span className="font-semibold text-white">{name}</span>
        {level && (
          <span className="text-[10px] text-emerald-400/80 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
            {level}
          </span>
        )}
      </div>
    );
  }

  if (status === 'partial') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
        <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
          <Minus className="w-2.5 h-2.5 stroke-[3]" />
        </span>
        <span className="font-semibold text-white">{name}</span>
        <span className="text-[10px] text-amber-400/80 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
          {matchBasis || 'Partial Match'}
        </span>
      </div>
    );
  }

  if (status === 'uncertain') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs">
        <span className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
          <HelpCircle className="w-2.5 h-2.5 stroke-[2.5]" />
        </span>
        <span className="font-semibold text-white">{name}</span>
        <span className="text-[10px] text-purple-400/80 font-mono bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
          Uncertain Evidence
        </span>
      </div>
    );
  }

  // Missing skill
  const isHighPriority = priority?.toLowerCase() === 'high';
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border ${
        isHighPriority
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          : 'bg-slate-800/80 border-slate-700 text-slate-300'
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center ${
          isHighPriority ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-400'
        }`}
      >
        <AlertCircle className="w-2.5 h-2.5 stroke-[2.5]" />
      </span>
      <span className="font-semibold text-white">{name}</span>
      <span
        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase ${
          isHighPriority
            ? 'bg-rose-950/60 text-rose-400 border-rose-800/40'
            : 'bg-slate-900 text-slate-400 border-slate-700'
        }`}
      >
        {priority} Priority
      </span>
    </div>
  );
}
