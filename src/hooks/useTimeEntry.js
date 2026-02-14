import { useQuery } from '@tanstack/react-query';
import { fetchTimeBlocks, fetchMatchedBlocks, fetchClaudeSessions, fetchTimelyStats } from '../api/timely';
import { useAllBoards } from './useBoards';

export function useTimeBlocks(startDate, endDate) {
  return useQuery({
    queryKey: ['timeBlocks', startDate, endDate],
    queryFn: () => fetchTimeBlocks(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 60000, // 1 minute
  });
}

export function useMatchedBlocks(startDate, endDate) {
  const boardsQuery = useAllBoards();
  const tasks = boardsQuery.data?.allSubitems || [];

  return useQuery({
    queryKey: ['matchedBlocks', startDate, endDate, tasks.length],
    queryFn: () => fetchMatchedBlocks(startDate, endDate, tasks.map(t => ({
      id: t.id,
      name: t.name,
      _parentName: t._parentName,
      _clientName: t._clientName,
      _clientShort: t._clientShort,
      _boardId: t._boardId,
    }))),
    enabled: !!startDate && !!endDate && tasks.length > 0,
    staleTime: 60000,
  });
}

export function useClaudeSessions(startDate, endDate) {
  const boardsQuery = useAllBoards();
  const tasks = boardsQuery.data?.allSubitems || [];

  return useQuery({
    queryKey: ['claudeSessions', startDate, endDate],
    queryFn: () => fetchClaudeSessions(startDate, endDate, tasks.map(t => ({
      id: t.id,
      name: t.name,
      _parentName: t._parentName,
      _clientName: t._clientName,
      _clientShort: t._clientShort,
    }))),
    enabled: !!startDate && !!endDate && tasks.length > 0,
    staleTime: 60000,
  });
}

export function useTimelyStats() {
  return useQuery({
    queryKey: ['timelyStats'],
    queryFn: fetchTimelyStats,
    staleTime: 300000, // 5 minutes
  });
}
