import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { updateStatus, postUpdate as apiPostUpdate } from '../api/monday';
import { REFRESH_INTERVAL_MS, SUBITEM_COLUMNS } from '../utils/constants';
import {
  filterMyActiveItems,
  filterStaleItems,
  filterWaitingItems,
  filterCPMissing,
  filterQuickWins,
  sortByPriority,
  getColumnText,
} from '../utils/helpers';

// Fetch all board data from the server-side cache (single HTTP call)
// Server handles: 11 parallel Monday.com fetches, pagination, subitem flattening, 2-min cache
export function useAllBoards() {
  return useQuery({
    queryKey: ['allBoards'],
    queryFn: async () => {
      const res = await fetch('/api/boards/all');
      if (!res.ok) {
        throw new Error(`Board fetch failed: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    staleTime: REFRESH_INTERVAL_MS,
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: 2,
  });
}

// Derived data from the main query — memoized to avoid re-filtering on every render
export function useSweepData() {
  const query = useAllBoards();
  const allSubitems = query.data?.allSubitems || [];

  const derived = useMemo(() => {
    if (allSubitems.length === 0) {
      return {
        myActive: [],
        stale: [],
        waiting: [],
        cpMissing: [],
        quickWins: [],
        byClient: {},
        highPriority: [],
        counts: { total: 0, high: 0, waiting: 0, stale: 0, cpMissing: 0, quickWins: 0 },
      };
    }

    const myActive = filterMyActiveItems(allSubitems).sort(sortByPriority);
    const stale = filterStaleItems(allSubitems);
    const waiting = filterWaitingItems(allSubitems);
    const cpMissing = filterCPMissing(allSubitems);
    const quickWins = filterQuickWins(allSubitems);

    const byClient = {};
    for (const sub of myActive) {
      const client = sub._clientName;
      if (!byClient[client]) byClient[client] = [];
      byClient[client].push(sub);
    }

    const highPriority = myActive.filter((s) => {
      const p = getColumnText(s, SUBITEM_COLUMNS.PRIORITY);
      return p === 'High' || p === 'System Down';
    });

    return {
      myActive,
      stale,
      waiting,
      cpMissing,
      quickWins,
      byClient,
      highPriority,
      counts: {
        total: myActive.length,
        high: highPriority.length,
        waiting: waiting.length,
        stale: stale.length,
        cpMissing: cpMissing.length,
        quickWins: quickWins.length,
      },
    };
  }, [allSubitems]);

  return { ...query, ...derived };
}

// Mutation: update subitem status
export function useStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subitemBoardId, itemId, newStatus }) =>
      updateStatus(subitemBoardId, itemId, SUBITEM_COLUMNS.STATUS, newStatus),
    onSuccess: () => {
      // Invalidate server cache so next fetch gets fresh data
      fetch('/api/boards/invalidate', { method: 'POST' }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['allBoards'] });
    },
    onError: (error) => {
      console.error('Status update failed:', error);
    },
  });
}

// Mutation: post update
export function usePostUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, body }) => apiPostUpdate(itemId, body),
    onSuccess: () => {
      fetch('/api/boards/invalidate', { method: 'POST' }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['allBoards'] });
    },
    onError: (error) => {
      console.error('Post update failed:', error);
    },
  });
}
