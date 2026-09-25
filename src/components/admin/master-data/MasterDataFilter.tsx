import React from 'react';
import { Search } from 'lucide-react';

export type StatusFilterOption = 'all' | 'active' | 'inactive';

export interface MasterDataFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilterOption;
  onStatusFilterChange: (status: StatusFilterOption) => void;
  searchPlaceholder?: string;
  activeCount?: number;
  inactiveCount?: number;
  totalCount?: number;
}

export function MasterDataFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  searchPlaceholder = 'Cari data...',
  activeCount,
  inactiveCount,
  totalCount,
}: MasterDataFilterProps) {
  const filterTabs: { id: StatusFilterOption; label: string; count?: number }[] = [
    { id: 'all', label: 'Semua Status', count: totalCount },
    { id: 'active', label: 'Aktif', count: activeCount },
    { id: 'inactive', label: 'Tidak Aktif', count: inactiveCount },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                    isActive ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
