import React from 'react';
import { getScoreTheme } from '../../utils/formatters';

export function CompatibilityGauge({ score = 0, subScores, label }) {
  const theme = getScoreTheme(score);
  const strokeWidth = 10;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
      {/* Circular Progress Gauge */}
      <div className="relative flex items-center justify-center flex-shrink-0">
        <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
          {/* Background circle track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-800"
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
            className="transition-all duration-1000 ease-out"
            fill="transparent"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
            {score}%
          </span>
          <span className={`text-xs font-semibold uppercase tracking-wider mt-0.5 ${theme.text}`}>
            {label || theme.label}
          </span>
        </div>
      </div>

      {/* Sub-scores Breakdown */}
      <div className="flex-1 w-full space-y-3.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Compatibility Dimension Breakdown
        </h4>

        {subScores ? (
          <>
            <ScoreProgressBar
              label="Technical Skills Alignment"
              value={subScores.technicalSkills}
              color="indigo"
            />
            <ScoreProgressBar
              label="Role & Experience Relevance"
              value={subScores.experienceRelevance}
              color="emerald"
            />
            <ScoreProgressBar
              label="ATS Formatting & Parseability"
              value={subScores.atsFormatting}
              color="blue"
            />
            <ScoreProgressBar
              label="Job Keyword Density"
              value={subScores.keywordDensity}
              color="amber"
            />
          </>
        ) : (
          <p className="text-xs text-slate-500">Breakdown data not available.</p>
        )}
      </div>
    </div>
  );
}

function ScoreProgressBar({ label, value = 0, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    blue: 'bg-sky-500',
    amber: 'bg-amber-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="font-mono font-bold text-white">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorMap[color] || 'bg-indigo-500'}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
