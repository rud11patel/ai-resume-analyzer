import React from 'react';
import { FileSearch } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = FileSearch,
  title = 'No records found',
  description = 'There are no items to display at this time.',
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-[#232734] bg-[#0D0F14]/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center border border-zinc-700 mb-3.5">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onAction} icon={actionIcon}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
