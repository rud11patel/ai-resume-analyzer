import React from 'react';

export function Badge({
  children,
  variant = 'slate',
  size = 'md',
  icon: Icon = null,
  className = '',
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-xs gap-1.5 font-semibold',
  };

  const variantClasses = {
    slate: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    indigo: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    violet: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    blue: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.slate} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
