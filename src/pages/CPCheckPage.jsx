import React from 'react';
import { useSweepData } from '../hooks/useBoards';
import SubitemRow from '../components/SubitemRow';

export default function CPCheckPage() {
  const { cpMissing, isLoading } = useSweepData();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-5 py-4 border-b border-[#2E3348] bg-[#1A1D27]">
        <h2 className="text-base font-semibold text-[#E8E9ED]">ChangePoint Reconciliation</h2>
        <p className="text-xs text-[#5C6178] mt-0.5">
          Completed items missing CP Project or CP Task values — needed for time entry mapping
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (cpMissing || []).length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#8B8FA3]">All completed items have ChangePoint mapping.</p>
            <p className="text-xs text-[#5C6178] mt-1">Nothing to reconcile.</p>
          </div>
        ) : (
          <div className="border-t border-[#2E3348]">
            {cpMissing.map((sub) => (
              <SubitemRow key={sub.id} subitem={sub} showClient />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
