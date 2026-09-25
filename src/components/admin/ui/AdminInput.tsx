import React from 'react';

export interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  suffix?: string;
  prefix?: string;
}

export function AdminInput({
  label,
  helperText,
  error,
  suffix,
  prefix,
  className = '',
  id,
  ...props
}: AdminInputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-xs font-medium text-slate-500 select-none">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full text-sm bg-white border ${
            error ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-amber-500'
          } rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            prefix ? 'pl-9' : ''
          } ${suffix ? 'pr-9' : ''} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-xs font-medium text-slate-500 select-none">
            {suffix}
          </span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-rose-600 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
