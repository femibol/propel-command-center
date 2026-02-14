import React from 'react';
import { X, ExternalLink } from 'lucide-react';

const CONFIDENCE_COLORS = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-orange-500',
};

export default function TaskRowHeader({ row, onRemove }) {
  const confidence = row.sources?.[0]?.matchConfidence;

  return (
    <div className="flex items-center gap-2 min-w-0">
      {confidence && (
        <div
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${CONFIDENCE_COLORS[confidence] || 'bg-gray-500'}`}
          title={`Match confidence: ${confidence}`}
        />
      )}
      <span className="text-xs font-mono text-accent font-medium shrink-0">
        {row.clientShort}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#E8E9ED] truncate" title={row.projectName}>
          {row.projectName}
        </p>
        {row.parentName && (
          <p className="text-xs text-[#5C6178] truncate">{row.parentName}</p>
        )}
      </div>
      {row.isManual && (
        <button
          onClick={() => onRemove(row.id)}
          className="text-[#5C6178] hover:text-red-400 transition-colors shrink-0"
          title="Remove row"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
