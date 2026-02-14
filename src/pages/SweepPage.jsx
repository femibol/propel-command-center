import React, { useState, useMemo } from 'react';
import { useSweepData } from '../hooks/useBoards';
import SummaryBar from '../components/SummaryBar';
import ClientGroup from '../components/ClientGroup';
import SkeletonGroup from '../components/SkeletonGroup';
import { ACTIVE_BOARDS } from '../utils/constants';

export default function SweepPage() {
  const { byClient, counts, isLoading, isError, error, dataUpdatedAt, refetch, isRefetching } =
    useSweepData();

  const [clientFilter, setClientFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Sort clients by item count (most items first)
  const sortedClients = useMemo(() => {
    return Object.entries(byClient || {}).sort((a, b) => {
      // High priority items first
      const aHigh = a[1].filter(
        (s) =>
          (s.column_values?.find?.((c) => c.id === 'priority5')?.text || '') === 'High' ||
          (s.column_values?.find?.((c) => c.id === 'priority5')?.text || '') === 'System Down'
      ).length;
      const bHigh = b[1].filter(
        (s) =>
          (s.column_values?.find?.((c) => c.id === 'priority5')?.text || '') === 'High' ||
          (s.column_values?.find?.((c) => c.id === 'priority5')?.text || '') === 'System Down'
      ).length;
      if (bHigh !== aHigh) return bHigh - aHigh;
      return b[1].length - a[1].length;
    });
  }, [byClient]);

  const filteredClients = useMemo(() => {
    return sortedClients
      .filter(([name]) => clientFilter === 'all' || name === clientFilter)
      .map(([name, items]) => {
        let filtered = items;
        if (priorityFilter !== 'all') {
          filtered = items.filter((s) => {
            const p = s.column_values?.find?.((c) => c.id === 'priority5')?.text || '';
            return p === priorityFilter;
          });
        }
        return [name, filtered];
      })
      .filter(([, items]) => items.length > 0);
  }, [sortedClients, clientFilter, priorityFilter]);

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-400 font-medium mb-2">Failed to load boards</p>
          <p className="text-sm text-[#8B8FA3] mb-4">{error?.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-accent text-white rounded text-sm hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <SummaryBar
        counts={counts}
        lastRefresh={dataUpdatedAt}
        onRefresh={() => refetch()}
        isRefreshing={isRefetching}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2E3348] bg-[#0F1117]">
        <label className="text-xs text-[#5C6178]">Client:</label>
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="bg-[#1A1D27] border border-[#2E3348] rounded px-2 py-1 text-xs text-[#E8E9ED] focus:outline-none focus:border-accent"
        >
          <option value="all">All Clients</option>
          {sortedClients.map(([name]) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <label className="text-xs text-[#5C6178] ml-4">Priority:</label>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-[#1A1D27] border border-[#2E3348] rounded px-2 py-1 text-xs text-[#E8E9ED] focus:outline-none focus:border-accent"
        >
          <option value="all">All Priorities</option>
          <option value="System Down">System Down</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-1">
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonGroup key={i} rowCount={3 + (i % 3)} />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#8B8FA3]">No active items found.</p>
            <p className="text-xs text-[#5C6178] mt-1">
              {clientFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'All clear — nothing assigned to you right now.'}
            </p>
          </div>
        ) : (
          filteredClients.map(([clientName, items]) => (
            <ClientGroup key={clientName} clientName={clientName} items={items} />
          ))
        )}
      </div>
    </div>
  );
}
