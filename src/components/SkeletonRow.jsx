import React from 'react';

export default function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#2E3348]/50 animate-pulse">
      <div className="w-4 h-4 bg-[#2E3348] rounded shrink-0" />
      <div className="w-20 shrink-0 flex items-center gap-1.5">
        <div className="w-2 h-2 bg-[#2E3348] rounded-full" />
        <div className="w-12 h-3 bg-[#2E3348] rounded" />
      </div>
      <div className="flex-1 h-4 bg-[#2E3348] rounded max-w-md" />
      <div className="w-16 h-3 bg-[#2E3348] rounded shrink-0" />
      <div className="w-24 h-5 bg-[#2E3348] rounded-full shrink-0" />
      <div className="w-4 h-4 bg-[#2E3348] rounded shrink-0" />
    </div>
  );
}
