import React from 'react';
import { useSweepData } from '../hooks/useBoards';
import SubitemRow from '../components/SubitemRow';
import SkeletonGroup from '../components/SkeletonGroup';
import { getColumnText, getWaitingOn, daysSince } from '../utils/helpers';
import { SUBITEM_COLUMNS, FOLLOWUP_OVERDUE_DAYS } from '../utils/constants';

export default function WaitingPage() {
  const { waiting, isLoading } = useSweepData();

  // Group by waiting type
  const groups = {};
  for (const sub of waiting || []) {
    const status = getColumnText(sub, SUBITEM_COLUMNS.STATUS);
    const waitOn = getWaitingOn(status) || 'Other';
    if (!groups[waitOn]) groups[waitOn] = [];
    groups[waitOn].push(sub);
  }

  // Sort groups: Customer first, then NAW, then others
  const groupOrder = ['Customer', 'Client', 'NAW', 'Dev', 'Tech', 'Acumatica', 'Sales', 'ISV', 'Support'];
  const sortedGroups = Object.entries(groups).sort((a, b) => {
    const ai = groupOrder.indexOf(a[0]);
    const bi = groupOrder.indexOf(b[0]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Sort items within each group by days waiting (longest first)
  for (const [, items] of sortedGroups) {
    items.sort((a, b) => daysSince(a.updated_at) - daysSince(b.updated_at)).reverse();
  }

  const overdueCount = (waiting || []).filter(
    (s) => daysSince(s.updated_at) >= FOLLOWUP_OVERDUE_DAYS
  ).length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-5 py-4 border-b border-[#2E3348] bg-[#1A1D27] flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#E8E9ED]">Waiting / Blocked Items</h2>
          <p className="text-xs text-[#5C6178] mt-0.5">
            {waiting?.length || 0} items in waiting states
          </p>
        </div>
        {overdueCount > 0 && (
          <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/40 rounded-full px-3 py-1">
            {overdueCount} overdue for follow-up (7+ days)
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonGroup key={i} rowCount={4} />
            ))}
          </div>
        ) : sortedGroups.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#8B8FA3]">No waiting items.</p>
          </div>
        ) : (
          sortedGroups.map(([waitOn, items]) => (
            <div key={waitOn} className="border border-[#2E3348] rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-[#1A1D27] border-b border-[#2E3348] flex items-center justify-between">
                <span className="text-sm font-semibold text-purple-400">
                  Waiting — {waitOn}
                </span>
                <span className="text-xs text-[#8B8FA3]">{items.length} items</span>
              </div>
              <div className="bg-[#0F1117]">
                {items.map((sub) => (
                  <SubitemRow key={sub.id} subitem={sub} showClient showStale />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
