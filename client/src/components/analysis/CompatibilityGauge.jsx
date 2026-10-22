import React from 'react';
import { getScoreTheme } from '../../utils/formatters';

export function CompatibilityGauge({ score = 0, subScores, label }) {
  const theme = getScoreTheme(score);
  const strokeWidth = 9;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 p-6 sm:p-7 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm">
      {/* Circular Progress Gauge */}
      <div className="relative flex items-center justify-center flex-shrink-0">
        <svg className="w-40 h-40 -rotate-90 transform" viewBox="0 0 160 160">
          {/* Background circle track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-[#1E222D]"
            fill="transparent"
          />
          {/* Animated score stroke */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            fill="transparent"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold tracking-tight text-zinc-100 font-mono">
            {score}%
          </span>
          <span className={`text-[11px] font-semibold uppercase tracking-wider mt-0.5 ${theme.text}`}>
            {label || theme.label}
          </span>
        </div>
      </div>

      {/* Sub-scores Breakdown */}
      <div className="flex-1 w-full space-y-3.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          Dimension Breakdown
        </h4>

        {subScores ? (
          <>
            <ScoreProgressBar
              label="Technical Skills Alignment"
              value={subScores.technicalSkills}
              color="emerald"
            />
            <ScoreProgressBar
              label="Experience Relevance"
              value={subScores.experienceRelevance}
              color="zinc"
            />
            <ScoreProgressBar
              label="ATS Formatting & Parseability"
              value={subScores.atsFormatting}
              color="sky"
            />
            <ScoreProgressBar
              label="Job Keyword Density"
              value={subScores.keywordDensity}
              color="amber"
            />
          </>
        ) : (
          <p className="text-xs text-zinc-500">Breakdown data not available.</p>
        )}
      </div>
    </div>
  );
}

function ScoreProgressBar({ label, value = 0, color = 'zinc' }) {
  const colorMap = {
    emerald: 'bg-emerald-400',
    zinc: 'bg-zinc-300',
    sky: 'bg-sky-400',
    amber: 'bg-amber-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-medium text-zinc-300 text-xs">{label}</span>
        <span className="font-mono text-zinc-400 text-xs">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#1A1D27] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorMap[color] || 'bg-zinc-300'}`}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}
