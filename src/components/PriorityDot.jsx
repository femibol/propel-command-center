import React from 'react';
import { PRIORITY_COLORS } from '../utils/constants';

export default function PriorityDot({ priority }) {
  const colors = PRIORITY_COLORS[priority] || PRIORITY_COLORS['Low'];

  return (
    <div className="flex items-center gap-1.5" title={priority || 'No priority'}>
      <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
      <span className={`text-xs font-medium ${colors.text} uppercase tracking-wide`}>
        {priority || '—'}
      </span>
    </div>
  );
}
