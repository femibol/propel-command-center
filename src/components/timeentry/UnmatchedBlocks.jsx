import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Monitor, Clock } from 'lucide-react';

export default function UnmatchedBlocks({ blocks, rows, onAssign }) {
  const [open, setOpen] = useState(false);

  if (!blocks || blocks.length === 0) return null;

  const totalMinutes = blocks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

  return (
    <div className="border border-yellow-500/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-500/10 hover:bg-yellow-500/15 transition-colors text-left"
      >
        <div className="text-yellow-400">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        <span className="text-sm font-semibold text-yellow-400 flex-1">
          Unmatched Activity ({blocks.length} blocks, {Math.round(totalMinutes)}min)
        </span>
        <span className="text-xs text-[#8B8FA3]">Click to assign to tasks</span>
      </button>

      {open && (
        <div className="bg-[#0F1117] divide-y divide-[#2E3348]/50">
          {blocks.map(block => (
            <div key={block.id} className="flex items-center gap-3 px-4 py-2.5">
              <Monitor size={14} className="text-[#5C6178] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#E8E9ED] truncate">{block.title || block.app}</p>
                <p className="text-xs text-[#5C6178]">
                  {block.app} · {block.category}
                  {block.url && ` · ${new URL(block.url).hostname}`}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#8B8FA3] shrink-0">
                <Clock size={12} />
                {Math.round(block.durationMinutes)}min
              </div>
              <select
                onChange={(e) => {
                  if (e.target.value) onAssign(block.id, e.target.value);
                  e.target.value = '';
                }}
                className="bg-[#1A1D27] border border-[#2E3348] rounded px-2 py-1 text-xs text-[#E8E9ED] focus:outline-none focus:border-accent shrink-0"
                defaultValue=""
              >
                <option value="">Assign to...</option>
                {rows.map(row => (
                  <option key={row.id} value={row.id}>
                    {row.clientShort} - {row.projectName}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
