import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function getWeekDates(offset = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }

  const friday = new Date(days[4]);
  friday.setHours(23, 59, 59, 999);

  return { monday, friday, days };
}

export function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

function formatWeekHeader(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function WeekNavigator({ weekOffset, onWeekChange }) {
  const { monday, friday } = getWeekDates(weekOffset);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onWeekChange(weekOffset - 1)}
        className="p-1 hover:bg-[#242836] rounded transition-colors text-[#8B8FA3]"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-[#E8E9ED] font-mono min-w-[160px] text-center">
        {formatWeekHeader(monday)} – {formatWeekHeader(friday)}
      </span>
      <button
        onClick={() => onWeekChange(weekOffset + 1)}
        className="p-1 hover:bg-[#242836] rounded transition-colors text-[#8B8FA3]"
      >
        <ChevronRight size={16} />
      </button>
      {weekOffset !== 0 && (
        <button
          onClick={() => onWeekChange(0)}
          className="text-xs text-accent hover:underline ml-2"
        >
          This week
        </button>
      )}
    </div>
  );
}
