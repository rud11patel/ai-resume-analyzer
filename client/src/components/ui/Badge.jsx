import React from 'react';

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon: Icon = null,
  className = '',
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-xs gap-1.5 font-medium',
  };

  const variantClasses = {
    neutral: 'bg-zinc-800/60 text-zinc-300 border border-zinc-700/60',
    slate: 'bg-slate-800/60 text-slate-300 border border-slate-700/60',
    indigo: 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/70',
    violet: 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/70',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    amber: 'bg-amber-500/10 text-amber-300 border border-amber-500/25',
    rose: 'bg-rose-500/10 text-rose-300 border border-rose-500/25',
    blue: 'bg-sky-500/10 text-sky-300 border border-sky-500/25',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.neutral} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
