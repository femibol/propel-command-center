import { useMemo } from 'react';
import { useSweepData } from './useBoards';
import { daysSince } from '../utils/helpers';
import { FOLLOWUP_OVERDUE_DAYS } from '../utils/constants';

export default function useNudges(page) {
  const { myActive, stale, waiting, quickWins, highPriority, counts } = useSweepData();
  const hour = new Date().getHours();

  return useMemo(() => {
    if (!myActive || myActive.length === 0) return null;

    const overdueFollowups = waiting.filter(s => daysSince(s.updated_at) >= FOLLOWUP_OVERDUE_DAYS);
    const veryStale = stale.filter(s => daysSince(s.updated_at) >= 10);

    switch (page) {
      case 'sweep': {
        // Morning nudge
        if (hour < 10 && highPriority.length > 0) {
          return {
            type: 'warning',
            text: `${highPriority.length} high-priority item${highPriority.length > 1 ? 's' : ''} need attention before standup.`,
            action: null,
          };
        }
        if (quickWins.length >= 3) {
          return {
            type: 'info',
            text: `${quickWins.length} quick wins ready to close. Build some momentum!`,
            actionLabel: 'View Quick Wins',
            actionTo: '/quick-wins',
          };
        }
        return null;
      }

      case 'waiting': {
        if (overdueFollowups.length > 0) {
          const topClient = overdueFollowups[0]?._clientName || 'a client';
          return {
            type: 'warning',
            text: `${overdueFollowups.length} item${overdueFollowups.length > 1 ? 's' : ''} overdue for follow-up. ${topClient} is waiting on you.`,
            actionLabel: 'Draft Follow-Ups',
            actionId: 'draft-followups',
          };
        }
        if (waiting.length > 15) {
          return {
            type: 'info',
            text: `${waiting.length} items in waiting states. Consider escalating the oldest ones.`,
            action: null,
          };
        }
        return null;
      }

      case 'stale': {
        if (veryStale.length > 0) {
          return {
            type: 'error',
            text: `${veryStale.length} item${veryStale.length > 1 ? 's' : ''} haven't been touched in 10+ days. Clients may be losing confidence.`,
            action: null,
          };
        }
        if (stale.length > 0) {
          return {
            type: 'warning',
            text: `${stale.length} items going stale. Update them today to stay on track.`,
            action: null,
          };
        }
        return null;
      }

      case 'time-entry': {
        return {
          type: 'info',
          text: 'Remember: match all Timely blocks to PROPEL tasks before submitting to ChangePoint.',
          action: null,
        };
      }

      default:
        return null;
    }
  }, [page, myActive, stale, waiting, quickWins, highPriority, hour, counts]);
}
