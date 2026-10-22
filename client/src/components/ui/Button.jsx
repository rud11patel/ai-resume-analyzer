import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0E] disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.99] cursor-pointer';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 tracking-tight',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2 tracking-tight',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2.5 font-semibold tracking-tight',
  };

  const variantClasses = {
    primary:
      'bg-zinc-100 hover:bg-white text-zinc-950 font-semibold shadow-xs border border-zinc-200/60 active:bg-zinc-200',
    secondary:
      'bg-[#16181F] hover:bg-[#1D202A] text-zinc-200 border border-[#262A37] hover:border-[#383E50] shadow-xs',
    accent:
      'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-medium',
    outline:
      'bg-transparent hover:bg-[#16181F] text-zinc-300 hover:text-white border border-[#262A37] hover:border-[#383E50]',
    ghost:
      'bg-transparent hover:bg-[#16181F] text-zinc-400 hover:text-zinc-200 border border-transparent',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" className="text-current border-current" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
        </>
      )}
    </button>
  );
}
