import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import SubitemRow from './SubitemRow';

export default function ClientGroup({ clientName, items, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  const highCount = items.filter((s) => {
    const p = s.column_values?.find?.((c) => c.id === 'priority5')?.text ||
      s.column_values?.priority5 || '';
    return p === 'High' || p === 'System Down';
  }).length;

  return (
    <div className="border border-[#2E3348] rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#1A1D27] hover:bg-[#242836] transition-colors text-left"
      >
        <div className="text-[#5C6178]">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        <span className="text-sm font-semibold text-[#E8E9ED] flex-1">{clientName}</span>
        <span className="text-xs text-[#8B8FA3]">{items.length} items</span>
        {highCount > 0 && (
          <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/40 rounded-full px-2 py-0.5">
            {highCount} high
          </span>
        )}
      </button>

      {open && (
        <div className="bg-[#0F1117]">
          {items.map((sub) => (
            <SubitemRow key={sub.id} subitem={sub} showStale />
          ))}
        </div>
      )}
    </div>
  );
}
