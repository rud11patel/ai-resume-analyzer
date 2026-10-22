import React from 'react';
import { Check, AlertCircle, Minus, HelpCircle } from 'lucide-react';

export function SkillBadge({ name, category, status = 'matched', priority = 'Medium', level, matchBasis }) {
  if (status === 'matched') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs">
        <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </span>
        <span className="font-medium text-zinc-100">{name}</span>
        {level && (
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
            {level}
          </span>
        )}
      </div>
    );
  }

  if (status === 'partial') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
        <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
          <Minus className="w-2.5 h-2.5 stroke-[3]" />
        </span>
        <span className="font-medium text-zinc-100">{name}</span>
        <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
          {matchBasis || 'Partial Match'}
        </span>
      </div>
    );
  }

  if (status === 'uncertain') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/90 border border-zinc-700/80 text-zinc-300 text-xs">
        <span className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300">
          <HelpCircle className="w-2.5 h-2.5 stroke-[2.5]" />
        </span>
        <span className="font-medium text-zinc-100">{name}</span>
        <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
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
          ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
          : 'bg-[#16181F] border-[#262A37] text-zinc-300'
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center ${
          isHighPriority ? 'bg-rose-500/20 text-rose-400' : 'bg-zinc-800 text-zinc-400'
        }`}
      >
        <AlertCircle className="w-2.5 h-2.5 stroke-[2.5]" />
      </span>
      <span className="font-medium text-zinc-100">{name}</span>
      <span
        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase ${
          isHighPriority
            ? 'bg-rose-950/60 text-rose-400 border-rose-800/40'
            : 'bg-[#0D0F14] text-zinc-400 border-zinc-800'
        }`}
      >
        {priority} Priority
      </span>
    </div>
  );
}
