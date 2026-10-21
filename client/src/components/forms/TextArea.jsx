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
  minChars = 50,
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
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
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
          className={`block w-full rounded-xl bg-slate-900 border text-sm text-slate-100 placeholder-slate-500 p-3.5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/40'
              : 'border-slate-800 hover:border-slate-700'
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
            <p id={`${inputId}-desc`} className="text-xs text-slate-400">
              {helperText}
            </p>
          ) : null}
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          <span className={isBelowMin ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
            {charCount}
          </span>
          {minChars > 0 && <span className="text-slate-500"> / min {minChars} chars</span>}
        </div>
      </div>
    </div>
  );
}
