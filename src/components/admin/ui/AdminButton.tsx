import React from 'react';

export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminButton({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: AdminButtonProps) {
  const variantStyles = {
    primary: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm',
    secondary: 'bg-slate-800 hover:bg-slate-900 text-white font-medium shadow-sm',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 font-medium',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-lg gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
