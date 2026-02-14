import React from 'react';
import { STATUS_COLORS } from '../utils/constants';

export default function StatusBadge({ status, size = 'sm' }) {
  const colors = STATUS_COLORS[status] || {
    bg: 'bg-gray-500/20',
    text: 'text-gray-400',
    border: 'border-gray-500/40',
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`}
    >
      {status || 'Unknown'}
    </span>
  );
}
