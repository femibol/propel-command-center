import React, { useEffect } from 'react';
import { useSweepData } from '../hooks/useBoards';
import { useAICoach } from '../contexts/AICoachContext';
import SubitemRow from '../components/SubitemRow';
import NudgeBanner from '../components/NudgeBanner';
import SkeletonRow from '../components/SkeletonRow';
import { daysSince } from '../utils/helpers';

export default function StalePage() {
  const { stale, isLoading } = useSweepData();
  const { setPageContext } = useAICoach();

  useEffect(() => {
    setPageContext({
      page: 'stale',
      data: `${stale?.length || 0} stale items (5+ days without update)`,
    });
  }, [stale, setPageContext]);

  const sorted = [...(stale || [])].sort(
    (a, b) => daysSince(a.updated_at) - daysSince(b.updated_at)
  ).reverse();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <NudgeBanner page="stale" />
      <div className="px-5 py-4 border-b border-[#2E3348] bg-[#1A1D27]">
        <h2 className="text-base font-semibold text-[#E8E9ED]">Stale Items</h2>
        <p className="text-xs text-[#5C6178] mt-0.5">
          Active items not updated in 5+ days (excludes Waiting and terminal states)
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="border-t border-[#2E3348]">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#8B8FA3]">No stale items found.</p>
            <p className="text-xs text-[#5C6178] mt-1">Everything has been updated recently.</p>
          </div>
        ) : (
          <div className="border-t border-[#2E3348]">
            {sorted.map((sub) => (
              <SubitemRow key={sub.id} subitem={sub} showClient showStale />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
