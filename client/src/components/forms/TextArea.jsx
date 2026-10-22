import React from 'react';

export function TextArea({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  rows = 8,
  minChars = 40,
  className = '',
  headerAction = null,
  ...props
}) {
  const inputId = id || name;
  const charCount = (value || '').length;
  const isBelowMin = minChars > 0 && charCount > 0 && charCount < minChars;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-zinc-300"
          >
            {label}
            {required && <span className="text-rose-400 ml-1">*</span>}
          </label>
        )}

        {headerAction && <div>{headerAction}</div>}
      </div>

      <div className="relative">
        <textarea
          id={inputId}
          name={name}
          rows={rows}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-desc` : undefined}
          className={`block w-full rounded-xl bg-[#0D0F14] border text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 p-3.5 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed resize-y ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/40'
              : 'border-[#232734] hover:border-[#353A4C]'
          }`}
          {...props}
        />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <div>
          {error ? (
            <p id={`${inputId}-error`} className="text-xs text-rose-400 font-medium">
              {error}
            </p>
          ) : helperText ? (
            <p id={`${inputId}-desc`} className="text-[11px] text-zinc-500">
              {helperText}
            </p>
          ) : null}
        </div>

        <div className="text-[11px] font-mono text-zinc-500">
          <span className={isBelowMin ? 'text-amber-400 font-medium' : 'text-zinc-400'}>
            {charCount}
          </span>
          {minChars > 0 && <span className="text-zinc-600"> / min {minChars} chars</span>}
        </div>
      </div>
    </div>
  );
}
