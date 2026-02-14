import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const CATEGORY_COLORS = {
  'Browser': '#3B82F6',
  'AI/Research': '#A855F7',
  'Meetings': '#F97316',
  'Email': '#EAB308',
  'Data Work': '#22C55E',
  'Reports': '#06B6D4',
  'Development': '#EC4899',
  'Documentation': '#8B5CF6',
  'File Management': '#6B7280',
  'Other': '#6B7280',
};

export default function ActivityTimeline({ blocks, day }) {
  const [open, setOpen] = useState(false);

  if (!blocks || blocks.length === 0) return null;

  const dayBlocks = day
    ? blocks.filter(b => b.day === day)
    : blocks;

  if (dayBlocks.length === 0) return null;

  // Find time range
  const startHour = 7; // 7 AM
  const endHour = 20; // 8 PM
  const totalMinutes = (endHour - startHour) * 60;

  return (
    <div className="border border-[#2E3348] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#1A1D27] hover:bg-[#242836] transition-colors text-left"
      >
        <div className="text-[#5C6178]">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        <span className="text-sm font-semibold text-[#E8E9ED] flex-1">
          Activity Timeline {day && `— ${day}`}
        </span>
        <span className="text-xs text-[#8B8FA3]">{dayBlocks.length} blocks</span>
      </button>

      {open && (
        <div className="bg-[#0F1117] p-4">
          {/* Hour labels */}
          <div className="flex text-xs text-[#5C6178] font-mono mb-1">
            {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
              <div key={i} className="flex-1 text-left">
                {(startHour + i) % 12 || 12}{startHour + i < 12 ? 'a' : 'p'}
              </div>
            ))}
          </div>

          {/* Timeline bar */}
          <div className="relative h-8 bg-[#1A1D27] rounded overflow-hidden border border-[#2E3348]">
            {dayBlocks.map(block => {
              const blockStart = parseTimeToMinutes(block.startUtc || block.start);
              const startOffset = blockStart - startHour * 60;
              const left = Math.max(0, (startOffset / totalMinutes) * 100);
              const width = Math.max(0.5, (block.durationMinutes / totalMinutes) * 100);
              const color = CATEGORY_COLORS[block.category] || CATEGORY_COLORS.Other;

              return (
                <div
                  key={block.id}
                  className="absolute top-0 h-full opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{
                    left: `${left}%`,
                    width: `${Math.min(width, 100 - left)}%`,
                    backgroundColor: color,
                  }}
                  title={`${block.app}: ${block.title} (${Math.round(block.durationMinutes)}min)`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
              const catBlocks = dayBlocks.filter(b => b.category === cat);
              if (catBlocks.length === 0) return null;
              const mins = catBlocks.reduce((s, b) => s + b.durationMinutes, 0);
              return (
                <div key={cat} className="flex items-center gap-1.5 text-xs text-[#8B8FA3]">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                  <span>{cat}</span>
                  <span className="font-mono text-[#5C6178]">{Math.round(mins)}m</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  try {
    const d = new Date(timeStr.includes('T') ? timeStr : timeStr + 'Z');
    return d.getHours() * 60 + d.getMinutes();
  } catch {
    return 0;
  }
}
