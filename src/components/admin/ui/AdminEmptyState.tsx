import React from 'react';

export interface AdminEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AdminEmptyState({ icon, title, description, action }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-dashed border-slate-300 rounded-xl">
      {icon && <div className="p-3 bg-slate-100 rounded-full text-slate-500 mb-3">{icon}</div>}
      <h4 className="text-base font-semibold text-slate-800 mb-1">{title}</h4>
      {description && <p className="text-xs text-slate-500 max-w-md mb-4">{description}</p>}
      {action}
    </div>
  );
}
