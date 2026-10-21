import React from 'react';
import { Sparkles, TrendingUp, Zap, CheckCircle2 } from 'lucide-react';

export function RecommendationsList({ recommendations = [] }) {
  const getImpactBadge = (impact) => {
    const lower = (impact || '').toLowerCase();
    if (lower.includes('high')) {
      return {
        bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        icon: TrendingUp,
      };
    }
    if (lower.includes('quick')) {
      return {
        bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        icon: Zap,
      };
    }
    return {
      bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      icon: Sparkles,
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h3 className="text-base font-bold text-white tracking-tight">
          Actionable Resume Recommendations
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec, idx) => {
          const impact = getImpactBadge(rec.impact);
          const Icon = impact.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${impact.bg}`}
                  >
                    <Icon className="w-3 h-3" />
                    {rec.impact}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight mb-2">
                  {rec.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {rec.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Recommendation {idx + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
