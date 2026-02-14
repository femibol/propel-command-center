import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBoardItems, updateStatus, postUpdate as apiPostUpdate } from '../api/monday';
import { ACTIVE_BOARDS, REFRESH_INTERVAL_MS, SUBITEM_COLUMNS } from '../utils/constants';
import {
  filterMyActiveItems,
  filterStaleItems,
  filterWaitingItems,
  filterCPMissing,
  sortByPriority,
  getColumnText,
} from '../utils/helpers';

// Fetch all boards in parallel, extract and flatten subitems
export function useAllBoards() {
  return useQuery({
    queryKey: ['allBoards'],
    queryFn: async () => {
      const results = await Promise.allSettled(
        ACTIVE_BOARDS.map(async (board) => {
          const items = await fetchBoardItems(board.id);
          return { board, items };
        })
      );

      const boards = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          boards.push(result.value);
        } else {
          console.error('Board fetch failed:', result.reason);
        }
      }

      // Flatten all subitems across all boards with parent/board context
      const allSubitems = [];
      for (const { board, items } of boards) {
        for (const item of items) {
          for (const sub of item.subitems || []) {
            allSubitems.push({
              ...sub,
              _parentId: item.id,
              _parentName: item.name,
              _parentGroup: item.group?.title || 'Unknown',
              _boardId: board.id,
              _boardName: board.name,
              _clientName: board.name
                .replace('PROPEL - ', '')
                .replace(' - Acumatica Project', '')
                .replace('Upgrade - ', '')
                .replace('Managed Support - (CA) ', ''),
              _clientShort: board.shortName,
              _subitemBoardId: sub.board?.id,
            });
          }
        }
      }

      return { boards, allSubitems };
    },
    staleTime: REFRESH_INTERVAL_MS,
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: 2,
  });
}

// Derived data from the main query
export function useSweepData() {
  const query = useAllBoards();
  const allSubitems = query.data?.allSubitems || [];

  const myActive = filterMyActiveItems(allSubitems).sort(sortByPriority);
  const stale = filterStaleItems(allSubitems);
  const waiting = filterWaitingItems(allSubitems);
  const cpMissing = filterCPMissing(allSubitems);

  // Group active items by client
  const byClient = {};
  for (const sub of myActive) {
    const client = sub._clientName;
    if (!byClient[client]) byClient[client] = [];
    byClient[client].push(sub);
  }

  // Count high priority
  const highPriority = myActive.filter((s) => {
    const p = getColumnText(s, SUBITEM_COLUMNS.PRIORITY);
    return p === 'High' || p === 'System Down';
  });

  return {
    ...query,
    myActive,
    stale,
    waiting,
    cpMissing,
    byClient,
    highPriority,
    counts: {
      total: myActive.length,
      high: highPriority.length,
      waiting: waiting.length,
      stale: stale.length,
      cpMissing: cpMissing.length,
    },
  };
}

// Mutation: update subitem status
export function useStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subitemBoardId, itemId, newStatus }) =>
      updateStatus(subitemBoardId, itemId, SUBITEM_COLUMNS.STATUS, newStatus),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allBoards'] });
      // Toast is handled by the component via onSuccess callback
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
      queryClient.invalidateQueries({ queryKey: ['allBoards'] });
    },
    onError: (error) => {
      console.error('Post update failed:', error);
    },
  });
}
