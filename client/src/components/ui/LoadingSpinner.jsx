import React from 'react';

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    xs: 'w-3.5 h-3.5 border-[1.5px]',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[2.5px]',
    xl: 'w-12 h-12 border-3',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-indigo-500 border-t-transparent animate-spin ${sizeClasses[size] || sizeClasses.md} ${className}`}
    />
  );
}
