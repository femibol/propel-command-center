import React from 'react';

function barColor(value) {
  if (value >= 90) return 'bg-green-500';
  if (value >= 70) return 'bg-emerald-500';
  if (value >= 40) return 'bg-blue-500';
  if (value >= 20) return 'bg-yellow-500';
  return 'bg-gray-500';
}

export default function ProgressBar({ value = 0, showLabel = true, size = 'sm' }) {
  const clamped = Math.min(100, Math.max(0, value));
  const h = size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2.5' : 'h-4';

  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex-1 ${h} bg-[#2E3348] rounded-full overflow-hidden`}>
        <div
          className={`${h} ${barColor(clamped)} rounded-full transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] font-mono text-[#8B8FA3] w-8 text-right shrink-0">
          {clamped}%
        </span>
      )}
    </div>
  );
}
