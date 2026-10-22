import React from 'react';

export function TextInput({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon = null,
  rightElement = null,
  className = '',
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-zinc-300 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-400 ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-xl">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-desc` : undefined}
          className={`block w-full rounded-xl bg-[#0D0F14] border text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${rightElement ? 'pr-11' : 'pr-3.5'} py-2.5 ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/40'
              : 'border-[#232734] hover:border-[#353A4C]'
          }`}
          {...props}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-400 font-medium flex items-center gap-1">
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={`${inputId}-desc`} className="mt-1 text-[11px] text-zinc-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
