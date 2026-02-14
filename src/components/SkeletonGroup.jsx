import React from 'react';
import SkeletonRow from './SkeletonRow';

export default function SkeletonGroup({ rowCount = 5 }) {
  return (
    <div className="border border-[#2E3348] rounded-lg overflow-hidden mb-3 animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1A1D27]">
        <div className="w-4 h-4 bg-[#2E3348] rounded" />
        <div className="flex-1 h-4 bg-[#2E3348] rounded max-w-[200px]" />
        <div className="w-16 h-3 bg-[#2E3348] rounded" />
      </div>
      <div className="bg-[#0F1117]">
        {Array.from({ length: rowCount }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
