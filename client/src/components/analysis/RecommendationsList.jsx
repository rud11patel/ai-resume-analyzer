import React from 'react';
import { Sparkles, TrendingUp, Zap, CheckCircle2 } from 'lucide-react';

export function RecommendationsList({ recommendations = [] }) {
  const getImpactBadge = (impact) => {
    const lower = (impact || '').toLowerCase();
    if (lower.includes('high')) {
      return {
        bg: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
        icon: TrendingUp,
      };
    }
    if (lower.includes('quick')) {
      return {
        bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
        icon: Zap,
      };
    }
    return {
      bg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      icon: Sparkles,
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1">
        <Sparkles className="w-4 h-4 text-zinc-400" />
        <h3 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight">
          Targeted Resume Recommendations
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec, idx) => {
          const impact = getImpactBadge(rec.impact);
          const Icon = impact.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#111318] border border-[#232734] hover:border-zinc-600 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${impact.bg}`}
                  >
                    <Icon className="w-3 h-3" />
                    {rec.impact}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-zinc-100 tracking-tight mb-1.5">
                  {rec.title}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {rec.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#232734] flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Actionable ATS recommendation</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
